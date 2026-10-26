# CG FoodTour — Track A3 Execution Report: Existing Database Upgrade Rehearsal

> **Audit Track:** Track A3 — Existing MySQL Database Upgrade Rehearsal  
> **Target Issues:** `AUD-DATA-001` (Release Blocker), `AUD-DATA-002`  
> **Blueprint Reference:** `docs/project-audit/RELEASE_READINESS_BLUEPRINT.md` §3 (A3)  
> **Source Baseline Checkpoint:** `dd236ea7de8ea65591d8c28a7afd39f29cdb7630` (Track A2 Acceptance)  
> **Execution Phase:** **Phase A3-A: Read-Only Inventory & Backup Safety Assessment**  
> **Status:** **PHASE A3-A COMPLETE — SAFETY GATE AWAITING PRODUCT OWNER APPROVAL FOR A3-B REHEARSAL**  

---

## 1. Source Database Inventory (Sanitized & Read-Only)

### 1.1 Môi trường nguồn (Source Environment)
- **Database Engine / Version:** MySQL Server `9.3.0` (MySQL Community Server - GPL, Windows Service `MySQL93`, port `3306`).
- **Database Name:** `cgfoodtour` (cấu hình trong `backend/src/main/resources/application-dev.yaml`).
- **Default Character Set & Collation:** `utf8mb4` / `utf8mb4_0900_ai_ci`.
- **Flyway Schema History:** **KHÔNG TỒN TẠI** (`flyway_schema_history` table does not exist).
- **Phương thức quản trị schema trước đó:** Hibernate `ddl-auto: update` (xác nhận từ `application-dev.yaml:11` và `application.yaml:14`).

### 1.2 Thống kê bảng và số lượng bản ghi thực tế (Record Counts)
Truy vấn `COUNT(*)` trực tiếp trên toàn bộ 17 bảng thuộc schema `cgfoodtour` tại `localhost:3306`:

| STT | Bảng | Số bản ghi (COUNT) | Engine | Collation | Phân loại dữ liệu |
| :--- | :--- | :---: | :--- | :--- | :--- |
| 1 | `categories` | **8** | InnoDB | `utf8mb4_0900_ai_ci` | Danh mục món ăn / quán ăn |
| 2 | `food_items` | **5** | InnoDB | `utf8mb4_0900_ai_ci` | Món ăn thuộc quán |
| 3 | `invalidated_token` | **126** | InnoDB | `utf8mb4_0900_ai_ci` | JWT blacklist / tokens thu hồi |
| 4 | `media_cleanup_tasks` | **0** | InnoDB | `utf8mb4_0900_ai_ci` | Task dọn dẹp Cloudinary media |
| 5 | `password_reset_otp` | **4** | InnoDB | `utf8mb4_0900_ai_ci` | Mã OTP đặt lại mật khẩu |
| 6 | `permission` | **4** | InnoDB | `utf8mb4_0900_ai_ci` | Quyền hệ thống |
| 7 | `role` | **2** | InnoDB | `utf8mb4_0900_ai_ci` | Vai trò (`USER`, `ADMIN`) |
| 8 | `role_permissions` | **4** | InnoDB | `utf8mb4_0900_ai_ci` | Phân quyền vai trò |
| 9 | `store_audit_logs` | **45** | InnoDB | `utf8mb4_0900_ai_ci` | Lịch sử kiểm duyệt quán ăn |
| 10 | `store_daily_reports` | **0** | InnoDB | `utf8mb4_0900_ai_ci` | Báo cáo vi phạm quán theo ngày |
| 11 | `store_ratings` | **2** | InnoDB | `utf8mb4_0900_ai_ci` | Đánh giá & điểm sao quán ăn |
| 12 | `stores` | **7** | InnoDB | `utf8mb4_0900_ai_ci` | Quán ăn (`APPROVED`, `PENDING`, `HIDDEN`) |
| 13 | `user` | **5** | InnoDB | `utf8mb4_0900_ai_ci` | Tài khoản người dùng |
| 14 | `user_deletion_audits` | **0** | InnoDB | `utf8mb4_0900_ai_ci` | Nhật ký xóa tài khoản GDPR/Privacy |
| 15 | `user_roles` | **5** | InnoDB | `utf8mb4_0900_ai_ci` | Gán vai trò cho người dùng |
| 16 | `user_saved_stores` | **11** | InnoDB | `utf8mb4_0900_ai_ci` | Danh sách quán đã lưu của user |
| 17 | `verification_token` | **0** | InnoDB | `utf8mb4_0900_ai_ci` | Token xác thực email tài khoản mới |
| **Tổng** | **17 bảng** | **219 bản ghi** | | | **Dữ liệu hoạt động hữu ích cần bảo toàn** |

