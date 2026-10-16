# CG FoodTour — Tổng hợp triển khai 4 chỉnh sửa ưu tiên

> Ngày cập nhật: 16/10/2026  
> Trạng thái: Đã chỉnh sửa source và có test tự động  
> Phạm vi chính: H-02, H-01, H-03, M-16  
> Thay đổi đi kèm: M-17 được xử lý trong luồng xác minh email; M-09 được hoàn thành ở đợt follow-up

## 1. Mục đích tài liệu

Tài liệu này mô tả trạng thái thực tế sau khi triển khai bốn chỉnh sửa ưu tiên từ blueprint. Nội dung tập trung vào:

- Hành vi trước và sau khi sửa.
- Những gì đã thay đổi ở backend và frontend.
- API contract mà hai phía phải sử dụng.
- Ảnh hưởng đến database, cấu hình và quá trình deploy.
- Các kiểm thử đã thực hiện và giới hạn còn lại.

Đây là tài liệu tổng kết implementation, không thay thế `KNOWN_ISSUES.md` hoặc blueprint ban đầu.

## 2. Tổng quan thay đổi

| Issue | Trước khi sửa | Backend sau khi sửa | Frontend sau khi sửa |
|---|---|---|---|
| H-02 — SSRF Google Maps parser | Backend mở URL bất kỳ do client truyền vào và tự theo redirect | Parser trực tiếp kết hợp resolver giới hạn riêng cho Google Maps, kiểm tra lại từng redirect | URL đầy đủ được parse tại client/backend; URL rút gọn được backend mở rộng an toàn |
| H-01 — Registration contract | Frontend gọi sai endpoint, thiếu `dateOfBirth`, rule password không đồng nhất | Có endpoint canonical `POST /auth/register`, validation thống nhất | Gửi đúng payload, bao gồm ngày sinh; kiểm tra password 8–72 ký tự |
| M-17 — Verify email báo sai thành công | API và browser landing dùng chung GET endpoint, lỗi vẫn có thể trả HTTP 200 | Tách JSON action và HTML landing; token lỗi trả HTTP 400 | SPA gọi JSON endpoint bằng POST và chỉ báo thành công khi backend thành công thật |
| M-16 — Refresh token contract | Access token bị dùng như refresh token; response chỉ có `token` | Phát cặp access/refresh riêng, phân loại bằng claim `typ`, rotate refresh token | Lưu đúng hai token, refresh single-flight, cập nhật cả cặp token sau rotation |
| M-09 — Logout chỉ ở frontend | Backend logout không được gọi và chỉ nhận một access token | Logout nhận và thu hồi độc lập cả access/refresh token | Gọi backend logout trước khi xóa cặp token local; local logout không phụ thuộc network |
| H-03 — OTP/resend abuse | OTP plaintext, không attempt cap/rate limit/cooldown, response làm lộ account | OTP HMAC, giới hạn theo IP/email, cooldown, attempt cap, response generic | Tiếp tục dùng flow hiện tại nhưng nhận response generic và các lỗi rate-limit/OTP hợp lệ |

## 3. H-02 — Loại bỏ SSRF khỏi Google Maps parser

### 3.1. Hành vi cũ

Endpoint parse Google Maps nhận một URL do client kiểm soát. `StoreService` sử dụng `HttpURLConnection` để:

- Mở URL trên server.
- Tự theo các redirect.
- Đọc nội dung response để tìm tọa độ.

Điều này tạo đường SSRF đến localhost, private network, cloud metadata hoặc dịch vụ nội bộ.

### 3.2. Backend sau khi sửa

`parseGoogleMapsUrl` ưu tiên xử lý chuỗi đầu vào mà không thực hiện network:

1. Từ chối giá trị rỗng.
2. Từ chối chuỗi dài hơn 2.048 ký tự.
3. Từ chối ký tự điều khiển ISO.
4. Trích xuất tọa độ nếu chúng đã có trong URL hoặc chuỗi đầu vào.

Nếu URL chưa có tọa độ, `StoreService` chuyển việc mở rộng link cho `GoogleMapsUrlResolver`. Resolver áp dụng các ràng buộc sau:

- Chỉ chấp nhận HTTPS và port mặc định/443.
- Không chấp nhận URL chứa user-info.
- Host phải khớp chính xác một trong: `maps.app.goo.gl`, `goo.gl`, `google.com`, `www.google.com`, `maps.google.com`.
- Resolve toàn bộ địa chỉ DNS của host trước mỗi request.
- Từ chối loopback, private, link-local, multicast, CGNAT, documentation/test network và các địa chỉ không public khác.
- HTTP client không tự động follow redirect.
- Tự xử lý tối đa 5 redirect và kiểm tra lại scheme, hostname, port và IP DNS ở mỗi bước.
- Dừng ngay khi redirect URL đã chứa tọa độ.
- Timeout kết nối/request và giới hạn response body ở 256 KiB.

Như vậy backend có thể mở rộng Google Maps short link nhưng không còn là một general-purpose URL fetcher do client điều khiển.

### 3.3. Frontend và trải nghiệm người dùng

Frontend không cần đổi API contract. Tuy nhiên, hành vi thay đổi như sau:

| Dữ liệu người dùng nhập | Kết quả mới |
|---|---|
| Google Maps URL đầy đủ có `@latitude,longitude` | Backend trích xuất được tọa độ |
| URL có tọa độ trong query phù hợp parser hiện tại | Backend trích xuất được tọa độ |
| URL rút gọn như `maps.app.goo.gl/...` | Backend theo redirect đã kiểm soát và trích xuất tọa độ từ URL Google đích |
| URL nội bộ hoặc URL độc hại | Backend không kết nối đến đích |

Với link mẫu `https://maps.app.goo.gl/oW3cwtzLXYQXrYLN8`, Google trả redirect đến URL chứa tọa độ pin `!3d10.6031282!4d106.6565301`; backend ưu tiên cặp tọa độ pin này thay vì tọa độ viewport trong phần `@...`.

### 3.4. File chính

- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/StoreService.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/GoogleMapsUrlResolver.java`
- `backend/src/test/java/com/cangiuoc/cgfoodtour/service/StoreServiceUrlParserTest.java`
- `backend/src/test/java/com/cangiuoc/cgfoodtour/service/GoogleMapsUrlResolverTest.java`

## 4. H-01 và M-17 — Registration/verification contract

### 4.1. Endpoint đăng ký canonical

Endpoint đăng ký công khai duy nhất hiện là:

```http
POST /api/auth/register
Content-Type: application/json
```

Payload:

```json
{
  "username": "foodlover",
  "email": "user@example.com",
  "firstname": "Van",
  "lastname": "A",
  "password": "correct-horse",
  "dateOfBirth": "2000-01-20"
}
```

Kết quả thành công là `201 Created` với `ApiResponse<UserResponse>`.

Registration công khai qua `POST /users` đã bị loại bỏ. `/users` không còn nằm trong danh sách public endpoint của Spring Security.

### 4.2. Validation thống nhất

| Field | Backend | Frontend |
|---|---|---|
| `username` | Bắt buộc, 3–20 ký tự | Gửi giá trị đã trim |
| `email` | Email hợp lệ, được normalize về lowercase | Gửi giá trị đã trim/lowercase |
| `password` | Bắt buộc, 8–72 ký tự | Chặn ngoài khoảng 8–72 và đặt `minLength`/`maxLength` tương ứng |
| `dateOfBirth` | Bắt buộc theo validator hiện tại, tuổi tối thiểu 5 | Được đưa vào registration payload |

Sau khi đăng ký thành công, frontend xóa cả state ngày sinh cùng các field đăng ký khác.

### 4.3. JSON verify-email dành cho SPA

Frontend xác minh email bằng contract sau:

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token"
}
```

- Token hợp lệ: trả response thành công và frontend hiển thị thành công.
- Token rỗng/sai/hết hạn: trả error response; frontend không còn báo thành công giả.

### 4.4. Landing page dành cho link trong email

Link gửi qua email hiện trỏ đến:

```http
GET /api/auth/verify-email/complete?token=...
```

Hành vi:

- Token hợp lệ: HTTP 200 và HTML success page.
- Token nghiệp vụ không hợp lệ: HTTP 400 và HTML error page.
- Nội dung email/error đưa vào HTML được escape trước khi render.

Việc tách hai endpoint giúp browser landing page và SPA API không còn dùng lẫn response semantics.

### 4.5. File chính

