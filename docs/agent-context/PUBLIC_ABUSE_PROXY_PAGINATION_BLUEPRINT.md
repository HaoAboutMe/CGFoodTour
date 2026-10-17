# CG FoodTour — Public Abuse, Trusted Proxy và Store Query Blueprint

> Trạng thái: **ĐÃ TRIỂN KHAI SOURCE — CẦN MANUAL E2E VÀ REVIEW MIGRATION MYSQL**
> Ngày lập: 17/10/2026
> Phạm vi: Google Maps parser abuse, registration spam, xác định client IP sau reverse proxy, pagination và N+1 query.
> Ngoài phạm vi: Flyway/baseline production hoàn chỉnh, SSE connection limit, store state machine, rating/save concurrency và CAPTCHA production.

## 1. Mục tiêu hoàn thành

Sau khi triển khai toàn bộ blueprint:

1. Chỉ user đã đăng nhập mới được yêu cầu backend phân giải Google Maps URL.
2. Maps resolver có quota theo user và IP, giới hạn số outbound request đồng thời, cache hữu hạn và giữ toàn bộ bảo vệ SSRF hiện có.
3. Registration có quota theo IP/email và không thể tạo không giới hạn account chưa verify từ cùng một nguồn.
4. Account chưa verify quá hạn được dọn an toàn; account bị admin disable tuyệt đối không bị xem là account chờ verify.
5. Tất cả rate limiter lấy client IP từ một resolver duy nhất, chỉ tin forwarded header từ proxy đã cấu hình.
6. Các collection API lớn không còn trả toàn bộ dữ liệu không giới hạn.
7. Store page được enrich bằng số query hữu hạn theo batch, không query lại food/report/user/save cho từng store.
8. Frontend tìm kiếm/lọc trên tập dữ liệu phía server, không hiểu nhầm một page đang tải là toàn bộ hệ thống.

## 2. Hiện trạng đã xác nhận

| Nhóm | Hiện trạng | Rủi ro |
|---|---|---|
| Maps parser | `GET /v1/stores/parse-gmaps` nằm dưới public wildcard `/v1/stores/**` | Anonymous client có thể bắt backend tạo outbound traffic |
| Maps resolver | Tối đa 5 redirect, request timeout 6 giây, response tối đa 256 KiB | Một lượng request song song vẫn có thể chiếm thread/socket |
| Registration | Tạo user, verification token và gửi SMTP đồng bộ; chưa có limiter | Spam SMTP, tăng account rác và dữ liệu chờ verify |
| Client IP | Auth controller dùng `HttpServletRequest.getRemoteAddr()` trực tiếp | Sau proxy, nhiều client có thể bị gom vào IP proxy |
| Public store list | Trả `List<PublicStoreResponse>` không pagination | Response và bộ nhớ tăng theo số quán |
| Store enrichment | Mỗi store query food, report; authenticated request còn query user và saved status | N+1 query, latency tăng tuyến tính |
| Admin lists | `/users` và `/v1/stores/admin` trả toàn bộ record | Trang admin chậm và response không có giới hạn |
| Frontend | `App.loadGlobalData()` giả định `/v1/stores` trả toàn bộ store | Đổi API sang page mà không sửa UI sẽ làm search/filter thiếu kết quả |

Các bảo vệ **phải được giữ nguyên**:

- Google Maps chỉ nhận HTTPS, exact allowlist host/path, port 443.
- Kiểm tra DNS public address trước từng target và kiểm lại từng redirect.
- Giới hạn redirect, timeout, response bytes và URL length.
- Registration vẫn chờ SMTP trả kết quả; không chuyển verification email về fire-and-forget.
- Public chỉ nhận store `APPROVED` có owner đang enabled.
- Owner/admin/public tiếp tục dùng đúng DTO và visibility policy hiện tại.

## 3. Quyết định kiến trúc đã chốt

### 3.1. Thứ tự phụ thuộc

```text
P1 — ClientIpResolver
 ├── P2 — Registration abuse protection
 └── P3 — Google Maps outbound protection

P4 — Page contract + repository batch queries
 └── P5 — Frontend pagination/search/filter
```

