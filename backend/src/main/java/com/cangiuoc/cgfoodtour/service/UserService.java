package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.ChangePasswordRequest;
import com.cangiuoc.cgfoodtour.dto.request.MyInfoUpdateRequest;
import com.cangiuoc.cgfoodtour.dto.request.UserCreationRequest;
import com.cangiuoc.cgfoodtour.dto.request.UserUpdateRequest;
import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.entity.Role;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.entity.VerificationToken;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.mapper.UserMapper;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

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
    ManagedImageService managedImageService;

    @NonFinal
    @Value("${cloudinary.default-avatar-url}")
    String defaultAvatarUrl;

    @Transactional
    public UserResponse createUser(UserCreationRequest request)
    {
        request.setUsername(request.getUsername().trim());
        request.setEmail(request.getEmail().trim().toLowerCase(java.util.Locale.ROOT));
        if(userRepository.existsByUsername(request.getUsername()))
        {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }
        if(userRepository.existsByEmail(request.getEmail()))
        {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAvatarUrl(defaultAvatarUrl);
        user.setAvatarPublicId(null);
        user.setEnabled(false);  // Tài khoản chưa được kích hoạt
        user.setEmailVerified(false);  // Email chưa được xác thực

        // Gán Role USER mặc định cho người dùng đăng ký mới
        var roles = new HashSet<Role>();
        roleRepository.findById("USER").ifPresent(roles::add);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Tạo verification token và gửi email
        String token = createVerificationToken(savedUser);
        emailService.sendVerificationEmail(savedUser.getEmail(), token);
        log.info("Verification email dispatched for new user id {}", savedUser.getId());

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

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUserById(String userId)
    {
        log.info("In method get user ID");

        return userMapper.toUserResponse(userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse updateUser(UserUpdateRequest request, String userId)
    {
        // Serialize authority changes so two concurrent requests cannot remove the
        // final active administrator after both observed the same stale count.
        roleRepository.findByNameForUpdate("ADMIN");
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if ((user.getUsername() == null || !user.getUsername().equalsIgnoreCase(request.getUsername()))
                && userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }
        var requestedRoleNames = new HashSet<>(request.getRoles());
        var roles = roleRepository.findAllById(requestedRoleNames);
        if (roles.size() != requestedRoleNames.size()) {
            throw new AppException(ErrorCode.ROLE_INVALID);
        }
        var existingRoleNames = user.getRoles() == null
                ? java.util.Set.<String>of()
                : user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet());
        boolean rolesChanged = !existingRoleNames.equals(requestedRoleNames);
        if (rolesChanged && existingRoleNames.contains("ADMIN") && !requestedRoleNames.contains("ADMIN")
                && Boolean.TRUE.equals(user.getEnabled()) && userRepository.countActiveAdmins() <= 1) {
            throw new AppException(ErrorCode.LAST_ADMIN_PROTECTED);
        }
        userMapper.updateUser(user, request);
        user.setRoles(new HashSet<>(roles));

        if (rolesChanged) {
            revokeAllSessions(user);
        }

        return userMapper.toUserResponse(userRepository.saveAndFlush(user));
    }

    public UserResponse updateMyInfo(MyInfoUpdateRequest request)
    {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getUsername() != null && !request.getUsername().equalsIgnoreCase(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new AppException(ErrorCode.USERNAME_EXISTED);
            }
        }

        userMapper.updateMyInfo(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse changePassword(ChangePasswordRequest request)
    {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getOldPassword(), user.getPassword());
        if(!authenticated)
        {
            // A wrong current password is a business validation error, not an invalid
            // bearer token. Returning 401 makes the SPA revoke an otherwise valid session.
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        revokeAllSessions(user);
        User savedUser = userRepository.saveAndFlush(user);
        return userMapper.toUserResponse(savedUser);
    }

    private long currentTokenVersion(User user) {
        return user.getTokenVersion() == null ? 0L : user.getTokenVersion();
    }

    private void revokeAllSessions(User user) {
        user.setTokenVersion(currentTokenVersion(user) + 1);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse disableUser(String userId, String reason) {
        roleRepository.findByNameForUpdate("ADMIN");
        User actor = currentUserEntity();
        User target = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        requireDifferentAccount(actor, target);
        if (!Boolean.TRUE.equals(target.getEmailVerified())) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }
        if (isAdmin(target) && Boolean.TRUE.equals(target.getEnabled()) && userRepository.countActiveAdmins() <= 1) {
            throw new AppException(ErrorCode.LAST_ADMIN_PROTECTED);
        }
        boolean disabledNow = Boolean.TRUE.equals(target.getEnabled());
        if (disabledNow) {
            target.setEnabled(false);
            target.setDisabledReason(reason.trim());
            target.setDisabledAt(LocalDateTime.now());
            target.setDisabledByAdminId(actor.getId());
            revokeAllSessions(target);
        }
        User savedTarget = userRepository.saveAndFlush(target);
        if (disabledNow) {
            notifyAccountDisabledAfterCommit(savedTarget, reason.trim());
        }
        return userMapper.toUserResponse(savedTarget);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse enableUser(String userId) {
        User actor = currentUserEntity();
        User target = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        requireDifferentAccount(actor, target);
        if (!Boolean.TRUE.equals(target.getEmailVerified())) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }
        boolean enabledNow = !Boolean.TRUE.equals(target.getEnabled());
        if (enabledNow) {
            target.setEnabled(true);
            target.setDisabledReason(null);
            target.setDisabledAt(null);
            target.setDisabledByAdminId(null);
            revokeAllSessions(target);
        }
        User savedTarget = userRepository.saveAndFlush(target);
        if (enabledNow) {
            notifyAccountEnabledAfterCommit(savedTarget);
        }
        return userMapper.toUserResponse(savedTarget);
    }

    private User currentUserEntity() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void requireDifferentAccount(User actor, User target) {
        if (actor.getId().equals(target.getId())) {
            throw new AppException(ErrorCode.ACCOUNT_SELF_ACTION_FORBIDDEN);
        }
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()));
    }

    private void notifyAccountDisabledAfterCommit(User user, String reason) {
        Runnable notification = () -> emailService.sendAccountDisabledEmail(
                user.getEmail(), user.getUsername(), reason);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notification.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notification.run();
            }
        });
    }

    private void notifyAccountEnabledAfterCommit(User user) {
        Runnable notification = () -> emailService.sendAccountEnabledEmail(
                user.getEmail(), user.getUsername());
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notification.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notification.run();
            }
        });
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

        verificationTokenRepository.saveAndFlush(verificationToken);
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
        var userResult = userRepository.findByEmail(email);
        if (userResult.isEmpty()) {
            return;
        }
        User user = userResult.get();

        if (user.getEmailVerified()) {
            return;
        }

        var existingToken = verificationTokenRepository.findByUserId(user.getId());
        LocalDateTime now = LocalDateTime.now();
        if (existingToken.isPresent()
                && existingToken.get().getCreatedAt() != null
                && existingToken.get().getCreatedAt().plusMinutes(1).isAfter(now)) {
            return;
        }

        // Rotate the existing row instead of scheduling DELETE + INSERT in the same
        // transaction. The one-to-one user_id constraint permits only one row per user.
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = existingToken.orElseGet(() -> VerificationToken.builder()
                .user(user)
                .build());
        verificationToken.setToken(token);
        verificationToken.setCreatedAt(now);
        verificationToken.setExpiryDate(now.plusHours(24));

        // Force the database write before dispatching an email containing this token.
        verificationTokenRepository.saveAndFlush(verificationToken);
        emailService.sendVerificationEmail(user.getEmail(), token);
        log.info("Verification email re-dispatched for user id {}", user.getId());
    }

    @Transactional
    public UserResponse updateAvatar(MultipartFile file) {
        var context = SecurityContextHolder.getContext().getAuthentication();
        String email = context.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String oldPublicId = user.getAvatarPublicId();
        var uploaded = managedImageService.upload(file, "avatars", 2L * 1024 * 1024);
        try {
            user.setAvatarUrl(uploaded.url());
            user.setAvatarPublicId(uploaded.publicId());
            User saved = userRepository.saveAndFlush(user);
            managedImageService.deleteAfterCommit(oldPublicId);
            return userMapper.toUserResponse(saved);
        } catch (RuntimeException exception) {
            managedImageService.deleteBestEffort(uploaded.publicId());
            throw exception;
        }
    }
}
