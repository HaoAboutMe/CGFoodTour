# CẦN GIUỘC FOOD TOUR
## Đặc Tả Yêu Cầu Nghiệp Vụ & Thiết Kế Thực Thể Ẩm Thực (Food Domain Specification)

---

| Thông Tin | Chi Tiết |
| :--- | :--- |
| **Mục tiêu sản phẩm** | Nền tảng Local Food Directory & Community |
| **Phạm vi địa lý** | Huyện Cần Giuộc & khu vực lân cận |
| **Phong cách UI/UX** | Neo-Brutalism (Pill-shaped UI, Viền đen đậm, Đổ bóng khối) |
| **Backend** | Java Spring Boot 3 + MySQL 8.0 |
| **Mobile Client** | Flutter (iOS & Android) |
| **Admin Dashboard** | ReactJS (Vite + TailwindCSS) hoặc Cổng tích hợp tĩnh |
| **Media CDN** | Cloudinary Media API |

---

## 1. TỔNG QUAN NGHIỆP VỤ (BUSINESS DOMAIN OVERVIEW)

**Cần Giuộc Food Tour** là nền tảng ứng dụng di động định hướng cộng đồng ẩm thực cục bộ (Hyper-local Community), tập trung chuyên sâu vào bài toán số hóa danh mục quán ăn, trải nghiệm món ăn và tương tác cộng đồng địa phương tại khu vực Cần Giuộc.

> **Ghi chú tích hợp:** Toàn bộ hạ tầng xác thực (Authentication), định danh người dùng (User/Account), phân quyền (Roles/Permissions/JWT) đã được phát triển sẵn. Tài liệu này chỉ tập trung vào nghiệp vụ cốt lõi của miền ẩm thực (Food Domain) và liên kết với hệ thống Auth thông qua `user_id` (UUID - VARCHAR(255)) trích xuất từ JWT Token trong SecurityContext.

### 1.1. Các Trụ Cột Giải Quyết Bài Toán Thực Tế Địa Phương
1. **Định danh theo Mốc nhận diện Local (Landmark Navigation):**
   * Quán ăn địa phương (đặc biệt là quán vỉa hè, xe đẩy, hẻm nhỏ) thường không có số nhà chuẩn hóa.
   * Hệ thống bắt buộc sử dụng trường mô tả mốc nhận diện thực tế của dân bản địa (`landmarkNote`) (VD: *Cách ngã tư Chợ Trạm 50m hướng về Cần Giuộc, đối diện tiệm vàng Kim Phụng*).
2. **Tọa độ GPS (`latitude` & `longitude`):**
   * Sử dụng để xác định vị trí chính xác của quán ăn trên bản đồ hiển thị cho khách hàng.
   * Đóng vai trò là đầu vào cho thuật toán xác thực phạm vi địa lý (Geo-fencing) khi người dùng báo quán nghỉ trong ngày (chống phá hoại từ xa).
   * **Độ chính xác và khả năng tùy chọn:**
     * Trong trường hợp người đăng quán không biết tọa độ GPS chính xác, hai trường này được cấu hình **nullable (có thể nhận giá trị `null`)**.
     * Trên giao diện, người dùng/admin có thể bỏ trống (hệ thống sẽ tự động gán `null`), hoặc giao diện di động tích hợp chức năng lấy tọa độ hiện tại qua GPS của thiết bị hoặc chọn vị trí trực quan trên bản đồ.
3. **Nhãn xác minh quán (`isVerified`):**
   * Thể hiện trạng thái kiểm duyệt của quán ăn bởi Ban quản trị (Admin).
   * Khi Admin tạo quán hoặc duyệt thông tin từ cộng đồng đóng góp, cờ `isVerified` sẽ được bật (`true`) để hiển thị huy hiệu "Đã xác minh" trên ứng dụng, giúp tăng độ tin cậy của thông tin quán.
