# Báo cáo F1.1 — Flutter Native Authentication Compatibility Spike

**Ngày kiểm chứng:** 2026-10-26

**Branch / HEAD:** `feature/flutter-admin-application` / `1ec600e`

**Nền tảng host:** Windows 11, Flutter 3.35.1, Dart 3.9.0

**Kết luận:** **PARTIAL — chưa đủ bằng chứng Android native để PASS**

## 1. Phạm vi và nguồn sự thật

Báo cáo đối chiếu trực tiếp source Backend hiện hành, không mặc định blueprint luôn đúng. Các nguồn chính gồm `AuthenticationController`, `AuthenticationService`, `AuthCookieService`, `SecurityConfig`, `CorsConfig`, DTO response/request, error mapping và test Backend hiện hữu.

Backend local đã trả health HTTP 200 tại `http://127.0.0.1:8080/api/actuator/health`. Shell kiểm tra không đặt `SPRING_PROFILES_ACTIVE`, `application.yaml` mặc định về `dev`, và Java command line không có profile override; actuator không công khai profile nên vẫn không thể xác minh runtime profile độc lập. File `application-dev.yaml` local tồn tại nhưng không override auth-cookie.

Trong F1.1B, AVD `Pixel_9` Android 16/API 36 đã được khởi chạy thành công dưới device ID `emulator-5554`. Từ emulator, `10.0.2.2` ping thành công và TCP port 8080 mở, do đó đường mạng Android → Backend đã được chứng minh. Datasource local trỏ tới `jdbc:mysql://localhost:3306/cgfoodtour`; chưa có bằng chứng đây là database test riêng. Không có credential disposable hoặc exact Origin do Backend operator cấp, nên không gửi request đăng nhập thật.

## 2. Authentication contract đã xác minh từ source

### AUTH-01 — `POST /api/auth/token`

- Request JSON chính xác: `email`, `password`; cả hai bắt buộc, email phải hợp lệ.
- Success envelope: `{code: 1000, message, result}`.
- `result` có `accessToken`, `tokenType` (`Bearer`), `expiresIn`, `authenticated`.
- `refreshToken` và `refreshExpiresIn` có `@JsonIgnore`, không xuất hiện trong JSON.
- Server phát refresh token qua HttpOnly cookie và phát CSRF token ngẫu nhiên 32 byte qua cookie không HttpOnly.
- Sai email/password: HTTP 401, code 1026. Email chưa xác minh: HTTP 403, code 1011. Account disabled: HTTP 403, code 1013.

### AUTH-02 — `POST /api/auth/refresh`

- Endpoint public ở Spring Security nhưng controller bắt buộc custom CSRF contract trước khi refresh.
- Phải có refresh cookie, CSRF cookie, header `X-CSRF-Token` khớp constant-time và `Origin` thuộc exact allowlist.
- Thiếu/sai CSRF hoặc Origin: HTTP 403, code 1057 khi request đến controller; CORS filter có thể trả 403 không envelope cho Origin bị chặn trước controller.
- Thiếu/không hợp lệ/đã thu hồi refresh token: HTTP 401, code 1007.
- Service lưu JTI refresh cũ vào invalidation repository trong transaction rồi phát access/refresh token mới. Cookie refresh và CSRF đều được phát lại; đây là rotation contract cần chứng minh bằng Backend thật.
- Refresh cũng kiểm tra account còn enabled và token version hiện hành.

### AUTH-03 — `POST /api/auth/logout`

- Yêu cầu cùng CSRF cookie/header/Origin contract như refresh.
- Access Bearer là optional ở controller; khi có, service thu hồi cả access và refresh JTI. Token malformed/đã thu hồi không làm logout thất bại.
- Response xóa cả hai cookie bằng value rỗng và `Max-Age=0`.

### PROF-01 — `GET /api/users/me`

- Bắt buộc `Authorization: Bearer <access-token>`.
- `UserResponse` hiện hành gồm `id`, `username`, `firstname`, `lastname`, `email`, `dateOfBirth`, `avatarUrl`, `facebookId`, `enabled`, `emailVerified`, `disabledReason`, `disabledAt`, `roles`.
- Mỗi role có `name`, `description`, `permissions`; Admin được nhận diện bằng role name chính xác `ADMIN`.
- JWT decoder gọi introspection trước khi decode. Introspection kiểm tra chữ ký, expiry, token type, invalidated JTI, account enabled và token version; access token bị logout/disable/version revoke không tiếp tục được chấp nhận.
- Read-only `GET /api/users?page=0&size=1` đi qua `@PreAuthorize("hasRole('ADMIN')")` và được harness dùng để phân biệt USER với ADMIN mà không sửa dữ liệu.

## 3. Cookie, CSRF, Origin và CORS thực tế trong source

