# CG FoodTour — Pre-production Launch Blueprint

> Trạng thái: **PHASE A ĐÃ TRIỂN KHAI TRONG SOURCE — CHỜ MYSQL/DOCKER VÀ STAGING HTTPS NGHIỆM THU**
> Ngày lập: 19/10/2026
> Cập nhật triển khai: 19/10/2026
> Phạm vi: E2E trên HTTPS, migration database, health/observability, backup/restore, cấu hình production fail-fast, giới hạn single-instance, email delivery và các cải tiến sau beta.
> Mục tiêu: đưa CG FoodTour từ một local MVP đã có automated test thành một bản closed beta có thể triển khai, quan sát, phục hồi và rollback an toàn.

Đã triển khai trong Phase A: Flyway baseline, Testcontainers migration test, production fail-fast validation, Actuator health/Prometheus, request correlation, SSE guardrail, bounded email retry/metric, container rehearsal, CI, Playwright E2E framework và operational runbooks. Các checkbox toàn blueprint vẫn chỉ được đóng sau khi có bằng chứng MySQL/Docker, HTTPS staging, OAuth thật, backup/restore và mobile smoke tương ứng.

---

## 1. Bối cảnh và kết luận kiến trúc

Hiện tại dự án đã có phần lớn luồng nghiệp vụ cốt lõi, production build, automated test, cookie-based refresh token, state machine quán, cleanup job và cấu hình Nginx mẫu. Những khoảng trống còn lại chủ yếu thuộc nhóm **release engineering và vận hành**, không phải thiếu tính năng cơ bản.

Các giới hạn đã xác nhận:

- Production dùng `ddl-auto=validate`, nhưng các SQL migration vẫn nằm trong `backend/documents/migrations` và chưa được Flyway thực thi.
- Chưa có browser E2E framework trong `frontend/package.json`.
- Backend chưa có Spring Boot Actuator, readiness/liveness endpoint hoặc correlation ID dùng chung.
- `application-prod.yaml` vẫn cho phép một số giá trị fallback localhost/rỗng.
- SSE, rate-limit và một số cache đang giữ state trong memory của process.
- Một số email trạng thái quán chạy bằng `@Async void`, nên chưa có delivery guarantee sau khi transaction nghiệp vụ commit.
- Chưa có bằng chứng backup/restore rehearsal hoặc deploy/rollback rehearsal.

Vì vậy, kiến trúc mục tiêu cho lần public đầu tiên là:

```text
Internet
   |
   v
DNS + HTTPS
   |
   v
Nginx (React static + reverse proxy /api + SSE)
   |
   v
01 Spring Boot instance
   |
   v
MySQL

Cloudinary: media
SMTP provider: email
Off-host storage: database backup
External uptime monitor: health/availability alert
```

**Không triển khai nhiều backend instance trong giai đoạn này.** Đây là một quyết định nhất quán dữ liệu, không chỉ là tiết kiệm chi phí. Khi SSE/rate-limit/cache còn ở memory, hai instance có thể nhìn thấy state khác nhau.

---

## 2. Kết quả bắt buộc

Khi blueprint hoàn tất, hệ thống phải đáp ứng các kết quả sau:

1. Database rỗng có thể được dựng hoàn toàn bằng Flyway từ source code.
2. Database có dữ liệu hiện tại có một đường baseline/upgrade được diễn tập trên bản sao đã ẩn dữ liệu nhạy cảm.
3. Production không thể khởi động nếu thiếu secret hoặc endpoint bắt buộc.
4. Có staging HTTPS cùng topology với production để chạy browser E2E.
5. Các luồng auth, cookie, OAuth, deep-link và upload/cancel vượt qua E2E trên trình duyệt thật.
6. Có liveness/readiness phục vụ orchestration và monitoring nhưng không làm lộ thông tin nhạy cảm.
7. Mỗi request có correlation ID xuyên suốt response và log.
8. Có metric tối thiểu cho availability, 5xx, latency, database pool và email failure.
9. Database được backup ngoài host và đã restore thành công ít nhất một lần.
10. Có runbook deploy, migration, rollback và xử lý sự cố.
11. Email quan trọng có trạng thái delivery quan sát được; nếu chọn durable delivery thì dùng transactional outbox với retry hữu hạn.
12. Các giới hạn single-instance được ghi rõ và có trigger cụ thể trước khi scale ngang.

---

## 3. Ngoài phạm vi của lần closed beta đầu tiên

- Kubernetes.
- Multi-region hoặc active-active database.
- Nhiều backend replica khi chưa có shared state.
- Redis chỉ để “chuẩn bị trước” nhưng chưa có nhu cầu scale thực tế.
- Chuyển toàn bộ frontend sang Next.js/Remix.
- Message broker riêng nếu email volume và SLA chưa yêu cầu.
- Spatial database phức tạp khi dữ liệu còn nhỏ.
- Hệ thống analytics theo dõi danh tính hoặc thu thập dữ liệu không cần thiết.

Những mục này không bị loại bỏ vĩnh viễn. Chúng chỉ được kích hoạt khi có số liệu tải, nhu cầu sản phẩm hoặc SLA đủ rõ để biện minh cho chi phí vận hành.

---

## 4. Nguyên tắc triển khai

