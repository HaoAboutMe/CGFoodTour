package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByStoreId(String storeId);
    void deleteByStoreId(String storeId);
}
