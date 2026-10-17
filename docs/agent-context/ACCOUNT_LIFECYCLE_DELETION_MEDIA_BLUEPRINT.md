# Account Lifecycle, User Deletion và Media Safety Blueprint

> Ngày lập: 17/10/2026  
> Trạng thái: **Đề xuất — chưa chỉnh sửa code**  
> Phạm vi: N-01 đến N-04, admin disable/enable account, hard-delete user và dữ liệu liên quan, avatar/banner/food image lifecycle, Google Maps link safety.

## Trạng thái triển khai local — 2026-10-17

Các hạng mục trong blueprint đã được áp dụng cho môi trường local:

- Role change và admin disable/enable đều tăng `tokenVersion`; bảo vệ self-action và admin cuối cùng.
- Account bị admin disable không thể được social login tự bật lại; quán của account đó không còn xuất hiện public nhưng giữ nguyên trạng thái moderation.
- Hard-delete dùng một transaction để xóa account graph và nội dung public, đồng thời giữ audit đã anonymize và tạo deletion audit riêng.
- Upload ảnh đã chuyển sang endpoint gắn với resource; thay ảnh theo thứ tự upload → lưu DB → xóa ảnh cũ sau commit. Cleanup lỗi được lưu vào `media_cleanup_tasks` để scheduled job retry.
- Link Google Maps vẫn được lưu và render, nhưng chỉ khi qua HTTPS/exact-host/path/DNS/redirect validation và resolver trích xuất được tọa độ. Frontend kiểm tra lại trước khi tạo liên kết.
- Local tiếp tục dùng Hibernate DDL auto/update theo quyết định hiện tại; migration versioned được để lại cho giai đoạn chuẩn bị deployment.

## 1. Mục tiêu

Sau khi triển khai blueprint này, hệ thống phải bảo đảm:

1. Thay đổi role hoặc trạng thái hoạt động của user làm JWT cũ mất hiệu lực ngay.
2. Tài khoản chưa xác thực và tài khoản bị admin khóa là hai trạng thái khác nhau.
3. Quán của tài khoản bị khóa không còn xuất hiện qua bất kỳ public API nào.
4. Admin có thể hard-delete một tài khoản vi phạm cùng toàn bộ dữ liệu vận hành và nội dung public của tài khoản đó.
5. Audit không bị mất theo dữ liệu nghiệp vụ, nhưng không giữ PII của user đã bị xóa.
6. Thay avatar/banner/ảnh món không xóa asset cũ trước khi dữ liệu mới được lưu thành công.
7. Upload dở dang hoặc người dùng bỏ form không tạo asset Cloudinary mồ côi lâu dài.
8. Link Google Maps hợp lệ vẫn được lưu và hiển thị để người dùng mở bản đồ thuận tiện; URL ngoài hệ thống Google Maps không được chấp nhận.

## 2. Kết luận audit hiện tại

### 2.1. N-01 đã được xử lý một phần quan trọng

`UserService.updateUser` hiện đã:

- So sánh tập role cũ và role mới.
- Tăng `tokenVersion` khi role thay đổi.
- `AuthenticationService.verifyToken` kiểm tra `ver` trong JWT với `user.tokenVersion` ở mỗi request.
- Có unit test xác nhận role change tăng version.

Vì vậy nhận định “đổi role nhưng không tăng `tokenVersion`” không còn đúng với source hiện tại.

Phần còn thiếu:

- Chưa có admin API disable/enable account.
- Chưa có test xuyên suốt “phát JWT ADMIN → demote → token cũ bị decoder từ chối”.
- Chưa có invariant dùng chung: mọi thay đổi `roles` hoặc `enabled` đều phải tăng `tokenVersion`.

### 2.2. N-02 đang tồn tại

`UserService.deleteUser` chỉ gọi `userRepository.delete(user)` trong khi:

- `stores.owner_id` tham chiếu user.
- `verification_token.user_id` tham chiếu user.
- `user_saved_stores.user_id` tham chiếu user.
- `store_ratings.user_id` và `store_daily_reports.user_id` lưu user ID dạng chuỗi.
- OTP reset lưu email.
- User có join table với role.