- Không dùng `ddl-auto=update` ở staging hoặc production.
- Không chạy migration lần đầu trực tiếp trên dữ liệu duy nhất đang có.
- Không đưa secret vào Git, frontend bundle, Docker image hoặc log.
- Không log password, OTP, access token, refresh cookie, OAuth credential hay verification link đầy đủ.
- E2E không dùng tài khoản OAuth cá nhân chính hoặc mailbox cá nhân chính.
- Health endpoint không trả database URL, username, stack trace hoặc secret.
- Backup phải nằm ngoài failure domain của application VM.
- Mỗi batch có rollback và bằng chứng nghiệm thu riêng; không gộp tất cả vào một commit.
- JSON backend tiếp tục dùng message tiếng Anh; frontend map error code sang tiếng Việt.
- Giữ Google/Facebook SDK tải tĩnh từ `frontend/index.html`; không đưa lazy-loader trở lại nếu chưa có một blueprint và E2E riêng chứng minh tính ổn định.

---

## 5. Thứ tự phụ thuộc

```text
L0 — Chốt contract môi trường và topology
 |
 +--> L1 — Flyway + schema verification
 |      |
 |      +--> L2 — Production config fail-fast
 |              |
 |              +--> L3 — Packaging + staging HTTPS
 |                       |
 |                       +--> L4 — Browser E2E
 |
 +--> L5 — Health, logs, metrics, alert
 |
 +--> L6 — Backup/restore + deploy/rollback rehearsal
 |
 +--> L7 — Email delivery reliability

Sau closed beta:
L8 — Legal/UX/performance/SEO/analytics/data quality
L9 — Scale gate: Redis, distributed SSE, DB geo query
```

`L1–L3` mở đường cho môi trường kiểm thử gần production. `L4–L7` là release gate. `L8–L9` không được phép trì hoãn các gate an toàn nhưng cũng không cần chặn closed beta nếu các tiêu chí tối thiểu đã đạt.

---

## 6. Batch L0 — Chốt contract môi trường và topology

### 6.1. Việc cần làm

Tạo tài liệu contract biến môi trường, ví dụ `.env.production.example`, chỉ chứa tên biến và giá trị giả:

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
APP_BASE_URL=
APP_CORS_ALLOWED_ORIGINS=
JWT_SIGNER_KEY=
OTP_PEPPER=
REGISTRATION_IP_PEPPER=
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SPRING_MAIL_HOST=
SPRING_MAIL_PORT=
SPRING_MAIL_USERNAME=
SPRING_MAIL_PASSWORD=
TRUST_FORWARDED_HEADERS=true
TRUSTED_PROXY_CIDRS=
```

Chốt topology ban đầu:

- Một domain và same-origin reverse proxy: frontend tại `/`, API tại `/api`.
- Một backend instance.
- MySQL không public ra Internet.
- Nginx là proxy duy nhất được tin cậy khi đọc forwarded headers.
- Cloudinary tiếp tục lưu media; local disk không phải nguồn ảnh chính.

### 6.2. Vì sao chọn cách này

Same-origin đơn giản hóa CORS, cookie `SameSite=Strict`, CSRF và OAuth callback. Một backend instance giữ đúng semantics của SSE/rate-limit/cache hiện tại. Việc viết contract biến môi trường trước Flyway và deploy ngăn cấu hình ngầm khác nhau giữa máy local, staging và production.

### 6.3. Tiêu chí nghiệm thu

- Có bảng biến bắt buộc, biến tùy chọn, kiểu dữ liệu và ví dụ hợp lệ.
- Mỗi secret có owner và nơi lưu, không có giá trị thật trong Git.
- Trusted proxy CIDR chỉ chứa proxy thực tế, không dùng `0.0.0.0/0`.
- Sơ đồ port/network xác định chỉ `80/443` public; SSH bị hạn chế; `3306` private/local.

---

## 7. Batch L1 — Chuẩn hóa migration bằng Flyway

### 7.1. Thiết kế mục tiêu

Thêm Flyway cho Spring Boot/MySQL và chuyển migration runtime vào:

```text
backend/src/main/resources/db/migration/
  V1__baseline_schema.sql
  V2__harden_password_reset_otp.sql
  V3__registration_and_store_query_hardening.sql
  V4__p1_product_readiness.sql
```

Tên/version thực tế phải được chốt sau khi so sánh schema hiện hành. Không sao chép mù ba file SQL hiện có rồi giả định chúng tạo được database rỗng.

Production giữ:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    validate-on-migrate: true
```

### 7.2. Hai đường migration bắt buộc

#### Greenfield

```text
MySQL rỗng
→ Flyway V1...Vn
→ Hibernate validate
→ application startup
→ smoke test
```

#### Database hiện hữu

```text
Tạo backup/snapshot
→ restore thành database rehearsal riêng
→ so sánh information_schema với baseline kỳ vọng
→ đặt baseline marker có kiểm soát nếu schema tương thích
→ chạy migration còn thiếu
→ Hibernate validate
→ regression test
```

Không bật `baselineOnMigrate=true` vô điều kiện. Việc đó có thể đánh dấu một schema sai là hợp lệ và bỏ qua migration cần thiết.

### 7.3. Test cần có

- Testcontainers MySQL, không dùng H2 để chứng minh migration MySQL.
- `empty database → migrate → context starts`.
- `Vn-1 snapshot → Vn → data preserved`.
- Check unique constraint, foreign key, index và kiểu timestamp/decimal quan trọng.
- Test migration checksum mismatch phải fail.
- Test rating/bookmark concurrent trên MySQL thật.

