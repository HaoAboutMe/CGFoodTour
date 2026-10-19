# Blueprint 05 — Existing Database Migration Rehearsal

> Trạng thái: PROPOSED — chờ bản backup/snapshot database  
> Ưu tiên: P0 — bảo vệ dữ liệu  
> Phạm vi duy nhất: baseline/upgrade database hiện hữu sang Flyway

## 1. Mục tiêu

Xây dựng đường nâng cấp có thể lặp lại từ database hiện tại sang schema do Flyway quản lý mà không mất hoặc làm sai dữ liệu.

## 2. Nguyên tắc an toàn

- Không thử lần đầu trên database duy nhất.
- Không bật `baselineOnMigrate=true` vô điều kiện.
- Không sửa trực tiếp `flyway_schema_history` khi chưa review schema.
- Ưu tiên forward-fix; không dựa vào destructive down migration.

## 3. Quy trình

### D1. Chụp trạng thái nguồn

- Tạo backup nhất quán và checksum.
- Xuất inventory từ `information_schema`: table, column, type, nullability, index, FK, charset/collation.
- Ghi MySQL version và SQL mode.
- Đếm record các bảng nghiệp vụ chính.

### D2. Restore cách ly

- Restore backup vào MySQL rehearsal riêng.
- Không cho rehearsal kết nối Cloudinary/SMTP production.
- Xác nhận row count và sample integrity trước migration.

### D3. Schema comparison

- So sánh schema restored với `V1__baseline_schema.sql` và JPA entities.
- Phân loại:
  - tương thích để baseline;
  - cần migration bổ sung;
  - drift nguy hiểm cần quyết định dữ liệu.
- Review enum, timestamp, decimal/double, unique constraint và FK xóa user/store.

### D4. Baseline có kiểm soát

- Chỉ baseline nếu schema thực sự tương đương version đã chọn.
- Nếu không tương đương, tạo migration bridge có version mới.
- Chạy `flyway validate`, `migrate`, rồi Hibernate `validate`.

### D5. Data verification

- So sánh row count trước/sau.
- Kiểm tra user/roles, store owner/status, food items, rating, saved stores, audit và token.
- Chạy smoke API đọc/ghi.
- Chạy concurrency test rating/bookmark trên MySQL thật.

### D6. Production cutover plan

- Chốt backup point, maintenance/read-only nếu cần.
- Chạy migration job một lần trước app startup.
- Nếu migration fail: không khởi động app mới.
- Nếu app fail sau migration: dùng image tương thích hoặc forward-fix; restore chỉ khi có quyết định sự cố rõ ràng.

## 4. Bằng chứng cần lưu

- Backup checksum và restore log.
- Schema diff đã review.
- Flyway info/validate output.
- Row-count report trước/sau.
- Hibernate validate và regression result.
- Quyết định baseline/version có người duyệt.

## 5. Tiêu chí hoàn thành

- [ ] Greenfield database dựng được từ source.
- [ ] Snapshot hiện hữu restore thành công.
- [ ] Schema diff không còn mục chưa quyết định.
- [ ] Flyway và Hibernate validate pass.
- [ ] Dữ liệu nghiệp vụ được bảo toàn.
- [ ] Có cutover và rollback/forward-fix procedure.

