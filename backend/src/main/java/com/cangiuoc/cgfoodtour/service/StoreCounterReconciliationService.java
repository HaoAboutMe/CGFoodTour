package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.enums.RatingLevel;
import com.cangiuoc.cgfoodtour.repository.StoreRatingRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import com.cangiuoc.cgfoodtour.repository.UserSavedStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreCounterReconciliationService {
    private static final int BATCH_SIZE = 100;
    private final StoreRepository storeRepository;
    private final StoreRatingRepository ratingRepository;
    private final UserSavedStoreRepository savedStoreRepository;

    @Scheduled(cron = "${app.counter-reconciliation.cron:0 15 2 * * *}",
            zone = "${app.business-zone:Asia/Ho_Chi_Minh}")
    @Transactional
    public void scheduledReconcile() {
        int checked = 0;
        int repaired = 0;
        int page = 0;
        org.springframework.data.domain.Page<Store> batch;
        do {
            batch = storeRepository.findAll(PageRequest.of(page++, BATCH_SIZE, Sort.by("id")));
            for (Store store : batch.getContent()) {
                checked++;
                if (reconcileOne(store.getId())) repaired++;
            }
        } while (batch.hasNext());
        log.info("Store counter reconciliation checked={}, repaired={}", checked, repaired);
    }

    @Transactional
    public boolean reconcileOne(String storeId) {
        Store store = storeRepository.findByIdForUpdate(storeId).orElse(null);
        if (store == null) return false;
        int verySatisfied = Math.toIntExact(ratingRepository
                .countByStoreIdAndRatingLevel(storeId, RatingLevel.VERY_SATISFIED));
        int normal = Math.toIntExact(ratingRepository
                .countByStoreIdAndRatingLevel(storeId, RatingLevel.NORMAL));
        int notSatisfied = Math.toIntExact(ratingRepository
                .countByStoreIdAndRatingLevel(storeId, RatingLevel.NOT_SATISFIED));
        int total = verySatisfied + normal + notSatisfied;
        int saved = savedStoreRepository.countByStoreId(storeId);
        double satisfaction = total == 0 ? 0.0 : verySatisfied * 100.0 / total;
        boolean changed = store.getCountVerySatisfied() == null || store.getCountVerySatisfied() != verySatisfied
                || store.getCountNormal() == null || store.getCountNormal() != normal
                || store.getCountNotSatisfied() == null || store.getCountNotSatisfied() != notSatisfied
                || store.getTotalVotes() == null || store.getTotalVotes() != total
                || store.getSavedCount() == null || store.getSavedCount() != saved
                || store.getSatisfactionRate() == null
                || Math.abs(store.getSatisfactionRate() - satisfaction) > 0.0001;
        if (changed) {
            store.setCountVerySatisfied(verySatisfied);
            store.setCountNormal(normal);
            store.setCountNotSatisfied(notSatisfied);
            store.setTotalVotes(total);
            store.setSavedCount(saved);
            store.setSatisfactionRate(satisfaction);
            storeRepository.save(store);
        }
        return changed;
    }
}
