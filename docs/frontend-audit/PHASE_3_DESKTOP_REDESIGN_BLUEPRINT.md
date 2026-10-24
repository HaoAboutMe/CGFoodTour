# CG FoodTour — Phase 3: Desktop UX Redesign Blueprint

> **Tài liệu đặc tả kiến trúc và kế hoạch triển khai:** Phase 3 — Desktop UX Redesign
> **Thời điểm lập:** 23/10/2026
> **Trạng thái:** **PHASE 3A COMPLETE — WAITING FOR PRODUCT OWNER APPROVAL TO PROCEED TO PHASE 3B**
> **Mục tiêu:** Tối ưu hóa trải nghiệm người dùng Desktop (1280px, 1440px, 1920px), tận dụng tối đa diện tích màn hình, nâng tầm tính thẩm mỹ Neo-Brutalist chuyên nghiệp mà không gây ảnh hưởng đến giao diện Mobile hiện có.

---

## 1. Executive Summary

Trải qua Phase 0 (Baseline & Business Safety), Phase 1 (Production UI Cleanup) và Phase 2 (Design System Foundation & Accessible Primitives), hệ thống giao diện của CG FoodTour đã đạt được sự ổn định cao về mặt kỹ thuật, khả năng tiếp cận WCAG 2.2 AA cho các component cốt lõi, và không còn mã debug rò rỉ.

Tuy nhiên, giao diện Desktop hiện tại vẫn mang nặng tư duy thiết kế "Mobile-First kéo giãn" (stretched mobile layout):
- Độ rộng trang bị giới hạn ở `max-w-7xl` ($1280\text{px}$), để lại hai dải khoảng trắng khổng lồ trên màn hình 1440px và 1920px.
- Các thanh điều khiển tìm kiếm và bộ lọc danh mục sử dụng cơ chế trượt ngang cảm ứng (`overflow-x-auto`), gây bất tiện cho người dùng chuột và bàn phím máy tính.
- `StoreDetailDrawer` bị cố định ở độ rộng $512\text{px}$ (`sm:max-w-lg`) trên mọi độ phân giải, chiếm chưa tới 27% chiều rộng của màn hình Full HD và lãng phí 73% diện tích còn lại bằng lớp phủ đen mờ.
- Bảng quản trị Admin và trang Quản lý quán của Chủ quán (Owner Portal) sử dụng các form nhập liệu đơn cột kéo dài, thiếu bố cục dạng lưới (multi-column) và bảng dữ liệu rộng (wide data table) phù hợp với thao tác quản trị trên máy tính.

**Phase 3 — Desktop UX Redesign** được thiết kế để giải quyết triệt để các hạn chế này theo một lộ trình phân tách module độc lập (batch-by-batch), với cam kết:
1. **Bảo tồn bản sắc Neo-Brutalist:** Màu Brand Red (`#FF3E3E`), Action Red (`#C92A2A`), font chữ Plus Jakarta Sans, viền đen dày (`border-2 border-black` / `border-3 border-black`), đổ bóng cứng (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`).
2. **Tận dụng nền tảng Phase 2:** Tái sử dụng tối đa bộ Shared Primitives (`Button`, `IconButton`, `FormField`, `Input`, `NativeSelect`, `Dialog`).
3. **Tuyệt đối không hồi quy Mobile:** Bảo toàn 100% giao diện và trải nghiệm đã được nghiệm thu trên các kích thước 320px, 390px, 768px.
4. **Zero Backend Changes:** 100% không can thiệp Backend Java, API contracts, Geolocation hay business rules.

---

## 2. Current Desktop UX Assessment & Page-by-Page Audit

### 2.1. Explore Page (`ExploreSection.jsx`)
- **Visual Hierarchy & Layout:**
  - Khung bao ngoài bị kẹp trong `max-w-7xl` ($1280\text{px}$). Trên màn hình 1440px và 1920px, nội dung bị lọt thỏm ở giữa.
  - Hàng lọc danh mục gồm 6 badge ban đầu + nút mở sheet "+ Xem thêm danh mục". Thao tác mở bottom-sheet để chọn danh mục là tương tác mobile; trên Desktop, việc mở một modal toàn màn hình chỉ để chọn 1 loại món ăn gây đứt gãy luồng tra cứu.
- **Content Density:**
  - Ô tìm kiếm kéo dài 100% bề ngang card ($1200\text{px}$), quá dài so với độ dài một từ khóa ẩm thực thông thường, làm giảm mật độ thông tin.
- **Store Cards Grid:**
  - Hỗ trợ 2 chế độ: Grid (`grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) và Compact list.
  - Trên màn hình 1440px+, chế độ 4 cột có mật độ khá tốt nhưng thẻ card thiếu độ tương phản phân cấp giữa tên quán, địa chỉ và khoảng cách.
