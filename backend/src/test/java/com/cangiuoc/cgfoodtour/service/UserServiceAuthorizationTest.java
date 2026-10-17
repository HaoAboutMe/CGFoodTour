package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.mapper.UserMapper;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceAuthorizationTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock VerificationTokenRepository verificationTokenRepository;
    @Mock UserMapper userMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock CloudinaryService cloudinaryService;

    @InjectMocks UserService target;

    private UserService securedService;

    @BeforeEach
    void createMethodSecurityProxy() {
        ProxyFactory proxyFactory = new ProxyFactory(target);
        proxyFactory.addAdvisor(AuthorizationManagerBeforeMethodInterceptor.preAuthorize());
        securedService = (UserService) proxyFactory.getProxy();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void regularUserCannotReadUserById() {
        authenticateWith("ROLE_USER");

        assertThrows(AccessDeniedException.class, () -> securedService.getUserById("user-1"));
        verifyNoInteractions(userRepository);
    }

    @Test
    void adminCanReadUserById() {
        authenticateWith("ROLE_ADMIN");
        User user = User.builder().id("user-1").build();
        UserResponse response = UserResponse.builder().id("user-1").build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userMapper.toUserResponse(user)).thenReturn(response);

        assertSame(response, securedService.getUserById("user-1"));
    }

    private void authenticateWith(String authority) {
        var authentication = new UsernamePasswordAuthenticationToken(
                "test@example.com",
                "n/a",
                AuthorityUtils.createAuthorityList(authority));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
