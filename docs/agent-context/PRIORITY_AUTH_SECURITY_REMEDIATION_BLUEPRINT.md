# CG FoodTour — Priority Auth & Security Remediation Blueprint

> Ngày lập: 16/10/2026
>
> Nguồn: `docs/agent-context/KNOWN_ISSUES.md` và source hiện tại.
>
> Phạm vi: H-01, H-02, H-03, M-09, M-10, M-16, M-17, M-19.
>
> Mục đích: tài liệu triển khai; **chưa sửa application code**.

## 1. Kết luận và thứ tự thực hiện

Không sửa tám issue như tám patch độc lập. Chúng tạo thành ba workstream có dependency:

1. **Auth contract và session lifecycle:** H-01 → M-16 → M-09/M-10.
2. **Verification, recovery và account state:** M-17/M-19 → H-03.
3. **SSRF:** H-02 độc lập, nhưng là release gate trước khi backend public.

Thứ tự merge đề xuất:

| Batch | Issues | Kết quả chính | Có thể merge độc lập |
|---|---|---|---|
| P0 | Test baseline | Có characterization/integration test bảo vệ hành vi hiện tại | Có |
| P1 | H-01, M-17 | Registration và verify-email có contract JSON đúng | Có |
| P2 | M-16 | Access/refresh token tách rõ, rotation hoạt động | Không; cần migration `token_version` |
| P3 | M-09, M-10 | Logout revoke session hiện tại; đổi/reset mật khẩu revoke mọi token cũ | Không; dựa trên P2 |
| P4 | M-19 | Social login không thể bật lại hoặc tự link account sai policy | Có sau P2/P3 |
| P5 | H-03 | OTP/resend có cooldown, attempt cap, generic response, audit | Không; cần migration challenge |
| P6 | H-02 | Google Maps parser không còn thực hiện network fetch | Có, ưu tiên sớm nếu có public preview |
| P7 | Full E2E/release gate | Chuỗi auth đầy đủ và security negative tests đều xanh | Sau tất cả batch |

Nếu backend đã hoặc sắp truy cập được từ Internet, thực hiện **P6 trước P1** để đóng SSRF ngay. Nếu vẫn local-only, giữ thứ tự trên để ổn định auth contract trước.

## 2. Baseline đã xác minh

| Issue | Hiện trạng source | Root cause trực tiếp |
|---|---|---|
| H-01 | UI gọi `POST /auth/register`, backend tạo user tại `POST /users`; UI có `regDob` nhưng không gửi; UI password min 6, backend min 8 | Không có API contract dùng chung |
| H-02 | Public `GET /v1/stores/parse-gmaps?url=...` gọi `HttpURLConnection` và tự theo redirect | Backend fetch URL do client kiểm soát |
| H-03 | OTP plaintext, 6 số/5 phút; lookup theo email+OTP; không cooldown/attempt cap/rate limit; forgot-password phân biệt email tồn tại | Challenge model thiếu lifecycle và abuse controls |
| M-09 | `handleLogout()` chỉ xóa state/localStorage | Frontend không gọi `/auth/logout` |
| M-10 | Change/reset chỉ đổi password | JWT không gắn security version của user |
| M-16 | Backend trả một field `token`; frontend chờ `refreshToken`; refresh blacklist token request rồi client có thể reuse token cũ | Access token đang bị dùng như refresh token nhưng contract giả định hai token |
| M-17 | GET verify-email luôn trả HTTP 200 với HTML, kể cả lỗi; SPA chỉ kiểm HTTP status | Browser landing page và API action dùng chung endpoint/semantics |
| M-19 | Google/Facebook đặt `enabled=true` cho existing user trước khi kiểm disabled | `enabled` bị dùng đồng thời cho verification và administrative state |

## 3. Các quyết định kiến trúc đã chốt cho đợt sửa

### ADR-P01 — Canonical registration endpoint

