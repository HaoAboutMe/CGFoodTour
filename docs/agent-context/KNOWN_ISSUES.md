# Known Issues và khoảng trống xác minh

> Mức độ và bằng chứng gốc là đánh giá kiến trúc dựa trên source ngày 15/10/2026, không phải kết luận pentest. Xem phần cập nhật trạng thái bên dưới trước khi dùng danh sách này làm backlog hiện tại.

## Cập nhật trạng thái — 17/10/2026

Đã triển khai và có automated verification trong đợt
[`PRE_HOSTING_SECURITY_REMEDIATION_BLUEPRINT.md`](PRE_HOSTING_SECURITY_REMEDIATION_BLUEPRINT.md):

- Chống brute-force login email/password theo IP và email; social login theo IP; unknown email và wrong password cùng trả lỗi generic.
- **M-01, M-11:** response không còn lộ DB root cause; runtime không dự kiến trả HTTP 500 generic và ghi stack trace phía server.
- **M-02, M-04:** public store dùng DTO riêng; food-item read tuân theo visibility của store.
- **M-05, M-18:** user update được validate nhất quán; `GET /users/{id}` chỉ dành cho ADMIN và có method-security test.
- **M-15:** credential được redact trước khi vào frontend log state; DevConsole không được đóng gói trong production build.
- **Store edit/banner atomicity:** form edit chỉ preview ảnh cục bộ; metadata và banner được gửi trong một request multipart khi bấm lưu. Rollback database dọn ảnh mới, commit thành công mới dọn ảnh cũ; endpoint banner riêng không còn bypass trạng thái `PENDING` của owner.

Các mục trên được giữ lại phía dưới như lịch sử phát hiện. Manual browser E2E với database/SMTP/OAuth thật vẫn chưa được xác nhận; các issue không được nêu trong cập nhật này không mặc nhiên được xem là đã xử lý.

## Critical

Chưa có lỗ hổng Critical được xác minh là khai thác được trong môi trường production thật. SSRF bên dưới có thể tăng lên Critical nếu backend truy cập metadata/credential/internal control plane; môi trường mạng chưa được kiểm tra.

## High

### H-01 — Frontend registration không tương thích backend

- **Bằng chứng:** `frontend/src/App.jsx:739` gọi `POST /auth/register`; `UserController.java:26` chỉ có `POST /users`. UI payload không gửi `dateOfBirth` (`App.jsx:739-745`), trong khi `UserCreationRequest.dateOfBirth` validator trả false cho null. UI min password 6 (`App.jsx:728`), backend min8.
- **Điều kiện:** user đăng ký email/password từ React SPA.
- **Ảnh hưởng:** chức năng onboarding cốt lõi thất bại ngay cả khi đổi riêng URL.
- **Chắc chắn:** Cao (đối chiếu contract tĩnh).
- **Tiếp theo:** thống nhất endpoint/payload/rule, thêm integration test registration→verify→login.

### H-02 — Public SSRF qua Google Maps parser

- **Bằng chứng:** `SecurityConfig.java:30-37,62` permit mọi GET `/v1/stores/**`; `StoreController.java:45-49` nhận `url`; `StoreService.java:661-730` mở `HttpURLConnection`, theo redirect và đọc body mà không allowlist host/IP.
- **Điều kiện:** backend có egress và truy cập được URL do attacker chọn.
- **Ảnh hưởng:** scan/truy cập HTTP service nội bộ, metadata endpoint, amplification/timeout; mức thực tế phụ thuộc network.
- **Chắc chắn:** Cao về primitive SSRF; Chưa xác định về tài nguyên nội bộ reachable.
- **Tiếp theo:** chỉ cho phép HTTPS Google Maps host, resolve và chặn private/link-local/loopback ở mọi redirect, giới hạn response/timeout, rate limit; cân nhắc bỏ server fetch.

### H-03 — OTP/reset và resend không có chống abuse

- **Bằng chứng:** public endpoints trong `SecurityConfig`; OTP 6 chữ số/5 phút (`AuthenticationService.java:254-323`, `PasswordResetOtp.java:39-43`); không rate limiter/attempt counter/CAPTCHA/generic response trong repo.
- **Điều kiện:** endpoint internet-accessible và không có gateway/WAF ngoài repo.
- **Ảnh hưởng:** brute-force OTP, user enumeration, spam email/cost/lock contention.
- **Chắc chắn:** Cao trong ứng dụng; **Chưa xác định** có lớp ngoài repo hay không.
- **Tiếp theo:** per-IP/per-account rate limit, attempt cap, hashed OTP, generic response, audit/alert.

### H-04 — Checkout sạch không đủ điều kiện khởi chạy backend mặc định

