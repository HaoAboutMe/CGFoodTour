# CG FoodTour — Track A2 Execution Report: MySQL & Flyway Migration Verification

> **Track ID:** Pre-Phase 4 / Track A2
> **Date:** 2026-10-25
> **Author:** Senior Database Engineer, Spring Boot Engineer & Release QA Engineer
> **Branch:** `feature/frontend-desktop-redesign`
> **Baseline Commit:** `e8a6466604147b4779878f9298715242b4d3df9e`
> **Status:** **PASS** (Phạm vi Clean MySQL Migration & Hibernate Validation; phần Upgrade Snapshot thuộc Track A3)

---

## 1. Executive Summary

Track A2 thực hiện kiểm chứng toàn diện năng lực khởi tạo cơ sở dữ liệu từ trạng thái rỗng (*clean greenfield database*), thứ tự áp dụng các phiên bản migration Flyway, tính tương thích với ORM Hibernate và tính bất biến khi tái khởi động (*restart idempotency*) theo đúng thiết kế tại [RELEASE_READINESS_BLUEPRINT.md](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/project-audit/RELEASE_READINESS_BLUEPRINT.md) (Issue **AUD-DATA-001**):
- **Docker Availability Gate:** Đã vượt qua thành công với Docker Desktop 4.64.0 (Engine 29.2.1, WSL2 backend).
- **Thực thi Testcontainers trên MySQL 8.4 cô lập:** Cả hai bài kiểm thử `FlywayJpaValidationTest` và `FlywayMigrationTest` đã được thực thi thực tế, không còn bất kỳ bài test nào bị SKIP.
- **Thứ tự & Tính toàn vẹn của Flyway:** Áp dụng tuần tự `V1__baseline_schema.sql` (thời gian: 868ms) sau đó là `V2__owner_store_history.sql` (thời gian: 135ms). Bảng `flyway_schema_history` ghi nhận chính xác 2 bản ghi thành công với checksum khớp hoàn hảo.
- **Hibernate Schema Validation:** Cấu hình `spring.jpa.hibernate.ddl-auto=validate` chạy thành công rực rỡ; xác nhận toàn bộ 17 JPA Entities khớp hoàn toàn với cấu trúc bảng, cột, kiểu dữ liệu thực tế trên MySQL 8.4 mà không cần Hibernate can thiệp DDL.
- **Tính Bất Biến (Idempotency):** Khởi chạy lại Flyway trên database đã migrate ghi nhận chính xác `0 migrations executed` trong 49ms và checksum validation thành công 100%.
- **Toàn bộ Backend Test Suite:** Đạt kết quả **105/105 tests PASS, 0 FAIL, 0 ERROR, 0 SKIP**.

---

## 2. Environment Baseline & Docker Status

| Thành phần | Phiên bản thực tế | Trạng thái kỹ thuật |
|---|---|---|
| **Git Baseline** | Commit `e8a6466604147b4779878f9298715242b4d3df9e` trên branch `feature/frontend-desktop-redesign` | **VERIFIED** |
| **Java Runtime** | Oracle JDK 21.0.6 LTS (`C:\Program Files\Java\jdk-21`) | **VERIFIED** |
| **Maven Toolchain** | Apache Maven 3.9.12 (qua wrapper `.\mvnw.cmd`) | **VERIFIED** |
| **Docker Client / Engine** | Docker Desktop 4.64.0 (Engine 29.2.1, API 1.53, WSL2 Linux Kernel 6.6.87) | **ACTIVE & HEALTHY** |
| **MySQL Container Image** | `mysql:8.4` (Image ID: `0f51e63e537a`, Content Size: 254MB) | **CACHED & VERIFIED** |
| **Testcontainers Ryuk** | `testcontainers/ryuk:0.12.0` (Image ID: `dd3f023a6ed7`) | **ACTIVE** |

---

## 3. Kết Quả Kiểm Chứng Clean Flyway Migration (V1 & V2)

### 3.1. Trạng Thái Khởi Đầu
- Kiểm tra số lượng bảng ban đầu trong schema mới `cgfoodtour`: **0 bảng** (`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'cgfoodtour'`).
- Cơ sở dữ liệu hoàn toàn sạch sẽ trước khi Flyway can thiệp.

### 3.2. Tiến Trình Thực Thi Migration
```text
22:00:48.139 [main] INFO  o.f.core.internal.command.DbMigrate - Current version of schema `cgfoodtour`: << Empty Schema >>
22:00:48.158 [main] INFO  o.f.core.internal.command.DbMigrate - Migrating schema `cgfoodtour` to version "1 - baseline schema"
22:00:49.055 [main] INFO  o.f.core.internal.command.DbMigrate - Migrating schema `cgfoodtour` to version "2 - owner store history"
22:00:49.212 [main] INFO  o.f.core.internal.command.DbMigrate - Successfully applied 2 migrations to schema `cgfoodtour`, now at version v2 (execution time 00:01.003s)
```

