# 🍜 Cần Giuộc Food Tour - Full-Stack Web Application

> **Nền tảng web khám phá ẩm thực Cần Giuộc toàn diện** – Tích hợp giao diện người dùng **React 19 + Vite 8** phong cách Neo-Brutalist độc đáo cùng hệ thống Back-end **Java 17 + Spring Boot 3.5 & Spring Security JWT** hiệu năng cao.

![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite 8](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS v4](https://img.shields.io/badge/Tailwind-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Java 17](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot 3.5](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Swagger UI](https://img.shields.io/badge/Swagger_OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## 🌟 1. Giới Thiệu Dự Án

**Cần Giuộc Food Tour** là ứng dụng web Full-stack cho phép người dùng khám phá, tìm kiếm địa điểm ăn uống, đăng ký quản lý quán ăn và tham gia đánh giá cộng đồng tại huyện Cần Giuộc, tỉnh Long An.

Dự án áp dụng mô hình **Client-Server Architecture** tách biệt hoàn toàn giữa Front-end SPA và Back-end RESTful API Services, giúp ứng dụng đạt tốc độ phản hồi tối ưu, bảo mật cao và dễ dàng mở rộng.

---

## 🏗️ 2. Cấu Trúc Tổng Thể Dự Án (Monorepo Layout)

Dự án được phân chia thành 2 sub-projects chính cho Frontend và Backend:

```text
CanGiuocFoodTour/
├── 📱 frontend/              # Ứng dụng Single Page Application (React 19 + Vite 8)
│   ├── src/
│   │   ├── components/      # Reusable UI components (common, modals, drawers)
│   │   ├── layouts/         # Frame Layouts (Header, BottomNav)
│   │   ├── pages/           # Screens chính (Explore, Admin, MyStores, CS2CaseOpener...)
│   │   └── utils/           # Utility functions (timeUtils, Haversine GPS...)
│   ├── vite.config.js       # Vite configuration & Path Alias `@/`
│   └── README.md            # Tài liệu hướng dẫn Frontend chi tiết
│
├── ☕ backend/               # Dịch vụ RESTful API (Java 17 + Spring Boot 3.5)
│   ├── src/main/java/       # Source code (Controller, Service, Entity, Security, Mapper)
│   ├── src/main/resources/  # Configuration (application-dev.yaml)
│   ├── pom.xml              # Maven dependencies & Plugins
│   └── README.md            # Tài liệu hướng dẫn Backend chi tiết
│
└── 📄 README.md             # Master README của toàn bộ dự án
```

---

## 🚀 3. Tính Năng Nổi Bật

| Phân Hệ | Tính Năng Nổi Bật | Công Nghệ Sử Dụng |
| :--- | :--- | :--- |
| **Bảo Mật & Xác Thực** | • Đăng nhập / Đăng ký / Quên mật khẩu qua OTP Email.<br>• Tự động gia hạn ngầm Access Token (**30 phút**) & Refresh Token (**30 ngày**).<br>• Đăng nhập nhanh bằng Google OAuth2 (SSO). | Spring Security 6, JWT (Nimbus JOSE), OAuth2 Resource Server, Mail Starter |
| **Khám Phá Ẩm Thực** | • Lọc quán ăn theo vị trí gần nhất bằng tọa độ GPS (Haversine).<br>• Tính toán giờ mở/đóng cửa tính theo thời gian thực.<br>• Bộ lọc danh mục ẩm thực tức thì. | React 19, Lucide React, Haversine GPS, Responsive Design |
| **Quản Lý Quán Ăn** | • Multi-Step Form Wizard 3 bước đăng quán mới.<br>• Tự động bóc tách link Google Maps ngầm (`maps.app.goo.gl`) bằng Backend Redirect Tracer.<br>• Quản lý thực đơn món ăn & xem lịch sử đề xuất. | Java `HttpURLConnection` Redirect Tracer, MapStruct 1.5, Custom Regex |
| **Quản Trị Viên (Admin)** | • Phê duyệt / Từ chối / Ẩn / Khôi phục quán ăn kèm Modal lý do.<br>• Quản lý danh mục & bộ chọn icon.<br>• Xóa vĩnh viễn an toàn (*Hard Delete Cascade* 4 bảng con). | Spring Data JPA Cascade, Audit Log Engine, Modal Portals |
| **Tải Ảnh Đám Mây** | • Tải ảnh banner quán ăn, hình ảnh món ăn và avatar trực tiếp lên CDN. | Cloudinary Java SDK, Frontend File Uploader |
| **Gamification** | • Minigame mở hòm chọn quán ngẫu nhiên phong cách **CS2 Case Opener** với 7 cấp độ hiếm. | Dynamic Sound Effects, CSS Keyframe Animations |

---

## 💻 4. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Yêu Cầu Môi Trường
- **Node.js**: `v18.0.0` trở lên
- **Java Development Kit (JDK)**: Java 17 trở lên
- **MySQL Database**: `8.0+` chạy tại `localhost:3306`

---

### Bước 1: Khởi Chạy Back-end (Spring Boot Service)

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo database trong MySQL
mysql -u root -p -e "CREATE DATABASE cgfoodtour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Tạo file cấu hình phát triển từ mẫu
cp src/main/resources/application-dev.yaml.example src/main/resources/application-dev.yaml
# (Cập nhật thông tin DB username/password và JWT secret trong application-dev.yaml)

# 4. Khởi chạy Backend Server
# Windows:
.\mvnw spring-boot:run
# Linux/macOS:
./mvnw spring-boot:run
```
👉 *Backend API sẽ sẵn sàng tại:* `http://localhost:8080/api`  
👉 *Tài liệu Swagger UI API tại:* `http://localhost:8080/api/swagger-ui.html`

---

### Bước 2: Khởi Chạy Front-end (React + Vite Web App)

Mở một cửa sổ Terminal mới:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt Dependencies
npm install

# 3. Khởi chạy Dev Server
npm run dev
```
👉 *Ứng dụng Web Front-end sẽ sẵn sàng tại:* `http://localhost:5173`

---

## 📖 5. Tài Liệu Chi Tiết Sub-Projects

Để xem chi tiết hơn về cấu trúc thư mục, quy chuẩn viết code và tài liệu API dành riêng cho từng phần, tham khảo các file hướng dẫn sau:
- 📱 **[Frontend README.md](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/README.md)**: Hướng dẫn chi tiết cấu trúc ReactJS Module, Path Alias, Tailwind CSS v4 & Minigames.
- ☕ **[Backend README.md](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/backend/README.md)**: Hướng dẫn chi tiết kiến trúc Layered Architecture, Spring Security, JWT, Google Maps Parser & REST API Specs.

---

⭐ *Cần Giuộc Food Tour - Tự hào sản phẩm số hóa ẩm thực Cần Giuộc, Long An.*
