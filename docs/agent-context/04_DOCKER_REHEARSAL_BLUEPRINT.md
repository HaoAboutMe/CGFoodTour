# Blueprint 04 — Local Docker Rehearsal

> Trạng thái: PROPOSED — chờ Docker daemon và phê duyệt thực thi  
> Ưu tiên: P0 release gate  
> Phạm vi duy nhất: chạy toàn bộ topology gần production trên máy local

## 1. Mục tiêu

Chứng minh backend, frontend, MySQL, Flyway, Mailpit, Nginx và healthcheck có thể hoạt động cùng nhau từ clean checkout bằng Docker Compose.

## 2. Điều kiện đầu vào

- Blueprint 01–03 đã hoàn tất.
- Docker Desktop/Engine và Compose hoạt động.
- Có Cloudinary test account hoặc chế độ kiểm thử được chấp nhận.
- `rehearsal.env` chỉ dùng secret test và không commit.

## 3. Kịch bản triển khai

### R1. Kiểm tra cấu hình tĩnh

- Validate Compose config.
- Build backend/frontend image không dùng cache lần đầu.
- Kiểm tra image chạy non-root.
- Ghi image ID/digest và kích thước.

### R2. Greenfield startup

- Dùng volume MySQL mới.
- Khởi động database → backend → frontend theo health dependency.
- Xác nhận Flyway chạy V1 và Hibernate validate.
- Xác nhận readiness/liveness `UP`.
- Kiểm tra Nginx SPA fallback và `/api` proxy.

### R3. Functional smoke

- Đăng ký và nhận email trong Mailpit.
- Verify, login, refresh và logout.
- Tạo user/admin test theo policy mới.
- Tạo/sửa quán và kiểm tra upload.
- Mở deep-link trực tiếp sau reload.

### R4. Restart/persistence

- Restart từng container.
- Xác nhận MySQL data còn nguyên.
- Xác nhận Flyway không chạy lại migration đã áp dụng.
- Xác nhận frontend/backend hồi phục theo healthcheck.

### R5. Failure rehearsal

- Tắt MySQL: readiness phải `DOWN`.
- Khởi động lại MySQL: backend phải hồi phục hoặc restart có kiểm soát.
- Tắt SMTP/Mailpit: luồng email phải báo đúng semantics.
- Giả lập Cloudinary lỗi: cleanup task được ghi nhận.

## 4. Bằng chứng cần lưu

- Compose config đã resolve nhưng không chứa secret trong tài liệu.
- Image digest.
- Flyway info và schema history.
- Health response đã redact.
- Kết quả smoke/E2E.
- Danh sách lỗi và correlation ID liên quan.

## 5. Tiêu chí hoàn thành

- [ ] `docker compose up --build` thành công từ clean state.
- [ ] Tất cả container healthy.
- [ ] Greenfield Flyway + Hibernate validate pass.
- [ ] Auth/email/deep-link/upload smoke pass.
- [ ] Restart không mất dữ liệu.
- [ ] Failure scenarios cho kết quả dự kiến.
- [ ] Không có secret hoặc data volume được commit.

## 6. Cleanup an toàn

Chỉ xóa volume rehearsal sau khi xác nhận đúng project/volume và không chứa dữ liệu cần giữ. Không dùng lệnh xóa volume/global Docker data rộng.

