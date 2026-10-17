package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.UserDeletionAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserDeletionAuditRepository extends JpaRepository<UserDeletionAudit, Long> {
    @Modifying
    @Query("update UserDeletionAudit a set a.actorId = null, a.actorEmail = null where a.actorId = :actorId")
    int anonymizeActor(@Param("actorId") String actorId);
}
