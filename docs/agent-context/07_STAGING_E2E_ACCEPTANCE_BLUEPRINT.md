# Blueprint 07 — Staging E2E Acceptance

> Trạng thái: PROPOSED — chạy sau Blueprint 06  
> Ưu tiên: P0 release gate  
> Phạm vi duy nhất: nghiệm thu luồng người dùng trên staging HTTPS

## 1. Mục tiêu

Chứng minh các luồng quan trọng hoạt động xuyên suốt trong trình duyệt thật, không chỉ ở unit/integration test.

## 2. Dữ liệu và tài khoản test

- Mailbox/Mailpit staging riêng.
- Google/Facebook test user, không dùng tài khoản cá nhân chính.
- Admin/user/owner test có lifecycle rõ ràng.
- Quán test cho từng trạng thái.
- Không lưu token, cookie, OTP, video chứa secret trong Git.

## 3. Ma trận luồng bắt buộc

### E1. Email authentication

- Register → email → verify → login.
- Refresh rotation; token cũ bị từ chối.
- Logout; refresh sau logout bị từ chối.
- Resend verification và expired token.
- Forgot password → OTP → reset → login bằng password mới.
- Password cũ và phiên trình duyệt thứ hai bị revoke.

### E2. Social authentication

- Google login user mới và user đã tồn tại.
- Facebook login user mới và user đã tồn tại.
- Account chưa verify được hoàn tất theo policy.
- Account bị admin disable không được tự enable.
- SDK không chèn trùng sau navigation/reload.

### E3. Store lifecycle

- Tạo quán và submit pending.
- Admin approve/reject/hide/recover.
- Owner sửa approved/rejected và state transition đúng.
- Disabled owner làm quán biến mất khỏi public API.
- Public không đọc được food item của quán không public.

### E4. Media atomicity

- Chọn ảnh rồi hủy: không upload/orphan.
- Chọn ảnh rồi lưu: DB và Cloudinary đồng bộ.
- Upload fail/DB fail: cleanup đúng.
- Avatar, banner và food image dưới/vượt limit.

### E5. Navigation/discovery

- Deep-link mở trực tiếp, reload, back/forward.
- Search/category/nearby/pagination/load-more.
- Saved store, rating và report.
- Share URL chỉ cho approved store.

### E6. Admin

- Khóa/mở user kèm email.
- Đổi role revoke JWT cũ.
- Xóa user theo confirmation/reason và giữ audit theo policy.
- Pending/recovery counts không phụ thuộc page hiện tại.

## 4. Browser matrix

- Desktop Chromium.
- Desktop WebKit/Safari-equivalent.
- Android Chrome viewport/device.
- iOS Safari-equivalent; smoke trên thiết bị thật nếu có thể.

## 5. Cách ghi nhận lỗi

- Ghi browser, route, account role, correlation ID và timestamp.
- Lưu trace/screenshot đã loại secret.
- Phân loại: blocker, major, minor.
- Blocker phải có regression test trước khi đóng.

## 6. Tiêu chí hoàn thành

- [ ] Tất cả E1–E6 pass trên Chromium.
- [ ] Auth/cookie/deep-link pass trên WebKit và mobile profiles.
- [ ] Google/Facebook login thật pass.
- [ ] Không có uncaught console error quan trọng.
- [ ] Không có request 5xx ngoài failure test chủ động.
- [ ] Không có secret trong artifact test.
- [ ] Có biên bản go/no-go gắn release commit/image digest.