- **Bằng chứng:** `application.yaml` active `dev`; chỉ có `application-dev.yaml.example`; H2 test scope; required JWT/Cloudinary properties nằm ở profile/template.
- **Điều kiện:** chạy `mvnw spring-boot:run` trên checkout sạch không cung cấp env/profile config.
- **Ảnh hưởng:** startup fail; onboarding/dev automation không tái lập.
- **Chắc chắn:** Cao về thiếu file/property; runtime chưa chạy.
- **Tiếp theo:** document env contract rõ hoặc cung cấp safe dev config không secret; thêm config smoke test.

### H-05 — Production schema không thể dựng từ repository hiện tại

- **Bằng chứng:** production `ddl-auto=validate`; không có migration/SQL; deployment artifacts cũng chưa có.
- **Điều kiện:** deploy vào MySQL rỗng hoặc schema lệch.
- **Ảnh hưởng:** startup fail hoặc thay đổi schema không kiểm soát ở dev; rủi ro vận hành/dữ liệu.
- **Chắc chắn:** Cao.
- **Tiếp theo:** baseline schema thật, Flyway/Liquibase migrations, CI validate migration.

## Medium

### M-01 — DB root cause bị trả về client

- **Bằng chứng:** `GlobalExceptionHandler.java:92-102` nối `exception.getRootCause().getMessage()` vào response.
- **Điều kiện:** gây unique/FK/data integrity error.
- **Ảnh hưởng:** lộ schema/table/constraint/SQL-driver detail.
- **Chắc chắn:** Cao.
- **Tiếp theo:** response generic/coded; log correlation server-side.

### M-02 — Public store response lộ email owner

- **Bằng chứng:** `StoreMapper.java:21` map `owner.email`; public GET store/list trả `StoreResponse.ownerEmail`.
- **Điều kiện:** store APPROVED.
- **Ảnh hưởng:** thu thập PII/spam; có thể trái kỳ vọng privacy.
- **Chắc chắn:** Cao về exposure; mức chấp nhận nghiệp vụ chưa xác định.
- **Tiếp theo:** xác nhận requirement; tách public/private/admin DTO.

### M-03 — Hard-delete xóa audit record vừa tạo

- **Bằng chứng:** `StoreService.java:397-407` save `HARD_DELETE`; dòng 418 `storeAuditLogRepository.deleteByStoreId`.
- **Điều kiện:** owner/admin hard-delete store.
- **Ảnh hưởng:** mất dấu vết hành động xóa, trái mục tiêu audit entity.
- **Chắc chắn:** Cao.
- **Tiếp theo:** giữ log detached hoặc soft-delete/archive; test audit retention.

### M-04 — Food-item public read bỏ qua visibility store

- **Bằng chứng:** Security permit GET `/v1/food-items/**`; `FoodItemService.getFoodItemsByStore/getFoodItem` không kiểm `StoreStatus`/owner/admin.
- **Điều kiện:** biết/đoán store ID hoặc item ID của pending/hidden/rejected store.
- **Ảnh hưởng:** bypass moderation/privacy cho menu.
- **Chắc chắn:** Cao.
- **Tiếp theo:** áp cùng visibility policy như StoreService; security tests.

### M-05 — Validation user/password không được kích hoạt nhất quán

- **Bằng chứng:** `UserController` PUT self/admin/change-password thiếu `@Valid`; DTO có DOB/password annotations. Profile UI nói min6; intended DTO min8.
- **Điều kiện:** client gửi payload trực tiếp hoặc UI.
- **Ảnh hưởng:** password yếu, DOB/null/inconsistent profile, DB errors.
- **Chắc chắn:** Cao.
- **Tiếp theo:** thêm validation có chủ ý, thống nhất rule và client text/tests.

### M-06 — N+1 query trong store list

> **Trạng thái 17/10/2026:** Đã xử lý trên các collection API mới bằng pagination và batch query food/report/saved. Các detail/mutation response đơn lẻ vẫn dùng assembler đơn-record phù hợp.

- **Bằng chứng:** `StoreService.java:611-635` per response query food/report/user/save; list loops `100-125`.
- **Điều kiện:** list nhiều store, nhất là request authenticated.
- **Ảnh hưởng:** latency/DB load tăng tuyến tính nhiều query.
- **Chắc chắn:** Cao về query pattern; chưa benchmark.
- **Tiếp theo:** projection/batch fetch/grouped counts/entity graph, đo query count.

### M-07 — Rating/bookmark denormalized counters có race

- **Bằng chứng:** rating ba COUNT rồi write; save read-modify-write; Store không `@Version`/lock.
- **Điều kiện:** concurrent mutations cùng store.
- **Ảnh hưởng:** lost update/counter lệch.
- **Chắc chắn:** Trung bình-Cao.
- **Tiếp theo:** atomic update/locking/derived query, concurrency test và reconciliation.

### M-08 — Generic upload thiếu giới hạn và ownership

