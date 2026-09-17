# 🍜 Cần Giuộc Food Tour - Frontend Application

> **Ứng dụng web khám phá ẩm thực Cần Giuộc** – Trải nghiệm bản đồ món ngon, tìm kiếm địa điểm ăn uống, quản lý quán ăn và đánh giá cộng đồng với phong cách thiết kế **Neo-Brutalist** hiện đại, độc đáo và tối ưu hóa trải nghiệm người dùng.

![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite 8](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Lucide React](https://img.shields.io/badge/Lucide_React-1.34-F56565?style=for-the-badge&logo=react&logoColor=white)

---

## 🌟 1. Giới Thiệu Dự Án

**Cần Giuộc Food Tour** là nền tảng web hướng tới việc kết nối người dân địa phương và du khách với những địa điểm ăn uống độc đáo tại huyện Cần Giuộc, tỉnh Long An. 

Ứng dụng cho phép người dùng:
- **Khám phá** danh sách quán ăn theo danh mục ẩm thực, tìm kiếm tức thì và lọc vị trí gần nhất bằng GPS.
- **Xem chi tiết quán ăn** với thông tin mở/đóng cửa tính theo thời gian thực, hotline, banner ảnh và liên kết chỉ đường Google Maps.
- **Đóng góp & Quản lý quán**: Đăng quán ăn mới qua form từng bước (Wizard 3 bước), cập nhật thực đơn món ăn, chỉnh sửa thông tin.
- **Tương tác cộng đồng**: Đánh giá độ hài lòng (Hài lòng / Bình thường / Không hài lòng), gửi bình luận và nhận phản hồi.
- **Trải nghiệm Gamification**: Minigame chọn quán ngẫu nhiên phong cách mở hòm CS2 (*Counter-Strike 2 Case Opener*) với tỷ lệ rớt phẩm cấp độc đáo.

---

## 🚀 2. Tính Năng Nổi Bật

### 🔍 1. Khám Phá & Tìm Kiếm (`ExploreSection`)
- **Bộ lọc đa dạng**: Tìm kiếm theo tên quán, địa chỉ hoặc danh mục món ăn (Bún riêu, Phở, Trà sữa, Bánh mì,...).
- **Tính khoảng cách GPS (Haversine)**: Tự động xác định khoảng cách từ vị trí hiện tại của người dùng đến các quán ăn theo kilometer.
- **Sắp xếp thông minh**: Sắp xếp theo mức độ hài lòng, lượt bình chọn, khoảng cách gần nhất hoặc trạng thái đang mở cửa.

### 📱 2. Chi Tiết Quán Ăn (`StoreDetailDrawer`)
- **Trạng thái hoạt động Realtime**: Tự động tính toán giờ mở/đóng cửa theo thời gian hiện tại của thiết bị (`checkStoreOpenStatus`).
- **Liên kết Google Maps chuẩn xác**: Hỗ trợ dán link ngắn `maps.app.goo.gl` và tự động giải mã tọa độ ngầm qua backend.
- **Phóng to hình ảnh (`ImageViewerModal`)**: Xem ảnh banner và hình ảnh thực đơn chất lượng cao.

### 🏪 3. Quản Lý Quán Ăn Cá Nhân (`MyStoresSection`)
- **Multi-Step Form Wizard 3 Bước (Đăng Quán Mới)**:
  - **Step 1**: Thông tin cơ bản (Tên quán, Danh mục, Hotline, Giờ mở/đóng cửa).
  - **Step 2**: Địa chỉ & Tự động bóc tách link Google Maps.
  - **Step 3**: Tải ảnh Banner & Khối Tóm tắt xem trước Neo-Brutalist.
- **Chỉnh sửa dạng Accordion**: Tách biệt thành các khối collapsible giúp thao tác nhanh chóng và không bị quá tải giao diện.
- **Quản lý Thực đơn (`MyDishesSection`) & Lịch sử đề xuất (`MySubmissionsSection`)**.

### 🛡️ 4. Hệ Thống Quản Trị Viên (`AdminSection`)
- **Duyệt / Từ chối / Ẩn / Khôi phục Quán**: Thao tác kèm Modal nhập lý do chuyên nghiệp (`StoreActionModal`).
- **Quản lý danh mục ẩm thực**: Thêm/sửa danh mục và bộ chọn biểu tượng tương tác (`CategoryIconPicker`).
- **Thống kê tổng quan**: Đếm số yêu cầu chờ duyệt, tổng số quán và lượt vote cộng đồng.

### 🎮 5. Minigame Giải Trí CS2 Case Opener (`CS2CaseOpener`)
- Mô phỏng vòng quay mở hòm Counter-Strike 2 để chọn quán ngẫu nhiên khi người dùng chưa biết ăn gì.
- Phân cấp độ hiếm quán ăn: *Consumer Grade*, *Industrial Grade*, *Mil-Spec*, *Restricted*, *Classified*, *Covert*, *Extraordinary (★)* với hiệu ứng âm thanh và animation sinh động.

---

## 🎨 3. Phong Cách Thiết Kế (Design System)

- **Neo-Brutalism Styling**: Đổ bóng đậm góc cạnh (`shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`), viền đen dày (`border-2 border-black`), màu sắc tương phản cao tạo ấn tượng thị giác mạnh mẽ.
- **Clean Text UI Policy**: 100% sử dụng biểu tượng vector chuẩn từ `lucide-react`, loại bỏ hoàn toàn các ký tự text emoji rải rác.
- **Responsive Layout**: Tối ưu hoàn hảo cho cả thiết bị di động (Mobile Bottom Navigation Bar) và màn hình máy tính (Header Navigation bar).

---

## 📂 4. Kiến Trúc Cấu Trúc Thư Mục (Target Structure)

Dự án được tổ chức theo kiến trúc **Module chuẩn ReactJS** cùng cấu hình **Vite Path Alias `@/`**:

```text
frontend/src/
├── assets/                  # Tài nguyên tĩnh (ảnh hero, logo)
├── components/              # UI Components tái sử dụng
│   ├── common/              # Components giao diện nhỏ (Button, Card, Icon...)
│   │   ├── CategoryIcon.jsx
│   │   ├── CategoryIconPicker.jsx
│   │   ├── CustomSelect.jsx
│   │   ├── MapPicker.jsx
│   │   ├── StoreCard.jsx
│   │   ├── CS2StoreCardCTA.jsx
│   │   └── DevConsole.jsx
│   ├── modals/              # Các cửa sổ Modal / Hộp thoại
│   │   ├── AuthModal.jsx
│   │   ├── ImageViewerModal.jsx
│   │   └── StoreActionModal.jsx
│   └── drawers/             # Bảng trượt Side Drawer
│       └── StoreDetailDrawer.jsx
├── layouts/                 # Khung điều hướng & Layout chính
│   ├── Header.jsx           # Thanh Header phía trên
│   └── BottomNav.jsx        # Thanh Navigation phía dưới di động
├── pages/                   # Màn hình & Section chính
│   ├── Explore/             # Trang Khám phá (`ExploreSection.jsx`)
│   ├── About/               # Trang Giới thiệu (`AboutSection.jsx`)
│   ├── Profile/             # Trang Cá nhân (`ProfileSection.jsx`)
│   ├── Admin/               # Màn hình Quản trị (`AdminSection.jsx`)
│   ├── MyStores/            # Quản lý Quán & Thực đơn (`MyStoresSection.jsx`, `MyDishesSection.jsx`,...)
│   ├── CS2CaseOpener/       # Minigame mở hòm (`CS2CaseOpener.jsx`)
│   └── Widgets/             # Khối Widgets ngẫu nhiên (`WidgetsSection.jsx`)
├── utils/                   # Hàm tiện ích chung (`timeUtils.js`)
├── App.jsx                  # Root Component & Điều hướng chính
├── App.css                  # Style tùy chỉnh ứng dụng
├── index.css                # Global CSS & Tailwind CSS Tokens
└── main.jsx                 # Entry Point ứng dụng
```

---

## 🛠️ 5. Công Nghệ & Thư Viện Sử Dụng

| Công Nghệ | Phiên Bản | Mô Tả |
| :--- | :---: | :--- |
| **React** | `^19.2.8` | Core UI Library (Hooks, Suspense, Lazy Loading) |
| **Vite** | `^8.2.2` | Build Tool & Dev Server siêu tốc |
| **TailwindCSS** | `^4.3.3` | Utility-first CSS Framework phiên bản v4 mới nhất |
| **React Router DOM** | `^7.18.2` | Thư viện điều hướng trang web (Client-side Routing) |
| **Lucide React** | `^1.34.0` | Thư viện biểu tượng SVG đồng bộ & sắc nét |
| **Leaflet** | `^1.9.4` | Tích hợp bản đồ trực quan |

---

## 💻 6. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Môi Trường
- **Node.js**: `v18.0.0` trở lên
- **npm**: `v9.0.0` trở lên

### Các Bước Khởi Chạy

1. **Di chuyển vào thư mục frontend**:
   ```bash
   cd frontend
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`)**:
   Tạo file `.env` tại thư mục gốc `frontend/` (nếu chưa có):
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **Khởi chạy Server Phát Triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ mặc định: `http://localhost:5173`

5. **Đóng gói sản xuất (Production Build)**:
   ```bash
   npm run build
   ```

6. **Xem trước bản đóng gói (Preview Production)**:
   ```bash
   npm run preview
   ```

---

## 📜 7. Quy Chuẩn Đóng Góp & Phát Triển Code (Coding Conventions)

- **Import Path Alias**: Ưu tiên sử dụng cú pháp alias `@/` thay vì đường dẫn tương đối nhiều tầng `../../` (Ví dụ: `import StoreCard from '@/components/common/StoreCard'`).
- **Performance Optimization**: Sử dụng `React.lazy()` và `Suspense` cho các màn hình nặng (`AdminSection`, `MyStoresSection`, `CS2CaseOpener`) để tối ưu dung lượng Bundle ban đầu.
- **Clean Text Policy**: Tuyệt đối không chèn emoji dạng text trong mã HTML/JSX, thay thế toàn bộ bằng Lucide Icons.

---

⭐ *Dự án Cần Giuộc Food Tour được xây dựng với tâm huyết mang lại giá trị thực cho cộng đồng ẩm thực địa phương.*