- **Tương tác bản đồ:**
  - Bản đồ địa lý hoàn toàn bị ẩn, người dùng không thể biết các quán đang hiển thị nằm tập trung ở khu vực nào (Thị trấn Cần Giuộc, Tân Kim, Phước Lại hay Long Hậu).

### 2.2. Store Detail (`StoreDetailDrawer.jsx`)
- **Visual Hierarchy & Layout:**
  - Trên Desktop ($\ge 1280\text{px}$), Drawer trượt từ bên phải với `max-w-lg` ($512\text{px}$). Chiều rộng này khiến nội dung chi tiết bị bó hẹp trong một cột dọc đơn độc, người dùng phải cuộn chuột rất nhiều để xem ảnh món, thực đơn và phần đánh giá.
  - 73% màn hình Desktop bên trái biến thành backdrop đen mờ vô ích.
- **Desktop Opportunity:**
  - Trên màn hình máy tính, Store Detail cần được mở rộng độ rộng linh hoạt (`max-w-2xl` hoặc `max-w-3xl`, $672\text{px} - 768\text{px}$) hoặc chia thành bố cục 2 cột bên trong drawer: Cột trái gồm ảnh đại diện, thông tin liên hệ, bản đồ mini và nút hành động; Cột phải gồm danh sách món ăn trong thực đơn và các lượt đánh giá.

### 2.3. My Stores & Dish Management (`MyStoresSection.jsx`, `MyDishesSection.jsx`)
- **Bố cục Form nhập liệu:**
  - Khi chủ quán thêm quán mới hoặc chỉnh sửa quán, form hiển thị dạng 1 cột cuộn dài với hơn 15 trường dữ liệu nối tiếp nhau.
  - Người dùng Desktop phải cuộn trang liên tục từ tên quán, danh mục, tọa độ, bản đồ, địa chỉ, số điện thoại, giờ mở cửa đến giá bán.
- **Quản lý thực đơn (Dish Management):**
  - Danh sách món ăn hiển thị dạng thẻ đơn giản. Form thêm món ăn chiếm dụng nhiều diện tích dọc mà không tận dụng được bề ngang của bảng điều khiển.
- **Desktop Opportunity:**
  - Chuyển đổi form tạo/sửa quán sang bố cục 2 cột (Two-Column Master Form): Cột 1 (Thông tin cơ bản, hình ảnh banner); Cột 2 (Vị trí bản đồ, giờ hoạt động, mức giá).
  - Tích hợp Shared Primitives (`FormField`, `Input`, `NativeSelect`) thay thế các input thủ công cũ.

### 2.4. Admin Dashboard (`AdminSection.jsx`)
- **Bố cục Tổng quan & Sidebar:**
  - Đã có sidebar cố định `w-72` (288px) và 4 thẻ thống kê (Metrics cards) ở chế độ 4 cột (`lg:grid-cols-4`). Bố cục này khá tốt trên desktop.