*(Ghi chú: Toàn bộ mật khẩu, token, hash IP, thông tin định danh cá nhân đã được kiểm duyệt và loại bỏ khỏi báo cáo này).*

---

## 2. Backup Method & Safety Verification Plan

Tuân thủ nghiêm ngặt `ops/BACKUP_RESTORE_RUNBOOK.md` và `ops/scripts/backup-mysql.sh`:

1. **Công cụ sao lưu:** Sử dụng chính thức binary client tương thích: `mysqldump.exe` Ver 9.3.0 for Win64 (`C:\Program Files\MySQL\MySQL Server 9.3\bin\mysqldump.exe`).
2. **Cờ sao lưu an toàn (Flags):**
   - `--single-transaction`: Đảm bảo tính nhất quán (consistent snapshot) trên InnoDB mà không khóa bảng (non-locking read-only backup).
   - `--routines --triggers`: Bảo toàn thủ tục và trigger nếu có.
   - `--set-gtid-purged=OFF`: Tránh lỗi quyền hoặc xung đột GTID trên môi trường diễn tập.
   - `--default-character-set=utf8mb4`: Bảo toàn toàn vẹn chuỗi tiếng Việt có dấu và biểu tượng cảm xúc.
3. **Khu vực lưu trữ an toàn (Storage Isolation):**
   - Bản backup được lưu trữ tại thư mục scratch cô lập ngoài Git: `C:\Users\Admin\.gemini\antigravity-ide\brain\7450a9c6-5a84-449f-8da1-2abd372c30a6\scratch\backup_cgfoodtour_source.sql`.
   - **Tuyệt đối không lưu bản dump vào trong Git workspace** (bảo vệ secrets, hashes và PII).
4. **Kiểm tra tính hợp lệ trước khi Restore:**
   - Tạo mã băm kiểm tra toàn vẹn SHA-256 (`Get-FileHash -Algorithm SHA256`).
   - Kiểm tra kích thước file (`test -s`) đảm bảo không rỗng.
   - So sánh định dạng SQL header và kết thúc dump (`-- Dump completed`).

---

## 3. Isolation Boundaries (Ranh giới cách ly diễn tập)

Nhằm đảm bảo **TUYỆT ĐỐI KHÔNG TÁC ĐỘNG LÊN DATABASE NGUỒN**:

```
+-------------------------------------------------------------+
| [VÙNG CẤM THAY ĐỔI] DATABASE NGUỒN (SOURCE)                |
| Host: localhost:3306 (Windows Service: MySQL93)             |
| Database: cgfoodtour                                        |
| Nguyên tắc: CHỈ ĐỌC (READ-ONLY). Không ALTER, không DROP,   |
|            không MIGRATION, không HIBERNATE UPDATE.         |
+-------------------------------------------------------------+
                              |
                     [Bản sao lưu logic]
                     (mysqldump read-only)
                              |
                              v
+-------------------------------------------------------------+
| [VÙNG DIỄN TẬP CÔ LẬP] REHEARSAL TARGET CONTAINER           |
| Engine: Docker Engine (mysql:8.4 hoặc mysql:8.0 cô lập)     |
| Container Name: cgfoodtour-a3-rehearsal-db (định danh riêng)|
| Network: Docker isolated bridge (không lộ port 3306)        |
| Volume: Anonymous / Ephemeral docker volume                 |
| Tiêu hủy: Tự động dọn dẹp sau khi nghiệm thu xong A3-B       |
+-------------------------------------------------------------+
```

---

## 4. Source vs Canonical Schema Differences (So sánh Schema)

Kiểm tra đối chiếu chi tiết giữa schema thực tế của database nguồn và schema chuẩn mực của Flyway `V1__baseline_schema.sql` + `V2__owner_store_history.sql`:

### 4.1 Khác biệt Collation
- **Source Database:** Toàn bộ 17 bảng và các cột `VARCHAR`/`TEXT` sử dụng `utf8mb4_0900_ai_ci` (mặc định của MySQL 9.x / 8.0).
- **Canonical Schema V1/V2:** Chỉ định rõ ràng `utf8mb4_unicode_ci`.
- **Đánh giá rủi ro:** Hibernate `ddl-auto: validate` chỉ xác thực kiểu dữ liệu và độ dài chuỗi, **không fail** vì collation `utf8mb4_0900_ai_ci` vs `utf8mb4_unicode_ci`. Tuy nhiên, về lâu dài cần chuẩn hóa collation khi nâng cấp môi trường production.

### 4.2 Khác biệt Foreign Key Naming
- **Source Database:** Foreign keys mang tên ngẫu nhiên sinh bởi Hibernate:
  - `food_items.FK9wipe7r1xd7vrsqs5wpaiswmw` -> `stores`
  - `role_permissions.FKcppvu8fk24eqqn6q4hws7ajux` -> `role`
  - `role_permissions.FKf5aljih4mxtdgalvr7xvngfn1` -> `permission`
  - `store_daily_reports.FK9jlgnp8effhlhk1dsob2h5686` -> `stores`
  - `store_ratings.FK9vbarivvjccgp0kmee6yfiymf` -> `stores`
  - `stores.FK164jsyopwvw2kf1vl34syxk7q` -> `categories`
  - `stores.FK6rf1pj5lrb1lapwp38jedk6l7` -> `user`
  - `user_roles.FK55itppkw3i07do3h7qoclqd4k` -> `user`
  - `user_roles.FK6pmbiap985ue1c0qjic44pxlc` -> `role`
  - `user_saved_stores.FK627lrijddcimrovcse1jwfn73` -> `user`
  - `user_saved_stores.FKfc3s16tqbwr7hulxhsrehuuas` -> `stores`
  - `verification_token.FKrdn0mss276m9jdobfhhn2qogw` -> `user`
- **Canonical Schema V1:** Định nghĩa tên tường minh (`fk_food_items_store`, `fk_stores_category`, v.v.).
- **Đánh giá rủi ro:** Hibernate validate không kiểm tra tên Foreign Key. Mối quan hệ tham chiếu toàn vẹn (0 orphans).

### 4.3 Khác biệt Indexes & Unique Constraints
1. **Bảng `user`:**
   - **Canonical V1:** Có unique constraint `uk_user_username`, `uk_user_email`, `uk_user_facebook_id`, `uk_user_google_id` và các indexes `idx_user_pending_verification`, `idx_user_registration_source`.
   - **Source DB:** Chỉ có duy nhất `UKlfismxng57avbbo40y5tbppf7` trên cột `google_id`. **Thiếu hoàn toàn** unique constraints trên `username`, `email`, `facebook_id` và 2 indexes trên `pending_verification` / `registration_source`.
   - **Kiểm tra dữ liệu thực tế:** 
     - Trùng lặp `username`: **0**
     - Trùng lặp `email`: **0**
     - Trùng lặp `facebook_id`: **0**
     - Dữ liệu hoàn toàn đủ điều kiện áp dụng unique constraints mà không bị lỗi duplicate key.
2. **Bảng `stores`:**
   - **Canonical V1:** Có `INDEX idx_stores_status_coordinates (status, latitude, longitude)`.
   - **Source DB:** **Thiếu** index này.
3. **Bảng `media_cleanup_tasks`:**
   - **Canonical V1:** Có `INDEX idx_media_cleanup_due (status, retry_count, next_retry_at)`.
   - **Source DB:** **Thiếu** index này.