4. **Cơ chế Đánh giá 1-Chạm Không Bình Luận (Anti-Toxicity Model):**
   * Triệt tiêu hoàn toàn ô nhập bình luận văn bản (Text Comment) để loại bỏ 100% rủi ro đối thủ dìm hàng, công kích tiêu cực hoặc seeding bẩn.
   * Người dùng chỉ đánh giá qua 3 mức độ trải nghiệm: **Rất hợp (`VERY_SATISFIED` - cộng 1 điểm)**, **Bình thường (`NORMAL` - 0 điểm)**, **Chưa hợp (`NOT_SATISFIED` - trừ 1 điểm)**.
5. **Mô tả Món ăn thay thế cho Thẻ Hương vị tĩnh (Food Description vs Taste Tags):**
   * Thay vì sử dụng danh mục thẻ hương vị tĩnh cứng nhắc (không bao quát được hết các nhóm ẩm thực từ hủ tiếu, cơm tấm đến trà sữa, đồ ăn vặt), hệ thống cho phép người đăng quán tự do viết mô tả ngắn đặc sắc về món ăn (`description`).
6. **Trạng thái Quán theo Cộng đồng Tự quản (Crowdsourced Status):**
   * Tự động tính toán trạng thái mở/đóng cửa theo giờ lý thuyết.
   * Cho phép cộng đồng báo quán nghỉ đột xuất 1-chạm trong ngày kèm xác thực định vị GPS tránh báo khống và áp dụng nhãn cảnh báo mềm.

---

## 2. ĐẶC TẢ TÍNH NĂNG CHI TIẾT (FUNCTIONAL SPECIFICATIONS)

### 2.1. Quản lý Quán ăn & Mốc Nhận Diện Địa Phương (Stores & Landmarks)
* **Thông tin quán:**
  * `name`: Tên quán / Tên quen thuộc của dân địa phương.
  * `landmarkNote`: Mốc nhận diện Local (Bắt buộc).
  * `categoryId`: Phân loại ẩm thực (Hủ tiếu/Bún/Phở, Cơm tấm, Ăn vặt/Ốc, Quán nước/Trà sữa, Đồ nướng/Lẩu).
  * `addressLine`: Địa chỉ bằng chữ (ví dụ: *128 Quốc Lộ 50*).
  * `phoneNumber`: Số điện thoại liên hệ của quán.
  * `latitude` / `longitude`: Tọa độ GPS phục vụ vẽ bản đồ trên Flutter và tính khoảng cách bán kính (công thức Haversine: `< 2km`, `< 5km`, `< 10km`).
  * `openTime` / `closeTime`: Khung giờ mở bán lý thuyết (được truyền nhận dưới dạng chuỗi định dạng `HH:mm` để ánh xạ vào kiểu dữ liệu `LocalTime` trên Spring Boot).
  * `bannerImageUrl`: Hình ảnh quán lưu trữ trên Cloudinary CDN.
  * `isVerified`: Trạng thái xác minh của quán bởi ban quản trị.
* **Tiện ích "Hôm nay ăn gì?":** Tính năng Random thông minh lấy ra ngẫu nhiên 1 quán ăn hoạt động theo danh mục được chọn khi người dùng phân vân.

### 2.2. Quản lý Món ăn & Mô tả Món ăn (Food Items)
* **Cấu trúc món ăn:**
  * Tên món (`name`) & Giá bán tham khảo (`price`).
  * `description`: Mô tả tự do ngắn gọn về đặc trưng hương vị, cách nêm nếm hoặc thành phần của món ăn (VD: *"Nước dùng thanh ngọt, thịt nạc dăm mềm"*).
  * `isSignature`: Cờ đánh dấu món tiêu biểu nhất của quán (Must-Try).
  * `imageUrl`: Hình ảnh món ăn chụp cận cảnh.

### 2.3. Cơ chế Đánh Giá 1-Chạm (Anti-Toxicity Rating System)

| Mức độ Đánh giá | Ý nghĩa Nghiệp vụ & Biểu diễn UI (Neo-Brutalism) |
| :--- | :--- |
| **Rất hợp** (`VERY_SATISFIED`) | Món ăn ngon, đúng khẩu vị. Hiển thị nút viền đen dày, màu xanh lá rực rỡ. |
| **Bình thường** (`NORMAL`) | Chất lượng ổn định, chấp nhận được. Hiển thị màu vàng ấm. |
| **Chưa hợp** (`NOT_SATISFIED`) | Khẩu vị chưa tương thích. Hiển thị màu đỏ dịu. |

