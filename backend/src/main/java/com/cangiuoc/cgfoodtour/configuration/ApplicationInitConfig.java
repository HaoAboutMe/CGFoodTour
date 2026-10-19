package com.cangiuoc.cgfoodtour.configuration;

import com.cangiuoc.cgfoodtour.entity.Permission;
import com.cangiuoc.cgfoodtour.entity.Role;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.repository.PermissionRepository;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
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
    AdminBootstrapProperties adminProperties;
    Environment environment;

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
            String adminEmail = adminProperties.getDefaultEmail().trim();
            if(userRepository.findByEmail(adminEmail).isEmpty())
            {
                String resolvedPassword;
                String configuredPassword = adminProperties.getDefaultPassword();
                boolean isProdProfile = environment.acceptsProfiles(Profiles.of("prod"));

                if (configuredPassword != null && !configuredPassword.trim().isEmpty()) {
                    resolvedPassword = configuredPassword.trim();
                } else if (!isProdProfile) {
                    resolvedPassword = "admin";
                    log.warn("Admin User created with default DEV password: 'admin'. Set APP_ADMIN_DEFAULT_PASSWORD before running in production!");
                } else {
                    throw new IllegalStateException("Invalid production configuration: app.admin.default-password "
                            + "is required while the bootstrap admin account does not exist");
                }

                var roles = new HashSet<Role>();
                roles.add(roleRepository.findById("ADMIN").orElseThrow());

                User adminUser = User.builder()
                        .username("Admin Hảo")
                        .firstname("Admin")
                        .lastname("Hảo About Me")
                        .password(passwordEncoder.encode(resolvedPassword))
                        .email(adminEmail)
                        .dateOfBirth(LocalDate.parse("1990-01-01"))
                        .roles(roles)
                        .enabled(true)  // Admin được kích hoạt ngay
                        .emailVerified(true)  // Email admin đã được xác thực
                        .build();

                userRepository.save(adminUser);
                log.info("Admin User [{}] successfully initialized", adminEmail);
            }
        };
    }
}