- **Bảng dữ liệu (Data Tables):**
  - Danh sách duyệt quán (`PENDING`, `RECOVERY`) hiển thị dưới dạng bảng HTML thông thường với thanh cuộn ngang `overflow-x-auto`.
  - Các cột dữ liệu chưa được phân bổ tỷ lệ tối ưu cho màn hình rộng; các nút hành động (Chi tiết, Duyệt, Từ chối) xếp chật chội ở cột cuối.
  - Chưa hỗ trợ bộ lọc nhanh theo danh mục hoặc sắp xếp theo thời gian gửi duyệt trực tiếp trên tiêu đề cột (table header sorting).
- **Desktop Opportunity:**
  - Nâng cấp bảng dữ liệu sang **Wide Responsive Data Table** với tiêu đề cột có thể sắp xếp (sortable headers), hiển thị rõ ràng thông tin người đăng ký, danh mục, ngày gửi và các nút thao tác nhanh rõ nét $\ge 44\text{px}$.

### 2.5. Saved Stores & Supporting Pages
- **Quán đã lưu (`SavedStoresSection`):** Hiện hiển thị dạng lưới thẻ đơn giản. Khi danh sách nhiều quán, cần có bộ lọc nhanh theo danh mục tương tự Explore.
- **Về dự án (`AboutSection.jsx`):** Bố cục một cột căn giữa, chữ kéo dài gây mỏi mắt trên màn hình 1440px. Cần chia thành bố cục 2-3 cột giới thiệu tính năng, văn hóa ẩm thực Cần Giuộc và hướng dẫn tham gia tour.
- **Desktop Header:** Bố cục hiện tại đã có thanh điều hướng trung tâm (`Khám Phá`, `Vòng Xoay`, `Đã Lưu`, `Về Dự Án`), cần bổ sung hiệu ứng hover/active neo-brutalist sắc sảo hơn.

---

## 3. Desktop Visual Direction & Design Principles

Bảo tồn 100% bản sắc **Industrial & Neo-Brutalism** của CG FoodTour:

1. **Bảng màu chuẩn hóa (Standardized Palette):**
   - **Nền trang (Canvas):** `#f8f9fa` / `#f7f6f2` (Màu giấy mờ công nghiệp).
   - **Thẻ bề mặt (Surface):** `#ffffff` (Trắng tinh khiết với viền đen nổi bật).
   - **Carbon Ink:** `#111827` cho chữ chính và đường kẻ ranh giới.
   - **Brand Red:** `#ff3e3e` cho các điểm nhấn nhận diện thương hiệu.
   - **Action Red:** `#c92a2a` cho các nút bấm hành động tương tác chính với chữ trắng (đạt WCAG AA 4.63:1).
   - **Focus Ring:** `#2563eb` outline 3px offset 2px rõ nét trên mọi phần tử có tiêu điểm.
2. **Khung viền & Đổ bóng (Borders & Hard Shadows):**
   - Không sử dụng bo tròn quá lớn (tối đa `rounded-xl` hoặc `rounded-2xl`).
   - Đường viền cơ bản: `border-2 border-black` hoặc `border-3 border-black`.
   - Đổ bóng cứng hình học: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` hoặc `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`.
   - Hiệu ứng click chuột (active state): `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
3. **Tối ưu hóa không gian Desktop (Desktop Width Utilization):**
   - Nâng giới hạn chiều rộng nội dung từ `max-w-7xl` ($1280\text{px}$) lên hệ thống container linh hoạt:
     - Màn hình 1280px: Lưới 3 cột chuẩn.
     - Màn hình 1440px: Lưới 4 cột cân đối (`max-w-[1400px] mx-auto px-8`).
     - Màn hình 1920px: Giới hạn tối đa `max-w-[1600px]` để đảm bảo khoảng cách đọc không bị quá dàn trải.

---

## 4. Explore Page — In-Depth Design Decision: Option A vs. Option B

