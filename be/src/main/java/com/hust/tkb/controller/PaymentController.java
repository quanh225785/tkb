package com.hust.tkb.controller;

import com.hust.tkb.dto.ApiResponse;
import com.hust.tkb.dto.CreatePaymentRequest;
import com.hust.tkb.dto.PaymentResponse;
import com.hust.tkb.model.Payment;
import com.hust.tkb.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PayOS payOS;

    /**
     * Tạo link thanh toán
     * POST /api/payment/create
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @RequestBody CreatePaymentRequest request) {
        try {
            PaymentResponse response = paymentService.createPayment(request);
            return ResponseEntity.ok(ApiResponse.ok("Tạo link thanh toán thành công", response));
        } catch (Exception e) {
            log.error("Error creating payment", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi tạo thanh toán: " + e.getMessage()));
        }
    }

    /**
     * Lấy thông tin thanh toán
     * GET /api/payment/{orderCode}
     */
    @GetMapping("/{orderCode}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentInfo(
            @PathVariable long orderCode) {
        try {
            PaymentResponse response = paymentService.getPaymentInfo(orderCode);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (Exception e) {
            log.error("Error getting payment info", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Huỷ thanh toán
     * POST /api/payment/{orderCode}/cancel
     */
    @PostMapping("/{orderCode}/cancel")
    public ResponseEntity<ApiResponse<PaymentResponse>> cancelPayment(
            @PathVariable long orderCode,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.getOrDefault("reason", "Người dùng huỷ") : "Người dùng huỷ";
            PaymentResponse response = paymentService.cancelPayment(orderCode, reason);
            return ResponseEntity.ok(ApiResponse.ok("Đã huỷ thanh toán", response));
        } catch (Exception e) {
            log.error("Error cancelling payment", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi huỷ: " + e.getMessage()));
        }
    }

    /**
     * Webhook nhận kết quả thanh toán từ PayOS
     * POST /api/payment/webhook
     *
     * PayOS gửi POST request với body chứa:
     * - code: "00" = thành công
     * - success: true/false
     * - data: { orderCode, amount, description, ... }
     * - signature: chữ ký HMAC để verify
     *
     * SDK tự verify checksum bằng checksumKey đã config
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody Webhook webhookBody) {
        try {
            log.info("Received PayOS webhook for verification");

            // ✅ Verify chữ ký webhook bằng PayOS SDK
            // SDK sẽ throw exception nếu checksum không hợp lệ
            WebhookData verifiedData = payOS.webhooks().verify(webhookBody);

            long orderCode = verifiedData.getOrderCode();
            String description = verifiedData.getDescription();
            String reference = String.valueOf(verifiedData.getReference());

            log.info("Webhook verified: orderCode={}, desc={}", orderCode, description);

            // Xử lý kết quả: code "00" = thanh toán thành công
            String code = webhookBody.getCode();
            boolean success = webhookBody.isSuccess();

            if ("00".equals(code) && success) {
                paymentService.handleWebhook(String.valueOf(orderCode), "PAID", reference);
                log.info("Payment PAID: orderCode={}", orderCode);
            } else {
                // Thanh toán thất bại hoặc bị huỷ
                paymentService.handleWebhook(String.valueOf(orderCode), "CANCELLED", reference);
                log.info("Payment CANCELLED: orderCode={}, code={}", orderCode, code);
            }

            // PayOS yêu cầu trả về 2XX
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Webhook verification failed: {}", e.getMessage());
            // Vẫn trả 200 để PayOS không retry liên tục, nhưng log lỗi
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Confirm webhook URL với PayOS (gọi 1 lần khi setup)
     * POST /api/payment/webhook/confirm
     */
    @PostMapping("/webhook/confirm")
    public ResponseEntity<ApiResponse<String>> confirmWebhook(@RequestBody Map<String, String> body) {
        try {
            String webhookUrl = body.get("webhookUrl");
            if (webhookUrl == null || webhookUrl.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("webhookUrl is required"));
            }
            payOS.webhooks().confirm(webhookUrl);
            log.info("Webhook URL confirmed: {}", webhookUrl);
            return ResponseEntity.ok(ApiResponse.ok("Đã confirm webhook URL", webhookUrl));
        } catch (Exception e) {
            log.error("Error confirming webhook", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi confirm webhook: " + e.getMessage()));
        }
    }

    /**
     * Lịch sử thanh toán
     * GET /api/payment/history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Payment>>> getHistory() {
        List<Payment> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }
}