Không triển khai rate limit mới bằng `getRemoteAddr()` tạm thời. `ClientIpResolver` phải hoàn thành trước để các limiter dùng cùng một identity nguồn.

### 3.2. Chiến lược single-instance và multi-instance

- Trước lần hosting đầu tiên với **một backend instance**, limiter và Maps cache có thể dùng in-memory store có TTL và maximum size.
- Mọi key phải có namespace; không dùng chung quota login, registration và Maps.
- Interface limiter/cache phải tách khỏi implementation để có thể thay bằng Redis khi chạy nhiều instance.
- Khi chạy từ hai backend instance trở lên, Redis/shared store là điều kiện bắt buộc; không xem in-memory quota là bảo vệ toàn cụm.

### 3.3. Chuẩn page response

Không trả trực tiếp Spring `Page` ra public contract. Tạo DTO ổn định:

```json
{
  "code": 1000,
  "message": "Stores retrieved successfully",
  "result": {
    "content": [],
    "page": 0,
    "size": 24,
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true
  }
}
```

DTO đề xuất: `PageResponse<T>`.

Quy ước chung:

- `page` zero-based.
- `size` mặc định theo endpoint và không vượt quá `100`.
- Sort chỉ nhận giá trị từ allowlist, không truyền raw property/path vào JPA.
- Page vượt phạm vi trả page rỗng, không trả lỗi 500.
- Filter phải chạy trong database trước pagination.

## 4. Batch P1 — Trusted client IP resolver

### 4.1. Contract cấu hình

Thêm cấu hình typed properties:

```yaml
security:
  client-ip:
    trust-forwarded-headers: false
    trusted-proxies: []
    maximum-forwarded-hops: 5
```

Production chỉ bật `trust-forwarded-headers=true` khi đã biết CIDR/IP của Nginx, load balancer hoặc CDN thực tế.

Không hard-code dải IP của nhà cung cấp vào source. Không bật tin forwarded header cho mọi remote address.

### 4.2. Thuật toán resolver

Tạo:

- `ClientIpProperties`
- `ClientIpResolver`
- utility/CIDR matcher có test độc lập

Quy tắc:

1. Chuẩn hóa `request.getRemoteAddr()` thành IP hợp lệ.
2. Nếu remote peer không thuộc `trusted-proxies`, bỏ qua toàn bộ `Forwarded`, `X-Forwarded-For`, `X-Real-IP` và trả remote IP.
3. Nếu remote peer được tin cậy:
   - ưu tiên chuẩn RFC `Forwarded` nếu cấu hình proxy dùng header này;
   - nếu không có thì đọc `X-Forwarded-For`;
   - giới hạn số hop được parse;
   - duyệt chuỗi hop từ phải sang trái, bỏ các proxy tin cậy và chọn client hop không tin cậy đầu tiên.
4. Header malformed, quá dài, có hostname thay vì literal IP hoặc vượt hop limit phải fallback an toàn về remote IP.
5. IPv4-mapped IPv6 phải được canonicalize nhất quán để không tạo nhiều limiter key.

Không tự lấy phần tử bên trái đầu tiên của `X-Forwarded-For`, vì client có thể tự chèn giá trị giả.

### 4.3. Call site phải chuyển đổi

Thay mọi `httpRequest.getRemoteAddr()` liên quan abuse protection bằng `clientIpResolver.resolve(httpRequest)` tại:

- email/password login;
- Google/Facebook login;
- resend verification;
- forgot password;
- verify/reset OTP;
- registration mới;
- Google Maps parser.

### 4.4. Cấu hình server/proxy

Chọn đúng **một** nơi xử lý forwarded header để tránh parse hai lần:

- Nếu dùng custom `ClientIpResolver`, giữ servlet remote address nguyên bản và không bật cơ chế rewrite không kiểm soát.
- Reverse proxy phải ghi đè, không append mù quáng, header client gửi vào.
- Tài liệu deploy phải ghi rõ proxy nào được trust và header nào được sử dụng.

### 4.5. Test bắt buộc

