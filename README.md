# 🍜 CGFoodTour - Identity & Authentication Service

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-brightgreen?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-blueviolet?style=for-the-badge)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-green?style=for-the-badge&logo=swagger&logoColor=black)

> Dịch vụ Identity & Authentication độc lập cho ứng dụng **CGFoodTour**, hỗ trợ xác thực JWT, gửi email kích hoạt tài khoản, cấp lại mật khẩu bằng OTP và phân quyền dựa trên Role-Based Access Control (RBAC).

---

## 🚀 Tính Năng Chính

*   **🔐 Xác thực (Authentication):**
    *   Đăng nhập (Login) cấp phát Access Token & Refresh Token.
    *   Đăng xuất (Logout) và vô hiệu hóa Token (Token invalidation).
    *   Introspect Token để kiểm tra tính hợp lệ.
    *   Tự động Refresh Token khi Access Token hết hạn.
*   **📧 Đăng ký & Kích hoạt tài khoản (Email Verification):**
    *   Đăng ký tài khoản mới ở trạng thái chưa kích hoạt.
    *   Gửi email kèm liên kết xác thực tài khoản.
    *   Hỗ trợ gửi lại email kích hoạt (Resend Verification).
*   **🔑 Khôi phục mật khẩu (Password Reset):**
    *   Yêu cầu quên mật khẩu, hệ thống tự động sinh mã OTP và gửi qua Email.
    *   Xác thực OTP và đặt lại mật khẩu mới an toàn.
*   **🛡️ Phân quyền người dùng (RBAC - Role-Based Access Control):**
    *   Quản lý danh sách các Permission (quyền hạn thao tác chi tiết).
    *   Quản lý danh sách các Role (vai trò của người dùng).
    *   Phân quyền chi tiết trên từng API endpoint bằng Spring Security Method Security (`@PreAuthorize`).
*   **📚 Tài liệu API trực quan:** Tích hợp Swagger UI hiển thị danh sách toàn bộ các API Endpoints phục vụ việc tích hợp Frontend.

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Framework** | Spring Boot 3.5.9 (Java 17) |
| **Security** | Spring Security & OAuth2 Resource Server |
| **Authentication** | JWT (JSON Web Token) with Refresh Token |
| **Database** | MySQL 8.0 & Spring Data JPA (Hibernate) |
| **Documentation** | SpringDoc OpenAPI (Swagger UI) |
| **Mapper** | MapStruct (High efficiency Object Mapping) |
| **Utilities** | Project Lombok, Validation, Java Mail Sender |

---

## ⚙️ Cấu Hình Ban Đầu

Trước khi chạy dự án, bạn cần cấu hình các thông số môi trường trong file `src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cgfoodtour
    username: YOUR_DB_USERNAME
    password: YOUR_DB_PASSWORD
  mail:
    username: YOUR_EMAIL@gmail.com
    password: YOUR_APP_PASSWORD # Mã ứng dụng Gmail
jwt:
  signerKey: "your_64_character_hex_secret_key_here"
```

---

## 🏃 Cách Chạy Dự Án

1.  **Cài đặt & Kết nối Database:**
    *   Đảm bảo bạn đã cài đặt MySQL Server.
    *   Tạo database với tên: `cgfoodtour`.

2.  **Khởi động ứng dụng bằng Maven Wrapper:**
    ```bash
    ./mvnw spring-boot:run
    ```
    *Hoặc chạy trực tiếp file `CgFoodTourApplication.java` từ IDE (IntelliJ IDEA).*

3.  **Dữ liệu mặc định (Admin Seed):** Khi chạy lần đầu, hệ thống sẽ tự động khởi tạo tài khoản Admin:
    *   **Email:** `haoaboutme@gmail.com`
    *   **Password:** `admin`

---

## 📖 Tài Liệu API

Sau khi server khởi động thành công (mặc định tại port `8080` với context path `/api`), bạn có thể truy cập tài liệu API tại:

🔗 **Swagger UI:** [http://localhost:8080/api/swagger-ui.html](http://localhost:8080/api/swagger-ui.html)

---

## 📁 Cấu Trúc Thư Mục

```text
src/main/java/com/cangiuoc/cgfoodtour/
├── configuration/     # Cấu hình Security, Swagger, CORS, JWT Decoder, Init Admin
├── controller/        # Các REST API Endpoints (Auth, Users, Roles, Permissions)
├── dto/               # Data Transfer Objects (Request/Response)
├── entity/            # JPA Entities (Lớp mapping Database)
├── enums/             # Định nghĩa Role Enum
├── exception/         # Xử lý Exception & ErrorCodes
├── mapper/            # Ánh xạ dữ liệu (Entity <-> DTO)
├── repository/        # Lớp giao tiếp Database (Spring Data JPA)
├── service/           # Xử lý logic nghiệp vụ chính (Auth, User, Email, Roles, Permissions)
└── validator/         # Các custom Annotation Validator
```
