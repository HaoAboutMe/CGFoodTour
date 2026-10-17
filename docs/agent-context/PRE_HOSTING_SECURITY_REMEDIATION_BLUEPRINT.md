# CG FoodTour — Pre-hosting Security Remediation Blueprint

> Trạng thái: đã triển khai source và automated verification ngày 17/10/2026; manual browser E2E vẫn cần thực hiện.  
> Phạm vi: bốn nhóm lỗi ưu tiên trước khi public website: chống brute-force đăng nhập; error/credential disclosure; store visibility/public DTO; User API authorization/validation.  
> Ngoài phạm vi: migration production hoàn chỉnh, upload lifecycle, store state machine, counter concurrency và cấu hình hosting cụ thể.

## 1. Mục tiêu và nguyên tắc

Sau khi hoàn thành blueprint này, hệ thống phải đạt các kết quả sau:

1. Không thể thử mật khẩu hoặc gọi social provider không giới hạn qua các endpoint public.
2. Client không nhận SQL, tên constraint, stack trace hoặc chi tiết nội bộ.
3. DevConsole không giữ password, OTP hoặc token và không xuất hiện trong production build.
4. Anonymous user không đọc được quán hoặc món ăn chưa public.
5. Public store response không chứa dữ liệu owner/moderation nội bộ.
6. `GET /users/{id}` không còn dùng `returnObject` trong `@PreAuthorize`.
7. Các request cập nhật user được validate thống nhất ở backend và frontend.

Nguyên tắc triển khai:

- Backend là nơi cưỡng chế security; không dựa vào việc frontend ẩn nút.
- Không thay đổi đồng thời quá nhiều contract trong một commit.
- Mỗi batch phải có test trước khi chuyển sang batch kế tiếp.
- Response public phải dùng allowlist field, không map toàn bộ entity rồi xóa bớt field.
- Không log raw password, OTP, access token, refresh token hoặc social token.
- Trong giai đoạn một backend instance, rate limiter có thể in-memory nhưng phải có TTL và giới hạn kích thước.

## 2. Phạm vi issue và trạng thái đích

| Nhóm | Issue | Trạng thái hiện tại | Trạng thái đích |
|---|---|---|---|
| A | Login brute-force/account enumeration | Chưa có trong danh sách cũ | Có limiter IP/account, lỗi credential generic |
| B | M-01 DB detail disclosure | Confirmed | Client chỉ nhận lỗi generic, server giữ chi tiết trong log |
| B | M-11 Runtime error semantics | Confirmed | Unexpected exception trả HTTP 500 và được log |
| B | M-15 DevConsole secrets | Confirmed | Redact đệ quy và không render ở production |
| C | M-04 Food-item visibility bypass | Confirmed | Dùng chung policy với store |
| C | M-02 Public owner/moderation data | Confirmed | Public DTO tách khỏi management DTO |
| D | M-18 Invalid pre-authorization | Confirmed | Endpoint theo ID chỉ dành cho admin; self dùng `/users/me` |
| D | M-05 Validation inconsistent | Confirmed | `@Valid` và rule DTO/frontend thống nhất |

## 3. Các quyết định đã chốt cho đợt triển khai

### 3.1. Login response

- Email không tồn tại và password sai cùng trả:
  - HTTP `401 Unauthorized`.
  - code mới `INVALID_CREDENTIALS` — đề xuất số `1026`.
  - message public: `Email or password is incorrect`.
- Chỉ sau khi password đúng mới được trả:
  - `EMAIL_NOT_VERIFIED`;
  - `ACCOUNT_DISABLED`.
- Không thay đổi `PASSWORD_INCORRECT` đang dùng cho change-password; lỗi này tiếp tục là HTTP 400 để frontend không hiểu nhầm access token hết hạn.
- Khi vượt limiter, giữ `AUTH_RATE_LIMITED` và HTTP 429.

### 3.2. Rate-limit mặc định