- Direct request không header → dùng remote IP.
- Untrusted remote gửi `X-Forwarded-For: 1.2.3.4` → vẫn dùng remote IP.
- Trusted proxy với một client hop → lấy đúng client IP.
- Chuỗi nhiều trusted proxy → lấy đúng first untrusted hop từ bên phải.
- Header malformed/hostname/quá nhiều hop → fallback remote IP.
- IPv4, IPv6 và IPv4-mapped IPv6 tạo key ổn định.
- Hai client qua cùng proxy không khóa quota của nhau.

## 5. Batch P2 — Registration abuse protection

### 5.1. API flow đích

`POST /api/auth/register`:

```text
validate DTO
→ normalize email/username
→ resolve trusted client IP
→ check IP + email registration quota
→ check pending-account quota for hashed IP
→ duplicate checks
→ create disabled/unverified user + verification token
→ send email synchronously
→ commit transaction
```

Nếu email send ném exception, transaction user/token tiếp tục rollback như behavior hiện tại.

### 5.2. Rate-limit mặc định

Các giá trị phải cấu hình được:

| Key | Limit ban đầu | Window | Ghi chú |
|---|---:|---:|---|
| Client IP | 5 registration attempts | 1 giờ | Tăng trước duplicate/DB work |
| Normalized email | 3 attempts | 24 giờ | Giảm spam lặp lại một địa chỉ |
| Pending account theo IP hash | 5 account | 7 ngày | Kiểm bằng DB để tồn tại qua restart |

Khi vượt quota:

- HTTP `429 Too Many Requests`.
- `ErrorCode.REGISTRATION_RATE_LIMITED`.
- Message JSON giữ tiếng Anh và không chứa email/IP/quota nội bộ.
- Frontend map code sang toast tiếng Việt.

Không log raw password, verification token hoặc full client IP trong event rate-limit.

### 5.3. Theo dõi pending account mà không lưu raw IP

Thêm vào `User`:

- `registrationIpHash` — nullable, indexed, không trả trong DTO.
- `pendingVerificationExpiresAt` — nullable, indexed.

Hash bằng HMAC-SHA-256:

```text
HMAC(security.registration.ip-pepper, canonicalClientIp)
```

Quy tắc lifecycle:

- Chỉ local registration gán hai trường này.
- Verify email thành công: xóa `registrationIpHash` và `pendingVerificationExpiresAt`.
- Social login kích hoạt account pending: cũng xóa hai trường.
- Account đã verify rồi bị admin disable không bao giờ được scheduler coi là pending.
- Không trả hash qua API, log hoặc audit UI.

Thêm secret cấu hình `REGISTRATION_IP_PEPPER`; production không được fallback sang giá trị hard-code. Có thể fallback JWT key trong local/test nếu tài liệu ghi rõ.

### 5.4. Dọn account chưa verify

Scheduled cleanup chạy theo batch nhỏ, ví dụ 100 record/lần:

Điều kiện bắt buộc đồng thời:

```text
emailVerified = false
enabled = false
pendingVerificationExpiresAt < now
disabledAt IS NULL
```

Quy trình:

1. Xóa verification token và OTP liên quan.
2. Xóa quan hệ role/user join cần thiết.
3. Xóa user pending trong transaction.
4. Nếu phát hiện dependency bất thường, skip record và log ID nội bộ; không cascade mù quáng.

Không sử dụng cleanup này cho account do admin disable. Không gửi email cleanup để tránh tạo thêm outbound spam.

### 5.5. Frontend

- Với `REGISTRATION_RATE_LIMITED`, toast: `Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.`
- Disable nút submit trong khi request đang chạy để tránh double-click.
- Không tự retry registration POST.
- CAPTCHA là phase sau, chỉ bật khi có hosting/domain và provider key; không block batch hiện tại.

### 5.6. Test bắt buộc

- Năm request trong quota hoạt động theo policy; request tiếp theo trả 429 trước khi gửi email.
- Email được normalize trước khi tạo limiter key.
- Unknown/duplicate email vẫn tiêu tốn IP attempt để tránh bypass bằng danh sách email.
- SMTP fail rollback user và token.
- Verify/social activation xóa pending metadata.
- Scheduler chỉ xóa local account chưa verify quá hạn.
- Account `emailVerified=true, enabled=false, disabledAt!=null` không bị xóa.
- Restart context không làm mất pending-account limit trong DB.