### 4.4 Bất thường cấu trúc bảng `store_audit_logs` (CRITICAL DRIFT)
- Trong source DB, các cột từ V2: `owner_id_snapshot`, `status_before`, `status_after`, `owner_visible` cùng 2 indexes `idx_store_audit_owner_created`, `idx_store_audit_store_created` **ĐÃ TỒN TẠI** (do Hibernate `ddl-auto: update` đã tạo trước đó).
- **Tuy nhiên, dữ liệu chưa được Backfill:**
  - `owner_id_snapshot IS NULL`: **36 / 45 bản ghi**.
  - `owner_visible = 0`: **36 / 45 bản ghi**.
  - Chỉ có 9 bản ghi (thuộc quán đã bị hard-delete `anvatc37cba63f1f7`) có `owner_id_snapshot` và `owner_visible = 1`.
  - Phân tích read-only: Toàn bộ 36 bản ghi NULL này đều thuộc các quán đang tồn tại trong `stores`. Nếu chạy logic backfill của V2, 100% 36 bản ghi này sẽ được map chính xác về `stores.owner_id` và `owner_visible = 1`.

---

## 5. Migration & Baseline Strategy Analysis (Chiến lược nâng cấp)

### 5.1 Tại sao KHÔNG THỂ chạy thẳng Flyway V1 / V2 trên Database nguồn?
1. **Nếu chạy thẳng `V1__baseline_schema.sql`:** Sẽ lập tức báo lỗi `Table 'permission' already exists` vì script V1 là `CREATE TABLE` tĩnh (greenfield schema).
2. **Nếu Baseline ở V1 (`baselineVersion=1`) rồi chạy V2:** Script `V2__owner_store_history.sql` chứa lệnh:
   ```sql
   ALTER TABLE `store_audit_logs`
       ADD COLUMN `owner_id_snapshot` VARCHAR(255) NULL AFTER `store_name`, ...
   ```
   MySQL sẽ lập tức báo lỗi nghiêm trọng: `ERROR 1060 (42S21): Duplicate column name 'owner_id_snapshot'` và `Duplicate key name 'idx_store_audit_owner_created'` vì Hibernate đã tự ý thêm các cột này.
3. **Nếu Baseline ở V2 (`baselineVersion=2`):** Flyway sẽ bỏ qua V2 hoàn toàn. Kết quả là 36 bản ghi lịch sử kiểm duyệt của chủ quán **sẽ bị ẩn vĩnh viễn** (`owner_visible = 0`, `owner_id_snapshot IS NULL`), và database vẫn thiếu các unique constraints/indexes thiết yếu (`uk_user_username`, `uk_user_email`, `idx_stores_status_coordinates`).
4. **Không được sửa V1/V2:** V1 và V2 đã được nghiệm thu bất biến (immutable) ở Track A2.

### 5.2 Phương án nâng cấp đề xuất cho Phase A3-B (Upgrade Options)

| Phương án | Cơ chế thực hiện | Ưu điểm | Nhược điểm / Rủi ro |
| :--- | :--- | :--- | :--- |
| **Option 1: Transitional Normalization Script (Khuyến nghị diễn tập)** | Chạy một script chuyển tiếp chuẩn hóa (`ops/scripts/upgrade-legacy-preflight.sql`) trên bản sao: <br>1. Drop các cột/index V2 rỗng do Hibernate tạo dở dang (bảo toàn 9 snapshot cũ vào bảng tạm).<br>2. Đánh dấu Baseline V1 trong `flyway_schema_history`.<br>3. Để Flyway thực thi V2 tự nhiên (tạo cột, backfill 45 bản ghi, tạo index).<br>4. Bổ sung các indexes/unique constraints còn thiếu của V1. | - Giữ nguyên tuyệt đối migration V1/V2.<br>- Luồng Flyway chuẩn hóa 100%.<br>- Dữ liệu lịch sử chủ quán được khôi phục trọn vẹn. | Yêu cầu 1 script chuyển tiếp chuẩn hóa được phê duyệt cho legacy database. |
| **Option 2: Baseline V2 + Tạo Migration V3** | 1. Đánh dấu Baseline V2 cho legacy DB.<br>2. Tạo migration `V3__align_legacy_schema_and_backfill.sql` chứa: backfill audit logs, bổ sung unique constraints và indexes thiếu. | - Quản lý hoàn toàn qua Flyway.<br>- Đồng bộ trên tất cả môi trường sau này. | Cần tạo thêm version migration V3 (yêu cầu PO phê duyệt trước khi tạo file). |

---

