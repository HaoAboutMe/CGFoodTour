package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    long countByRegistrationIpHashAndEmailVerifiedFalseAndEnabledFalseAndPendingVerificationExpiresAtAfter(
            String registrationIpHash, LocalDateTime now);
    List<User> findTop100ByEmailVerifiedFalseAndEnabledFalseAndDisabledAtIsNullAndPendingVerificationExpiresAtBeforeOrderByPendingVerificationExpiresAtAsc(
            LocalDateTime now);

    @Query("""
            select distinct u from User u left join u.roles r
            where (:query is null or lower(u.email) like lower(concat('%', :query, '%'))
                or lower(u.username) like lower(concat('%', :query, '%')))
              and (:enabled is null or u.enabled = :enabled)
              and (:role is null or r.name = :role)
            """)
    Page<User> searchAdminUsers(@Param("query") String query, @Param("enabled") Boolean enabled,
                                @Param("role") String role, Pageable pageable);
}
