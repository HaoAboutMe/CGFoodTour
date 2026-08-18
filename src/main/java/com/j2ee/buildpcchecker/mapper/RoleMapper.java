package com.j2ee.buildpcchecker.mapper;

import com.j2ee.buildpcchecker.dto.request.RoleRequest;
import com.j2ee.buildpcchecker.dto.response.RoleResponse;
import com.j2ee.buildpcchecker.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper
{
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);
    RoleResponse toRoleResponse(Role role);
}
