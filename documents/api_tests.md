# CẦN GIUỘC FOOD TOUR - API TESTING GUIDE

Tài liệu này cung cấp các kịch bản mẫu và yêu cầu (HTTP Request) để kiểm thử toàn bộ hệ thống API của Can Giuoc Food Tour. Bạn có thể sử dụng trực tiếp các mã `curl` hoặc cài đặt Extension **REST Client** trên VS Code để chạy trực tiếp các request bên dưới.

---

## CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)
* **Base URL:** `http://localhost:8080/api`
* **Admin Account:** Email `haoaboutme@gmail.com` / Password `admin`
* **User Account:** Đăng ký tài khoản mới hoặc sử dụng tài khoản hiện có.

---

## 1. XÁC THỰC & ĐỊNH DANH (AUTHENTICATION & AUTH)

### 1.1. Đăng nhập lấy JWT Token (Admin / User)
Lấy access token để gán vào Header `Authorization: Bearer <token>` cho các request yêu cầu quyền hạn.

**HTTP Request:**
```http
POST http://localhost:8080/api/auth/token
Content-Type: application/json

{
  "email": "haoaboutme@gmail.com",
  "password": "admin"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "haoaboutme@gmail.com", "password": "admin"}'
```

---

### 1.2. Đăng ký tài khoản mới (User)
Đăng ký một tài khoản mới để test tính năng Đánh giá 1-Chạm hoặc Báo nghỉ quán.

**HTTP Request:**
```http
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "username": "tester_cangiuoc",
  "email": "tester@gmail.com",
  "password": "password123",
  "firstname": "Tester",
  "lastname": "Local",
  "dateOfBirth": "2000-01-01"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "tester_cangiuoc", "email": "tester@gmail.com", "password": "password123", "firstname": "Tester", "lastname": "Local", "dateOfBirth": "2000-01-01"}'
```

---

## 2. QUẢN LÝ DANH MỤC (CATEGORIES API)

### 2.1. Lấy danh sách danh mục (Public)
**HTTP Request:**
```http
GET http://localhost:8080/api/v1/categories
```

**cURL Command:**
```bash
curl -X GET http://localhost:8080/api/v1/categories
```

### 2.2. Tạo danh mục mới (Admin)
*Yêu cầu Bearer Token của Admin trong Header.*

**HTTP Request:**
```http
POST http://localhost:8080/api/v1/categories
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "name": "Lẩu & Đồ Nướng",
  "icon": "fa-fire"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/categories \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Lẩu & Đồ Nướng", "icon": "fa-fire"}'
```

---

## 3. QUẢN LÝ QUÁN ĂN (STORES API)

### 3.1. Tạo quán ăn mới (Admin)
*Yêu cầu Bearer Token của Admin. Các trường địa chỉ (`addressLine`), mô tả mốc nhận diện (`landmarkNote`), v.v., phải được khớp đúng.*

**HTTP Request:**
```http
POST http://localhost:8080/api/v1/stores
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "categoryId": 1,
  "name": "Bánh Mì Chị Đấu",
  "phoneNumber": "0888105940",
  "addressLine": "128 Quốc Lộ 50, Cần Giuộc",
  "landmarkNote": "Gần ngã tư Chợ Trạm, đối diện tiệm vàng Kim Phụng",
  "latitude": 10.603417,
  "longitude": 106.669812,
  "openTime": "05:00",
  "closeTime": "20:00"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/stores \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "name": "Bánh Mì Chị Đấu",
    "phoneNumber": "0888105940",
    "addressLine": "128 Quốc Lộ 50, Cần Giuộc",
    "landmarkNote": "Gần ngã tư Chợ Trạm, đối diện tiệm vàng Kim Phụng",
    "latitude": 10.603417,
    "longitude": 106.669812,
    "openTime": "05:00",
    "closeTime": "20:00"
  }'
```

### 3.2. Cập nhật quán ăn (Admin)
**HTTP Request:**
```http
PUT http://localhost:8080/api/v1/stores/1
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "categoryId": 1,
  "name": "Bánh Mì Chị Đấu (Cập nhật)",
  "phoneNumber": "0888105940",
  "addressLine": "128 Quốc Lộ 50, Cần Giuộc, Long An",
  "landmarkNote": "Gần ngã tư Chợ Trạm 50m hướng về Cần Giuộc, đối diện tiệm vàng Kim Phụng",
  "latitude": 10.603417,
  "longitude": 106.669812,
  "openTime": "05:30",
  "closeTime": "20:30"
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:8080/api/v1/stores/1 \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "name": "Bánh Mì Chị Đấu (Cập nhật)",
    "phoneNumber": "0888105940",
    "addressLine": "128 Quốc Lộ 50, Cần Giuộc, Long An",
    "landmarkNote": "Gần ngã tư Chợ Trạm 50m hướng về Cần Giuộc, đối diện tiệm vàng Kim Phụng",
    "latitude": 10.603417,
    "longitude": 106.669812,
    "openTime": "05:30",
    "closeTime": "20:30"
  }'
```

### 3.3. Xem chi tiết quán ăn bao gồm món ăn & bình luận (Public)
**HTTP Request:**
```http
GET http://localhost:8080/api/v1/stores/1
```

---

## 4. QUẢN LÝ MÓN ĂN (FOOD ITEMS API)

### 4.1. Thêm món ăn vào quán (Admin)
*Thêm món ăn vào quán có storeId cụ thể.*

**HTTP Request:**
```http
POST http://localhost:8080/api/v1/food-items/store/1
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "name": "Bánh mì heo quay đặc biệt",
  "price": 25000.0,
  "description": "Bánh mì giòn nóng hổi, heo quay giòn bì kèm nước sốt pha chế gia truyền",
  "isSignature": true,
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/food/banhmi.jpg"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/food-items/store/1 \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bánh mì heo quay đặc biệt",
    "price": 25000.0,
    "description": "Bánh mì giòn nóng hổi, heo quay giòn bì kèm nước sốt pha chế gia truyền",
    "isSignature": true,
    "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/food/banhmi.jpg"
  }'
```

---

## 5. TƯƠNG TÁC CỘNG ĐỒNG (VOTE & REPORT)

### 5.1. Đánh giá 1-Chạm (User Token)
Đánh giá quán ăn với các mức độ: `VERY_SATISFIED` (+1), `NORMAL` (0), `NOT_SATISFIED` (-1).

**HTTP Request:**
```http
POST http://localhost:8080/api/v1/stores/1/rate
Authorization: Bearer <USER_JWT_TOKEN>
Content-Type: application/json

{
  "ratingLevel": "VERY_SATISFIED"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/stores/1/rate \
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"ratingLevel": "VERY_SATISFIED"}'
```

### 5.2. Báo cáo quán nghỉ trong ngày (User Token - Geo-fencing)
*Gửi tọa độ GPS hiện tại của người dùng. Hệ thống sẽ tự động đối chiếu khoảng cách so với quán ăn. Nếu < 100m, báo nghỉ thành công.*

**HTTP Request:**
```http
POST http://localhost:8080/api/v1/stores/1/report-closed
Authorization: Bearer <USER_JWT_TOKEN>
Content-Type: application/json

{
  "userLatitude": 10.603400,
  "userLongitude": 106.669800
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/stores/1/report-closed \
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"userLatitude": 10.603400, "userLongitude": 106.669800}'
```
