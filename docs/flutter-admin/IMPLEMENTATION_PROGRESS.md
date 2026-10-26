# Tiến độ triển khai CG FoodTour Admin

## F0 — Project Foundation

**Ngày thực hiện:** 2026-10-26  
**Trạng thái:** **PASS**  
**Branch ban đầu:** `feature/flutter-admin-application`  
**HEAD ban đầu:** `36502d4`  
**Git status ban đầu:** sạch

F0 đã hoàn tất phần nền tảng Dart/Flutter, áp dụng DEC-05/DEC-06/F0-DEC-FONT, kiểm thử và Android debug. iOS đã được kiểm tra tĩnh nhưng build vẫn là NOT RUN vì môi trường Windows không có Xcode; điều này phù hợp gate F0 “build khi toolchain khả dụng”.

## 1. Công việc đã hoàn thành

- Đọc toàn bộ `FLUTTER_ADMIN_MASTER_BLUEPRINT.md` (1.756 dòng) và đối chiếu lại với source hiện tại.
- Kiểm tra Flutter project, `pubspec.yaml`, lockfile, `.gitignore`, Android/iOS configuration.
- Xác minh trực tiếp backend:
  - envelope `{code, message, result}`;
  - `PageResponse` zero-based gồm `content`, `totalElements`, `totalPages`, `size`, `page`, `first`, `last`;
  - refresh token bị loại khỏi JSON authentication response;
  - error code hiện có từ 1001 đến 1059.
- Xác minh trực tiếp React design tokens: canvas, surface, ink, brand/action red, semantic colors, focus color và hard shadows.
- Thiết lập bootstrap bằng Riverpod và `MaterialApp.router`.
- Thiết lập toàn bộ route F0 theo blueprint và guard mặc định:
  - trạng thái ban đầu là anonymous;
  - route được bảo vệ luôn chuyển về `/login`;
  - không có Admin giả và không có cách mở shell quản trị trong F0.
- Tạo login placeholder mobile-first, trường đăng nhập và nút submit đều không thực hiện authentication trước F1.
- Thiết lập cấu hình compile-time cho `localAndroid`, `localIos`, `localDevice`, `staging`, `production`.
- Bắt buộc HTTPS cho staging/production; HTTP chỉ hợp lệ với local debug và cờ cho phép rõ ràng.
- Tách cleartext native:
  - Android chỉ bật trong debug manifest overlay;
  - iOS Debug dùng `Info-Debug.plist`; Info.plist Release/Profile không chứa ATS cleartext exception.
- Xây dựng Dio client nền tảng, generic `ApiEnvelope<T>`, `PageResponse<T>` và typed network failure.
- Tạo interface secure session storage và adapter `flutter_secure_storage`; chưa triển khai cookie/session lifecycle của F1.
- Tạo logger có redaction cho password, token, authorization, cookie, CSRF, OTP và Bearer/JWT trong chuỗi.
- Tạo theme Neo-Brutalist và các primitive dùng lại:
  - button;
  - card;
  - text input;
  - status badge;
  - skeleton/loading;
  - empty state;
  - error state;
  - confirmation dialog;
  - responsive Admin scaffold (bottom navigation/NavigationRail).
- Thiết lập ARB tiếng Việt và fallback tiếng Anh.
- Giữ `pubspec.lock` trong Git.
- Áp dụng định danh chính thức `vn.cgfoodtour.admin` cho Android/iOS và package MainActivity.
- Áp dụng Android API 24, iOS 15.0 và đồng bộ Podfile/Xcode build settings.
- Áp dụng display name `CG FoodTour Admin` trên Android/iOS.
- Bundle offline Plus Jakarta Sans variable TTF cùng SIL OFL 1.1; không có runtime font download.
- Xác minh responsive cơ bản: Bottom Navigation ở 320×568 và NavigationRail ở 1024×768; login card không kéo rộng quá 440 px.
- Không sửa Backend, React Frontend hoặc database.
- Không commit, push hoặc triển khai F1.

## 2. Cấu trúc/file được tạo hoặc sửa

### Ứng dụng và route

- `flutter_admin/lib/main.dart`
- `flutter_admin/lib/app/app.dart`
- `flutter_admin/lib/app/bootstrap.dart`
- `flutter_admin/lib/app/router.dart`

### Core

- `flutter_admin/lib/core/config/app_environment.dart`
- `flutter_admin/lib/core/config/environment_provider.dart`
- `flutter_admin/lib/core/network/api_client.dart`
- `flutter_admin/lib/core/network/api_envelope.dart` và file generated
- `flutter_admin/lib/core/network/page_response.dart` và file generated
- `flutter_admin/lib/core/network/network_failure.dart`
- `flutter_admin/lib/core/security/secure_session_store.dart`
- `flutter_admin/lib/core/logging/safe_logger.dart`
- `flutter_admin/lib/core/theme/app_colors.dart`
- `flutter_admin/lib/core/theme/app_spacing.dart`
- `flutter_admin/lib/core/theme/app_typography.dart`
- `flutter_admin/lib/core/theme/app_theme.dart`
- các widget trong `flutter_admin/lib/core/widgets/`

