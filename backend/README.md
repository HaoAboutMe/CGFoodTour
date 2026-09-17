# ☕ Cần Giuộc Food Tour - Backend RESTful API Service

> **Dịch vụ Back-end RESTful API cho ứng dụng Cần Giuộc Food Tour** – Xây dựng trên nền tảng **Java 17 & Spring Boot 3.5**, tích hợp bảo mật **Spring Security + JWT OAuth2 Resource Server**, cơ sở dữ liệu **MySQL**, lưu trữ đám mây **Cloudinary** và tự động giải mã liên kết Google Maps ngầm.

![Java 17](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot 3.5](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6.x-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![Swagger UI](https://img.shields.io/badge/Swagger_OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## 🌟 1. Giới Thiệu Hệ Thống

Dịch vụ Backend của **Cần Giuộc Food Tour** chịu trách nhiệm cung cấp hệ thống RESTful API toàn diện cho ứng dụng Front-end. 

Hệ thống được thiết kế theo kiến trúc **Layered Architecture (Controller - Service - Repository)** chuẩn doanh nghiệp, chú trọng tính bảo mật, hiệu năng biên dịch DTO với MapStruct, xử lý ngoại lệ tập trung (Global Exception Handling) và tự động hóa các tác vụ trích xuất dữ liệu địa lý.

---

## 🚀 2. Các Tính Năng & Kỹ Thuật Nổi Bật

### 🔐 1. Xác Thực & Phân Quyền Bảo Mật (JWT & OAuth2 Resource Server)
- **Spring Security 6 & OAuth2 Resource Server**: Xác thực Token JWT dựa trên chữ ký thuật toán HMAC-SHA (Nimbus JOSE + JWT).
- **Cơ chế Silent Refresh Token**:
  - Access Token ngắn hạn (**30 phút**).
  - Refresh Token dài hạn (**30 ngày**) lưu vết trong Database, tự động gia hạn ngầm loại bỏ tình trạng logout giữa chừng.
- **Phân quyền RBAC (Role-Based Access Control)**:
  - Hệ thống Quyền linh hoạt: `ADMIN`, `STORE_OWNER`, `USER`.
  - Phân quyền chi tiết ở mức API bằng Annotation `@PreAuthorize("hasRole('ADMIN')")` hoặc `@PreAuthorize("hasAuthority('STORE_UPDATE')")`.
- **Đăng Nhập Google OAuth2 (SSO)**: Tích hợp xác thực Google ID Token, tự động tạo tài khoản người dùng mới nếu chưa tồn tại.
- **Xác Thực OTP Email**: Tự động gửi mã OTP qua Gmail SMTP để xác minh đăng ký tài khoản và khôi phục mật khẩu.

### 🗺️ 2. Giải Mã Link Google Maps Ngầm (Backend Redirect Tracer)
- **API Endpoint**: `POST /api/v1/stores/parse-gmaps`
- **Cơ chế hoạt động**:
  - Tự động mở kết nối `HttpURLConnection` theo vết HTTP Redirect 301, 302, 303, 307, 308 ngầm qua nhiều tầng domain (`maps.app.goo.gl` ➔ `google.com/maps`).
  - Trích xuất tọa độ GPS chính xác (Vĩ độ & Kinh độ) qua các biểu thức chính quy (Regex) bóc tách `@lat,lng`, `!3d!4d` hoặc quét thẻ `<meta>` trong 150 dòng HTML đầu tiên.

### 🏬 3. Quản Lý Quán Ăn & Quy Trình Phê Duyệt (Approval Workflow)
- **Vòng đời trạng thái quán ăn (`StoreStatus`)**:
  - `PENDING` (Chờ duyệt): Quán mới đăng ký bởi chủ quán.
  - `APPROVED` (Đã duyệt): Hiển thị công khai trên ứng dụng.
  - `REJECTED` (Từ chối): Từ chối kèm lý do phản hồi.
  - `HIDDEN` (Ẩn quán): Tạm ẩn khỏi danh sách tìm kiếm.
- **Hard Delete Cascade (Xóa vĩnh viễn an toàn)**:
  - Tự động xóa dữ liệu liên quan ở 4 bảng con (`food_items`, `store_ratings`, `store_daily_reports`, `store_audit_logs`) trước khi xóa bản ghi quán ở bảng `stores`, giải quyết dứt điểm lỗi rào cản khóa ngoại (*Foreign Key Constraint*).

### ☁️ 4. Tải Ảnh Đám Mây Cloudinary (`UploadController`)
- Tích hợp **Cloudinary SDK**: Cho phép tải lên banner quán ăn, hình ảnh thực đơn và avatar tài khoản.
- Tự động tối ưu dung lượng và trả về liên kết HTTPS CDN tốc độ cao.

### 📐 5. Tối Ưu Hiệu Năng & Chuẩn Hóa Mã Nguồn
- **MapStruct 1.5**: Tự động sinh code ánh xạ giữa Entity và DTO tại thời điểm biên dịch (*Compile-time*), loại bỏ chi phí Reflection của `BeanUtils`.
- **Global Exception Handler (`@ControllerAdvice`)**: Bắt và chuẩn hóa toàn bộ lỗi hệ thống về định dạng JSON `ApiResponse<T>` thống nhất.
- **Spring Boot DevTools**: Hỗ trợ Hot-reloading mã nguồn trong môi trường phát triển.

---

## 📂 3. Kiến Trúc Cấu Trúc Mã Nguồn (Project Structure)

```text
backend/src/main/java/com/cangiuoc/cgfoodtour/
├── configuration/          # Cấu hình Spring Security, CORS, Swagger, Cloudinary, Mail
├── constant/               # Định nghĩa các Hằng số hệ thống
├── controller/             # REST API Controllers (Nhận request, trả về ApiResponse)
├── dto/                    # Data Transfer Objects
│   ├── request/            # Request Body DTOs (có validation annotations)
│   └── response/           # Response Body DTOs
├── entity/                 # JPA Entities (Mapping với Database MySQL)
├── enums/                  # Enum định nghĩa Trạng thái, Quyền, Loại lỗi
├── exception/              # Global Exception Handler & Custom AppExceptions
├── mapper/                 # Interfaces MapStruct cho DTO <-> Entity
├── repository/             # Spring Data JPA Repositories
├── service/                # Business Logic Services & Interfaces
└── validator/              # Custom Validation Annotations & Validators
```

---

## 🔗 4. Danh Sách RESTful API Endpoints Chính

### 🔐 Authentication & Account (`/api/v1/auth`)
- `POST /api/v1/auth/register` : Đăng ký tài khoản mới.
- `POST /api/v1/auth/login` : Đăng nhập & Lấy Access Token / Refresh Token.
- `POST /api/v1/auth/refresh` : Gia hạn ngầm Access Token mới từ Refresh Token.
- `POST /api/v1/auth/logout` : Đăng xuất & Hủy Refresh Token.
- `POST /api/v1/auth/google-login` : Đăng nhập bằng Google ID Token.
- `POST /api/v1/auth/forgot-password` : Yêu cầu gửi mã OTP quên mật khẩu qua Email.
- `POST /api/v1/auth/verify-otp` : Xác thực mã OTP.
- `POST /api/v1/auth/reset-password` : Đặt lại mật khẩu mới.

### 🏪 Stores (`/api/v1/stores`)
- `GET /api/v1/stores` : Lấy danh sách quán ăn công khai (hỗ trợ phân trang, lọc danh mục).
- `GET /api/v1/stores/{id}` : Xem thông tin chi tiết 1 quán ăn.
- `POST /api/v1/stores` : Đăng ký tạo quán ăn mới (`PENDING`).
- `PUT /api/v1/stores/{id}` : Cập nhật thông tin quán ăn.
- `PATCH /api/v1/stores/{id}/status` : Phê duyệt, từ chối, ẩn hoặc khôi phục quán (*Admin only*).
- `POST /api/v1/stores/parse-gmaps` : Giải mã link Google Maps & Bóc tách tọa độ GPS.
- `DELETE /api/v1/stores/{id}/hard` : Xóa vĩnh viễn quán ăn (*Hard Delete Cascade*).

### 🍽️ Food Items (`/api/v1/dishes`)
- `GET /api/v1/dishes/store/{storeId}` : Lấy thực đơn món ăn theo quán.
- `POST /api/v1/dishes` : Thêm món ăn mới vào thực đơn.
- `PUT /api/v1/dishes/{id}` : Cập nhật thông tin món ăn.
- `DELETE /api/v1/dishes/{id}` : Xóa món ăn.

### 🏷️ Categories (`/api/v1/categories`)
- `GET /api/v1/categories` : Lấy danh sách danh mục ẩm thực.
- `POST /api/v1/categories` : Thêm danh mục mới (*Admin only*).
- `PUT /api/v1/categories/{id}` : Cập nhật danh mục.
- `DELETE /api/v1/categories/{id}` : Xóa danh mục.

### ☁️ Upload (`/api/v1/upload`)
- `POST /api/v1/upload` : Upload hình ảnh lên Cloudinary CDN.

---

## 📖 5. Tài Liệu Swagger UI & OpenAPI 3.0

Ứng dụng tích hợp sẵn **SpringDoc OpenAPI 3** tự động sinh tài liệu API trực quan. 

Khi khởi chạy server, truy cập các địa chỉ sau:
- **Swagger UI Interactive**: `http://localhost:8080/api/swagger-ui.html`
- **OpenAPI Schema JSON**: `http://localhost:8080/api/api-docs`

---

## 🛠️ 6. Công Nghệ & Thư Viện Sử Dụng

| Công Nghệ | Phiên Bản | Mô Tả |
| :--- | :---: | :--- |
| **Java** | `17` | Ngôn ngữ lập trình chính (LTS Version) |
| **Spring Boot** | `3.5.9` | Framework phát triển dịch vụ Backend |
| **Spring Data JPA / Hibernate** | `3.5.9` | ORM quản lý tương tác cơ sở dữ liệu MySQL |
| **Spring Security** | `6.x` | Bảo mật hệ thống & Phân quyền RBAC |
| **MySQL** | `8.0+` | Hệ quản trị cơ sở dữ liệu quan hệ |
| **Lombok** | Standard | Tự động sinh Getter, Setter, Builder, Constructors |
| **MapStruct** | `1.5.5.Final` | Ánh xạ DTO <-> Entity tự động hiệu năng cao |
| **SpringDoc OpenAPI** | `2.8.15` | Tài liệu tương tác API Swagger UI |
| **Cloudinary Java SDK** | `1.36.0` | Quản lý tải lên & Lưu trữ hình ảnh đám mây |

---

## 💻 7. Hướng Dẫn Cài Đặt & Khởi Chạy Backend

### Yêu Cầu Môi Trường
- **JDK**: Java 17 trở lên (`java -version`)
- **Maven**: 3.8+ (hoặc dùng `mvnw` đi kèm dự án)
- **MySQL**: 8.0+ đang chạy tại `localhost:3306`

### Các Bước Khởi Chạy

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd backend
   ```

2. **Cấu hình Cơ Sở Dữ Liệu MySQL**:
   Tạo Database mới trong MySQL:
   ```sql
   CREATE DATABASE cgfoodtour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Tạo File Cấu Hình Phát Triển (`application-dev.yaml`)**:
   Sao chép file mẫu `application-dev.yaml.example` thành `application-dev.yaml`:
   ```bash
   cp src/main/resources/application-dev.yaml.example src/main/resources/application-dev.yaml
   ```
   Cập nhật thông tin kết nối MySQL, Gmail App Password, JWT SignerKey và Cloudinary API credentials vào file `application-dev.yaml`.

4. **Biên dịch & Khởi chạy Ứng dụng**:
   Sử dụng Maven Wrapper:
   ```bash
   # Hệ điều hành Windows
   .\mvnw spring-boot:run

   # Hệ điều hành Linux / macOS
   ./mvnw spring-boot:run
   ```

5. **Xác nhận trạng thái hoạt động**:
   - Server Backend chạy tại: `http://localhost:8080/api`
   - Kiểm tra API Docs tại: `http://localhost:8080/api/swagger-ui.html`

---

## 🛡️ 8. Quy Chuẩn Đóng Góp Code (Coding Standards)

- **MapStruct Code Generation**: Sau khi thêm/sửa thuộc tính trong DTO hoặc Entity, chạy `mvn clean compile` để MapStruct tái sinh các implementation class.
- **DTO Validation**: Luôn bổ sung validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Email`) trong Request DTOs.
- **Audit Logging**: Các thao tác duyệt/ẩn/từ chối quán ăn phải ghi lại bản ghi trong `StoreAuditLog` để phục vụ công tác kiểm tra lịch sử.

---

⭐ *Cần Giuộc Food Tour Backend API Service - Robust, Secure & Scalable.*
