package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.StoreAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreAuditLogRepository extends JpaRepository<StoreAuditLog, Long> {
    List<StoreAuditLog> findByStoreIdOrderByCreatedAtDesc(String storeId);
    void deleteByStoreId(String storeId);
}