- Dùng duy nhất `POST /auth/register`.
- Xóa public registration qua `POST /users`; nếu cần admin tạo user, tạo endpoint admin riêng ở đợt khác.
- Request bắt buộc: `username`, `email`, `password`, `dateOfBirth`; `firstname`, `lastname` optional.
- Backend là source of truth cho validation. Frontend mirror rule chỉ để UX.
- Password thống nhất `8..72` ký tự. Giới hạn 72 phù hợp đầu vào BCrypt và tránh payload bất thường.
- `dateOfBirth` tiếp tục rule hiện hữu `minAge = 5`; không tự đổi business rule trong batch bảo mật. Đưa giá trị này về một config/constant dùng rõ ràng và test boundary.

Contract:

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "foodlover",
  "email": "user@example.com",
  "firstname": "Van",
  "lastname": "A",
  "password": "correct-horse",
  "dateOfBirth": "2000-01-20"
}
```

Success: `201 Created` với `ApiResponse<UserResponse>`. Không trả password, verification token hay thông tin nội bộ.

### ADR-P02 — Access/refresh token pair

Giữ JWT để phù hợp kiến trúc hiện tại, nhưng tách token bằng claim `typ`:

- Access JWT: `typ=access`, TTL lấy từ `jwt.access-duration` (mặc định 5 phút).
- Refresh JWT: `typ=refresh`, TTL lấy từ `jwt.refresh-duration` (đề xuất 7 ngày; cấu hình theo môi trường).
- Cả hai có `sub`, `jti`, `iat`, `exp`, `ver`; access token có `scope`.
- `ver` bằng `User.tokenVersion` tại thời điểm phát hành.
- Resource server chỉ chấp nhận `typ=access`; `/auth/refresh` chỉ chấp nhận `typ=refresh`.
- Refresh rotation là bắt buộc: blacklist `jti` refresh cũ trong cùng transaction, sau đó phát cặp mới.
- Không fallback sang token cũ nếu response thiếu `refreshToken`.

Response chung cho password login và social login:

```json
{
  "result": {
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "Bearer",
    "expiresIn": 300,
    "refreshExpiresIn": 604800,
    "authenticated": true
  }
}
```

Refresh request/response:

```http
POST /api/auth/refresh
Content-Type: application/json

{ "refreshToken": "..." }
```

Response trả **cả access và refresh token mới**. Refresh token cũ phải trả `401` sau lần dùng thành công đầu tiên.

### ADR-P03 — Token revocation

- Thêm `token_version BIGINT NOT NULL DEFAULT 0` vào `user`.
- Decoder kiểm signature, expiry, `typ=access`, blacklist `jti`, user tồn tại, `enabled=true`, và claim `ver == user.tokenVersion`.
- Refresh kiểm tương tự nhưng yêu cầu `typ=refresh` và không dùng access expiry để tính refresh window.
- Đổi mật khẩu và reset mật khẩu tăng `tokenVersion` trong cùng transaction với password update.
- Logout hiện tại blacklist cả access và refresh `jti`; endpoint idempotent.
- Admin disable account có hiệu lực ngay vì decoder kiểm `enabled` trên mỗi request.

Logout contract:

```http
POST /api/auth/logout
Content-Type: application/json

