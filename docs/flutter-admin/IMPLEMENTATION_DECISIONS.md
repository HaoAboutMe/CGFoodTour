# Quyết định triển khai Flutter Admin

Tài liệu ghi lại các quyết định đã áp dụng trong F0. Master Blueprint vẫn là nguồn kiến trúc chính; source backend hiện tại là nguồn sự thật của API. DEC-05, DEC-06 và F0-DEC-FONT được Product Owner phê duyệt và triển khai ngày 2026-10-26.

## Các quyết định đã áp dụng trong F0

### F0-ADR-001 — Tương thích Flutter SDK hiện có

- **Quyết định:** dùng SDK constraint `>=3.9.0 <4.0.0`.
- **Lý do:** máy phát triển có Flutter 3.35.1/Dart 3.9.0; project template ban đầu yêu cầu Dart `^3.11.4` nên không thể resolve dependency.
- **Hệ quả:** chọn các package stable mới nhất mà solver xác nhận tương thích; không nâng SDK ngoài phạm vi task.

### F0-ADR-002 — Dependency set tối thiểu

- Riverpod là cơ chế duy nhất cho state/DI.
- `go_router` quản lý route và guard.
- Dio là HTTP client; widget/feature không phụ thuộc trực tiếp vào Dio.
- `json_serializable` chỉ dùng cho transport model nền tảng, không thêm codegen layer khác.
- `flutter_secure_storage` nằm sau `SecureSessionStore`; feature không đọc raw credential.
- Không thêm service locator, form framework, logging package hoặc font package.

### F0-ADR-003 — Môi trường compile-time và transport policy

- `APP_ENV`: `localAndroid`, `localIos`, `localDevice`, `staging`, `production`.
- `API_BASE_URL`, `CSRF_ORIGIN`, `ALLOW_INSECURE_HTTP` là non-secret compile-time values.
- Local Android mặc định dùng `http://10.0.2.2:8080/api` trong debug.
- Local iOS mặc định dùng `http://127.0.0.1:8080/api` trong debug.
- `localDevice`, staging và production bắt buộc cung cấp URL.
- Staging/production từ chối HTTP khi validate startup.
- Android/iOS cleartext exception chỉ tồn tại trong debug native configuration.

### F0-ADR-004 — Authentication boundary

- F0 khởi tạo trạng thái anonymous và chỉ hiển thị login placeholder.
- Tất cả route `/admin/**` bị guard.
- Không thêm tài khoản/token giả, không parse JWT để giả lập Admin, không gọi API authentication.
- Session coordinator, cookie transport, refresh mutex và role verification thuộc F1.

### F0-ADR-005 — API transport foundation

- Envelope và page model khớp trực tiếp backend hiện tại.
- Success code là 1000.
- Error transport được chuyển thành typed failure, không render thẳng backend message.
- Không tự động retry mutation; interceptor refresh chưa được triển khai trong F0.

### F0-ADR-006 — Neo-Brutalist mobile foundation

- Màu dùng source React hiện tại: canvas `#F7F6F2`, surface `#FFFFFF`, ink `#111111`, brand `#FF3E3E`, action `#C92A2A`.
- Border 2 px, radius 8/12/16, shadow cứng 4 px và touch target tối thiểu 48 px.
- Phone dùng bottom navigation 4 mục; màn hình rộng từ 840 logical px dùng NavigationRail.
- Plus Jakarta Sans được bundle offline dưới dạng upright variable TTF; system sans vẫn là fallback.
- Font gốc hỗ trợ weight 200–800. Các style w900 trong blueprint được ánh xạ về ExtraBold 800 để không yêu cầu weight không tồn tại trong font chính thức.

### F0-ADR-007 — Localization

- Tiếng Việt là locale mặc định.
- Tiếng Anh là fallback được quản lý bằng ARB.
- Không hardcode backend technical message làm product copy.

### F0-ADR-008 — Code generation và generated artifacts

