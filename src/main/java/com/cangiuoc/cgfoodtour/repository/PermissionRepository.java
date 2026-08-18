package com.cangiuoc.cgfoodtour.repository;

import com.cangiuoc.cgfoodtour.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String>
{

}
