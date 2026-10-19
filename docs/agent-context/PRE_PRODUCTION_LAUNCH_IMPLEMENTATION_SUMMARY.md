# CG FoodTour — Pre-production Launch Implementation Summary

> Ngày thực hiện: 19/10/2026
> Blueprint: `PRE_PRODUCTION_LAUNCH_BLUEPRINT.md`
> Trạng thái: **PHASE A ĐÃ TRIỂN KHAI TRONG SOURCE — CÒN RELEASE GATE CẦN DOCKER/MYSQL VÀ STAGING HTTPS**

## 1. Kết luận

Đợt này đã chuyển các đề xuất pre-production quan trọng thành code, test harness và runbook có thể sử dụng. Dự án hiện có:

- Schema Flyway tái tạo database mới.
- Production configuration fail-fast.
- Health/readiness, Prometheus và request correlation.
- Email retry hữu hạn có metric.
- Giới hạn và heartbeat cho SSE single-instance.
- Docker artifact và môi trường rehearsal MySQL/Mailpit.
- Playwright E2E framework cho desktop/mobile.
- CI chạy backend, migration MySQL, frontend test/build/lint/audit.
- Backup, restore, deploy, rollback và incident runbook.

Không có tuyên bố giả rằng production đã sẵn sàng hoàn toàn. Máy kiểm thử hiện không chạy Docker daemon và chưa có domain/staging/credential provider thật, nên migration MySQL, OAuth, secure cookie HTTPS, backup restore và mobile smoke vẫn là release gate mở.

---

## 2. Các điểm đã cải thiện

### 2.1. Database migration có nguồn chuẩn

#### Trước thay đổi

- Production dùng `ddl-auto=validate` nhưng không có migration runtime.
- SQL lịch sử nằm trong `backend/documents/migrations`.
- Hai migration cũ dùng không nhất quán tên bảng `store` và `stores`.
- Database rỗng không thể được dựng tự động từ repository.

#### Cách cải thiện

- Thêm `flyway-core` và `flyway-mysql`.
- Tạo baseline hợp nhất tại `backend/src/main/resources/db/migration/V1__baseline_schema.sql` theo JPA mapping hiện tại.
- Flyway chỉ bật trong `prod` và `rehearsal`; dev hiện hữu chưa bị tự động baseline.
- Production giữ `ddl-auto=validate`, `validate-on-migrate=true`, `clean-disabled=true` và `baseline-on-migrate=false`.
- Thêm `FlywayMigrationTest` dùng MySQL 8.4 Testcontainers để kiểm tra clean bootstrap, checksum, bảng và index quan trọng.
- Thêm `ops/sql/schema_inventory.sql` để so sánh schema hiện hữu với schema Flyway trước baseline.
- CI backend sẽ chạy Testcontainers trên GitHub runner có Docker.

#### Kết quả

Schema đã có nguồn chuẩn trong source. Rủi ro “quên chạy file SQL” được thay bằng migration có version/checksum. Existing database vẫn phải được diff trên bản restore trước khi đánh dấu baseline V1.

### 2.2. Production configuration fail-fast

#### Trước thay đổi

`application-prod.yaml` có thể fallback về datasource/base URL localhost, SMTP/OAuth/Cloudinary rỗng và tái sử dụng JWT secret làm OTP/registration pepper.

#### Cách cải thiện

- Bỏ fallback localhost/rỗng khỏi property production quan trọng.
- Thêm `ProductionConfigurationValidator` chỉ hoạt động ở profile `prod`.
- Validator kiểm tra property bắt buộc, placeholder `CHANGE_ME`/`YOUR_`, MySQL URL, localhost, `useSSL=false`, HTTPS base URL/CORS, độ dài HS512 key và secret pepper độc lập.
- Cập nhật `.env.production.example` với TLS datasource, trusted proxy, SSE và email retry variables.

#### Kết quả

Cấu hình sai bị chặn khi startup thay vì xuất hiện dưới dạng lỗi người dùng sau deploy. Có 4 test validator pass, bao gồm negative case cho localhost, placeholder, missing secret, HTTP URL và secret reuse.

### 2.3. Health, readiness, metrics và correlation ID

#### Trước thay đổi

- Không có Actuator probe.
- Không có request ID xuyên response/log.
- Không có Prometheus registry.

#### Cách cải thiện

