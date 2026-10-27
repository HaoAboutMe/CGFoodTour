# F1.1C — Authentication Test Environment Readiness

**Ngày kiểm tra:** 2026-10-26

**Branch / HEAD:** `feature/flutter-admin-application` / `1ec600e`

**Phạm vi:** kiểm tra read-only và lập phương án. Không tạo tài khoản, không ghi database, không chạy migration, không sửa Backend/Origin/Android manifest.

**Kết luận F1.1C:** **BLOCKED** tại thời điểm khảo sát read-only.  
**Cập nhật F1.1D:** **READY cho F1.1E** — rehearsal database độc lập, ba account disposable, exact Origin, Android connectivity và backup policy đã được kiểm chứng. Chi tiết/evidence tại `F1_REHEARSAL_SETUP_REPORT.md`.

## 1. Runtime profile và database đã xác minh

### 1.1 Profile/configuration

Các bằng chứng hiện có:

- `application.yaml` mặc định `SPRING_PROFILES_ACTIVE` về `dev` và đặt context path `/api`, port 8080.
- Java command line của process đang chạy không chứa `spring.profiles.active` override.
- Dev OpenAPI endpoint `/api/api-docs` trả HTTP 200, phù hợp với `application-dev.yaml`; baseline và production đều tắt API docs.
- File `application-dev.yaml` local tồn tại, datasource là MySQL local database `cgfoodtour`, Hibernate dùng `ddl-auto=update` và không có auth-cookie/CORS override.
- Actuator không công khai active profile và process environment của IDE không được đọc trực tiếp. Vì vậy có thể kết luận runtime **khớp cấu hình dev với độ tin cậy cao**, nhưng không coi đây là bằng chứng operator xác nhận môi trường test.

### 1.2 Database hiện tại

Một transaction `READ ONLY` đã lấy aggregate, không đọc email, username, nội dung hoặc credential:

| Thuộc tính | Kết quả |
|---|---:|
| Database | MySQL `cgfoodtour` trên localhost |
| Server | MySQL 9.3.0 |
| Server read-only | Không (`@@read_only = 0`) |
| User | 5 |
| Store | 7 |
| Food item | 5 |
| Invalidated token | 147 |
| ADMIN active | 2 |
| USER active | 3 |
| Flyway history table | Không tồn tại |

Database có dữ liệu nghiệp vụ và lịch sử token hiện hữu, writable, được Hibernate tự cập nhật schema và không do Flyway quản lý. Đây là database phát triển lâu dài, không phải database test tự hủy. Không thể chứng minh dữ liệu không phải dữ liệu thật hoặc dữ liệu quan trọng của developer.

**Kết luận:** tuyệt đối không chạy F1.1 mutation/login-rotation/logout trên database này. Login/refresh/logout đều có thể ghi rate-limit state hoặc `invalidated_token`; disabled-account setup còn thay đổi user/role/token version.

### 1.3 Test database/fixture hiện có

- `backend/src/test/resources/application.yaml` dùng H2 in-memory `testdb`, `ddl-auto=update`, Flyway tắt. Database này độc lập nhưng chỉ sống trong JVM test và hiện không cung cấp Backend standalone để Android truy cập.
- `FlywayMigrationTest` và `FlywayJpaValidationTest` có Testcontainers MySQL 8.4, database tạm và Flyway validation. Chúng không seed ba tài khoản auth, không chạy web server cho Android và container bị hủy sau test.
- Docker CLI có mặt nhưng Docker daemon không chạy tại thời điểm kiểm tra.
- Không tìm thấy Docker Compose/rehearsal orchestration được commit trong repository.
- `ApplicationInitConfig` có thể bootstrap role/permission và một active Admin trên database trống. Đây không phải fixture ba tài khoản; ở non-production còn có fallback password xác định sẵn nên không phù hợp làm credential nghiệm thu.
- Các authentication unit/controller tests dùng mock hoặc object fixture trong memory; không cung cấp credential cho Backend thật.

