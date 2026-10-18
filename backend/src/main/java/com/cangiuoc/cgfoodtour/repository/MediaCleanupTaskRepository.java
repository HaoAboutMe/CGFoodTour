package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.MediaCleanupTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;
import com.cangiuoc.cgfoodtour.enums.MediaCleanupStatus;

public interface MediaCleanupTaskRepository extends JpaRepository<MediaCleanupTask, Long> {
    boolean existsByPublicId(String publicId);
    List<MediaCleanupTask> findTop100ByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(
            MediaCleanupStatus status, LocalDateTime now);
}