{
  "accessToken": "...",
  "refreshToken": "..."
}
```

Endpoint logout được `permitAll` vì chính token trong body là proof-of-possession; cách này cho phép logout khi access token vừa hết hạn mà không bị resource-server filter chặn trước controller. Service chỉ blacklist `jti` sau khi chữ ký và `typ` hợp lệ. Response luôn idempotent `204 No Content` khi token đã revoke/hết hạn/không còn tồn tại; malformed token không làm thay đổi state và chỉ tạo security audit đã sanitize. Endpoint vẫn phải có request-size và rate limit.

### ADR-P04 — Email verification endpoints

Tách API JSON khỏi browser landing page:

- `POST /auth/verify-email` với body `{ "token": "..." }`: SPA dùng; success `200`, invalid/expired `400` với error code ổn định.
- `GET /auth/verify-email/complete?token=...`: link trong email dùng; trả HTML và status thật (`200` success, `400` invalid/expired).
- Cả hai gọi cùng một service method transactional và token chỉ dùng một lần.
- Không nhúng raw exception/token vào HTML. Escape mọi dynamic value.

### ADR-P05 — Account state và social linking

Giữ hai field hiện có với semantics tách biệt:

- `emailVerified`: bằng chứng email đã được xác minh.
- `enabled`: quyền đăng nhập do hệ thống/admin quyết định; social login **không bao giờ** tự đổi từ false sang true cho existing account.

Policy:

1. Existing user có `enabled=false`: trả `ACCOUNT_DISABLED`, không mutate user.
2. Google: bắt buộc issuer exact, audience đúng client ID, `email_verified=true`, `sub` tồn tại.
3. Thêm `googleSubject` unique; lookup social account bằng provider subject trước.
4. Facebook: gọi token debug endpoint và kiểm `is_valid`, `app_id`, expiry, user ID trước khi lấy profile.
5. Không tự link provider vào local account chỉ vì email khớp. Trả conflict `SOCIAL_LINK_REQUIRED`; việc link phải được thực hiện khi user đã đăng nhập local và re-authenticate.
6. New social account được tạo với `enabled=true`, `emailVerified=true` chỉ khi provider assurance ở trên pass.
7. Existing enabled nhưng local email chưa verify: social login không tự link; đi qua explicit linking flow.

### ADR-P06 — OTP/recovery challenge

Không tiếp tục lưu OTP plaintext. Dùng model challenge purpose-scoped:

```text
AuthChallenge
- id UUID
- subjectHash (HMAC của normalized email)
- purpose: PASSWORD_RESET | EMAIL_VERIFICATION_RESEND
- secretHash (HMAC-SHA-256 với server pepper riêng)
- expiresAt
- attemptCount
- maxAttempts (5)
- consumedAt nullable
- invalidatedAt nullable
- lastSentAt
- createdAt
- version (optimistic lock)
```

Rule mặc định:

- OTP 6 số, TTL 5 phút, tối đa 5 lần verify sai.
- Resend cooldown 60 giây theo email/purpose.
- Issue cap: 5 lần/giờ/email và 20 lần/giờ/IP.
- Verify cap: 10 lần/15 phút/email và 30 lần/15 phút/IP, đồng thời vẫn áp dụng `maxAttempts` của challenge.
- Tạo challenge mới invalidate challenge cũ cùng email/purpose.
- Verify/reset dùng compare constant-time; lần sai tăng counter atomic. Đạt max attempts thì invalidate.
- Reset thành công consume challenge và tăng `tokenVersion` trong **cùng transaction**.
- Forgot/resend luôn trả generic `202 Accepted`: “Nếu tài khoản hợp lệ, hướng dẫn đã được gửi.”
- Không log email đầy đủ, OTP, reset token, OAuth token hoặc JWT. Audit chỉ lưu subject fingerprint, outcome, IP fingerprint/correlation ID.

Per-email state phải ở DB để đúng trên nhiều request. Per-IP limiter có thể dùng Caffeine/Bucket4j cho deployment một instance; trước khi scale nhiều instance phải chuyển sang Redis/gateway/shared store. Chỉ tin `X-Forwarded-For` khi request đến từ trusted proxy đã cấu hình.

### ADR-P07 — Google Maps parsing không network

Giải pháp mặc định là loại bỏ primitive SSRF, không cố “lọc URL rồi vẫn fetch”:

- `parseGoogleMapsUrl` trở thành pure parser, tuyệt đối không mở connection và không theo redirect.
- Chấp nhận direct coordinates hoặc full Google Maps URL đã chứa coordinates.
- Short URL cần redirect expansion (`maps.app.goo.gl`, `goo.gl`) trả `422 MAP_LINK_REQUIRES_EXPANSION`; UI hướng dẫn người dùng mở link rồi copy full URL/toạ độ.
- Giới hạn input 2 KiB; reject userinfo, control characters và malformed URI.
- Nếu vẫn giữ hostname validation cho format, parse bằng `URI`, lowercase/IDN-normalize host và dùng exact allowlist; không dùng `contains("google.com")`.

Nếu product bắt buộc server-side short-link expansion, phải lập ADR mới. Implementation khi đó bắt buộc HTTPS-only, exact host allowlist, DNS resolution + block loopback/private/link-local/multicast/unspecified/metadata IP, connect tới validated address, revalidate từng redirect, tối đa 3 redirect, response cap 64 KiB, timeout ≤ 2 giây và egress firewall. Không được coi phương án này là mặc định.

## 4. Thay đổi theo batch

### P0 — Test baseline

Files dự kiến:

- `backend/src/test/java/.../controller/AuthenticationControllerIT.java`
- `backend/src/test/java/.../service/AuthenticationServiceTest.java`
- `backend/src/test/java/.../security/JwtLifecycleIT.java`
- `backend/src/test/java/.../service/StoreServiceUrlParserTest.java`
- frontend: thêm Vitest + React Testing Library; test auth client/flow thay vì test toàn bộ `App.jsx`.

Việc làm:

1. Thêm fixture/user factory và clock có thể inject; không dùng `LocalDateTime.now()` trực tiếp trong code mới.
2. Characterize status/body hiện tại cho login, verify, refresh, logout trước khi đổi.
3. Tạo test chứng minh H-01, M-16, M-17, M-19 và H-02 đang fail/unsafe; giữ test đỏ theo target contract rồi làm xanh ở batch tương ứng.

DoD: test chạy lặp lại, không gọi SMTP/OAuth/Internet thật, không phụ thuộc thứ tự.

### P1 — Registration + verification contract (H-01, M-17)

Backend files:

- `controller/AuthenticationController.java`
- `controller/UserController.java`
- `service/UserService.java`
- `dto/request/UserCreationRequest.java`
- thêm `dto/request/VerifyEmailRequest.java`
- `configuration/SecurityConfig.java`
- `exception/ErrorCode.java`
- email link builder trong `EmailService.java`

Frontend files:

- `frontend/src/App.jsx`
- `frontend/src/components/modals/AuthModal.jsx`
- khuyến nghị tách `frontend/src/services/authApi.js` và `frontend/src/services/apiClient.js`.

Steps:

1. Thêm `POST /auth/register`, trả 201.
2. Bỏ public `POST /users` và cập nhật security matcher.
3. Normalize email bằng trim + lowercase ở service trước lookup/save.
4. Gửi `dateOfBirth: regDob` từ UI; reset `regDob` sau success.
5. Đồng bộ min/max password UI và DTO thành 8..72.
6. Thêm JSON verify endpoint và đổi SPA sang POST.
7. Đổi email link sang `/auth/verify-email/complete` và trả đúng HTTP status.

Acceptance:

- Payload thiếu DOB, password 7 ký tự, email sai → 400 với error code ổn định.
- Payload hợp lệ → 201, user disabled/unverified, một verification token được tạo.
- Invalid/expired/used verification token không bao giờ hiện success trên SPA hoặc landing page.

### P2 — Token pair và rotation (M-16)

Backend files:

- `service/AuthenticationService.java`
- `dto/response/AuthenticationResponse.java`
- `dto/request/RefreshRequest.java`
- `configuration/CustomJwtDecoder.java`
- `application-*.yaml` templates
- migration thêm `user.token_version` và index/cleanup cần thiết cho `invalidated_token`.

Frontend files:

- `frontend/src/App.jsx`; nên chuyển logic sang `services/apiClient.js` và `services/tokenStore.js`.

Steps:

1. Tách `generateAccessToken`/`generateRefreshToken`; không còn boolean `isRefresh` mơ hồ.
2. Verify `typ`, `exp`, blacklist, `ver`, `enabled` theo credential type.
3. Login/social login trả pair theo ADR-P02.
4. Refresh rotation transactional: consume old refresh, issue pair mới.
5. Frontend lưu đúng hai field; xóa mọi fallback `refreshToken || accessToken` và `newRefreshToken || oldRefreshToken`.
6. Dùng single-flight refresh promise: nhiều request 401 cùng chờ một refresh; chỉ retry original request một lần.
7. Schedule refresh theo access `exp` trừ safety window 30–60 giây; không hard-code interval 10 phút.
8. Nếu refresh fail, clear credentials một lần và chuyển về logged-out state.

Acceptance:

- Access token không gọi được `/auth/refresh`; refresh token không truy cập resource.
- Một refresh token chỉ rotate thành công một lần.
- Hai request 401 đồng thời chỉ phát một refresh request từ browser.
- Không có empty refresh token sau password/social login.

### P3 — Logout và revoke khi đổi/reset mật khẩu (M-09, M-10)

Backend files:

- `controller/AuthenticationController.java`
- `service/AuthenticationService.java`
- `service/UserService.java`
- `dto/request/LogOutRequest.java`
- `configuration/CustomJwtDecoder.java`

Frontend files:

- `frontend/src/App.jsx` hoặc auth/session service đã tách.

Steps:

1. Frontend snapshot refresh token, gọi backend logout, rồi clear local state trong `finally`.
2. Backend blacklist access/refresh token còn hạn; duplicate logout không lỗi.
3. `changePassword` và `resetPassword` tăng `tokenVersion` atomic cùng password update.
4. Sau change/reset, frontend clear credentials và yêu cầu login lại; không giả định session hiện tại còn hợp lệ.
5. Decoder kiểm user state/version ở mọi authenticated request.

Acceptance:

- Token đã logout không refresh lại được.
- Access và refresh phát trước change/reset đều bị từ chối ngay sau transaction commit.
- Logout vẫn xóa local state khi network/backend lỗi.

### P4 — Social account state (M-19)

Backend files:

- `service/AuthenticationService.java` (nên tách `GoogleIdentityVerifier`, `FacebookIdentityVerifier`, `SocialAccountService`)
- `entity/User.java` hoặc entity `SocialIdentity`
- `repository/UserRepository.java`
- DTO/error codes/config provider
- migration unique provider subject.

Steps:

1. Check disabled trước mọi mutation.
2. Google validate exact issuer/audience/expiry/`email_verified`/`sub`.
3. Facebook debug token và bind app ID/user ID.
4. Lookup bằng provider subject; không auto-link email match.
5. Thêm authenticated explicit-link endpoint ở batch riêng hoặc trả `SOCIAL_LINK_REQUIRED`; không âm thầm giữ hành vi cũ.

Acceptance:

- Account disabled giữ nguyên mọi field sau Google/Facebook attempt.
- Token provider khác app/audience, email chưa verify, subject mismatch → reject.
- Email collision không tạo duplicate và không link ngầm.

### P5 — OTP/reset/resend abuse controls (H-03)

Backend files:

- thay `PasswordResetOtp` bằng/hoặc migrate sang `AuthChallenge`
- repository/service cho challenge và rate limit
- `AuthenticationController.java`, `AuthenticationService.java`, `UserService.java`
- `SecurityConfig.java`, `ErrorCode.java`, cấu hình `security.auth-abuse.*`
- migration dữ liệu: invalidate/remove OTP plaintext cũ.

Steps:

1. Thêm schema, HMAC pepper từ secret environment; không commit pepper.
2. Đưa forgot password và resend verification về generic 202.
3. Enforce email cooldown/caps trước gửi email và per-IP limiter trước service nặng.
4. Verify bằng challenge id hoặc latest active challenge; increment attempt atomic để request song song không vượt cap.
5. Consume/invalidate đúng transaction; reset gọi revoke-all qua `tokenVersion`.
6. Thêm structured audit/metrics không chứa secret/PII thô.

Acceptance:

- Email tồn tại/không tồn tại/disabled cho response status/body giống nhau ở forgot/resend.
- Sai lần thứ 5 khóa challenge; đúng OTP sau đó vẫn fail.
- Resend trong 60 giây không gửi email mới.
- OTP không xuất hiện plaintext trong DB/log/response.
- Hai reset song song với cùng challenge chỉ một request thành công.

### P6 — Remove SSRF primitive (H-02)

Backend files:

- `controller/StoreController.java`
- `service/StoreService.java` (nên tách `GoogleMapsCoordinateParser`)
- `ErrorCode.java`
- `SecurityConfig.java` nếu đổi route/method.

Frontend files:

- nơi gọi parse-gmaps/Map picker để xử lý `MAP_LINK_REQUIRES_EXPANSION`.

Steps:

1. Xóa toàn bộ `URL.openConnection`, `HttpURLConnection`, redirect loop và HTML body reading khỏi parser.
2. Parse coordinates thuần từ bounded string/URI.
3. Trả 422 cho short link không chứa coordinates; UI hiển thị hướng dẫn rõ.
4. Không log toàn URL vì query có thể chứa dữ liệu nhạy cảm; log correlation/outcome/host đã sanitize.

Acceptance:

- `http://127.0.0.1`, `http://[::1]`, RFC1918, link-local, metadata IP, decimal/octal/IPv6 variants và redirect URL đều không tạo outbound request.
- Test gắn fake HTTP server/DNS spy xác nhận số connection bằng 0.
- Full Google Maps URL/direct coordinate hợp lệ vẫn parse đúng.

