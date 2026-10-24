# OWNER STORE HISTORY — IMPLEMENTATION BLUEPRINT

> Ngày lập kế hoạch: 24/10/2026  
> Phạm vi: lịch sử đăng/quản lý quán dành cho Owner  
> Nguồn dữ liệu đề xuất: `store_audit_logs`  
> Trạng thái: **đã triển khai core feature ngày 24/10/2026; chờ visual/E2E acceptance và migration rehearsal trên MySQL/Docker**

---

## 1. Kết luận và định hướng

Đề xuất dùng `store_audit_logs` làm nguồn dữ liệu cho “Lịch sử đăng quán” là **đúng hướng và nên thực hiện**.

Tab hiện tại chưa phải lịch sử thực sự. `MySubmissionsSection` chỉ nhận `myStores` từ `GET /v1/stores/mine`, sau đó hiển thị trạng thái hiện tại của từng quán. Vì vậy Owner không thể biết một quán đã đi qua chuỗi sự kiện nào, ví dụ:

```text
Đã gửi duyệt
→ Bị từ chối: thiếu địa chỉ chi tiết
→ Đã chỉnh sửa và gửi lại
→ Được duyệt
→ Bị quản trị viên ẩn: thông tin không còn chính xác
→ Đã gửi yêu cầu khôi phục
→ Được hiển thị lại
```

`store_audit_logs` đã ghi phần lớn các hành động này, nhưng **không được trả entity trực tiếp cho frontend** vì có `actorId`, `actorEmail` và dữ liệu phục vụ quản trị. Cần tạo một read model/DTO riêng cho Owner, truy vấn theo quyền sở hữu và chỉ trả nội dung được phép công khai cho chính Owner.

### Quyết định kiến trúc đề xuất

- Giữ `store_audit_logs` là audit source of truth.
- Bổ sung owner snapshot và state transition để timeline chính xác, kể cả khi Store đã bị hard-delete.
- Tạo endpoint Owner riêng, có pagination và filter server-side.
- API chỉ trả `actorType=OWNER|ADMIN|SYSTEM`, tuyệt đối không trả actor ID/email.
- Reason hiển thị theo allowlist action, không tự động expose mọi `reason` trong audit.
- Frontend tải timeline khi tab được mở, không dùng lại `myStores` để giả lập lịch sử.
- Giữ tab trong Owner Portal nhưng đổi nội dung thành timeline responsive, hoàn toàn tiếng Việt.

---

## 2. Hiện trạng đã xác minh

### 2.1. Backend

| Thành phần | Hiện trạng | Đánh giá |
|---|---|---|
| Entity audit | `StoreAuditLog` lưu `storeId`, `storeName`, actor snapshot, action, reason, createdAt | Có nền tảng tốt nhưng chưa đủ cho Owner history |
| Action | `SUBMIT`, `APPROVE`, `REJECT`, `EDIT_PENDING`, `RESUBMIT_AFTER_EDIT`, `EDIT_HIDDEN`, `HIDE`, `RECOVER`, `REQUEST_RECOVERY`, `REJECT_RECOVERY_REQUEST`, `HARD_DELETE` | Bao phủ gần đầy đủ lifecycle hiện tại |
| Audit write | Được ghi trong cùng transaction với phần lớn thay đổi Store | Phù hợp làm source of truth |
| Audit read | Repository chỉ có `findByStoreIdOrderByCreatedAtDesc` | Chưa có API hoặc query theo Owner |
| Ownership snapshot | Không có | Không thể xác thực Owner sau khi Store bị xóa |
| State transition | Không lưu before/after status | UI chỉ có thể suy luận, không chứng minh chính xác |
| Privacy | Entity chứa `actorId`, `actorEmail` | Không được serialize trực tiếp ra Owner API |
| Index | Index riêng `store_id` và `created_at` | Chưa tối ưu cho timeline Owner có pagination |

Các vị trí chính:

- `backend/src/main/java/com/cangiuoc/cgfoodtour/entity/StoreAuditLog.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/enums/StoreAction.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/repository/StoreAuditLogRepository.java`
- `backend/src/main/java/com/cangiuoc/cgfoodtour/service/StoreService.java:93-115,255-324,348-577,717-726`
- `backend/src/main/resources/db/migration/V1__baseline_schema.sql:164-177`

### 2.2. Frontend

