package com.j2ee.buildpcchecker.service;

import com.j2ee.buildpcchecker.dto.request.ChangePasswordRequest;
import com.j2ee.buildpcchecker.dto.request.MyInfoUpdateRequest;
import com.j2ee.buildpcchecker.dto.request.UserCreationRequest;
import com.j2ee.buildpcchecker.dto.request.UserUpdateRequest;
import com.j2ee.buildpcchecker.dto.response.UserResponse;
import com.j2ee.buildpcchecker.entity.Role;
import com.j2ee.buildpcchecker.entity.User;
import com.j2ee.buildpcchecker.entity.VerificationToken;
import com.j2ee.buildpcchecker.exception.AppException;
import com.j2ee.buildpcchecker.exception.ErrorCode;
import com.j2ee.buildpcchecker.mapper.UserMapper;
import com.j2ee.buildpcchecker.repository.RoleRepository;
import com.j2ee.buildpcchecker.repository.UserRepository;
import com.j2ee.buildpcchecker.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService
{
    UserRepository userRepository;
    RoleRepository roleRepository;
    VerificationTokenRepository verificationTokenRepository;

    UserMapper userMapper;

    PasswordEncoder passwordEncoder;
    EmailService emailService;

    public UserResponse createUser(UserCreationRequest request)
    {
        if(userRepository.existsByEmail(request.getEmail()))
        {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(false);  // Tài khoản chưa được kích hoạt
        user.setEmailVerified(false);  // Email chưa được xác thực

        // Gán Role USER mặc định cho người dùng đăng ký mới
        var roles = new HashSet<Role>();
        roleRepository.findById("USER").ifPresent(roles::add);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Tạo verification token và gửi email
        String token = createVerificationToken(savedUser);
        try {
            emailService.sendVerificationEmail(savedUser.getEmail(), token);
            log.info("User created with email: {}, verification email sent", savedUser.getEmail());
        } catch (Exception e) {
            log.error("==========================================================================");
            log.error("FAILED TO SEND VERIFICATION EMAIL TO: {}", savedUser.getEmail());
            log.error("VERIFICATION TOKEN: {}", token);
            log.error("You can manually activate this account by calling the API:");
            log.error("GET http://localhost:8080/api/auth/verify-email?token={}", token);
            log.error("==========================================================================");
        }

        return userMapper.toUserResponse(savedUser);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers()
    {
        log.info("In method get User");
        return userMapper.toListUserResponse(userRepository.findAll());
    }

    public UserResponse getCurrentUser()
    {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN') or returnObject.email == authentication.name")
    public UserResponse getUserById(String userId)
    {
        log.info("In method get user ID");

        return userMapper.toUserResponse(userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(UserUpdateRequest request, String userId)
    {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        userMapper.updateUser(user, request);

        var roles = roleRepository.findAllById(request.getRoles());
        user.setRoles(new HashSet<>(roles));

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse updateMyInfo(MyInfoUpdateRequest request)
    {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userMapper.updateMyInfo(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse changePassword(ChangePasswordRequest request)
    {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getOldPassword(), user.getPassword());
        if(!authenticated)
        {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId)
    {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        userRepository.delete(user);
    }

    /**
     * Tạo verification token cho user
     */
    private String createVerificationToken(User user)
    {
        String token = UUID.randomUUID().toString();

        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .build();

        verificationTokenRepository.save(verificationToken);
        return token;
    }

    /**
     * Xác thực email thông qua token
     */
    @Transactional
    public UserResponse verifyEmail(String token)
    {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        // Kiểm tra token đã hết hạn chưa
        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }

        User user = verificationToken.getUser();

        // Kiểm tra email đã được xác thực chưa
        if (user.getEmailVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // Kích hoạt tài khoản
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        // Xóa token sau khi sử dụng
        verificationTokenRepository.delete(verificationToken);

        log.info("Email verified successfully for user: {}", user.getEmail());

        return userMapper.toUserResponse(user);
    }

    /**
     * Gửi lại email xác thực
     */
    @Transactional
    public void resendVerificationEmail(String email)
    {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getEmailVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // Xóa token cũ nếu có
        verificationTokenRepository.findByUserId(user.getId())
                .ifPresent(verificationTokenRepository::delete);

        // Tạo token mới và gửi email
        String token = createVerificationToken(user);
        try {
            emailService.sendVerificationEmail(user.getEmail(), token);
            log.info("Verification email resent to: {}", email);
        } catch (Exception e) {
            log.error("==========================================================================");
            log.error("FAILED TO RESEND VERIFICATION EMAIL TO: {}", email);
            log.error("VERIFICATION TOKEN: {}", token);
            log.error("You can manually activate this account by calling the API:");
            log.error("GET http://localhost:8080/api/auth/verify-email?token={}", token);
            log.error("==========================================================================");
        }
    }
}