## 5. Migration plan

Vì repository chưa có migration framework (H-05), mọi schema change trong P2/P4/P5 phải đi qua Flyway trước khi merge batch đó:

1. Thêm Flyway dependency; production giữ `ddl-auto=validate`.
2. Tạo baseline từ schema được review, không suy ra production schema chưa tồn tại.
3. Migrations gợi ý:
   - `V001__baseline.sql`
   - `V002__add_user_token_version.sql`
   - `V003__add_social_identity_subjects.sql`
   - `V004__create_auth_challenge.sql`
   - `V005__drop_legacy_plaintext_otp.sql` sau compatibility window.
4. Expand → deploy code/backfill → verify → contract ở release khác. Không drop cột OTP plaintext cùng release tạo schema mới nếu cần rollback.
5. Test migration từ empty DB và từ snapshot dev đã scrub; backup/restore rehearsal là gate trước production data.

## 6. Mandatory test matrix

### End-to-end auth chain

Phải có ít nhất một test tự động cho chuỗi:

```text
register
→ account disabled/unverified
→ verify email
→ login returns access+refresh
→ access resource
→ rotate refresh
→ old refresh rejected
→ logout
→ access/refresh rejected
```

Biến thể bắt buộc:

- verification token invalid, expired, already used;
- password sai, account unverified, account disabled;
- access expired nhưng refresh còn hạn;
- refresh expired/blacklisted/wrong type/wrong token version;
- concurrent refresh và concurrent OTP reset;
- password change/reset revoke access lẫn refresh cũ;
- disabled social account không mutate;
- Google/Facebook wrong issuer/audience/app/user binding;
- forgot/resend enumeration response parity và limit boundaries;
- SSRF payload corpus không có outbound connection.