### 7.4. Vì sao dùng Flyway

Hibernate entity mô tả trạng thái schema mong muốn nhưng không mô tả lịch sử thay đổi dữ liệu. Flyway cung cấp thứ tự, checksum và bảng lịch sử, nhờ đó một schema có thể tái tạo và audit được. `ddl-auto=validate` vẫn hữu ích ở lớp cuối: Flyway thay đổi schema, Hibernate xác nhận schema đó phù hợp entity.

Testcontainers được chọn vì H2 khác MySQL ở locking, index, DDL và hàm SQL. Các lỗi concurrency và migration cần được chứng minh trên đúng database engine.

### 7.5. Rollback

- Ưu tiên forward-fix migration; không tự động chạy destructive down migration.
- Migration xóa/đổi kiểu cột phải theo expand-contract: thêm cấu trúc mới, backfill, deploy code tương thích, rồi mới xóa ở release sau.
- Nếu migration trước startup thất bại: không khởi động phiên bản mới; giữ phiên bản cũ và database chưa bị thay đổi dở dang nếu DDL cho phép.
- Nếu migration đã commit và app lỗi: dùng phiên bản app tương thích hoặc forward-fix; restore chỉ là phương án sự cố có chủ ý vì restore làm mất dữ liệu phát sinh sau backup.

### 7.6. Definition of Done

- [ ] Database rỗng dựng được chỉ từ repository.
- [ ] Database rehearsal hiện hữu upgrade thành công.
- [ ] Hibernate `validate` pass sau migration.
- [ ] CI chạy migration integration test trên MySQL.
- [ ] Có schema diff/checksum và log kết quả rehearsal.
- [ ] Không cần `ddl-auto=update`.

---

## 8. Batch L2 — Production configuration fail-fast

### 8.1. Thay đổi dự kiến

Loại bỏ fallback nguy hiểm trong profile production, đặc biệt:

- Datasource localhost với `useSSL=false`.
- `APP_BASE_URL=http://localhost...`.
- OAuth/Cloudinary/SMTP credential rỗng nếu tính năng được bật.
- Admin mặc định hoặc password bootstrap không rõ lifecycle.
- Pepper dùng fallback sang JWT signer key.

Dùng typed `@ConfigurationProperties` kết hợp validation để startup fail với thông báo nêu **tên property thiếu**, không in giá trị secret.

Phân biệt feature required và optional:

- Database và JWT signer: luôn bắt buộc.
- `APP_BASE_URL` và allowed origin: bắt buộc ở production.
- Cloudinary: bắt buộc nếu upload được bật.
- SMTP: bắt buộc nếu registration/password reset được bật.
- Google/Facebook: chỉ bắt buộc nếu nút provider tương ứng được hiển thị.

### 8.2. Vì sao fail-fast

Fallback localhost tiện cho development nhưng nguy hiểm ở production: ứng dụng có thể khởi động với callback URL sai, kết nối database sai hoặc tính năng email “có vẻ bật” nhưng không hoạt động. Fail ngay khi startup biến lỗi cấu hình thành lỗi triển khai rõ ràng, thay vì lỗi nghiệp vụ khó chẩn đoán sau khi người dùng đã truy cập.

### 8.3. Test và nghiệm thu

- Context test cho profile `prod` với bộ biến hợp lệ.
- Negative test lần lượt bỏ database URL, JWT signer, base URL, SMTP và OAuth credential đã bật.
- Production log không chứa secret.
- Startup command luôn truyền `SPRING_PROFILES_ACTIVE=prod` rõ ràng.
- Datasource production bật TLS theo yêu cầu provider; không giữ `allowPublicKeyRetrieval=true` nếu không cần.

---

## 9. Batch L3 — Đóng gói và dựng staging HTTPS

### 9.1. Artifact đề xuất

- Multi-stage `backend/Dockerfile`: build JAR bằng Maven, runtime Java 17 không chạy root.
- Multi-stage `frontend/Dockerfile`: build Vite, phục vụ bằng Nginx.
- `compose.staging.yml` hoặc manifest tương đương cho một VM.
- Nginx TLS config, SPA fallback, `/api` proxy và cấu hình SSE hiện có.
- Healthcheck container dựa trên readiness endpoint.
- Pin image version; không dùng `latest` cho deploy có kiểm soát.

### 9.2. Quy trình deploy

```text
Build immutable artifacts
→ backup database
→ chạy Flyway migration job một lần
→ xác minh migration
→ khởi động backend mới
→ readiness pass
→ khởi động/cập nhật frontend
→ smoke test
→ theo dõi error/latency
```

### 9.3. Vì sao cần staging HTTPS

`Secure` cookie, reverse-proxy headers, OAuth redirect URI, CSP và social SDK không thể được chứng minh đầy đủ trên `localhost`. Staging phải gần production về domain, TLS, Nginx và profile cấu hình; nếu staging chạy khác topology thì E2E xanh không còn là bằng chứng đáng tin.

### 9.4. Nghiệm thu

- HTTPS hợp lệ, HTTP redirect sang HTTPS.
- Cookie refresh có `HttpOnly`, `Secure`, `SameSite=Strict` và path/domain đúng.
- CSP ở chế độ enforce không chặn Google/Facebook/Cloudinary/API cần thiết.
- Deep-link `/quan/{id}/{slug}` trả SPA thay vì Nginx 404.
- SSE không bị buffering và tự kết nối lại theo hành vi dự kiến.
- Restart container không làm mất database hoặc media.

