# Backend Reference

## 1. Tổng quan

Entry point: `backend/src/main/java/com/cangiuoc/cgfoodtour/CgFoodTourApplication.java`. Backend là một Spring Boot application duy nhất, package-by-layer, không có module Maven con.

### Package responsibilities

- `configuration`: security/CORS/JWT/OpenAPI/Cloudinary/password encoder/init seed.
- `controller`: REST/SSE; wrapper `ApiResponse` nằm nhầm trong `dto/request` nhưng dùng cho cả response.
- `service`: business logic và integrations.
- `repository`: derived Spring Data queries.
- `entity`: JPA persistence model.
- `dto`, `mapper`, `validator`: contract, mapping, input rules.
- `exception`: `AppException`, `ErrorCode`, global handler.

## 2. Controller → service map

| Controller | Prefix | Service |
|---|---|---|
| AuthenticationController | `/auth` | AuthenticationService, UserService |
| UserController | none (`/users...`) | UserService |
| StoreController | `/v1/stores` | StoreService, SSE |
| FoodItemController | `/v1/food-items` | FoodItemService |
| CategoryController | `/v1/categories` | CategoryService, SSE |
| UploadController | `/v1/upload` | CloudinaryService |
| RoleController | `/roles` | RoleService |
| PermissionController | `/permissions` | PermissionService |

Catalog đầy đủ ở [API_REFERENCE.md](API_REFERENCE.md).

## 3. Service rules

### AuthenticationService

- Login bằng email/BCrypt; yêu cầu email verified và enabled.
- JWT HS512 có subject=email, issuer cố định, `iat`, access expiry, random JTI, scope role/permission.
- `verifyToken(token,false)` kiểm signature/access expiry/blacklist. Refresh thay access expiry bằng `iat + refreshableDuration`, blacklist token cũ, rồi phát token mới.
- Logout public và idempotent theo implementation: token hợp lệ được blacklist; `AppException` bị nuốt.
- Forgot password thay toàn bộ OTP active của email; OTP raw, 6 số, 5 phút.
- Google dùng Nimbus JWK; Facebook gọi Graph API bằng access token và optional app-secret proof.

Điểm chú ý: refresh không kiểm `enabled/emailVerified` sau khi tải user; password change/reset không revoke các JWT khác; blacklist không cleanup; không rate limit.

### UserService

- Registration uniqueness username/email, BCrypt, default avatar, USER role, disabled cho tới verify.
- Verify token 24h rồi enable/verify và xóa token.
- Owner profile map trực tiếp các field cho phép; admin update thêm roles.
- Avatar xóa Cloudinary asset cũ trước rồi upload asset mới; nếu upload mới thất bại, DB vẫn trỏ URL cũ nhưng asset có thể đã bị xóa.
- Email là immutable ở self/admin DTO hiện tại.

### StoreService

- Aggregate lớn nhất; quản lý visibility, ownership, lifecycle, rating/report/save/audit, random/ranking, cron và URL parsing.
- `toStoreResponse` enrich food items, daily report warning và bookmark state qua repository calls.
- Hard delete thủ công food/rating/report/audit/save rồi store.
- URL parser regex trước, sau đó `HttpURLConnection` theo tối đa 10 redirect, đọc tối đa 150 dòng HTML.

### FoodItemService

CRUD; mutation owner/admin. Public reads chỉ check existence item/store, không áp visibility store.

### Category/Role/Permission

Category admin mutation + unique/trim/order; read public. Role/permission toàn bộ admin bằng method security. Bốn permission seed hiện chỉ được nhúng JWT, chưa dùng để bảo vệ operation.

### Email/Cloudinary/SSE

- Email methods `@Async void`; lỗi send xảy ra ở async thread, caller không nhận được outcome.
- Email HTML dùng `.formatted()` với dữ liệu động, chưa thấy HTML escaping.
- Generic Cloudinary upload nhận optional subfolder; avatar có validation ở UserService.
- SSE emitter lưu in-memory `CopyOnWriteArrayList`, timeout 10 phút, broadcast best-effort.

## 4. DTO, mapping, validation

- MapStruct `ReportingPolicy.IGNORE` ở User/Store/Category/Food mapper có thể che field mới chưa map.
- Response DTO tránh password và avatar public ID, nhưng StoreResponse trả owner email; UserResponse trả facebookId.
- `@Valid` có ở registration, category, store, food, rating/report/reject và auth reset flows.
- `@Valid` thiếu ở login, admin/self user update, change password, introspect/logout/refresh và Google request.
- Registration DOB min5; self DOB DTO min18; admin update DOB min5 nhưng không validate.
- `StoreRequest.isVerified` là client-controlled field không cần thiết; service override ở create/owner resubmit nhưng admin update có thể map nó.

## 5. Security chi tiết

1. `SecurityFilterChain` permit Swagger, selected public auth/user endpoints, GET category/store/food.
2. Mọi request khác authenticated.
3. `CustomJwtDecoder` introspect trước rồi Nimbus decode; circular dependency giải bằng `@Lazy` field injection.
4. Authority converter lấy claim mặc định `scope`, prefix rỗng; token tự chứa `ROLE_ADMIN`.
5. Method security bảo vệ admin functions; owner checks bằng entity IDs.
6. CSRF disabled phù hợp Bearer API; CORS allow credentials và localhost/custom origins.

Không có session config explicit, rate limiter, access-denied handler custom, security headers custom hay resource ownership annotation.

## 6. Exception handling

- `AppException` → status/code/message từ enum.
- AccessDenied → 403 code 1008.
- Bean Validation → lấy lỗi field đầu tiên; nếu message trùng enum thì nội suy min/max.
- Malformed JSON → 400 code 999.
- Data integrity → 500 code 9999 và nối root-cause DB vào message.
- Runtime khác → 400 code 9999, không log trong handler.
- Authentication failure ở filter → 401 JSON qua `JwtAuthenticationEntryPoint`.

## 7. Scheduling, integrations, side effects

- Midnight cron xóa toàn bộ daily reports.
- Store/category mutations broadcast SSE sau service return; rating/report/save không broadcast.
- Admin hide/hard-delete/reject recovery gửi email async; approve/reject submission không gửi email.
- OAuth và URL parser thực hiện network I/O đồng bộ trong request thread; Cloudinary upload/delete cũng đồng bộ.

## 8. Logging

Logging profile production: root WARN, app INFO. Có log email address, auth authorities, SSE errors; code fallback có câu lệnh log raw verification token/OTP, nhưng do email method async, catch ở caller thường không bắt exception async. Không được dựa vào điều này như biện pháp bảo mật; raw secret logging phải được loại bỏ khi sửa.

## 9. Testing/build state

- Dependency test: Spring Boot Test + H2.
- Có test config nhưng không có Java test class.
- Không có controller/security/repository/integration test.
- Maven test/build chưa chạy: sandbox từ chối thực thi project code có ghi artifact.
- Java host 24.0.1; Maven wrapper 3.9.12; target project Java 17.

## 10. Khi thay backend

- Bắt đầu từ API catalog và business flow, không sửa controller đơn lẻ.
- Với store, đọc toàn bộ child repositories vì hard delete/counters/visibility liên kết chặt.
- Với auth, đồng bộ token contract với frontend và kiểm revocation/account state.
- Thêm validation ở controller cần kiểm client payload hiện tại để tránh break ngầm.
- Entity change phải có migration strategy trước khi chạm production.
- Bổ sung test theo security + owner/admin + status transitions trước refactor service lớn.