- **Bằng chứng:** `UploadController.java:27-50` chỉ check empty; arbitrary `folder`; Cloudinary service upload bytes; mọi authenticated user được gọi.
- **Điều kiện:** account hợp lệ.
- **Ảnh hưởng:** storage/cost abuse, file lớn, orphan assets, namespace pollution.
- **Chắc chắn:** Cao về missing application guard; Cloudinary policy chưa xác định.
- **Tiếp theo:** size/MIME/content validation, folder enum, quota, signed ownership/cleanup.

### M-09 — Logout UI không revoke token

- **Bằng chứng:** `App.jsx:970-980` chỉ clear localStorage; không gọi backend `/auth/logout`.
- **Điều kiện:** token đã bị sao chép hoặc vẫn dùng ở nơi khác.
- **Ảnh hưởng:** token còn hợp lệ đến access expiry/refresh behavior.
- **Chắc chắn:** Cao.
- **Tiếp theo:** gọi logout trước clear, xử lý failure idempotent, thiết kế multi-session.

### M-10 — Password change/reset không revoke JWT khác

- **Bằng chứng:** `UserService.changePassword` và `AuthenticationService.resetPassword` chỉ save password; JWT validation không so password version/account state mỗi request.
- **Điều kiện:** token cũ còn hạn hoặc refresh window.
- **Ảnh hưởng:** session bị đánh cắp sống tiếp sau đổi/reset password.
- **Chắc chắn:** Cao.
- **Tiếp theo:** token version/session records/revoke all, kiểm enabled khi refresh.

### M-11 — Runtime exception status/observability không nhất quán

- **Bằng chứng:** `GlobalExceptionHandler.java:25-31` gán code uncategorized nhưng HTTP 400, không log exception.
- **Điều kiện:** NPE/external/runtime bug.
- **Ảnh hưởng:** client hiểu sai, khó điều tra, metric 5xx sai.
- **Chắc chắn:** Cao.
- **Tiếp theo:** 500 generic + structured server log/correlation ID.

### M-12 — Async email outcome tách khỏi API success

- **Bằng chứng:** `EmailService` methods `@Async void`; callers try/catch và trả success ngay.
- **Điều kiện:** SMTP fail sau method dispatch.
- **Ảnh hưởng:** UI báo gửi thành công dù email thất bại; fallback catch/log raw token ở caller không hoạt động như kỳ vọng.
- **Chắc chắn:** Cao theo Spring async semantics; runtime proxy chưa chạy.
- **Tiếp theo:** outbox/retry/status, `CompletableFuture`, metrics; không log raw token/OTP.

### M-13 — Store lifecycle operations thiếu một số transition guard

- **Bằng chứng:** approve/reject/rate/report/save không check current status; chỉ hide/recover có guard.
- **Điều kiện:** admin/user gọi API trực tiếp với non-approved store ID.
- **Ảnh hưởng:** trạng thái/quy tắc moderation không nhất quán; counters trên store không public.
- **Chắc chắn:** Cao về code; requirement chưa xác định.
- **Tiếp theo:** lập state machine nghiệp vụ và test ma trận transition.

### M-14 — SSE public/in-memory không có giới hạn kết nối

- **Bằng chứng:** public `/events`; mỗi call thêm emitter 10 phút; không auth/quota/heartbeat/distributed bus.
- **Điều kiện:** nhiều connection hoặc multi-instance.
- **Ảnh hưởng:** resource exhaustion, missed events giữa instances.
- **Chắc chắn:** Cao về design, chưa load-test.
- **Tiếp theo:** connection/rate limits, proxy tuning, broker hoặc polling/versioning.

### M-15 — Secret-like request data được giữ trong frontend DevConsole state

- **Bằng chứng:** `makeRequest` gọi `logEvent(..., body, ...)`; body login/register/reset chứa password/OTP/token; DevConsole render cho admin.
- **Điều kiện:** admin thực hiện auth/security action rồi xem dev console hoặc có code/script đọc state/UI.
- **Ảnh hưởng:** tăng phạm vi lộ credential trong browser session/screenshare.
- **Chắc chắn:** Cao.
- **Tiếp theo:** redact field nhạy cảm trước log; tắt console production.

### M-16 — Refresh token client/server rotation không nhất quán

- **Bằng chứng:** login lưu `refreshToken` thành chuỗi rỗng vì backend không trả field (`App.jsx:689-694`); proactive interval là 10 phút trong khi dev access token template là 5 phút. Nhánh refresh-on-401 giữ `storedRefreshToken` cũ nếu response không có refresh token (`App.jsx:483-492`), nhưng backend blacklist chính token request (`AuthenticationService.java:156-179`).
- **Điều kiện:** token hết hạn trước proactive refresh, timer bị throttled, hoặc đã refresh qua nhánh 401 hơn một lần.
- **Ảnh hưởng:** logout sớm ở dev và refresh kế tiếp thất bại vì dùng token đã blacklist.
- **Chắc chắn:** Cao từ contract/control flow.
- **Tiếp theo:** định nghĩa rõ access/refresh token pair hoặc lưu JWT mới làm refresh credential ở cả hai nhánh; test rotation/expiry.