---

## 10. Batch L4 — Browser E2E trên staging

### 10.1. Công cụ và cấu trúc

Đề xuất Playwright vì hỗ trợ Chromium, Firefox, WebKit, multiple browser context, network interception và trace/video tốt. Đặt test riêng, ví dụ:

```text
frontend/e2e/
  auth-email.spec.js
  auth-social.spec.js
  session-revocation.spec.js
  store-deep-link.spec.js
  store-media-cancel.spec.js
  helpers/
```

E2E phải dùng API/SMTP/OAuth thật của môi trường staging ở mức có kiểm soát. Với email, dùng mailbox test riêng hoặc mail-capture service của staging. Với OAuth, dùng provider app/staging redirect URI riêng.

### 10.2. Ma trận bắt buộc

| Nhóm | Kịch bản | Kết quả bắt buộc |
|---|---|---|
| Email auth | Register → nhận email → verify → login → refresh → logout | Hoàn thành toàn chuỗi; refresh cũ không reuse được |
| Verification | Token sai/hết hạn/resend | UI tiếng Việt đúng; backend không báo success giả |
| Social | Google login mới/cũ, reload, mạng chậm | Nút bấm được; không kẹt ở “SDK đang khởi tạo” |
| Social | Facebook login mới/cũ | Callback và account-state đúng |
| Cookie | Reload khi access token chỉ ở memory | Session phục hồi qua refresh cookie |
| CSRF | Thiếu/sai CSRF header | Request thay đổi session bị từ chối |
| Multi-tab | Hai context cùng account, đổi/reset password | Token cũ ở context kia bị từ chối |
| Logout | Logout rồi gọi refresh/protected API | Không thể tái sử dụng session cũ |
| Deep-link | Mở trực tiếp, reload, back/forward, canonical URL | Đúng quán, không mất state, không 404 |
| Share | Copy/open URL trong anonymous context | Quán approved xem được; non-public không lộ |
| Media | Chọn ảnh mới rồi quay lại/hủy | DB giữ ảnh cũ; ảnh nháp được cleanup theo policy |
| Media | Lưu ảnh thành công | DB trỏ ảnh mới; ảnh cũ cleanup best-effort |

### 10.3. Trình duyệt và thiết bị

Gate tự động tối thiểu:

- Chromium desktop.
- WebKit desktop để bắt khác biệt gần Safari.
- Một viewport mobile Chrome và một viewport mobile WebKit.

Manual smoke trước public:

- Chrome Android thật.
- Safari iOS thật nếu có thiết bị.

Viewport emulation không thay thế hoàn toàn thiết bị thật vì cookie policy, OAuth popup và WebView có thể khác.

### 10.4. Ổn định social SDK mà không quay lại lazy load

Giữ script tĩnh trong `index.html`, nhưng dùng readiness signal thay vì chỉ đợi một timeout cố định:

```text
script onload/provider callback
→ set sdkReady
→ initialize đúng một lần
→ enable nút đăng nhập
```

Nếu script lỗi hoặc quá thời gian:

- Nút chuyển sang trạng thái retry rõ ràng.
- Hiển thị thông báo tiếng Việt.
- Không tạo nhiều iframe/client instance sau mỗi lần mở modal.

**Vì sao:** static loading đã ổn định hơn trong lịch sử dự án. Readiness signal chỉ loại bỏ race condition của tải mạng mà không táiintroduce dynamic script lifecycle từng gây regression.

### 10.5. Quản lý test data

- Mỗi run dùng email/identifier duy nhất.
- Có cleanup API hoặc cleanup job chỉ hoạt động trong staging.
- Không chạy test phá dữ liệu trên production.
- Trace/screenshot phải redact token, OTP và credential.
- Test social có thể tách thành nightly/manual gate nếu provider chống automation, nhưng phải có checklist manual bắt buộc.

### 10.6. Definition of Done

- [ ] Tất cả luồng auth/email/cookie pass trên Chromium.
- [ ] Các luồng trọng yếu pass trên WebKit.
- [ ] Multi-context revocation pass.
- [ ] Deep-link và upload/cancel pass.
- [ ] Google/Facebook được xác nhận trên fresh load, reload và mạng chậm.
- [ ] Có trace của failure nhưng không lưu secret.
- [ ] Có manual smoke trên ít nhất một thiết bị mobile thật trước public.

---

## 11. Batch L5 — Health, logging, metrics và alerting

### 11.1. Actuator

Thêm Spring Boot Actuator và chỉ expose tối thiểu:

```text
/actuator/health/liveness
/actuator/health/readiness
/actuator/prometheus   # chỉ khi có metrics scraper và được bảo vệ
```

- Liveness chỉ trả lời process có còn sống; không phụ thuộc SMTP/Cloudinary.
- Readiness bao gồm database và các dependency bắt buộc để nhận traffic.
- Không đưa OAuth/SMTP vào readiness nếu outage của chúng không nên làm toàn bộ website bị rút khỏi traffic; theo dõi chúng bằng metric riêng.
- Chi tiết health chỉ dành cho admin/internal network.

### 11.2. Correlation ID và structured log

Thêm servlet filter:

1. Nhận `X-Request-ID` nếu đúng format/độ dài, nếu không thì sinh UUID.
2. Đặt ID vào MDC.
3. Trả ID trong response header.
4. Clear MDC trong `finally` để không rò ID giữa thread.

Log tối thiểu:

- Timestamp UTC hoặc ISO-8601 có offset.
- Level, service/version, environment, request ID.
- Method, route template, status, duration.
- Exception class/error code cho 5xx.
- Không log raw request body mặc định.

### 11.3. Metrics và alert

Theo dõi:

- Availability/readiness.
- HTTP 5xx rate.
- p50/p95 response time.
- Hikari active/pending connection.
- JVM heap/GC/thread.
- Login/rate-limit rejection dạng aggregate, không gắn email plaintext.
- Email send success/failure/retry.
- Media cleanup queue failed/pending.
- Scheduler last-success timestamp.

Alert ban đầu:

- Readiness fail liên tục 2–5 phút.
- 5xx rate vượt ngưỡng trong cửa sổ 5 phút.
- Database connection pool chờ kết nối kéo dài.
- Backup không thành công trong 26 giờ.
- Email failure liên tiếp hoặc dead-letter tăng.
- Disk usage trên 80%.

### 11.4. Log rotation

- Ưu tiên stdout để runtime thu thập log.
- Nếu ghi file, giới hạn theo size và ngày; có tổng dung lượng retention.
- Không giữ log vô hạn trên VM.
- Không dùng DEBUG/SQL logging trong production thường xuyên.

### 11.5. Vì sao phân biệt liveness và readiness

Nếu database tạm mất kết nối, process Java vẫn sống nhưng chưa sẵn sàng nhận request. Dùng một endpoint cho cả hai có thể gây restart loop không cần thiết hoặc tiếp tục gửi traffic vào instance lỗi. Phân tách hai tín hiệu cho phép proxy/orchestrator phản ứng đúng.

### 11.6. Nghiệm thu

- Tắt database làm readiness fail nhưng endpoint không lộ connection string.
- Request ID xuất hiện ở response và mọi log liên quan.
- Gây lỗi 500 có metric/log đủ để truy vết nhưng client vẫn nhận response generic.
- Alert thử nghiệm được gửi tới kênh quản trị.
- Dashboard cho biết hệ thống khỏe hay không trong dưới một phút quan sát.

---

## 12. Batch L6 — Backup, restore, deploy và rollback

### 12.1. Chính sách tối thiểu

- Full logical backup MySQL mỗi ngày.
- Lưu encrypted backup ở object storage/off-host.
- Retention đề xuất: 7 bản ngày, 4 bản tuần, 3 bản tháng trong beta; điều chỉnh theo chi phí và yêu cầu dữ liệu.
- Snapshot VM hằng tuần chỉ là lớp phụ, không thay thế database backup.
- Ghi checksum và kiểm tra file backup không rỗng.
- Credential backup tách khỏi credential application và chỉ có quyền ghi/đọc cần thiết.

### 12.2. Restore rehearsal

```text
Chọn một backup thật gần nhất
→ restore sang MySQL tách biệt
→ chạy Flyway validate/migrate nếu cần
→ khởi động backend bằng database restore
→ smoke test user/store/rating/media reference
→ ghi RPO/RTO thực tế
→ hủy môi trường rehearsal an toàn
```

Thực hiện trước public và lặp lại định kỳ, ví dụ mỗi tháng hoặc sau thay đổi migration lớn.

### 12.3. Vì sao backup phải off-host và restore thử

Backup cùng ổ đĩa/VM sẽ mất cùng ứng dụng khi host hỏng hoặc bị xóa. File backup có thể tồn tại nhưng bị hỏng, thiếu quyền hoặc không tương thích. Chỉ một lần restore thành công mới chứng minh quy trình, credential và dữ liệu thực sự dùng được.

### 12.4. Runbook rollback

Runbook phải trả lời:

- Ai quyết định rollback?
- Artifact trước đó nằm ở đâu?
- Migration mới có backward-compatible không?
- Khi nào rollback app, khi nào forward-fix, khi nào restore database?
- Làm sao đưa site sang maintenance/read-only?
- Làm sao xác nhận không mất upload/email/job đang xử lý?

### 12.5. Nghiệm thu

- [ ] Backup tự động thành công và có alert khi thất bại.
- [ ] Backup không nằm duy nhất trên application VM.
- [ ] Restore rehearsal pass trên môi trường tách biệt.
- [ ] Ghi nhận RPO/RTO thực tế.
- [ ] Deploy phiên bản mới rồi rollback app version thành công.
- [ ] Có checklist sự cố database, SMTP, Cloudinary và OAuth.

---

## 13. Batch L7 — Email delivery reliability

### 13.1. Phân loại email

| Loại | Mức quan trọng | Yêu cầu |
|---|---:|---|
| Verify email | Critical onboarding | Không được báo “đã gửi” nếu chưa có trạng thái xử lý đáng tin |
| Password reset OTP | Critical security | Retry hữu hạn, expiry đúng, không log OTP |
| Disable/enable account | High | Có audit và delivery status |
| Store approved/rejected/hidden | Medium–High | Không làm rollback nghiệp vụ chỉ vì SMTP tạm lỗi; phải retry/quan sát được |

### 13.2. Hai mức triển khai

#### Mức A — Observable retry cho closed beta nhỏ

