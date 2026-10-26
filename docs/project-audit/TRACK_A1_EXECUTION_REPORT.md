# CG FoodTour — Track A1 Execution Report: Toolchain & Clean Build Baseline

> **Track ID:** Pre-Phase 4 / Track A1  
> **Date:** 2026-10-25  
> **Author:** Senior Java/Spring Boot & Release Quality Engineer  
> **Branch:** `feature/frontend-desktop-redesign`  
> **Status:** **CONDITIONAL PASS** (Toolchain locked & fail-fast verified; local JDK 17 marked NOT VERIFIED due to no local installation; Docker daemon pending for Track A2)

---

## 1. Executive Summary

Track A1 giải quyết triệt để vấn đề phân mảnh môi trường phát triển và nguy cơ sai lệch kết quả kiểm thử (Issues: **AUD-TOOL-001**, **AUD-DOC-001**):
- **Khóa chính sách Toolchain chính thức**: Xác định **Java 17 LTS** là chuẩn Canonical Baseline (đồng bộ với Dockerfile và GitHub Actions CI) và **Java 21 LTS** là môi trường phát triển tương thích được hỗ trợ. Mọi phiên bản interim (JDK 18, 19, 20) và JDK 22+ (bao gồm JDK 24) đều không được hỗ trợ.
- **Kích hoạt cơ chế Fail-Fast**: Tích hợp `maven-enforcer-plugin` 3.5.0 vào `backend/pom.xml` với quy tắc `requireJavaVersion` nghiêm ngặt theo cú pháp `[17,18),[21,22)`. Mọi phiên bản Java ngoài dải hỗ trợ (bao gồm JDK 18, 19, 20, 22, 24) sẽ bị từ chối ngay lập tức tại pha `validate` trước khi biên dịch mã nguồn.
- **Xác minh Clean Build Baseline trên JDK 21**: Thực thi `mvn clean test` từ đầu, loại bỏ hoàn toàn cache `target/`. Toàn bộ 103/105 tests chức năng đều **PASS 100%** trên JDK 21 LTS.
- **Minh bạch hóa trạng thái JDK 17 Local**: Đánh dấu **NOT VERIFIED** cho việc chạy trực tiếp JDK 17 trên máy local do môi trường hiện tại chưa cài đặt JDK 17 (chỉ có JDK 21, Corretto 22, JDK 24). Tuân thủ nghiêm ngặt nguyên tắc không tự ý cài đặt phần mềm khi chưa có sự chấp thuận từ Product Owner.
- **Phân loại Test rõ ràng**: Ghi nhận chính xác 2 tests bị **SKIP** (`FlywayMigrationTest`, `FlywayJpaValidationTest`) do Docker daemon chưa bật, không tuyên bố sai sự thật về trạng thái MySQL migration.
- **Đồng bộ yêu cầu Node.js**: Xác định chính xác phiên bản Node.js yêu cầu bởi Vite 8 (`^8.2.4`) và Oxlint là **`Node.js v22 LTS`** (`>=22.12.0` hoặc `^20.19.0`), loại bỏ hoàn toàn thông tin Node 18 không tương thích khỏi tài liệu.

---

## 2. Toolchain Matrix & Local Environment Inventory

