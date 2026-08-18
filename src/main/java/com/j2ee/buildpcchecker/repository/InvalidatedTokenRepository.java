package com.j2ee.buildpcchecker.repository;

import com.j2ee.buildpcchecker.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String>
{
}
