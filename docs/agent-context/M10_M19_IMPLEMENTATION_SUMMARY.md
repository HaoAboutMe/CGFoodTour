# Tổng hợp triển khai M-10 và M-19

> Phạm vi: môi trường local/pre-deployment. Đợt này không tạo hoặc chạy migration production và không deploy.

## M-10 — Revoke JWT sau đổi/reset mật khẩu

### Backend

- `User` có thêm `tokenVersion`, mặc định là `0`. Với profile local đang dùng `ddl-auto=update`, Hibernate sẽ bổ sung cột `token_version`; giá trị `null` của dữ liệu local cũ được ứng dụng xem như `0`.
- Access token và refresh token mới đều có claim `ver` bằng `User.tokenVersion` tại thời điểm phát hành.
- Mỗi lần xác thực token, backend kiểm tra đồng thời chữ ký, hạn dùng, loại token, blacklist, trạng thái `enabled` và `ver == tokenVersion` hiện tại của user.
- Đổi mật khẩu và reset mật khẩu tăng `tokenVersion` trong cùng transaction với việc lưu mật khẩu mới. Vì vậy toàn bộ access/refresh token phát hành trước đó bị từ chối ngay lập tức.
- Request đổi mật khẩu được validate: hai trường không được để trống; mật khẩu mới dài từ 8 đến 72 ký tự.

### Frontend

- Sau reset mật khẩu thành công, SPA xóa access token, refresh token và user hiện tại khỏi state/localStorage, sau đó yêu cầu đăng nhập lại.
- Luồng đổi mật khẩu hiện có tiếp tục đưa người dùng về màn hình đăng nhập. Backend không còn phụ thuộc vào việc frontend có gọi logout thành công để revoke token cũ.
- Sai mật khẩu hiện tại trả `PASSWORD_INCORRECT` (HTTP 400), không còn dùng `UNAUTHENTICATED` (401), nên SPA không hiểu nhầm thành JWT hết hạn và tự logout.
- Backend `saveAndFlush` password hash cùng `tokenVersion` trước khi trả success; frontend chờ hoàn tất local logout rồi mới mở lại màn hình đăng nhập.
- Form đổi mật khẩu đồng bộ validation 8–72 ký tự với backend.

### Tương thích

- JWT cũ không có claim `ver` sẽ bị từ chối. Người dùng cần đăng nhập lại một lần sau khi cập nhật backend.
- Không cần session table cho cách triển khai hiện tại. Blacklist vẫn xử lý logout từng token; `tokenVersion` xử lý revoke toàn bộ session của một user.

## M-19 — Social login và trạng thái tài khoản

Ứng dụng tiếp tục dùng hai cờ hiện có, với ý nghĩa rõ ràng:

| `enabled` | `emailVerified` | Trạng thái | Social login |
|---|---|---|---|
| `false` | `false` | Chờ xác thực | Được phép xác thực và kích hoạt |
| `true` | `true` | Đang hoạt động | Được phép đăng nhập |
| `false` | `true` | Bị admin vô hiệu hóa | Từ chối, không cập nhật user |
| `true` | `false` | Dữ liệu không nhất quán | Từ chối và yêu cầu kiểm tra |

### Google

- Kiểm tra chữ ký/hạn token bằng Google JWK, issuer chính xác, audience, `email_verified=true`, email và `sub`.
- Lưu `sub` vào `googleId` và ưu tiên tra user bằng định danh ổn định này ở các lần đăng nhập sau.
- Chỉ fallback theo email đã được Google xác thực cho lần link đầu tiên.
- Tài khoản chờ xác thực được kích hoạt; tài khoản admin-disabled bị từ chối trước mọi thay đổi email/provider ID.
- Provider ID xung đột trả lỗi `SOCIAL_ACCOUNT_CONFLICT`.

### Facebook