Các giá trị phải đưa vào configuration, không hard-code trong controller:

| Luồng | Key | Giới hạn ban đầu | Window |
|---|---|---:|---:|
| Email/password login failure | normalized email | 10 | 15 phút |
| Email/password login attempt | remote IP | 30 | 15 phút |
| Google login | remote IP | 20 | 5 phút |
| Facebook login | remote IP | 20 | 5 phút |

Quy tắc:

- Kiểm tra IP limit trước khi thực hiện BCrypt hoặc gọi social provider.
- Chỉ tăng account failure counter khi email không tồn tại hoặc password sai.
- Login thành công xóa failure counter của email; không xóa IP counter.
- Unknown email vẫn chạy `passwordEncoder.matches` với một dummy BCrypt hash cố định được tạo khi service khởi tạo để giảm chênh lệch timing.
- Không ghi email/password/social token vào log khi bị chặn.
- `HttpServletRequest.getRemoteAddr()` là nguồn IP trong môi trường local. Chỉ dùng forwarded header sau khi có trusted reverse proxy.

### 3.3. Error contract

- `DataIntegrityViolationException` trả:
  - HTTP `409 Conflict`;
  - code mới `DATA_CONFLICT` — đề xuất số `1027`;
  - message `Request conflicts with existing data`.
- `RuntimeException` không được phân loại trả:
  - HTTP `500 Internal Server Error`;
  - `UNCATEGORIZED_EXCEPTION`;
  - message public đổi thành `Internal server error`.
- Backend log exception đầy đủ bằng `log.error`, nhưng không đưa root-cause message vào response.
- Validation tiếp tục trả HTTP 400.
- `AppException` tiếp tục dùng status từ `ErrorCode`.

### 3.4. Store API boundary

Tách rõ hai audience:

1. Public browsing chỉ thấy quán `APPROVED` và dùng `PublicStoreResponse`.
2. Owner/admin management dùng `StoreManagementResponse` và endpoint có authentication.

Contract đích:

| Endpoint | Quyền | Response | Visibility |
|---|---|---|---|
| `GET /v1/stores` | Public | `List<PublicStoreResponse>` | Chỉ `APPROVED` |
| `GET /v1/stores/{id}` | Public | `PublicStoreResponse` | Chỉ `APPROVED`; còn lại trả 404 |
| `GET /v1/stores/random` | Public | `PublicStoreResponse` | Chỉ `APPROVED` |
| `GET /v1/stores/ranking` | Public | `List<PublicStoreResponse>` | Chỉ `APPROVED` |
| `GET /v1/stores/saved` | Authenticated | `List<PublicStoreResponse>` | Chỉ store còn `APPROVED` |
| `GET /v1/stores/mine` | Authenticated | `List<StoreManagementResponse>` | Chỉ store của principal, mọi trạng thái |
| `GET /v1/stores/admin` | ADMIN | `List<StoreManagementResponse>` | Mọi store |
| Mutation store | Owner hoặc ADMIN tùy action | `StoreManagementResponse` | Theo authorization hiện có |

`PublicStoreResponse` chỉ chứa dữ liệu cần cho khám phá quán:

- ID/category/name/address/landmark/coordinates/map URL hợp lệ.
- Giờ mở cửa, giá, banner, trạng thái verified.
- Counter rating/save, public food items, reported-closed indicator.
- `ownerUsername` chỉ giữ nếu UI thực sự cần hiển thị; mặc định loại bỏ.

Không được chứa:

- `ownerId`, `ownerEmail`, firstname/lastname owner.
- `rejectionReason`, `hideReason`.
- `hiddenByAdmin`, `recoveryRequested`, `recoveryRequestReason`, `recoveryDeclineReason`.
- Trạng thái moderation nội bộ ngoài trạng thái public cần thiết.

`StoreManagementResponse` có thể giữ dữ liệu owner/moderation cần cho màn hình My Stores/Admin.