## 6. Batch P3 — Google Maps outbound abuse protection

### 6.1. Authorization

`GET /api/v1/stores/parse-gmaps?url=...` chuyển thành authenticated endpoint.

Thực hiện đồng thời:

- Thêm exact matcher authenticated **trước** wildcard public `/v1/stores/**` trong `SecurityConfig`.
- Thêm `@PreAuthorize("isAuthenticated()")` ở controller làm defense-in-depth.
- Không thay đổi public quyền đọc store/ranking/random/detail.
- Frontend chỉ gọi parser trong luồng tạo/sửa quán khi đã đăng nhập; khi 401 phải mở login hoặc thông báo phiên hết hạn.

### 6.2. Quota và concurrency

Giá trị ban đầu, có thể cấu hình:

| Guard | Giá trị |
|---|---:|
| Per authenticated user | 10 request / 5 phút |
| Per client IP | 30 request / 5 phút |
| Outbound resolution đồng thời mỗi instance | 10 |
| Thời gian chờ concurrency permit | 0–100 ms, fail fast |

Thứ tự xử lý:

```text
authenticate
→ validate URL shape/length
→ consume user/IP quota
→ check cache
→ acquire concurrency permit
→ resolve với SSRF protections
→ release permit trong finally
→ cache kết quả phù hợp
```

Rate limit vẫn được tính khi cache hit để ngăn endpoint bị flood bằng request rẻ.

Error contract:

- Quota hết: HTTP 429, `MAP_RESOLUTION_RATE_LIMITED`.
- Concurrency đầy: HTTP 503, `MAP_RESOLUTION_BUSY`.
- URL Google Maps không hợp lệ/không lấy được tọa độ: giữ error contract domain hiện có; không trả raw network exception.

### 6.3. Cache

Ưu tiên Caffeine hoặc cache abstraction có:

- maximum size `5.000` key;
- success TTL `15 phút`;
- negative result TTL `1 phút`;
- key là canonical/validated Google Maps URL hoặc SHA-256 của URL;
- không cache response body HTML;
- không cache redirect ngoài allowlist;
- metric hit/miss/eviction, không log raw URL có query dài.

Cache là tối ưu, không thay thế authorization/rate limit/concurrency guard.

### 6.4. SSRF invariant không được làm yếu

Mọi refactor phải tiếp tục test:

- chỉ `https`;
- exact Google Maps hosts hiện được hỗ trợ;
- path allowlist;
- không user-info, không non-443 port;
- reject loopback/private/link-local/multicast/documentation ranges;
- validate lại từng redirect;
- tối đa 5 redirect;
- connect/request timeout;
- response tối đa 256 KiB;
- URL/input tối đa 2048 ký tự và không control character.

### 6.5. Test bắt buộc

- Anonymous request trả 401 và không gọi resolver.
- Authenticated request hợp lệ vẫn phân giải short link `maps.app.goo.gl`.
- User quota và IP quota độc lập.
- Cache hit không gọi HTTP client lần hai.
- Negative cache hết hạn sớm hơn success cache.
- Khi semaphore đầy, request fail fast và không mở connection mới.
- Permit luôn được release khi timeout/exception.
- Redirect độc hại/private IP vẫn bị chặn.
- Frontend hiển thị toast tiếng Việt cho 401/429/503.

## 7. Batch P4 — Pagination và loại bỏ N+1 ở backend

### 7.1. API contract đích

| Endpoint | Query chính | Default/max size | Kết quả |
|---|---|---:|---|
| `GET /v1/stores` | `page,size,categoryId,query,sort` | 24/100 | `PageResponse<PublicStoreResponse>` |
| `GET /v1/stores/admin` | `page,size,status,query,sort` | 20/100 | `PageResponse<StoreResponse>` |
| `GET /users` | `page,size,query,enabled,role,sort` | 20/100 | `PageResponse<UserResponse>` |
| `GET /v1/stores/mine` | `page,size,status,sort` | 20/100 | `PageResponse<StoreResponse>` |
| `GET /v1/stores/saved` | `page,size,sort` | 24/100 | `PageResponse<PublicStoreResponse>` |
| `GET /v1/stores/ranking` | `limit` | 20/100 | Có giới hạn cứng, không trả vô hạn |