| Thành phần | Hiện trạng | Hạn chế |
|---|---|---|
| Tab | “Lịch sử đăng quán” trong `MyStoresSection` | Tab hợp lý nhưng chưa có route/data state riêng |
| Data | Truyền `myStores` vào `MySubmissionsSection` | Chỉ là current snapshot, không phải events |
| Pagination | Phụ thuộc những trang `/mine` đã tải | Có thể bỏ sót quán/lịch sử ngoài page hiện tại |
| UI | Mỗi quán là một status card | Không thể biểu diễn nhiều sự kiện theo thời gian |
| Copy | Còn `Review Progress` và mô tả tiếng Anh | Không nhất quán sản phẩm tiếng Việt |
| Responsive | Card đơn giản, desktop ổn | Chưa có timeline/mobile information hierarchy |

Các vị trí chính:

- `frontend/src/pages/MyStores/MySubmissionsSection.jsx`
- `frontend/src/pages/MyStores/MyStoresSection.jsx:586-618,1587-1591`
- `frontend/src/App.jsx:864-875`

---

## 3. Product scope và quy tắc hiển thị

### 3.1. Owner được xem gì?

Owner được xem các sự kiện lifecycle của quán họ sở hữu hoặc từng sở hữu:

| Audit action | Nội dung Owner thấy | Hiển thị reason | Tone |
|---|---|---:|---|
| `SUBMIT` | Đã gửi quán để kiểm duyệt | Không | Pending/info |
| `APPROVE` | Quán đã được duyệt và hiển thị | Không | Success |
| `REJECT` | Quán bị từ chối | Có | Danger/action required |
| `EDIT_PENDING` | Đã cập nhật hồ sơ đang chờ duyệt | Không | Neutral |
| `RESUBMIT_AFTER_EDIT` | Đã chỉnh sửa và gửi duyệt lại | Không | Pending/info |
| `EDIT_HIDDEN` | Đã cập nhật thông tin quán đang bị ẩn | Không mặc định | Neutral |
| `HIDE` bởi Owner | Bạn đã tạm ẩn quán | Có nếu Owner nhập | Neutral |
| `HIDE` bởi Admin | Quán đã bị quản trị viên ẩn | Có, bắt buộc theo rule hiện tại | Danger/action required |
| `RECOVER` | Quán đã được hiển thị lại | Có nếu có nội dung công khai | Success |
| `REQUEST_RECOVERY` | Bạn đã gửi yêu cầu khôi phục | Có | Pending/info |
| `REJECT_RECOVERY_REQUEST` | Yêu cầu khôi phục bị từ chối | Có | Danger/action required |
| `HARD_DELETE` | Quán đã bị xóa vĩnh viễn | Chỉ hiển thị lý do admin đã gửi cho Owner | Destructive/tombstone |
| Action mới/không biết | Hoạt động của quán đã được cập nhật | Không | Neutral |

### 3.2. Owner không được xem gì?

- `actorId`, `actorEmail` hoặc username của Admin.
- Internal database ID không cần cho UI.
- Ghi chú điều tra/moderation nội bộ.
- Request body, token, ảnh binary, IP hoặc thông tin kỹ thuật.
- Reason của action không nằm trong allowlist Owner-visible.

### 3.3. Quán đã xóa

Khuyến nghị hiển thị một **tombstone event** trong thời hạn retention audit:

- Có tên quán snapshot, thời gian, người thực hiện ở mức `Bạn` hoặc `Quản trị viên` và lý do Owner-visible.
- Không có nút mở/chỉnh sửa và không tải ảnh/banner.
- Nếu tài khoản Owner bị hard-delete, `ownerIdSnapshot` phải được anonymize và lịch sử không còn truy cập được.
- Retention audit cần dùng chính sách chung của hệ thống; blueprint hiện tại khuyến nghị 12 tháng nhưng cần Owner xác nhận trước production.

---

## 4. Data model blueprint

### 4.1. Các cột cần bổ sung

Tạo migration kế tiếp, không sửa `V1__baseline_schema.sql` như một migration đã áp dụng. Đồng thời cập nhật baseline nếu quy trình dự án quy định baseline luôn phản ánh greenfield schema.

| Column | Type | Nullable | Mục đích |
|---|---|---:|---|
| `owner_id_snapshot` | `VARCHAR(255)` | Yes | Xác định timeline Owner kể cả sau khi Store bị xóa; không tạo FK |
| `status_before` | `VARCHAR(50)` | Yes | Trạng thái trước hành động |
| `status_after` | `VARCHAR(50)` | Yes | Trạng thái sau hành động; cho phép `DELETED` |
| `owner_visible` | `BIT` | No, default `0` | Defense-in-depth: sự kiện có được xuất hiện trong Owner API hay không |