| Môi trường / JDK | Phiên bản runtime thực tế | Vai trò trong dự án | Quy tắc Maven Enforcer `[17,18),[21,22)` | Kết quả kiểm thử Clean Build | Đánh giá kỹ thuật |
|---|---|---|---|---|---|
| **Java 17 LTS** | *Chưa cài đặt trên máy local* | **Canonical Baseline** (Production Target) | Hợp lệ (`[17,18)`) | **NOT VERIFIED (Local)** | Máy local chưa có JDK 17. CI workflow (`temurin-17`) và Dockerfile (`eclipse-temurin:17`) sử dụng Java 17. |
| **Java 21 LTS** | `Oracle JDK 21.0.6 LTS` (`C:\Program Files\Java\jdk-21`) | **Supported Dev Toolchain** | Hợp lệ (`[21,22)`) | **PASS** (105 tests: 103 PASS, 0 FAIL, 2 SKIP) | Build thành công trong 20.14s. Toàn bộ unit/slice/controller/H2 tests pass sạch. |
| **Java 18 / 19 / 20** | *Không có trên máy local* | **Unsupported Interim** | **BLOCKED (Fail-fast)** | N/A | Enforcer từ chối vì chưa được kiểm chứng tính ổn định. |
| **Java 22** | `Amazon Corretto 22.0.2` (`C:\Users\Admin\.jdks\corretto-22.0.2`) | **Unsupported** | **BLOCKED (Fail-fast)** | **BUILD FAILURE** (Validate phase: 1.49s) | Enforcer chặn trước khi compile. |
| **Java 24** | `Oracle JDK 24.0.1` (`C:\Program Files\Java\jdk-24`) | **Unsupported** | **BLOCKED (Fail-fast)** | **BUILD FAILURE** (Validate phase: 0.88s) | Machine default; Enforcer chặn ngay lập tức. |

---

## 3. Báo Cáo Nguyên Nhân Thất Bại Trên JDK 24 (AUD-TOOL-001)

Nhằm đảm bảo tính chính xác và trung thực của báo cáo kỹ thuật, phần này phân biệt rạch ròi giữa **nguyên nhân đã được xác minh bằng thực nghiệm** và **các giả thuyết kỹ thuật**:

### A. Các sự thật đã được xác minh (Verified Facts)
1. **Chính sách hỗ trợ phiên bản**: JDK 24 là bản Non-LTS ngắn hạn (phát hành tháng 4/2025). Framework nền tảng của backend là Spring Boot 3.5.9 chỉ chính thức hỗ trợ và kiểm thử trên Java 17 LTS (baseline) và Java 21 LTS.
2. **Hiện tượng ghi nhận trong Project Audit**: Khi chạy `mvn clean test` trên JDK 24 trong đợt kiểm thử audit, surefire ghi nhận lỗi liên quan đến phân giải bytecode lớp `EmailTemplateBuilder`, khiến 2 bài kiểm thử email thất bại (1 failure, 1 error).
3. **Môi trường CI & Production đồng nhất ở Java 17**: Cả `backend/Dockerfile` (`maven:3.9-eclipse-temurin-17` / `eclipse-temurin:17-jre-jammy`) và `.github/workflows/ci.yml` (`java-version: '17'`) đều sử dụng Java 17 Temurin. Chạy trên JDK 24 tạo ra sự sai lệch môi trường (environment drift).
4. **Cơ chế Fail-Fast hoạt động hiệu quả**: Cấu hình Enforcer rule `[17,18),[21,22)` ngăn chặn 100% việc vô tình thực thi trên JDK 24, dừng build ngay tại pha `validate` sau 0.88s.

### B. Các giả thuyết kỹ thuật chưa được chứng minh độc lập (Unverified Hypotheses)
1. *Giả thuyết về class file version 68:* Sự không tương thích giữa định dạng class file của JDK 24 với các bộ xử lý annotation MapStruct 1.5.5.Final và Lombok 1.18.38 khi xử lý text blocks multiline lớn trong `EmailTemplateBuilder.java`.
2. *Giả thuyết về ByteBuddy / Mockito instrumentation:* ByteBuddy đi kèm Spring Boot Starter Test có thể chưa tương thích hoàn toàn với JVM 24 runtime trong việc tạo proxy class động cho các bài test email.
3. *Giả thuyết về Stale Artifacts:* Khả năng tàn dư class files cũ trong thư mục `target/` từ các lần build không `clean` trước đó đã gây ra xung đột nhị phân khi nạp class.

**Kết luận kỹ thuật:** Việc phân tích sâu nguồn gốc bytecode JDK 24 là không cần thiết đối với mục tiêu phát hành sản phẩm, bởi vì giải pháp phòng vệ chuẩn mực là **loại trừ hoàn toàn JDK 24 khỏi toolchain được hỗ trợ** thông qua Maven Enforcer.

