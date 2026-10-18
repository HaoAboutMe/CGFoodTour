# CG FoodTour — P1 Product Readiness Blueprint

> Trạng thái: **ĐÃ TRIỂN KHAI LẠI TRONG WORKTREE — CHỜ NGHIỆM THU MYSQL/TRÌNH DUYỆT**
> Ngày lập: 18/10/2026
> Cập nhật: 18/10/2026 — đưa blueprint về đúng mốc code ngày 17/10 và giữ cách tải hiện tại của Google/Facebook SDK.
> Phạm vi: session cookie, store state machine, counter đồng thời, truy vấn “Gần tôi”, pagination còn thiếu, timezone/cleanup, HTML email và URL chia sẻ cho từng quán.
> Mục tiêu: hoàn thiện các đề mục 7–13 trước khi mở beta/public; tài liệu này là công thức triển khai và tiêu chí nghiệm thu.

## 0. Mốc hiện trạng sau khi triển khai lại ngày 18/10/2026

- Việc triển khai lại bắt đầu từ mốc code đã ghi trong `DAILY_2026-10-17.md`; không tái sử dụng code đã bị discard trước đó.
- Giữ nguyên cách tải Google Identity Services và Facebook SDK từ `frontend/index.html`. Không chuyển hai SDK này sang lazy-load hoặc dynamic loader, vì cách làm đó trước đây khiến đăng nhập Google không khởi tạo thành công.
- Đã triển khai lại session cookie/CSRF và access token in-memory, store transition policy/audit, counter locking/reconciliation, business timezone/cleanup, backend filter trước pagination, pagination bổ sung, HTML email escaping và route canonical cho quán.
- Automated verification hiện tại: backend **62 test pass**; frontend production build pass; frontend lint không có error; test slug URL pass.
- Chưa chạy migration trên bản sao MySQL, Testcontainers/concurrency test, browser E2E OAuth/cookie/deep-link hoặc kiểm tra CSP enforce. B14 metadata server-rendered/sitemap động vẫn cần hoàn tất cùng hạ tầng production.

Checkbox trong Definition of Done chỉ được đánh dấu cho phần đã có bằng chứng tự động tương ứng; các mục browser/MySQL/production vẫn để mở.

## 1. Kết quả bắt buộc sau khi hoàn thành

1. Refresh token không còn xuất hiện trong JSON response, JavaScript state hoặc `localStorage`.
2. Access token chỉ tồn tại trong memory và được phục hồi bằng refresh cookie sau khi reload trang.
3. Refresh token tiếp tục được rotate; refresh token cũ không thể dùng lại.
4. Đăng nhập Google/Facebook khởi tạo ổn định với cách tải SDK hiện tại; CSP không chặn script, frame, connection hoặc callback cần thiết của provider.
5. Mọi thay đổi trạng thái quán đi qua một state machine dùng chung và có audit.
6. Rating và bookmark không mất counter khi nhiều request cùng thao tác trên một quán.
7. Tìm kiếm, category, đang mở cửa, bán kính và khoảng cách được lọc trước pagination tại backend.
8. “Gần tôi” trả kết quả gần nhất trong toàn bộ dữ liệu phù hợp, không chỉ trong 24 quán đã tải.
9. Danh sách quán của tôi, quán đã lưu và số liệu admin không còn suy ra từ page đầu tiên.
10. Business date và scheduler dùng rõ timezone `Asia/Ho_Chi_Minh`; không còn xóa toàn bộ daily report lúc nửa đêm.
11. Invalidated JWT, OTP, verification token và media cleanup task có lifecycle hữu hạn.
12. Mọi dữ liệu động trong HTML email được escape.
13. Mỗi quán có URL ổn định, mở trực tiếp/reload được và có thể chia sẻ.

## 2. Ngoài phạm vi

Blueprint này không triển khai:

- Flyway baseline toàn hệ thống và pipeline deployment production.
- Redis/distributed lock cho nhiều backend instance.
- SSR framework hoặc chuyển toàn bộ React sang Next.js/Remix.
- Thiết kế lại giao diện tổng thể.
- Hệ thống notification center hoặc email queue hoàn chỉnh.
- Spatial database nâng cao ngay từ batch đầu; truy vấn khoảng cách MySQL chính xác với bounding box là đủ cho quy mô beta.

Các phần trên có thể được làm sau, nhưng migration phát sinh trong blueprint vẫn phải được viết theo chuẩn Flyway khi dự án bắt đầu áp dụng Flyway.

## 3. Nguyên tắc triển khai

- Không triển khai đồng thời tất cả thay đổi trong một commit.
- Backend contract phải hoàn thành và có test trước khi đổi frontend tương ứng.
- Không dùng response success để che lỗi rotation, cleanup hoặc database conflict.
- Không tính tổng từ dữ liệu của một page.
- Không dùng `ddl-auto=update` như một phần của giải pháp production.
- Các job cleanup phải idempotent, xử lý theo batch và có log tổng hợp; không log token/OTP/raw cookie.
- Giữ JSON error message bằng tiếng Anh; frontend map code sang thông báo tiếng Việt như quy ước hiện tại.

