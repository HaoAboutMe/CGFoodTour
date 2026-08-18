package com.j2ee.buildpcchecker.repository;

import com.j2ee.buildpcchecker.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, String> {

    // Tìm OTP hợp lệ: đúng email, đúng mã, chưa dùng, chưa hết hạn
    Optional<PasswordResetOtp> findByEmailAndOtpAndIsUsedFalseAndExpiryDateAfter(
            String email, String otp, LocalDateTime now);

    // Xóa toàn bộ OTP cũ của email (trước khi tạo OTP mới)
    void deleteAllByEmail(String email);
}