### 3.5. User API boundary

- `GET /users/{userId}` trở thành ADMIN-only.
- Self-service chỉ dùng `GET /users/me`.
- Frontend hiện đã dùng `/users/me` cho profile nên thay đổi này không làm vỡ self-service.
- `PUT /users/{userId}` tiếp tục ADMIN-only.
- `PUT /users/me` tiếp tục dành cho principal hiện tại.
- Admin update roles bắt buộc có ít nhất một role hợp lệ; không chấp nhận `null`.
- Tuổi tối thiểu thống nhất là 18 cho register, self update và admin update.

## 4. Thiết kế triển khai chi tiết

## Batch A — Login abuse protection

### A1. Backend configuration

Thêm cấu hình vào `application-dev.yaml.example` và `application-prod.yaml`:

```yaml
security:
  auth-rate-limit:
    login-email-limit: 10
    login-ip-limit: 30
    login-window: 15m
    social-ip-limit: 20
    social-window: 5m
    maximum-keys: 10000
```

Tạo `AuthRateLimitProperties` bằng `@ConfigurationProperties` để bind và validate giá trị dương.

### A2. Bounded limiter

Refactor `AuthAbuseProtectionService` hoặc tách `LoginAbuseProtectionService`:

- Inject `Clock` để test window reset không dùng sleep.
- Cache phải có TTL và `maximumSize`; khuyến nghị Caffeine.
- Các method đích:

```java
void checkLoginIp(String clientIp);
void recordLoginFailure(String normalizedEmail, String clientIp);
void recordLoginSuccess(String normalizedEmail);
void checkSocialLoginIp(String provider, String clientIp);
```

Nếu không thêm dependency Caffeine, implementation map hiện tại phải có hard cap và eviction xác định; không chỉ xóa record đã expired khi map vượt 10.000 phần tử.

### A3. Authentication flow

Đổi signature service để nhận client IP:

```java
AuthenticationResponse authenticate(AuthenticationRequest request, String clientIp);
AuthenticationResponse googleAuthenticate(GoogleLoginRequest request, String clientIp);
AuthenticationResponse facebookAuthenticate(FacebookLoginRequest request, String clientIp);
```

Email/password flow:

```text
normalize email
→ check IP limit
→ find user
→ user không tồn tại: dummy BCrypt + record failure + INVALID_CREDENTIALS
→ password sai: record failure + INVALID_CREDENTIALS
→ password đúng: clear email failure
→ check emailVerified/enabled
→ issue token pair
```

Social flow:

```text
check provider/IP limit
→ mới decode token hoặc gọi provider
→ giữ provider-specific invalid-token response
→ issue application token pair nếu hợp lệ
```

Controller truyền `httpRequest.getRemoteAddr()` cho cả ba login endpoint.

### A4. Frontend

- Login hiển thị message generic từ `INVALID_CREDENTIALS`.
- Giữ logic chuyển sang verify screen khi nhận `EMAIL_NOT_VERIFIED`.
- Với HTTP 429, hiển thị thông báo chờ thử lại; không tự retry.
- Không thay đổi cơ chế refresh khi lỗi xảy ra tại `/auth/token` vì endpoint này đã được loại khỏi auto-refresh.

### A5. Tests bắt buộc

- Unknown email và wrong password trả cùng code/status/message.
- Unknown email thực hiện dummy password comparison.
- Password đúng nhưng email chưa verify vẫn trả `EMAIL_NOT_VERIFIED`.
- Failure thứ 11 theo email bị HTTP 429.
- Request thứ 31 theo IP bị HTTP 429.
- Login thành công reset failure counter email.
- Sau khi `Clock` vượt window, request được phép lại.
- Google/Facebook bị chặn trước outbound provider call khi vượt IP limit.
- Cache không vượt `maximum-keys` trong test tạo nhiều identity khác nhau.

### A6. File dự kiến

