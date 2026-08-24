package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.VerificationToken;
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