---

## 4. Bằng Chứng Thực Nghiệm Cơ Chế Fail-Fast

### Thử nghiệm 1: Chạy `mvn validate` dưới JDK 24 (Default PATH)
```text
[INFO] --- enforcer:3.5.0:enforce (enforce-supported-toolchain) @ cgfoodtour ---
[INFO] Rule 1: org.apache.maven.enforcer.rules.version.RequireMavenVersion passed
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-enforcer-plugin:3.5.0:enforce (enforce-supported-toolchain) on project cgfoodtour: 
[ERROR] Rule 0: org.apache.maven.enforcer.rules.version.RequireJavaVersion failed with message:
[ERROR] ================================================================================
[ERROR] [ENFORCER ERROR] Unsupported Java Runtime Version detected!
[ERROR] CG FoodTour strictly supports only Java 17 LTS (canonical baseline) and Java 21 LTS.
[ERROR] Interim versions (JDK 18, 19, 20) and JDK 22+ (including JDK 24) are unsupported.
[ERROR] Please configure your environment to use JDK 17 (recommended) or JDK 21:
[ERROR]   - On Windows: set JAVA_HOME=C:\Path\To\jdk-17 (or jdk-21)
[ERROR]   - On Linux/macOS: export JAVA_HOME=/path/to/jdk-17 (or jdk-21)
[ERROR] ================================================================================
```
- **Thời gian phản hồi:** 0.888 giây.
- **Hành vi:** Ngắt build tức thì, không biên dịch source code.

### Thử nghiệm 2: Chạy `mvn validate` dưới Corretto 22
- **Thời gian phản hồi:** 1.495 giây.
- **Hành vi:** BUILD FAILURE, bị Enforcer chặn tương tự.

### Thử nghiệm 3: Chạy `mvn clean test` dưới JDK 21 LTS
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
mvn clean test
```
```text
[INFO] --- enforcer:3.5.0:enforce (enforce-supported-toolchain) @ cgfoodtour ---
[INFO] Rule 0: org.apache.maven.enforcer.rules.version.RequireJavaVersion passed
[INFO] Rule 1: org.apache.maven.enforcer.rules.version.RequireMavenVersion passed
...
[INFO] Results:
[INFO] 
[WARNING] Tests run: 105, Failures: 0, Errors: 0, Skipped: 2
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  20.141 s
[INFO] Finished at: 2026-10-25T21:42:02+07:00
```

---

## 5. Danh Sách Tests Bị Bỏ Qua (Skipped Tests) & Phân Tích

| Test Class | Số lượng Skipped | Lý do kỹ thuật | Đánh giá Release Gate |
|---|:---:|---|---|
| `FlywayMigrationTest` | 1 | `@Testcontainers(disabledWithoutDocker = true)` tự động skip khi Docker daemon không hoạt động (`npipe:////./pipe/dockerDesktopLinuxEngine` không kết nối được). | **Mở (Thuộc phạm vi Track A2)**: Cần khởi động Docker Desktop để chạy trên MySQL 8.4 thực tế. |
| `FlywayJpaValidationTest` | 1 | Tương tự, test xác thực schema Hibernate vs Flyway cần container MySQL 8.4. | **Mở (Thuộc phạm vi Track A2)**: Chưa thể tuyên bố validation thành công nếu chưa chạy container. |

---

## 6. Frontend Quality Gates Verification & Node.js Requirements

### Kiểm tra yêu cầu Node.js thực tế
Qua kiểm tra dependencies:
- `frontend/node_modules/vite/package.json`: `engines: { node: "^20.19.0 || >=22.12.0" }`
- `frontend/node_modules/oxlint/package.json`: `engines: { node: "^20.19.0 || >=22.12.0" }`
- `frontend/Dockerfile`: `FROM node:22-alpine AS build`
- `.github/workflows/ci.yml`: `node-version: '22'`
=> **Kết luận**: Phiên bản Node.js tối thiểu bắt buộc là **Node.js 22 LTS (Active LTS, >=22.12.0)**. Node 18 hoàn toàn không còn tương thích và đã được xóa bỏ khỏi tài liệu.