### Test levels

- Unit: token claims/type, OTP hash/constant-time comparison, coordinate parser, state policy.
- Repository: atomic attempt increment, unique subject, blacklist lookup, migrations/indexes.
- MockMvc integration: status, JSON contract, security matcher, generic response.
- Frontend component/service: registration payload có DOB, verify dùng JSON endpoint, single-flight refresh, logout `finally` cleanup.
- E2E browser: happy path và session expiry/rotation/logout.

Không mock phần đang cần chứng minh. Ví dụ rotation integration test phải dùng repository thật; SSRF test phải chứng minh không có network call chứ không chỉ assert validation message.

## 7. Release gates

### Trước merge từng batch

- Backend compile/test pass; frontend lint/test/build pass.
- Contract examples trong tài liệu khớp DTO thực tế.
- Không có token/password/OTP trong log fixture hoặc DevConsole.
- Migration forward chạy được và `ddl-auto=validate` pass.
- Chỉ issue trong batch và dependency bắt buộc được thay đổi.

### Trước public Internet

- H-02 và H-03 đạt VERIFIED, không chỉ IMPLEMENTED.
- P1–P4 full auth matrix xanh.
- Proxy IP trust, TLS, CORS exact origins, cookie/header policy và rate-limit topology được kiểm ở môi trường deploy thật.
- Chạy dependency/security scan và kiểm secret configuration.
- Có alert cho rate-limit surge, repeated refresh reuse, OTP lockout, social-token failure; log đã redact.