Ngoài nguy cơ foreign key, counters của store khác có thể sai nếu rating/save của user bị xóa mà không tính lại.

`StoreService.hardDeleteStore` hiện còn tạo audit rồi gọi `storeAuditLogRepository.deleteByStoreId`, vì vậy audit vừa tạo cũng bị xóa.

### 2.3. N-03 đang tồn tại và phạm vi rộng hơn avatar

Avatar hiện dùng thứ tự:

```text
delete old asset → upload new asset → save user
```

Banner và ảnh món dùng generic upload trước khi resource được tạo/cập nhật. Frontend chỉ giữ URL, bỏ `publicId`; do đó:

- Người dùng có thể bấm tạo khi upload chưa kết thúc.
- Bỏ form sau upload tạo orphan asset.
- Thay/xóa banner hoặc ảnh món không có đủ `publicId` để cleanup.
- Xóa store/user không thể xóa media một cách đáng tin cậy.

### 2.4. N-04 đang tồn tại

`StoreRequest.mapUrl` nhận chuỗi tùy ý và frontend dùng trực tiếp làm `href` tại public drawer và admin drawer. SSRF resolver đã được bảo vệ nhưng stored-link/phishing vẫn là vấn đề riêng.

## 3. Các quyết định nghiệp vụ đề xuất cần xác nhận

Đây là baseline sẽ được dùng khi triển khai nếu không có thay đổi:

- [ ] **D1 — Disable khác pending verification.**
  - Pending: `enabled=false`, `emailVerified=false`.
  - Active: `enabled=true`, `emailVerified=true`.
  - Admin-disabled: `enabled=false`, `emailVerified=true`.
  - Trạng thái `enabled=true`, `emailVerified=false` bị xem là invalid.
- [ ] **D2 — Disable không sửa `Store.status`.** Public visibility yêu cầu cả `store.status=APPROVED` và `owner.enabled=true`. Re-enable sẽ làm quán APPROVED xuất hiện lại mà không mất lịch sử moderation.
- [ ] **D3 — Hard-delete user xóa toàn bộ store/food/rating/report/save/token/OTP và liên kết role của user.**
- [ ] **D4 — Giữ audit tối thiểu, đã ẩn danh.** Không giữ email, tên, avatar, social ID hoặc user ID của target đã bị xóa; giữ action, thời gian, lý do, store ID/name nếu cần điều tra moderation và admin thực hiện thao tác.
- [ ] **D5 — Không cho admin tự disable/xóa chính mình và không cho disable/xóa ADMIN hoạt động cuối cùng.**
- [ ] **D6 — Media do ứng dụng upload phải có `publicId` và ownership record.** URL bên ngoài không được coi là managed asset.
- [ ] **D7 — Vẫn lưu `mapUrl`, nhưng chỉ sau khi backend xác thực và chuẩn hóa.** Link phải dùng HTTPS, đúng Google Maps hostname/path allowlist, vượt qua kiểm tra redirect/DNS và trích xuất được tọa độ. Frontend kiểm tra phòng vệ lần hai trước khi render.

## 4. Mô hình trạng thái tài khoản

### 4.1. Giữ hai boolean hiện tại, bổ sung metadata admin disable

Không cần thêm enum account status trong đợt đầu vì hai boolean hiện tại đã phân biệt được các trạng thái cần thiết. Bổ sung vào `User`:

```java
String disabledReason;
LocalDateTime disabledAt;
String disabledByAdminId;
```

Quy tắc:

| Trạng thái | enabled | emailVerified | Đăng nhập | Public store |
|---|---:|---:|---|---|
| Chờ xác thực | false | false | Chỉ social login hợp lệ được kích hoạt | Không public |
| Hoạt động | true | true | Cho phép | Theo `Store.status` |
| Admin khóa | false | true | Từ chối cả password/social/refresh | Không public |
| Invalid | true | false | Từ chối và log cảnh báo | Không public |