Indexes:

```sql
INDEX idx_store_audit_owner_created (owner_id_snapshot, created_at, id)
INDEX idx_store_audit_store_created (store_id, created_at, id)
```

Không đặt foreign key từ audit tới User/Store. Audit phải tiếp tục tồn tại khi resource bị xóa.

### 4.2. Backfill dữ liệu cũ

Backfill phải bảo thủ:

1. Với audit của Store còn tồn tại: lấy `stores.owner_id` vào `owner_id_snapshot`.
2. Với audit đã mất Store nhưng `actor_role='OWNER'`: có thể dùng `actor_id` làm owner snapshot nếu actor chưa anonymize.
3. Với audit đã mất Store và chỉ có Admin actor: để `owner_id_snapshot=NULL`; không suy đoán Owner.
4. `owner_visible=1` chỉ cho action trong allowlist ở mục 3.1.
5. `status_before/status_after` của legacy row để nullable nếu không thể suy ra chắc chắn.
6. Không backfill một trạng thái “có vẻ đúng” chỉ để timeline đẹp.

### 4.3. Audit write contract mới

Thay các đoạn build `StoreAuditLog` rời rạc bằng một hàm/service duy nhất, ví dụ:

```java
record StoreAuditEvent(
    String storeId,
    String storeName,
    String ownerIdSnapshot,
    String actorId,
    String actorEmail,
    String actorRole,
    StoreAction action,
    String statusBefore,
    String statusAfter,
    String reason,
    boolean ownerVisible
) {}
```

Audit phải được ghi trong cùng transaction với Store mutation. Cần capture `statusBefore` **trước** khi gọi `StoreTransitionPolicy.apply()` và `statusAfter` sau khi thay đổi thành công.

Không ghi event nếu transaction Store bị rollback.

### 4.4. User deletion/anonymization

Mở rộng `UserDeletionService`:

- Khi xóa account: `actorId/actorEmail` vẫn được anonymize như hiện tại.
- Đồng thời set `owner_id_snapshot=NULL` cho audit thuộc Owner bị xóa.
- Giữ store/action/status/reason theo retention policy, nhưng không còn endpoint nào có thể liên kết dữ liệu đó tới account đã xóa.

---

## 5. Backend API blueprint

### 5.1. Endpoint

```http
GET /v1/stores/mine/history
Authorization: Bearer <access-token>
```

Query parameters:

| Param | Default | Rule |
|---|---|---|
| `page` | `0` | `>= 0` |
| `size` | `20` | `1..50` |
| `storeId` | null | Chỉ filter trong timeline của chính Owner |
| `group` | `ALL` | `ALL`, `WAITING`, `SUCCESS`, `ACTION_REQUIRED`, `HIDDEN`, `DELETED` |
| `query` | null | Tìm tên quán snapshot, normalize, tối đa 100 ký tự |
| `from` | null | ISO date/time hợp lệ |
| `to` | null | ISO date/time hợp lệ và không trước `from` |

Sort cố định:

```text
createdAt DESC, id DESC
```

Không cho client sort theo actor/reason để tránh mở rộng query surface không cần thiết.

### 5.2. Response DTO

Tạo `OwnerStoreHistoryItemResponse`, không reuse `StoreAuditLog`:

```json
{
  "eventId": 184,
  "storeId": "banhxeoabc123",
  "storeName": "Bánh xèo Bà Mười",
  "action": "REJECT",
  "title": "Quán bị từ chối",
  "description": "Bạn cần cập nhật thông tin trước khi gửi lại.",
  "actorType": "ADMIN",
  "statusBefore": "PENDING",
  "statusAfter": "REJECTED",
  "reason": "Địa chỉ chưa đủ chi tiết.",
  "occurredAt": "2026-10-24T10:15:30+07:00",
  "resourceAvailable": true,
  "recommendedAction": "EDIT_AND_RESUBMIT"
}
```

Quy tắc DTO:

- `title`, `description` có thể map ở frontend để dễ quản lý ngôn ngữ; backend tối thiểu trả action/actor/status/reason.
- Nếu backend trả copy, copy phải là business copy và có contract test.
- `reason=null` khi action không được phép hiển thị reason.
- `resourceAvailable=false` cho Store đã xóa.
- `recommendedAction` chỉ là hint presentation: `VIEW`, `EDIT_AND_RESUBMIT`, `REQUEST_RECOVERY`, `NONE`.
- Không trả current `StoreResponse` đầy đủ trong mỗi row để tránh payload và N+1.