**Có test database độc lập về mặt test tooling, nhưng chưa có môi trường auth integration độc lập và có thể truy cập từ Android.**

## 2. CSRF Origin: source, runtime và phê duyệt

### 2.1 Default trong source

`AuthCookieService` đọc:

- `app.cors.allowed-origins`, default `http://localhost:5173`;
- `app.cors.include-local-origins`, default `true`.

Khi local origins được bật, business CSRF allowlist chứa các exact Origin localhost/127.0.0.1 ở port 5173, 3000, 5500–5502. Wildcard bị loại khỏi allowlist của `AuthCookieService`.

`CorsConfig` đọc cùng hai property, cho phép credentials và các HTTP method/header cần thiết. Spring Security bật CORS nhưng tắt framework CSRF; refresh/logout vẫn bị bảo vệ bởi custom cookie/header/Origin validation trong `AuthCookieService`.

### 2.2 Runtime hiện tại

File dev local không override CORS. Preflight read-only tới Backend đang chạy cho kết quả:

| Origin thử | Kết quả runtime CORS |
|---|---|
| `http://localhost:5173` | HTTP 200, phản hồi đúng `Access-Control-Allow-Origin` |
| `http://localhost:3000` | HTTP 200, phản hồi đúng `Access-Control-Allow-Origin` |
| `http://10.0.2.2:8080` | HTTP 403 |
| Origin HTTPS giả không thuộc allowlist | HTTP 403 |

Điều này chứng minh CORS runtime hiện chấp nhận hai local Origin đầu. Business CSRF layer dùng cùng property source và exact matching, nhưng chưa gửi refresh/logout hợp lệ vì không có phiên test.

### 2.3 Origin đề xuất và giới hạn phê duyệt

- API Base URL cho Android emulator: `http://10.0.2.2:8080/api`.
- Candidate CSRF Origin: `http://localhost:5173`.
- Native client chỉ gửi Origin dưới dạng header; nó không dùng `localhost` làm API host. Cookie vẫn bị vault khóa vào API origin `http://10.0.2.2:8080`.
- Candidate này đã được runtime CORS chấp nhận và nằm trong source default, nhưng **chưa phải Origin được Backend operator phê duyệt**.

Product Owner/Backend operator phải xác nhận candidate trên chỉ dùng cho local disposable test. Không thêm `10.0.2.2` hoặc Origin giả vào allowlist và không bỏ qua CSRF.

## 3. Phương án cung cấp ba tài khoản disposable

### 3.1 Phương án khuyến nghị: rehearsal stack tự hủy

Tạo trong một lượt triển khai riêng sau phê duyệt:

1. Khởi động Docker daemon.
2. Tạo MySQL container/database riêng, ví dụ tên thể hiện rõ auth spike; không mount volume dữ liệu dev/prod.
3. Chạy Backend bằng profile `rehearsal`, Flyway `migrate + validate`, Hibernate `validate`, bind port host để emulator truy cập qua `10.0.2.2`.
4. Dùng Mailpit/local SMTP sink; tuyệt đối không gửi email thật.
5. Cấp bootstrap Admin credential ngẫu nhiên, ngắn hạn qua environment bên ngoài Git. Không dùng fallback non-production.
6. Tạo hai account qua workflow hợp lệ trên database tạm:
   - đăng ký USER qua API và hoàn tất verification bằng email/token trong Mailpit;
   - giữ account này là active USER;
   - đăng ký/verify account thứ hai, dùng Admin API cập nhật role thành ADMIN rồi disable bằng Admin API. Bootstrap Admin vẫn active nên không vi phạm last-admin protection.
7. Xác minh aggregate trên database tạm: đúng ba actor cần thiết, không có dữ liệu dev/prod.
8. Truyền credential cho Flutter bằng file define tạm nằm ngoài repository; sau test xóa file và test APK.
9. Teardown toàn bộ Backend/MySQL/Mailpit container và volume tạm sau khi thu kết quả không chứa secret.