- `backend/src/main/java/.../controller/AuthenticationController.java`
- `backend/src/main/java/.../service/AuthenticationService.java`
- `backend/src/main/java/.../service/AuthAbuseProtectionService.java`
- `backend/src/main/java/.../configuration/AuthRateLimitProperties.java` (mới)
- `backend/src/main/java/.../exception/ErrorCode.java`
- `backend/src/main/resources/application-prod.yaml`
- `backend/src/main/resources/application-dev.yaml.example`
- `frontend/src/App.jsx`
- Backend tests cho service/controller/rate limiter.

### A7. Definition of Done

- Không phân biệt được unknown email và wrong password từ response.
- Limiter chạy deterministic trong test và không tăng memory không giới hạn.
- Social limiter chạy trước network call.
- Luồng pending account/resend hiện tại không bị vỡ.

## Batch B — Safe errors và DevConsole redaction

### B1. Backend handler

Sửa `GlobalExceptionHandler`:

- Runtime handler dùng `ResponseEntity.status(INTERNAL_SERVER_ERROR)`.
- Gọi `log.error("Unhandled exception", exception)`.
- Data-integrity handler log server-side và trả `DATA_CONFLICT` generic.
- Không gọi `exception.getRootCause().getMessage()` để dựng response.
- Không log validation payload hoặc secret; metadata constraint validation có thể log ở DEBUG nếu cần.

Không map mọi integrity error thành một business message cụ thể. Các conflict đã biết như duplicate email/username phải được phát hiện trong service và ném `AppException` riêng; handler integrity chỉ là safety net.

### B2. Frontend redaction

Tạo utility thuần, ví dụ `frontend/src/utils/redactSensitiveData.js`:

```text
redactSensitiveData(value)
```

Yêu cầu:

- Duyệt object/array đệ quy mà không mutate input.
- So sánh key không phân biệt hoa thường.
- Redact ít nhất: `password`, `oldPassword`, `newPassword`, `otp`, `token`, `idToken`, `accessToken`, `refreshToken`, `authorization`, `appSecret`.
- Với `FormData`, chỉ log tên field và metadata file (`name`, `type`, `size`), không log bytes.
- Áp dụng cho cả request body và response body trước khi lưu vào `consoleLogs`.

Production behavior:

- `logEvent` trở thành no-op khi `!import.meta.env.DEV`.
- Chỉ render `DevConsole` và status pill khi `import.meta.env.DEV`.
- Không dùng CSS-only hide vì component/state vẫn tồn tại trong runtime.

### B3. Tests bắt buộc

Backend:

- Runtime exception trả 500 và generic message.
- Data integrity trả 409 và response không chứa root-cause/constraint/table name.
- `AppException` và validation status không bị thay đổi.

Frontend utility:

- Redact nested objects và arrays.
- Không mutate input.
- Redact cả request/response token pair.
- Giữ field không nhạy cảm để DevConsole còn hữu ích ở development.

Có thể dùng `node:test` cho utility thuần để không phải thêm test framework frontend trong batch này.

### B4. File dự kiến

- `backend/src/main/java/.../exception/GlobalExceptionHandler.java`
- `backend/src/main/java/.../exception/ErrorCode.java`
- `backend/src/test/java/.../exception/GlobalExceptionHandlerTest.java` (mới)
- `frontend/src/App.jsx`
- `frontend/src/components/common/DevConsole.jsx`
- `frontend/src/utils/redactSensitiveData.js` (mới)
- `frontend/src/utils/redactSensitiveData.test.js` (mới)
- `frontend/package.json` nếu thêm script chạy `node --test`.

### B5. Definition of Done

- Không có response nào chứa SQL/constraint/root-cause detail.
- Unexpected exception được ghi log và trả HTTP 500.
- Password/OTP/token không xuất hiện trong `consoleLogs`.
- Production build không render DevConsole.

## Batch C — Store visibility và DTO boundary