Theo yêu cầu nghiêm ngặt của Product Owner, dưới đây là bảng đánh giá so sánh chi tiết giữa hai phương án kiến trúc cho trang Explore trên Desktop:

### 4.1. Bảng So Sánh Toàn Diện Theo 11 Tiêu Chí

| Tiêu chí | Option A: Enhanced Current Layout (Grid + Dedicated Map Modal/Toggle) | Option B: Desktop Split-View (List Left 50% + Leaflet Pinned Right 50%) |
|---|---|---|
| **1. User Experience** | Trải nghiệm khám phá món ăn thoải mái, thị giác mãn nhãn với ảnh lớn, dễ đọc thực đơn, thích hợp cho người dùng muốn tìm quán ăn ngon. | Trải nghiệm theo vị trí địa lý trực quan, thấy ngay khoảng cách và lộ trình, thích hợp cho người dùng đang tìm đường đi. |
| **2. Information Hierarchy** | Phân cấp thông tin rõ ràng: Ô tìm kiếm $\rightarrow$ Danh mục $\rightarrow$ Lưới quán ăn phong phú $\rightarrow$ Phân trang. Thẻ quán có đủ không gian cho ảnh to, nhãn trạng thái và giá cả. | Thông tin bị ép ngang: Thẻ quán phải co cụm trong bề ngang hẹp $\sim 500-600\text{px}$, ảnh bị thu nhỏ thành thumbnail vuông nhỏ, mất đi sức hút ẩm thực. |
| **3. Map Usefulness** | Bản đồ được mở khi người dùng chủ động yêu cầu (On-Demand), hiển thị toàn màn hình rộng rãi với đầy đủ chỉ dẫn đường đi và bán kính GPS. | Bản đồ luôn hiện diện bên phải, tiện lợi để bấm ghim xem quán, nhưng chiếm cố định 50% màn hình dù người dùng chưa có nhu cầu xem bản đồ. |
| **4. Rendering Performance** | **Xuất sắc**: Chỉ render DOM các thẻ quán; không chạy song song canvas/tile rendering của Leaflet khi người dùng cuộn danh sách. | **Thách thức**: Leaflet liên tục lắng nghe scroll/resize, cập nhật 50-100 markers đồng thời với danh sách, dễ gây giật khung hình (frame drops) trên máy tính phổ thông. |
| **5. Network & API Impact** | **Rất nhẹ**: Không tải hàng chục raster tiles từ OpenStreetMap/CartoDB cho đến khi người dùng bấm mở bản đồ. Tiết kiệm băng thông đáng kể. | **Nặng hơn**: Mỗi lần tải trang Explore là trình duyệt tải ngay lập tức toàn bộ tile bản đồ và tính toán tọa độ marker, tăng tải network ban đầu. |
| **6. Maintenance Complexity** | **Thấp - Trung bình**: Kế thừa trực tiếp cấu trúc của `ExploreSection.jsx`, chỉ tối ưu CSS Grid, typography và thanh lọc đa năng. | **Cao**: Phải xây dựng cơ chế đồng bộ hai chiều (Bidirectional Sync: hover thẻ highlight ghim bản đồ, click ghim cuộn thẻ vào tầm nhìn, pan bản đồ lọc lại danh sách). |
| **7. Desktop Space Utilization** | **Rất tốt**: Dàn trải lưới 3-4 cột đẹp mắt trên màn hình 1440px - 1920px, loại bỏ khoảng trắng thừa hai bên. | **Rất tốt**: Lấp đầy 100% màn hình desktop bằng sự kết hợp giữa danh sách và bản đồ tương tác. |
| **8. Accessibility (WCAG 2.2 AA)** | **Rất cao**: Cây DOM tuyến tính, chu trình phím Tab từ trên xuống dưới mạch lạc, screen reader không bị gián đoạn giữa bản đồ và danh sách. | **Phức tạp**: Chu trình Tab dễ bị "lạc" vào hàng chục nút zoom, ghim bản đồ và iframe bản quyền của Leaflet; cần xử lý `aria-hidden` và focus management tinh vi. |
| **9. Responsive Transition** | **Hoàn toàn tự nhiên**: Chuyển đổi trơn tru từ 1 cột (320px/390px) $\rightarrow$ 2 cột (768px) $\rightarrow$ 3 cột (1280px) $\rightarrow$ 4 cột (1440px+). | **Cần can thiệp lớn**: Khi co cửa sổ từ 1280px xuống 1279px, bản đồ bên phải phải biến mất hoặc unmount, dễ gây lỗi vỡ layout hoặc đơ tile rendering. |
| **10. Implementation Effort** | **Thấp (1-2 ngày)**: Rủi ro kỹ thuật thấp, thời gian triển khai nhanh, tập trung tối đa vào hoàn thiện chi tiết UX. | **Cao (4-6 ngày)**: Đòi hỏi viết mới component `DesktopSplitLayout`, map sync hooks, debounce bounds listener và xử lý resize. |
| **11. Regression Risk** | **Cực thấp (P3)**: Không đụng chạm logic tìm kiếm, bộ lọc hay pagination hiện có. | **Trung bình - Cao (P1)**: Rủi ro xung đột z-index với `StoreDetailDrawer` (`z-[60]`) và `Dialog` (`z-[70]`), rủi ro rò rỉ bộ nhớ Leaflet instance. |

