package com.j2ee.buildpcchecker.service;

import com.j2ee.buildpcchecker.dto.request.RoleRequest;
import com.j2ee.buildpcchecker.dto.response.RoleResponse;
import com.j2ee.buildpcchecker.entity.Role;
import com.j2ee.buildpcchecker.mapper.RoleMapper;
import com.j2ee.buildpcchecker.repository.PermissionRepository;
import com.j2ee.buildpcchecker.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RoleService
{
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    @PreAuthorize("hasRole('ADMIN')")
    public RoleResponse create(RoleRequest request)
    {
        Role role = roleMapper.toRole(request);

        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleResponse> getAll()
    {
        var roles = roleRepository.findAll();

        return roles.stream().map(roleMapper::toRoleResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String roleName)
    {
        roleRepository.deleteById(roleName);
    }
}
