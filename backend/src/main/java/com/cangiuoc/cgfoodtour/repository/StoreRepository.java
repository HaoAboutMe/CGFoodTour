package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, String> {
    List<Store> findByOwnerId(String ownerId);

    @Query("""
            select s from Store s join s.owner o
            where s.status = :status and o.enabled = true
              and (:categoryId is null or s.category.id = :categoryId)
              and (:query is null or lower(s.name) like lower(concat('%', :query, '%'))
                   or lower(s.addressLine) like lower(concat('%', :query, '%'))
                   or lower(s.landmarkNote) like lower(concat('%', :query, '%')))
            """)
    Page<Store> searchPublic(@Param("status") StoreStatus status,
                             @Param("categoryId") Integer categoryId,
                             @Param("query") String query, Pageable pageable);

    @Query("""
            select s from Store s join s.owner o
            where (:status is null or s.status = :status)
              and (:categoryId is null or s.category.id = :categoryId)
              and (:recoveryRequested = false or s.recoveryRequested = true)
              and (:query is null or lower(s.name) like lower(concat('%', :query, '%'))
                   or lower(s.addressLine) like lower(concat('%', :query, '%'))
                   or lower(o.username) like lower(concat('%', :query, '%')))
            """)
    Page<Store> searchAdmin(@Param("status") StoreStatus status,
                            @Param("categoryId") Integer categoryId,
                            @Param("query") String query,
                            @Param("recoveryRequested") boolean recoveryRequested,
                            Pageable pageable);

    Page<Store> findByOwnerIdAndStatus(String ownerId, StoreStatus status, Pageable pageable);
    Page<Store> findByOwnerId(String ownerId, Pageable pageable);

    @Query("""
            select s from Store s join s.owner o
            where s.status = :status and o.enabled = true and s.totalVotes >= :minVotes
            order by s.satisfactionRate desc, s.totalVotes desc
            """)
    List<Store> findRanking(@Param("status") StoreStatus status, @Param("minVotes") int minVotes,
                            Pageable pageable);

    @Query("""
            select s from Store s join s.owner o
            where s.status = :status and o.enabled = true
              and (:categoryId is null or s.category.id = :categoryId)
            order by function('RAND')
            """)
    List<Store> findRandomPublic(@Param("status") StoreStatus status,
                                 @Param("categoryId") Integer categoryId, Pageable pageable);
}