## 4. Thứ tự phụ thuộc

```text
B1 — Refresh cookie + access token in-memory
 ├── B2 — CSP tương thích social SDK hiện tại
 └── B3 — E2E auth/session nhiều tab

B4 — Store state machine + audit

B5 — Store row lock
 ├── B6 — Rating counter an toàn
 └── B7 — Saved counter an toàn + reconciliation

B8 — Business Clock/timezone
 ├── B9  — Backend geo/open/category query
 └── B10 — Cleanup lifecycle

B11 — Frontend pagination/facets/near-me

B12 — Escape email

B13 — Store deep link
 └── B14 — Metadata/canonical/share preview
```

`B8` phải có trước logic `openNow` và cleanup để mọi phép tính dùng cùng một thời gian.

---

## 5. Batch B1–B3 — Session an toàn và CSP

### 5.1. Contract token mới

Sau login email, Google login, Facebook login và refresh:

- Backend trả access token trong JSON.
- Backend đặt refresh token bằng cookie HttpOnly.
- JSON tuyệt đối không còn field `refreshToken` và `refreshExpiresIn`.
- Access token không được ghi vào cookie hoặc browser storage.

Response đề xuất:

```json
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "accessToken": "<short-lived-jwt>",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "authenticated": true
  }
}
```

Contract endpoint:

| Endpoint | Input mới | Output/cookie |
|---|---|---|
| `POST /auth/token` | JSON email/password | access JSON + set refresh cookie |
| `POST /auth/google-login` | JSON Google credential | access JSON + set refresh cookie |
| `POST /auth/facebook-login` | JSON Facebook token | access JSON + set refresh cookie |
| `POST /auth/refresh` | Không nhận refresh token trong body | rotate cookie + access JSON |
| `POST /auth/logout` | `Authorization: Bearer ...`, không cần token body | revoke access/refresh nếu hợp lệ + clear cookie |

DTO cần thay đổi:

- `AuthenticationResponse`: bỏ `refreshToken`, `refreshExpiresIn`.
- Không còn dùng `RefreshRequest`.
- Không còn dùng token pair trong `LogOutRequest`; request logout có thể không cần body.
- Controller đọc cookie bằng tên cấu hình, không đọc refresh token từ query/header tùy ý.

Không duy trì song song refresh token trong body sau khi frontend đã chuyển đổi. Monorepo này phải deploy backend/frontend cùng phiên bản để tránh tạo hai nguồn token.

### 5.2. Cookie policy đã chốt

Production:

| Thuộc tính | Giá trị |
|---|---|
| Tên | `__Host-cgft_refresh` |
| `HttpOnly` | `true` |
| `Secure` | `true` |
| `SameSite` | `Strict` |
| `Path` | `/` |
| `Domain` | Không đặt, dùng host-only cookie |
| `Max-Age` | Bằng thời hạn refresh token |

Local development dùng tên `cgft_refresh`, `Secure=false`, `SameSite=Strict`. Không sử dụng cấu hình local trong profile production.

Logout phải clear cookie với đúng `name`, `path`, `secure` và `sameSite` đã dùng khi tạo. Cookie hết hạn phải có `Max-Age=0`.

Ưu tiên deploy frontend và API dưới cùng một site. Nếu sau này buộc dùng hai site khác nhau, phải review lại `SameSite=None`, CSRF và CORS; không tự đổi chỉ để cookie “chạy được”.

### 5.3. CSRF và CORS

Bearer access token vẫn bảo vệ các business API. Refresh/logout dùng cookie nên phải có CSRF defense:

1. Server tạo thêm CSRF cookie không HttpOnly, giá trị random tối thiểu 128 bit.
2. Frontend gửi giá trị đó trong `X-CSRF-Token` cho `/auth/refresh` và `/auth/logout`.
3. Backend so sánh constant-time cookie/header và kiểm `Origin` thuộc exact allowlist.
4. Cookie CSRF được rotate khi login/refresh và clear khi logout.
5. Không tin `Origin: null`; không dùng wildcard origin khi `allowCredentials=true`.

Tên production đề xuất: `__Host-cgft_csrf`. Header: `X-CSRF-Token`.

Frontend `fetch` phải dùng `credentials: 'include'` cho login/social/refresh/logout. CORS production chỉ cho phép domain frontend chính thức.

### 5.4. Rotation và nhiều tab

Giữ nguyên nguyên tắc single-use refresh token hiện tại:

```text
đọc refresh cookie
→ verify signature/type/expiry/tokenVersion/enabled
→ invalidate JTI cũ trong cùng transaction
→ phát access + refresh token mới
→ set refresh cookie mới
```

Frontend cần một `AuthSessionProvider` dùng chung:

