package com.hust.tkb.service;

import com.hust.tkb.dto.CreatePaymentRequest;
import com.hust.tkb.dto.PaymentResponse;
import com.hust.tkb.model.Payment;
import com.hust.tkb.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PayOS payOS;
    private final PaymentRepository paymentRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Tạo link thanh toán PayOS
     */
    public PaymentResponse createPayment(CreatePaymentRequest request) throws Exception {
        // Tạo orderCode unique (dùng timestamp)
        long orderCode = System.currentTimeMillis() / 1000;

        // Đảm bảo orderCode không trùng
        while (paymentRepository.findByOrderCode(orderCode).isPresent()) {
            orderCode++;
        }

        String description = request.getDescription() != null
                ? request.getDescription()
                : "TKB HUST";

        // Giới hạn description 9 ký tự cho bank không liên kết PayOS
        if (description.length() > 9) {
            description = description.substring(0, 9);
        }

        int amount = request.getAmount() != null ? request.getAmount() : 10000;

        // Validate minimum amount
        if (amount < 2000) {
            throw new IllegalArgumentException("Số tiền tối thiểu là 2.000 VNĐ");
        }

        // Build item
        PaymentLinkItem item = PaymentLinkItem.builder()
                .name("Donate TKB Planner")
                .quantity(1)
                .price((long) amount)
                .build();

        // Build payment link request
        CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount((long) amount)
                .description(description)
                .returnUrl(frontendUrl + "/?payment=success")
                .cancelUrl(frontendUrl + "/?payment=cancel")
                .item(item)
                .build();

        // Gọi PayOS API
        CreatePaymentLinkResponse result = payOS.paymentRequests().create(paymentRequest);

        // Lưu vào DB
        Payment payment = Payment.builder()
                .orderCode(orderCode)
                .paymentLinkId(result.getPaymentLinkId())
                .amount(amount)
                .description(description)
                .buyerName(request.getBuyerName())
                .buyerEmail(request.getBuyerEmail())
                .buyerPhone(request.getBuyerPhone())
                .status("PENDING")
                .checkoutUrl(result.getCheckoutUrl())
                .qrCode(result.getQrCode())
                .timetableId(request.getTimetableId())
                .build();

        paymentRepository.save(payment);

        log.info("Created payment: orderCode={}, amount={}, checkoutUrl={}",
                orderCode, amount, result.getCheckoutUrl());

        return PaymentResponse.builder()
                .orderCode(orderCode)
                .checkoutUrl(result.getCheckoutUrl())
                .qrCode(result.getQrCode())
                .status("PENDING")
                .amount(amount)
                .description(description)
                .build();
    }

    /**
     * Lấy thông tin thanh toán từ PayOS theo orderCode
     */
    public PaymentResponse getPaymentInfo(long orderCode) throws Exception {
        PaymentLink info = payOS.paymentRequests().get(orderCode);

        // Cập nhật trạng thái trong DB
        Optional<Payment> opt = paymentRepository.findByOrderCode(orderCode);
        if (opt.isPresent()) {
            Payment payment = opt.get();
            String status = info.getStatus() != null ? info.getStatus().name() : "PENDING";
            payment.setStatus(status);
            if ("PAID".equals(status) && payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }
            paymentRepository.save(payment);
        }

        String status = info.getStatus() != null ? info.getStatus().name() : "PENDING";

        return PaymentResponse.builder()
                .orderCode(orderCode)
                .status(status)
                .amount(info.getAmount() != null ? info.getAmount().intValue() : 0)
                .description(opt.map(Payment::getDescription).orElse(""))
                .build();
    }

    /**
     * Huỷ link thanh toán
     */
    public PaymentResponse cancelPayment(long orderCode, String reason) throws Exception {
        payOS.paymentRequests().cancel(orderCode, reason);

        Optional<Payment> opt = paymentRepository.findByOrderCode(orderCode);
        if (opt.isPresent()) {
            Payment payment = opt.get();
            payment.setStatus("CANCELLED");
            paymentRepository.save(payment);
        }

        return PaymentResponse.builder()
                .orderCode(orderCode)
                .status("CANCELLED")
                .build();
    }

    /**
     * Xử lý webhook từ PayOS
     */
    public void handleWebhook(String orderCodeStr, String status, String transactionReference) {
        try {
            long orderCode = Long.parseLong(orderCodeStr);
            Optional<Payment> opt = paymentRepository.findByOrderCode(orderCode);
            if (opt.isPresent()) {
                Payment payment = opt.get();
                payment.setStatus(status);
                payment.setTransactionReference(transactionReference);
                if ("PAID".equals(status)) {
                    payment.setPaidAt(LocalDateTime.now());
                }
                paymentRepository.save(payment);
                log.info("Webhook: orderCode={}, status={}", orderCode, status);
            }
        } catch (Exception e) {
            log.error("Webhook processing error", e);
        }
    }

    /**
     * Lấy tất cả thanh toán
     */
    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Lấy thanh toán theo orderCode
     */
    public Optional<Payment> findByOrderCode(long orderCode) {
        return paymentRepository.findByOrderCode(orderCode);
    }
}
