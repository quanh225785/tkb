package com.hust.tkb.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreatePaymentRequest {
    /** Mô tả đơn hàng */
    private String description;

    /** Số tiền (VND) */
    private Integer amount;

    /** Tên người mua (tuỳ chọn) */
    private String buyerName;

    /** Email người mua (tuỳ chọn) */
    private String buyerEmail;

    /** SĐT người mua (tuỳ chọn) */
    private String buyerPhone;

    /** ID của TKB liên kết (tuỳ chọn) */
    private Long timetableId;
}
