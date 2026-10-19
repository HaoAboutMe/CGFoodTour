# Blueprint 10 — Legal, Privacy and User Trust

> Trạng thái: PROPOSED — hoàn tất trước public promotion/OAuth review  
> Ưu tiên: P1 release readiness  
> Phạm vi duy nhất: thông tin pháp lý, quyền dữ liệu và kênh hỗ trợ

## 1. Mục tiêu

Giúp người dùng hiểu ai vận hành dịch vụ, dữ liệu nào được thu thập, dùng để làm gì, được giữ bao lâu và cách yêu cầu hỗ trợ/xóa dữ liệu.

## 2. Nội dung bắt buộc

### L1. Privacy Policy

- Dữ liệu tài khoản, email, ngày sinh và social identifiers.
- Vị trí trình duyệt và tọa độ quán.
- Ảnh lưu trên Cloudinary.
- Email/SMTP, Google/Facebook và nhà cung cấp hosting.
- Log, security data và retention.
- Cookie phiên/CSRF và mục đích sử dụng.
- Quyền truy cập, sửa và xóa dữ liệu.

### L2. Terms of Service

- Điều kiện tuổi.
- Quy tắc đăng quán/nội dung/ảnh.
- Quyền moderation, khóa và xóa tài khoản.
- Trách nhiệm về thông tin giá, giờ mở cửa và địa điểm.
- Cấm spam, giả mạo và nội dung vi phạm.
- Giới hạn trách nhiệm hợp lý.

### L3. Account deletion

- Hướng dẫn người dùng yêu cầu xóa tài khoản.
- Mô tả dữ liệu bị xóa và audit tối thiểu được anonymize/giữ lại.
- Thời gian xử lý dự kiến.
- Luồng riêng cho tài khoản social nếu provider yêu cầu deletion URL/callback.

### L4. Support/contact

- Email hỗ trợ trên domain chính thức.
- Thông tin cần gửi khi báo lỗi, tránh yêu cầu token/password.
- Cơ chế report nội dung/quán sai.

### L5. Consent/versioning

- Link Privacy/Terms tại đăng ký và footer.
- Ghi version/effective date của tài liệu.
- Nếu cần đồng ý rõ ràng, lưu policy version thay vì chỉ boolean không có ngữ cảnh.

## 3. Kiểm tra provider

- Google OAuth consent screen: domain, privacy URL, terms URL, support email.
- Facebook app: privacy URL, data deletion instructions/callback, app domain.
- Các URL phải public qua HTTPS và không yêu cầu login.

## 4. Tiêu chí hoàn thành

- [ ] Privacy Policy và Terms public qua HTTPS.
- [ ] Có hướng dẫn xóa account/data rõ ràng.
- [ ] Có support contact hoạt động.
- [ ] Link xuất hiện tại đăng ký và footer/about.
- [ ] OAuth provider configuration dùng đúng URL.
- [ ] Nội dung được người có trách nhiệm pháp lý review trước public rộng.

## 5. Lưu ý

Blueprint này là kế hoạch sản phẩm/kỹ thuật, không thay thế tư vấn pháp lý chuyên nghiệp.

