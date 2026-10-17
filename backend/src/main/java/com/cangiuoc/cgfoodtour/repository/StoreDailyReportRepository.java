package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.StoreDailyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface StoreDailyReportRepository extends JpaRepository<StoreDailyReport, Long> {
    Optional<StoreDailyReport> findByUserIdAndStoreIdAndReportDate(String userId, String storeId, LocalDate reportDate);
    long countByStoreIdAndReportDate(String storeId, LocalDate reportDate);
    void deleteByStoreId(String storeId);
    void deleteByUserId(String userId);

    interface StoreReportCount {
        String getStoreId();
        long getReportCount();
    }

    @Query("""
            select r.store.id as storeId, count(r) as reportCount
            from StoreDailyReport r
            where r.store.id in :storeIds and r.reportDate = :reportDate
            group by r.store.id
            """)
    List<StoreReportCount> countForStores(@Param("storeIds") Collection<String> storeIds,
                                          @Param("reportDate") LocalDate reportDate);
}