### M-17 — Manual email verification báo success cả khi backend trả trang lỗi

- **Bằng chứng:** `AuthenticationController.verifyEmail` catch mọi exception rồi trả HTML error mà không đổi HTTP status (`82-91`); `App.handleVerifyEmail` chỉ kiểm `res.success` từ HTTP status (`763-775`).
- **Điều kiện:** nhập verification token sai/hết hạn trong AuthModal.
- **Ảnh hưởng:** UI thông báo kích hoạt thành công dù account chưa activated.
- **Chắc chắn:** Cao.
- **Tiếp theo:** trả JSON/status lỗi cho API flow hoặc client phân biệt HTML/result; tách browser landing page khỏi API verify.

### M-18 — Self-access bằng `GET /users/{id}` dùng returnObject trong pre-authorization

- **Bằng chứng:** `UserService.java:114` dùng `@PreAuthorize("hasRole('ADMIN') or returnObject.email == authentication.name")`; return object chỉ phù hợp post-authorization sau khi method chạy.
- **Điều kiện:** non-admin gọi endpoint bằng chính user ID.
- **Ảnh hưởng:** self access có khả năng bị từ chối/evaluation error; frontend tránh bằng `/users/me`.
- **Chắc chắn:** Trung bình-Cao; chưa chạy method-security test.
- **Tiếp theo:** dùng principal/ID ownership trước query hoặc `@PostAuthorize`; thêm security test.

### M-19 — Social login có thể tự bật lại account disabled

- **Bằng chứng:** Google branch đặt `enabled=true` cho existing email (`AuthenticationService.java:361-367`); Facebook branches làm tương tự (`469-491`), sau đó check disabled không còn tác dụng. Google cũng không kiểm claim `email_verified`; Facebook không debug token để ràng buộc app ID trong code.
- **Điều kiện:** account local disabled/unverified có email/social identity khớp và provider token được chấp nhận.
- **Ảnh hưởng:** bypass quyết định disable account; account-linking assurance thấp hơn mô tả.
- **Chắc chắn:** Cao về auto-enable; mức khai thác OAuth linking cần kiểm provider/app config.
- **Tiếp theo:** tách email verification khỏi administrative disable, kiểm provider claims/app audience, policy link account explicit.

## Low / Informational

### L-01 — Tài liệu cũ sai contract

`backend/README.md` mô tả role/endpoint/token không tồn tại; xem `PROJECT_CONTEXT.md`. Có thể khiến client/dev triển khai sai.

### L-02 — Yêu cầu Node trong README thấp hơn Vite lockfile

README nói Node ≥18; package-lock cho toolchain Vite 8 ghi `^20.19.0 || >=22.12.0`. Host hiện Node 24.21.0.

### L-03 — Không cleanup token blacklist/OTP

Không có scheduled delete expired invalidated token/old OTP; table tăng theo thời gian.

### L-04 — Timezone không explicit

Daily cron/`LocalDate.now()` dùng JVM timezone; UI open-now dùng browser timezone. Production target Asia/Ho_Chi_Minh chỉ xuất hiện trong JDBC URL default, không cấu hình scheduler/Jackson timezone.

### L-05 — HTML dynamic content không escape

Verify page format email/error; notification email format store name/reason. Input/provider constraints giảm rủi ro nhưng nên HTML-escape.

### L-06 — Frontend static quality warnings

`npm run lint` exit 0 nhưng có nhiều warning unused/effect/dependency/immutability; xem `FRONTEND_REFERENCE.md`.

### I-01 — Không có automated tests

Không có test class/spec do project quản lý; test config H2 không đủ chứng minh behavior.

### I-02 — Deployment mới ở mức kế hoạch

Không có Docker/Compose/Terraform/CI workflow; `ORACLE_CLOUD_DEPLOYMENT_PLAN.md` không phải trạng thái deployed.

## Phạm vi chưa xác minh

- Schema/data/index/cascade và MySQL version production thật.
- Secret hygiene trong môi trường thật; tài liệu này không đọc/in giá trị secret.
- Cloudinary account policy/quota, SMTP delivery, Google/Facebook app config.
- Reverse proxy/WAF/rate limit/TLS/CSP/backup/monitoring ngoài repository.
- Build/backend startup/browser E2E: sandbox không cho chạy build/test ghi artifact.
- Khả năng khai thác SSRF tới internal services và hiệu năng query thực tế.