## 6. Restore Rehearsal Results
> **GATE STATUS:** **PENDING PRODUCT OWNER APPROVAL FOR PHASE A3-B**  
> *(Theo chỉ thị nghiêm ngặt của Product Owner, không thực hiện restore/upgrade trên container rehearsal trước khi có sự phê duyệt kết quả A3-A).*

---

## 7. Data Integrity Comparison (Pre vs Post Migration)
> **GATE STATUS:** **PENDING PRODUCT OWNER APPROVAL FOR PHASE A3-B**  
> *(Bảng so sánh 17 bảng và toàn vẹn quan hệ sẽ được lập ngay sau khi diễn tập restore và upgrade hoàn tất trên container cô lập).*

---

## 8. Hibernate Schema Validation (`ddl-auto: validate`)
> **GATE STATUS:** **PENDING PRODUCT OWNER APPROVAL FOR PHASE A3-B**  
> *(Sẽ được thực thi bằng backend profile `rehearsal` kết nối tới container diễn tập sau khi hoàn tất nâng cấp).*

---

## 9. Outstanding Schema Incompatibilities Summary

1. **Collation Drift:** Source database đang dùng `utf8mb4_0900_ai_ci` thay vì `utf8mb4_unicode_ci`. Không ảnh hưởng Hibernate validation nhưng cần thống nhất chuẩn mã hóa.
2. **Missing Unique Constraints trên `user`:** `username`, `email`, `facebook_id` chưa có unique constraint cấp database (đã kiểm tra thực tế: 0 dòng vi phạm).
3. **Missing Performance Indexes:** Thiếu `idx_stores_status_coordinates`, `idx_media_cleanup_due`, `idx_user_pending_verification`, `idx_user_registration_source`.
4. **Unbackfilled Audit History:** 36/45 bản ghi `store_audit_logs` chưa có `owner_id_snapshot` và mang `owner_visible = 0`. Cần thực hiện backfill của V2 để bảo đảm tính năng tra cứu lịch sử quán của chủ cơ sở.

---

## 10. Required New Migrations / Transitional Scripts

- **Không sửa đổi migration `V1__baseline_schema.sql` và `V2__owner_store_history.sql`.**
- **Đề xuất cho Product Owner:** 
  - Phê duyệt quy trình chuyển tiếp cho database hiện tại (Option 1 thông qua runbook upgrade hoặc Option 2 thông qua migration V3).
  - Không tự tiện tạo migration mới khi chưa có chỉ thị chính thức từ PO.

---

## 11. Rollback & Forward-Fix Strategy

1. **Đối với Database nguồn (`localhost:3306`):**
   - Đảm bảo an toàn 100% vì chỉ thực hiện các thao tác **READ-ONLY**. Không có rủi ro mất dữ liệu trên database gốc.
2. **Đối với Database diễn tập (Rehearsal Container):**
   - Nếu quá trình nâng cấp trên container thất bại: Hủy container (`docker rm -f`), xóa volume tạm, điều chỉnh kịch bản và restore lại từ bản dump gốc cô lập.
   - Không chuyển giao kịch bản nâng cấp cho môi trường chính thức nếu chưa đạt 100% PASS trên rehearsal container.

---

## 12. Track A3 Status & Recommendation

- **Phân loại:** **CONDITIONAL GATE / A3-A COMPLETE**
- **Đánh giá rủi ro nâng cấp:** **TRUNG BÌNH - CAO (MEDIUM-HIGH)** nếu nâng cấp tự động mà không xử lý xung đột cột V2 đã tồn tại.
- **Khuyến nghị gửi Product Owner:**
  1. Nghiệm thu kết quả kiểm kê A3-A (Read-Only Inventory).
  2. Phê duyệt việc tạo bản sao lưu logic an toàn (`mysqldump`) ra thư mục scratch cô lập.
  3. Phê duyệt triển khai **Phase A3-B** trên Docker MySQL container định danh riêng (`mysql:8.4` isolated).
  4. Lựa chọn phương án nâng cấp (Option 1 Transitional Script hay Option 2 Baseline V2 + V3 Migration) để thực hiện diễn tập.

---
*Báo cáo được lập bởi: Senior MySQL Database Engineer & Flyway Migration Specialist*  
*Thời điểm kiểm kê A3-A: 2026-10-25 22:18:00 (Local Time)*
