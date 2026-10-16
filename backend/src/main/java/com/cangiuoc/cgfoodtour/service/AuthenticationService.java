package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.AuthenticationRequest;
import com.cangiuoc.cgfoodtour.dto.request.ForgotPasswordRequest;
import com.cangiuoc.cgfoodtour.dto.request.GoogleLoginRequest;
import com.cangiuoc.cgfoodtour.dto.request.FacebookLoginRequest;
import com.cangiuoc.cgfoodtour.dto.request.IntrospectRequest;
import com.cangiuoc.cgfoodtour.dto.request.LogOutRequest;
import com.cangiuoc.cgfoodtour.dto.request.RefreshRequest;
import com.cangiuoc.cgfoodtour.dto.request.ResetPasswordRequest;
import com.cangiuoc.cgfoodtour.dto.request.VerifyOtpRequest;
import com.cangiuoc.cgfoodtour.dto.response.AuthenticationResponse;
import com.cangiuoc.cgfoodtour.dto.response.IntrospectResponse;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashSet;
import org.springframework.web.client.RestTemplate;
import com.cangiuoc.cgfoodtour.entity.InvalidatedToken;
import com.cangiuoc.cgfoodtour.entity.PasswordResetOtp;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.repository.InvalidatedTokenRepository;
import com.cangiuoc.cgfoodtour.repository.PasswordResetOtpRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.StringJoiner;
import java.util.UUID;