### 4.2. Khuyến Nghị Đề Xuất Cho Product Owner

**Đề Xuất Lựa Chọn: Option A+ — Enhanced Grid Layout với Floating Map Action:**
1. **Lý do lựa chọn:**
   - Ẩm thực Cần Giuộc mang tính trải nghiệm đặc sản địa phương (lạp xưởng tươi, bánh tét, cá lóc nướng, chè). Người dùng tìm kiếm món ăn dựa trên hình ảnh bắt mắt, mức giá và đánh giá uy tín hơn là việc tra cứu đường đi dày đặc như một ứng dụng đặt xe công nghệ.
   - Option A+ giữ cho thẻ quán ăn có kích thước rộng rãi, hình ảnh banner lớn sắc nét, kích thích vị giác tối đa.
   - Bổ sung một nút hành động nổi thông minh **"Bản Đồ Cần Giuộc 🗺️"** (Floating Map Pill Button) ở cạnh dưới màn hình Desktop (tương tự trải nghiệm xuất sắc của Airbnb): Khi cần xem vị trí không gian, người dùng click để mở chế độ bản đồ tương tác toàn màn hình hoặc side-panel mượt mà, nhưng không ép bản đồ chiếm dụng cố định 50% diện tích làm hẹp danh sách món ăn.
   - Đảm bảo 100% khả năng tiếp cận bàn phím (WCAG AA), không phát sinh lỗi đồng bộ Leaflet phức tạp và giữ hiệu năng tải trang đạt điểm tối đa.

*(Nếu Product Owner yêu cầu Option B, đội ngũ kỹ thuật hoàn toàn sẵn sàng triển khai theo thông số kỹ thuật chi tiết đã chuẩn bị sẵn trong Blueprint này).*

---

## 5. Phase 3 Implementation Roadmap (Batch Breakdown)

Phase 3 được chia thành 6 batches độc lập, thực hiện tuần tự để bảo đảm an toàn tuyệt đối:

```text
[ Phase 3A: Planning & Blueprint ] (Đang thực hiện - 0% code change)
                │
                ▼
[ Batch 3B: Explore Page Redesign ] (Desktop Search Bar, Filter Chips, 3-4 Col Grid, Map Action)
                │
                ▼
[ Batch 3C: Store Detail Desktop Experience ] (Expanded Drawer width, 2-column internal layout)
                │
                ▼
[ Batch 3D: Admin Dashboard Redesign ] (Wide Data Table, sortable headers, NativeSelect filter bar)
                │
                ▼
[ Batch 3E: My Stores & Dish Management ] (Two-column responsive form, dish management table)
                │
                ▼
[ Batch 3F: Supporting Pages & Desktop Header ] (Saved Stores, About page, Header active states)
                │
                ▼
[ Batch 3G: Phase 3 Desktop Final QA & Closure ] (Cross-browser, multi-viewport, WCAG audit, Commit)
```