- Thay `@Async void` bằng một abstraction trả kết quả/trạng thái quan sát được.
- Timeout SMTP rõ ràng.
- Retry hữu hạn với exponential backoff và jitter cho lỗi tạm thời.
- Không retry lỗi permanent như địa chỉ không hợp lệ.
- Metric/log theo template và outcome, không log content/token.

Mức A phù hợp nếu API vẫn chờ email quan trọng hoặc chấp nhận semantics “request accepted” và volume rất thấp.

#### Mức B — Transactional outbox cho durable delivery

Tạo bảng outbox bằng Flyway, ví dụ:

```text
email_outbox
- id
- event_type
- recipient
- template_key
- payload_encrypted_or_minimized
- status: PENDING | PROCESSING | SENT | FAILED
- attempt_count
- next_attempt_at
- created_at
- sent_at
- last_error_code
- idempotency_key UNIQUE
```

Luồng:

```text
Transaction nghiệp vụ
→ ghi thay đổi domain + outbox event
→ commit
→ worker claim batch
→ gửi SMTP
→ SENT hoặc schedule retry
→ quá giới hạn chuyển FAILED/dead-letter và alert
```

### 13.3. Khi nào bắt buộc chọn outbox

Chọn Mức B trước public nếu sản phẩm cam kết email verify/reset chắc chắn được xử lý ngay cả khi backend restart hoặc SMTP outage. Nếu closed beta nhỏ và email hiện đang được chờ đồng bộ với outcome trung thực, có thể bắt đầu Mức A rồi nâng cấp dựa trên failure metric.

### 13.4. Vì sao outbox giải quyết được khoảng trống transaction

Gọi SMTP và ghi database không thể nằm trong một ACID transaction chung. Nếu commit database rồi process chết trước khi gửi, email mất; nếu gửi trước rồi database rollback, người dùng nhận email không còn hợp lệ. Outbox ghi “ý định gửi” cùng transaction database, sau đó worker gửi độc lập và retry idempotent.

### 13.5. Quy tắc bảo mật

- Không lưu plaintext OTP lâu hơn cần thiết.
- Verification/reset payload phải có retention và encryption/minimization phù hợp.
- Không log URL chứa token.
- Worker claim record an toàn khi có nhiều thread; hiện tại vẫn chỉ một instance nhưng thiết kế không tạo duplicate mail.
- Cleanup `SENT/FAILED` theo retention.

### 13.6. Test và nghiệm thu

- SMTP timeout, 4xx permanent và 5xx transient.
- Backend restart sau commit nhưng trước send.
- Retry không gửi trùng quá policy.
- Expired OTP/link không được gửi muộn như một credential còn hiệu lực.
- Metric thể hiện pending, sent, failed, retry.
- Admin có cách phát hiện và xử lý dead-letter mà không đọc secret.

---

## 14. Single-instance guardrail và đường scale

### 14.1. Giới hạn trong beta

- Cấu hình deployment replica bằng `1` và ghi rõ trong runbook.
- Giới hạn tổng SSE connection và connection theo IP/user.
- Gửi heartbeat để proxy/client phát hiện connection chết.
- Theo dõi emitter count và cleanup onCompletion/onTimeout/onError.
- Không dùng sticky session như một cách che giấu state không phân tán.

### 14.2. Trigger để scale ngang

Chỉ xem xét instance thứ hai khi có ít nhất một dấu hiệu:

- CPU/RAM/latency đã được đo và một instance không đáp ứng SLO dù đã tối ưu hợp lý.
- Cần zero-downtime deploy thực sự.
- Availability requirement không chấp nhận single point of failure.
- Concurrent SSE vượt giới hạn an toàn của một instance.

Trước khi tăng replica:

- Rate limit/cache chuyển sang Redis hoặc storage dùng chung.
- SSE event dùng Redis Pub/Sub, broker hoặc thay bằng polling/version protocol.
- Scheduled job có distributed lock hoặc tách worker singleton.
- Outbox worker có atomic claim/locking.
- Session/token semantics không phụ thuộc memory local.

### 14.3. Vì sao chưa thêm Redis ngay

Redis tạo thêm network dependency, credential, backup/HA và chi phí vận hành. Ở quy mô beta, một instance có thể đơn giản và đáng tin hơn. Redis chỉ giải quyết đúng vấn đề khi hệ thống thực sự cần shared state hoặc scale ngang.

---

## 15. Các cải tiến sau khi beta ổn định

### 15.1. Privacy, Terms và hỗ trợ

Tạo các trang:

- Chính sách quyền riêng tư.
- Điều khoản sử dụng.
- Liên hệ/hỗ trợ và báo cáo nội dung.
- Cách yêu cầu xóa tài khoản/dữ liệu.
- Thông tin dữ liệu lấy từ Google/Facebook và cách thu hồi quyền.

**Vì sao:** social login và nội dung do người dùng tạo cần minh bạch về dữ liệu, moderation và quyền xóa. Đây cũng thường là yêu cầu khi cấu hình OAuth production.

### 15.2. Frontend quality và performance

- Đổi `<html lang="en">` thành `vi`.
- Giảm kích thước logo khoảng 667 KB, sinh các kích thước phù hợp và dùng responsive image nếu cần.
- Xử lý warning React hook trước các refactor lớn.
- Chạy Lighthouse trên mobile: LCP, CLS, INP, accessibility.
- Không biến tất cả warning thành một commit khổng lồ; ưu tiên warning có khả năng gây stale closure hoặc render loop.

