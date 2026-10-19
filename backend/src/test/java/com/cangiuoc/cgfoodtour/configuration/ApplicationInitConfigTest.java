package com.cangiuoc.cgfoodtour.configuration;

import com.cangiuoc.cgfoodtour.entity.Permission;
import com.cangiuoc.cgfoodtour.entity.Role;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.repository.PermissionRepository;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationInitConfigTest {
    @Mock PasswordEncoder passwordEncoder;
    @Mock UserRepository userRepository;
    @Mock PermissionRepository permissionRepository;
    @Mock RoleRepository roleRepository;

    private AdminBootstrapProperties adminProperties;

    @BeforeEach
    void setUpExistingReferenceData() {
        adminProperties = new AdminBootstrapProperties();
        adminProperties.setDefaultEmail("admin@example.com");
        when(permissionRepository.findById(anyString()))
                .thenReturn(Optional.of(Permission.builder().name("EXISTING").build()));
        when(roleRepository.findById(anyString()))
                .thenReturn(Optional.of(Role.builder().name("EXISTING").build()));
    }

    @Test
    void productionFailsWhenBootstrapAdminIsMissingAndPasswordWasNotProvided() {
        MockEnvironment environment = new MockEnvironment().withProperty("spring.profiles.active", "prod");
        environment.setActiveProfiles("prod");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        var config = new ApplicationInitConfig(passwordEncoder, adminProperties, environment);

        assertThatThrownBy(() -> config.applicationRunner(userRepository, permissionRepository, roleRepository)
                .run(new DefaultApplicationArguments(new String[0])))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.admin.default-password")
                .hasMessageNotContaining("admin@example.com");
    }

    @Test
    void productionDoesNotRequireBootstrapPasswordAfterAdminAlreadyExists() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(User.builder().id("admin").build()));
        var config = new ApplicationInitConfig(passwordEncoder, adminProperties, environment);

        assertThatCode(() -> config.applicationRunner(userRepository, permissionRepository, roleRepository)
                .run(new DefaultApplicationArguments(new String[0])))
                .doesNotThrowAnyException();
    }
}