### 3.3. Dữ Liệu Bảng `flyway_schema_history`
| installed_rank | version | description | type | script | checksum | success | execution_time |
|:---:|:---:|---|:---:|---|:---:|:---:|:---:|
| **1** | `1` | baseline schema | `SQL` | `V1__baseline_schema.sql` | `1937888117` | `true` | 868 ms |
| **2** | `2` | owner store history | `SQL` | `V2__owner_store_history.sql` | `-569819424` | `true` | 135 ms |

- **Không có migration nào bị FAILED.**
- **Thứ tự áp dụng chuẩn xác:** V1 thực thi trước, V2 nâng cấp các cột snapshot và index phục vụ tính năng Owner Store History.

---

## 4. Kiểm Chứng Cấu Trúc Schema: Tables, Foreign Keys & Indexes

### 4.1. Danh Sách 18 Bảng Hoàn Chỉnh (InnoDB, utf8mb4_unicode_ci)
1. `categories`: Quản lý danh mục quán ăn
2. `flyway_schema_history`: Lưu trữ lịch sử version Flyway
3. `food_items`: Món ăn thuộc quán
4. `invalidated_token`: Blacklist JWT token đã logout
5. `media_cleanup_tasks`: Hàng đợi dọn dẹp ảnh mồ côi trên Cloudinary
6. `password_reset_otp`: Mã OTP khôi phục mật khẩu
7. `permission`: Quyền hạn hệ thống
8. `role`: Vai trò người dùng (ADMIN, USER, STORE_OWNER)
9. `role_permissions`: Bảng quan hệ nhiều-nhiều Role - Permission
10. `store_audit_logs`: Lịch sử kiểm duyệt quán và thay đổi trạng thái
11. `store_daily_reports`: Báo cáo vi phạm quán hàng ngày
12. `store_ratings`: Đánh giá mức độ hài lòng quán ăn
13. `stores`: Thông tin quán ăn, tọa độ GPS và trạng thái phê duyệt
14. `user`: Thông tin tài khoản người dùng
15. `user_deletion_audits`: Lịch sử xóa tài khoản an toàn
16. `user_roles`: Bảng quan hệ nhiều-nhiều User - Role
17. `user_saved_stores`: Danh sách quán ăn yêu thích của người dùng
18. `verification_token`: Token kích hoạt tài khoản qua email

### 4.2. Ràng Buộc Khóa Ngoại (Foreign Keys)
- `food_items` (`store_id`) ➔ `stores` (`id`)
- `role_permissions` (`permissions_name`) ➔ `permission` (`name`)
- `role_permissions` (`role_name`) ➔ `role` (`name`)
- `store_daily_reports` (`store_id`) ➔ `stores` (`id`)
- `store_ratings` (`store_id`) ➔ `stores` (`id`)
- `stores` (`category_id`) ➔ `categories` (`id`)
- `stores` (`owner_id`) ➔ `user` (`id`)
- `user_roles` (`roles_name`) ➔ `role` (`name`)
- `user_roles` (`user_id`) ➔ `user` (`id`)
- `user_saved_stores` (`store_id`) ➔ `stores` (`id`)
- `user_saved_stores` (`user_id`) ➔ `user` (`id`)
- `verification_token` (`user_id`) ➔ `user` (`id`)

### 4.3. Xác Minh Tính Năng Owner Store History (Migration V2)
- Các cột snapshot được bổ sung thành công vào bảng `store_audit_logs`:
  - `owner_id_snapshot` (`VARCHAR(255)` - cố tình không đặt FK để lịch sử kiểm duyệt tồn tại kể cả khi store bị xóa).
  - `status_before` (`VARCHAR(50)`).
  - `status_after` (`VARCHAR(50)`).
  - `owner_visible` (`BIT(1)`).
- **Kiểm tra Index & Kế hoạch Thực thi (EXPLAIN Query):**
  ```sql
  EXPLAIN SELECT * FROM cgfoodtour.store_audit_logs
  WHERE owner_id_snapshot = 'test-owner-id'
  ORDER BY created_at DESC, id DESC;
  ```
  - **Kết quả:** `select_type: SIMPLE`, `table: store_audit_logs`, `type: ref`, `key: idx_store_audit_owner_created`, `rows: 1`.
  - Chỉ mục tổng hợp `idx_store_audit_owner_created` hoạt động chính xác, tối ưu hóa triệt để truy vấn lịch sử phía chủ quán.

---

## 5. Kết Quả Hibernate Schema Validation (`ddl-auto=validate`)