**Vì sao:** ảnh lớn làm chậm first load trên mạng di động; hook dependency sai có thể tạo lỗi state khó tái hiện. `lang="vi"` giúp screen reader và search engine hiểu đúng ngôn ngữ.

### 15.3. SEO và share preview

- Canonical URL ổn định cho quán.
- Dynamic sitemap chỉ chứa quán `APPROVED`.
- Server/edge-rendered Open Graph metadata cho crawler không chạy JavaScript.
- `robots.txt`, title/description riêng, ảnh share fallback.
- Không index admin/profile/quán non-public.

**Vì sao:** runtime DOM metadata trong SPA thường không đủ cho bot mạng xã hội hoặc crawler không thực thi JavaScript đầy đủ. Prerender/edge metadata cho route quán có thể hoàn thành mục tiêu mà chưa phải chuyển framework toàn bộ.

### 15.4. Geo query khi dữ liệu tăng

Hiện lọc khoảng cách vẫn lấy tập store rồi tính trong Java. Đặt trigger tối ưu, ví dụ:

- Số quán approved vượt 5.000; hoặc
- p95 `/stores?radiusKm=...` vượt SLO; hoặc
- query kéo lượng record đáng kể trên mỗi request.

Khi trigger xảy ra:

1. Dùng bounding box để giảm candidate.
2. Tính chính xác bằng `ST_Distance_Sphere` hoặc công thức SQL được test.
3. Đưa filter/sort/pagination hoàn toàn xuống database.
4. Dùng `EXPLAIN ANALYZE` và index phù hợp.
5. So sánh kết quả tại ranh giới bán kính và tọa độ cực trị.

**Vì sao:** tối ưu sớm làm tăng độ phức tạp SQL; tối ưu sau khi có ngưỡng và query plan biến quyết định thành việc dựa trên số liệu. Tuy vậy, pagination chỉ đúng ở quy mô lớn khi filtering/sorting được thực hiện trước limit tại database.

### 15.5. Analytics tôn trọng quyền riêng tư

Theo dõi aggregate event:

- Registration started/completed.
- Email verification completed.
- Store detail viewed.
- Direction link clicked.
- Save/rating completed.
- Store submission started/completed.
- Error/drop-off theo bước.

Không gửi password, token, email đầy đủ, map URL cá nhân hoặc nội dung form vào analytics. Cần consent/cookie policy nếu công cụ và khu vực pháp lý yêu cầu.

**Vì sao:** analytics nên trả lời “người dùng bỏ cuộc ở đâu” để ưu tiên sản phẩm, không trở thành kho dữ liệu cá nhân mới.

### 15.6. Dữ liệu và vận hành cộng đồng

- Chuẩn bị một tập quán approved có ảnh, địa chỉ, giờ mở cửa và menu đáng tin cậy.
- Định nghĩa SLA moderation và cách xử lý report.
- Có hướng dẫn chụp ảnh/đăng quán và tiêu chí từ chối rõ ràng.
- Theo dõi tỷ lệ quán thiếu tọa độ, ảnh hỏng, giờ mở cửa lỗi thời.

**Vì sao:** marketplace/local discovery rỗng hoặc dữ liệu kém sẽ không giữ người dùng dù kỹ thuật ổn định. Chất lượng nội dung ban đầu là một phần của product readiness.

---

## 16. Test pyramid và release gates

### 16.1. Automated checks trên mỗi pull request

```text
Backend unit/integration tests
Frontend utility/component tests
Frontend lint
Frontend production build
Flyway clean-schema test trên MySQL Testcontainers
Security/config smoke tests
```

### 16.2. Checks khi deploy staging

```text
Migration rehearsal
Backend readiness
API smoke
Playwright Chromium suite
Cookie/CSP/header assertions
OAuth/email controlled tests
```

### 16.3. Checks trước production

```text
Backup verified
Restore rehearsal evidence current
WebKit/mobile smoke
Google/Facebook manual smoke
Deploy and rollback rehearsal
Alert delivery test
Known issue review and explicit go/no-go
```

### 16.4. Go/no-go criteria

Không public nếu còn một trong các điều kiện:

- Migration không tái tạo được schema hoặc chưa thử trên bản sao.
- Refresh/logout/revoke session E2E thất bại.
- OAuth provider chính không login được trên HTTPS domain.
- Không có backup off-host hoặc restore chưa từng pass.
- Readiness/alert không phát hiện được database/backend outage.
- Production vẫn có thể khởi động với localhost/default secret.
- Có lỗi làm upload hủy nhưng database/media vẫn thay đổi trái ý người dùng.
- Có Critical/High issue đã xác nhận nhưng chưa có mitigation được chấp thuận.

---

## 17. Kế hoạch commit đề xuất

Mỗi nhóm dưới đây là một hoặc vài commit độc lập, không gộp migration với thay đổi sản phẩm không liên quan:

1. `docs: define production environment and deployment contract`
2. `build: integrate flyway database migrations`
3. `test: validate mysql migrations with testcontainers`
4. `fix: enforce production configuration validation`
5. `feat: expose secure application health probes`
6. `feat: add request correlation and operational metrics`
7. `build: add reproducible staging deployment artifacts`
8. `test: add browser e2e coverage for critical user flows`
9. `feat: make email delivery observable and retryable`
10. `docs: add backup restore and rollback runbooks`
11. `perf: optimize frontend launch assets`
12. `docs: add privacy terms and support policies`

