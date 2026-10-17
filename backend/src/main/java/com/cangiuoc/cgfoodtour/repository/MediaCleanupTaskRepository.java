package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.MediaCleanupTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaCleanupTaskRepository extends JpaRepository<MediaCleanupTask, Long> {
    boolean existsByPublicId(String publicId);
    List<MediaCleanupTask> findTop100ByOrderByCreatedAtAsc();
}