- `backend/src/main/java/com/cangiuoc/cgfoodtour/controller/AuthenticationController.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/controller/UserController.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/configuration/SecurityConfig.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/UserCreationRequest.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/VerifyEmailRequest.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/UserService.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/EmailService.java`
- `frontend/src/App.jsx`
- `frontend/src/components/modals/AuthModal.jsx`

## 5. M-16 — Access/refresh token pair và rotation

### 5.1. Authentication response mới

Login thường, Google login và Facebook login trả cùng một cấu trúc:

```json
{
  "result": {
    "accessToken": "access-jwt",
    "refreshToken": "refresh-jwt",
    "tokenType": "Bearer",
    "expiresIn": 300,
    "refreshExpiresIn": 3600,
    "authenticated": true
  }
}
```

TTL thực tế lấy từ cấu hình `jwt.valid-duration` và `jwt.refreshable-duration`; các số trong ví dụ chỉ mang tính minh họa.

### 5.2. Phân loại token ở backend

JWT có claim mới:

- Access token: `typ=access`, có scope/role để gọi API.
- Refresh token: `typ=refresh`, không được chấp nhận như access token.

Introspection và API authentication chỉ chấp nhận access token. Refresh endpoint chỉ chấp nhận refresh token.

### 5.3. Refresh contract

