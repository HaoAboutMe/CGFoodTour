# Blueprint 06 — Staging HTTPS Environment

> Trạng thái: PROPOSED — thực hiện sau local rehearsal  
> Ưu tiên: P0 release gate  
> Phạm vi duy nhất: dựng môi trường staging gần giống production

## 1. Mục tiêu

Có một domain HTTPS thật để kiểm chứng secure cookie, reverse proxy, OAuth origins/callback, CSP, SSE và deep-link trong điều kiện gần production.

## 2. Kiến trúc đích

```text
Internet → DNS/TLS edge → Nginx frontend + /api proxy
                         → 01 Spring Boot instance
                         → private MySQL
```

- Chỉ 80/443 public.
- Backend và MySQL không public trực tiếp.
- Frontend/API cùng origin.
- Chỉ một backend replica.

## 3. Các bước triển khai

### S1. Hạ tầng và domain

- Tạo staging subdomain riêng.
- Cấp chứng chỉ TLS hợp lệ và auto-renew.
- Bật redirect HTTP → HTTPS.
- Giới hạn SSH theo key/IP; tắt password login nếu phù hợp.

### S2. Secret/config

- Lưu secret ngoài Git và Docker image.
- Tạo JWT/OTP/registration secrets độc lập.
- Dùng OAuth staging application/origin riêng khi provider hỗ trợ.
- Cấu hình exact CORS origin và trusted proxy CIDR.

### S3. Database/network

- MySQL dùng private network/firewall.
- Chạy migration theo Blueprint 05.
- Không dùng `ddl-auto=update`.
- Tạo application DB user với quyền tối thiểu phù hợp migration/runtime policy.

### S4. Deploy

- Deploy immutable image digest.
- Chạy migration trước application startup.
- Chờ readiness `UP` rồi mới mở traffic.
- Ghi release commit, image digest và config version.

### S5. Smoke

- Homepage/deep-link/API/health.
- Secure refresh cookie và CSRF.
- OAuth redirect/origin.
- SSE heartbeat.
- Upload và email.

## 4. Tiêu chí hoàn thành

- [ ] HTTPS hợp lệ và HTTP redirect.
- [ ] Không public backend/MySQL port.
- [ ] Cookie có `HttpOnly`, `Secure`, `SameSite` và path đúng.
- [ ] OAuth staging origin/callback hợp lệ.
- [ ] CSP không có violation ngoài dự kiến.
- [ ] Readiness điều khiển deploy thành công.
- [ ] Deep-link reload không trả Nginx 404.
- [ ] Release có digest và rollback target.

## 5. Rollback

Rollback về image digest trước; chỉ restore database khi migration không tương thích và đã làm theo runbook phục hồi.