Migration SQL phải nằm cùng commit với entity/repository sử dụng schema đó hoặc được merge trước trong một commit tương thích ngược.

---

## 18. Thứ tự triển khai thực tế đề xuất

### Phase A — Làm được ngay khi chưa mua hosting

1. L0: environment contract và topology.
2. L1: Flyway baseline + Testcontainers.
3. L2: production fail-fast config.
4. L5: Actuator, correlation ID, metrics cơ bản.
5. Tạo Playwright framework và các test không phụ thuộc OAuth thật.
6. Viết backup/restore/deploy/rollback runbook.
7. Chọn Email Mức A hay Mức B bằng SLA rõ ràng.

### Phase B — Khi có staging/domain

1. L3: deploy staging cùng topology dự kiến.
2. Chạy migration từ empty database và snapshot rehearsal.
3. L4: chạy full HTTPS/OAuth/cookie/mobile E2E.
4. L6: backup và restore rehearsal.
5. Kích hoạt uptime monitoring và test alert.
6. Sửa mọi lỗi release-blocking rồi chạy lại toàn bộ gate.

### Phase C — Sau closed beta

1. Thu thập metric thật trong ít nhất vài tuần.
2. Hoàn thiện legal/support/SEO/performance.
3. Tối ưu geo query khi chạm trigger.
4. Chỉ thêm Redis/distributed SSE khi cần instance thứ hai.
5. Nâng email lên outbox nếu failure/SLA yêu cầu và chưa làm ở Phase A.

---

## 19. Bảng theo dõi nghiệm thu

| ID | Hạng mục | Local | Staging | Production gate | Bằng chứng cần lưu |
|---|---|---:|---:|---:|---|
| L0 | Environment contract | Bắt buộc | Xác nhận | Bắt buộc | Env matrix + network diagram |
| L1 | Flyway/Testcontainers | Bắt buộc | Rehearsal | Bắt buộc | CI logs + schema checksum |
| L2 | Config fail-fast | Bắt buộc | Negative test | Bắt buộc | Startup test logs |
| L3 | Packaging/HTTPS | Có thể build | Bắt buộc | Bắt buộc | Image digest + TLS/header test |
| L4 | Browser E2E | Partial | Bắt buộc | Bắt buộc | Report/trace đã redact |
| L5 | Health/metrics/alerts | Bắt buộc | Bắt buộc | Bắt buộc | Dashboard + alert test |
| L6 | Backup/restore | Runbook | Bắt buộc | Bắt buộc | Restore log + RPO/RTO |
| L7 | Email reliability | Bắt buộc | Failure test | Theo SLA | Delivery/retry metrics |
| L8 | Product improvements | Từng phần | Từng phần | Không chặn beta trừ legal bắt buộc | Lighthouse/SEO/content review |
| L9 | Distributed scale | Không làm | Không làm mặc định | Chỉ theo trigger | Load test + ADR |

---

## 20. Definition of Done toàn blueprint

- [ ] Flyway là nguồn migration runtime duy nhất; schema rỗng dựng được.
- [ ] MySQL Testcontainers xác minh migration và concurrency trọng yếu.
- [ ] Production profile fail-fast khi thiếu biến bắt buộc.
- [ ] Staging chạy HTTPS, same-origin Nginx và một backend instance.
- [ ] Email auth, Google/Facebook, refresh/logout/revocation pass E2E.
- [ ] Deep-link và media cancel/save pass E2E.
- [ ] Liveness/readiness, request ID, metric và alert hoạt động.
- [ ] Backup off-host chạy tự động và restore rehearsal thành công.
- [ ] Có deploy/rollback/incident runbook đã được diễn tập.
- [ ] Email critical có outcome trung thực và retry/visibility theo SLA đã chọn.
- [ ] Single-instance limitation được enforce/document; chưa scale ngang trước khi externalize shared state.
- [ ] Privacy/Terms/support/data-deletion có trước khi mở public rộng.
- [ ] Không còn release blocker Critical/High chưa có quyết định xử lý.

---

## 21. Kết luận quyết định

Thứ tự của blueprint ưu tiên **khả năng tái tạo, phát hiện lỗi và phục hồi** trước khi thêm hạ tầng scale:

1. Flyway làm database tái tạo được.
2. Fail-fast làm cấu hình sai bị phát hiện trước khi nhận traffic.
3. Staging HTTPS làm các giả định cookie/OAuth/CSP kiểm chứng được.
4. E2E chứng minh hành vi người dùng thật thay vì chỉ chứng minh từng class riêng lẻ.
5. Health/metrics/alert giúp phát hiện sự cố.
6. Backup/restore/rollback giúp phục hồi khi sự cố xảy ra.
7. Email retry/outbox khép khoảng trống giữa database transaction và SMTP.
8. Chỉ sau đó mới tối ưu SEO, geo query và scale ngang dựa trên dữ liệu thật.

Cách làm này phù hợp với trạng thái hiện tại của CG FoodTour: sản phẩm đã đủ chức năng để chuẩn bị closed beta, nhưng cần hoàn thiện đường triển khai và vận hành trước khi phụ thuộc vào người dùng thật.
