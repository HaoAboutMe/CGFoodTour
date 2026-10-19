# Blueprint 02 — Nginx Edge Security and Proxy Contract

> Trạng thái: IMPLEMENTED — static contract đạt; chờ runtime verification trên staging  
> Ưu tiên: P0 — chặn public release  
> Phạm vi duy nhất: Nginx phục vụ SPA và reverse proxy `/api`

## 1. Mục tiêu

Đảm bảo Nginx trả đúng security headers cho mọi HTML/SPA route, proxy API/SSE đúng semantics, giới hạn upload đồng nhất và truyền client IP an toàn.

## 2. Vì sao cần làm

`add_header` trong location có thể làm mất header được khai báo ở server level. CSP hiện chưa khớp các font/ảnh/tài nguyên thực tế. `$proxy_add_x_forwarded_for` cũng không phù hợp nếu Nginx là proxy tin cậy duy nhất và backend giới hạn số forwarded hop.

## 3. Ngoài phạm vi

- Không thay đổi Vite build variables.
- Không cấu hình business rate limit trong Java.
- Không chọn nhà cung cấp DNS/CDN; Blueprint 06 xử lý staging HTTPS.

## 4. Thiết kế đích

- Security headers xuất hiện trên `/`, `/index.html`, deep-link và error response phù hợp.
- CSP chỉ cho phép nguồn thực sự cần thiết.
- Nginx sole-proxy ghi đè client-supplied forwarding header; multi-proxy phải có trust chain riêng.
- SSE không buffering và có timeout phù hợp.
- Upload limit lớn hơn hoặc bằng backend request limit.

## 5. Các bước triển khai

### B1. Header inheritance

- Tách security headers thành include dùng chung hoặc lặp lại có chủ đích trong location.
- Kiểm tra `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` trên HTML.
- Cache policy:
  - hashed assets: immutable;
  - `index.html`: no-cache;
  - không để cache header làm mất security header.

### B2. CSP inventory

- Liệt kê script, frame, connect, image, style và font origin thực tế.
- Ưu tiên self-host font/ảnh fallback để giảm allowlist.
- Giữ Google/Facebook SDK tĩnh.
- Không thêm wildcard rộng như `https:` hoặc `*`.
- Triển khai CSP trên staging, kiểm tra console rồi mới enforce production.

### B3. Forwarded headers

- Nếu chỉ có một Nginx public: dùng `$remote_addr` cho `X-Forwarded-For`.
- Nếu có Cloudflare/load balancer: cấu hình `set_real_ip_from`, `real_ip_header` và danh sách CIDR chính thức.
- Đồng bộ `TRUSTED_PROXY_CIDRS` và `MAXIMUM_FORWARDED_HOPS` ở backend.
- Xóa/ghi đè header do client tự gửi tại trust boundary.

### B4. Upload và proxy

- Đặt `client_max_body_size` theo contract Blueprint 03.
- Chuẩn hóa proxy timeout cho API upload.
- Giữ `proxy_buffering off`, `proxy_cache off` và HTTP/1.1 cho SSE.
- Trả lỗi 413 có thể được frontend chuyển thành thông báo tiếng Việt.

### B5. TLS-edge assumptions

- Nhận `X-Forwarded-Proto` chỉ từ proxy tin cậy.
- HTTP public phải redirect sang HTTPS tại edge ngoài cùng.
- Không public trực tiếp backend port hoặc MySQL port.

## 6. File dự kiến thay đổi

- `frontend/nginx.conf`
- `compose.rehearsal.yml`
- tài liệu deployment liên quan proxy/TLS
- backend proxy properties nếu contract thay đổi

## 7. Kiểm thử bắt buộc

- `curl -I` cho `/`, `/index.html`, `/quan/{id}/{slug}` và asset.
- Browser không có CSP violation ngoài các nguồn đã chấp nhận.
- Font, ảnh fallback, social SDK và API đều tải được.
- Gửi forged `X-Forwarded-For`; backend vẫn nhận IP theo trust policy.
- SSE kết nối, nhận heartbeat và reconnect.
- Upload ngay dưới giới hạn thành công; vượt giới hạn trả lỗi dự kiến.

## 8. Tiêu chí hoàn thành

- [ ] Security headers có trên mọi HTML response.
- [ ] CSP enforce không phá giao diện/social login.
- [ ] Client không spoof được địa chỉ dùng cho rate limit.
- [ ] SSE không buffering.
- [ ] Upload limit khớp backend.
- [ ] Chỉ 80/443 public ở topology hosting.

## 9. Rollback

Lưu Nginx config/image trước đó. Validate config trước reload; nếu health/deep-link/social SDK lỗi, rollback Nginx image mà không thay database.

## 10. Kết quả triển khai ngày 19/10/2026

- Đã tách security headers/CSP thành snippet dùng chung và áp dụng lại tại các location có cache header riêng.
- Đã cập nhật CSP theo inventory hiện có: OAuth SDK, Google Fonts, Cloudinary, ảnh fallback, Leaflet tile và Photon API.
- Nginx ghi đè `X-Forwarded-For` bằng `$remote_addr` tại sole-proxy boundary; không nối header do client gửi.
- Đã đồng bộ request limit 3 MB, trả JSON 413/code `1019`, giữ SSE không buffering và đặt proxy timeout cho API.
- Ba test Nginx contract và `docker compose config --quiet` đều đạt.
- Chưa chạy `nginx -t`, curl header, SSE và upload thật vì máy hiện không có Nginx và Docker daemon chưa hoạt động. Các mục này phải được xác nhận ở Blueprint 06/07 trước public release.