* **Quy tắc nghiệp vụ:**
  * Mỗi tài khoản (`user_id` / UUID String) chỉ được vote **1 lần duy nhất** trên mỗi quán (`UNIQUE KEY (user_id, store_id)`).
  * Cho phép người dùng **thay đổi mức vote** bất cứ lúc nào. Khi sửa, hệ thống tự động cập nhật lại các bộ đếm thống kê trên Store (`countVerySatisfied`, `countNormal`, `countNotSatisfied`, `totalVotes`, và `satisfactionRate`).

### 2.4. Thuật toán Xếp Hạng Minh Bạch (Ranking Algorithm)

$$\text{Tỷ lệ đề xuất (\%)} = \left( \frac{\text{Số lượt \"Rất hợp\"}}{\text{Tổng số lượt vote}} \right) \times 100$$

* **Điều kiện xét duyệt lên Bảng xếp hạng:** Quán phải đạt tối thiểu **10 lượt vote** hợp lệ để loại trừ tình trạng quán mới 1 vote 100% chiếm vị trí đầu bảng.
* **Tiêu chí sắp xếp:**
  1. Tỷ lệ đề xuất (% Rất hợp) giảm dần.
  2. Tổng số lượt bình chọn (Volume) giảm dần (khi tỷ lệ bằng nhau).

### 2.5. Cơ chế Báo Quán Nghỉ Tự Động (Crowdsourced Status)
* **Trạng thái lý thuyết:** Tự động tính toán theo khung giờ cài đặt sẵn (`Đang mở cửa` / `Sắp đóng cửa` / `Đã đóng cửa`).
* **Báo nghỉ đột xuất:**
  * Nút bấm 1-chạm: *"Báo quán nghỉ hôm nay"*.
  * Ràng buộc nghiệp vụ chống phá hoại:
    * **Xác thực GPS (Geo-fencing):** Chỉ cho phép bấm báo cáo khi thiết bị di động gửi định vị GPS có khoảng cách thực tế so với quán `< 100m` (sử dụng công thức Haversine tại service layer giữa tọa độ của quán và tọa độ người dùng truyền lên).
    * **Cảnh báo mềm (Soft Warning):** Khi ghi nhận từ **$\ge 3$ người dùng khác nhau** báo cáo trong ngày, quán hiển thị nhãn cảnh báo nổi bật: *"Cộng đồng báo tạm nghỉ hôm nay"*. Quán không bị ẩn hoặc đóng hẳn để tránh ảnh hưởng tiêu cực từ các lượt báo cáo sai lệch.
* **Tự động làm mới (Cron Job):** Đúng 00:00 mỗi ngày, toàn bộ dữ liệu báo cáo nghỉ đột xuất trong ngày tự động được reset/xóa sạch bằng một tác vụ chạy nền định giờ (`@Scheduled(cron = "0 0 0 * * *")`).

---

## 3. THIẾT KẾ DATABASE SCHEMA (MYSQL FOOD DOMAIN)

```sql
-- 1. BẢNG DANH MỤC ẨM THỰC (CATEGORIES)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(255) NULL,
    display_order INT DEFAULT 0
);

-- 2. BẢNG QUÁN ĂN (STORES)
CREATE TABLE stores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20) NULL,
    address_line VARCHAR(255) NOT NULL,
    landmark_note VARCHAR(255) NOT NULL, -- Mốc nhận diện địa phương
    latitude DOUBLE NULL,               -- Định dạng DOUBLE (Nullable) phục vụ tính toán tọa độ GPS
    longitude DOUBLE NULL,              -- Định dạng DOUBLE (Nullable) phục vụ tính toán tọa độ GPS
    open_time TIME NOT NULL,            -- Ánh xạ LocalTime
    close_time TIME NOT NULL,           -- Ánh xạ LocalTime
    price_min DOUBLE DEFAULT 0.0,
    price_max DOUBLE DEFAULT 0.0,
    banner_image_url VARCHAR(255) NULL,
    is_verified BOOLEAN DEFAULT TRUE,    -- Xác minh bởi Admin
    
    -- Các trường đếm tối ưu truy vấn Bảng xếp hạng (Denormalized counters)
    count_very_satisfied INT DEFAULT 0,
    count_normal INT DEFAULT 0,
    count_not_satisfied INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    satisfaction_rate DOUBLE DEFAULT 0.0,
    
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 3. BẢNG MÓN ĂN & THỰC ĐƠN (FOOD_ITEMS)
CREATE TABLE food_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    price DOUBLE NOT NULL,
    image_url VARCHAR(255) NULL,
    description VARCHAR(255) NULL, -- Mô tả ngắn đặc trưng món ăn (thay thế Taste Tags)
    is_signature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 4. BẢNG ĐÁNH GIÁ 1-CHẠM (STORE_RATINGS)
CREATE TABLE store_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Khớp kiểu chuỗi với UUID của User Auth
    store_id BIGINT NOT NULL,
    rating_level ENUM('VERY_SATISFIED', 'NORMAL', 'NOT_SATISFIED') NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY uq_user_store_rating (user_id, store_id),
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 5. BẢNG BÁO CÁO NGHỈ ĐỘT XUẤT (STORE_DAILY_REPORTS)
CREATE TABLE store_daily_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Khớp kiểu chuỗi với UUID của User Auth
    store_id BIGINT NOT NULL,
    report_date DATE NOT NULL,
    created_at TIMESTAMP NULL,
    UNIQUE KEY uq_user_daily_report (user_id, store_id, report_date),
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS (SPRING BOOT)

| Method | Endpoint | Quyền hạn | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | Lấy danh sách danh mục món ăn địa phương. |
| `POST` | `/api/v1/categories` | Admin | Tạo danh mục món ăn mới. |
| `GET` | `/api/v1/categories/{id}` | Public | Lấy chi tiết danh mục món ăn. |
| `PUT` | `/api/v1/categories/{id}` | Admin | Cập nhật thông tin danh mục món ăn. |
| `DELETE` | `/api/v1/categories/{id}` | Admin | Xoá danh mục món ăn. |
| `GET` | `/api/v1/stores` | Public | Lấy danh sách quán ăn (hỗ trợ lọc theo `categoryId`). |
| `POST` | `/api/v1/stores` | Admin | Thêm quán ăn mới (yêu cầu payload map đúng `StoreRequest`). |
| `GET` | `/api/v1/stores/{id}` | Public | Xem chi tiết quán ăn, danh sách món ăn đi kèm và các thống kê bình chọn. |
| `PUT` | `/api/v1/stores/{id}` | Admin | Cập nhật thông tin quán ăn. |
| `DELETE` | `/api/v1/stores/{id}` | Admin | Xóa quán ăn khỏi hệ thống (cascade delete). |
| `GET` | `/api/v1/stores/ranking` | Public | Lấy danh sách Bảng xếp hạng quán ăn theo tỷ lệ % "Rất hợp". |
| `GET` | `/api/v1/stores/random` | Public | Tính năng "Hôm nay ăn gì?" (Lấy ngẫu nhiên 1 quán theo categoryId). |
| `POST` | `/api/v1/stores/{id}/rate` | User Token | Gửi hoặc cập nhật mức đánh giá (`VERY_SATISFIED`, `NORMAL`, `NOT_SATISFIED`). |
| `POST` | `/api/v1/stores/{id}/report-closed` | User Token | Gửi báo cáo quán nghỉ đột xuất hôm nay (đối chiếu khoảng cách tọa độ GPS). |
| `POST` | `/api/v1/food-items/store/{storeId}` | Admin | Thêm món ăn mới vào quán. |
| `GET` | `/api/v1/food-items/store/{storeId}` | Public | Lấy danh sách món ăn thuộc quán. |
| `GET` | `/api/v1/food-items/{id}` | Public | Xem chi tiết món ăn. |
| `PUT` | `/api/v1/food-items/{id}` | Admin | Cập nhật thông tin món ăn. |
| `DELETE` | `/api/v1/food-items/{id}` | Admin | Xoá món ăn khỏi quán. |