Request:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "current-refresh-jwt"
}
```

Khi refresh thành công, backend:

1. Xác minh chữ ký, expiry và `typ=refresh`.
2. Kiểm tra refresh token chưa nằm trong blacklist.
3. Blacklist `jti` của refresh token vừa dùng.
4. Kiểm tra user vẫn tồn tại và đang enabled.
5. Trả một cặp access/refresh token hoàn toàn mới.

Refresh token cũ không được reuse sau rotation.

### 5.4. Frontend session lifecycle mới

Frontend hiện:

- Chỉ chấp nhận authentication response khi có cả `accessToken` và `refreshToken`.
- Lưu access token vào `jwtToken` và refresh token vào `refreshToken` trong local storage.
- Đọc claim `exp` của access token để lên lịch refresh trước khi hết hạn.
- Dùng một shared promise để nhiều request 401 không đồng thời rotate cùng một refresh token.
- Sau refresh, thay thế cả access token và refresh token trong state/local storage.
- Retry request ban đầu đúng một lần với access token mới.
- Không gắn access token cũ vào các `/auth/*` public request.
- Logout local nếu refresh thất bại hoặc request retry tiếp tục nhận 401.

### 5.5. Tác động khi deploy

Token được tạo bởi phiên bản cũ không có claim `typ`, vì vậy chúng sẽ không vượt qua validation mới. Người dùng đang đăng nhập sẽ cần đăng nhập lại một lần sau khi deploy.

### 5.6. Logout lifecycle

Frontend gửi cặp token hiện tại đến backend:

```http
POST /api/auth/logout
Content-Type: application/json

{
  "accessToken": "current-access-jwt",
  "refreshToken": "current-refresh-jwt"
}
```

Backend kiểm tra đúng `typ` của từng token và thêm cả hai `jti` vào bảng invalidated token. Việc thu hồi được xử lý độc lập và idempotent: access token hết hạn, malformed hoặc đã bị thu hồi không ngăn backend tiếp tục thu hồi refresh token.

Frontend bắt đầu request thu hồi trước khi xóa token local, nhưng dọn state/local storage ngay để thao tác logout không bị treo theo network. Request có timeout 3 giây; backend không phản hồi vẫn không ngăn người dùng thoát khỏi phiên local. Các lời gọi logout đồng thời dùng chung một promise để tránh gửi nhiều request revoke trùng nhau.

### 5.7. File chính

- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/RefreshRequest.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/response/AuthenticationResponse.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/AuthenticationService.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/controller/AuthenticationController.java`
- `frontend/src/App.jsx`

## 6. H-03 — Chống abuse cho OTP và resend

### 6.1. Response chống account enumeration

Forgot-password và resend-verification không còn xác nhận email có tồn tại hay không.

```http
POST /api/auth/forgot-password
```

Trả `202 Accepted` với thông điệp tương đương:

```text
If the account is eligible, password reset instructions will be sent.
```

```http
POST /api/auth/resend-verification?email=user@example.com
```

Trả `202 Accepted` với thông điệp tương đương:

```text
If the account is eligible, a verification email will be sent.
```

Đối với forgot-password, email không tồn tại, account disabled hoặc chưa verify đều nhận cùng response generic và không được gửi OTP. Đối với resend-verification, email không tồn tại hoặc account đã verify cũng nhận response generic. Trạng thái disabled trong social/account flow vẫn thuộc phạm vi M-19 và chưa được giải quyết ở đợt này.

### 6.2. Giới hạn hiện tại

| Loại kiểm soát | Giới hạn |
|---|---:|
| Phát OTP/verification theo email | 5 lần/giờ |
| Phát OTP/verification theo IP | 20 lần/giờ |
| Verify/reset attempt theo email | 10 lần/15 phút |
| Verify/reset attempt theo IP | 30 lần/15 phút |
| Cooldown phát lại cùng challenge | 1 phút |
| OTP sai trên một challenge | Tối đa 5 lần |
| Thời hạn OTP | 5 phút |

Khi vượt giới hạn, backend trả lỗi `AUTH_RATE_LIMITED` với HTTP 429.

Rate limit IP hiện lấy từ `HttpServletRequest.getRemoteAddr()`. Nếu deploy sau reverse proxy, phải cấu hình proxy và chiến lược trusted forwarded headers trước khi muốn dùng địa chỉ client thực; không nên tin trực tiếp `X-Forwarded-For` từ Internet.

### 6.3. Lưu OTP an toàn hơn

Database vẫn dùng tên column `otp` để migration đơn giản, nhưng Java entity ánh xạ column này thành `otpHash`.

Giá trị lưu là HMAC-SHA256 của email đã normalize và OTP, sử dụng secret pepper:

```yaml
security:
  otp:
    pepper: ${OTP_PEPPER:${JWT_SIGNER_KEY}}
```

Production phải cấu hình `OTP_PEPPER` riêng, ngẫu nhiên và không commit vào source. Fallback về JWT key chỉ giúp cấu hình cũ không bị lỗi khởi động; không phải cấu hình production khuyến nghị.

Backend so sánh OTP hash bằng constant-time comparison. OTP plaintext chỉ tồn tại đủ lâu để gửi email và không còn được ghi vào application log.

### 6.4. Attempt lifecycle

Khi verify hoặc reset:

1. Normalize email.
2. Áp dụng limiter theo email và IP.
3. Lock challenge mới nhất bằng pessimistic write lock.
4. Kiểm tra trạng thái used, expiry và số lần sai.
5. So sánh HMAC.
6. Nếu sai, tăng `failed_attempts`.
7. Đủ 5 lần sai thì đánh dấu challenge đã dùng để vô hiệu hóa.
8. Reset password thành công cũng đánh dấu challenge đã dùng.

Transaction của verify/reset giữ thay đổi attempt counter ngay cả khi trả `AppException`, tránh việc rollback vô tình làm mất số lần thử sai.

### 6.5. Database migration bắt buộc

Migration nằm tại:

```text
backend/documents/migrations/V20261016_01__harden_password_reset_otp.sql
```

Migration thực hiện:

- Mở rộng column `otp` lên `VARCHAR(64)` để chứa SHA-256 hex.
- Thêm `failed_attempts INT NOT NULL DEFAULT 0`.
- Vô hiệu hóa các OTP plaintext còn active trước cutover.
- Thêm index `(email, created_at)`.

Dự án hiện chưa có migration runner tự động được xác nhận trong phạm vi này, vì vậy SQL phải được chạy thủ công hoặc đưa vào pipeline database hiện có trước khi khởi động application version mới.

### 6.6. Giới hạn kiến trúc hiện tại

`AuthAbuseProtectionService` dùng `ConcurrentHashMap`, do đó:

- Counter bị reset khi application restart.
- Mỗi backend instance có counter riêng.
- Không bảo đảm global limit khi horizontal scaling.

Với production nhiều instance, cần chuyển counter sang Redis hoặc một shared rate-limit store có TTL và atomic increment.

### 6.7. File chính

- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/AuthAbuseProtectionService.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/AuthenticationService.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/entity/PasswordResetOtp.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/repository/PasswordResetOtpRepository.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/VerifyOtpRequest.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/ResetPasswordRequest.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/exception/ErrorCode.java`
- `backend/src/main/resources/application-prod.yaml`
- `backend/src/main/resources/application-dev.yaml.example`

## 7. Luồng người dùng sau thay đổi

### 7.1. Đăng ký và xác minh email

```text
Frontend
  → POST /auth/register với dateOfBirth và password 8–72
Backend
  → tạo account chưa xác minh
  → tạo verification token
  → gửi link /auth/verify-email/complete?token=...
User mở email
  → token đúng: HTTP 200 success page
  → token sai/hết hạn: HTTP 400 error page
```

SPA cũng có thể xác minh bằng `POST /auth/verify-email` với JSON body.

### 7.2. Login và refresh

```text
Login
  → backend trả accessToken + refreshToken
  → frontend lưu riêng hai token
  → frontend dùng accessToken để gọi protected API
  → gần hết hạn hoặc gặp 401, frontend gửi refreshToken
  → backend blacklist refreshToken cũ
  → backend trả cặp token mới
  → frontend thay thế cả hai token và retry request một lần
```

### 7.3. Forgot/reset password

```text
Forgot password
  → backend luôn trả response generic nếu request hợp lệ về format
  → account đủ điều kiện mới được tạo OTP HMAC và gửi email
Verify/reset
  → áp dụng limit theo email/IP
  → mỗi OTP chỉ có tối đa 5 lần sai và hết hạn sau 5 phút
  → reset thành công consume OTP
```

## 8. Kiểm thử đã bổ sung

| Test | Nội dung chính |
|---|---|
| `AuthenticationControllerTest` | Registration contract, DOB validation, JSON verify-email, HTTP status của landing page và logout token-pair contract |
| `AuthenticationServiceTest` | Cặp token có type đúng, refresh rotation, thu hồi cả access/refresh khi logout, OTP chỉ lưu hash, challenge bị khóa sau 5 lần sai |
| `AuthAbuseProtectionServiceTest` | Request phát challenge vượt giới hạn theo email bị chặn |
| `StoreServiceUrlParserTest` | Parse tọa độ trực tiếp, nhận tọa độ từ short-link resolver, ưu tiên tọa độ pin, từ chối input oversized/control-character |
| `GoogleMapsUrlResolverTest` | Chỉ theo redirect allowlisted, từ chối HTTP/unknown host/private DNS/unsafe redirect và phân loại địa chỉ public/private |

Kết quả kiểm chứng tại thời điểm cập nhật tài liệu:

- Backend: 16 test, 0 failure, Maven `BUILD SUCCESS`.
- Frontend: `npm run build` thành công.
- Frontend: `npm run lint` trả exit code 0; repository vẫn có các warning cũ ngoài phạm vi thay đổi.
- `git diff --check`: không có whitespace error; chỉ có cảnh báo chuyển line ending LF/CRLF trên Windows.

Chưa thực hiện E2E với SMTP, OAuth provider, reverse proxy và database production thật.

## 9. Checklist deploy

- [ ] Backup bảng `password_reset_otp`.
- [ ] Chạy `V20261016_01__harden_password_reset_otp.sql`.
- [ ] Cấu hình `OTP_PEPPER` riêng, đủ mạnh.
- [ ] Xác nhận `JWT_SIGNER_KEY`, access TTL và refresh TTL ở production.
- [ ] Thông báo hoặc chấp nhận việc session cũ phải login lại do thiếu claim `typ`.
- [ ] Kiểm tra reverse proxy/IP policy cho rate limiter.
- [ ] Xác nhận hệ thống đang chạy một backend instance; nếu không, chuyển rate limiter sang shared store.
- [ ] Smoke test URL Google Maps đầy đủ và short link `maps.app.goo.gl` từ môi trường production.
- [ ] Chạy E2E: register → nhận email → verify → login → refresh → protected API.
- [ ] Chạy E2E: login → logout → access token và refresh token cũ đều không thể tái sử dụng.
- [ ] Chạy E2E: forgot password → OTP sai 5 lần → challenge bị vô hiệu hóa.
- [ ] Chạy E2E: forgot password → OTP đúng → reset → login bằng password mới.

## 10. Những issue chưa nằm trong đợt sửa này

- M-10: đổi/reset password chưa revoke toàn bộ access JWT cũ.
- M-19: social login vẫn cần audit riêng để bảo đảm account disabled không bị bật lại.

Hai issue trên vẫn cần hoàn thành trước khi xem auth/session lifecycle là hoàn chỉnh cho production.
