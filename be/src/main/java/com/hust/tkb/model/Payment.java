package com.hust.tkb.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** orderCode dùng cho PayOS (unique, int64) */
    @Column(nullable = false, unique = true)
    private Long orderCode;

    /** ID link thanh toán trả về từ PayOS */
    private String paymentLinkId;

    /** Số tiền (VND) */
    @Column(nullable = false)
    private Integer amount;

    /** Mô tả đơn hàng */
    private String description;

    /** Tên người mua */
    private String buyerName;

    /** Email người mua */
    private String buyerEmail;

    /** Số điện thoại người mua */
    private String buyerPhone;

    /** PENDING, PAID, CANCELLED */
    @Column(nullable = false, length = 20)
    private String status;

    /** URL checkout từ PayOS */
    @Column(length = 500)
    private String checkoutUrl;

    /** QR code string từ PayOS */
    @Column(columnDefinition = "TEXT")
    private String qrCode;

    /** Tham chiếu giao dịch ngân hàng */
    private String transactionReference;

    /** Liên kết tới TKB nếu cần */
    private Long timetableId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
