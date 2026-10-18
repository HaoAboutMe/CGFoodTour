# API Reference đã xác minh

## Cập nhật P1 — 18/10/2026

- `POST /auth/token`, `/auth/google-login`, `/auth/facebook-login`: JSON chỉ trả access token; refresh token được đặt bằng cookie `HttpOnly`.
- `POST /auth/refresh`: không nhận body; đọc refresh cookie và yêu cầu `X-CSRF-Token` khớp CSRF cookie.
- `POST /auth/logout`: access token nằm trong Bearer header, refresh token nằm trong cookie; yêu cầu CSRF và xóa cả hai cookie.
- `GET /v1/stores`: thêm `categoryIds`, `openNow`, `latitude`, `longitude`, `radiusKm`, `sort=distance`; response thêm `distanceKm`, `openNow`.
- `GET /v1/stores/facets`: count category trên toàn bộ tập public phù hợp, độc lập page.
- `GET /v1/stores/admin/summary`: tổng moderation toàn cục cho admin.
- Detail URL frontend: `/quan/{storeId}/{slug}`; API detail vẫn là `GET /v1/stores/{id}`. Quán chưa public chỉ chủ sở hữu hoặc admin đã xác thực mới xem được.

## 1. Quy ước chung

- Base path backend: `/api` từ `server.servlet.context-path`; bảng dưới ghi path sau `/api`.
- Success envelope: `{"code":1000,"message":"...","result":...}`; `result`/`message` có thể bị bỏ nếu null.
- Thành công thường HTTP 200, kể cả create/delete; controller không dùng `@ResponseStatus`.
- Bearer: `Authorization: Bearer <JWT>`.
- Ký hiệu: **Public** = filter chain permit; **Auth** = JWT; **Admin** = `ROLE_ADMIN`; **Owner/Admin** = service object-level check.
- Lỗi nghiệp vụ theo `ErrorCode`; validation thường 400. Unauthenticated 401, unauthorized 403, not-found 404. Runtime ngoài dự kiến trả 500 generic; DB integrity trả 409 generic và chỉ log root cause ở server.

## 2. Authentication

| Method/path | Access | Input | Result / behavior |
|---|---|---|---|
| POST `/auth/token` | Public | `{email,password}` validated | access token JSON + refresh/CSRF cookies; rate limit IP/email |
| POST `/auth/google-login` | Public | `{idToken}`; field không validation annotation | verify Google JWK/issuer/audience/email; link/create user; JWT |
| POST `/auth/facebook-login` | Public | `{accessToken}` nonblank | gọi Graph `/me`, link facebookId/email hoặc tạo user; JWT |
| POST `/auth/introspect` | Public | `{token}` | `{valid}`; signature, normal expiry, blacklist |
| POST `/auth/logout` | Public | Bearer access + refresh cookie + `X-CSRF-Token` | revoke token hợp lệ và clear session cookies, idempotent với token lỗi/hết hạn |
| POST `/auth/refresh` | Public | refresh cookie + `X-CSRF-Token`, body rỗng | rotate refresh cookie và trả access token JSON mới |
| GET `/auth/verify-email?token=` | Public | query token | HTML success/error, không phải JSON |
| POST `/auth/resend-verification?email=` | Public | query email | thay token cũ, gửi email async |
| POST `/auth/forgot-password` | Public | valid email body | xóa OTP cũ, tạo OTP 6 số/5 phút, gửi async |
| POST `/auth/verify-otp` | Public | `{email,otp}`; email, nonblank, length 6 | chỉ kiểm hợp lệ, chưa đánh dấu used |
| POST `/auth/reset-password` | Public | `{email,otp,newPassword}`; password min 8 | đổi BCrypt password, đánh dấu OTP used |

