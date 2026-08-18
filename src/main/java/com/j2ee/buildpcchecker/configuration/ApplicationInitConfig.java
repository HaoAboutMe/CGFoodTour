package com.j2ee.buildpcchecker.configuration;

import com.j2ee.buildpcchecker.entity.Permission;
import com.j2ee.buildpcchecker.entity.Role;
import com.j2ee.buildpcchecker.entity.User;
import com.j2ee.buildpcchecker.repository.PermissionRepository;
import com.j2ee.buildpcchecker.repository.RoleRepository;
import com.j2ee.buildpcchecker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashSet;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig
{
    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository,
                                       PermissionRepository permissionRepository,
                                       RoleRepository roleRepository)
    {
        return args -> {
            // Create permissions if they don't exist
            if(permissionRepository.findById("CREATE_DATA").isEmpty()) {
                Permission createPermission = Permission.builder()
                        .name("CREATE_DATA")
                        .description("Permission to create data")
                        .build();
                permissionRepository.save(createPermission);
                log.info("Permission CREATE_DATA created");
            }

            if(permissionRepository.findById("UPDATE_DATA").isEmpty()) {
                Permission updatePermission = Permission.builder()
                        .name("UPDATE_DATA")
                        .description("Permission to update data")
                        .build();
                permissionRepository.save(updatePermission);
                log.info("Permission UPDATE_DATA created");
            }

            if(permissionRepository.findById("READ_DATA").isEmpty()) {
                Permission readPermission = Permission.builder()
                        .name("READ_DATA")
                        .description("Permission to read data")
                        .build();
                permissionRepository.save(readPermission);
                log.info("Permission READ_DATA created");
            }

            if(permissionRepository.findById("DELETE_DATA").isEmpty()) {
                Permission deletePermission = Permission.builder()
                        .name("DELETE_DATA")
                        .description("Permission to delete data")
                        .build();
                permissionRepository.save(deletePermission);
                log.info("Permission DELETE_DATA created");
            }

            // Create ADMIN role if it doesn't exist
            if(roleRepository.findById("ADMIN").isEmpty()) {
                var permissions = new HashSet<Permission>();
                permissions.add(permissionRepository.findById("CREATE_DATA").orElseThrow());
                permissions.add(permissionRepository.findById("UPDATE_DATA").orElseThrow());
                permissions.add(permissionRepository.findById("READ_DATA").orElseThrow());
                permissions.add(permissionRepository.findById("DELETE_DATA").orElseThrow());

                Role adminRole = Role.builder()
                        .name("ADMIN")
                        .description("Admin Role")
                        .permissions(permissions)
                        .build();
                roleRepository.save(adminRole);
                log.info("Role ADMIN created with all permissions");
            }

            // Create USER role if it doesn't exist
            if(roleRepository.findById("USER").isEmpty()) {
                Role userRole = Role.builder()
                        .name("USER")
                        .description("User Role")
                        .permissions(new HashSet<>())
                        .build();
                roleRepository.save(userRole);
                log.info("Role USER created");
            }

            // Create admin user if it doesn't exist
            if(userRepository.findByEmail("haoaboutme@gmail.com").isEmpty())
            {
                var roles = new HashSet<Role>();
                roles.add(roleRepository.findById("ADMIN").orElseThrow());

                User adminUser = User.builder()
                        .username("Admin Hảo")
                        .firstname("Admin")
                        .lastname("Hảo About Me")
                        .password(passwordEncoder.encode("admin"))
                        .email("haoaboutme@gmail.com")
                        .dateOfBirth(LocalDate.parse("2026-01-01"))
                        .roles(roles)
                        .enabled(true)  // Admin được kích hoạt ngay
                        .emailVerified(true)  // Email admin đã được xác thực
                        .build();

                userRepository.save(adminUser);
                log.warn("Admin User created with default password: admin, please change it after first login!");
            }
        };
    }
}
