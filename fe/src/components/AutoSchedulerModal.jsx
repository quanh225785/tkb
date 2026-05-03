import React, { useState, useEffect } from 'react';
import { generateSchedules } from '../utils/autoScheduler';

export default function AutoSchedulerModal({
  mySubjects,
  currentSelected,
  onApply,
  onClose
}) {
  const [daysOff, setDaysOff] = useState([]);
  const [results, setResults] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);

  // Map các lớp đang chọn làm lớp "Ghim"
  const pinnedClasses = {};
  Object.values(currentSelected).forEach(cls => {
    pinnedClasses[cls.maHP] = cls.id;
  });

  const toggleDayOff = (day) => {
    setDaysOff(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = () => {
    const schedules = generateSchedules(mySubjects, { daysOff, pinnedClasses });
    setResults(schedules);
    setHasGenerated(true);
    setViewIndex(0);
  };

  const handleApply = () => {
    if (results.length > 0 && results[viewIndex]) {
      onApply(results[viewIndex].schedule);
      onClose();
    }
  };

  return (
    <div className="payment-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="payment-modal auto-scheduler-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-header">
          <div className="payment-header-icon">🤖</div>
          <div>
            <h2 className="payment-title">Tự động xếp lịch</h2>
            <p className="payment-subtitle">Tìm các tổ hợp môn không trùng giờ</p>
          </div>
          <button className="payment-close" onClick={onClose}>✕</button>
        </div>

        <div className="as-body">
          {!hasGenerated ? (
            <div className="as-setup">
              <div className="as-section">
                <h3>Các lớp đã Ghim (Giữ nguyên)</h3>
                {Object.keys(pinnedClasses).length === 0 ? (
                  <p className="as-hint">Bạn chưa chọn môn nào ở Bước 2. Thuật toán sẽ tự chọn tất cả.</p>
                ) : (
                  <p className="as-hint">Hệ thống sẽ ép buộc xếp lịch xoay quanh {Object.keys(pinnedClasses).length} môn bạn đã chọn ngoài kia.</p>
                )}
              </div>

              <div className="as-section">
                <h3>Chọn ngày muốn nghỉ (Nếu có thể)</h3>
                <div className="as-days-picker">
                  {[2, 3, 4, 5, 6, 7].map(day => (
                    <button
                      key={day}
                      className={`as-day-btn ${daysOff.includes(day) ? 'active' : ''}`}
                      onClick={() => toggleDayOff(day)}
                    >
                      T{day}
                    </button>
                  ))}
                </div>
                <p className="as-hint" style={{ marginTop: '8px' }}>Lưu ý: Nếu chọn quá nhiều ngày nghỉ, hệ thống có thể không tìm ra cách xếp nào.</p>
              </div>

              <button className="payment-btn primary" onClick={handleGenerate} style={{ marginTop: '20px' }}>
                🚀 Bắt đầu tạo lịch
              </button>
            </div>
          ) : (
            <div className="as-results">
              {results.length === 0 ? (
                <div className="as-empty">
                  <h3>Không tìm thấy cách xếp nào! 😢</h3>
                  <p>Vui lòng nới lỏng điều kiện (bớt ngày nghỉ) hoặc huỷ ghim một số lớp.</p>
                  <button className="payment-btn secondary" onClick={() => setHasGenerated(false)}>
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="as-carousel">
                  <h3 className="as-result-count">
                    Tìm thấy <span className="highlight">{results.length}</span> cách xếp hợp lệ
                  </h3>
                  
                  <div className="as-preview-card">
                    <div className="as-preview-header">
                      <button 
                        className="as-nav-btn" 
                        disabled={viewIndex === 0} 
                        onClick={() => setViewIndex(prev => prev - 1)}
                      >
                        ◀
                      </button>
                      <div className="as-preview-meta">
                        <strong>Cách #{viewIndex + 1}</strong>
                        <span className="as-score-badge">Điểm: {results[viewIndex].score}</span>
                      </div>
                      <button 
                        className="as-nav-btn" 
                        disabled={viewIndex === results.length - 1} 
                        onClick={() => setViewIndex(prev => prev + 1)}
                      >
                        ▶
                      </button>
                    </div>

                    <div className="as-preview-stats">
                      <span>🎒 Số ngày đi học: {results[viewIndex].daysWithClasses} ngày</span>
                      <span>⏱️ Số giờ vạ vật (thủng giờ): {results[viewIndex].gapPeriods} kíp</span>
                    </div>

                    <div className="as-preview-list">
                      {results[viewIndex].schedule.map(cls => (
                        <div key={cls.id} className="as-preview-item">
                          <span className="code">{cls.maHP} - {cls.maLop}</span>
                          <span className="name">{cls.tenHP}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="as-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="payment-btn secondary" onClick={() => setHasGenerated(false)}>
                      Quay lại cấu hình
                    </button>
                    <button className="payment-btn primary" onClick={handleApply}>
                      ✨ Áp dụng cách này
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
