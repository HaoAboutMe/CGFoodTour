package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.UserSavedStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserSavedStoreRepository extends JpaRepository<UserSavedStore, String> {
    boolean existsByUserIdAndStoreId(String userId, String storeId);

    Optional<UserSavedStore> findByUserIdAndStoreId(String userId, String storeId);

    List<UserSavedStore> findByUserIdOrderBySavedAtDesc(String userId);
    List<UserSavedStore> findByUserId(String userId);

    void deleteByStoreId(String storeId);

    void deleteByUserIdAndStoreId(String userId, String storeId);
    void deleteByUserId(String userId);

    int countByStoreId(String storeId);

    @Query("select uss.store.id from UserSavedStore uss where uss.user.id = :userId and uss.store.id in :storeIds")
    List<String> findSavedStoreIds(@Param("userId") String userId,
                                   @Param("storeIds") Collection<String> storeIds);

    @Query("""
            select uss from UserSavedStore uss join uss.store s join s.owner o
            where uss.user.id = :userId and s.status = com.cangiuoc.cgfoodtour.enums.StoreStatus.APPROVED
              and o.enabled = true
            """)
    Page<UserSavedStore> findPublicSavedStores(@Param("userId") String userId, Pageable pageable);
}