## 8. Rollout và rollback

1. Đây là dự án chưa public: ưu tiên coordinated backend+frontend release và force re-login, không cần giữ contract token lỗi thời lâu dài.
2. Deploy additive migration trước code đọc cột mới.
3. Deploy backend hỗ trợ response mới, sau đó frontend mới; chỉ gỡ legacy field/route khi E2E pass.
4. Khi cutover, xóa `jwtToken`/`refreshToken` legacy khỏi browser storage và yêu cầu login lại nếu format không có `typ/ver`.
5. Rollback code không được rollback migration phá huỷ. Dùng forward-fix; chỉ drop legacy schema ở release sau.
6. P6 có thay đổi UX short link: release note rõ cách paste full URL/toạ độ. Nếu cần rollback UX, vẫn không khôi phục arbitrary server fetch.

## 9. File-level execution checklist

- [ ] P0 test harness và injectable clock.
- [ ] `AuthenticationController`: register, verify JSON/HTML split, refresh, logout contracts.
- [ ] `UserController`: bỏ public create-user path; change-password có `@Valid`.
- [ ] `UserCreationRequest`: DOB required; password 8..72; canonical validation.
- [ ] `AuthenticationResponse`: access/refresh pair và expiry metadata.
- [ ] `AuthenticationService`: typed token generation/verification/rotation; provider verifier delegation.
- [ ] `CustomJwtDecoder`: chỉ access token; kiểm blacklist, enabled, tokenVersion.
- [ ] `User`: tokenVersion và provider identity migration.
- [ ] `UserService`: password/verification state transitions transactional.
- [ ] OTP entity/repository: hashed challenge, atomic attempts/cooldown/consume.
- [ ] `SecurityConfig`: exact public routes; không dùng wildcard rộng cho auth mutation.
- [ ] `StoreService`: parser thuần, không network.
- [ ] `App.jsx`/auth client: DOB payload, new fields, single-flight refresh, backend logout.
- [ ] `AuthModal`: password constraints/text thống nhất.
- [ ] Email templates/links: new completion route, escaped dynamic values.
- [ ] Flyway migrations và migration tests.
- [ ] Full E2E chain + negative security matrices.

