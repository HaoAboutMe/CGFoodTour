package com.j2ee.buildpcchecker.repository;

import com.j2ee.buildpcchecker.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, String>
{
    Optional<VerificationToken> findByToken(String token);
    Optional<VerificationToken> findByUserId(String userId);
    void deleteByUserId(String userId);
}