### Feature và localization

- `flutter_admin/lib/features/auth/domain/auth_state.dart`
- `flutter_admin/lib/features/auth/presentation/bootstrap_screen.dart`
- `flutter_admin/lib/features/auth/presentation/login_screen.dart`
- `flutter_admin/lib/features/foundation/presentation/protected_placeholder_screen.dart`
- `flutter_admin/lib/l10n/app_vi.arb`
- `flutter_admin/lib/l10n/app_en.arb`
- các file localization generated trong `flutter_admin/lib/l10n/generated/`
- `flutter_admin/l10n.yaml`

### Native/platform và dependency

- `flutter_admin/pubspec.yaml`
- `flutter_admin/pubspec.lock`
- `flutter_admin/android/app/src/main/AndroidManifest.xml`
- `flutter_admin/android/app/src/debug/AndroidManifest.xml`
- `flutter_admin/android/app/build.gradle.kts`
- `flutter_admin/android/app/src/main/java/vn/cgfoodtour/admin/MainActivity.java`
- `flutter_admin/ios/Runner/Info-Debug.plist`
- `flutter_admin/ios/Runner/Info.plist`
- `flutter_admin/ios/Podfile`
- `flutter_admin/ios/Runner.xcodeproj/project.pbxproj`
- `flutter_admin/assets/fonts/plus_jakarta_sans/PlusJakartaSans-VariableFont_wght.ttf`
- `flutter_admin/assets/fonts/plus_jakarta_sans/OFL.txt`
- `flutter_admin/assets/fonts/plus_jakarta_sans/README.md`

Application ID, bundle ID, display name và minimum OS đã được cập nhật theo phê duyệt. Icon vẫn là template và production signing chưa được cấu hình; hai việc này chuyển sang release preparation.

### Tests

- `test/app/router_guard_test.dart`
- `test/core/config/app_environment_test.dart`
- `test/core/config/native_network_config_test.dart`
- `test/core/network/api_envelope_test.dart`
- `test/core/logging/safe_logger_test.dart`
- `test/core/theme/app_theme_test.dart`
- `test/core/widgets/foundation_widgets_test.dart`
- Xóa counter template test không còn phù hợp.

## 3. Dependency đã cài và khóa

| Dependency | Phiên bản resolve | Vai trò |
|---|---:|---|
| `flutter_riverpod` | 2.6.1 | State management và DI |
| `go_router` | 17.2.3 | Navigation và guard |
| `dio` | 5.11.1 | HTTP client |
| `json_annotation` | 4.9.0 | JSON annotations |
| `flutter_secure_storage` | 10.3.4 | Nền tảng secure storage cho F1 |
| `flutter_localizations` | Flutter SDK | Localization |
| `intl` | 0.20.2 | Locale/formatting |
| `build_runner` | 2.15.1 | Code generation |
| `json_serializable` | 6.11.2 | JSON code generation |

Các phiên bản mới hơn yêu cầu Dart/Flutter mới hơn hoặc xung đột analyzer với `flutter_test` của Flutter 3.35.1. Lockfile phản ánh bộ phiên bản đã resolve và build thực tế.

### Compatibility với minimum OS đã phê duyệt

| Thành phần | Yêu cầu xác minh | Cấu hình app | Kết luận |
|---|---|---|---|
| Flutter 3.35.1 | Android minimum mặc định 24; hỗ trợ iOS 13+ | Android 24, iOS 15 | Tương thích |
| `flutter_secure_storage` 10.3.4 | Flutter ≥3.19, Dart ≥3.3 | Flutter 3.35.1, Dart 3.9.0 | Tương thích |
| Secure storage Android plugin | minSdk 23 | minSdk 24 | Tương thích |
| `flutter_secure_storage_darwin` 0.3.2 | iOS deployment target 12 | iOS 15 | Tương thích |
| `path_provider_foundation` 2.5.1 | iOS deployment target 13 | iOS 15 | Tương thích |
| Riverpod/go_router/Dio | Không có native minimum cao hơn trong dependency graph đã resolve | Android 24, iOS 15 | Tương thích |

Không dependency nào buộc phải nâng phiên bản hoặc nâng minimum OS.

