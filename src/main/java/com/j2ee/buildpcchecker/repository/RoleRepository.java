package com.j2ee.buildpcchecker.repository;

import com.j2ee.buildpcchecker.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role,String>
{

}