- Access token chỉ là React state/ref.
- Khi app khởi động, gọi refresh một lần trước khi kết luận user chưa đăng nhập.
- Mọi request 401 chỉ tham gia một `refreshPromise` trong tab hiện tại.
- Dùng `BroadcastChannel('cgft-auth')` để phát sự kiện `LOGIN`, `TOKEN_REFRESHED`, `LOGOUT` giữa các tab.
- Nếu hai tab refresh đồng thời, tab nhận 401 chờ ngắn rồi thử lại một lần bằng cookie mới; không clear cookie ngay tại lần refresh thất bại đầu tiên.
- Sau lần retry vẫn thất bại mới xóa session memory và chuyển về anonymous.
- Logout một tab phải làm các tab khác xóa access token memory.

Không ghi token vào payload của `BroadcastChannel`.

### 5.5. Frontend migration

Tách logic đang nằm trong `App.jsx` thành tối thiểu:

```text
src/auth/AuthSessionProvider.jsx
src/auth/authApi.js
src/auth/useAuthSession.js
src/api/apiClient.js
```

Xóa toàn bộ:

- `localStorage.getItem('jwtToken')`;
- `localStorage.getItem('refreshToken')`;
- `localStorage.setItem/removeItem` cho hai token;
- request body chứa refresh token;
- DevConsole state có thể nhận token.

`apiClient` nhận access token qua callback/ref, không import trực tiếp component state. Bootstrap auth phải có trạng thái riêng `checking | authenticated | anonymous` để tránh chớp màn hình login khi reload.

### 5.6. Giữ ổn định cách tải social SDK

Giữ Google Identity Services và Facebook SDK được khai báo trực tiếp trong `frontend/index.html` như code tại mốc 17/10/2026. Không xóa hai `<script>` này và không tạo lazy-loader/dynamic loader thay thế trong batch P1.

Khi chỉnh auth/session hoặc CSP phải bảo toàn:

- thứ tự khởi tạo hiện tại của `window.fbAsyncInit` và `window.google.accounts.id`;
- khả năng render nút Google ở cả màn hình đăng nhập và đăng ký sau khi SDK sẵn sàng;
- Facebook SDK init và callback đăng nhập hiện tại;
- thông báo lỗi tiếng Việt khi provider không khả dụng;
- login email/password vẫn hoạt động nếu Google/Facebook SDK tải thất bại.

Mọi thay đổi tương lai đối với cách tải social SDK phải nằm trong một blueprint riêng và chỉ được chấp nhận sau khi browser E2E chứng minh đăng nhập Google lẫn Facebook thành công trên tải trang mới, reload và mạng chậm.

### 5.7. CSP baseline

CSP production được cấu hình tại nơi phục vụ frontend hoặc reverse proxy, không chỉ bằng meta tag. Baseline:

```text
default-src 'self';
script-src 'self' https://accounts.google.com https://connect.facebook.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://res.cloudinary.com;
connect-src 'self' <API_ORIGIN> https://accounts.google.com https://graph.facebook.com;
frame-src https://accounts.google.com https://www.facebook.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self';
upgrade-insecure-requests;
```

Không thêm `'unsafe-inline'` hoặc `'unsafe-eval'` vào `script-src` để chữa lỗi tạm. Danh sách host thực tế phải được xác nhận bằng report-only CSP trước khi enforce.

### 5.8. Test bắt buộc

- Login response không chứa refresh token.
- Refresh body/query/header không được dùng thay cookie.
- Cookie production có đủ HttpOnly/Secure/SameSite/Path và không có Domain.
- Refresh thiếu/sai CSRF trả 403.
- Rotation thành công làm token cũ không dùng lại được.
- Logout clear cookie kể cả access token đã hết hạn hoặc malformed.
- Reload trang phục hồi session bằng cookie.
- 401 đồng thời trong một tab chỉ tạo một refresh request.
- Hai tab refresh/logout không lưu hoặc truyền raw token.
- `localStorage` và DevConsole không chứa access/refresh token.
- Google login và Facebook login thành công sau tải trang mới và sau reload với các `<script>` hiện tại trong `frontend/index.html`.
- Email login vẫn hoạt động nếu Google/Facebook SDK không tải được.

---

## 6. Batch B4 — Store state machine và audit

### 6.1. Ma trận transition chuẩn

| Action | From | To | Actor | Điều kiện |
|---|---|---|---|---|
| `SUBMIT` | Không tồn tại | `PENDING` | User | Dữ liệu hợp lệ |
| `APPROVE` | `PENDING` | `APPROVED` | Admin | Không cho approve trạng thái khác |
| `REJECT` | `PENDING` | `REJECTED` | Admin | Reason bắt buộc |
| `EDIT_PENDING` | `PENDING` | `PENDING` | Owner/Admin | Giữ chờ duyệt |
| `RESUBMIT_AFTER_EDIT` | `REJECTED` | `PENDING` | Owner | Clear rejection reason |
| `RESUBMIT_AFTER_EDIT` | `APPROVED` | `PENDING` | Owner | Thay đổi public phải duyệt lại |
| `EDIT_HIDDEN` | `HIDDEN` | `HIDDEN` | Owner/Admin | Edit không tự khôi phục |
| `HIDE` | `APPROVED` | `HIDDEN` | Owner/Admin | Admin bắt buộc reason |
| `RECOVER` | `HIDDEN` | `APPROVED` | Owner/Admin | Admin-hidden chỉ admin recover |

