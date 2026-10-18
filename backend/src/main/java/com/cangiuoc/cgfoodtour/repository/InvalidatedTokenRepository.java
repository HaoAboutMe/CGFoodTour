package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.Date;
import java.util.List;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String>
{
    List<InvalidatedToken> findByExpiryTimeBeforeOrderByExpiryTimeAsc(Date cutoff, Pageable pageable);
}