Bài kiểm thử [FlywayJpaValidationTest.java](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/backend/src/test/java/com/cangiuoc/cgfoodtour/migration/FlywayJpaValidationTest.java) khởi chạy một `SpringBootTest` hoàn chỉnh với cấu hình:
```properties
spring.flyway.enabled=true
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```
- **Kết quả:** Hibernate kết nối tới MySQL 8.4 container, thực hiện quét và đối chiếu toàn bộ các JPA Entity definitions với schema cơ sở dữ liệu vừa được Flyway kiến tạo.
- **Không có bất kỳ sai lệch nào về:** Tên bảng, tên cột, kiểu dữ liệu cột (`VARCHAR`, `BIT`, `INT`, `DOUBLE`, `DATETIME(6)`, `TIME(6)`), khóa chính, hay quan hệ khóa ngoại.
- Quá trình khởi động hoàn tất thành công trong 7.272 giây; hạt giống dữ liệu ban đầu (`ApplicationInitConfig`) khởi tạo an toàn quyền hạn và tài khoản Admin mẫu.

---

## 6. Kiểm Chứng Tính Bất Biến (Restart & Idempotency)

Thực nghiệm gọi `flyway.migrate()` lần thứ hai ngay trên database đã được áp dụng V1 và V2:
```text
22:00:49.273 [main] INFO  o.f.core.internal.command.DbValidate - Successfully validated 2 migrations (execution time 00:00.007s)
22:00:49.283 [main] INFO  o.f.core.internal.command.DbMigrate - Current version of schema `cgfoodtour`: 2
22:00:49.284 [main] INFO  o.f.core.internal.command.DbMigrate - Schema `cgfoodtour` is up to date. No migration necessary.
[EVIDENCE] Second migrate duration: 49 ms
[EVIDENCE] Second migrations executed: 0
22:00:49.316 [main] INFO  o.f.core.internal.command.DbValidate - Successfully validated 2 migrations (execution time 00:00.006s)
```
- **Thời gian xử lý:** 49 ms.
- **Số migrations chạy lặp:** **0** (Hoàn toàn bất biến).
- **Kiểm tra Checksum:** Toàn bộ checksums của 2 migrations đều hợp lệ, không phát sinh bất kỳ cảnh báo schema drift nào.

---

## 7. Toàn Bộ Kết Quả Backend Test Suite Sau Khi Có Docker

Thực thi lệnh kiểm thử toàn diện:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd clean test
```

### Kết quả Surefire:
```text
[INFO] Results:
[INFO]
[INFO] Tests run: 105, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  46.403 s
[INFO] Finished at: 2026-10-25T21:58:06+07:00
```

- **Tổng số tests:** 105 tests.
- **Failures:** 0.
- **Errors:** 0.
- **Skipped:** **0** (Trước đó là 2 tests bị skip do thiếu Docker; nay đã pass 100%).

---

## 8. Cập Nhật Trạng Thái Issue & Rủi Ro Còn Lại

### Trạng thái Issue `AUD-DATA-001`:
Đã cập nhật trong [PUBLIC_RELEASE_BLOCKERS.md](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/project-audit/PUBLIC_RELEASE_BLOCKERS.md#L41) thành:
> **PARTIALLY RESOLVED** (Track A2: Clean Flyway V1→V2 migration & Hibernate schema validation verified 100% PASS on isolated MySQL 8.4 via Testcontainers; existing database snapshot upgrade/baseline remains OPEN for Track A3).

### Rủi ro còn lại (Remaining Risks):
1. **Nâng cấp từ Database Local hiện hữu (Thuộc Track A3):**
   - Cơ sở dữ liệu phát triển hiện tại trên máy developer (`application-dev.yaml`) trước đây có thể đã được sinh bởi Hibernate `ddl-auto: update` mà không qua Flyway.
   - Khi áp dụng Flyway lên cơ sở dữ liệu đã có dữ liệu, cần có bước snapshot thử nghiệm, inventory diff và kế hoạch baseline (`flyway baseline`) được kiểm thử an toàn để tránh xung đột bảng hoặc mất mát dữ liệu của người dùng hiện hữu.
2. **Kế hoạch tiếp theo:** Track A3 sẽ thực hiện snapshot, khử khuẩn (sanitize), inventory so khớp và diễn tập nâng cấp dữ liệu.

---

## 9. Kết Luận & Đề Xuất Nghiệm Thu

**ĐÁNH GIÁ: PASS**
- Phạm vi Clean MySQL Migration & Hibernate Validation của Track A2 đã đạt chuẩn 100%.
- Không có bất kỳ dòng mã business logic, authentication hay API nào bị sửa đổi.
- Cơ sở dữ liệu local hiện tại hoàn toàn không bị tác động (toàn bộ kiểm thử chạy trên container MySQL 8.4 cô lập do Testcontainers tự sinh và tự hủy qua Ryuk).

**Dừng lại tại đây để Product Owner nghiệm thu Track A2. Không tự động chuyển sang Track A3, không commit hoặc push git.**