### 4.2. API quản trị riêng

Không đưa `enabled` vào `UserUpdateRequest` chung. Tạo contract rõ mục đích:

```http
POST /api/users/{userId}/disable
Content-Type: application/json

{
  "reason": "Đăng nội dung vi phạm"
}
```

```http
POST /api/users/{userId}/enable
```

Backend:

- Chỉ `ROLE_ADMIN`.
- Disable yêu cầu reason không rỗng.
- Chỉ disable account đã verify; pending account tiếp tục dùng resend/social activation flow.
- Disable:
  1. `enabled=false`.
  2. Ghi metadata disable.
  3. Tăng `tokenVersion`.
  4. `saveAndFlush`.
- Enable:
  1. Chỉ cho phép khi `emailVerified=true`.
  2. `enabled=true`.
  3. Xóa metadata disable.
  4. Tăng `tokenVersion` để mọi token được phát trước thay đổi state vẫn không dùng lại được.
- Không cho actor thao tác trên chính mình.
- Không cho disable ADMIN hoạt động cuối cùng.

### 4.3. Gom logic revoke vào một helper

Tạo helper duy nhất trong domain/service:

```java
private void revokeAllSessions(User user) {
    user.setTokenVersion(currentTokenVersion(user) + 1);
}
```

Gọi helper khi:

- Password thay đổi/reset.
- Role thay đổi.
- `enabled` thay đổi.
- Thay đổi email đăng nhập nếu sau này cho phép.

Không dựa vào frontend logout để revoke.

### 4.4. Visibility của store khi owner bị disable

Sửa `StoreVisibilityPolicy.canViewPublicly`:

```text
store.status == APPROVED
AND store.owner != null
AND store.owner.enabled == true
```

Áp dụng cùng invariant cho:

- Public store list/detail/category.
- Random store.
- Ranking.
- Saved stores response.
- Public food-item list/detail.

Repository public query nên dùng điều kiện owner enabled, ví dụ:

```java
findByStatusAndOwnerEnabledTrue(StoreStatus status)
findByCategoryIdAndStatusAndOwnerEnabledTrue(...)
```

Policy vẫn kiểm lại ở service để tránh một endpoint mới quên điều kiện repository.

Không chuyển store sang `HIDDEN` khi khóa owner vì:

- `HIDDEN` là moderation state của chính store.
- Việc đổi status hàng loạt làm mất trạng thái APPROVED ban đầu.
- Re-enable sẽ khó xác định store nào cần phục hồi.

## 5. N-01 — Hoàn thiện revoke JWT khi thay đổi quyền/trạng thái

### Backend

Files dự kiến:

- `UserService.java`
- `AuthenticationService.java`
- `UserController.java`
- DTO disable request mới.
- `ErrorCode.java`

Thực hiện:

1. Giữ logic role comparison hiện tại.
2. Dùng helper `revokeAllSessions` thay vì tăng version rải rác.
3. Thêm disable/enable service methods và endpoint.
4. Từ chối self-disable/self-delete và bảo vệ last active admin.
5. Giữ social rule hiện tại: chỉ pending/unverified mới được social activate; disabled/verified phải bị từ chối.

### Frontend

- Admin user list hiển thị badge: `Chờ xác thực`, `Hoạt động`, `Đã khóa`.
- Thêm action Khóa/Mở khóa độc lập với modal sửa role.
- Disable phải nhập reason và xác nhận.
- Sau thao tác reload user list và admin store list.

### Tests

- Role không đổi → `tokenVersion` không đổi.
- Demote ADMIN → `tokenVersion + 1`.
- Token ADMIN được phát trước demote → `CustomJwtDecoder`/introspection từ chối.
- Disable active user → access và refresh token cũ đều bị từ chối.
- Social login không bật lại disabled/verified account.
- Enable pending/unverified account → bị từ chối.
- Không thể disable chính mình hoặc ADMIN hoạt động cuối cùng.
- Quán APPROVED của disabled owner không xuất hiện ở mọi public read path.