### C1. Central visibility policy

Tạo `StoreVisibilityPolicy` với interface rõ ràng:

```java
boolean canViewPublicly(Store store);
boolean canManage(Store store, User user);
void requireReadable(Store store, User userOrNull);
```

Rule:

- Anonymous/regular unrelated user: chỉ `APPROVED`.
- Owner: được đọc store và food item của store mình ở mọi trạng thái.
- Admin: được đọc mọi trạng thái.
- Khi user không có quyền đọc resource chưa public, ném `STORE_NOT_FOUND` hoặc `FOOD_ITEM_NOT_FOUND`, không trả 403.
- Mutation vẫn dùng 403 khi resource đã được xác định và principal không có quyền thao tác.

### C2. Public và management DTO

Tạo:

- `PublicStoreResponse`.
- `StoreManagementResponse`.
- Mapper riêng hoặc mapping method rõ tên cho từng audience.

Không tái sử dụng một DTO rồi set field nhạy cảm thành null vì field vẫn dễ bị vô tình map lại trong tương lai.

Refactor helper enrichment (`foodItems`, report flag, save flag) để dùng được cho cả hai DTO mà không tạo thêm N+1 ngoài mức hiện tại. Tối ưu N+1 toàn bộ vẫn thuộc M-06 và không bắt buộc trong batch này.

### C3. Store endpoints

- `GET /v1/stores` query/filter `APPROVED` từ repository thay vì `findAll` rồi filter trong Java nếu repository method phù hợp.
- Thêm `GET /v1/stores/mine`.
- Thêm `GET /v1/stores/admin` với `hasRole('ADMIN')`.
- Public detail của non-approved store trả 404.
- Mutation response dùng management DTO.
- Saved/random/ranking dùng public DTO.

### C4. Food-item endpoints

`FoodItemService` cần nhận principal email nullable ở hai public GET:

```java
getFoodItemsByStore(String storeId, String principalEmail)
getFoodItem(Long id, String principalEmail)
```

Controller lấy optional principal giống `StoreController` và truyền xuống service.

Trước khi map response:

- Lấy store từ item hoặc `storeId`.
- Gọi `StoreVisibilityPolicy.requireReadable`.
- Không trả item của pending/rejected/hidden store cho anonymous/unrelated user.

### C5. Frontend migration

Không còn dùng `GET /v1/stores` để lấy pending store:

- Explore/public state tải từ `GET /v1/stores`.
- My Stores tải từ `GET /v1/stores/mine`.
- Admin pending/moderation tải từ `GET /v1/stores/admin`.
- Không xác định owner bằng cách so sánh `ownerEmail` từ public DTO.
- Owner/admin UI dùng management response từ endpoint được bảo vệ.

Trong giai đoạn chuyển đổi, không xóa field khỏi DTO cũ trước khi frontend đã chuyển sang endpoint mới trong cùng batch/commit series.

### C6. Tests bắt buộc

Store matrix:

| Actor | APPROVED | PENDING | REJECTED | HIDDEN own | HIDDEN other |
|---|---:|---:|---:|---:|---:|
| Anonymous | 200 | 404 | 404 | 404 | 404 |
| Regular unrelated | 200 | 404 | 404 | 404 | 404 |
| Owner | 200 | 200 management | 200 management | 200 management | 404 |
| Admin | 200 | 200 management | 200 management | 200 management | 200 management |

Food-item matrix phải chạy cho cả:

- `GET /v1/food-items/store/{storeId}`.
- `GET /v1/food-items/{id}`.

DTO assertions:

- Public JSON không có `ownerEmail`, `ownerId`, rejection/hide/recovery fields.
- Management JSON có đúng field frontend quản lý cần dùng.

### C7. File dự kiến

