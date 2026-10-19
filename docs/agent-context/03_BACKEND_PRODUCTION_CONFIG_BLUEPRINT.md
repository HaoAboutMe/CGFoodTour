# Blueprint 03 — Backend Production Configuration Contract

> Trạng thái: IMPLEMENTED — test backend đạt; chờ startup với hạ tầng production thật  
> Ưu tiên: P0 — chặn public release  
> Phạm vi duy nhất: cấu hình và startup validation của Spring Boot production

## 1. Mục tiêu

Backend production chỉ khởi động khi toàn bộ dependency, secret và security policy bắt buộc hợp lệ; không âm thầm dùng fallback development.

## 2. Vì sao cần làm

Validator hiện mới từ chối `useSSL=false`, chưa cưỡng chế đầy đủ `sslMode`. Admin password có thể thiếu khiến database trống khởi động mà không có tài khoản quản trị. Multipart limit mặc định cũng có thể khác giới hạn 2 MB trong service.

## 3. Thiết kế đích

- Typed configuration properties có validation rõ ràng.
- MySQL TLS policy được chọn theo topology, không dùng kiểm tra chuỗi nửa vời.
- Admin bootstrap là quy trình một lần, có trạng thái và không để password mặc định tồn tại lâu dài.
- Multipart contract thống nhất với frontend/Nginx.
- Startup error chỉ nêu tên property và lý do, không in secret.

## 4. Các bước triển khai

### B1. Typed properties

- Gom `app.*`, `security.*`, Cloudinary và cookie config vào `@ConfigurationProperties`.
- Dùng Bean Validation cho URL, duration, giới hạn dương và danh sách origin.
- Giảm `@Value` fallback rải rác ở production-sensitive services.

### B2. Database TLS

- Với managed/external MySQL: yêu cầu `sslMode=VERIFY_IDENTITY` hoặc policy tương đương của provider.
- Với private same-host network: ghi rõ exception và threat model; không tuyên bố đã xác minh TLS nếu chưa có.
- Từ chối `DISABLED`, `PREFERRED`, `useSSL=false`, localhost và credential placeholder trong profile prod.

### B3. Admin bootstrap

- Chọn một trong hai hướng trước khi code:
  - bootstrap command/job bắt buộc cho database mới; hoặc
  - startup bootstrap có secret dùng một lần.
- Không yêu cầu giữ bootstrap password mãi sau khi admin đã tồn tại.
- Không tạo admin với password mặc định.
- Log chỉ ghi email/ID cần thiết, không ghi password.

### B4. Upload contract

- Đặt `spring.servlet.multipart.max-file-size=2MB`.
- Đặt request size có overhead phù hợp, ví dụ `3MB`.
- Bổ sung handler cho multipart/413 để frontend nhận mã lỗi chuẩn.
- Giới hạn chiều rộng, chiều cao và tổng pixel ảnh sau decode.

### B5. Production startup tests

- Test context profile prod với bộ cấu hình hợp lệ.
- Negative test từng nhóm: DB, TLS, URL, CORS, JWT, peppers, SMTP, OAuth, Cloudinary, admin bootstrap.
- Xác nhận error/log không chứa secret value.

## 5. File dự kiến thay đổi

- `backend/src/main/resources/application-prod.yaml`
- `backend/.env.production.example`
- configuration property classes
- `ProductionConfigurationValidator.java`
- `ApplicationInitConfig.java`
- `GlobalExceptionHandler.java`
- test configuration và validator tests

## 6. Kiểm thử bắt buộc

- Prod startup thành công với cấu hình đầy đủ.
- Prod startup fail với từng property thiếu.
- URL MySQL `sslMode=DISABLED` bị từ chối.
- Database trống luôn có đường tạo admin được kiểm soát.
- File dưới/vượt giới hạn trả đúng status/code.
- Secret không xuất hiện trong log kiểm thử.

## 7. Tiêu chí hoàn thành

- [ ] Không có localhost/default credential trong prod.
- [ ] TLS policy phù hợp topology và được test.
- [ ] Fresh database không rơi vào trạng thái không có admin.
- [ ] Multipart limit thống nhất với Nginx.
- [ ] Startup fail-fast có thông báo hữu ích nhưng không lộ secret.

## 8. Rollback

Rollback application image/config cùng nhau. Không hạ chuẩn validation chỉ để ứng dụng khởi động; sửa secret/property hoặc dùng image trước đó.

## 9. Kết quả triển khai ngày 19/10/2026

- Đã thêm typed, validated properties cho bootstrap admin và bỏ các `@Value` liên quan khỏi `ApplicationInitConfig`.
- Production chỉ chấp nhận MySQL URL có `sslMode=VERIFY_IDENTITY`; CORS chỉ nhận HTTPS origin không có path/query/fragment.
- Database mới fail-fast nếu chưa có admin và không cung cấp bootstrap password; database đã có admin không buộc giữ password bootstrap.
- Multipart được đồng bộ ở mức file 2 MB/request 3 MB; payload quá lớn trả HTTP 413/code `1019`.
- Ảnh được kiểm tra metadata trước decode, giới hạn 4096×4096 và tối đa 16 triệu pixel.
- Toàn bộ 83 test backend đạt, gồm test production validator, admin bootstrap, multipart exception và ảnh vượt kích thước.
- Startup với MySQL/SMTP/OAuth/Cloudinary thật vẫn thuộc rehearsal/staging vì cần credential và hạ tầng thật; không cần cung cấp chúng để hoàn thành thay đổi source ở blueprint này.