---

## 6. Chi Tiết Từng Batch Triển Khai

### 6.1. Batch 3B — Explore Page Desktop Redesign

1. **Vấn đề UX hiện tại:**
   - Hàng lọc danh mục dùng cuộn ngang cảm ứng, bất tiện trên chuột máy tính.
   - Ô tìm kiếm quá dài, thiếu khoảng đệm trực quan.
   - Thiếu cách tiếp cận bản đồ trực tiếp từ giao diện khám phá.
2. **Thiết kế UX mục tiêu:**
   - Thanh điều khiển trung tâm (Control Deck): Ô tìm kiếm tích hợp `Input` primitive kết hợp với dropdown `NativeSelect` chọn nhanh danh mục chính.
   - Lưới danh mục phổ biến hiển thị dạng 2 hàng thẻ icon trực quan trên desktop thay vì 1 hàng cuộn ngang.
   - Lưới thẻ quán mở rộng sang 3 cột (1280px) và 4 cột (1440px+).
   - Nút nổi "Xem Trên Bản Đồ" ở góc dưới với phím tắt nhanh `M`.
3. **Components & Files bị ảnh hưởng:**
   - `frontend/src/pages/Explore/ExploreSection.jsx`
   - `frontend/src/components/common/StoreCard.jsx`
   - `frontend/src/App.jsx` (container width class)
4. **Layout Specification:**
   - `max-w-[1440px] mx-auto px-6 lg:px-8`
   - Search & Filter bar: `grid grid-cols-1 md:grid-cols-12 gap-4 items-center`
   - Store grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