Public store query luôn áp dụng tại database:

```text
status = APPROVED
AND owner.enabled = true
AND optional category
AND optional normalized search
```

Search ban đầu chỉ cần name/address/landmark. Escape wildcard `%` và `_`; không nối raw SQL.

Sort allowlist đề xuất:

- `newest`
- `nameAsc`
- `ratingDesc`
- `savedDesc`

Admin sort/filter dùng allowlist riêng. Unknown sort trả HTTP 400 thay vì truyền trực tiếp property name.

### 7.2. Chiến lược query hai phase

Không `join fetch` collection food items trực tiếp trong paginated query vì có thể tạo duplicate row và sai total count.

Mỗi page dùng chiến lược:

1. Query page store IDs/entities với filter và sort tại DB.
2. `FoodItemRepository.findByStoreIdIn(storeIds)` một lần.
3. Query report count hôm nay theo `store_id IN (...) GROUP BY store_id` một lần.
4. Nếu authenticated, resolve current user đúng một lần.
5. Query saved store IDs của user trong page bằng một query.
6. Group kết quả thành map và assemble DTO trong memory theo đúng thứ tự page.

Mục tiêu query count cho public page:

- Anonymous: page/count + food batch + report batch; không tăng tuyến tính theo số store.
- Authenticated: thêm tối đa một user query và một saved batch query.

Admin/mine dùng cùng assembler batch nhưng management DTO. Không gọi `toStoreResponse()` cũ trong vòng lặp nếu method đó tự query child data.

### 7.3. Repository additions

Dự kiến:

- `StoreRepository`: `Page<Store>` với Specification hoặc query tường minh cho public/admin/owner.
- `FoodItemRepository`: `findByStoreIdIn(Collection<String>)`.
- `StoreDailyReportRepository`: projection `{storeId, count}` theo ngày và danh sách ID.
- `UserSavedStoreRepository`: lấy `storeId` theo `userId` và danh sách store ID; paginated saved-store query.
- `UserRepository`: page/filter admin users.

Không trả entity/projection nội bộ trực tiếp ra controller.

### 7.4. Index cần có migration

Blueprint này chỉ thiết kế; khi code phải tạo migration versioned, không dựa vào `ddl-auto=update` production.

Tối thiểu đánh giá và tạo index phù hợp:

- `store(status, owner_id, created_at)`;
- `store(category_id, status, created_at)`;
- `food_item(store_id)`;
- `store_daily_reports(store_id, report_date)`;
- `user_saved_stores(user_id, saved_at)`;
- unique/index hiện có cho `(user_id, store_id)`;
- `user(email_verified, enabled, pending_verification_expires_at)`;
- `user(registration_ip_hash, email_verified, pending_verification_expires_at)`.

Tên bảng/cột thực phải đối chiếu schema MySQL trước khi viết migration.

### 7.5. Test bắt buộc

- Page mặc định, page cuối, page rỗng và max-size clamp/reject.
- Public filter được áp dụng trước pagination; không xuất hiện disabled-owner/non-approved store.
- Category/search/sort trả tổng số đúng.
- Sort input không nằm allowlist bị từ chối.
- Food/report/saved được gắn đúng store và không lẫn giữa pages.
- Query-count test chứng minh số query không tăng theo số store trong page.
- Admin/owner/public vẫn nhận đúng DTO và moderation fields.
- Saved store page không chứa store đã hidden/owner disabled.

## 8. Batch P5 — Frontend pagination, search và filter

### 8.1. `App.jsx` data state

Tách metadata khỏi content:

```text
stores
storePage
storeTotalPages
storeHasMore
storeQuery
storeCategoryId
storeSort
```

Quy tắc:

- Initial load lấy page 0.
- “Tải thêm” append theo ID và không tạo duplicate.
- Đổi category/search/sort hủy hoặc bỏ qua response cũ và reset về page 0.
- Search debounce khoảng 300–500 ms.
- Không để response request cũ ghi đè filter mới; dùng `AbortController` hoặc request sequence ID.