## 6. N-02 — Hard-delete user có kiểm soát và giữ audit

### 6.1. Tách orchestration khỏi `UserService`

Tạo `UserDeletionService` với `@Transactional`. Không thêm cascade JPA mù quáng vào `User` hoặc `Store`.

Lý do:

- Thứ tự xóa phải rõ để tránh foreign key.
- Một số dữ liệu cần xóa, một số cần tính lại counter, audit cần giữ.
- Media cleanup là external side effect, không thể rollback cùng database transaction.

### 6.2. Contract xóa

Giữ endpoint hiện tại nhưng yêu cầu payload xác nhận:

```http
DELETE /api/users/{userId}
Content-Type: application/json

{
  "reason": "Đăng nội dung vi phạm",
  "confirmation": "username-cua-user"
}
```

Rules:

- `reason` bắt buộc.
- `confirmation` phải khớp username hiện tại.
- Không xóa chính admin đang đăng nhập.
- Không xóa ADMIN hoạt động cuối cùng.
- Response chỉ thành công sau khi transaction database hoàn tất.
- Việc cleanup Cloudinary thất bại không làm khôi phục dữ liệu database; asset được đưa vào retry queue.

### 6.3. Thứ tự xóa trong transaction

1. Lock target user để ngăn update đồng thời.
2. Kiểm self-delete/last-admin guard.
3. Lấy danh sách store target đang sở hữu.
4. Ghi deletion audit tối thiểu trước khi xóa.
5. Với từng owned store:
   - Thu thập managed media IDs để cleanup sau commit.
   - Xóa `user_saved_stores` theo store.
   - Xóa `store_ratings` theo store.
   - Xóa `store_daily_reports` theo store.
   - Xóa `food_items` theo store.
   - Xóa store.
   - **Không xóa `store_audit_logs`.**
6. Xóa hoạt động của target trên store của người khác:
   - Saved stores theo `userId`.
   - Ratings theo `userId`.
   - Daily reports theo `userId`.
7. Tính lại `savedCount`, rating counts, `totalVotes`, `satisfactionRate` cho các store bị ảnh hưởng ở bước 6.
8. Xóa verification token theo user ID.
9. Xóa password reset OTP theo normalized email.
10. Xóa join rows user-role theo cơ chế repository/JPA đã kiểm chứng.
11. Anonymize audit nơi target từng là actor:
    - `actorId = null`.
    - `actorEmail = null` hoặc sentinel không chứa PII.
    - Giữ `actorRole`, action, reason và timestamp.
12. Xóa user và `flush` để phát hiện foreign key trong transaction.
13. Sau commit, enqueue cleanup avatar/banner/food assets.

Repository methods cần bổ sung:

```java
deleteByUserId(...)
deleteByEmail(...)
findDistinctStoreIdsByUserId(...)
anonymizeActorByActorId(...)
```

### 6.4. Audit policy

Sửa `hardDeleteStore` để không gọi `storeAuditLogRepository.deleteByStoreId`.

Audit giữ lại phải là detached record, không có FK bắt buộc tới User hoặc Store. Đề xuất:

- Cho `actorId`, `actorEmail` nullable để anonymize khi actor bị xóa.
- Thêm action `USER_DELETION_CASCADE` cho store bị xóa cùng account.
- Audit record lưu admin thực hiện hard-delete và reason.
- Không lưu password, token, social ID, avatar URL hoặc nội dung email.
- Đặt retention policy, ví dụ 12 tháng; cleanup bằng scheduled job sau này.

Nếu cần giữ bằng chứng nội dung vi phạm, phải xác định chính sách retention riêng. Blueprint mặc định chỉ giữ metadata audit, không giữ bản sao bài đăng/ảnh đã xóa.

### 6.5. Frontend admin deletion UX

- Hiển thị trước impact summary: số quán, món và asset dự kiến xóa.
- Bắt buộc nhập lý do.
- Bắt buộc gõ username để xác nhận.
- Disable nút submit khi request đang chạy để tránh double-submit.
- Sau thành công reload users, admin stores, public stores và pending list.