@Slf4j
@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService
{
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    UserRepository userRepository;
    RoleRepository roleRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    PasswordResetOtpRepository passwordResetOtpRepository;
    AuthAbuseProtectionService authAbuseProtectionService;
    EmailService emailService;
    PasswordEncoder passwordEncoder;

    public AuthenticationService(UserRepository userRepository,
                                 RoleRepository roleRepository,
                                 InvalidatedTokenRepository invalidatedTokenRepository,
                                 PasswordResetOtpRepository passwordResetOtpRepository,
                                 AuthAbuseProtectionService authAbuseProtectionService,
                                 EmailService emailService,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
        this.authAbuseProtectionService = authAbuseProtectionService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${app.google.client-id}")
    protected String GOOGLE_CLIENT_ID;

    @NonFinal
    @Value("${app.facebook.app-secret}")
    protected String FACEBOOK_APP_SECRET;

    @NonFinal
    @Value("${security.otp.pepper:${jwt.signerKey}}")
    protected String OTP_PEPPER;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException
    {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, ACCESS_TOKEN_TYPE);
        }
        catch (AppException ex)
        {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request)
    {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        //Math 2 password của request và user trong database
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if(!authenticated)
        {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        // Kiểm tra email đã được xác thực chưa
        if (!user.getEmailVerified())
        {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // Kiểm tra tài khoản đã được kích hoạt chưa
        if (!user.getEnabled())
        {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        return buildAuthenticationResponse(user);
    }

    public void logout(LogOutRequest request) {
        invalidateToken(request.getAccessToken(), ACCESS_TOKEN_TYPE);
        invalidateToken(request.getRefreshToken(), REFRESH_TOKEN_TYPE);
    }

    private void invalidateToken(String token, String expectedType) {
        try {
            var signedToken = verifyToken(token, expectedType);

            String jti = signedToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signedToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jti)
                    .expiryTime(expiryTime)
                    .build();

            invalidatedTokenRepository.save(invalidatedToken);
        } catch (AppException | ParseException | JOSEException exception) {
            // Logout is intentionally idempotent. An expired, malformed or already revoked
            // token must not prevent the other token in the pair from being revoked.
            log.debug("Skipping invalid or already revoked {} token during logout", expectedType);
        }
    }

    @Transactional
    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException
    {
        var signedToken = verifyToken(request.getRefreshToken(), REFRESH_TOKEN_TYPE);

        var jti = signedToken.getJWTClaimsSet().getJWTID();
        var expiryTime = signedToken.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jti)
                .expiryTime(expiryTime)
                .build();

        invalidatedTokenRepository.save(invalidatedToken);

        var email = signedToken.getJWTClaimsSet().getSubject();
        var user = userRepository.findByEmail(email).orElseThrow(
                () -> new AppException(ErrorCode.UNAUTHENTICATED)
        );

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        return buildAuthenticationResponse(user);
    }

    private SignedJWT verifyToken(String token, String expectedType) throws ParseException, JOSEException
    {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);
        var verified = signedJWT.verify(verifier);
        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("typ");

        if (!(verified && expirationTime != null && expirationTime.after(new Date())
                && expectedType.equals(tokenType)))
        {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if(invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
        {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    private AuthenticationResponse buildAuthenticationResponse(User user) {
        return AuthenticationResponse.builder()
                .isAuthenticated(true)
                .accessToken(generateToken(user, ACCESS_TOKEN_TYPE, VALID_DURATION))
                .refreshToken(generateToken(user, REFRESH_TOKEN_TYPE, REFRESHABLE_DURATION))
                .expiresIn(VALID_DURATION)
                .refreshExpiresIn(REFRESHABLE_DURATION)
                .build();
    }

    private String generateToken(User user, String tokenType, long durationSeconds)
    {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("haoaboutme.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(durationSeconds, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("typ", tokenType)
                .claim("scope", ACCESS_TOKEN_TYPE.equals(tokenType) ? buildScope(user) : "")
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        }
        catch (JOSEException ex)
        {
            log.error("Cannot generate token", ex);
            throw new RuntimeException(ex);
        }
    }

    private String buildScope(User user)
    {
        StringJoiner joiner = new StringJoiner(" ");
        if(!user.getRoles().isEmpty())
        {
            user.getRoles().forEach(role -> {
                joiner.add("ROLE_" + role.getName());
                if(!CollectionUtils.isEmpty(role.getPermissions()))
                {
                    role.getPermissions().forEach(permission -> {
                        joiner.add(permission.getName());
                    });
                }
            });
        }
        return joiner.toString();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String clientIp) {
        String email = normalizeEmail(request.getEmail());
        authAbuseProtectionService.checkIssue(email, clientIp);

        Optional<User> user = userRepository.findByEmail(email);
        // Keep the public response identical for unknown, disabled and unverified accounts.
        if (user.isEmpty() || !Boolean.TRUE.equals(user.get().getEnabled())
                || !Boolean.TRUE.equals(user.get().getEmailVerified())) {
            return;
        }

        Optional<PasswordResetOtp> current = passwordResetOtpRepository
                .findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email);
        if (current.isPresent() && current.get().getCreatedAt() != null
                && current.get().getCreatedAt().plusMinutes(1).isAfter(LocalDateTime.now())) {
            return;
        }
        if (passwordResetOtpRepository.countByEmailAndCreatedAtAfter(email, LocalDateTime.now().minusHours(1)) >= 5) {
            throw new AppException(ErrorCode.AUTH_RATE_LIMITED);
        }

        current.ifPresent(otp -> otp.setIsUsed(true));

        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(email)
                .otpHash(hashOtp(email, otp))
                .build();
        passwordResetOtpRepository.save(resetOtp);

        try {
            emailService.sendOtpEmail(email, otp);
            log.info("Password reset challenge dispatched for user id {}", user.get().getId());
        } catch (Exception e) {
            log.error("Failed to dispatch password reset challenge for user id {}", user.get().getId());
        }
    }

    @Transactional(noRollbackFor = AppException.class)
    public void verifyOtp(VerifyOtpRequest request, String clientIp) {
        String email = normalizeEmail(request.getEmail());
        authAbuseProtectionService.checkVerificationAttempt(email, clientIp);
        requireValidOtp(email, request.getOtp());
    }

    @Transactional(noRollbackFor = AppException.class)
    public void resetPassword(ResetPasswordRequest request, String clientIp) {
        String email = normalizeEmail(request.getEmail());
        authAbuseProtectionService.checkVerificationAttempt(email, clientIp);
        PasswordResetOtp resetOtp = requireValidOtp(email, request.getOtp());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetOtp.setIsUsed(true);
        passwordResetOtpRepository.save(resetOtp);

        log.info("Password reset successfully for user id {}", user.getId());
    }

    private PasswordResetOtp requireValidOtp(String email, String otp) {
        PasswordResetOtp challenge = passwordResetOtpRepository
                .findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (challenge.getExpiryDate().isBefore(LocalDateTime.now()) || challenge.getFailedAttempts() >= 5) {
            challenge.setIsUsed(true);
            passwordResetOtpRepository.save(challenge);
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        byte[] expected = challenge.getOtpHash().getBytes(StandardCharsets.US_ASCII);
        byte[] actual = hashOtp(email, otp).getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(expected, actual)) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            if (challenge.getFailedAttempts() >= 5) challenge.setIsUsed(true);
            passwordResetOtpRepository.save(challenge);
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        return challenge;
    }

    private String hashOtp(String email, String otp) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(OTP_PEPPER.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal((email + ":" + otp).getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash OTP", e);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public AuthenticationResponse googleAuthenticate(GoogleLoginRequest request) {
        String idTokenStr = request.getIdToken();

        // 1. Verify the token using Google's JWKs url
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
        org.springframework.security.oauth2.jwt.Jwt jwt;
        try {
            jwt = decoder.decode(idTokenStr);
        } catch (Exception e) {
            log.error("Failed to decode Google ID Token", e);
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        // 2. Validate issuer
        String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
        if (!issuer.contains("accounts.google.com")) {
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        // 3. Validate audience (client id)
        List<String> audience = jwt.getAudience();
        if (audience == null || !audience.contains(GOOGLE_CLIENT_ID)) {
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        // 4. Validate email
        String email = jwt.getClaimAsString("email");
        if (email == null) {
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        // 5. Look up user by email or register if not exists
        User user = userRepository.findByEmail(email).map(existingUser -> {
            // Tự động kích hoạt tài khoản và xác thực email nếu trước đó đăng ký bằng email/password nhưng chưa kích hoạt
            if (!existingUser.getEnabled() || !existingUser.getEmailVerified()) {
                existingUser.setEnabled(true);
                existingUser.setEmailVerified(true);
                return userRepository.save(existingUser);
            }
            return existingUser;
        }).orElseGet(() -> {
            String name = jwt.getClaimAsString("name");
            String givenName = jwt.getClaimAsString("given_name");
            String familyName = jwt.getClaimAsString("family_name");

            String baseUsername = name != null ? name : email.split("@")[0];
            String username = baseUsername;
            int count = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + count++;
            }

            var roles = new HashSet<com.cangiuoc.cgfoodtour.entity.Role>();
            roleRepository.findById("USER").ifPresent(roles::add);

            User newUser = User.builder()
                    .username(username)
                    .email(email)
                    .firstname(givenName)
                    .lastname(familyName)
                    .enabled(true)
                    .emailVerified(true)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .roles(roles)
                    .build();
            return userRepository.save(newUser);
        });

        // 6. Check if account is disabled
        if (!user.getEnabled()) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        // 7. Generate application JWT token
        return buildAuthenticationResponse(user);
    }

    @Transactional
    public AuthenticationResponse facebookAuthenticate(FacebookLoginRequest request) {
        String accessToken = request.getAccessToken();

        // 1. Fetch user profile from Facebook Graph API
        String fbUrl = "https://graph.facebook.com/me?fields=id,name,first_name,last_name,email,picture.type(large)&access_token=" + accessToken;
        if (FACEBOOK_APP_SECRET != null && !FACEBOOK_APP_SECRET.isBlank() && !FACEBOOK_APP_SECRET.contains("Thay thế")) {
            String appSecretProof = generateAppSecretProof(accessToken, FACEBOOK_APP_SECRET);
            if (appSecretProof != null) {
                fbUrl += "&appsecret_proof=" + appSecretProof;
            }
        }
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> fbResponse;
        try {
            fbResponse = restTemplate.getForObject(fbUrl, Map.class);
        } catch (Exception e) {
            log.error("Failed to verify Facebook access token", e);
            throw new AppException(ErrorCode.FACEBOOK_TOKEN_INVALID);
        }

        if (fbResponse == null || !fbResponse.containsKey("id")) {
            throw new AppException(ErrorCode.FACEBOOK_TOKEN_INVALID);
        }

        String facebookId = (String) fbResponse.get("id");
        String name = (String) fbResponse.get("name");
        String firstName = (String) fbResponse.get("first_name");
        String lastName = (String) fbResponse.get("last_name");
        String email = (String) fbResponse.get("email");

        // Extract avatar URL from Facebook picture object if present
        String avatarUrl = null;
        if (fbResponse.containsKey("picture")) {
            Map<String, Object> picture = (Map<String, Object>) fbResponse.get("picture");
            if (picture != null && picture.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) picture.get("data");
                if (data != null && data.containsKey("url")) {
                    avatarUrl = (String) data.get("url");
                }
            }
        }

        // 2. Logic 1: Find user by facebookId
        Optional<User> existingUserOpt = userRepository.findByFacebookId(facebookId);
        User user = null;
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            // Check if we need to sync/update email
            if (email != null && existingUser.getEmail().startsWith("fb_")) {
                // Check if the real email is already taken by another user
                if (!userRepository.existsByEmail(email)) {
                    existingUser.setEmail(email);
                }
            }
            // Auto update name / avatar if changed
            if (avatarUrl != null && (existingUser.getAvatarUrl() == null || existingUser.getAvatarUrl().startsWith("https://platform-lookaside.fbsbx.com"))) {
                existingUser.setAvatarUrl(avatarUrl);
            }
            // Ensure enabled/verified
            if (!existingUser.getEnabled() || !existingUser.getEmailVerified()) {
                existingUser.setEnabled(true);
                existingUser.setEmailVerified(true);
            }
            user = userRepository.save(existingUser);
        }

        // 3. Logic 2: If not found by facebookId, but we have a valid email from FB, find by email
        if (user == null && email != null) {
            Optional<User> emailUserOpt = userRepository.findByEmail(email);
            if (emailUserOpt.isPresent()) {
                User existingUser = emailUserOpt.get();
                // Link this existing account to Facebook ID
                existingUser.setFacebookId(facebookId);
                if (avatarUrl != null && existingUser.getAvatarUrl() == null) {
                    existingUser.setAvatarUrl(avatarUrl);
                }
                if (!existingUser.getEnabled() || !existingUser.getEmailVerified()) {
                    existingUser.setEnabled(true);
                    existingUser.setEmailVerified(true);
                }
                user = userRepository.save(existingUser);
            }
        }

        // 4. Logic 3: If still not found, create a new User
        if (user == null) {
            String finalEmail = email;
            if (finalEmail == null) {
                // Generate virtual email
                finalEmail = "fb_" + facebookId + "@cangiuocfoodtour.com";
            }

            String baseUsername = name != null ? name : (email != null ? email.split("@")[0] : "fb_" + facebookId);
            String username = baseUsername;
            int count = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + count++;
            }

            var roles = new HashSet<com.cangiuoc.cgfoodtour.entity.Role>();
            roleRepository.findById("USER").ifPresent(roles::add);

            User newUser = User.builder()
                    .facebookId(facebookId)
                    .username(username)
                    .email(finalEmail)
                    .firstname(firstName)
                    .lastname(lastName)
                    .enabled(true)
                    .emailVerified(true)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .roles(roles)
                    .avatarUrl(avatarUrl)
                    .build();
            user = userRepository.save(newUser);
        }

        // 5. Check if account is disabled
        if (!user.getEnabled()) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        // 6. Generate application JWT token
        return buildAuthenticationResponse(user);
    }

    private String generateAppSecretProof(String accessToken, String appSecret) {
        try {
            javax.crypto.Mac sha256HMAC = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(appSecret.getBytes("UTF-8"), "HmacSHA256");
            sha256HMAC.init(secretKey);
            byte[] hash = sha256HMAC.doFinal(accessToken.getBytes("UTF-8"));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("Failed to generate appsecret_proof", e);
            return null;
        }
    }
}
