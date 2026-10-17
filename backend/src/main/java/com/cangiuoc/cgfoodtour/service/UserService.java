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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    CloudinaryService cloudinaryService;

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
        user.setTokenVersion(currentTokenVersion(user) + 1);
        User savedUser = userRepository.saveAndFlush(user);
        return userMapper.toUserResponse(savedUser);
    }

    private long currentTokenVersion(User user) {
        return user.getTokenVersion() == null ? 0L : user.getTokenVersion();
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

        if (file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE);
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException(ErrorCode.UNSUPPORTED_MEDIA_TYPE);
        }

        try {
            // Delete old avatar if present
            if (user.getAvatarPublicId() != null && !user.getAvatarPublicId().isEmpty()) {
                cloudinaryService.deleteImage(user.getAvatarPublicId());
            }

            // Upload new avatar
            Map uploadResult = cloudinaryService.uploadImage(file, "avatars");
            String newUrl = (String) uploadResult.get("secure_url");
            String newPublicId = (String) uploadResult.get("public_id");

            user.setAvatarUrl(newUrl);
            user.setAvatarPublicId(newPublicId);
            return userMapper.toUserResponse(userRepository.save(user));
        } catch (IOException e) {
            log.error("Failed to upload avatar to Cloudinary", e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }
}