- `ApiEnvelope<T>` và `PageResponse<T>` dùng `json_serializable` generic factories.
- Localization sinh bởi Flutter gen-l10n.
- Generated Dart source và `pubspec.lock` được giữ trong Git để build có thể tái lập.

## Quyết định F0 đã được phê duyệt

### DEC-05 — Supported OS và tablet

**Trạng thái: APPROVED — IMPLEMENTED.**

- Minimum Android API: 24.
- Minimum iOS: 15.0.
- Tablet: responsive cơ bản; phone dùng Bottom Navigation, từ 840 logical px dùng NavigationRail.
- Android `minSdk = 24`, ba Xcode build configuration dùng deployment target 15.0 và Podfile khai báo `platform :ios, '15.0'`.

Compatibility đã được kiểm tra từ package metadata cài đặt: `flutter_secure_storage` 10.3.4 yêu cầu Android API 23 và `flutter_secure_storage_darwin` yêu cầu iOS 12; API 24/iOS 15 đáp ứng. Flutter 3.35.1 dùng Android minimum 24. Không cần nâng package hoặc minimum OS.

### DEC-06 — Định danh và phát hành

**Trạng thái: APPROVED — IDENTIFIERS/DISPLAY NAME IMPLEMENTED.**

- Android application ID và namespace: `vn.cgfoodtour.admin`.
- Java package/MainActivity: `vn.cgfoodtour.admin`.
- iOS Runner bundle ID: `vn.cgfoodtour.admin`.
- iOS RunnerTests bundle ID: `vn.cgfoodtour.admin.RunnerTests`.
- Display name Android/iOS: `CG FoodTour Admin`.

Production signing và icon chính thức vẫn là release-preparation follow-up vì chưa có signing material/icon resource được phê duyệt. F0 không tạo certificate, provisioning profile, keystore hoặc signing secret.

### F0-DEC-FONT — Plus Jakarta Sans

**Trạng thái: APPROVED — IMPLEMENTED.**

- Bundle `PlusJakartaSans-VariableFont_wght.ttf` upright, weight axis 200–800.
- Nguồn phân phối: Google Fonts repository `google/fonts`, thư mục `ofl/plusjakartasans`.
- Upstream: Tokotype Plus Jakarta Sans.
- License: SIL Open Font License 1.1, lưu tại `assets/fonts/plus_jakarta_sans/OFL.txt`.
- SHA-256 font: `89B3FB38AA0D275D7A731D0D817A4F1622B316B4D7FBDEDCF02EE9099FF68BC8`.
- Font được khai báo trong `pubspec.yaml`, áp dụng toàn bộ `ThemeData`, có system sans fallback và không có runtime download.
- APK inspection xác nhận TTF nằm trong `assets/flutter_assets/assets/fonts/plus_jakarta_sans/`.

Chỉ bundle upright variable TTF vì F0 không định nghĩa italic typography. Cách này giảm asset so với sáu static TTF và vẫn hoạt động hoàn toàn offline.

## Quyết định bắt buộc trước F1

### DEC-01 — Native authentication compatibility spike

Khuyến nghị phê duyệt đúng sequence trong blueprint:

1. kiểm thử contract cookie hiện tại không đổi;
2. chứng minh login → `/users/me` Admin check → refresh rotation → restart restore → logout;
3. chứng minh USER/disabled/role-revoked bị từ chối;
4. nếu cookie/Origin không tương thích native thì dừng, cung cấp bằng chứng và xin phê duyệt backend contract mới.

### DEC-07 — CSRF Origin theo môi trường

Cần cung cấp exact HTTPS Origin cho staging/production và Origin local được backend allowlist. Origin là cấu hình triển khai, không phải secret; client chỉ được gửi nó đến đúng API host đã cấu hình.

## Các điểm cố ý chưa quyết định trong F0

- Không chọn store detail API option (DEC-02, cần trước F3).
- Không chọn role exposure policy (DEC-03, cần trước F4).
- Không thêm avatar upload (DEC-04, cần trước F5).
- Không bật screenshot protection (DEC-09, cần review ở F6).
- Không cấu hình signing, production endpoint, credentials hoặc secret.