Quy trình API-driven kiểm tra đúng business rules nhưng tạo audit/invalidation/email events. Vì toàn bộ stack tự hủy, các mutation này không ảnh hưởng dữ liệu hiện hữu.

### 3.2 Phương án fixture test-only

Có thể bổ sung trong một task Backend được phê duyệt riêng một fixture chỉ kích hoạt dưới profile chuyên biệt, seed đúng ba account với password lấy từ environment và fail startup ngoài profile đó. Fixture phải:

- không nằm trong production/dev bootstrap path;
- từ chối credential rỗng hoặc default;
- chỉ chạy trên database có marker/name test được allowlist;
- không log credential;
- seed idempotent và được container teardown sau test.

Repository hiện **không có fixture này**. F1.1C không tạo nó.

### 3.3 Các phương án không được chấp nhận

- Không dùng 2 Admin/3 USER hiện có trong `cgfoodtour`.
- Không đổi role hoặc disable account hiện hữu rồi “đổi lại”.
- Không dùng bootstrap Admin dev hiện tại chỉ vì source có credential fallback.
- Không chạy Android E2E trực tiếp với H2 unit-test config; H2 không phản ánh MySQL/Flyway/rehearsal deployment và hiện không có standalone server lifecycle.
- Không chạy với production/staging data hoặc SMTP thật.

## 4. Android Auto Backup và secure storage

### 4.1 Hiện trạng

Android manifest chưa khai báo `android:allowBackup`, `android:fullBackupContent` hoặc `android:dataExtractionRules`. Vì vậy ứng dụng chưa có policy rõ ràng để loại trừ secure-storage artifacts.

`flutter_secure_storage` 10.3.4 cảnh báo Android Auto Backup có thể restore encrypted preferences mà không restore Android Keystore key, dẫn tới lỗi unwrap/decrypt. F1.1B đã quan sát một EncryptedSharedPreferences cũ không giải mã được; plugin fallback sang custom ciphers. Marker thử nghiệm vẫn restore qua process restart và không xuất hiện plaintext trong `shared_prefs`, nhưng backup/restore giữa install/device là một lifecycle khác.

### 4.2 So sánh phương án

| Phương án | Ưu điểm | Ảnh hưởng/rủi ro |
|---|---|---|
| Tắt Auto Backup toàn ứng dụng | Đơn giản, giảm nguy cơ session/key material bị phục hồi sang keystore khác; phù hợp dữ liệu Admin có thể tải lại | Preferences/draft/cache cục bộ không tự khôi phục khi cài lại/chuyển máy; cần khai báo nhất quán cho Android 12+ |
| Giữ backup, exclude secure storage | Có thể khôi phục dữ liệu không nhạy cảm khác | Phải duy trì rules cho legacy full backup và Android 12+ data extraction; tên file/namespace/migration backup của plugin có thể thay đổi; exclude thiếu file gây lỗi hoặc rò dữ liệu |

### 4.3 Khuyến nghị

Đối với Admin app, ưu tiên **không backup session secret**. Khuyến nghị Product Owner phê duyệt tắt backup toàn ứng dụng nếu app không có dữ liệu cục bộ quan trọng ngoài cache/preferences có thể tái tạo. Khi triển khai cần kiểm tra cả cấu hình legacy và Android 12+ thay vì chỉ thêm một thuộc tính manifest.

Nếu sản phẩm cần backup preferences không nhạy cảm, chọn phương án rules và exclude toàn bộ secure-storage shared-preference domain/file set cho cả cloud backup lẫn device transfer; bổ sung regression test sau mỗi lần nâng `flutter_secure_storage`. Không backup access/refresh/CSRF token dưới bất kỳ phương án nào.

F1.1C không sửa manifest hoặc tạo backup rules.

