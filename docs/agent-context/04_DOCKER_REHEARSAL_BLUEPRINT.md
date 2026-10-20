# Blueprint 04 — Local Docker Rehearsal

> Trạng thái: COMPLETED — hoàn thành ngày 20/10/2026
>
> Ưu tiên: P0 release gate
>
> Phạm vi duy nhất: chạy toàn bộ topology gần production trên máy local

## 1. Mục tiêu

Chứng minh backend, frontend, MySQL, Flyway, Mailpit, Nginx và healthcheck có thể hoạt động cùng nhau từ clean state bằng Docker Compose.

## 2. Điều kiện đầu vào

- Blueprint 01–03 đã hoàn tất.
- Docker Desktop/Engine và Compose hoạt động.
- `rehearsal.env` chỉ dùng secret test, đã được Git ignore và không được commit.
- Upload local dùng adapter chỉ kích hoạt bởi profile `rehearsal`; staging/production vẫn dùng Cloudinary thật.

Lý do dùng image storage riêng cho rehearsal: local smoke test cần kiểm tra validation, transaction, thay ảnh và cleanup queue nhưng không nên phụ thuộc credential hay quota Cloudinary thật. Profile tách biệt bảo đảm adapter này không thể thay Cloudinary ở môi trường khác.

## 3. Kịch bản và kết quả

### R1. Kiểm tra cấu hình tĩnh — PASS

- `docker compose ... config --quiet`: pass.
- Backend và frontend đều build thành công; backend cũng đã build no-cache từ clean dependency state.
- Backend chạy UID `10001`; frontend chạy UID `101`.
- Backend image: `158,231,667` bytes, digest `sha256:9f54296a35e26ea093f4c6b5e97112a0b3c1bd47a279cb787454858aef583161`.
- Frontend image: `22,541,673` bytes, digest `sha256:e219a0ae9f3cc0ca8bb9c46eb914ca009363b83005beaae5fa9168680fcdd147`.

### R2. Greenfield startup — PASS

- Dùng volume riêng của project `cgfoodtour-rehearsal`; không chạm container MySQL local khác.
- MySQL được cố định ở dòng `8.0`, tương thích với phạm vi Flyway đang dùng.
- Flyway áp dụng đúng `V1__baseline_schema.sql`; Hibernate `ddl-auto=validate` khởi động thành công.
- Readiness và liveness trả `UP` nhưng không lộ component/details.
- Nginx proxy `/api`, CSP và SPA fallback cho deep-link đều pass.

### R3. Functional smoke — PASS

- Auth E2E pass toàn chuỗi: đăng ký → Mailpit nhận email → verify → login → refresh rotation → token cũ bị từ chối → logout → refresh sau logout bị từ chối.
- Store E2E pass: đăng nhập admin rehearsal → tạo category → tạo quán `PENDING` → upload và thay banner → sửa quán → approve → đọc public API → mở `/quan/{id}/...` → reload.
- Toàn bộ Chromium suite: **7/7 test pass**, không còn test bị skip khi cung cấp dữ liệu rehearsal.
- Unit test `ManagedImageServiceTest` và `MediaCleanupQueueServiceTest`: pass trong Docker build-stage.
- Social SDK local chỉ kiểm tra script tĩnh/singleton. OAuth provider thật thuộc Blueprint 07 vì cần domain HTTPS và credential/provider console thật.

### R4. Restart và persistence — PASS

- Đã restart tuần tự MySQL, backend và frontend.
- Dữ liệu quán vẫn tồn tại sau restart.
- `flyway_schema_history` vẫn chỉ có một migration thành công.
- Log restart xác nhận schema ở version `1` và `Schema ... is up to date. No migration necessary.`
- Backend/frontend hồi phục và readiness trở lại `UP`.

### R5. Failure rehearsal — PASS

- Tắt MySQL: readiness trả HTTP `503` với `{"status":"DOWN"}`.
- Bật lại MySQL: backend tự hồi phục về `{"status":"UP"}` mà không cần xóa dữ liệu.
- Tắt Mailpit rồi đăng ký bằng payload hợp lệ: API trả HTTP `500`, code `1015`; không báo gửi email thành công giả. Sau khi bật lại, Mailpit trở về healthy.
- Bật cờ `REHEARSAL_IMAGE_STORAGE_FAIL_DELETE=true`, thay banner lần hai: request nghiệp vụ vẫn hoàn tất và một cleanup task `PENDING` được lưu với lỗi mô phỏng.
- Đưa backend về chế độ bình thường: scheduler xử lý thành công và cleanup queue trở về `0` task.

## 4. Thay đổi triển khai phục vụ rehearsal

- Tách `ImageStorageService` khỏi adapter Cloudinary.
- `CloudinaryService` và `CloudinaryConfig` không được kích hoạt trong profile `rehearsal`.
- `RehearsalImageStorageService` không gọi outbound; hỗ trợ cờ mô phỏng lỗi xóa để kiểm tra retry queue.
- Bổ sung E2E `store-lifecycle.spec.js` và chuẩn hóa các E2E chạy trên origin `http://localhost:8081`.
- Refresh/logout E2E gửi đúng `Origin` và CSRF; assertion sau logout phản ánh đúng việc cookie CSRF đã bị xóa.
- Health E2E chấp nhận field `groups` của Actuator nhưng vẫn cấm `components` và `details`.

## 5. Tiêu chí hoàn thành

- [x] `docker compose up --build` thành công từ clean state.
- [x] Tất cả container healthy.
- [x] Greenfield Flyway + Hibernate validate pass.
- [x] Auth/email/deep-link/upload smoke pass.
- [x] Restart không mất dữ liệu.
- [x] Failure scenarios cho kết quả dự kiến.
- [x] Không có secret hoặc data volume được commit.

## 6. Phạm vi chưa được xác nhận bởi blueprint này

- Google/Facebook OAuth thật, cookie `Secure` trên HTTPS, Cloudinary thật và thiết bị Safari/iOS thuộc staging E2E (Blueprint 06–07).
- Upgrade/restore từ snapshot database hiện hữu thuộc Blueprint 05 và Blueprint 08.
- Rehearsal local không phải bằng chứng production hosting; nó chỉ chứng minh topology và contract triển khai hoạt động trong môi trường cô lập.

## 7. Cleanup an toàn

Chỉ xóa volume rehearsal sau khi xác nhận đúng project/volume và không chứa dữ liệu cần giữ. Không dùng lệnh xóa volume hoặc global Docker data rộng.