### 8.2. Explore behavior

- Search/category/sort phải gửi lên backend, không chỉ filter page đang có.
- UI có loading ban đầu và loading-more riêng.
- Empty state chỉ hiển thị sau khi page 0 hoàn tất.
- Random store tiếp tục dùng `/v1/stores/random`; không chọn ngẫu nhiên từ page đang tải nếu UX muốn random toàn hệ thống.
- SSE/store mutation refresh chỉ reload page 0 hoặc invalidate query; không âm thầm gọi tải toàn bộ pages.

### 8.3. Admin behavior

- User table dùng page/filter server-side.
- Store moderation gửi `status=PENDING` thay vì tải tất cả rồi `.filter()` tại client.
- Sau approve/reject/disable/enable/delete, reload page hiện tại; nếu page cuối trở thành rỗng thì lùi một page.
- Hiển thị tổng record và điều khiển previous/next.

### 8.4. Backward compatibility rollout

Đây là contract breaking vì `result` đổi từ array thành page object. Backend và frontend phải nằm cùng batch release.

Hai lựa chọn triển khai hợp lệ:

1. **Khuyến nghị:** cập nhật backend + frontend đồng thời trên branch hiện tại.
2. Nếu cần deploy lệch phiên bản: thêm endpoint `/v2/...` hoặc feature flag tạm thời; không trả lúc array lúc page trên cùng contract.

Sau khi chuyển đổi, cập nhật:

- `API_REFERENCE.md`;
- `BUSINESS_FLOWS.md`;
- `FRONTEND_REFERENCE.md`;
- `DATABASE_REFERENCE.md` nếu có index/schema mới;
- `KNOWN_ISSUES.md` với trạng thái và bằng chứng test.

### 8.5. Frontend test bắt buộc

- Parse đúng `PageResponse`.
- Load more append đúng và không duplicate.
- Đổi filter reset page.
- Response cũ không overwrite query mới.
- Admin pending view gửi `status=PENDING`.
- Toast 401/429/503 là tiếng Việt; JSON backend giữ tiếng Anh.
- Build production không lỗi.

## 9. Observability và dữ liệu nhạy cảm

Metric tối thiểu:

- registration allowed/blocked theo loại quota;
- Maps allowed/rate-limited/busy/cache-hit/cache-miss/resolve-failed;
- Maps outbound duration và active concurrency;
- store page query duration, page size và total result;
- scheduled pending-account cleanup success/skip/failure.

Log:

- Có request/correlation ID nếu hạ tầng hiện tại hỗ trợ.
- Không log password, OTP, social token, verification token, full Maps URL, raw forwarded header hoặc registration IP hash.
- Có thể log user internal ID và reason code; IP chỉ nên log dạng masked/hash phục vụ abuse investigation.
- Không trả provider/network/database exception raw cho client.

## 10. Kế hoạch commit

Mỗi commit phải build/test độc lập trong phạm vi hợp lý:

1. `feat(security): resolve client ip through trusted proxies`
2. `feat(auth): protect registration from automated abuse`
3. `feat(stores): limit and cache google maps resolution`
4. `feat(api): paginate store and user collections`
5. `perf(stores): batch store response enrichment`
6. `feat(frontend): consume paginated store and admin APIs`
7. `docs: document abuse controls and paginated contracts`

Migration có thể nằm cùng commit feature tạo field/index nếu migration framework đã được chấp thuận; nếu chưa, phải có commit migration riêng trước khi coi feature sẵn sàng production.

Không đưa `scripts/oci-a1-capacity-retry.ps1` vào bất kỳ commit nào.

## 11. Verification gate

### Gate A — Sau trusted proxy

- Unit test resolver pass.
- Không còn call site abuse protection dùng trực tiếp `getRemoteAddr()`.
- Spoofed forwarded header từ untrusted peer không đổi limiter key.

### Gate B — Sau registration protection

- Rate-limit, rollback SMTP và cleanup tests pass.
- Account admin-disabled không bị cleanup.
- Không có raw IP field trong user response.

