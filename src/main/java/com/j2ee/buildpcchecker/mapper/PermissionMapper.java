package com.j2ee.buildpcchecker.mapper;

import com.j2ee.buildpcchecker.dto.request.PermissionRequest;
import com.j2ee.buildpcchecker.dto.response.PermissionResponse;
import com.j2ee.buildpcchecker.entity.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper
{
    Permission toPermission(PermissionRequest request);
    PermissionResponse toPermissionResponse(Permission permission);
}