- `backend/src/main/java/.../service/StoreVisibilityPolicy.java` (mới)
- `backend/src/main/java/.../service/StoreService.java`
- `backend/src/main/java/.../service/FoodItemService.java`
- `backend/src/main/java/.../controller/StoreController.java`
- `backend/src/main/java/.../controller/FoodItemController.java`
- `backend/src/main/java/.../dto/response/PublicStoreResponse.java` (mới)
- `backend/src/main/java/.../dto/response/StoreManagementResponse.java` (mới)
- Store mapper/repository và test files liên quan.
- `frontend/src/App.jsx` và các owner/admin components đang dùng owner/moderation field.

### C8. Definition of Done

- Không truy cập được food item của store chưa public bằng ID trực tiếp.
- Public store JSON không chứa PII/moderation data.
- My Stores và Admin vẫn xem được dữ liệu cần thiết qua endpoint protected.
- Authorization matrix được kiểm bằng automated tests.

## Batch D — User authorization và validation

### D1. Authorization

Thay:

```java
@PreAuthorize("hasRole('ADMIN') or returnObject.email == authentication.name")
```

bằng:

```java
@PreAuthorize("hasRole('ADMIN')")
```

cho `getUserById`. Không dùng `@PostAuthorize` vì self-service đã có `/users/me`; admin-only tạo boundary dễ hiểu và tránh query dữ liệu user khác trước khi deny.

Đổi các `RuntimeException("User not found...")` trong UserService thành `AppException(USER_NOT_EXISTED)` để giữ error contract.

### D2. DTO validation

`UserController`:

```java
updateUser(..., @RequestBody @Valid UserUpdateRequest request)
updateCurrentUser(@RequestBody @Valid MyInfoUpdateRequest request)
```

`UserUpdateRequest`:

- username/firstname/lastname: `@NotBlank` và giới hạn chiều dài phù hợp schema.
- dateOfBirth: `@NotNull` + minimum age 18.
- roles: `@NotNull`, `@Size(min = 1)`.

`MyInfoUpdateRequest`:

- Các field form hiện gửi đầy đủ nên coi là PUT/full replacement.
- username/firstname/lastname: `@NotBlank` và giới hạn chiều dài.
- dateOfBirth: `@NotNull` + minimum age 18.

Nếu muốn hỗ trợ partial update sau này, tạo PATCH DTO riêng; không để null có hai nghĩa trong PUT hiện tại.

### D3. Role validation và session revocation

- Resolve toàn bộ requested role IDs.
- Nếu số role tìm được khác số role distinct được request, trả validation/business error thay vì im lặng bỏ qua role không tồn tại.
- Nếu role set thay đổi, tăng `tokenVersion` để token chứa authority cũ bị vô hiệu hóa ngay.
- Nếu admin thay đổi account state trong tương lai, thao tác `enabled` cũng phải tăng `tokenVersion`.

Phần revoke role token là hardening liên quan trực tiếp đến User API; thực hiện trong batch này để tránh user bị gỡ quyền ADMIN nhưng token cũ vẫn dùng được.

### D4. Frontend

- Profile tiếp tục gọi `/users/me`.
- Admin edit phải bắt buộc chọn ít nhất một role trước khi gửi.
- Cả profile/admin form validate ngày sinh đủ 18 tuổi.
- Hiển thị lỗi field/backend mà không chuyển thành logout.

### D5. Tests bắt buộc

- ADMIN gọi `GET /users/{id}` thành công.
- User thường gọi chính ID hoặc ID khác đều nhận 403; self profile qua `/users/me` vẫn thành công.
- PUT thiếu username/dateOfBirth/roles trả 400.
- DOB dưới 18 trả `INVALID_DATE_OF_BIRTH`.
- Unknown role ID bị từ chối, không lưu partial role set.
- Đổi roles tăng `tokenVersion`.
- Access token chứa role cũ bị từ chối sau khi cập nhật role.
- Update không đổi role không tăng `tokenVersion`.

### D6. File dự kiến