Lỗi chính: `USER_NOT_EXISTED`, `PASSWORD_INCORRECT`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_DISABLED`, `UNAUTHENTICATED`, `INVALID_VERIFICATION_TOKEN`, `EMAIL_ALREADY_VERIFIED`, `INVALID_OTP`, social token invalid.

**Contract quan trọng:** refresh token tồn tại nội bộ nhưng bị `@JsonIgnore`, không xuất hiện trong JSON. Registration canonical là `POST /auth/register`.

### Lịch sử contract auth/session (2026-10-17, đã được P1 ngày 18/10 thay thế)

- Contract ngày 17/10 từng trả `accessToken`, `refreshToken`, `expiresIn` và `refreshExpiresIn`; P1 đã chuyển refresh token sang cookie.
- Access/refresh JWT có claim `typ` và `ver`; introspect/refresh/protected API từ chối token nếu user bị disable hoặc `ver` khác `User.tokenVersion`.
- Contract ngày 17/10 từng nhận `{accessToken,refreshToken}`; body này không còn được sử dụng.
- `POST /auth/reset-password` consume OTP, đổi mật khẩu và tăng `tokenVersion`, vì vậy mọi JWT cũ của user mất hiệu lực.
- Google login kiểm tra issuer/audience/`email_verified`/`sub`; Facebook login kiểm tra `debug_token`, App ID và provider user ID.
- Social login chỉ kích hoạt trạng thái pending (`enabled=false,emailVerified=false`); trạng thái admin-disabled (`false,true`) trả `ACCOUNT_DISABLED` mà không mutate user.
- Lỗi social linking mới: `SOCIAL_ACCOUNT_CONFLICT` (1024), `INVALID_ACCOUNT_STATE` (1025).
- Registration public hiện dùng `POST /auth/register`; verify JSON dùng `POST /auth/verify-email` với `{token}`.
- Registration, resend verification và forgot-password hiện chờ SMTP xác nhận gửi; chỉ trả success sau khi hoàn tất. Lỗi SMTP trả `EMAIL_SEND_FAILED`, frontend không chuyển bước.
- Resend verification và forgot-password trả HTTP 200 thay vì 202 vì không còn xử lý email nền.
- `PUT /users/me/change-password`: sai mật khẩu hiện tại trả `PASSWORD_INCORRECT` (1017/400), không trả `UNAUTHENTICATED`; success chỉ được trả sau khi password hash và `tokenVersion` đã `saveAndFlush`.
- Login email/password có bounded in-memory limiter theo IP/email; Google/Facebook login có limiter theo provider/IP trước outbound validation. `INVALID_CREDENTIALS` (1026/401) không cho phép phân biệt email không tồn tại với password sai.

## 3. User

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| POST `/users` | Deprecated/không public | — | Registration canonical là `POST /auth/register` |
| GET `/users` | Admin (service) | `page,size,query,enabled,role,sort` | `PageResponse<UserResponse>`; size tối đa 100 |
| GET `/users/me` | Auth | — | user theo JWT subject email |
| GET `/users/{userId}` | Admin | path ID | `UserResponse`; self-service dùng `/users/me` |
| PUT `/users/{userId}` | Admin | username/name/DOB age 18+/roles validated | thay toàn bộ role set; role change tăng tokenVersion |
| PUT `/users/me` | Auth | username/name/DOB age 18+ validated | đổi profile; check duplicate username |
| PUT `/users/me/change-password` | Auth | `{oldPassword,newPassword}` validated | match old, BCrypt new, tăng tokenVersion |
| PATCH `/users/me/avatar` | Auth | multipart `file` | max 2 MiB, MIME prefix `image/`, replace Cloudinary image |
| DELETE `/users/{userId}` | Admin | path ID | hard delete user; child/FK behavior chưa xác minh |

`UserResponse` gồm id, username, names, email, DOB, avatar URL, facebookId, enabled, verified, roles; không trả password/avatarPublicId.

## 4. Categories

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| POST `/v1/categories` | Admin (service) | `{name,iconUrl}`; name 2..50 nonblank | trim, case-insensitive unique, displayOrder=count+1 |
| GET `/v1/categories` | Public | — | sort displayOrder asc/name asc |
| GET `/v1/categories/{id}` | Public | integer ID | category hoặc 404 |
| PUT `/v1/categories/{id}` | Admin | same create | trim, unique excluding ID; giữ displayOrder |
| DELETE `/v1/categories/{id}` | Admin | integer ID | delete; FK store có thể chặn |

Mutations broadcast SSE `STORES_UPDATED` sau khi service thành công.

## 5. Stores và community

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| GET `/v1/stores/events` | Public | — | SSE, INIT rồi event `message`; timeout 10 phút |
| GET `/v1/stores/parse-gmaps?url=` | Auth | Google Maps HTTPS URL | `{latitude,longitude}` hoặc `{}`; quota user/IP, cache, concurrency guard và SSRF validation |
| POST `/v1/stores` | Auth | `StoreRequest` | owner=current user; PENDING, unverified; custom string ID |
| GET `/v1/stores` | Public, optional JWT | `page,size,categoryId,query,sort` | `PageResponse<PublicStoreResponse>`; chỉ APPROVED/owner enabled; size tối đa 100 |
| GET `/v1/stores/mine` | Auth | `page,size,status,sort` | page store của principal ở mọi trạng thái; management response |
| GET `/v1/stores/admin` | Admin | `page,size,status,categoryId,query,sort` | page store và moderation/owner fields |
| GET `/v1/stores/ranking` | Public | `limit` mặc định 20, tối đa 100 | APPROVED, totalVotes≥10, satisfaction desc/votes desc |
| GET `/v1/stores/random?categoryId=` | Public | optional integer | random APPROVED hoặc 404 |
| GET `/v1/stores/{id}` | Public, optional JWT | string ID | APPROVED được xem công khai; non-public chỉ owner/admin, các caller khác nhận 404 |
| PUT `/v1/stores/{id}` | Owner/Admin | JSON `StoreRequest`, hoặc multipart `store` JSON + optional `banner` | metadata/banner áp dụng cùng lần lưu; owner edit non-hidden → PENDING/unverified; admin giữ status |
| PATCH `/v1/stores/{id}/banner` | Owner/Admin | multipart `file` | cập nhật banner độc lập; owner non-hidden vẫn → PENDING/unverified; ảnh cũ chỉ xóa sau commit |
| DELETE `/v1/stores/{id}` | Owner/Admin | optional `{reason}` | admin bắt buộc reason; hard-delete children/store |
| POST `/v1/stores/{id}/hide` | Owner/Admin | optional `{reason}` | chỉ APPROVED; admin cần reason; status HIDDEN |
| POST `/v1/stores/{id}/recover` | Owner/Admin | optional `{reason}` | chỉ HIDDEN; admin-hidden chỉ admin; → APPROVED |
| POST `/v1/stores/{id}/request-recovery` | Owner/Admin | `{reason}` | chỉ HIDDEN do admin; reason bắt buộc; set request flag |
| POST `/v1/stores/{id}/reject-recovery-request` | Admin | `{reason}` | pending request; reason bắt buộc; giữ HIDDEN |
| POST `/v1/stores/{id}/rate` | Auth | `{ratingLevel}` enum required | upsert one/user/store; recalc counters/rate |
| POST `/v1/stores/{id}/report-closed` | Auth | `{latitude,longitude}` required | ≤100 m; one/user/store/day; warning từ 3 reports |
| POST `/v1/stores/{id}/approve` | Admin | ID | status APPROVED, verified, clear rejection |
| POST `/v1/stores/{id}/reject` | Admin | `{reason}` nonblank | status REJECTED, unverified |
| POST `/v1/stores/{id}/save` | Auth | ID | toggle bookmark và savedCount; trả `isSaved` |
| GET `/v1/stores/saved` | Auth | `page,size` | page saved APPROVED stores newest first |

`StoreRequest`: `categoryId`, `name`, `addressLine`, `landmarkNote`, `openTime`, `closeTime` bắt buộc; phone/GPS/map/banner optional; price defaults 0; có field `isVerified` nhưng backend override khi create/owner resubmit.

`PublicStoreResponse` không chứa owner ID/email/name hoặc moderation/recovery reason. `StoreResponse` là management DTO dùng cho `/mine`, `/admin` và mutation response được bảo vệ.

## 6. Food items

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| POST `/v1/food-items/store/{storeId}` | Owner/Admin | name nonblank, price ≥0, image/description, signature | tạo item cho store |
| GET `/v1/food-items/store/{storeId}` | Public, optional JWT | store ID | public chỉ APPROVED; owner/admin đọc được non-public; còn lại 404 |
| GET `/v1/food-items/{id}` | Public, optional JWT | item ID | cùng visibility policy với store; resource không được phép đọc trả 404 |
| PUT `/v1/food-items/{id}` | Owner/Admin | same create | update item |
| DELETE `/v1/food-items/{id}` | Owner/Admin | item ID | delete |

## 7. Upload

| Method/path | Access | Input | Result |
|---|---|---|---|
| POST `/v1/upload/image?folder=` | Auth | multipart `file`, optional folder | `{url,publicId}` từ Cloudinary |

Chỉ kiểm `file.isEmpty`; không có max size/content-type ở generic endpoint. Avatar endpoint có kiểm riêng.

## 8. Roles và permissions

| Method/path | Access | Input/result |
|---|---|---|
| POST `/roles` | Admin | `{name,description,permissions[]}`; unknown permission bị bỏ bởi `findAllById` |
| GET `/roles` | Admin | tất cả role + permissions |
| DELETE `/roles/{role}` | Admin | delete by ID |
| POST `/permissions` | Admin | `{name,description}` |
| GET `/permissions` | Admin | tất cả permission |
| DELETE `/permissions/{permission}` | Admin | delete by ID |

Frontend hiện không gọi sáu endpoint RBAC này.

## 9. Frontend/backend compatibility

| Frontend call | Backend | Kết luận |
|---|---|---|
| POST `/auth/register` + DOB/password min8 | POST `/auth/register`, DTO cùng rule | Khớp |
| Login/social nhận access JSON và cookie | controller cùng contract | Khớp |
| Refresh/logout cookie + CSRF | controller cùng contract | Khớp |
| Verify email JSON qua POST `/auth/verify-email` | controller trả JSON/status | Khớp |
| Store/category/food/user/admin calls còn lại | mappings tồn tại | Khớp path/method/payload chính |

## 10. Backend API chưa được frontend chính dùng

`/auth/introspect`, public get category by ID, public food-item endpoints (store data đã nhúng food items), toàn bộ roles/permissions. Public store by ID hiện được route `/quan/{id}/{slug}` sử dụng.

## 11. Handler index

Đây là đối chiếu 56 mappings với method thật, dùng để tìm điểm vào khi sửa:

- `AuthenticationController`: `/auth/token` → `authenticate`; `/google-login` → `googleLogin`; `/facebook-login` → `facebookLogin`; `/introspect` → `introspect`; `/logout` → `logout`; `/refresh` → `refresh`; `/verify-email` → `verifyEmail`; `/resend-verification` → `resendVerificationEmail`; `/forgot-password` → `forgotPassword`; `/verify-otp` → `verifyOtp`; `/reset-password` → `resetPassword`.
- `UserController`: POST `/users` → `createUser`; GET `/users` → `getUsers`; `/users/me` GET/PUT → `getCurrentUser`/`updateCurrentUser`; `/users/{userId}` GET/PUT/DELETE → `getUserById`/`updateUser`/`deleteUser`; `/users/me/change-password` → `changePassword`; `/users/me/avatar` → `updateAvatar`.
- `CategoryController`: collection POST/GET → `createCategory`/`getCategories`; item GET/PUT/DELETE → `getCategory`/`updateCategory`/`deleteCategory`.
- `FoodItemController`: POST `/store/{storeId}` → `createFoodItem`; GET `/store/{storeId}` → `getFoodItemsByStore`; item GET/PUT/DELETE → `getFoodItem`/`updateFoodItem`/`deleteFoodItem`.
- `StoreController`: `/events` → `subscribeToStoreEvents`; `/parse-gmaps` → `parseGmapsUrl`; collection POST/GET → `createStore`/`getStores`; `/ranking` → `getRanking`; `/random` → `getRandomStore`; item GET/PUT/DELETE → `getStore`/`updateStore`/`deleteStore`; actions → `hideStore`, `recoverStore`, `requestStoreRecovery`, `rejectRecoveryRequest`, `rateStore`, `reportClosed`, `approveStore`, `rejectStore`, `toggleSaveStore`; `/saved` → `getSavedStores`.
- `UploadController`: `/v1/upload/image` → `uploadImage`.
- `RoleController`: POST/GET/DELETE → `createRoles`/`getAll`/`delete`.
- `PermissionController`: POST/GET/DELETE → `createPermissions`/`getAll`/`delete`.