Response bọc `PageResponse<OwnerStoreHistoryItemResponse>` hiện có.

### 5.3. Authorization

Service phải truy vấn bằng:

```text
owner_id_snapshot = currentUser.id
AND owner_visible = true
```

Không thực hiện:

```text
find audit by storeId
→ trả kết quả
→ mới kiểm ownership ở frontend
```

Nếu có `storeId`, query vẫn phải ghép cả `owner_id_snapshot` và `store_id`. Store ID của người khác nên trả danh sách rỗng hoặc lỗi generic theo convention hiện tại, không tiết lộ sự tồn tại.

### 5.4. Repository/query

Khuyến nghị dùng repository query trả `Page<StoreAuditLog>` hoặc projection, với predicate Owner/action group/query/time. Không load danh sách Store rồi chạy một query audit cho từng Store.

Mục tiêu:

- Một query timeline chính.
- Một query count pagination.
- Không N+1.
- Dùng composite index ở mục 4.1.

### 5.5. Time contract

- API trả ISO-8601 có offset, ưu tiên `+07:00` hoặc UTC `Z` nhất quán.
- Frontend dùng `Intl.DateTimeFormat('vi-VN')`.
- Không gửi chuỗi ngày đã format từ database.
- Với `LocalDateTime` legacy, chuyển bằng timezone ứng dụng đã cấu hình; không phụ thuộc timezone máy developer.

---

## 6. Frontend UX/UI blueprint

### 6.1. Information architecture

Giữ hai tab chính trong Owner Portal:

```text
Quán ăn của tôi | Lịch sử hoạt động
```

Đề xuất đổi “Lịch sử đăng quán” thành **“Lịch sử hoạt động”** hoặc **“Lịch sử kiểm duyệt”** vì timeline còn gồm ẩn/khôi phục/xóa, không chỉ lần đăng đầu tiên.

Nếu muốn giữ ngôn ngữ gần gũi, dùng:

```text
Lịch sử quán
Theo dõi quá trình gửi duyệt, chỉnh sửa, phê duyệt, từ chối và khôi phục quán của bạn.
```