| Thuộc tính | Dev mặc định | Production source |
|---|---|---|
| Refresh cookie | `cgft_refresh` | `__Host-cgft_refresh` mặc định |
| CSRF cookie | `cgft_csrf` | `__Host-cgft_csrf` mặc định |
| Refresh HttpOnly | `true` | `true` |
| CSRF HttpOnly | `false` | `false` |
| Path | `/` | `/` |
| SameSite | `Strict` | `Strict` |
| Secure | `false` | `true` |
| Max-Age | `jwt.refreshable-duration` | `jwt.refreshable-duration` |

Dev mặc định thêm các Origin localhost/127.0.0.1 đã liệt kê trong `AuthCookieService`/`CorsConfig`, gồm `http://localhost:5173`. Rehearsal và production đặt `include-local-origins=false`; production yêu cầu các Origin cấu hình dùng HTTPS. Wildcard bị loại khỏi custom CSRF allowlist. CORS cho phép credentials nhưng native client vẫn phải chủ động gửi đúng `Origin` vì business CSRF validation không miễn trừ native.

## 4. Native compatibility harness

Harness nằm trong `flutter_admin/integration_test/auth/` và có các đặc tính:

- dùng Dio, tắt redirect tự động và không cài log interceptor;
- parse `Set-Cookie` bằng `dart:io`, chỉ nhận refresh/CSRF cookie có tên đã cấu hình;
- chỉ gửi cookie đến đúng scheme, host và port của API base URI; Secure cookie không được gửi qua HTTP;
- tự gửi `Cookie`, `X-CSRF-Token` và exact `Origin` cho refresh/logout;
- access token chỉ giữ trong memory;
- cookie persistence đi qua `PlatformSecureSessionStore` (`flutter_secure_storage`), dưới key riêng của spike;
- hỗ trợ `full`, `seed`, `restore`; seed/restore dành cho phép thử hai lần launch, còn object recreation trong full phase chỉ là secure-storage round trip, không được báo cáo như process restart thật;
- failure message không chứa body/header/token/cookie/credential.

F1.1B bổ sung `secure_storage_restart_test.dart` và Flutter integration driver. Hai lần `flutter drive` với `adb shell am force-stop` ở giữa đã chứng minh marker giả có thể được đọc trong process mới rồi bị xóa. Marker không xuất hiện trong file `shared_prefs`. Đây chỉ là bằng chứng cho primitive `flutter_secure_storage`; không phải bằng chứng session cookie được khôi phục sau login thật.

Credential không có default. Để chạy về sau, operator phải tạo file define tạm **ngoài repository** với các key `AUTH_SPIKE_RUN_REAL`, `APP_ENV`, `API_BASE_URL`, `CSRF_ORIGIN`, `AUTH_SPIKE_ADMIN_EMAIL`, `AUTH_SPIKE_ADMIN_PASSWORD`, và tùy chọn cặp USER/disabled Admin cùng expected cookie names/security. Lệnh dự kiến:

```powershell
flutter test integration_test/auth/auth_compatibility_test.dart `
  -d <android-device-id> `
  --dart-define-from-file=<absolute-temporary-file-outside-repository>
```

Các define được nhúng vào debug test APK. Chỉ dùng account disposable trên database không phải production; sau test phải xóa file tạm và uninstall/xóa test artifact. Không đưa file define vào Git.

## 5. Ma trận kiểm thử thực tế

| Test | Trạng thái | Bằng chứng/điều kiện |
|---|---|---|
| Đăng nhập Admin | BLOCKED | Android/Backend đã sẵn sàng; thiếu Admin disposable, database test được xác nhận và Origin được duyệt |
| Lấy `/users/me` | BLOCKED | Phụ thuộc đăng nhập Admin thật |
| Nhận HttpOnly cookie | BLOCKED | Source/unit đã xác minh; chưa có login Android thật |
| Nhận CSRF cookie | BLOCKED | Source/unit đã xác minh; chưa có login Android thật |
| Refresh hợp lệ | BLOCKED | Thiếu phiên Android thật |
| Cookie rotation | BLOCKED | Backend unit test PASS; thiếu phiên Android end-to-end |
| Thiếu CSRF | BLOCKED | Negative case có trong harness; thiếu phiên/cookie thật |
| CSRF không khớp | BLOCKED | Negative case có trong harness; thiếu phiên/cookie thật |
| Origin không hợp lệ | BLOCKED | Negative case có trong harness; exact Origin hợp lệ chưa được operator xác nhận |
| Không gửi cookie | BLOCKED | Negative case có trong harness; chưa chạy real-auth |
| Secure-storage qua process restart | PASS | Hai `flutter drive`, force-stop ở giữa; marker giả đọc được ở process mới và được xóa |
| Session cookie sau restart | BLOCKED | Secure-storage primitive PASS nhưng chưa có cookie từ login thật |
| Logout | BLOCKED | Thiếu phiên Android thật |
| Refresh sau logout | BLOCKED | Thiếu phiên Android thật |
| Đăng nhập USER | BLOCKED | Chưa được cấp USER disposable |
| Admin disabled | BLOCKED | Chưa được cấp disabled Admin disposable |
| Session revoked | BLOCKED | Harness kiểm tra access + refresh sau logout; chưa có fixture/phiên thật |

