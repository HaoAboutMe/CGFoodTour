# Development Guide

## 1. Prerequisites đã xác minh

- Backend target Java 17; Maven Wrapper đi kèm (wrapper 3.9.12 được quan sát trên máy phân tích).
- Frontend lockfile Vite 8 yêu cầu Node `^20.19.0 || >=22.12.0`; dùng npm và `package-lock.json`.
- MySQL runtime; H2 chỉ test.
- External credentials/config cho JWT, mail, Cloudinary, Google/Facebook.

Không dùng README cũ nói Node 18 như nguồn duy nhất.

## 2. Backend local

1. Copy `backend/src/main/resources/application-dev.yaml.example` thành file local `application-dev.yaml` (file thật bị gitignore).
2. Cấu hình datasource MySQL và các property bắt buộc. Chỉ nêu tên, không commit giá trị:
   - `spring.datasource.url|username|password`
   - `spring.mail.username|password`
   - `jwt.signerKey|valid-duration|refreshable-duration`
   - `app.admin.default-email|default-password`
   - `app.google.client-id`
   - `app.facebook.app-id|app-secret`
   - `cloudinary.cloud-name|api-key|api-secret|folder|default-avatar-url`
   - `app.cors.allowed-origins`, `app.base-url`
3. Chạy từ `backend/`: Windows `./mvnw.cmd spring-boot:run`; Unix `./mvnw spring-boot:run`.
4. Context path mặc định: `http://localhost:8080/api`.

Dev template bật Hibernate `ddl-auto=update`: thao tác này có thể đổi schema. Không chạy vào DB chứa dữ liệu quan trọng. Production dùng `validate` và cần schema đã có.

## 3. Frontend local

1. Từ `frontend/`, dùng `npm ci` khi cần install reproducible từ lockfile (chưa chạy trong đợt phân tích).
2. Tạo `.env` local từ `.env.example`:
   - `VITE_API_BASE_URL`
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_FACEBOOK_APP_ID`
3. `npm run dev`; Vite mặc định thường là port 5173, và CORS backend đã whitelist localhost:5173.
4. `npm run lint`, `npm run build`, `npm run preview` là scripts được xác minh từ `package.json`.

## 4. Production config

Profile `prod` dùng các env names:

- `SPRING_PROFILES_ACTIVE=prod`
- `PORT` hoặc `SERVER_PORT`
- `SPRING_DATASOURCE_URL|USERNAME|PASSWORD`
- `SPRING_DATASOURCE_HIKARI_MAX_POOL_SIZE|MIN_IDLE`
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (default validate)
- `SPRING_MAIL_HOST|PORT|USERNAME|PASSWORD`
- `APP_BASE_URL`, `APP_CORS_ALLOWED_ORIGINS`
- `APP_ADMIN_DEFAULT_EMAIL|PASSWORD`
- `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID|APP_SECRET`
- `JWT_SIGNER_KEY|VALID_DURATION|REFRESHABLE_DURATION`
- `CLOUDINARY_CLOUD_NAME|API_KEY|API_SECRET|FOLDER|DEFAULT_AVATAR_URL`

Swagger disabled ở master/prod. Không có deployment file thực thi trong repo.

## 5. Commands và trạng thái xác minh

| Command | Trạng thái |
|---|---|
| `npm run lint` | Đã chạy 15/10/2026; exit 0, có warnings |
| `npm run build` | Chưa chạy; sandbox không cho build/write artifact |
| `./mvnw.cmd test` | Bị sandbox từ chối trước khi chạy |
| `./mvnw.cmd spring-boot:run` | Không chạy; cần DB/credentials và có side effects seed/schema |
| DB migration | Không có command/tool migration trong repo |

Không tuyên bố build/test pass.

## 6. Checklist sau thay đổi

### API/backend

- Compile/test trong môi trường được phép.
- Test public/auth/admin/owner/other-user cho endpoint liên quan.
- Test validation, status, error envelope và object ownership.
- So contract với `App.jsx` payload/response.
- Kiểm transaction, child rows, audit, SSE/email side effects.
- Nếu entity đổi: migration up/down/rollback + production-like MySQL integration test.

### Frontend

- `npm run lint` và `npm run build`.
- Test direct URL/reload cho từng route; anonymous/token expired/USER/ADMIN.
- Test loading/empty/error/success, mobile/desktop.
- Kiểm request body và response fields với backend.
- Không đưa password/token/OTP vào log/toast.

### Security

- Không dựa vào hidden button/route.
- Test 401 vs 403, revoked/expired token, ownership IDOR.
- Validate upload và external URL.
- Kiểm CORS origin và secret không vào Git/bundle/log.

## 7. Known setup traps

- Frontend registration hiện hỏng; xem `KNOWN_ISSUES.md`.
- `application-dev.yaml` không tồn tại trong Git.
- Vite 8 cần Node mới hơn README.
- Production DB không có migration để bootstrap.
- Backend static `index.html` là legacy developer console, không phải React build.
- BrowserRouter production cần fallback về `frontend/index.html`.

