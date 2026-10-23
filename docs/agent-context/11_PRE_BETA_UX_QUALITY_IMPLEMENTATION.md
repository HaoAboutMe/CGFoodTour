# Blueprint 11 — Kết quả triển khai Pre-beta UX and Quality Polish

> Ngày nghiệm thu local: 22/10/2026
> Kết quả: hoàn thành phần source và local rehearsal; còn đo Lighthouse/Web Vitals trên staging HTTPS

## 1. Modal và phản hồi người dùng

- Thay native prompt/confirm khi xóa user, category và món ăn bằng `ConfirmActionModal` dùng chung.
- Xóa user yêu cầu nhập đúng username và lý do; validation được tách thành utility có unit test.
- Chuẩn hóa trạng thái loading/disabled và thông báo xác nhận bằng tiếng Việt.
- Lỗi định vị không còn dùng native alert mà hiển thị inline `role="alert"`, có nút đóng và hướng dẫn thử lại.
- Giữ JSON backend bằng tiếng Anh; toast tiếp tục đi qua error-code mapping tiếng Việt ở frontend.

## 2. React correctness

- Dọn toàn bộ warning unused import/state/prop trong phạm vi frontend.
- Sửa effect gây cập nhật state không cần thiết và dependency có nguy cơ stale closure.
- Giữ các ngoại lệ thực sự cần thiết bằng comment giải thích tại Leaflet, catalogue icon và state machine demo.
- Lint chạy với `oxlint --deny-warnings`, vì vậy warning mới làm quality gate thất bại.

## 3. Responsive và accessibility

- Thêm focus ring toàn cục cho `:focus-visible` và hỗ trợ `prefers-reduced-motion`.
- Thêm focus trap, Escape-to-close và focus restoration cho auth modal, action modal, confirm modal, account status modal, image viewer và store detail drawer.
- Store card có accessible name, nhận focus và mở bằng Enter/Space; thao tác bookmark lồng bên trong không kích hoạt mở drawer ngoài ý muốn.
- Bổ sung Playwright kiểm tra không horizontal overflow tại 320, 360, 375 và 768 px.
- Bổ sung E2E bàn phím cho đăng nhập, mở chi tiết quán và modal xóa user của admin.

## 4. Performance và asset

- Logo runtime 667.306 byte được thay bằng bản 128 px 3.690 byte và bản social 512 px 13.404 byte.
- Giữ ảnh nguồn lớn ở `frontend/assets-source` để có thể tái sinh asset, không đưa ảnh này vào production bundle.
- Thêm script `npm run optimize:assets` để tái tạo các kích thước logo bằng quy trình có thể lặp lại.
- Loại bỏ runtime fallback từ Unsplash; fallback store, food và avatar hiện là SVG self-hosted.
- Thêm lazy loading cho ảnh card/list ngoài viewport và khai báo kích thước logo để giảm layout shift.
- Nâng Vite lên 8.2.4; `npm audit` từ một lỗ hổng mức high về 0 vulnerability.

## 5. Discovery, chia sẻ và CSP

- Giữ filter/search/nearby dựa trên dữ liệu và semantics phía backend; giao diện báo lỗi GPS bằng tiếng Việt.
- Store deep link tiếp tục cập nhật title, description, canonical và Open Graph image khi mở/đóng drawer.
- Share/copy có trạng thái thành công hoặc thất bại bằng tiếng Việt.
- Tách kế hoạch SSR/prerender/sitemap sang `SEO_PRERENDER_BACKLOG.md` vì cần domain và thay đổi kiến trúc deploy riêng.
- Loại `upgrade-insecure-requests` khỏi CSP dùng chung: WebKit từng nâng asset rehearsal HTTP lên HTTPS khiến SPA trắng. Production vẫn dùng HTTPS ở edge và trình duyệt chặn mixed content; contract test ngăn directive không phù hợp quay lại.

## 6. Kết quả kiểm thử

| Nhóm kiểm thử | Kết quả |
|---|---:|
| `npm run lint` (`--deny-warnings`) | Pass, 0 warning |
| Utility/error/redaction/maps/store URL/modal validation | 10/10 pass |
| Frontend build contract | 3/3 pass |
| Nginx/CSP contract | 3/3 pass |
| Production Docker build + artifact verification | Pass |
| Chromium full rehearsal E2E | 14 pass, 1 optional deep-link fixture skip |
| WebKit UX E2E | 7 pass, 1 admin-credential test skip |
| Mobile WebKit UX E2E | 7 pass, 1 admin-credential test skip |
| Mobile Chrome UX E2E | 7 pass, 1 admin-credential test skip |
| `npm audit` | 0 vulnerability |

Optional skip không phải lỗi sản phẩm: deep-link test riêng cần `E2E_APPROVED_STORE_ID`, trong khi store lifecycle E2E đã tạo, approve và reload deep link thành công. Admin test trên các profile không nạp credential được skip theo thiết kế; cùng test này đã pass trên Chromium với tài khoản rehearsal.

## 7. Phần chưa thể đóng ở local

Lighthouse/Web Vitals phải được đo trước và sau trên cùng domain HTTPS, thiết bị và network profile. Local HTTP rehearsal không đại diện cho TLS, CDN, DNS, cache edge, Cloudinary production hoặc OAuth thật nên không được dùng để tuyên bố đạt performance staging.

Khi có staging, chạy ít nhất mobile Lighthouse cho `/explore` và một `/quan/{id}/{slug}`, lưu JSON report và so sánh LCP, CLS, INP/TBT, accessibility và SEO. Đây là release evidence còn lại của Blueprint 11, không phải lỗi source đang chặn local rehearsal.
