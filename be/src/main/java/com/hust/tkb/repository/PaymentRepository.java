package com.hust.tkb.repository;

import com.hust.tkb.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderCode(Long orderCode);
    Optional<Payment> findByPaymentLinkId(String paymentLinkId);
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByStatus(String status);
}