Không có mocked/unit result nào được nâng thành PASS trong bảng native compatibility.

## 6. Kết quả kiểm tra code và môi trường

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `flutter pub get` | PASS |
| `dart format lib test integration_test` | PASS |
| `flutter analyze` | PASS — no issues found sau F1.1B |
| `flutter test` | PASS — 28/28; integration tests được chạy riêng |
| Ba Backend auth test class | PASS — 15/15 với JDK 21, chạy lại trong F1.1B |
| Auth harness trên Android, real-auth tắt | BUILD/INSTALL PASS; 0 PASS, 3 SKIPPED đúng thiết kế |
| Secure-storage seed qua `flutter drive` | PASS — 1/1 trên API 36 |
| Secure-storage restore sau force-stop/process mới | PASS — 1/1 trên API 36 |
| Plaintext scan trong `shared_prefs` | PASS — marker giả không được tìm thấy |
| `flutter devices` / `adb devices` | PASS — `emulator-5554`, Android 16/API 36 |
| Emulator → Backend `10.0.2.2:8080` | PASS — ping và TCP connect |
| Android cmdline-tools | Đã cài revision 23 từ Google, SHA-1 khớp metadata |
| `flutter doctor -v` | Nhận SDK/platform/build-tools/device; license status vẫn `unknown` do CLI revision 23 bỏ `--licenses` |
| iOS | NOT RUN — Windows không có Xcode/macOS/device |

Lần chạy Maven đầu dùng Java ngoài baseline nên bị enforcer từ chối; chạy lại bằng JDK 21 của Android Studio đã PASS 15/15. Đây là vấn đề chọn runtime của lệnh test, không phải lỗi authentication.

## 7. Lỗi, rủi ro và nhu cầu Backend change

- Chưa phát hiện khác biệt nghiêm trọng giữa blueprint và contract Backend hiện hành cho bốn API được kiểm tra.
- Chưa có bằng chứng rằng Backend bắt buộc phải thay đổi. Native Dio có thể biểu diễn Cookie/CSRF/Origin contract và secure storage về mặt kỹ thuật, nhưng kết luận này mới ở mức source + harness/unit.
- HttpOnly không ngăn native HTTP stack đọc `Set-Cookie`; trách nhiệm bảo vệ value thuộc native cookie vault. Harness không log hoặc lưu plaintext, nhưng production implementation vẫn phải được thiết kế riêng ở F1.2 sau khi spike PASS.
- Compile-time test credentials tồn tại trong debug artifact; bắt buộc dùng tài khoản ngắn hạn, database test và dọn artifact. Đây không phải cơ chế credential production.
- Cần xác nhận exact local Origin với Backend operator; không tự sửa allowlist.
- Android native log phát hiện EncryptedSharedPreferences cũ không giải mã được và plugin fallback sang custom ciphers. Seed/restore vẫn PASS và marker không nằm plaintext trong `shared_prefs`, nhưng package 10.3.4 cảnh báo Android Auto Backup có thể gây lỗi unwrap key. Manifest hiện chưa tắt/exclude backup. Cần phê duyệt chính sách backup trước F1.2; spike không tự thay đổi hành vi backup toàn ứng dụng.
- Android CLI revision 23 thông báo `sdkmanager --licenses` đã deprecated và không còn cần thiết, trong khi Flutter 3.35.1 vẫn báo license `unknown`. Build/install/test API 36 vẫn hoạt động; đây là mismatch chẩn đoán tooling, không được diễn giải là license PASS.

## 8. Kết luận và gate F1.2

**F1.1 hiện là PARTIAL.** Android SDK/emulator, đường mạng `10.0.2.2`, build/install harness và secure-storage qua process restart đã được kiểm chứng. Tuy nhiên toàn bộ authentication contract với Backend thật vẫn BLOCKED vì thiếu môi trường dữ liệu/tài khoản/Origin được phê duyệt. iOS vẫn NOT RUN.

Điều kiện để nghiệm thu F1.1 và xem xét F1.2:

1. cấp Admin, USER và disabled Admin disposable trên database local/rehearsal không phải production;
2. xác nhận exact allowed Origin và cookie names/secure policy của môi trường test;
3. quyết định chính sách Android backup cho secure storage và làm sạch dữ liệu test cũ trước phép thử nghiệm thu;
4. chạy auth phase full và hai launch auth seed/restore; lưu kết quả không chứa secret;
5. mọi ca bắt buộc đạt kỳ vọng, đặc biệt rotation, old-cookie rejection, logout/revocation và USER authorization.

**Khuyến nghị: dừng trước F1.2. Chưa đề xuất Backend change và tuyệt đối chưa đánh dấu native authentication PASS.**
