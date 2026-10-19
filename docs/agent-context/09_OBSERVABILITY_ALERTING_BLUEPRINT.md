# Blueprint 09 — Observability and Alerting

> Trạng thái: PROPOSED — bắt buộc trước public release  
> Ưu tiên: P0/P1 vận hành  
> Phạm vi duy nhất: phát hiện, chẩn đoán và cảnh báo sự cố

## 1. Mục tiêu

Biết ứng dụng có đang hoạt động không, lỗi ở đâu và request nào liên quan trước khi người dùng phải báo lỗi thủ công.

## 2. Tín hiệu bắt buộc

- Availability/readiness.
- HTTP request rate, 4xx/5xx và latency.
- Hikari pool/database connectivity.
- JVM memory/CPU/thread.
- Email success/failure/retry.
- SSE connection count/rejection.
- Media cleanup pending/dead.
- Disk usage và backup freshness.

## 3. Các bước triển khai

### O1. Health monitoring

- External uptime monitor gọi public readiness URL.
- Tần suất hợp lý, có retry tránh false alarm.
- Alert khi liên tiếp `DOWN`, timeout hoặc TLS hết hạn gần kề.

### O2. Metrics collection

- Chọn Prometheus-compatible scraper hoặc dịch vụ hosted.
- Không dùng access JWT admin 15 phút làm credential scrape dài hạn.
- Bảo vệ metrics bằng private network, mTLS hoặc dedicated service auth.
- Chỉ thu thập metric cần thiết; tránh label cardinality cao/email/user ID.

### O3. Structured logs

- Giữ request correlation ID.
- Không log password, OTP, JWT, cookie, OAuth token hoặc verification link đầy đủ.
- Log rotation/retention và disk cap.
- Đồng bộ timezone/timestamp UTC hoặc offset rõ ràng.

### O4. Alerts

- Backend/readiness down.
- 5xx rate tăng.
- P95 latency vượt ngưỡng.
- DB pool gần cạn.
- Email failure tăng.
- Backup quá hạn/thất bại.
- Disk/memory vượt ngưỡng kéo dài.

### O5. Incident drill

- Giả lập backend down, DB down và SMTP failure.
- Xác nhận alert đến đúng kênh/người.
- Dùng correlation ID tìm log.
- Cập nhật incident runbook sau diễn tập.

## 4. Tiêu chí hoàn thành

- [ ] Uptime monitor hoạt động qua HTTPS.
- [ ] Metrics scraper không phụ thuộc admin JWT ngắn hạn.
- [ ] Dashboard có availability, 5xx, latency, DB, email và JVM.
- [ ] Log có correlation ID và retention.
- [ ] Không phát hiện secret trong sample log.
- [ ] Ít nhất một incident drill kích hoạt alert thành công.

