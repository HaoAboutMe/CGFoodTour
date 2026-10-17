package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, String> {
    List<Store> findByCategoryId(Integer categoryId);
    List<Store> findByStatus(StoreStatus status);
    List<Store> findByCategoryIdAndStatus(Integer categoryId, StoreStatus status);
    List<Store> findByOwnerId(String ownerId);
    List<Store> findByTotalVotesGreaterThanEqualOrderBySatisfactionRateDescTotalVotesDesc(int minVotes);
}
