package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.UserSavedStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSavedStoreRepository extends JpaRepository<UserSavedStore, String> {
    boolean existsByUserIdAndStoreId(String userId, String storeId);

    Optional<UserSavedStore> findByUserIdAndStoreId(String userId, String storeId);

    List<UserSavedStore> findByUserIdOrderBySavedAtDesc(String userId);

    void deleteByStoreId(String storeId);

    void deleteByUserIdAndStoreId(String userId, String storeId);

    int countByStoreId(String storeId);
}
