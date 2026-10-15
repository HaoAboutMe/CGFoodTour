# API Reference đã xác minh

## 1. Quy ước chung

- Base path backend: `/api` từ `server.servlet.context-path`; bảng dưới ghi path sau `/api`.
- Success envelope: `{"code":1000,"message":"...","result":...}`; `result`/`message` có thể bị bỏ nếu null.
- Thành công thường HTTP 200, kể cả create/delete; controller không dùng `@ResponseStatus`.
- Bearer: `Authorization: Bearer <JWT>`.
- Ký hiệu: **Public** = filter chain permit; **Auth** = JWT; **Admin** = `ROLE_ADMIN`; **Owner/Admin** = service object-level check.
- Lỗi nghiệp vụ theo `ErrorCode`; validation thường 400. Unauthenticated 401, unauthorized 403, not-found 404. Runtime chung hiện trả 400; DB integrity trả 500 và có thể kèm root cause.

## 2. Authentication

| Method/path | Access | Input | Result / behavior |
|---|---|---|---|
| POST `/auth/token` | Public | `{email,password}`; không Bean Validation | `{token,isAuthenticated}`; kiểm BCrypt, verified, enabled |
| POST `/auth/google-login` | Public | `{idToken}`; field không validation annotation | verify Google JWK/issuer/audience/email; link/create user; JWT |
| POST `/auth/facebook-login` | Public | `{accessToken}` nonblank | gọi Graph `/me`, link facebookId/email hoặc tạo user; JWT |
| POST `/auth/introspect` | Public | `{token}` | `{valid}`; signature, normal expiry, blacklist |
| POST `/auth/logout` | Public | `{token}` | blacklist JTI đến token expiry; invalid token được xem như đã logout |
| POST `/auth/refresh` | Public | `{token}` | blacklist token cũ; phát JWT mới nếu trong cửa sổ refresh từ `issueTime` |
| GET `/auth/verify-email?token=` | Public | query token | HTML success/error, không phải JSON |
| POST `/auth/resend-verification?email=` | Public | query email | thay token cũ, gửi email async |
| POST `/auth/forgot-password` | Public | valid email body | xóa OTP cũ, tạo OTP 6 số/5 phút, gửi async |
| POST `/auth/verify-otp` | Public | `{email,otp}`; email, nonblank, length 6 | chỉ kiểm hợp lệ, chưa đánh dấu used |
| POST `/auth/reset-password` | Public | `{email,otp,newPassword}`; password min 8 | đổi BCrypt password, đánh dấu OTP used |

Lỗi chính: `USER_NOT_EXISTED`, `PASSWORD_INCORRECT`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_DISABLED`, `UNAUTHENTICATED`, `INVALID_VERIFICATION_TOKEN`, `EMAIL_ALREADY_VERIFIED`, `INVALID_OTP`, social token invalid.

**Contract quan trọng:** không có refresh token riêng; `AuthenticationResponse` không có `refreshToken`. Không có `POST /auth/register`.

## 3. User

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| POST `/users` | Public | `UserCreationRequest`: username min3, email required/valid, password min8, DOB age min5 | tạo disabled/unverified USER, avatar default, token verify email |
| GET `/users` | Admin (service) | — | tất cả `UserResponse` |
| GET `/users/me` | Auth | — | user theo JWT subject email |
| GET `/users/{userId}` | Admin hoặc chính user (post-authorize qua return email) | path ID | `UserResponse` |
| PUT `/users/{userId}` | Admin | username/name/DOB/roles; controller không `@Valid` | MapStruct update và thay toàn bộ role set |
| PUT `/users/me` | Auth | username/name/DOB; controller không `@Valid` | đổi profile; check duplicate username |
| PUT `/users/me/change-password` | Auth | `{oldPassword,newPassword}`; controller không `@Valid` | match old, BCrypt new |
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
| GET `/v1/stores/parse-gmaps?url=` | Public | arbitrary string | `{latitude,longitude}` hoặc `{}`; có server-side redirect/HTML fetch |
| POST `/v1/stores` | Auth | `StoreRequest` | owner=current user; PENDING, unverified; custom string ID |
| GET `/v1/stores?categoryId=` | Public, optional JWT | optional integer | admin all; owner own; others APPROVED; JWT cá nhân hóa `isSaved` |
| GET `/v1/stores/ranking` | Public | — | APPROVED, totalVotes≥10, satisfaction desc/votes desc |
| GET `/v1/stores/random?categoryId=` | Public | optional integer | random APPROVED hoặc 404 |
| GET `/v1/stores/{id}` | Public, optional JWT | string ID | chỉ approved/admin/owner |
| PUT `/v1/stores/{id}` | Owner/Admin | full `StoreRequest` | owner edit non-hidden → PENDING/unverified; admin giữ status |
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
| GET `/v1/stores/saved` | Auth | — | saved APPROVED stores newest first |

`StoreRequest`: `categoryId`, `name`, `addressLine`, `landmarkNote`, `openTime`, `closeTime` bắt buộc; phone/GPS/map/banner optional; price defaults 0; có field `isVerified` nhưng backend override khi create/owner resubmit.

`StoreResponse`: store/category/contact/location/time/price/banner, verification/status/moderation fields, owner ID/email/name, rating counters, bookmark state/count, food items, daily closed warning, timestamps.

## 6. Food items

| Method/path | Access | Input | Result / rules |
|---|---|---|---|
| POST `/v1/food-items/store/{storeId}` | Owner/Admin | name nonblank, price ≥0, image/description, signature | tạo item cho store |
| GET `/v1/food-items/store/{storeId}` | Public | store ID | tất cả item; không kiểm store status |
| GET `/v1/food-items/{id}` | Public | item ID | item; không kiểm store status |
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
| POST `/auth/register` | chỉ POST `/users` | **Không khớp; registration hỏng** |
| Registration body không DOB, password min6 | backend DOB non-null/min5, password min8 | **Không khớp** |
| Login đọc optional `result.refreshToken` | response không có field | fallback/inconsistent |
| Verify email qua `makeRequest` | backend trả HTML | wrapper coi text là `data.message`; status vẫn dùng được |
| Store/category/food/user/admin calls còn lại | mappings tồn tại | Khớp path/method/payload chính |
| Profile UI nói password min6 | DTO min8 nhưng endpoint thiếu `@Valid` | Text và intended rule không khớp; runtime hiện không enforce min |

## 10. Backend API chưa được frontend chính dùng

`/auth/introspect`, `/auth/logout` (client chỉ xóa local token), public get category by ID, public store by ID, public food-item endpoints (store data đã nhúng food items), toàn bộ roles/permissions. Legacy static console trong backend có thể gọi thêm một số endpoint nhưng không phải React SPA.

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