- Thêm Spring Boot Actuator và Prometheus registry.
- Public tối thiểu `/actuator/health` và `/actuator/health/**`; Prometheus/metrics yêu cầu quyền ADMIN.
- Khai báo rõ:
  - Liveness: `livenessState`.
  - Readiness: `readinessState,db`.
- Health không trả component detail cho client công khai.
- Thêm `RequestCorrelationFilter`:
  - Chấp nhận `X-Request-ID` an toàn tối đa 100 ký tự.
  - Thay ID chứa CR/LF/ký tự lạ bằng UUID.
  - Đưa ID vào MDC và response.
  - Clear MDC trong `finally`.
- Production console log chứa service/environment/request ID.
- CORS expose `X-Request-ID` cho frontend/support.

#### Kết quả

Integration test chứng minh readiness public trả `UP`, không lộ `components`, giữ request ID; Prometheus không cho anonymous truy cập. Test ban đầu đã bắt được readiness 404 do test config che main config; sau khi khai báo health group rõ ràng, test pass.

### 2.4. Email delivery có retry và quan sát được

#### Trước thay đổi

- Email trạng thái quán dùng `@Async void`.
- Process có thể trả success trước khi thao tác SMTP hoàn tất.
- Không có bounded retry hoặc metric outcome.

#### Cách cải thiện

- Bỏ `@Async` khỏi email trạng thái quán.
- Tất cả thao tác `mailSender.send` dùng retry hữu hạn, mặc định 3 lần.
- Delay dùng exponential backoff có giới hạn số lần dịch bit.
- Ghi metric `cgfoodtour.email.delivery` với tag template/outcome `sent`, `retry`, `failed`.
- Verification và OTP tiếp tục fail thật bằng `EMAIL_SEND_FAILED` sau khi hết retry.
- Email account/store được gọi sau database commit, retry đồng bộ nhưng failure không rollback hành động quản trị đã commit.
- Không log recipient, OTP, token hoặc verification URL.

#### Kết quả

Hai test mới chứng minh lỗi SMTP tạm thời được retry rồi thành công, và email critical thất bại trung thực sau đúng 3 lần. Đây là **Mức A — observable bounded retry**, chưa phải transactional outbox.

### 2.5. SSE single-instance guardrail

#### Trước thay đổi

- Danh sách emitter in-memory không có giới hạn.
- Không có heartbeat/connection metric.

#### Cách cải thiện

- Giới hạn tổng SSE connection, mặc định production 200.
- Vượt giới hạn trả HTTP 429.
- Heartbeat mặc định mỗi 30 giây.
- Gauge `cgfoodtour.sse.connections` thể hiện connection đang mở.
- Không log payload broadcast.
- Cleanup emitter khi complete, timeout, error hoặc send failure.

#### Kết quả

Hai test mới xác nhận connection cap và heartbeat rỗng an toàn. Deployment vẫn được giới hạn một backend instance cho tới khi externalize state.

### 2.6. Social SDK ổn định nhưng không quay lại lazy loading

#### Trước thay đổi

- Google/Facebook SDK tải tĩnh, nhưng Google chỉ được kiểm tra một lần sau timeout cố định 150 ms.
- Mạng chậm có thể khiến SDK chưa sẵn sàng và nút không được render.

#### Cách cải thiện

- Tiếp tục tải script tĩnh từ `index.html` đúng quyết định ổn định hiện tại.
- Thêm ID cố định cho hai script.
- Dùng `load` event kết hợp readiness polling hữu hạn 5 giây.
- Google button chỉ render khi `window.google.accounts.id` sẵn sàng.
- Facebook chỉ `FB.init` đúng một lần.
- Nút thể hiện trạng thái chưa sẵn sàng bằng `aria-disabled` và opacity.
- Xóa child SDK cũ trước khi render lại để tránh iframe trùng.
- Đổi ngôn ngữ tài liệu HTML từ `en` sang `vi`.

#### Kết quả

Frontend production build pass và lint không phát sinh error mới. Playwright có test xác nhận script singleton, SDK readiness và reload; runtime provider test chờ staging có Internet/CSP/OAuth configuration thật.

### 2.7. Browser E2E framework

#### Cách cải thiện

- Thêm `@playwright/test` và cấu hình 4 project:
  - Chromium desktop.
  - WebKit desktop.
  - Mobile Chrome.
  - Mobile WebKit.
- Có 24 test case được discovery từ 4 spec:
  - Launch/health/correlation smoke.
  - Static social SDK readiness/singleton.
  - Canonical store deep-link/reload.
  - Register → Mailpit verification → login → refresh rotation → reject old refresh → logout → reject refresh after logout.