### 6.6. Tests

Dùng integration test với H2/MySQL-compatible schema, không chỉ mock:

- User không có dữ liệu → xóa thành công.
- User có verification token/OTP/saved stores → xóa sạch.
- User sở hữu APPROVED/PENDING/HIDDEN store với food/rating/report/save → xóa toàn bộ graph.
- Rating/save của target trên store người khác bị xóa và counters được tính lại.
- Audit của store bị xóa vẫn tồn tại.
- Audit do target từng thực hiện được anonymize.
- Không còn FK tới user sau transaction.
- Không thể tự xóa hoặc xóa last active admin.
- Lỗi giữa transaction → toàn bộ database rollback.

## 7. N-03 — Media lifecycle an toàn

### 7.1. Sửa avatar trước

Luồng mới:

```text
validate file
→ upload avatar mới
→ saveAndFlush URL + publicId mới
→ commit database
→ xóa avatar cũ best-effort sau commit
```

Nếu upload mới thành công nhưng `saveAndFlush` thất bại:

```text
xóa asset mới best-effort
→ log cleanup failure nếu có
→ trả UPLOAD_FAILED/generic data conflict phù hợp
```

Không xóa avatar provider/external nếu `avatarPublicId` null.

Không gọi external Cloudinary delete bên trong database transaction trước commit. Có thể dùng `TransactionSynchronization.afterCommit` trong bước đầu; giải pháp bền vững hơn là cleanup job/outbox.

Tests:

- Upload fail → DB và avatar cũ giữ nguyên.
- DB save fail → avatar cũ giữ nguyên, asset mới được cleanup.
- Thành công → DB trỏ asset mới rồi mới xóa asset cũ.
- Xóa asset cũ fail → request vẫn thành công, lỗi được log/queue retry.

### 7.2. Không dùng generic upload cho create flow

Thay vì upload banner rồi gửi URL vào `StoreRequest`, dùng resource-bound endpoints:

```http
PATCH /api/v1/stores/{storeId}/banner
PATCH /api/v1/stores/{storeId}/food-items/{foodItemId}/image
```

Mỗi endpoint:

- Kiểm owner/admin ở backend.
- Validate size, MIME và decoded image type.
- Upload vào folder do backend quyết định; client không truyền `folder`.
- Lưu cả URL và `publicId`.
- Sau DB commit mới xóa asset cũ.

Tạo store flow đề xuất:

```text
submit dữ liệu store không kèm banner
→ backend tạo store PENDING
→ nếu có file, gọi endpoint upload banner với storeId
→ nếu upload thất bại, store vẫn tồn tại không banner và UI cho retry
```

Không cho nút “Tạo quán” chạy khi request tạo/upload đang chạy. Không phụ thuộc vào giá trị URL trong React state để suy ra upload đã hoàn tất.

### 7.3. Theo dõi asset ownership

Bổ sung `avatarPublicId`, `bannerImagePublicId`, `foodImagePublicId` tối thiểu. Khuyến nghị tốt hơn là bảng chung:

```text
media_assets
- id
- public_id unique
- secure_url
- owner_user_id
- resource_type: AVATAR | STORE_BANNER | FOOD_IMAGE
- resource_id nullable
- status: TEMPORARY | ATTACHED | PENDING_DELETE
- created_at
- attached_at
- delete_attempts
- last_error
```

Nếu áp dụng bảng chung:

- Upload tạo `TEMPORARY` với TTL ngắn.
- Attach thành công chuyển `ATTACHED`.
- Thay/xóa resource chuyển asset cũ thành `PENDING_DELETE`.
- Scheduled cleanup xóa TEMPORARY quá hạn và retry PENDING_DELETE.

Với phạm vi hiện tại, resource-bound upload không cần temporary asset cho create flow và đơn giản hơn. Bảng `media_assets` vẫn cần nếu tiếp tục cho phép upload trước khi resource tồn tại.

### 7.4. Xóa user/store và media

