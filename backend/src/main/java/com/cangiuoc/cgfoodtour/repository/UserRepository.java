package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>
{
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") String id);
    @Query("select count(distinct u) from User u join u.roles r where u.enabled = true and r.name = 'ADMIN'")
    long countActiveAdmins();
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByFacebookId(String facebookId);
}
