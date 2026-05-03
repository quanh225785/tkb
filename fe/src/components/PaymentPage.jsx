import React, { useState, useCallback, useEffect } from 'react';
import { createPayment, getPaymentStatus } from '../services/api';

const HISTORY_KEY = 'tkb:donate_history';

/**
 * Component Donate - thanh toán tùy chọn số tiền qua PayOS
 * Người dùng có thể nhập số tiền bất kỳ (tối thiểu 2.000 VNĐ)
 */

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];
const MIN_AMOUNT = 2000;

export default function PaymentPage({ onClose, onSuccess, addNotif }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'checkout' | 'result'
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('donate'); // 'donate' | 'history'
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    buyerName: '',
    buyerPhone: '',
    amount: 10000,
    description: 'Donate TKB',
    customAmount: '',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuickAmount = (amt) => {
    setForm(prev => ({ ...prev, amount: amt, customAmount: '' }));
  };

  const handleCustomAmount = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    setForm(prev => ({ ...prev, customAmount: raw, amount: num }));
  };

  const currentAmount = form.amount;
  const isValidAmount = currentAmount >= MIN_AMOUNT;

  const handleCreatePayment = useCallback(async () => {
    if (!isValidAmount) {
      addNotif?.(`Số tiền tối thiểu là ${MIN_AMOUNT.toLocaleString('vi-VN')} VNĐ`, 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await createPayment({
        amount: currentAmount,
        description: form.description.substring(0, 9), // PayOS giới hạn 9 ký tự
        buyerName: form.buyerName || undefined,
        buyerPhone: form.buyerPhone || undefined,
      });

      setPaymentData(result);
      setStep('checkout');

      // Lưu lịch sử local
      const newRecord = {
        orderCode: result.orderCode,
        amount: currentAmount,
        date: new Date().toISOString(),
        status: 'PENDING'
      };
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      // Mở trang thanh toán PayOS trong tab mới
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (err) {
      addNotif?.('Lỗi tạo thanh toán: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [form, currentAmount, isValidAmount, addNotif]);

  const handleCheckStatus = useCallback(async () => {
    if (!paymentData?.orderCode) return;
    setChecking(true);
    try {
      const result = await getPaymentStatus(paymentData.orderCode);
      setPaymentData(prev => ({ ...prev, status: result.status }));

      if (result.status === 'PAID') {
        setStep('result');
        addNotif?.('🎉 Cảm ơn bạn đã donate!', 'success', 5000);
        onSuccess?.();
        return 'done';
      } else if (result.status === 'CANCELLED') {
        setStep('result');
        addNotif?.('Đơn hàng đã bị huỷ', 'warning');
        return 'done';
      }
      return 'pending';
    } catch (err) {
      addNotif?.('Lỗi kiểm tra: ' + err.message, 'error');
      return 'error';
    } finally {
      setChecking(false);
    }
  }, [paymentData, addNotif, onSuccess]);

  // ✅ Auto-poll trạng thái thanh toán mỗi 3 giây khi ở bước checkout
  useEffect(() => {
    if (step !== 'checkout' || !paymentData?.orderCode) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await getPaymentStatus(paymentData.orderCode);
        setPaymentData(prev => ({ ...prev, status: result.status }));

        if (result.status === 'PAID') {
          clearInterval(pollInterval);
          setStep('result');
          addNotif?.('🎉 Cảm ơn bạn đã donate!', 'success', 5000);
          updateHistoryStatus(paymentData.orderCode, 'PAID');
          onSuccess?.();
        } else if (result.status === 'CANCELLED') {
          clearInterval(pollInterval);
          setStep('result');
          updateHistoryStatus(paymentData.orderCode, 'CANCELLED');
          addNotif?.('Đơn hàng đã bị huỷ', 'warning');
        }
      } catch {
        // Silently ignore poll errors
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [step, paymentData?.orderCode, addNotif, onSuccess]);

  const updateHistoryStatus = (orderCode, status) => {
    setHistory(prev => {
      const next = prev.map(item => item.orderCode === orderCode ? { ...item, status } : item);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refreshHistoryStatus = async (orderCode) => {
    try {
      const result = await getPaymentStatus(orderCode);
      if (result && result.status) {
        updateHistoryStatus(orderCode, result.status);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-header">
          <div className="payment-header-icon">☕</div>
          <div>
            <h2 className="payment-title">Ủng hộ dự án</h2>
            <div className="payment-tabs">
              <button 
                className={`tab-btn ${activeTab === 'donate' ? 'active' : ''}`}
                onClick={() => setActiveTab('donate')}
              >
                Donate
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Lịch sử
              </button>
            </div>
          </div>
          <button className="payment-close" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div className="payment-steps">
          <div className={`payment-step ${step === 'form' ? 'active' : step !== 'form' ? 'done' : ''}`}>
            <span className="payment-step-num">1</span>
            <span>Số tiền</span>
          </div>
          <div className="payment-step-arrow">→</div>
          <div className={`payment-step ${step === 'checkout' ? 'active' : step === 'result' ? 'done' : ''}`}>
            <span className="payment-step-num">2</span>
            <span>Thanh toán</span>
          </div>
          <div className="payment-step-arrow">→</div>
          <div className={`payment-step ${step === 'result' ? 'active' : ''}`}>
            <span className="payment-step-num">3</span>
            <span>Hoàn tất</span>
          </div>
        </div>

        {activeTab === 'history' ? (
          <div className="payment-history-list">
            {history.length === 0 ? (
              <p className="history-empty">Bạn chưa có lịch sử donate nào.</p>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-item-left">
                    <div className="history-amount">{Number(item.amount).toLocaleString('vi-VN')} VNĐ</div>
                    <div className="history-date">{new Date(item.date).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="history-item-right">
                    <span className={`checkout-status status-${item.status?.toLowerCase()}`}>
                      {item.status === 'PENDING' ? '⏳ Chờ thanh toán' :
                       item.status === 'PAID' ? '✅ Đã thanh toán' :
                       item.status === 'CANCELLED' ? '❌ Đã huỷ' : item.status}
                    </span>
                    {item.status === 'PENDING' && (
                      <button className="refresh-status-btn" onClick={() => refreshHistoryStatus(item.orderCode)}>
                        ↻
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
        {/* Form Step */}
        {step === 'form' && (
          <div className="payment-form">
            {/* Donate card */}
            <div className="donate-card">
              <div className="donate-emoji">
                <img 
                  src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGFlMWJ0ODdqb2E3dmZ1cnJpdmViaGdpdzBoemNsZmQzcTJjN2d4bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ot8YXQCZHmn2IyEOta/giphy.webp" 
                  alt="Cute cat typing" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <p className="donate-message">
                Nếu bạn thấy TKB Planner hữu ích, hãy ủng hộ mình để duy trì và phát triển dự án nhé!
              </p>

              {/* Quick amount buttons */}
              <div className="donate-quick-amounts">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    className={`donate-quick-btn ${currentAmount === amt && !form.customAmount ? 'active' : ''}`}
                    onClick={() => handleQuickAmount(amt)}
                  >
                    {amt.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="donate-custom-amount">
                <label>Hoặc nhập số tiền tuỳ ý:</label>
                <div className="donate-input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.customAmount}
                    onChange={handleCustomAmount}
                    placeholder="Nhập số tiền..."
                    className="donate-amount-input"
                  />
                  <span className="donate-currency">VNĐ</span>
                </div>
                {form.customAmount && !isValidAmount && (
                  <span className="donate-min-warning">
                    ⚠ Tối thiểu {MIN_AMOUNT.toLocaleString('vi-VN')} VNĐ
                  </span>
                )}
              </div>

              {/* Display selected amount */}
              <div className="donate-total">
                <span>Bạn sẽ donate:</span>
                <span className="donate-total-amount">
                  {currentAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            <div className="payment-field">
              <label>Tên của bạn (tuỳ chọn)</label>
              <input
                name="buyerName"
                value={form.buyerName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="payment-field">
              <label>Lời nhắn (tuỳ chọn)</label>
              <input
                name="buyerPhone"
                value={form.buyerPhone}
                onChange={handleChange}
                placeholder="Cảm ơn bạn!"
              />
            </div>

            <button
              className="payment-btn primary"
              onClick={handleCreatePayment}
              disabled={loading || !isValidAmount}
            >
              {loading ? '⏳ Đang tạo...' : `☕ Donate ${currentAmount.toLocaleString('vi-VN')}đ`}
            </button>
          </div>
        )}

        {/* Checkout Step */}
        {step === 'checkout' && paymentData && (
          <div className="payment-checkout">
            <div className="checkout-info">
              <div className="checkout-icon">📱</div>
              <h3>Quét mã QR để thanh toán</h3>
              <p>Mở ứng dụng ngân hàng và quét mã VietQR bên dưới</p>
            </div>

            {paymentData.qrCode && (
              <div className="qr-container">
                <img
                  src={`https://img.vietqr.io/image/qr/${paymentData.qrCode}.png`}
                  alt="QR Code thanh toán"
                  className="qr-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="checkout-details">
              <div className="checkout-detail-row">
                <span>Mã đơn:</span>
                <span className="checkout-detail-value">{paymentData.orderCode}</span>
              </div>
              <div className="checkout-detail-row">
                <span>Số tiền:</span>
                <span className="checkout-detail-value checkout-amount">
                  {Number(paymentData.amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="checkout-detail-row">
                <span>Trạng thái:</span>
                <span className={`checkout-status status-${paymentData.status?.toLowerCase()}`}>
                  {paymentData.status === 'PENDING' ? '⏳ Chờ thanh toán' :
                   paymentData.status === 'PAID' ? '✅ Đã thanh toán' :
                   paymentData.status === 'CANCELLED' ? '❌ Đã huỷ' : paymentData.status}
                </span>
              </div>
            </div>

            <div className="checkout-actions">
              {paymentData.checkoutUrl && (
                <a
                  href={paymentData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payment-btn primary"
                >
                  🔗 Mở trang thanh toán PayOS
                </a>
              )}
              <button
                className="payment-btn secondary"
                onClick={handleCheckStatus}
                disabled={checking}
              >
                {checking ? '⏳ Đang kiểm tra...' : '🔄 Kiểm tra trạng thái'}
              </button>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && (
          <ResultStep
            status={paymentData?.status}
            onClose={onClose}
          />
        )}
        </>
        )}
      </div>
    </div>
  );
}

/**
 * ResultStep - hiển thị kết quả donate với GIF cảm ơn + auto-close
 */
function ResultStep({ status, onClose }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== 'PAID') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onClose]);

  if (status === 'PAID') {
    return (
      <div className="payment-result">
        <img
          className="result-gif"
          src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGFlMWJ0ODdqb2E3dmZ1cnJpdmViaGdpdzBoemNsZmQzcTJjN2d4bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ot8YXQCZHmn2IyEOta/giphy.webp"
          alt="Thank you!"
          loading="eager"
        />
        <h3>Cảm ơn bạn rất nhiều! 💛</h3>
        <p>
          Sự ủng hộ của bạn giúp mình có thêm động lực phát triển TKB Planner.
          Chúc bạn học tốt nhé!
        </p>
        <button className="payment-btn primary" onClick={onClose}>
          ☕ Quay lại ({countdown}s)
        </button>
      </div>
    );
  }

  return (
    <div className="payment-result">
      <div className="result-icon cancelled">😕</div>
      <h3>Đơn hàng đã huỷ</h3>
      <p>Không sao cả! Bạn có thể donate bất cứ lúc nào.</p>
      <button className="payment-btn primary" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