## 10. Definition of Done cho toàn blueprint

Chỉ đánh dấu hoàn tất khi:

- Tám issue đều có implementation evidence gồm commit, files, migration, tests và kết quả.
- Chuỗi `register → verify email → login → refresh rotation → logout` pass tự động.
- Đổi/reset password làm token cũ mất hiệu lực ngay.
- Social login không mutate disabled account và không auto-link bằng email.
- Recovery endpoints chống enumeration, brute-force, resend spam và race.
- Google Maps parser không có bất kỳ code path outbound network nào.
- Frontend/backend/OpenAPI/documentation dùng cùng contract.
- Không có application code nào dựa vào fallback token cũ hoặc HTTP 200 giả cho lỗi.

## 11. Implementation evidence template

Append record này sau mỗi batch; không đánh dấu VERIFIED nếu chưa chạy test tương ứng.

```md
### Batch Px — <name>

- Status: IMPLEMENTED | VERIFIED
- Commit/PR:
- Files changed:
- Migration:
- Tests added:
- Commands run và kết quả:
- Runtime/security verification:
- Deviations so với blueprint:
- Remaining risks:
```

## 12. Ngoài phạm vi

- Không redesign toàn bộ UI.
- Không tối ưu N+1/store lifecycle/upload/SSE ngoài dependency bắt buộc.
- Không dựng Redis, WAF hoặc multi-instance infrastructure khi chưa có topology thật; nhưng release gate phải ghi rõ giới hạn single-instance.
- Không pentest production hay khẳng định metadata/internal network reachable từ phân tích source.
- Không sửa application code trong bước lập blueprint này.
