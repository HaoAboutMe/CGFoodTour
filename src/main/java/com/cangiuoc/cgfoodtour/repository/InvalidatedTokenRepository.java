package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String>
{
}