- Thu thập `publicId` trước khi xóa database records.
- Commit database trước.
- Cleanup Cloudinary sau commit.
- Nếu cleanup lỗi, ghi pending cleanup record để retry.
- Không cố suy ngược `publicId` từ URL tùy ý.

### 7.5. External image URL

Hiện banner/food image cho phép nhập URL trực tiếp. Đề xuất một trong hai policy:

1. **Khuyến nghị:** chỉ cho upload managed image, bỏ nhập URL trực tiếp.
2. Nếu vẫn giữ URL: HTTPS-only, allowlist CDN/image hosts, frontend đặt `referrerPolicy="no-referrer"`; URL ngoài không được Cloudinary cleanup.

## 8. N-04 — Chỉ lưu và render Google Maps URL đã được xác thực

### 8.1. Contract mới

`StoreRequest` tiếp tục nhận `mapUrl`, nhưng service không được map thẳng chuỗi client vào entity.

Luồng create/update:

```text
nhận mapUrl
→ parse URI
→ kiểm HTTPS/host/path/port/user-info
→ resolve DNS và chặn IP private/loopback/link-local
→ theo từng redirect với cùng policy
→ trích xuất tọa độ
→ chuẩn hóa URL
→ lưu normalizedMapUrl + latitude + longitude
```

Nếu client gửi cả URL và tọa độ:

- Tọa độ do resolver trích xuất là nguồn tin cậy và ghi đè tọa độ client gửi.
- Không cho client ghép một Google Maps URL hợp lệ với tọa độ tùy ý khác.

Nếu không gửi `mapUrl`:

- Có thể lưu tọa độ hợp lệ do map picker cung cấp.
- Backend tự tạo URL chuẩn dạng `https://www.google.com/maps/search/?api=1&query=lat,lng` trước khi lưu, để store luôn có link tiện mở.

Validation tọa độ:

- latitude trong `[-90, 90]`.
- longitude trong `[-180, 180]`.
- Nếu nghiệp vụ yêu cầu, kiểm tọa độ nằm trong vùng Cần Giuộc bằng bounding box/polygon riêng.

### 8.2. Allowlist Google Maps

Không dùng kiểm tra chuỗi kiểu `url.contains("google.com")`. So sánh canonical hostname chính xác.

Allowlist đề xuất:

| Host | Path được chấp nhận |
|---|---|
| `maps.app.goo.gl` | Short-link path hợp lệ |
| `goo.gl` | Chỉ path bắt đầu bằng `/maps/` |
| `google.com` | Chỉ path `/maps`, `/maps/…` hoặc Maps query URL đã biết |
| `www.google.com` | Chỉ path `/maps`, `/maps/…` hoặc Maps query URL đã biết |
| `maps.google.com` | Maps path/query hợp lệ |

Mọi URL phải:

- Có scheme `https`.
- Không có username/password trong URL.
- Không dùng port tùy ý; chỉ default HTTPS hoặc `443`.
- Có chiều dài tối đa, ví dụ 2.048 ký tự.
- Không chứa control character.
- Resolve hoàn toàn về public IP.
- Mọi redirect đều phải được kiểm tra lại trước khi fetch.
- Redirect cuối cùng vẫn phải thuộc Google Maps allowlist.
- Resolver phải trích xuất được cặp tọa độ hợp lệ trước khi URL được lưu.

`GoogleMapsUrlResolver` nên cung cấp một kết quả typed thay vì chỉ trả danh sách chuỗi:

```java
record GoogleMapsResolution(
    String normalizedUrl,
    double latitude,
    double longitude
) {}
```

Với short link như `https://maps.app.goo.gl/...`, ưu tiên lưu URL Google Maps cuối cùng đã được resolver xác nhận. Nếu cần giữ short link để URL gọn hơn, chỉ giữ original short link sau khi toàn bộ redirect chain và destination cuối đã vượt qua validation.

### 8.3. Chuẩn hóa trước khi lưu

`normalizedUrl` phải:

- Dùng scheme/hostname chữ thường theo canonical form.
- Bỏ fragment không cần thiết.
- Không chứa user-info hoặc port lạ.
- Giữ path/query cần thiết để Google Maps mở đúng địa điểm.
- Không lấy URL từ HTML body để lưu nếu URL đó chưa qua cùng validator.

Entity chỉ nhận `normalizedUrl` từ validator/resolver; mapper không copy trực tiếp `request.mapUrl`.

Create và update dùng cùng một `GoogleMapsLinkPolicy`, tránh trường hợp create an toàn nhưng update ghi được URL tùy ý.

### 8.4. Frontend defense-in-depth

Tạo utility duy nhất:

```js
function getSafeGoogleMapsUrl(mapUrl, latitude, longitude) {
  if (isAllowedGoogleMapsUrl(mapUrl)) return mapUrl
  if (!isValidCoordinate(latitude, longitude)) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
}
```

`isAllowedGoogleMapsUrl` phải dùng `new URL()` và exact hostname/path allowlist, không dùng `includes('google.com')`.

Dùng utility tại:

- `StoreDetailDrawer.jsx`.
- Admin store detail.
- Bất kỳ card/action “Mở bản đồ” nào khác.

Frontend ưu tiên stored normalized Google Maps URL để giữ trải nghiệm mở đúng địa điểm. Nếu dữ liệu legacy không hợp lệ nhưng có tọa độ, fallback sang URL được tạo từ tọa độ. Nếu cả hai không hợp lệ thì không render nút bản đồ.

Thêm `target="_blank"` cùng `rel="noopener noreferrer"` cho external navigation.

### 8.5. Legacy data

Trước deployment production sau này:

- Chạy audit/backfill từng `map_url` qua cùng backend policy.
- URL Google Maps hợp lệ được chuẩn hóa và giữ lại.
- URL không hợp lệ nhưng có tọa độ được thay bằng URL Google Maps tạo từ tọa độ.
- Record không có URL hợp lệ và không có tọa độ sẽ không hiển thị nút bản đồ cho đến khi owner cập nhật.

### 8.6. Tests

- Link ví dụ `https://maps.app.goo.gl/oW3cwtzLXYQXrYLN8` resolve, lưu normalized Google Maps URL và tọa độ.
- `javascript:`, `data:`, HTTP và non-Google HTTPS bị backend từ chối và không xuất hiện trong rendered `href`.
- `https://google.com.attacker.example`, URL có user-info và port lạ bị từ chối.
- `goo.gl` ngoài path `/maps/` bị từ chối.
- Redirect Google → non-Google và redirect tới private IP bị từ chối.
- Tọa độ hợp lệ không kèm URL tạo được Google Maps URL chuẩn.
- Dữ liệu legacy URL lỗi nhưng tọa độ đúng dùng fallback an toàn.
- Tọa độ null/NaN/out-of-range không tạo fallback link.

## 9. Database/schema impact

Thay đổi dự kiến:

- User disable metadata columns.
- Store/food image `publicId` columns hoặc bảng `media_assets`.
- Cho audit actor columns nullable nếu chọn anonymize bằng null.
- Repository indexes cho owner/status/enabled query nếu query plan cần.
- Có thể thêm deletion/media cleanup audit table.

Trong môi trường local hiện tại, `ddl-auto=update` có thể hỗ trợ thử nghiệm thêm cột/table. Tuy nhiên:

- Không dùng `ddl-auto=update` để chứng minh deletion order/cascade đúng.
- Thay nullable constraint hoặc xóa cột thường không được xử lý an toàn bởi auto-update.
- Khi chuẩn bị hosting thật vẫn phải tạo migration versioned và test trên schema copy.

Blueprint này chưa yêu cầu tạo migration ngay trong lượt implementation local, nhưng entity change phải được ghi lại để chuyển thành migration trước production.

## 10. Thứ tự triển khai đề xuất

### Phase 1 — Account state và JWT

1. Thêm disable metadata và admin endpoints.
2. Gom revoke helper.
3. Bảo vệ self/last-admin.
4. Áp owner-enabled vào `StoreVisibilityPolicy` và public queries.
5. Thêm backend/frontend tests.