5. **Design Tokens áp dụng:**
   - `border-3 border-black`, `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
   - Nút lọc active: `bg-[#c92a2a] text-white`
6. **Hợp đồng chức năng bảo toàn:**
   - `searchQuery`, `selectedCategory`, `nearMeActive`, `openNowActive`, pagination (`loadMoreServerStores`).
7. **Ràng buộc Responsive & Accessibility:**
   - Giữ nguyên hiển thị 1 cột trên mobile (`md:hidden`).
   - Mọi nút bấm $\ge 44 \times 44\text{px}$, focus ring xanh cobalt 3px.
8. **Tiêu chí nghiệm thu (Acceptance Criteria):**
   - Không xuất hiện thanh cuộn ngang ở bất kỳ độ phân giải nào (320px - 1920px).
   - Tìm kiếm và lọc danh mục phản hồi ngay lập tức, không gây giật trang.

---

### 6.2. Batch 3C — Store Detail Desktop Experience

1. **Vấn đề UX hiện tại:**
   - Drawer bị giới hạn ở `max-w-lg` ($512\text{px}$), để lại 73% khoảng trống đen mờ trên màn hình desktop 1440px+.
   - Thực đơn món ăn và thông tin liên hệ bị dồn vào 1 cột hẹp, phải cuộn chuột dài.
2. **Thiết kế UX mục tiêu:**
   - Mở rộng Drawer trên Desktop thành **Expanded Side Panel** (`lg:max-w-2xl xl:max-w-3xl`, $672\text{px} - 768\text{px}$).
   - Bố cục 2 cột bên trong phần thân Drawer:
     - Cột trái ($40\%$): Ảnh banner quán, thông tin địa chỉ, giờ mở cửa, số điện thoại, mức giá, bản đồ mini chỉ đường.
     - Cột phải ($60\%$): Danh sách món ăn trong menu dạng lưới 2 cột, danh sách đánh giá của thực khách kèm form gửi đánh giá.
3. **Components & Files bị ảnh hưởng:**
   - `frontend/src/components/drawers/StoreDetailDrawer.jsx`
4. **Layout Specification:**
   - `className="w-full sm:max-w-lg lg:max-w-2xl xl:max-w-3xl bg-white ..."`
   - Thân drawer: `grid grid-cols-1 lg:grid-cols-12 gap-6 p-6`
5. **Hợp đồng chức năng bảo toàn:**
   - Quy trình báo đóng cửa quán GPS 100m, lưu quán (`handleToggleSaveStore`), chia sẻ quán, mở `ImageViewerModal` và `AuthModal`.
6. **Tiêu chí nghiệm thu:**
   - Thao tác đóng bằng phím Escape, nút Close $\ge 44\text{px}$, click backdrop hoạt động chính xác.
   - Nested overlay với `ImageViewerModal` và `AuthModal` không bị phá vỡ.

---

### 6.3. Batch 3D — Admin Dashboard Redesign

1. **Vấn đề UX hiện tại:**
   - Bảng duyệt quán bị tràn ngang, các cột chưa được phân bổ tối ưu.
   - Thao tác duyệt/từ chối chưa có phím tắt hoặc xác nhận trực quan rõ ràng.
2. **Thiết kế UX mục tiêu:**
   - **Wide Data Table:** Bảng dữ liệu quản trị chuẩn Desktop với các cột rõ ràng: Thông tin quán (ảnh + tên + địa chỉ), Chủ sở hữu, Danh mục, Trạng thái, Ngày gửi, Hành động nhanh.
   - Tích hợp thanh công cụ tìm kiếm và lọc trạng thái bằng `NativeSelect` primitive.
   - Phân trang dạng trang số rõ ràng thay vì chỉ cuộn dài.
3. **Components & Files bị ảnh hưởng:**
   - `frontend/src/pages/Admin/AdminSection.jsx`
4. **Hợp đồng chức năng bảo toàn:**
   - Duyệt quán (`/v1/stores/{id}/approve`), Từ chối quán kèm lý do (`/v1/stores/{id}/reject`), Quản lý tài khoản người dùng (`/users/...`), Phân quyền Admin.
5. **Tiêu chí nghiệm thu:**
   - Bảng dữ liệu hiển thị vừa vặn trên desktop 1280px+, không bị vỡ layout khi nội dung tên quán dài.

---

### 6.4. Batch 3E — My Stores & Dish Management

1. **Vấn đề UX hiện tại:**
   - Form tạo/sửa quán kéo dài 1 cột với 15+ trường liên tiếp.
   - Quản lý món ăn đơn điệu, thiếu hiển thị trực quan giá bán và ảnh món.
2. **Thiết kế UX mục tiêu:**
   - **Two-Column Master Form:**
     - Cột 1 (Thông tin nhận diện): Tên quán, Danh mục (`NativeSelect`), Mô tả, Tải ảnh banner quán.
     - Cột 2 (Vị trí & Vận hành): Địa chỉ, Tọa độ GPS & Link Google Maps, Giờ mở/đóng cửa, Khoảng giá (Min - Max).
   - Bảng quản lý thực đơn (Dish Manager): Hiển thị dạng thẻ lưới (Card Grid) có nút sửa/xóa nhanh, hiển thị giá rõ ràng bằng định dạng tiền tệ Việt Nam (`35.000 đ`).
3. **Components & Files bị ảnh hưởng:**
   - `frontend/src/pages/MyStores/MyStoresSection.jsx`
   - `frontend/src/pages/MyStores/MyDishesSection.jsx`
4. **Hợp đồng chức năng bảo toàn:**
   - API tạo/sửa quán (`POST /v1/stores`, `PUT /v1/stores/{id}`), upload banner, upload ảnh món ăn, đơn vị dữ liệu giá bán VND nguyên bản.

---

### 6.5. Batch 3F — Supporting Pages & Desktop Header

1. **Thiết kế UX mục tiêu:**
   - **Saved Stores:** Hiển thị dạng lưới thẻ đồng bộ với Explore, bổ sung thanh tìm kiếm nhanh trong danh sách quán đã lưu.
   - **About Page:** Bố cục 3 cột giới thiệu nét đẹp ẩm thực Cần Giuộc, bản đồ chỉ dẫn du lịch và đội ngũ phát triển.
   - **Desktop Header:** Bổ sung chỉ báo trang hiện tại (active state indicator) sắc nét, làm nổi bật avatar người dùng và menu dropdown tài khoản.
2. **Components & Files bị ảnh hưởng:**
   - `frontend/src/pages/About/AboutSection.jsx`
   - `frontend/src/layouts/Header.jsx`

---

### 6.6. Batch 3G — Phase 3 Desktop Final QA & Closure

1. **Kiểm thử hồi quy toàn diện:**
   - Chạy toàn bộ test suites: `npm run lint`, `npm test`, `npm run build`.
   - Chạy toàn bộ Playwright E2E: primitives, auth-modal, store-detail-drawer, ux-quality, visual-regression.
2. **Kiểm tra đa màn hình Desktop:**
   - 1280 × 800, 1440 × 900, 1920 × 1080.
3. **Kiểm tra chống hồi quy Mobile:**
   - 320 × 568, 390 × 844, 768 × 1024.
4. **Báo cáo nghiệm thu & Git Checkpoint:**
   - Tạo `PHASE_3_FINAL_QA_REPORT.md` và tạo local git commit checkpoint cho Phase 3.

---

## 7. Regression Testing & Production Safety Guardrails

Để đảm bảo Phase 3 không phá vỡ bất kỳ thành quả nào của Phase 0-2:
1. **Kiểm thử tự động trước và sau mỗi Batch:**
   - Mọi batch sau khi chỉnh sửa đều phải chạy `npm run lint` và `npm test` đạt 100% pass trước khi chuyển sang batch tiếp theo.
2. **Không sửa Backend & Không sửa API:**
   - Mọi tương tác API giữ nguyên cấu trúc JSON payload và query parameters.
3. **Bảo toàn Geolocation:**
   - Quy trình báo quán đóng cửa và kiểm tra bán kính GPS 100m bằng `navigator.geolocation` giữ nguyên vẹn 100%.

---

## 8. Decisions Requiring Product Owner Approval (Các Quyết Định Cần Phê Duyệt)

Trước khi bắt đầu viết mã nguồn cho Batch 3B, kính đề nghị Product Owner phê duyệt các nội dung sau:

1. **Quyết định về Explore Page Layout:**
   - **Lựa chọn Option A+ (Khuyến nghị):** Enhanced Responsive Grid (3-4 cột) với nút nổi "Bản Đồ Cần Giuộc" linh hoạt.
   - **Hay Option B:** Desktop Split-View (Danh sách 50% bên trái + Bản đồ Leaflet cố định 50% bên phải).
2. **Quyết định về độ rộng StoreDetailDrawer trên Desktop:**
   - Phê duyệt mở rộng bề ngang Drawer từ `max-w-lg` ($512\text{px}$) lên `max-w-2xl` ($672\text{px}$) hoặc `max-w-3xl` ($768\text{px}$) và bố cục 2 cột nội bộ trên màn hình Desktop.
3. **Phê duyệt lộ trình 6 batches (Batch 3B đến Batch 3G):**
   - Phê duyệt thứ tự ưu tiên triển khai tuần tự theo từng batch độc lập.

---

> **LƯU Ý:** Toàn bộ công việc trong Phase 3A chỉ giới hạn ở mức độ khảo sát, thiết kế kiến trúc và lập Blueprint. **Không có bất kỳ dòng mã nguồn sản phẩm (JSX/CSS) nào bị chỉnh sửa trong batch này.**