Không cho phép:

- approve/reject `APPROVED`, `REJECTED` hoặc `HIDDEN`;
- edit quán rồi vô tình clear `hiddenByAdmin`;
- owner dùng edit để đưa quán admin-hidden trở lại public;
- recover quán không ở `HIDDEN`;
- reject không có reason.

### 6.2. Thiết kế code

Tạo `StoreTransitionPolicy` hoặc `StoreStateMachine` với API rõ:

```java
StoreTransitionResult transition(Store store, StoreAction action, ActorContext actor)
```

Service không tự `setStatus` rải rác. Policy chịu trách nhiệm:

- kiểm tra source state;
- kiểm tra role/ownership liên quan transition;
- trả target state và các field cần clear/giữ;
- ném một business error thống nhất khi transition sai.

Không đưa repository, email hoặc mapper vào policy để unit test thuần túy.

### 6.3. Audit

Ghi `StoreAuditLog` trong cùng transaction với thay đổi trạng thái. Bổ sung action type:

```text
SUBMIT, APPROVE, REJECT, RESUBMIT_AFTER_EDIT,
HIDE, RECOVER, REQUEST_RECOVERY, REJECT_RECOVERY_REQUEST, HARD_DELETE
```

Audit tối thiểu gồm store ID/name, actor ID/email tại thời điểm thao tác, actor role, action, reason và thời gian. Không ghi request body, token hoặc ảnh binary.

Email thông báo nếu có phải chạy sau commit hoặc best-effort; SMTP lỗi không được rollback quyết định moderation đã commit.

### 6.4. Error contract

Thêm mã riêng, HTTP 409:

```text
INVALID_STORE_STATE_TRANSITION
```

JSON message giữ tiếng Anh. Frontend map thành:

> Trạng thái quán đã thay đổi. Vui lòng tải lại dữ liệu và thử lại.

### 6.5. Test bắt buộc

- Unit test toàn bộ ô hợp lệ và không hợp lệ trong ma trận.
- Approve/reject cùng quán liên tiếp: request thứ hai bị 409.
- Edit `APPROVED` chuyển `PENDING` và biến mất khỏi public list.
- Edit `HIDDEN` giữ nguyên hidden flags.
- Mỗi transition thành công tạo đúng một audit row.
- Transition thất bại không tạo audit và không gửi email.

---

## 7. Batch B5–B7 — Counter đúng khi request đồng thời

### 7.1. Chiến lược đã chốt

Dùng **pessimistic row lock theo store** cho rating và bookmark ở giai đoạn này. Đây là thay đổi nhỏ, dễ kiểm chứng và chỉ serialize thao tác trên cùng một quán.

Thêm repository method:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select s from Store s where s.id = :id")
Optional<Store> findByIdForUpdate(String id);
```

Quy tắc lock ordering:

```text
lock Store
→ đọc/ghi StoreRating hoặc UserSavedStore
→ aggregate lại từ bảng nguồn
→ cập nhật counter Store
→ commit
```

Mọi flow phải khóa theo cùng thứ tự để giảm deadlock. Không vừa dùng increment/decrement từ giá trị cũ vừa aggregate trong cùng code path.

### 7.2. Rating

Trong transaction:

1. Load user.
2. Lock store.
3. Kiểm store đang public/được phép rate.
4. Upsert rating theo unique `(user_id, store_id)`.
5. Flush rating.
6. Aggregate count theo rating level.
7. Ghi bốn counter và `satisfactionRate` vào store.

Không sử dụng dữ liệu counter cũ để tính kết quả mới.

### 7.3. Bookmark

Trong transaction:

1. Load user.
2. Lock store.
3. Kiểm visibility.
4. Insert/delete save row theo unique `(user_id, store_id)`.
5. Flush.
6. `countByStoreId` và ghi `savedCount`.

Nếu duplicate request tạo unique conflict, service reload trạng thái trong cùng policy và trả kết quả idempotent phù hợp; không trả raw constraint.

### 7.4. Reconciliation job

Tạo job cấu hình được, mặc định chạy ngoài giờ:

- lấy tối đa 100 store mỗi batch;
- group count rating/save từ bảng nguồn;
- chỉ update store bị lệch;
- log số store được kiểm tra và sửa, không log user;
- có endpoint/admin command thủ công hoặc service method để chạy khi cần;
- job idempotent.

Job là safety net, không thay thế transaction correctness.

### 7.5. Test bắt buộc

- Hai user rate cùng quán đồng thời không mất vote.
- Một user đổi rating đồng thời với user khác rate, tổng và từng level đúng.
- Hai save đồng thời không tạo duplicate và `savedCount` đúng.
- Save/unsave đồng thời không làm counter âm.
- Reconciliation sửa được dữ liệu counter cố tình làm sai.
- Chạy test đồng thời trên MySQL/Testcontainers; không chỉ dựa vào H2.

---

## 8. Batch B8–B11 — Timezone, geo query và pagination hoàn chỉnh

### 8.1. Business Clock

Thêm cấu hình:

```yaml
app:
  business-zone: ${APP_BUSINESS_ZONE:Asia/Ho_Chi_Minh}