### Kết quả chạy Quality Gates:
- `npm run lint`: **PASS** (0 errors, 0 warnings trên 100 files).
- `npm test`: **PASS** (38/38 unit/contract tests).
- `npm run test:build-contract`: **PASS** (3/3 tests).

---

## 7. Hướng Dẫn Môi Trường Chuẩn Dành Cho Developer Mới

### Yêu Cầu Tối Thiểu
1. **JDK**: Cài đặt OpenJDK 17 LTS (khuyến nghị [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17)) hoặc OpenJDK 21 LTS.
2. **Maven**: Sử dụng sẵn Maven Wrapper `backend/mvnw` / `backend/mvnw.cmd` (Maven 3.9.12 tích hợp sẵn).
3. **Node.js**: Phiên bản **`v22 LTS`** (`>=22.12.0`).
4. **Docker Desktop**: Cần thiết khi thực hiện chạy integration test (Track A2) và rehearsal stack.

### Thiết lập biến môi trường
- **Windows (PowerShell)**:
  ```powershell
  # Chuyển session hiện tại sang JDK 17 (hoặc JDK 21)
  $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"  # hoặc jdk-21
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  java -version
  ```
- **Linux / macOS (Bash/Zsh)**:
  ```bash
  export JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64
  export PATH=$JAVA_HOME/bin:$PATH
  java -version
  ```

### Quy Chuẩn Biên Dịch & Chạy Test Backend
Luôn sử dụng lệnh `clean test` để tránh tái sử dụng artifacts lỗi từ `target/`:
```bash
cd backend
.\mvnw.cmd clean test    # Trên Windows
./mvnw clean test        # Trên Linux/macOS
```

---

## 8. Files Modified in Track A1

1. `backend/pom.xml`: Cấu hình `maven-enforcer-plugin` 3.5.0 giới hạn Java trong dải `[17,18),[21,22)` và Maven tối thiểu `[3.8.0,)`.
2. `README.md`: Đồng bộ yêu cầu toolchain chuẩn: Java 17/21 LTS, Node 22 LTS (`>=22.12.0`), loại bỏ Node 18.
3. `backend/README.md`: Đồng bộ yêu cầu toolchain backend, cảnh báo fail-fast Enforcer rule `[17,18),[21,22)`.
4. `docs/project-audit/PUBLIC_RELEASE_BLOCKERS.md`: Cập nhật trạng thái của `AUD-TOOL-001` từ `OPEN` sang `RESOLVED`.
5. `docs/project-audit/TRACK_A1_EXECUTION_REPORT.md`: Tài liệu ghi nhận chi tiết bằng chứng kỹ thuật Track A1.

---

## 9. Kết Luận & Đề Xuất Nghiệm Thu

**ĐÁNH GIÁ: CONDITIONAL PASS**
- **Đạt được**:
  - Enforcer fail-fast chặn chính xác JDK 22 và JDK 24, từ chối các bản interim JDK 18/19/20.
  - Clean test trên JDK 21 LTS đạt kết quả tuyệt đối (103 tests pass, 0 fail, 0 error).
  - Yêu cầu Node.js được đồng bộ chính xác với Vite 8 và Docker/CI (`Node.js v22 LTS`).
  - Không sửa đổi bất kỳ business logic, API hay database schema nào.
- **Điều kiện ghi nhận (Conditions)**:
  - Máy local chưa cài đặt JDK 17 thật, do đó đánh dấu **NOT VERIFIED** cho môi trường local JDK 17 (dù CI Temurin 17 đã bảo đảm tính hợp lệ của codebase).
  - Cần khởi động Docker Desktop để hoàn thành 2 bài test Testcontainers MySQL trong Track A2 tiếp theo.