## 5. Kế hoạch chuẩn bị test environment

1. Product Owner phê duyệt ENV-01, ORIGIN-01, ACCOUNT-01 và BACKUP-01 ở mục 6.
2. Backend operator khởi động Docker daemon và dựng rehearsal stack tự hủy bằng MySQL + Mailpit, không mount dữ liệu hiện hữu.
3. Chứng minh profile `rehearsal` qua startup log/config, database name riêng, Flyway history có V1/V2 và Hibernate validation PASS.
4. Chứng minh Backend bind tới host port đã chọn và emulator kết nối được bằng `10.0.2.2`.
5. Cấu hình exact `APP_CORS_ALLOWED_ORIGINS` đã phê duyệt, `include-local-origins=false`; chạy positive/negative preflight.
6. Provision ba account disposable bằng workflow đã phê duyệt; chỉ ghi ID/role/state aggregate vào evidence, không ghi email/password.
7. Tạo file `--dart-define-from-file` tạm ngoài repository; bảo đảm debug artifact chỉ dùng credential ngắn hạn.
8. Chạy auth phase `full`, sau đó `seed` → force-stop/process mới → `restore`; phân biệt secure-storage primitive với auth-session restore.
9. Thu status/code/cookie attributes/rotation boolean; không thu token/cookie value.
10. Logout, xác minh old access/refresh bị từ chối; teardown app, file define, container và volume tạm.

## 6. Quyết định cần Product Owner/Backend operator phê duyệt

| ID | Quyết định | Khuyến nghị |
|---|---|---|
| ENV-01 | Dùng database nào cho F1.1 | Rehearsal MySQL container/volume tự hủy, tuyệt đối không dùng `cgfoodtour` hiện tại |
| ORIGIN-01 | Exact Origin cho local Android spike | Phê duyệt `http://localhost:5173` chỉ trong rehearsal/local test; Backend cấu hình explicit và tắt implicit local origins |
| ACCOUNT-01 | Cơ chế tạo ba account | API-driven trên rehearsal stack + Mailpit; hoặc phê duyệt task fixture test-only riêng nếu cần deterministic setup |
| CREDENTIAL-01 | Cách cấp credential | Secret/file tạm ngoài Git, password ngẫu nhiên ngắn hạn, teardown sau test |
| BACKUP-01 | Android backup policy | Ưu tiên tắt app backup; nếu cần backup preferences thì exclude toàn bộ secure-storage artifacts cho cloud/device transfer |

F1.1C không tự áp dụng các quyết định. Trong F1.1D, Product Owner đã phê duyệt và môi trường đã áp dụng ENV-01, ORIGIN-01, ACCOUNT-01, CREDENTIAL-01 và BACKUP-01 theo báo cáo rehearsal.

## 7. Gate để chạy lại F1.1 integration matrix

Chỉ chạy real-auth khi đồng thời có đủ:

- [x] ENV-01 được phê duyệt và rehearsal database độc lập đang chạy.
- [x] Database name/host khác môi trường dev/prod; Flyway V1/V2 và Hibernate validation PASS.
- [x] Mailpit hoạt động nội bộ, không dùng SMTP production.
- [x] Exact Origin được cấu hình/phê duyệt; positive/negative preflight đúng.
- [x] Có active Admin, active USER và disabled Admin disposable; không dùng account hiện hữu.
- [x] Credential được cấp ngoài repository, không log và có kế hoạch hủy.
- [x] Emulator API 36 truy cập Backend bằng `10.0.2.2:18081`.
- [x] BACKUP-01 được áp dụng và kiểm tra trong APK.
- [x] Có phương án teardown giới hạn theo Compose project label sau F1.1E.

Checklist môi trường đã đầy đủ để chạy F1.1E. F1.1 vẫn **PARTIAL** cho đến khi full Android authentication matrix có bằng chứng thực tế; không bắt đầu F1.2.