- `backend/src/main/java/.../controller/UserController.java`
- `backend/src/main/java/.../service/UserService.java`
- `backend/src/main/java/.../dto/request/UserUpdateRequest.java`
- `backend/src/main/java/.../dto/request/MyInfoUpdateRequest.java`
- `backend/src/main/java/.../exception/ErrorCode.java`
- `frontend/src/App.jsx`
- `frontend/src/pages/Profile/ProfileSection.jsx`
- `frontend/src/pages/Admin/AdminSection.jsx`
- Method-security/controller/service tests tương ứng.

### D7. Definition of Done

- Không còn `returnObject` trong `@PreAuthorize`.
- User thường chỉ lấy/cập nhật profile qua `/users/me`.
- Backend cưỡng chế đầy đủ validation dù bỏ qua frontend.
- Thay đổi role revoke token authority cũ.

## 5. Thứ tự triển khai và commit plan

Thứ tự khuyến nghị:

1. Batch A — login abuse protection.
2. Batch B — safe errors và redaction.
3. Batch D — User authorization/validation.
4. Batch C — store visibility/DTO boundary.

Batch C làm cuối vì thay đổi API/frontend rộng nhất. Batch A/B có thể hoàn thành và kiểm chứng độc lập trước.

Commit gợi ý:

```text
feat(auth): protect login endpoints from abuse
fix(api): prevent internal error detail disclosure
fix(frontend): redact sensitive developer console data
fix(authz): enforce user access and validation rules
feat(stores): separate public and management store views
fix(stores): enforce food item visibility policy
test(security): cover pre-hosting authorization boundaries
docs: update known issue remediation status
```

Không gộp toàn bộ vào một commit. Mỗi commit phải build/test được hoặc ghi rõ commit trung gian thuộc cùng một branch chưa merge.

## 6. Verification plan toàn đợt

### Backend automated

```powershell
cd backend
mvn.cmd test
```

Yêu cầu:

- Toàn bộ test hiện có vẫn pass.
- Bổ sung test cho A/B/C/D như mô tả.
- Không dùng sleep thật trong rate-limit tests; dùng injected `Clock`.
- Security tests phải bật method security thật, không chỉ gọi service trực tiếp khi đang mock bỏ qua proxy.

