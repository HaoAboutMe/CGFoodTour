package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.StoreDailyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface StoreDailyReportRepository extends JpaRepository<StoreDailyReport, Long> {
    Optional<StoreDailyReport> findByUserIdAndStoreIdAndReportDate(String userId, String storeId, LocalDate reportDate);
    long countByStoreIdAndReportDate(String storeId, LocalDate reportDate);
    void deleteByStoreId(String storeId);
}