- Gọi `debug_token` để kiểm tra token hợp lệ, còn hạn và thuộc đúng `FACEBOOK_APP_ID`.
- ID trả về từ `debug_token` phải trùng ID của hồ sơ `/me`.
- Tài khoản chờ xác thực có thể được kích hoạt khi token hợp lệ liên kết bằng Facebook ID hoặc email mà Facebook trả về.
- Tài khoản admin-disabled bị từ chối trước khi cập nhật email, avatar, provider ID hoặc trạng thái.

### Frontend xác thực lại email

- Khi đăng nhập email/password trả mã `1011` (`EMAIL_NOT_VERIFIED`), SPA tự chuyển sang màn hình xác thực và điền sẵn email để gửi lại liên kết.
- Form gửi lại liên kết được mở sẵn; nội dung không còn hướng dẫn lấy token từ terminal log.

## Thay đổi schema local

Hibernate `ddl-auto=update` sẽ chuẩn bị các thay đổi local sau:

- thêm `user.token_version`;
- thêm `user.google_id` và unique constraint;
- bổ sung unique constraint cho `user.facebook_id`.

Migration versioned, backup dữ liệu và rehearsal production được hoãn đến khi có môi trường hosting/database production. Không được dùng `ddl-auto=update` cho production.

## Sửa lỗi resend verification token

- Mỗi user vẫn chỉ có một hàng trong `verification_token` theo quan hệ one-to-one.
- Khi resend, backend cập nhật token, `createdAt` và `expiryDate` ngay trên hàng hiện có thay vì xóa rồi insert trong cùng transaction.
- Backend dùng `saveAndFlush` trước khi gửi email, tránh Hibernate insert token mới trước khi delete token cũ và gây lỗi unique `user_id`.
- Cooldown một phút và generic response hiện có được giữ nguyên.

## Đồng bộ luồng gửi email xác thực và OTP

- `sendVerificationEmail` và `sendOtpEmail` không còn chạy `@Async`; request HTTP chờ đến khi SMTP server chấp nhận email hoặc trả lỗi.
- Registration, resend verification và forgot-password không còn nuốt `EMAIL_SEND_FAILED`. Frontend chỉ chuyển bước khi API trả thành công; nếu SMTP lỗi thì giữ nguyên màn hình và hiển thị lỗi.
- Registration chạy trong transaction; verification token được flush trước khi gửi email. Resend và forgot-password cũng ghi challenge/token trước khi gọi SMTP và rollback transaction khi gửi thất bại.
- Resend verification và forgot-password trả HTTP 200 sau khi hoàn tất thay vì HTTP 202 Accepted.
- UI khóa nút đang gửi và hiển thị `Đang gửi email...`/`Đang gửi OTP...` để ngăn gửi lặp.
- Việc SMTP chấp nhận email không bảo đảm email đã xuất hiện ngay trong hộp thư; nhà cung cấp email vẫn có thể trì hoãn bước phân phối cuối cùng.

## Kiểm chứng

- Backend: `mvn ... test` — 19 test, 0 failure.
- Frontend: `npm run build` — thành công.
- Frontend: `npm run lint` — exit code 0; còn các warning cũ ngoài phạm vi.
- Có test chứng minh reset/change password tăng version, token cũ bị từ chối, pending account được kích hoạt và admin-disabled account bị chặn.

## Kiểm thử thủ công đề xuất ở local

1. Login trên hai trình duyệt, đổi mật khẩu ở một trình duyệt, xác nhận cả hai token cũ đều bị từ chối và refresh thất bại.
2. Reset mật khẩu bằng OTP, xác nhận token access/refresh phát hành trước reset không dùng lại được.
3. Đăng ký nhưng không verify, sau đó đăng nhập Google cùng email; account phải chuyển sang active.
4. Đặt user thành `enabled=false, email_verified=true`, thử Google/Facebook; API phải trả `ACCOUNT_DISABLED` và dữ liệu user không đổi.
5. Ở account pending, đăng nhập email/password; UI phải mở màn hình verify với email được điền sẵn để resend.