```

Tạo bean `Clock`/`BusinessTimeProvider` và dùng cho:

- ngày report đóng cửa;
- kiểm tra quán đang mở;
- expiry/retention cleanup;
- timestamps mới trong service/job khi có thể.

Test dùng fixed clock. Scheduler khai báo rõ:

```java
@Scheduled(cron = "${...}", zone = "${app.business-zone:Asia/Ho_Chi_Minh}")
```

Timestamp kỹ thuật dài hạn nên lưu UTC/`Instant`; `LocalDate` của daily report là business date tại Cần Giuộc.

### 8.2. Public store query contract

Mở rộng `GET /v1/stores` nhưng giữ tương thích `categoryId` cũ trong một giai đoạn:

| Param | Quy tắc |
|---|---|
| `query` | Trim, giới hạn chiều dài, search name/address/landmark |
| `categoryIds` | CSV hoặc repeated param; tối đa 20 ID |
| `openNow` | Boolean, mặc định false |
| `latitude` | Bắt buộc cùng longitude khi sort/radius theo khoảng cách |
| `longitude` | Bắt buộc cùng latitude |
| `radiusKm` | Tùy chọn; mặc định 10, min 0.1, max 100 |
| `sort` | `newest`, `rating`, `saved`, `distance` |
| `page` | Zero-based |
| `size` | Mặc định 24, tối đa 100 |

Nếu `sort=distance` hoặc có `radiusKm` mà thiếu tọa độ, trả HTTP 400 bằng error code riêng. Không fallback về tâm thị trấn vì điều đó tạo kết quả “Gần tôi” sai nhưng trông có vẻ hợp lệ.

`PublicStoreResponse` thêm:

```json
{
  "distanceKm": 1.42,
  "openNow": true
}
```

Hai field có thể null khi request không yêu cầu tính khoảng cách/thời điểm.

### 8.3. Logic khoảng cách và đang mở

Backend thực hiện:

1. Chỉ lấy store `APPROVED` có owner enabled.
2. Áp category/query/open filter.
3. Nếu có vị trí, áp bounding box trước.
4. Tính khoảng cách chính xác bằng MySQL `ST_Distance_Sphere` hoặc công thức Haversine trong native query.
5. Áp radius trước pagination.
6. Sort distance tăng dần, sau đó `id` để kết quả ổn định.

Không tạo tọa độ giả cho quán thiếu latitude/longitude. Quán thiếu tọa độ bị loại khỏi truy vấn distance/radius.

Logic mở cửa:

```text
openTime < closeTime:
  openTime <= now < closeTime

openTime > closeTime (qua đêm):
  now >= openTime OR now < closeTime

openTime == closeTime:
  phải chốt business rule; blueprint chọn “mở 24 giờ”
