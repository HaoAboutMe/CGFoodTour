package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.StoreAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface StoreAuditLogRepository extends JpaRepository<StoreAuditLog, Long> {
    List<StoreAuditLog> findByStoreIdOrderByCreatedAtDesc(String storeId);
    void deleteByStoreId(String storeId);

    @Modifying
    @Query("update StoreAuditLog log set log.actorId = null, log.actorEmail = null where log.actorId = :actorId")
    int anonymizeActor(@Param("actorId") String actorId);
}