### 6.2. Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ LỊCH SỬ QUÁN                                                │
│ Theo dõi mọi thay đổi và phản hồi kiểm duyệt                │
├──────────────────────────────────────────────────────────────┤
│ [Tìm tên quán...] [Tất cả trạng thái ▼] [Khoảng thời gian] │
│ Active filter chips                              [Xóa lọc]   │
├──────────────────────────────────────────────────────────────┤
│ 24/10/2026                                                   │
│  ●  Quán bị từ chối                         10:15            │
│  │  Bánh xèo Bà Mười · Quản trị viên                        │
│  │  Lý do: Địa chỉ chưa đủ chi tiết.                        │
│  │  PENDING → REJECTED         [Chỉnh sửa và gửi lại]       │
│  │                                                           │
│  ●  Đã gửi quán để kiểm duyệt               08:30           │
│     Bánh xèo Bà Mười                                         │
└──────────────────────────────────────────────────────────────┘
```

Rules:

- Content width khoảng 880–960 px, tránh timeline quá rộng.
- Event mới nhất ở trên.
- Group theo ngày: Hôm nay, Hôm qua hoặc ngày đầy đủ.
- Icon + title + text luôn thể hiện trạng thái; không chỉ dùng màu.
- Reason là callout riêng, giữ line break nhưng render text thuần.
- Chỉ event mới nhất/actionable của Store mới hiện CTA nghiệp vụ.
- “Xem thêm” dùng pagination, không tải toàn bộ audit.

### 6.3. Tablet

- Filter bar xuống hai hàng.
- Timeline vẫn một cột.
- CTA chuyển xuống cuối event card nếu không đủ chiều ngang.
- Không dùng bảng.

### 6.4. Mobile 320–430 px

- Header gọn, không lặp hero banner lớn như UI hiện tại.
- Filter mở bằng bottom sheet; ngoài trang chỉ hiện nút “Bộ lọc” và active chips.
- Timeline rail thu gọn còn 24–32 px; nội dung event chiếm phần còn lại.
- Store name tối đa hai dòng; timestamp xuống dòng riêng.
- CTA full-width hoặc text button tối thiểu 44 px.
- Reason mặc định hiển thị đầy đủ nếu là action required; reason dài có “Xem thêm/Thu gọn”.
- Chừa padding cho bottom navigation và safe area.

### 6.5. Visual language

Giữ neo-brutalist hiện tại nhưng giảm “card trong card”:

- Timeline container không cần border/shadow lớn.
- Mỗi event dùng border 2 px hoặc divider; chỉ event cần hành động có shadow nhấn mạnh.
- Màu semantic phải dùng token accessible:
  - Pending/info: vàng + text đen.
  - Success: xanh đậm đủ contrast + icon check.
  - Rejected/hidden: đỏ accessible + icon cảnh báo.
  - Deleted: neutral/danger tombstone, không dùng CTA.
- Không dùng text 8–10 px; metadata tối thiểu 12 px.
- Bỏ `Review Progress` và toàn bộ mô tả tiếng Anh.

### 6.6. Component plan

| Component/hook | Trách nhiệm |
|---|---|
| `OwnerStoreHistorySection` | Page state, load/error/empty/filter/pagination |
| `OwnerStoreHistoryFilters` | Search, group, store/time filters |
| `StoreHistoryTimeline` | Group events theo ngày và semantic list |
| `StoreHistoryEvent` | Render một event, reason, transition, CTA |
| `StoreHistorySkeleton` | Loading không làm layout shift |
| `useOwnerStoreHistory` | Fetch, abort stale request, pagination, retry |
| `storeHistoryPresentation.js` | Map action → Vietnamese copy/icon/tone/CTA |

Có thể giữ filename `MySubmissionsSection.jsx` ở bước migration đầu để giảm diff, nhưng component/export nên được đổi tên sau khi callers/tests đã cập nhật.

### 6.7. State handling

| State | UI yêu cầu |
|---|---|
| Initial loading | 4–5 skeleton events, không dùng global full-screen loader |
| Empty history | “Bạn chưa đăng quán nào” + CTA “Đăng quán đầu tiên” |
| Empty filtered | “Không có hoạt động phù hợp” + “Xóa bộ lọc” |
| Error | Inline alert tiếng Việt + “Thử lại” |
| Loading more | Spinner nằm trong nút “Xem thêm” |
| Deleted Store | Tombstone, không link/edit |
| Unknown legacy action | Generic neutral copy, không reason |

### 6.8. Data loading

- Chỉ fetch history lần đầu khi Owner mở tab.
- Không gọi `loadGlobalData()` chỉ để refresh history.
- Sau store mutation/SSE `STORES_UPDATED`, đánh dấu history stale; refetch page đầu nếu tab đang active.
- Search nên debounce 250–400 ms hoặc submit rõ ràng.
- Abort request cũ khi đổi filter nhanh.
- Không lưu toàn bộ timeline trong `App.jsx`; ưu tiên feature hook/local state.

---

## 7. Implementation phases

### Phase 0 — Contract decisions

**Goal:** khóa hành vi trước khi sửa schema/UI.

Tasks:

- [ ] Xác nhận tên tab: “Lịch sử quán”, “Lịch sử hoạt động” hay “Lịch sử kiểm duyệt”.
- [ ] Xác nhận tombstone cho Store đã xóa và retention.
- [ ] Xác nhận nhóm action/reason nào Owner được xem.
- [ ] Chụp baseline tab hiện tại desktop/tablet/mobile.
- [ ] Viết API example và acceptance tests trước implementation.

DoD: ba quyết định sản phẩm được ghi rõ; không còn ambiguity về quyền xem reason.

### Phase 1 — Database và audit integrity

**Goal:** audit có đủ ownership/state để tạo timeline chính xác.

Tasks:

- [ ] Tạo versioned migration thêm bốn cột và hai composite indexes.
- [ ] Backfill theo nguyên tắc bảo thủ ở mục 4.2.
- [ ] Cập nhật `StoreAuditLog`.
- [ ] Tập trung audit creation vào service/factory dùng chung.
- [ ] Ghi owner snapshot, before/after status và visibility cho mọi Store action.
- [ ] Anonymize owner snapshot khi xóa User.
- [ ] Bảo đảm rollback Store cũng rollback audit.

DoD: mọi transition hiện có sinh đúng một audit event với owner/status metadata chính xác.

### Phase 2 — Owner history read API

**Goal:** cung cấp timeline an toàn và hiệu quả.

Tasks:

- [ ] Tạo `OwnerStoreHistoryItemResponse`.
- [ ] Tạo action-to-owner visibility/reason mapper allowlist.
- [ ] Repository query Owner + filters + pagination.
- [ ] Service `getMyStoreHistory(...)` với `@Transactional(readOnly=true)`.
- [ ] Controller `GET /v1/stores/mine/history` với authentication.
- [ ] Validate page/size/query/date/group.
- [ ] Kiểm query plan/index và loại N+1.

DoD: API không serialize entity; không có actor ID/email; Owner khác không đọc được event.

### Phase 3 — Frontend data layer

**Goal:** tách timeline khỏi `myStores` snapshot.

Tasks:

- [ ] Tạo `useOwnerStoreHistory`.
- [ ] Fetch lazy khi mở tab.
- [ ] Hỗ trợ filter/search/page/retry/abort.
- [ ] Invalidate/refetch sau mutation/SSE phù hợp.
- [ ] Thêm presentation mapping tiếng Việt và unknown-action fallback.

DoD: `MySubmissionsSection` không còn phụ thuộc `myStores` để tạo lịch sử.

### Phase 4 — UI redesign

**Goal:** triển khai timeline rõ ràng, responsive và accessible.

Tasks:

- [ ] Xây timeline/event/filter/skeleton components.
- [ ] Bỏ hero lặp, English copy và current-status cards cũ.
- [ ] Triển khai desktop/tablet/mobile specs.
- [ ] CTA chỉ xuất hiện khi resource/action còn hợp lệ.
- [ ] Thêm empty/error/loading/deleted/legacy states.
- [ ] Thêm focus-visible, semantic list/time, labels và 44 px targets.

DoD: lịch sử đọc được tại 320–1920 px, không bị bottom nav che và không phụ thuộc màu.

### Phase 5 — Regression và rollout

**Goal:** chứng minh lịch sử đúng và không phá Owner/Admin workflow.

Tasks:

- [ ] Backend unit/integration/security tests.
- [ ] Frontend component/accessibility tests.
- [ ] Lifecycle E2E với test database.
- [ ] Visual regression theo viewport matrix.
- [ ] Migration rehearsal trên database snapshot.
- [ ] Kiểm production build và không lộ PII.

DoD: toàn bộ acceptance criteria mục 9 pass; không có P0/P1 còn mở.

---

## 8. File impact dự kiến

### Backend — sửa

- `entity/StoreAuditLog.java`
- `repository/StoreAuditLogRepository.java`
- `service/StoreService.java`
- `service/UserDeletionService.java`
- `controller/StoreController.java`
- các test tương ứng

### Backend — tạo mới

- Migration kế tiếp trong `backend/src/main/resources/db/migration/`
- `dto/response/OwnerStoreHistoryItemResponse.java`
- Có thể thêm `service/StoreAuditService.java` hoặc mapper/policy riêng

### Frontend — sửa

- `pages/MyStores/MyStoresSection.jsx`
- `pages/MyStores/MySubmissionsSection.jsx` hoặc rename có kiểm soát
- Có thể sửa `App.jsx` chỉ để bỏ prop/callback cũ; tránh đưa thêm history state vào App
- API error message mapping nếu backend thêm error code

### Frontend — tạo mới

- `pages/MyStores/history/OwnerStoreHistorySection.jsx`
- `pages/MyStores/history/OwnerStoreHistoryFilters.jsx`
- `pages/MyStores/history/StoreHistoryTimeline.jsx`
- `pages/MyStores/history/StoreHistoryEvent.jsx`
- `pages/MyStores/history/useOwnerStoreHistory.js`
- `pages/MyStores/history/storeHistoryPresentation.js`

Tên/file split có thể điều chỉnh theo kiến trúc frontend sau Phase 3, nhưng responsibilities không được gộp ngược vào `MyStoresSection` monolith.

---

## 9. Acceptance criteria

### Correctness

- [ ] Owner thấy đúng thứ tự tất cả event được phép của chính họ.
- [ ] Một mutation thành công sinh đúng một audit event.
- [ ] Mutation rollback không để lại audit event.
- [ ] `statusBefore/statusAfter` đúng cho create, approve, reject, edit/resubmit, hide, recover và delete.
- [ ] Pagination ổn định khi nhiều event có cùng timestamp nhờ secondary sort `id DESC`.
- [ ] Timeline không phụ thuộc số trang `/v1/stores/mine` đã tải.

### Authorization và privacy

- [ ] Anonymous nhận 401.
- [ ] Owner A không đọc event Owner B kể cả biết `storeId`.
- [ ] JSON không chứa `actorId`, `actorEmail` hoặc internal note.
- [ ] Reason chỉ xuất hiện với action allowlist.
- [ ] User hard-delete làm `ownerIdSnapshot` và actor PII được anonymize.
- [ ] React không render reason bằng `dangerouslySetInnerHTML`.

### UX/UI

- [ ] Copy hoàn toàn tiếng Việt.
- [ ] Timeline phân biệt action bằng icon + text, không chỉ màu.
- [ ] Loading/error/empty/filter-empty/deleted/unknown action đều có UI.
- [ ] CTA chỉ hiển thị nếu Store tồn tại và action còn hợp lệ.
- [ ] Không có text nghiệp vụ dưới 12 px.
- [ ] Touch target tối thiểu 44×44 px.
- [ ] 320×568, 390×844, 768×1024, 1280×800 và 1440×900 không overflow/overlap.
- [ ] Bottom navigation không che event cuối hoặc nút “Xem thêm”.

### Performance

- [ ] History chỉ tải khi tab được mở.
- [ ] Endpoint dùng pagination tối đa 50 item/page.
- [ ] Không N+1 query.
- [ ] Query dùng index Owner/time trong execution plan.
- [ ] Đổi filter hủy request cũ hoặc bỏ kết quả stale.

---

## 10. Test plan

### Backend unit tests

- Mapping từng `StoreAction` sang visibility, actor type, reason và recommended action.
- Unknown action không làm endpoint lỗi và không lộ reason.
- Page/date/query/group validation.
- Audit factory capture đúng owner/status.

### Backend integration/security tests

1. Owner submit → timeline có `SUBMIT`, `null → PENDING`.
2. Admin reject → Owner thấy `REJECT` và public reason.
3. Owner edit rejected → `RESUBMIT_AFTER_EDIT`, `REJECTED → PENDING`.
4. Admin approve → `APPROVE`, `PENDING → APPROVED`.
5. Owner hide → `HIDE`, actor `OWNER`.
6. Admin hide → `HIDE`, actor `ADMIN`, có reason.
7. Owner request recovery → `REQUEST_RECOVERY`.
8. Admin reject recovery → Owner thấy reason.
9. Admin recover → `RECOVER`, `HIDDEN → APPROVED`.
10. Hard-delete → tombstone vẫn truy vấn được qua owner snapshot.
11. Delete account → snapshot/PII anonymized và endpoint không còn truy cập.
12. Cross-owner `storeId` filter → không trả dữ liệu.
13. Transaction failure → không có orphan audit.
14. Pagination/order/filter với hơn 50 events.

### Frontend tests

- Correct Vietnamese presentation cho mọi action.
- Semantic `<ol>/<li>` hoặc equivalent list roles; `<time dateTime>` hợp lệ.
- Filter labels, keyboard navigation và focus-visible.
- Reason long text, store name dài và unknown event.
- Loading, API error/retry, empty and deleted tombstone.
- “Xem thêm” append không duplicate event.
- CTA edit/view/recovery gọi đúng callback và không hiện khi deleted.
- Axe critical/serious violations bằng 0 trong section.

### E2E viewport matrix

| Viewport | Các bước bắt buộc |
|---|---|
| 320×568 | Mở tab, mở filter, đọc reason, bấm CTA/Xem thêm, kiểm bottom nav |
| 390×844 | Timeline nhiều event và reason dài |
| 768×1024 | Filter hai hàng, timeline một cột |
| 1280×800 | Desktop chiều cao thấp, pagination |
| 1440×900 | Baseline desktop đầy đủ |

---

## 11. Rủi ro và biện pháp kiểm soát

| Rủi ro | Mức | Kiểm soát |
|---|---:|---|
| Lộ email/ID Admin qua entity serialization | Cao | DTO riêng + JSON contract test denylist |
| Owner đọc audit của người khác qua `storeId` | Cao | Query luôn có `ownerIdSnapshot=currentUser.id` |
| Reason nội bộ bị lộ khi thêm action mới | Cao | Allowlist; unknown action mặc định ẩn reason |
| History không gồm Store đã xóa | Trung bình | Owner snapshot không FK + tombstone |
| Legacy data bị backfill sai | Trung bình | Backfill bảo thủ, để null khi không chứng minh được |
| Timeline duplicate/mất event | Trung bình | Audit writer tập trung + transaction + unique/idempotency review |
| Query chậm khi audit tăng | Trung bình | Composite index, pagination, explain plan |
| UI lại làm `MyStoresSection` lớn hơn | Trung bình | Feature folder + local hook, không nhét state vào App |
| CTA lịch sử gọi action đã không còn hợp lệ | Trung bình | `resourceAvailable` + recommended action + backend vẫn enforce state machine |

---

## 12. Những quyết định cần xác nhận trước implementation

1. **Tên tab:** khuyến nghị “Lịch sử quán” vì ngắn và bao quát hơn “Lịch sử đăng quán”.
2. **Store đã xóa:** khuyến nghị giữ tombstone 12 tháng, nhưng cần xác nhận chính sách retention.
3. **Reason:** khuyến nghị Owner được xem lý do reject, admin hide, reject recovery và admin hard-delete; internal notes phải tách riêng.
4. **CTA:** khuyến nghị timeline có CTA contextual, nhưng backend state machine vẫn là nguồn quyết định cuối cùng.
5. **Legacy audit không xác định Owner:** khuyến nghị không hiển thị thay vì suy đoán/backfill sai.

---

## 13. Recommended implementation order

```text
Chốt 5 quyết định sản phẩm
→ migration + audit writer
→ owner-safe read API
→ backend security/integration tests
→ frontend history hook
→ timeline UI responsive
→ accessibility/visual tests
→ migration rehearsal + lifecycle E2E
```

Không nên làm UI timeline trước API/audit contract. Nếu làm như vậy, frontend sẽ tiếp tục suy luận lịch sử từ `StoreResponse` hiện tại và sau đó phải viết lại khi backend có dữ liệu thật.

---

## 14. Báo cáo triển khai ngày 24/10/2026

### 14.1. Đã hoàn thành

- Flyway `V2__owner_store_history.sql`: thêm owner snapshot, state transition, owner visibility và hai composite index; backfill bảo thủ.
- Audit writer của Store được tập trung qua helper chung và ghi metadata cho submit/edit/approve/reject/hide/recover/recovery/delete.
- Hard-delete Store giữ tombstone; hard-delete User anonymize owner snapshot và actor PII.
- API `GET /v1/stores/mine/history` có authorization theo principal, pagination, search, group/date/store filter, sort ổn định và reason allowlist.
- API `GET /v1/stores/mine/{id}` chỉ trả management DTO khi principal đúng là Owner, phục vụ CTA xem/sửa từ timeline.
- DTO Owner không chứa `actorId`/`actorEmail`; action cũ không biết dùng fallback an toàn và không lộ reason.
- Frontend đã thay current-status cards bằng timeline tiếng Việt, group theo ngày, skeleton/error/empty/tombstone, contextual CTA và “Xem thêm”.
- Bộ lọc desktop/tablet và mobile bottom panel; request tìm kiếm debounce và kết quả request cũ bị bỏ qua.
- Timeline tự refresh khi snapshot quán Owner thay đổi sau mutation hoặc SSE refresh.
- Tài liệu API, database và frontend reference đã đồng bộ.

### 14.2. Kết quả kiểm thử tự động

| Gate | Kết quả |
|---|---|
| Backend full Maven suite | PASS — 89 tests, 0 failure, 0 error, 2 migration tests skipped vì Docker daemon không khả dụng |
| Backend history/deletion/repository targeted suite | PASS |
| Frontend lint `oxlint --deny-warnings` | PASS — 0 warning/error |
| Frontend unit/contract tests | PASS — 37/37 |
| Frontend production build + artifact verification | PASS — 1.856 modules transformed |

### 14.3. Còn cần nghiệm thu thủ công trước khi đóng hoàn toàn

- Chạy Flyway V1 → V2 và Hibernate `validate` trên MySQL thật khi Docker daemon khả dụng; hiện lệnh `docker info` không kết nối được engine.
- Chạy lifecycle E2E bằng hai tài khoản Owner/Admin trên dữ liệu test, gồm hard-delete tombstone và cross-owner isolation.
- Visual/accessibility acceptance tại 320×568, 390×844, 768×1024, 1280×800 và 1440×900; kiểm tra focus trap của mobile filter bằng trình duyệt/screen reader thật.
- Chốt retention audit (khuyến nghị 12 tháng). Chưa thêm job xóa audit vì đây là quyết định dữ liệu có tính phá hủy.

