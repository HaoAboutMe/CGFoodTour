package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.PasswordResetOtp;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetOtp> findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    long countByEmailAndCreatedAtAfter(String email, LocalDateTime since);
    void deleteByEmail(String email);

    @Query("select o from PasswordResetOtp o where o.expiryDate < :now or (o.isUsed = true and o.createdAt < :usedBefore)")
    List<PasswordResetOtp> findCleanupCandidates(@Param("now") LocalDateTime now,
                                                  @Param("usedBefore") LocalDateTime usedBefore,
                                                  Pageable pageable);
}