### Gate C — Sau Maps protection

- Anonymous bị 401 trước outbound call.
- Quota/cache/concurrency/SSRF regression tests pass.
- Short-link Google Maps đang dùng thực tế vẫn được hỗ trợ.

### Gate D — Sau backend pagination

- Integration test MySQL-compatible profile pass.
- Query count không tăng theo page size.
- Public visibility và total count đúng.

### Gate E — Sau frontend migration

- Frontend unit tests, lint và production build pass.
- Manual E2E: explore/search/category/load-more, create/edit map link, admin users, pending stores.
- Network tab không còn collection request trả dữ liệu không giới hạn.

## 12. Definition of Done

Chỉ đánh dấu blueprint hoàn thành khi:

- [x] Trusted proxy/IP resolution có cấu hình, test và deployment note.
- [x] Registration có limiter IP/email và pending-account quota bền qua restart.
- [x] Pending cleanup không đụng account admin-disabled.
- [x] Maps parser yêu cầu authentication.
- [x] Maps resolver có quota, cache, concurrency guard và giữ SSRF invariants.
- [x] Public/admin/user/mine/saved collections có giới hạn rõ ràng.
- [x] N+1 store enrichment đã được thay bằng batch queries.
- [x] Frontend search/filter/pagination dùng contract mới và xử lý stale request.
- [x] Các error code mới có toast tiếng Việt nhưng backend message vẫn tiếng Anh.
- [ ] Migration/index tương ứng đã được tạo và kiểm tra trên database sạch.
- [x] Backend tests và frontend build/test pass.
- [x] Context docs được cập nhật theo implementation thực tế.
- [x] `scripts/oci-a1-capacity-retry.ps1` không bị stage/commit.

## 13. Các điểm cần xác nhận trước lúc bắt đầu code

Các giá trị dưới đây đang được blueprint chọn làm mặc định và có thể đổi trước implementation:

| Quyết định | Mặc định trong blueprint |
|---|---|
| Thời gian giữ account chưa verify | 7 ngày |
| Registration IP quota | 5/giờ |
| Pending account tối đa/IP hash | 5/7 ngày |
| Maps endpoint | Chỉ authenticated |
| Maps user/IP quota | 10 và 30/5 phút |
| Maps concurrency mỗi instance | 10 |
| Maps success/negative cache | 15 phút / 1 phút |
| Public store page size | 24, max 100 |
| Admin/user page size | 20, max 100 |
| Pagination rollout | Backend và frontend cùng release |

Nếu không có thay đổi nghiệp vụ, implementation phải tuân theo các mặc định này và không tự mở rộng sang Redis, CAPTCHA, SSE hoặc store state machine trong cùng batch.

## 14. Kết quả triển khai ngày 17/10/2026

- Đã thêm trusted `ClientIpResolver`, CIDR allowlist và thay toàn bộ auth call site dùng resolver chung.
- Đã thêm registration quota, HMAC IP metadata, hạn pending 7 ngày và scheduled cleanup theo transaction riêng từng account.
- Đã chuyển Maps parser thành authenticated endpoint; thêm quota user/IP, SHA-256 cache key, success/negative TTL và semaphore giới hạn outbound concurrency.
- Đã thêm `PageResponse<T>` cho public/admin/owner/saved store và admin user collections.
- Đã batch-load food items, daily report counts và saved IDs theo store page.
- Đã chuyển Explore sang server search/category query và load-more; admin tables dùng page metadata và server query/filter.
- Đã thêm migration SQL dự kiến cho pending registration fields và query indexes.
- Automated verification: backend 53 test pass; frontend production build và UI error tests pass; lint không có error nhưng còn warning cũ.

Còn cần xác nhận thủ công trước hosting:

- Browser E2E cho Explore load-more/search/category, owner/saved collections và các bảng admin.
- Chạy/review migration trên bản sao schema MySQL thực; file migration hiện vẫn nằm trong `backend/documents/migrations` vì dự án chưa tích hợp Flyway.
- Điền CIDR reverse proxy thật trước khi bật `TRUST_FORWARDED_HEADERS=true`.
