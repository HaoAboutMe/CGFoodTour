package com.cangiuoc.cgfoodtour.mapper;

import com.cangiuoc.cgfoodtour.dto.request.RoleRequest;
import com.cangiuoc.cgfoodtour.dto.response.RoleResponse;
import com.cangiuoc.cgfoodtour.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper
{
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);
    RoleResponse toRoleResponse(Role role);
}
