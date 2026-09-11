package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.StoreRating;
import com.cangiuoc.cgfoodtour.enums.RatingLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRatingRepository extends JpaRepository<StoreRating, Long> {
    Optional<StoreRating> findByUserIdAndStoreId(String userId, String storeId);
    long countByStoreIdAndRatingLevel(String storeId, RatingLevel ratingLevel);
    void deleteByStoreId(String storeId);
}
