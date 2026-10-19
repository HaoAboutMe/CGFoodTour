# Blueprint 08 — Backup and Restore Readiness

> Trạng thái: PROPOSED — bắt buộc trước public release  
> Ưu tiên: P0 vận hành  
> Phạm vi duy nhất: sao lưu và phục hồi dữ liệu

## 1. Mục tiêu

Đảm bảo mất máy chủ, hỏng database hoặc deploy sai không đồng nghĩa mất toàn bộ dữ liệu người dùng.

## 2. Chính sách đề xuất

- Backup database hằng ngày.
- Lưu ngoài application host/failure domain.
- Retention tối thiểu: 7 bản ngày và 4 bản tuần.
- Mã hóa khi truyền và khi lưu nếu provider hỗ trợ.
- Ghi checksum, kích thước, thời gian bắt đầu/kết thúc.
- Không coi backup đáng tin cho tới khi restore thành công.

## 3. Các bước triển khai

### B1. Backup job

- Dùng DB user chỉ có quyền cần thiết.
- Tạo dump nhất quán theo MySQL engine/config.
- Nén, checksum và upload off-host.
- Không ghi password vào command history/log.
- Job fail phải có exit code và alert.

### B2. Retention

- Áp dụng lifecycle ở off-host storage.
- Không xóa bản cuối cùng khi job mới thất bại.
- Theo dõi dung lượng và chi phí.

### B3. Restore rehearsal

- Tải một bản backup ngẫu nhiên.
- Xác minh checksum.
- Restore vào database cách ly.
- Chạy Flyway validate/Hibernate validate.
- Chạy row count và smoke nghiệp vụ.
- Ghi RTO/RPO thực tế.

### B4. Disaster procedure

- Quy định ai được phép restore.
- Đưa app vào maintenance/read-only.
- Chốt recovery point và dữ liệu có thể mất.
- Restore, validate, mở traffic có kiểm soát.
- Lập incident record.

## 4. Tiêu chí hoàn thành

- [ ] Backup tự động chạy thành công.
- [ ] Bản sao nằm ngoài application host.
- [ ] Retention hoạt động.
- [ ] Restore rehearsal thành công.
- [ ] Backend khởi động với database phục hồi.
- [ ] RTO/RPO được ghi nhận.
- [ ] Có alert khi backup thất bại hoặc quá hạn.

