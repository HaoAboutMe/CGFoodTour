# Agent Guidelines cho Cần Giuộc Food Tour

## 1. Quy tắc đã xác minh cần tôn trọng

- Backend hiện theo luồng Controller → Service → Repository/Entity và dùng DTO + MapStruct. Không đưa business rule mới trực tiếp vào controller nếu service đang là owner của rule.
- Authorization object-level của Store/Food phải giữ owner/admin checks ở backend.
- Public visibility chỉ dành cho APPROVED store; thay đổi StoreResponse/list phải xem cả owner/admin/public branch.
- API success dùng `ApiResponse`; error dùng `ErrorCode`/global handler.
- Frontend API orchestration hiện tập trung ở `App.jsx`; thay API phải cập nhật call site, request/response DTO và context docs cùng lúc.
- UI route guard không thay backend authorization.
- Store có nhiều child table/counter/audit; không xóa/sửa entity đơn lẻ mà bỏ qua chúng.

## 2. File phải đọc trước theo feature

| Feature | Bắt buộc đọc |
|---|---|
| Auth/session | `SecurityConfig`, `CustomJwtDecoder`, `AuthenticationService`, auth DTO, `App.jsx` request/refresh handlers, `AuthModal` |
| Registration/user | `UserController`, `UserService`, User entity/DTO/mapper/repositories, `App.jsx`, `ProfileSection` |
| Store lifecycle | `StoreController`, toàn bộ `StoreService`, Store entity/DTO/mapper, child repositories, `App.jsx`, `MyStoresSection`, `AdminSection` |
| Food | `FoodItemController/Service/Entity/DTO/Mapper`, Store ownership logic, MyStores UI |
| Rating/report/save | `StoreService`, corresponding entity/repository/DTO, drawer/App/Saved UI |
| Category | Category stack, Store FK, Admin UI, category icon components |
| Upload/avatar | Upload/User controller+service, Cloudinary config/service, UI uploader |
| Database | `DATABASE_REFERENCE.md`, entity/repository/config và schema production/migrations khi có |
| Deployment | application configs + `ORACLE_CLOUD_DEPLOYMENT_PLAN.md`, nhưng phân biệt plan với artifacts thật |

## 3. API change rules

- Xác minh full path gồm `/api` context và class/method mapping.
- Cập nhật backend DTO validation, service logic, frontend payload/field reads và [API_REFERENCE.md](API_REFERENCE.md).
- Không thêm response entity trực tiếp nếu đang dùng DTO; tránh lộ password, token, internal ID/PII.
- Giữ backward compatibility hoặc ghi breaking change rõ; hiện registration đã có mismatch cần ưu tiên sửa có test.
- HTTP status/error code phải nhất quán; không đưa DB/external exception raw ra client.

## 4. Database rules

- Không thay production schema/data khi chưa được phép rõ ràng.
- Trước entity change, yêu cầu/thiết kế migration versioned; repository hiện chưa có migration framework.
- Kiểm unique/FK/cascade/index bằng schema thật, không chỉ suy ra annotation.
- Với counter rating/save, xem xét concurrency/locking/reconciliation.
- Giữ audit sau hard-delete nếu mục tiêu audit được xác nhận.

## 5. Authentication/security rules

- Không in/commit secret, JWT, password, OTP, verification token, private key.
- Không tin role/owner từ request body; lấy principal server-side.
- Mọi external URL fetch phải chống SSRF; mọi upload phải có quota/size/type/ownership.
- Token contract/revocation/expiry phải được test ở filter và service.
- OAuth account linking cần xác minh provider token audience/app/email verification.
- Rate limit các public auth/email/reset endpoint trước production.

## 6. Testing rules

- Repository hiện không có automated tests; feature mới/sửa bug nên thêm test đúng layer.
- Ưu tiên: auth/security integration, store state/ownership matrix, registration contract, rating/report uniqueness/concurrency, delete/audit, frontend API compatibility.
- Chỉ tuyên bố pass khi lệnh thật đã chạy và ghi command/result.
- Build/test có thể tạo artifact nhưng không được chạm DB production/external service; mock/isolated profile.

## 7. Thao tác phải hỏi trước

- Migration/schema/data mutation; seed/reset/drop/truncate.
- Thay secret/config environment dùng thật.
- Dependency install/upgrade lớn, framework migration.
- Deploy, cloud resource, email thật, Cloudinary cleanup, OAuth console change.
- Destructive delete/rename hàng loạt hoặc thay public API breaking.

## 8. Hành động bị cấm khi chưa được phép

- Log hoặc đưa secret/PII vào tài liệu.
- Dùng production DB để test.
- Bỏ qua backend authorization vì UI đã ẩn action.
- Dùng `ddl-auto=update/create/drop` trên production.
- Ghi đè README/plan/context cũ không đối chiếu.
- Sửa unrelated dirty/untracked files (`scripts/` đang untracked tại thời điểm phân tích).

## 9. Đề xuất mới, chưa phải convention hiện hành

- Tách frontend API client/auth store/feature hooks khỏi `App.jsx`.
- Tách `StoreService` thành lifecycle, query, engagement và map parsing services.
- Thêm Flyway, testcontainers/MySQL integration, OpenAPI contract test.
- Tạo public/private/admin response DTO riêng.
- Dùng outbox/retry cho email/event và structured audit.

Các đề xuất chỉ được áp dụng sau khi user chấp thuận phạm vi/refactor.