- Trace, screenshot và video chỉ giữ khi failure.
- Data-dependent test dùng environment variables, không commit account/token/cookie.

#### Kết quả

Playwright discovery pass: **24 tests / 4 browser profiles / 4 files**. Chưa chạy browser runtime vì không có rehearsal server/staging và browser binary trong môi trường hiện tại.

### 2.8. Reproducible packaging và rehearsal

#### Cách cải thiện

- Thêm multi-stage backend Dockerfile, runtime Java 17 chạy bằng non-root user.
- Thêm multi-stage frontend Dockerfile với Nginx unprivileged port 8080.
- Thêm `compose.rehearsal.yml` gồm MySQL 8.4, Mailpit, backend và frontend.
- Thêm profile `rehearsal` bật Flyway + Hibernate validate nhưng không giả vờ có HTTPS secure cookie.
- Database chỉ nằm trong internal network; Mailpit/frontend bind loopback.
- Backend container có readiness healthcheck.
- Thêm `rehearsal.env.example`, không có secret thật.

#### Kết quả

`docker compose ... config --quiet` pass. Chưa build/start container vì Docker daemon trên máy đang tắt.

### 2.9. Backup, restore và runbook vận hành

#### Cách cải thiện

- Thêm deployment/rollback runbook.
- Thêm backup/restore rehearsal runbook.
- Thêm incident runbook cho database, SMTP, OAuth và Cloudinary.
- Backup script:
  - Yêu cầu biến môi trường rõ ràng.
  - Chỉ nhận thư mục tuyệt đối và từ chối `/`.
  - Dùng `mysqldump --single-transaction`.
  - Nén, kiểm tra file không rỗng và tạo SHA-256 checksum.
- Restore script:
  - Yêu cầu đường dẫn tuyệt đối.
  - Kiểm tra checksum nếu có.
  - Bắt buộc `CONFIRM_RESTORE` khớp chính xác database đích.

#### Kết quả

Repository đã có quy trình có thể lặp lại thay cho thao tác nhớ tay. Backup off-host và restore thật chưa thể xác nhận khi chưa có server/database mục tiêu.

### 2.10. CI quality gate

#### Cách cải thiện

Thêm `.github/workflows/ci.yml`:

- Backend Java 17, Maven test và MySQL Testcontainers.
- Frontend Node 22, install bằng lockfile, lint, 8 utility test, production build, npm audit.
- Playwright test discovery để ngăn spec/config bị hỏng cú pháp.
- Cancel run cũ cùng branch/ref.

#### Kết quả

Local commands tương ứng đã pass trừ MySQL Testcontainers bị skip vì Docker daemon không chạy. Workflow chưa có remote CI run cho tới khi push repository.

---

## 3. Kết quả kiểm thử ngày 19/10/2026

| Kiểm tra | Kết quả | Ghi chú |
|---|---:|---|
| Backend Maven test | PASS | 76 discovered; 74 pass; 0 failure; 0 error; 2 skip |
| Flyway MySQL Testcontainers | SKIPPED | Hai test migration + Hibernate validate bị skip vì Docker daemon không chạy; CI đã cấu hình để chạy |
| Production config validator | PASS | 4 test |
| Health/security integration | PASS | Readiness minimal + Prometheus unauthenticated rejection |
| Request correlation | PASS | Safe ID preserved, unsafe ID replaced, MDC cleared |
| Email retry/metrics | PASS | 2 test |
| SSE guardrail | PASS | 2 test |
| Frontend production build | PASS | 1.841 module; main JS gzip khoảng 106,94 KB |
| Frontend utility tests | PASS | 8/8 |
| Frontend lint | PASS WITH WARNINGS | 0 error, 57 warning tồn tại |
| Playwright discovery | PASS | 24 test trên 4 project |
| Playwright runtime E2E | NOT RUN | Cần server/browser/staging |
| npm audit | PASS | 0 vulnerability sau khi lockfile lấy `source-map-js` đã vá |
| Docker Compose validation | PASS | `config --quiet` pass |
| Docker image build/start | NOT RUN | Docker daemon không chạy |
| Git whitespace check | PASS | Chỉ có cảnh báo line-ending LF/CRLF hiện hữu |