## 4. Kết quả kiểm thử thực tế

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `flutter doctor -v` | Flutter 3.35.1 stable, Dart 3.9.0; Android SDK 36.1.0; có emulator API 36 |
| `flutter pub get` | **PASS** |
| `dart run build_runner build` | **PASS**, sinh JSON serializers |
| `flutter gen-l10n` | **PASS** |
| `dart format .` | **PASS** trước build; source đã được format |
| `dart format lib test` | **PASS**, 41 file, 0 file cần đổi ở lần cuối |
| `flutter analyze` | **PASS**, no issues found |
| `flutter test` | **PASS**, 23/23 tests |
| Responsive widget tests | **PASS**, phone 320×568 và tablet 1024×768 |
| `flutter build apk --debug` | **PASS**, tạo `build/app/outputs/flutter-apk/app-debug.apk` |
| APK package inspection | **PASS**, package `vn.cgfoodtour.admin`, MainActivity đúng namespace |
| APK SDK inspection | **PASS**, minSdk 24, target/compile SDK giữ nguyên 36 |
| APK display name inspection | **PASS**, `CG FoodTour Admin` |
| APK font inspection | **PASS**, Plus Jakarta Sans TTF có trong Flutter assets |
| iOS source inspection | **PASS**, bundle ID, display name, deployment target và Podfile đồng bộ |
| iOS build | **NOT RUN** — không có macOS/Xcode |

Sau khi Gradle build, một lần chạy lại `dart format .` gặp `PathNotFoundException` khi công cụ quét thư mục trung gian `build/.../.transforms` đã bị Gradle dọn. Source không bị ảnh hưởng; `dart format lib test`, analyze và tests sau đó đều PASS.

## 5. Lỗi/giới hạn còn tồn tại

- `flutter doctor` báo Android `cmdline-tools` còn thiếu và trạng thái Android licenses chưa xác định. APK debug vẫn build thành công, nhưng nên hoàn thiện toolchain trước CI/release.
- Visual Studio thiếu một số C++ component; không thuộc phạm vi Android/iOS Admin hiện tại.
- iOS configuration chỉ được kiểm tra bằng source/test trên Windows; `pod install` và Xcode build chưa chạy.
- Plus Jakarta Sans chính thức chỉ có weight 200–800; các token w900 trong blueprint dùng ExtraBold 800 để tránh synthetic/out-of-range weight.
- Chưa có authentication/cookie transport/interceptor/session bootstrap thật; đây là F1 và cố ý chưa triển khai.
- Staging/production URL và CSRF Origin phải được cấp qua `--dart-define`; không có endpoint hoặc secret phát hành hardcode.
- App icon vẫn là Flutter template và production signing chưa cấu hình; chuyển sang release preparation.

## 6. Quyết định và cấu hình đã áp dụng

1. **DEC-05 APPROVED:** Android API 24, iOS 15.0, responsive tablet cơ bản.
2. **DEC-06 APPROVED:** Android/iOS identifier `vn.cgfoodtour.admin`, display name `CG FoodTour Admin`.
3. **F0-DEC-FONT APPROVED:** Plus Jakarta Sans bundle offline cùng OFL 1.1.

Giá trị sau finalization:

- Android application ID/namespace: `vn.cgfoodtour.admin`.
- iOS bundle ID: `vn.cgfoodtour.admin`.
- iOS deployment target: 15.0.
- Android minimum SDK: 24.
- Display name: `CG FoodTour Admin`.
- Android Release hiện vẫn tham chiếu debug signing mặc định của project template.

Trước F1 vẫn cần phê duyệt/chuẩn bị DEC-01 và CSRF Origin theo môi trường (DEC-07); đây không phải blocker của F0.

## 7. Đánh giá F0

**PASS**

Foundation, cấu hình native đã phê duyệt, font/license, responsive tests, analyze và Android debug build đều có bằng chứng thực tế. Không còn blocker bắt buộc trong phạm vi F0. iOS build là NOT RUN do không có macOS/Xcode, không được tuyên bố PASS; source configuration đã được kiểm tra và cần được build ở release preparation/F1 device setup khi có Mac.

## 8. Điều kiện để bắt đầu F1

- F0 được Product Owner nghiệm thu.
- Phê duyệt DEC-01: thử contract cookie/CSRF/Origin hiện tại trước, dừng và báo cáo nếu không tương thích native.
- Cấp Origin chính xác cho local/staging và cập nhật backend allowlist ngoài task Flutter nếu cần.
- Có backend local/rehearsal, database không phải production và tài khoản dùng một lần: Admin, USER, Admin disabled.
- Hoàn thiện Android command-line tools/licenses; có Android emulator/device.
- Có staging HTTPS để kiểm tra Secure `__Host-` cookies; có macOS/iOS simulator nếu cần xác nhận iOS trong F1.

**Dừng tại F0. Không bắt đầu F1.**