### Phase 2 — User deletion và audit

1. Sửa store hard-delete để không xóa audit.
2. Thêm repository cleanup methods.
3. Tạo `UserDeletionService` transactional.
4. Anonymize audit.
5. Recalculate counters.
6. Thêm confirmation UX và integration tests.

### Phase 3 — Avatar atomic replacement

1. Đổi thứ tự upload/save/delete.
2. Thêm compensation cleanup.
3. Test failure matrix.

### Phase 4 — Store/food media lifecycle

1. Lưu `publicId`/ownership.
2. Thêm resource-bound upload endpoints.
3. Bỏ folder tùy ý từ client.
4. Chuyển create/edit frontend flow.
5. Thêm orphan cleanup/retry.

### Phase 5 — Map URL hardening

1. Thêm typed Google Maps validation/resolution result.
2. Validate và normalize `mapUrl` ở cả create/update trước khi lưu.
3. Thêm frontend exact-host allowlist và coordinate fallback.
4. Audit/backfill legacy URL.
5. Test malicious schemes/hosts/redirects và coordinate validation.

## 11. Phân nhóm commit dự kiến

```text
feat(accounts): add administrative account status controls
fix(auth): revoke sessions after authority or status changes
fix(stores): hide content owned by disabled accounts
feat(users): delete account data with anonymized audit retention
fix(media): make avatar replacement failure-safe
feat(media): bind uploaded assets to stores and food items
fix(maps): render trusted coordinate-based Google Maps links
test(security): cover account lifecycle and deletion invariants
docs: update account and media lifecycle contracts
```

## 12. Acceptance checklist

### Account/JWT

- [ ] Demote ADMIN làm access/refresh token cũ bị từ chối ngay.
- [ ] Disable làm mọi token cũ bị từ chối ngay.
- [ ] Social login không re-enable admin-disabled account.
- [ ] Pending verification vẫn có thể được kích hoạt qua verify/social đúng policy.
- [ ] Self-disable/self-delete và last-admin removal bị chặn.

### Store visibility

- [ ] Quán APPROVED của disabled owner không xuất hiện public.
- [ ] Food item, random, ranking và saved-store không bypass rule.
- [ ] Re-enable owner làm APPROVED store public lại mà không sửa moderation status.

### User deletion/audit

- [ ] Xóa user có store không gặp foreign key error.
- [ ] Store, food, save, rating, report, token, OTP và role links liên quan được xóa.
- [ ] Counters của store còn tồn tại được tính lại.
- [ ] Store audit vẫn còn sau hard-delete.
- [ ] Audit của target được anonymize và không chứa PII.
- [ ] Transaction lỗi giữa chừng không để graph bị xóa một phần.

### Media

- [ ] Upload mới lỗi không làm mất avatar/banner/ảnh món cũ.
- [ ] DB save lỗi làm asset mới được cleanup/retry.
- [ ] UI không submit create/update khi upload đang chạy.
- [ ] Xóa resource/account enqueue cleanup đúng `publicId`.
- [ ] Orphan temporary assets có TTL cleanup.

### Maps

- [ ] Backend chỉ lưu Google Maps URL đã xác thực và chuẩn hóa.
- [ ] Short link hợp lệ vẫn mở đúng Google Maps và vẫn trích xuất được tọa độ.
- [ ] Frontend chỉ render exact-host Google Maps URL hoặc fallback tạo từ tọa độ.
- [ ] Dữ liệu legacy độc hại không thể trở thành clickable link.

## 13. Ngoài phạm vi blueprint

- Khôi phục tài khoản đã hard-delete.
- Legal hold hoặc lưu bản sao đầy đủ nội dung vi phạm.
- Production migration/deployment.
- Cloudinary billing/quota policy ngoài ứng dụng.
- Distributed cleanup worker nhiều instance.

Những mục này cần quyết định riêng trước khi production, nhưng không ngăn việc triển khai và kiểm thử local theo các phase trên.