Các stack trace xuất hiện trong backend test là failure được chủ ý mô phỏng cho global exception handling, Cloudinary cleanup và SMTP retry; test suite cuối cùng không có failure/error.

---

## 4. Release gate chưa thể đóng ở local

### P0 — Trước closed beta/public

1. Bật Docker và chạy `FlywayMigrationTest` thật trên MySQL 8.4.
2. Dựng `compose.rehearsal.yml`, xác nhận Flyway → Hibernate validate → readiness.
3. Restore bản sao database local hiện tại, chạy schema inventory diff rồi mới baseline V1.
4. Dựng domain staging HTTPS với topology Nginx/same-origin.
5. Chạy Playwright runtime, đặc biệt auth session, secure cookie, deep-link và social SDK.
6. Manual Google/Facebook login với redirect URI production-like.
7. Thử Chrome Android và Safari iOS thật.
8. Tạo backup ngoài host và hoàn thành ít nhất một restore rehearsal.
9. Kết nối uptime/metric alert tới kênh người quản trị thực tế.

### P1 — Trước public rộng

1. Viết và duyệt Privacy Policy, Terms, support/contact và data-deletion page với thông tin pháp lý thật.
2. Tối ưu logo 667,30 KB và đo Lighthouse mobile.
3. Xử lý 57 lint warning, ưu tiên hook dependency/set-state-in-effect trước unused import.
4. Hoàn thiện server/edge-rendered Open Graph metadata và dynamic sitemap.
5. Thiết lập tập dữ liệu quán ban đầu và moderation SLA.

### Theo trigger tải/SLA

- Chuyển geo filtering/sorting sang MySQL khi số quán hoặc p95 chạm ngưỡng đã định.
- Thêm Redis/distributed event khi cần backend replica thứ hai.
- Nâng email từ bounded retry lên transactional outbox khi cần durable-delivery guarantee hoặc metric failure cho thấy Mức A chưa đủ.

---

## 5. Quyết định email trong lần triển khai này

Đã chọn **Mức A — synchronous observable bounded retry** thay vì tạo outbox ngay.

Lý do:

- Hệ thống hiện vẫn single-instance và volume beta nhỏ.
- Verification/OTP hiện có semantics chờ gửi và trả failure trung thực.
- Admin/store email được gọi sau commit nên SMTP failure không báo sai rằng hành động quản trị chưa xảy ra.
- Retry/metric giải quyết khoảng trống quan sát trước mắt với độ phức tạp thấp hơn.

Giới hạn còn lại: process chết sau domain commit nhưng trước khi gửi email best-effort vẫn có thể làm mất notification. Khi sản phẩm cam kết delivery bền vững, transactional outbox là bước nâng cấp bắt buộc.

---

## 6. Cách chạy lại kiểm thử

### Backend

```powershell
cd backend
mvn.cmd test
```

Docker daemon phải chạy để `FlywayMigrationTest` không bị skip.

### Frontend

```powershell
cd frontend
npm.cmd run lint
npm.cmd run test:redaction
npm.cmd run test:ui-errors
npm.cmd run test:maps
npm.cmd run test:store-url
npm.cmd run build
npx.cmd playwright test --list
```

### Rehearsal

```powershell
Copy-Item rehearsal.env.example rehearsal.env
# Thay toàn bộ CHANGE_ME trước khi chạy.
docker compose --env-file rehearsal.env -f compose.rehearsal.yml up --build
```

Sau khi hệ thống healthy:

```powershell
cd frontend
$env:E2E_BASE_URL='http://127.0.0.1:8081'
$env:E2E_MAILPIT_URL='http://127.0.0.1:8025'
npx.cmd playwright install chromium webkit
npm.cmd run test:e2e
```

HTTPS staging phải thay `E2E_BASE_URL` bằng domain thật và không dùng rehearsal secure-cookie settings.

---

## 7. Trạng thái sản phẩm sau thay đổi

Source code hiện ở mức **pre-production candidate cho closed beta** tốt hơn đáng kể: có migration ownership, fail-fast config, health/metrics, correlation, delivery retry, capacity guardrail, artifact triển khai, E2E harness và recovery runbook.

Điểm chưa được chứng minh không nằm ở logic local nữa mà nằm ở môi trường thực: MySQL container/live schema, HTTPS cookie/OAuth/CSP, provider delivery, backup restore, monitoring alert và thiết bị mobile. Chỉ sau khi các release gate P0 phía trên có bằng chứng pass mới nên gọi bản build là ready để public Internet.
