package com.hust.tkb.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long orderCode;
    private String checkoutUrl;
    private String qrCode;
    private String status;
    private Integer amount;
    private String description;
}
