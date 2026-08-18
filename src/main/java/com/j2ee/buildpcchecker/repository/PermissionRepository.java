package com.j2ee.buildpcchecker.repository;

import com.j2ee.buildpcchecker.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String>
{

}