### Frontend automated/static

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run test:redaction
```

Yêu cầu:

- Build thành công.
- Không phát sinh lint error mới.
- Redaction tests pass.
- Production build không chứa UI text `API Logs Console` nếu DevConsole được tree-shake/conditional render đúng.

### Manual E2E

1. Login sai password nhiều lần và nhận 429 đúng ngưỡng.
2. Login đúng sau failure hợp lệ; counter email được reset.
3. Pending account nhập đúng password vẫn được chuyển sang resend verification.
4. Gây duplicate database request; response không lộ constraint.
5. Mở DevConsole development khi login/reset; không thấy password/OTP/token.
6. Build production; không thấy DevConsole/status pill.
7. Anonymous thử đọc food item của pending/hidden store bằng ID; nhận 404.
8. Owner vẫn quản lý được pending/hidden store của mình.
9. Admin vẫn xem và duyệt/từ chối store.
10. User thường gọi `/users/{ownId}` bị 403 nhưng `/users/me` vẫn hoạt động.
11. Admin gỡ role ADMIN của một user; token cũ của user đó bị từ chối.

## 7. Rollback và compatibility

- Batch A/B không thay schema nên rollback bằng application version trước được.
- Batch D dùng `tokenVersion` hiện có, không cần thêm column.
- Batch C thêm DTO/endpoint nhưng không cần đổi schema.
- Trong Batch C, deploy backend có endpoint mới trước hoặc cùng lúc frontend mới. Chỉ xóa behavior management khỏi public `/v1/stores` sau khi frontend đã chuyển sang `/mine` và `/admin`.
- Không dùng feature flag để giữ public PII lâu dài. Nếu cần rollout hai bước, endpoint mới được thêm trước rồi frontend chuyển, sau đó public endpoint bị thu hẹp.

## 8. Những việc cố ý chưa làm trong blueprint này

- Flyway/schema baseline cho production.
- Upload ownership/quota và avatar replacement lifecycle.
- Store transition state machine đầy đủ.
- Atomic rating/save counters.
- Distributed rate limit bằng Redis.
- Reverse-proxy trusted header, TLS, CSP và hosting-specific headers.
- Email outbox/durable delivery.

Các mục này không được xem là đã giải quyết khi bốn batch trên hoàn thành; chúng thuộc pre-production hoặc hosting readiness phase tiếp theo.

## 9. Checklist hoàn thành

### Batch A

- [x] Login IP/account limiter có TTL và size bound.
- [x] Unknown email và wrong password indistinguishable.
- [x] Social provider calls có IP limiter.
- [x] Pending/disabled account behavior không bị thay đổi sai.
- [x] Automated tests pass.

### Batch B

- [x] DB root cause không xuất hiện trong response.
- [x] Unexpected runtime error trả 500 và được log.
- [x] Request/response secrets được redact.
- [x] DevConsole không render ở production.
- [x] Automated tests pass.

### Batch C

- [x] Public store DTO không chứa owner PII/moderation data.
- [x] Food-item visibility dùng policy chung.
- [x] `/mine` và `/admin` đáp ứng frontend management.
- [x] Anonymous/owner/admin visibility matrix pass ở automated service/policy tests.

### Batch D

- [x] `GET /users/{id}` ADMIN-only.
- [x] Hai PUT user endpoints dùng `@Valid`.
- [x] Tuổi tối thiểu thống nhất 18.
- [x] Null/unknown/empty roles bị từ chối rõ ràng.
- [x] Role change tăng `tokenVersion` và revoke token cũ.
- [x] Method-security tests pass.

### Toàn đợt

- [x] Backend tests pass.
- [x] Frontend lint/build/redaction tests pass.
- [ ] Manual E2E pass.
- [x] Remediation blueprint được cập nhật trạng thái bằng evidence thực tế.
- [x] Không chỉnh sửa/stage `scripts/oci-a1-capacity-retry.ps1`; commit chưa được thực hiện trong lượt này.

## 10. Implementation evidence — 17/10/2026

Đã triển khai:

- Bounded in-memory login/social limiter với TTL, maximum keys và cấu hình theo environment.
- Generic `INVALID_CREDENTIALS` cho unknown email/wrong password và dummy BCrypt comparison.
- Runtime 500/Data conflict 409 generic; root cause chỉ còn trong server log.
- Redaction đệ quy request/response và production guard cho DevConsole.
- `PublicStoreResponse`, endpoint `/v1/stores/mine`, `/v1/stores/admin` và central `StoreVisibilityPolicy`.
- Food item GET áp dụng visibility của store và trả 404 khi resource không public.
- `GET /users/{id}` ADMIN-only, `@Valid` cho user update, minimum age 18 và role validation.
- Thay đổi role tăng `tokenVersion` để revoke authority trong JWT cũ.
- Frontend tách public/owned/admin store state và chuyển sang endpoint mới.

Kết quả automated verification:

- Backend: Maven test — 35 tests, 0 failure, `BUILD SUCCESS` (bao gồm method-security tests).
- Frontend redaction: 2 tests, 0 failure.
- Frontend production build: thành công; không tạo chunk hoặc nội dung `DevConsole`.
- Frontend lint: exit code 0; còn warning cũ ngoài phạm vi.
- `git diff --check`: không có whitespace error, chỉ có cảnh báo LF/CRLF trên Windows.

Chưa xác nhận trong lượt này:

- Manual browser E2E với database/SMTP/OAuth thật.
- Reverse proxy/client IP behavior khi có hosting.
- Multi-instance/distributed rate limiting; Redis vẫn là scale-dependent follow-up.