```

Tất cả dùng `Asia/Ho_Chi_Minh` từ Business Clock.

### 8.4. Index và query plan

Migration tối thiểu:

- index `stores(status, category_id, created_at)`;
- index `stores(status, latitude, longitude)`;
- giữ index owner/FK hiện có;
- xác nhận bằng `EXPLAIN` với dữ liệu mẫu đủ lớn.

Nếu dữ liệu tăng đến mức query bounding box chậm, phase sau thêm cột `POINT SRID 4326` và SPATIAL index. Không bắt buộc đổi entity sang spatial ngay trong batch đầu.

### 8.5. Facets và admin summary

Không tính category count hoặc pending count từ `content` của page.

Thêm contract:

```http
GET /v1/stores/facets?query=&openNow=&latitude=&longitude=&radiusKm=
GET /v1/stores/admin/summary
```

`facets` trả count theo category trên toàn bộ tập phù hợp, không áp category filter đang chọn nếu UI cần hiển thị lựa chọn khác. Quy tắc này phải được test rõ.

Admin summary trả tối thiểu:

```json
{
  "pending": 0,
  "approved": 0,
  "rejected": 0,
  "hidden": 0,
  "recoveryRequested": 0
}
```

### 8.6. Frontend

`ExploreSection` không còn tự filter/sort toàn bộ store cho các điều kiện server hỗ trợ.

- Search/category/open/near-me thay đổi query params và reset page về 0.
- Debounce search.
- Bấm “Gần tôi” chỉ bật sau khi lấy GPS thành công.
- GPS bị từ chối: hiển thị thông báo và cho phép người dùng chọn vị trí thủ công; không âm thầm dùng tâm Cần Giuộc.
- Card hiển thị `distanceKm` do backend trả.
- “Xem thêm” append page đúng cùng filter snapshot; response cũ bị bỏ qua bằng request ID/abort signal.

Thêm page state riêng:

```text
myStoresPage
savedStoresPage
adminStoresPage
adminUsersPage
```

`loadMyStores` và `loadSavedStores` phải nhận page/filter, không mặc định lấy page đầu rồi coi là toàn bộ. UI có pagination hoặc “Xem thêm”, đồng thời hiển thị `totalElements` từ server.

Badge admin đọc `/admin/summary`, không dùng `adminPendingStores.length`.

### 8.7. Test bắt buộc

- Store gần nhất nằm ở page cũ thứ hai vẫn trở thành kết quả đầu khi sort distance.
- Radius loại đúng store ngoài vùng.
- Multiple categories hoạt động trước pagination.
- Open-now đúng với giờ thường, qua đêm và `openTime == closeTime`.
- Thiếu một trong latitude/longitude trả 400.
- GPS denied không tạo khoảng cách giả.
- Facet/admin summary không thay đổi theo page size.
- My stores/saved stores điều hướng được qua nhiều page.
- Native query chạy trên MySQL thật/Testcontainers và có `EXPLAIN` được ghi nhận.

---

## 9. Batch B10 — Cleanup lifecycle

### 9.1. Daily report

Xóa `deleteAllInBatch()` lúc nửa đêm. Việc đếm đã có `reportDate`, nên không cần “reset” toàn bảng.

Policy:

- business logic chỉ đếm report của business date hiện tại;
- giữ report 30 ngày mặc định để điều tra abuse;
- job xóa `reportDate < today - retentionDays` theo batch;
- unique `(user_id, store_id, report_date)` tiếp tục được giữ.

### 9.2. Invalidated JWT

- Xóa row có `expiryTime < now`.
- Chạy theo batch, ví dụ 500 row/lần.
- Có index `expiry_time`.
- Không xóa token chưa hết hạn.

### 9.3. OTP và verification token

- OTP expired hoặc used quá 24 giờ được xóa.
- Verification token hết hạn quá 7 ngày được xóa nếu không còn cần cho pending-account cleanup.
- Pending account cleanup và verification-token cleanup phải có thứ tự rõ để không vi phạm FK.
- Không log raw OTP/token.

### 9.4. Media cleanup task

Bổ sung field:

```text
status: PENDING | DEAD
next_attempt_at
attempts
last_attempt_at
last_error
```

Retry dùng exponential backoff có cap, ví dụ:

```text
5 phút → 15 phút → 1 giờ → 6 giờ → 24 giờ
```

Sau 10 lần lỗi, chuyển `DEAD`; không retry vô hạn. Admin/maintenance command có thể đưa task DEAD về PENDING sau khi nguyên nhân được sửa. `lastError` phải được cắt độ dài và không chứa credential.

### 9.5. Multi-instance safety

Trong lần hosting một instance, scheduler local đủ dùng. Trước khi chạy nhiều instance:

- dùng DB lease/ShedLock hoặc worker riêng;
- claim task atomically;
- không để hai worker cùng xóa một asset hoặc xử lý cùng cleanup batch.

### 9.6. Test bắt buộc

- Scheduler chạy với fixed clock tại ranh giới ngày Việt Nam.
- Daily report hôm nay không bị xóa.
- Record hết hạn bị xóa, record còn hiệu lực được giữ.
- Cleanup chạy lại không lỗi và không xóa thêm dữ liệu hợp lệ.
- Media task lên lịch đúng backoff và chuyển DEAD đúng ngưỡng.

---

## 10. Batch B12 — Escape HTML email

Tạo helper dùng chung, ví dụ `EmailTemplateEscaper`, hoặc gọi `HtmlUtils.htmlEscape` tại đúng boundary template.

Phải escape:

- username;
- store name;
- moderation reason;
- recovery reason;
- mọi nội dung lấy từ database/request trước khi chèn vào HTML.

Không escape toàn bộ HTML template. URL phải được tạo từ trusted base URL và encode query parameter riêng; không nối raw user input vào URL.

Trong `sendStoreStatusNotificationEmail`:

```text
safeStoreName = htmlEscape(storeName)
safeReason = htmlEscape(reason/defaultReason)
safeActionText = chọn từ enum/allowlist, không nhận raw action label
```

Nên thay `String actionType` bằng enum để tránh nhánh mặc định sai, đặc biệt hiện tại các action ngoài `HIDE` dễ bị hiển thị như “xóa vĩnh viễn”.

Test template với các payload:

```text
<script>alert(1)</script>
<img src=x onerror=alert(1)>
Tên & "ký tự đặc biệt"
reason nhiều dòng
```

Email HTML phải chứa entity escaped và không chứa tag/event handler do payload tạo ra.

---

## 11. Batch B13–B14 — URL riêng cho từng quán

### 11.1. URL canonical

Chọn format:

```text
/quan/{storeId}/{slug}
```

Ví dụ:

```text
/quan/banhxeo8568f5f78a51/banh-xeo-ba-hai
```

`storeId` là định danh thật; `slug` chỉ để đọc và SEO. Đổi tên quán không làm link cũ mất tác dụng.

Slug:

- lowercase;
- bỏ dấu tiếng Việt, chuyển `đ` thành `d`;
- chỉ giữ `a-z`, `0-9`, dấu `-`;
- gộp dấu `-` liên tiếp;
- giới hạn chiều dài;
- fallback `quan-an`.

Khi slug URL không đúng với tên hiện tại, frontend/backend thay bằng canonical URL bằng `replace`, không tạo vòng lặp.

### 11.2. React route behavior

Thêm route thật thay vì chỉ dùng tab state:

```text
/explore
/quan/:storeId/:slug?
```

Khi mở card:

```text
push /quan/{id}/{slug}
→ fetch GET /v1/stores/{id}
→ render loading/error/detail
```

Khi mở trực tiếp hoặc reload:

- không phụ thuộc store đã có trong page hiện tại;
- fetch store theo ID;
- store không public trả trang 404 tiếng Việt, không để lộ trạng thái moderation;
- close drawer dùng history back nếu đến từ Explore, nếu không thì về `/explore`.

Back/forward của trình duyệt phải mở/đóng đúng chi tiết quán. Link copy từ thanh địa chỉ phải mở đúng quán trên tab/browser khác.

### 11.3. Metadata trong SPA

Khi detail tải thành công, cập nhật:

- document title;
- meta description;
- canonical URL;
- Open Graph title/description/image/url;
- structured data phù hợp nếu dữ liệu đủ.

Cleanup metadata khi rời route để không giữ metadata của quán trước.

Lưu ý: metadata được thay bằng JavaScript **không bảo đảm** Facebook/Zalo bot đọc được. Đây chỉ là bước đầu cho browser và crawler có chạy JavaScript.

### 11.4. Share preview/SEO server-rendered

Trước khi quảng bá rộng, chọn một trong hai phương án theo kiến trúc hosting:

1. SSR/prerender động cho `/quan/**`; hoặc
2. Edge/backend trả HTML shell có metadata server-rendered, sau đó SPA hydrate/load như bình thường.

Không dùng prerender build-time cố định nếu quán được thêm sau mỗi lần build. HTML server-rendered phải lấy đúng public DTO/policy; quán pending/hidden/rejected trả 404 và `noindex`.

Reverse proxy phải fallback các route SPA hợp lệ về app nhưng không biến mọi URL sai thành HTTP 200. Cần có:

- `robots.txt`;
- sitemap động chỉ gồm quán public;
- canonical absolute URL dùng domain production;
- ảnh share mặc định nếu quán chưa có banner.

### 11.5. Test bắt buộc

- Click card đổi URL nhưng không reload toàn trang.
- Paste URL vào tab mới mở đúng quán.
- Reload route chi tiết không 404 từ static server/reverse proxy.
- Back/forward hoạt động đúng.
- Slug cũ redirect/replace sang canonical slug.
- Store không public trả 404 và không xuất hiện trong sitemap.
- HTML trả cho social crawler chứa OG data trước khi chạy JavaScript khi B14 hoàn thành.
- Nội dung metadata được escape; tên quán không thể chèn HTML/script.

---

## 12. Migration database dự kiến

Blueprint tạo ít nhất các thay đổi schema sau:

1. Index `invalidated_token(expiry_time)`.
2. Index hỗ trợ cleanup OTP/verification token theo expiry/created time.
3. Index store cho status/category/created và status/latitude/longitude.
4. Bổ sung `status`, `next_attempt_at` và index cho `media_cleanup_tasks`.
5. Xác nhận lại unique constraints rating/save/daily report đã tồn tại trong database thật.

Không thêm cascade delete rộng. Mỗi migration phải có:

- precondition hoặc câu lệnh tương thích schema hiện tại;
- test trên database trống;
- test upgrade từ snapshot local hiện tại;
- rollback/runbook thủ công cho index hoặc column quan trọng.

## 13. Danh sách file dự kiến tác động

| Nhóm | Khu vực chính |
|---|---|
| Session | `AuthenticationController`, `AuthenticationService`, auth DTO, `SecurityConfig`, `CorsConfig` |
| Frontend auth | `App.jsx`, `AuthModal`, auth provider/api client mới, `index.html` |
| State machine | `StoreService`, `StoreStatus`, policy/action mới, `StoreAuditLog`, error codes |
| Counter | `StoreRepository`, rating/save repositories, `StoreService`, reconciliation service |
| Geo/filter | `StoreController`, query DTO, `StoreRepository`, `PublicStoreResponse`, `PageResponse` |
| Pagination UI | `ExploreSection`, `SavedStoresSection`, `MyStoresSection`, `AdminSection`, `App.jsx` |
| Time/cleanup | time configuration, scheduled cleanup services, token/report/media repositories/entities |
| Email | `EmailService`, template helper và tests |
| Deep link | router/App, `StoreDetailDrawer`, slug/meta utilities, hosting fallback config |
| Schema | versioned migration files |

## 14. Kế hoạch commit

Không gom tất cả vào một commit. Tách theo thứ tự:

```text
feat(auth): move refresh token to secure http-only cookie
feat(frontend): keep access token in memory and synchronize auth tabs
security(frontend): add CSP baseline compatible with social login

feat(stores): enforce audited store state transitions
fix(stores): serialize rating and bookmark counter updates
chore(stores): reconcile denormalized store counters

feat(stores): add server-side geo open-now and multi-category filters
feat(frontend): paginate filtered public owned and saved stores
feat(admin): load global moderation summary counts

fix(time): use Vietnam business clock and bounded cleanup jobs
fix(email): escape dynamic store notification content

feat(frontend): add shareable canonical store routes
feat(seo): expose public store metadata and sitemap

test: cover auth cookies transitions concurrency geo and cleanup
docs: update API and architecture references
```

Migration đi cùng commit backend sử dụng schema mới; không commit code phụ thuộc column chưa có migration.

## 15. Trình tự kiểm thử tổng thể

### 15.1. Automated

1. Backend unit tests.
2. Repository/integration tests bằng MySQL/Testcontainers.
3. Frontend utility/component tests.
4. E2E auth/session bằng hai browser context.
5. E2E Explore với dữ liệu nhiều hơn một page.
6. Build production frontend với CSP.

### 15.2. Manual local

1. Login → reload → session còn hoạt động nhưng storage không có token.
2. Mở hai trình duyệt → đổi password/disable/logout → session cũ bị từ chối.
3. Mở hai tab → token hết hạn → cả hai phục hồi hoặc logout nhất quán.
4. Admin approve/reject sai trạng thái → nhận toast tiếng Việt và dữ liệu không đổi.
5. Hai client rate/save cùng một quán → counter đúng sau reload.
6. Tạo hơn 24 quán → “Gần tôi” vẫn chọn đúng quán gần nhất ở page sau.
7. Quán qua đêm hiển thị trạng thái mở đúng quanh 00:00.
8. Chạy cleanup với dữ liệu trước/sau cutoff.
9. Gửi email với tên quán/reason chứa HTML đặc biệt.
10. Copy URL quán → mở tab ẩn danh → reload/back/forward.

## 16. Definition of Done

Chỉ đánh dấu blueprint hoàn thành khi:

- [x] Không còn chuỗi `jwtToken` hoặc `refreshToken` được lưu trong `localStorage`/`sessionStorage`.
- [x] Refresh token không còn trong JSON response hoặc request body.
- [x] Cookie/CSRF/rotation/logout tests pass.
- [ ] Google/Facebook SDK vẫn được tải ổn định từ `index.html`; không có lazy-loader và browser E2E social login pass.
- [ ] CSP production chạy enforce mà không có lỗi chức năng đã biết.
- [x] Mọi store transition làm thay đổi moderation state đi qua policy và có audit.
- [ ] Concurrency tests rating/save pass trên MySQL.
- [x] Geo/open/category filter chạy trước pagination tại backend.
- [x] My/saved/admin counts không còn lấy từ page đầu.
- [x] Không còn `deleteAllInBatch()` cho daily report.
- [x] Cleanup có retention, batch, timezone và giới hạn retry.
- [x] Email store notification escape toàn bộ dữ liệu động.
- [ ] URL quán mở trực tiếp, reload, back/forward và share được.
- [ ] Public sitemap/metadata không chứa store không public.
- [x] `API_REFERENCE.md`, `ARCHITECTURE.md`, `BUSINESS_FLOWS.md` và `KNOWN_ISSUES.md` được cập nhật theo code thật.

## 17. Các quyết định mặc định cần giữ khi implementation

| Quyết định | Giá trị blueprint |
|---|---|
| Business timezone | `Asia/Ho_Chi_Minh` |
| Access token | 15 phút, chỉ memory |
| Refresh token | 30 ngày, HttpOnly cookie, rotation |
| Cookie production | Secure, SameSite=Strict, host-only, Path=/ |
| CSRF | Double-submit token + exact Origin validation |
| Counter consistency | Pessimistic row lock per store |
| Distance default | 10 km |
| Distance maximum | 100 km |
| `openTime == closeTime` | Mở 24 giờ |
| Daily report retention | 30 ngày |
| Used OTP retention | 24 giờ |
| Expired verification retention | 7 ngày |
| Media retry maximum | 10 attempts, sau đó DEAD |
| Store route | `/quan/{storeId}/{slug}` |

Nếu cần thay một quyết định trong bảng này, phải cập nhật blueprint và test acceptance tương ứng trước khi code, tránh backend/frontend triển khai hai contract khác nhau.
