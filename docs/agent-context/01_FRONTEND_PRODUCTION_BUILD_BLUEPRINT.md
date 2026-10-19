# Blueprint 01 — Frontend Production Build Contract

> Trạng thái: IMPLEMENTED — kiểm thử local đạt; chờ xác nhận OAuth trên staging  
> Ưu tiên: P0 — chặn public release  
> Phạm vi duy nhất: cách frontend nhận cấu hình và tạo production artifact

## 1. Mục tiêu

Tạo một frontend artifact xác định, có thể tái tạo và không phụ thuộc file `.env` trên máy người build. Bundle production phải dùng same-origin `/api`, chứa đúng public OAuth client ID và tuyệt đối không chứa localhost hoặc placeholder.

## 2. Vì sao cần làm

Vite đóng gói biến `VITE_*` tại build time. Build local hiện có thể đọc `frontend/.env` và đưa `http://localhost:8080/api` vào bundle; Docker lại loại `.env`, khiến OAuth ID có thể rơi về placeholder. Backend runtime environment không thể sửa các giá trị đã nằm trong JavaScript bundle.

## 3. Ngoài phạm vi

- Không thay đổi logic xác thực Google/Facebook phía backend.
- Không chuyển social SDK sang lazy-load.
- Không cấu hình TLS hoặc CSP; nội dung đó thuộc Blueprint 02.

## 4. Thiết kế đích

- Production luôn gọi API bằng `/api` khi frontend/backend cùng origin.
- `VITE_GOOGLE_CLIENT_ID` và `VITE_FACEBOOK_APP_ID` được truyền bằng Docker build arguments hoặc secret-aware CI build variables.
- Không có OAuth secret trong frontend; chỉ public client/app ID được phép xuất hiện.
- Build dừng ngay nếu thiếu ID bắt buộc hoặc phát hiện placeholder.
- Artifact được build một lần và deploy nguyên trạng, không rebuild tùy tiện trên server.

## 5. Các bước triển khai

### B1. Chuẩn hóa biến

- Tạo `frontend/.env.production.example` chỉ chứa biến frontend.
- Không đặt `VITE_API_BASE_URL=http://localhost...` trong production example.
- Chốt contract:
  - development: URL backend local;
  - rehearsal/production same-origin: `/api`;
  - OAuth IDs: bắt buộc tại build time.

### B2. Fail-fast trong source/build

- Tạo module cấu hình frontend tập trung thay vì đọc `import.meta.env` rải rác.
- Khi `PROD`, từ chối chuỗi rỗng, `YOUR_*`, URL localhost hoặc API không cùng origin nếu topology không cho phép.
- Không log giá trị token hoặc credential khi validation lỗi.

### B3. Docker build contract

- Khai báo `ARG VITE_GOOGLE_CLIENT_ID` và `ARG VITE_FACEBOOK_APP_ID` trong frontend Dockerfile.
- Chuyển `ARG` thành `ENV` chỉ trong build stage.
- Compose/release job truyền giá trị rõ ràng.
- Không copy `.env` local vào image context.

### B4. Artifact inspection

- Thêm script quét `dist` sau build.
- Fail nếu tìm thấy:
  - `localhost:8080`;
  - `YOUR_GOOGLE_CLIENT_ID`;
  - `YOUR_FB_ID`/`YOUR_FACEBOOK_APP_ID`;
  - refresh/access token mẫu hoặc secret.
- CI chạy bước kiểm tra ngay sau `npm run build`.

## 6. File dự kiến thay đổi

- `frontend/Dockerfile`
- `frontend/.env.example`
- `frontend/.env.production.example`
- `frontend/src/config/*` hoặc module tương đương
- `frontend/src/App.jsx`
- `frontend/package.json`
- `.github/workflows/ci.yml`
- `compose.rehearsal.yml`

## 7. Kiểm thử bắt buộc

- Build sạch khi không có `frontend/.env` nhưng có build args hợp lệ.
- Build fail khi thiếu từng OAuth public ID.
- Quét bundle xác nhận không có localhost/placeholder.
- Mở artifact sau Nginx và xác nhận request đi tới `/api`.
- Google/Facebook button initialize bằng đúng ID staging.
- Development local vẫn gọi backend local như trước.

## 8. Tiêu chí hoàn thành

- [ ] CI tạo được production bundle từ clean checkout.
- [ ] Bundle không chứa localhost hoặc placeholder.
- [ ] Docker build nhận đầy đủ public OAuth IDs.
- [ ] Không có OAuth secret trong image/bundle.
- [ ] Social login staging đi qua đúng provider application.
- [ ] Có tài liệu phân biệt build-time và runtime variables.

## 9. Rollback

Giữ image digest frontend trước đó. Nếu contract mới làm social login lỗi, rollback frontend image; không thay backend/database trong batch này.

## 10. Kết quả triển khai ngày 19/10/2026

- Đã tập trung cấu hình public vào `src/config/frontendConfig.js`; production luôn dùng same-origin `/api`.
- Vite fail-fast khi thiếu Google/Facebook public ID, còn placeholder hoặc cấu hình API production khác `/api`.
- Docker/Compose và CI truyền public OAuth ID rõ ràng tại build time; không đưa OAuth secret vào frontend.
- Đã thêm bước quét artifact sau build để chặn localhost và placeholder.
- `npm run build`, ba test build-contract và toàn bộ utility test frontend đều đạt.
- Còn phải xác nhận Google/Facebook login bằng application ID thật trên domain HTTPS staging; đây là kiểm thử môi trường, không cần thay đổi source contract.

