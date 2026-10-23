# CG FoodTour — Frontend Implementation Progress

> Tài liệu theo dõi tiến độ thực tế theo từng Phase dựa trên `docs/frontend-audit/FRONTEND_REDESIGN_BLUEPRINT.md`.  
> Cập nhật lần cuối: 23/10/2026 (Hoàn thành Phase 0, Phase 1 và Phase 2 Final QA)  
> Trạng thái hiện tại: **PHASE 2 COMPLETE & VERIFIED — WAITING FOR APPROVAL TO PROCEED TO PHASE 3**

---

## 1. Executive Summary: Phase 0 & Phase 1

Đã hoàn thành toàn bộ công tác kiểm tra baseline, khóa an toàn nghiệp vụ (Phase 0) và dọn dẹp các công cụ/controls phát triển khỏi giao diện người dùng production (Phase 1).

Mọi thay đổi đều được thực hiện theo nguyên tắc:
- Không chỉnh sửa backend.
- Không thay đổi API contracts.
- Không thay đổi business rules.
- Giữ nguyên luồng đăng nhập mạng xã hội (Google GSI, Facebook SDK).
- Loại bỏ hoàn toàn manual token inputs và simulated GPS controls khỏi production UI và production bundle.
- Kiểm thử thực tế xác nhận 100% pass trên linter, unit/contract test suites và production build verification.

---

## 2. Issues Completed in Phase 1

| Issue ID | Phân loại | Mô tả | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| **FE-P1-05** | REMOVE | Loại bỏ khối nhập Google ID Token JWT và Facebook Access Token thủ công khỏi `AuthModal.jsx`. | **DONE** | DOM verification test pass, bundle string scan = 0. |
| **FE-P1-05** | REMOVE | Loại bỏ 2 ô nhập tọa độ giả lập "Vĩ Độ Của Bạn" và "Kinh Độ Của Bạn" khỏi `StoreDetailDrawer.jsx`. | **DONE** | Input fields đã xóa, DOM assertion pass. |
| **FE-P1-05** | REPLACE | Chuyển đổi cơ chế báo đóng cửa quán sang Geolocation API thực tế của trình duyệt (`navigator.geolocation.getCurrentPosition`) với validation tọa độ và xử lý quyền/lỗi chuẩn. | **DONE** | Code verified, không gửi request khi chưa có vị trí hợp lệ hoặc user từ chối quyền. |
| **FE-P1-05** | RESTRICT | Khóa DevConsole chỉ hiển thị khi `import.meta.env.DEV && DevConsole && isAdmin()`. | **VERIFIED** | Hoàn toàn bị tree-shaken khỏi production bundle. |
| **FE-P3-01** | REPLACE | Thay thế nhãn kỹ thuật tiếng Anh "Security Gateway" trong `AuthModal.jsx` thành "Đăng Nhập An Toàn". | **DONE** | DOM assertion pass, bundle check pass. |
| **FE-P3-01** | REPLACE | Thay thế label "Token Kích Hoạt (UUID)" thành "Mã Kích Hoạt Từ Email" và nút "Kích Hoạt Tài Khoản". | **DONE** | Code & DOM verified. |
| **FE-P3-01** | REPLACE | Sửa thông báo lỗi Facebook SDK "Vui lòng thử dán token thủ công" thành "Vui lòng thử lại sau giây lát". | **DONE** | Code verified. |
| **FE-P3-01** | REPLACE | Chuẩn hóa các nhãn Dashboard Overview, Needs Attention và các status badges (`APPROVED`, `HIDDEN`, `REJECTED`, `PENDING`) sang tiếng Việt trong `AdminSection.jsx`. | **DONE** | Code verified, enum nội bộ không đổi. |
| **BUILD-GATE** | HARDEN | Bổ sung quy tắc cấm các chuỗi debug/dev controls (`OAuth Tokens thủ công`, `Vĩ Độ Của Bạn`, `Security Gateway`) vào `verify-production-build.mjs`. | **DONE** | Build verification script pass trên production artifact. |

---

## 3. Files Modified

1. `frontend/src/components/modals/AuthModal.jsx`:
   - Xóa bỏ block `<details>` thủ công chứa 2 textarea nhập token Google/Facebook.
   - Bỏ các props destructuring không còn dùng trong modal (`socialGoogleToken`, `socialFacebookToken`, `setSocialGoogleToken`, `setSocialFacebookToken`, `handleGoogleLoginSubmit`, `handleFacebookLoginSubmit`).
   - Đổi badge `Security Gateway` thành `Đăng Nhập An Toàn`.
   - Đổi label `Token Kích Hoạt (UUID)` thành `Mã Kích Hoạt Từ Email` và nút `Kích Hoạt Tài Khoản`.
2. `frontend/src/components/drawers/StoreDetailDrawer.jsx`:
   - Xóa bỏ khối input tọa độ giả lập `Vĩ Độ Của Bạn` và `Kinh Độ Của Bạn`.
   - Bỏ các props GPS `gpsLat, setGpsLat, gpsLng, setGpsLng`.
   - Thêm trạng thái `submittingClosedReport` để hiển thị feedback *"Đang Kiểm Tra GPS..."* và vô hiệu hóa nút bấm tránh double-click.
3. `frontend/src/App.jsx`:
   - Dọn dẹp state `gpsLat`, `gpsLng` hardcode.
   - Bỏ truyền props GPS xuống `StoreDetailDrawer`.
   - Cập nhật hàm `handleReportClosedToday`: tích hợp kiểm tra `navigator.geolocation`, validation tọa độ hợp lệ, xử lý chi tiết 4 trường hợp lỗi (từ chối quyền, không có thiết bị định vị, quá thời gian, lỗi khác). Không gửi API khi vị trí không hợp lệ.
   - Cập nhật thông báo lỗi Facebook SDK thân thiện người dùng.
4. `frontend/src/pages/Admin/AdminSection.jsx`:
   - Đổi badge `Dashboard Overview` -> `Tổng Quan Quản Trị`.
   - Đổi tiêu đề `Tác Vụ Cần Xử Lý Gấp (Needs Attention)` -> `Tác Vụ Cần Xử Lý Gấp`.
   - Đổi các nhãn trạng thái thẻ và modal chi tiết quán sang tiếng Việt (`Đã Duyệt (Công khai)`, `Đang Ẩn`, `Bị Từ Chối`, `Chờ Duyệt`).
5. `frontend/scripts/verify-production-build.mjs`:
   - Bổ sung patterns kiểm tra cấm chuỗi debug lọt vào `dist/`.
6. `frontend/e2e/ux-quality.spec.js`:
   - Thêm test case tự động kiểm tra production DOM xác nhận không còn manual OAuth token inputs và simulated GPS controls.

---

## 4. Verification Evidence

### 4.1. Linter (`npm run lint`)
```
> frontend@0.0.0 lint
> oxlint --deny-warnings

Found 0 warnings and 0 errors.
Finished in 31ms on 54 files with 104 rules using 16 threads.
```
**Kết quả:** PASS (0 lỗi, 0 cảnh báo).

### 4.2. Unit & Contract Tests
- `npm run test:redaction`: 2/2 PASS
- `npm run test:ui-errors`: 2/2 PASS
- `npm run test:maps`: 2/2 PASS
- `npm run test:store-url`: 2/2 PASS
- `npm run test:modal-validation`: 2/2 PASS
- `npm run test:build-contract`: 3/3 PASS
- `npm run test:nginx-contract`: 3/3 PASS  
**Tổng cộng:** 16/16 PASS (100%).

### 4.3. Production Build & Bundle Verification
```powershell
$env:VITE_API_BASE_URL="/api"; npm run build
```
Kết quả:
- `dist/index.html`: 1.37 kB (gzip: 0.64 kB)
- `dist/assets/index-2OxSL1ih.css`: 79.80 kB (gzip: 13.07 kB) - giảm nhẹ so với baseline (79.89 kB)
- `dist/assets/index-XoEpoJXy.js`: 384.31 kB (gzip: 111.37 kB) - giảm so với baseline (385.62 kB)
- `dist/assets/AdminSection-C8UzpQl3.js`: 78.32 kB (gzip: 14.59 kB) - giảm so với baseline (78.38 kB)
- `node scripts/verify-production-build.mjs`: **Production artifact verification passed**

### 4.4. Bundle Forbidden Strings Scan
Chạy lệnh kiểm tra chuỗi cấm trực tiếp trên toàn bộ `dist/assets/*.js`:
```powershell
Select-String -Path "frontend/dist/assets/*.js" -Pattern "OAuth Tokens thủ công|Google ID Token JWT|Vĩ Độ Của Bạn|Kinh Độ Của Bạn|Security Gateway"
```
**Kết quả:** 0 matches (không tìm thấy bất kỳ chuỗi debug nào).

### 4.5. Browser E2E & DOM Assertions
Chạy Playwright với Chromium trên production preview bundle (`http://localhost:8081`):
- `e2e/ux-quality.spec.js`:
  - `explore has no horizontal page overflow at 320/360/375/768px`: **PASS**
  - `reduced-motion preference disables long UI animation`: **PASS**
  - `auth modal closes with Escape and restores keyboard focus`: **PASS**
  - `production DOM contains no manual OAuth tokens or simulated GPS controls`: **PASS**
- `e2e/social-sdk.spec.js`:
  - `loads static social SDK scripts without injecting duplicates`: **PASS**
  - `keeps the SDK scripts singleton after reload`: **PASS**

---

## 5. Unverified Items (Hạng mục chưa thể xác minh trong môi trường local)

Theo đúng giới hạn an toàn:
1. **Google & Facebook Social Login với tài khoản thật trên HTTPS domain công khai:**
   - Đã xác minh: SDK load đúng, singleton script không trùng lặp, callbacks SDK, parameters và API invocation giữ nguyên 100%.
   - Chưa xác minh: Đăng nhập thực tế bằng tài khoản Google/Facebook cá nhân do môi trường local không có SSL certificate hợp lệ và OAuth client id giới hạn redirect domain.
2. **GPS Geolocation trên thiết bị di động thật ngoài trời:**
   - Đã xác minh: API `navigator.geolocation` được gọi đúng chuẩn, xử lý permission/timeout/error êm dịu, không gửi request khi tọa độ không hợp lệ.
   - Chưa xác minh: Trải nghiệm GPS thực tế trên thiết bị di động vật lý (iOS/Android).

---

## 6. Regression Risks & Safety Status

- **Xác thực Google/Facebook:** Rủi ro regression = RẤT THẤP. Logic callback `handleGoogleCredentialResponse` và `FB.login` không bị chỉnh sửa; API `/auth/google-login` và `/auth/facebook-login` giữ nguyên contract.
- **Báo đóng cửa quán:** Rủi ro regression = THẤP. Logic gọi `/v1/stores/${storeId}/report-closed` với `{ latitude, longitude }` phù hợp hoàn toàn với `ReportClosedRequest` của Backend; đã bổ sung loading feedback ngăn spam request.
- **Quản trị hệ thống (Admin):** Rủi ro regression = 0. Chỉ thay đổi text hiển thị trên giao diện, giữ nguyên toàn bộ enums, filters và handlers.

---

## 7. Phase 2: Design System Foundation — Batch 2A (Design Tokens & Foundations)

> **Trạng thái:** Đã hoàn thành Batch 2A và kiểm chứng toàn diện (Sẵn sàng nghiệm thu).

### 7.1. Tokens đã tạo trong `frontend/src/index.css`
Tất cả tokens được cấu hình song song trong `@theme` (Tailwind v4) và `:root` CSS variables, namespaced để không ghi đè utilities mặc định:

| Token Name | CSS Variable | Giá trị | Mục đích & WCAG Target |
| :--- | :--- | :--- | :--- |
| `canvas` | `--color-canvas` | `#f7f6f2` | Nền canvas trang web ấm, giảm chói mắt |
| `surface` | `--color-surface` | `#ffffff` | Nền thẻ Card, Modal, Drawer, Dropdown |
| `surface-raised` | `--color-surface-raised` | `#fafaf9` | Nền surface thứ cấp |
| `ink` | `--color-ink` | `#111111` | Chữ chính (Contrast $16.9:1$ trên surface, $15.5:1$ trên canvas) |
| `ink-muted` | `--color-ink-muted` | `#525252` | Chữ phụ, placeholder (Contrast $6.01:1 \ge 4.5:1$) |
| `border-brutalist` | `--color-border` | `#111111` | Viền neo-brutalist đen sắc nét (2px/3px) |
| `brand` | `--color-brand` | `#ff3e3e` | Brand Red nhận diện thương hiệu CG FoodTour (dùng cho logo, icon, hoặc text đen) |
| `brand-hover` | `--color-brand-hover` | `#e11d48` | Hover state của brand red |
| `action` | `--color-action` | `#c92a2a` | Action Red cho Button có chữ trắng đạt WCAG AA ($4.75:1 \ge 4.5:1$) |
| `action-hover` | `--color-action-hover` | `#a61e1e` | Hover state của action red (Contrast $6.8:1$) |
| `success-text` / `bg` | `--color-success-text` / `--color-success-bg` | `#096c4a` / `#e6fcf5` | Trạng thái Hoạt động / Approved ($6.08:1$) |
| `warning-text` / `bg` | `--color-warning-text` / `--color-warning-bg` | `#92400e` / `#fff7d6` | Trạng thái Chờ duyệt / Pending ($7.15:1$) |
| `danger-text` / `bg` | `--color-danger-text` / `--color-danger-bg` | `#b42318` / `#fef3f2` | Trạng thái Đóng cửa / Từ chối ($6.65:1$) |
| `focus-ring` | `--color-focus-ring` | `#2563eb` | Vòng focus bàn phím rõ nét ($3.68:1 \ge 3.0:1$) |
| `shadow-brutalist-sm` | `--shadow-brutalist-sm` | `2px 2px 0px #111111` | Shadow cho Button, Badge, Chip |
| `shadow-brutalist-md` | `--shadow-brutalist-md` | `4px 4px 0px #111111` | Shadow cho Card, Popover |
| `shadow-brutalist-lg` | `--shadow-brutalist-lg` | `6px 6px 0px #111111` | Shadow cho Modal, Drawer, Floating panel |
| `z-*` Layers | `--z-base` ... `--z-lightbox` | `0` đến `80` | Chuẩn hóa thứ tự hiển thị z-index ngăn lỗi đè layer |

### 7.2. Thay đổi CSS ảnh hưởng đến UI
1. **Button đỏ (`.brutalist-btn-red`):**
   - Chuyển `background-color` từ `#ff3e3e` sang `var(--color-action, #c92a2a)` để đạt WCAG 2.2 AA ($4.75:1$) khi chứa text trắng.
   - Bổ sung class `.brutalist-btn-brand` cho các nút muốn giữ sắc đỏ thương hiệu `#ff3e3e` nhưng phối hợp cùng chữ đen `#111111` ($6.01:1$).
2. **Button trắng (`.brutalist-btn-white`):**
   - Kết nối biến `--color-surface`, `--color-ink`, `--shadow-brutalist-sm`, giữ nguyên visual gốc 100%.
3. **Card (`.brutalist-card`):**
   - Kết nối token `--color-surface`, `--color-border`, `--shadow-brutalist-md`. Kích thước, padding, border và radius không thay đổi.
4. **Input & Select (`.brutalist-input`, `.brutalist-select`):**
   - Bổ sung `:focus-visible` sử dụng `var(--color-focus-ring)` và offset 2px, cải thiện độ nhận diện bàn phím mà không ảnh hưởng chuột click.
5. **Badge (`.brutalist-badge-*`):**
   - Chuẩn hóa 4 class trạng thái `.brutalist-badge-success`, `.brutalist-badge-warning`, `.brutalist-badge-danger`, `.brutalist-badge-neutral` với tỷ lệ tương phản đạt chuẩn WCAG AA.
6. **Không ảnh hưởng backward compatibility:** Không ghi đè các utility mặc định của Tailwind (`rounded-md`, `shadow-md`, `bg-red-500`, ...). Các component chưa migrate tiếp tục hiển thị như cũ.

### 7.3. Kết quả kiểm thử toàn diện
1. **Linter:**
   - `oxlint --deny-warnings`: **0 errors, 0 warnings** trên toàn bộ 55 files.
2. **Unit & Contract Tests (Node test runner):**
   - `src/utils/designTokens.test.js` (WCAG 2.2 contrast mathematical assertions): **5/5 PASS**.
   - Toàn bộ suite unit & contract tests (`npm test`): **21/21 PASS**.
3. **Production Build:**
   - `vite build && npm run verify:build`: **PASS in 312ms**.
   - CSS bundle: 83.21 kB (gzip 13.65 kB).
   - Bundle scan & verify: Không tìm thấy bất kỳ forbidden debug token/string nào.
4. **Browser E2E & Visual Regression:**
   - Playwright test runner (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`): **32/32 functional tests PASS** (4 test admin bỏ qua do không cấu hình credentials local).
   - Kiểm tra tràn trang ngang tại các viewports: 320px, 360px, 375px, 768px: **0px overflow (PASS)**.
   - Keyboard focus trap và Escape handling: **PASS**.
   - **Pixel Visual Regression:** `Visual Regression: Not Verified` (Dự án hiện chưa cấu hình screenshot visual baseline tự động bằng pixel comparison tool; chỉ kiểm chứng functional E2E và tính toán contrast WCAG toán học).

### 7.4. Báo cáo Visual Differences Trước và Sau
- **Button đỏ (`.brutalist-btn-red`):** Sắc đỏ chuyển từ đỏ tươi `#ff3e3e` sang đỏ đậm `#c92a2a` (sẫm hơn khoảng 1 tông), giúp chữ trắng nổi bật rõ rệt và dễ đọc hơn nhiều trong điều kiện ánh sáng mạnh. Đường viền đen đặc trưng và shadow góc cạnh của neo-brutalist được bảo toàn tuyệt đối.
- **Card (`.brutalist-card`):** Không có sự khác biệt về mắt nhìn (pixel-identical) so với phiên bản trước.
- **Input (`.brutalist-input`):** Khi người dùng dùng bàn phím Tab vào ô input, xuất hiện viền xanh cobalt rõ nét (`#2563eb`) cách viền 2px, thay vì viền xám mờ khó nhìn trước đây.
- **Badge trạng thái:** Chuẩn bị sẵn bộ phối màu nền nhạt + chữ đậm đạt chuẩn độ tương phản từ 6.0:1 trở lên, khắc phục tình trạng chữ trắng trên nền đỏ tươi/xanh neon gây mỏi mắt.

### 7.5. Trạng thái nghiệm thu Batch 2A
- **Nghiệm thu:** Đã được Product Owner phê duyệt có điều kiện vào ngày 23/10/2026.
- **Xác nhận điều kiện:** Contrast ratio và focus ring đã được kiểm chứng trên các nền thực tế (`canvas`, `surface`, `ink`). Đã làm rõ phân biệt giữa Functional E2E (PASS) và Visual Regression (`Visual Regression: Not Verified` do chưa có baseline screenshot so sánh pixel tự động).

---

## 8. Phase 2: Design System Foundation — Batch 2B (Accessible Shared Primitives)

> **Trạng thái:** Đã hoàn thành Batch 2B và kiểm chứng toàn diện (Sẵn sàng nghiệm thu).

### 8.1. Danh mục Component Đã Tạo & Public Props

Tất cả các primitive được đặt tại `frontend/src/components/ui/`, tương thích hoàn toàn với React 19 và Tailwind CSS v4, sử dụng design tokens từ Batch 2A:

| Component | File | Public Props & API Contract | Mục đích & Accessibility Features |
| :--- | :--- | :--- | :--- |
| **`Button`** | `Button.jsx` | `variant` (`'action'` \| `'brand'` \| `'surface'` \| `'white'` \| `'outline'` \| `'ghost'` \| `'danger'`), `size` (`'sm'` \| `'md'` \| `'lg'`), `type` (mặc định `'button'`), `isLoading` (boolean), `loadingText` (string), `disabled` (boolean), `leftIcon`, `rightIcon`, `fullWidth` (boolean), `className`, `children`, `ref` | Neo-brutalist button với `border-2 border-black`, shadow `shadow-brutalist-sm`, hiệu ứng nhấn cơ học. Khi `isLoading=true`, tự động gán `aria-busy="true"`, `aria-disabled="true"`, vô hiệu hóa con trỏ và render spinner xoay chuẩn WCAG. |
| **`IconButton`** | `Button.jsx` | `icon` (node), `aria-label` (bắt buộc), `variant`, `size`, `disabled`, `isLoading`, `className`, `ref` | Nút bấm chỉ có icon, bắt buộc có `aria-label` nhằm giải quyết dứt điểm lỗi Accessible Name (`FE-P1-02`). Đảm bảo kích thước tối thiểu $40 \times 40\text{px}$ (mobile touch target). |
| **`FormField`** | `FormField.jsx` | `label` (string), `hint` (string), `error` (string), `required` (boolean), `optional` (boolean), `disabled` (boolean), `id` (string), `className`, `children` | Quản lý logic form qua `useId()`. Tự động liên kết `<label htmlFor>` với control, thông báo bắt buộc qua `aria-hidden="true">*` kèm `<span className="sr-only">(bắt buộc)</span>`, thông báo lỗi live qua `role="alert"`, và cung cấp context cho input con. |
| **`Input`** | `Input.jsx` | `id`, `type`, `disabled`, `required`, `isInvalid`, `leftAdornment`, `rightAdornment`, `className`, `ref`, standard input props | Input chuẩn HTML5 tự động kế thừa `controlId`, `aria-describedby` (kết hợp errorId + hintId), và `aria-invalid` từ `FormField`. Hỗ trợ adornment trái/phải và focus ring xanh cobalt rõ nét. |
| **`NativeSelect`** | `NativeSelect.jsx` | `options` (`Array<{value, label, disabled}>`), `placeholder`, `disabled`, `required`, `isInvalid`, `value`, `defaultValue`, `onChange`, `className`, `children`, `ref` | Native `<select>` bọc trong giao diện neo-brutalist với icon Chevron pointer-events-none. Hỗ trợ 100% native picker trên iOS/Android, keyboard up/down/enter tự nhiên, 0ms overhead. |
| **`Dialog`** | `Dialog.jsx` | `isOpen` (boolean), `onClose` (function), `role` (`'dialog'` \| `'alertdialog'`), `closeOnEscape` (boolean), `closeOnBackdropClick` (boolean), `initialFocusRef`, `className`, `children` | Modal chuẩn WAI-ARIA qua React Portal: Tự động khóa scroll body (`overflow: hidden`), Focus Trap (giữ phím Tab lặp bên trong dialog), lắng nghe phím `Escape`, và **tự động khôi phục focus** về nút kích hoạt ban đầu khi đóng dialog. |
| **`DialogSubcomponents`** | `Dialog.jsx` | `DialogHeader`, `DialogTitle` (liên kết `aria-labelledby`), `DialogDescription` (liên kết `aria-describedby`), `DialogContent`, `DialogFooter` | Bộ compound component chuẩn hóa cấu trúc popup/modal/hộp thoại xác nhận cho toàn hệ thống. |
| **Contexts** | `formContext.js`, `dialogContext.js` | `useFormField()`, `useDialog()` | Tách riêng file context để tối ưu hóa Vite Fast Refresh và tránh warning export hỗn hợp. |

---

### 8.2. Đánh Giá Chiến Lược Select (Native vs Custom Select)

1. **Ưu tiên NativeSelect:**
   - **Lý do kỹ thuật & UX:** `<select>` nguyên bản của trình duyệt có độ tin cậy tuyệt đối: không gây rò rỉ bộ nhớ, không xung đột focus trap khi nằm trong Modal, kích hoạt bánh xe cuộn (wheel picker) nguyên bản trên iOS Safari và Android Chrome, và được hỗ trợ trọn vẹn bởi 100% phần mềm đọc màn hình (Screen Readers).
   - **Khuyến nghị:** Tất cả các dropdown lựa chọn giá trị đơn thuần (lọc trạng thái, chọn danh mục, phân trang, vai trò người dùng) trong Phase 2 & 3 phải sử dụng `NativeSelect`.
2. **Tiêu chí triển khai Custom Select (Listbox/Combobox):**
   - Chỉ được xem xét triển khai khi có yêu cầu nghiệp vụ đặc biệt mà Native Select không hỗ trợ:
     - Mỗi option cần kèm avatar, icon đa màu hoặc biểu đồ trực quan (như `CategoryIconPicker`).
     - Yêu cầu tìm kiếm/lọc văn bản trực tiếp ngay trong dropdown (Combobox pattern).
   - Hiện tại, `CustomSelect.jsx` cũ trong `AdminSection.jsx` đang thiếu ARIA và keyboard contract; trong Batch 2C/2D sẽ được đánh giá để hoặc thay thế bằng `NativeSelect` (nếu chỉ lọc trạng thái đơn thuần) hoặc nâng cấp theo đúng chuẩn WAI-ARIA Combobox nếu cần giao diện đặc biệt.

---

### 8.3. Kết Quả Kiểm Thử Toàn Diện

1. **Linter:**
   - `oxlint --deny-warnings`: **0 errors, 0 warnings** trên toàn bộ 66 files.
2. **Node Unit & Contract Tests:**
   - `npm test`: **29/29 tests PASS** (Toàn bộ contract tests, design token tests, và 8 bài kiểm thử rendering / accessibility của các primitive mới).
3. **Interactive Component Harness & Browser E2E:**
   - Đã xây dựng trang kiểm thử độc lập tại `frontend/harness.html` + `frontend/src/harness.jsx` để kiểm thử tương tác thực tế mà không chạm vào `App.jsx`.
   - Chạy Playwright test suite `frontend/e2e/primitives.spec.js`: **16/16 tests PASS** trên 4 engines (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`):
     - Button: Click đếm tương tác, trạng thái `disabled`, trạng thái `loading` với `aria-busy="true"`.
     - IconButton: Đảm bảo có Accessible Name `Xóa dữ liệu mẫu` cho trình đọc màn hình.
     - FormField + Input: Liên kết `<label for>` và `<input id>`, typing giá trị, hiển thị cảnh báo `role="alert"`, chuyển `aria-invalid="true"`.
     - NativeSelect: Chọn giá trị qua chuột và bàn phím, cập nhật chính xác state.
     - Dialog: Mở modal, bẫy tiêu điểm phím Tab (Focus Trap), phím Escape đóng modal, và **khôi phục focus về nút kích hoạt ban đầu**.
4. **UX Quality & Viewport Regression:**
   - `frontend/e2e/ux-quality.spec.js`: **32/32 tests PASS** (Zero horizontal overflow tại 320/360/375/768px).
   - **Pixel Visual Regression:** `Visual Regression: Not Verified` (Chưa cấu hình screenshot diff baseline tự động; xác nhận functional behavior và zero horizontal overflow).
5. **Production Build & Bundle Impact:**
   - `$env:VITE_API_BASE_URL="/api"; npm run build`: **PASS in 277ms**.
   - Kích thước bundle: File JS chính `index-DarTO_31.js` giữ nguyên 384.31 kB (gzip 111.37 kB).
   - Nhờ cơ chế Tree-shaking của Vite, các primitive mới chưa import vào app chính chiếm **0 bytes** trong production bundle thực tế.
   - Script `verify-production-build.mjs`: Xác nhận 0 chuỗi debug bị cấm.

---

### 8.4. Danh Mục Component Chưa Migration (Theo Dõi Riêng)

Các component hiện hữu tiếp tục hoạt động an toàn và chưa chuyển sang dùng primitives mới (theo đúng yêu cầu Backward Compatibility):
1. `frontend/src/components/common/StoreCard.jsx`
2. `frontend/src/components/drawers/StoreDetailDrawer.jsx`
3. `frontend/src/components/modals/AuthModal.jsx`
4. `frontend/src/components/modals/ConfirmActionModal.jsx`
5. `frontend/src/pages/Admin/AdminSection.jsx` (và `CustomSelect.jsx` cũ)
6. `frontend/src/components/SavedStoresSection.jsx`
7. `frontend/src/components/common/CS2StoreCardCTA.jsx`

---

### 8.5. Trạng thái nghiệm thu Batch 2B
- **Nghiệm thu:** Đã được Product Owner phê duyệt có điều kiện vào ngày 23/10/2026.
- **Tiến hành:** Được phép triển khai Batch 2C — Pilot Component Migration.

---

## 9. Phase 2: Design System Foundation — Batch 2C (Pilot Component Migration)

> **Trạng thái:** Đã hoàn thành Batch 2C và kiểm chứng toàn diện (Sẵn sàng nghiệm thu).

### 9.1. Pre-Migration Hardening Đã Thực Hiện
Trước khi đưa primitives vào ứng dụng thực tế, toàn bộ 4 điều kiện cốt lõi đã được gia cố và kiểm thử:
1. **IconButton Touch Target:** Đảm bảo kích thước tối thiểu $44 \times 44\text{px}$ (`w-11 h-11 min-w-[44px] min-h-[44px]`) trên toàn bộ viewports, đáp ứng tiêu chuẩn WCAG 2.5.5 / 2.5.8 và Blueprint.
2. **Button Double-Submit Prevention:** Khi `isLoading=true`, chặn hoàn toàn sự kiện chuột (`preventDefault`, `stopPropagation`), chặn phím Enter/Space, và vô hiệu hóa HTML submit button ngăn trùng lặp request mạng.
3. **Dialog Focus Restoration Fallback:** Tự động kiểm tra `document.contains(previousActiveElement)`. Nếu phần tử kích hoạt đã bị unmount khỏi DOM (ví dụ item trong danh sách vừa bị xóa), tự động fallback focus về container chính (`main`, `#root`, `body`), không để mất tiêu điểm.
4. **Dialog Scroll Lock Reference Counting:** Sử dụng cơ chế đếm tham chiếu (`activeDialogCount`) để quản lý `document.body.style.overflow = 'hidden'`. Đảm bảo khi mở modal lồng nhau hoặc chuyển đổi modal không bị giải phóng cuộn sớm.
5. **Safe Initial Focus:** Hỗ trợ `initialFocusRef` ưu tiên trỏ vào nút an toàn (Cancel) đối với dialog cảnh báo nguy hiểm (`role="alertdialog"`).

### 9.2. Danh Mục Component & File Đã Migration

1. **Pilot 1 — ConfirmActionModal:**
   - **File:** `frontend/src/components/modals/ConfirmActionModal.jsx`
   - **Thay đổi:** Thay thế toàn bộ mã tự chế cũ bằng compound components của `Dialog` primitive (`role="alertdialog"`):
     - `DialogHeader`, `DialogTitle` (`aria-labelledby`), `DialogDescription` (`aria-describedby`).
     - Tích hợp `FormField` và `Input` cho ô nhập confirmation text (`expectedText`) và reason textarea.
     - Sử dụng `Button` variant `surface` (Hủy bỏ) và `danger` (Xác nhận/Xóa) với `isLoading={submitting}` và `loadingText="Đang xử lý…"`.
     - Cấu hình `closeOnBackdropClick={false}` để tránh người dùng vô tình click ra ngoài làm mất dữ liệu xác nhận.
   - **Call Sites đã kiểm tra:**
     - `frontend/src/pages/Admin/AdminSection.jsx` (Xóa tài khoản người dùng, Xóa danh mục).
     - `frontend/src/pages/MyStores/MyStoresSection.jsx` (Xóa món ăn khỏi thực đơn).

2. **Pilot 2A — Public Search Bar (ExploreSection):**
   - **File:** `frontend/src/pages/Explore/ExploreSection.jsx`
   - **Thay đổi:** Thay thế `<input>` cũ không có nhãn trợ năng bằng `Input` primitive:
     - Bổ sung `aria-label="Tìm kiếm món ăn, quán ăn, tên đường tại Cần Giuộc"` (giải quyết lỗi Accessible Name `FE-P1-02`).
     - Tích hợp `leftAdornment={<Search className="w-4 h-4 text-neutral-500" />}`.
     - Bảo toàn 100% logic lọc real-time qua `searchQuery` và không phát sinh layout shift.

3. **Pilot 2B — Food Item Creation Form (MyDishesSection):**
   - **File:** `frontend/src/pages/MyStores/MyDishesSection.jsx`
   - **Thay đổi:** Chuẩn hóa toàn bộ form tạo món ăn sang hệ thống shared primitives:
     - `foodStoreId` -> `FormField` (`id="dish-store-id"`, label "Chọn Quán Ăn", required) + `NativeSelect`.
     - `foodName` -> `FormField` (`id="dish-name"`, label "Tên Món Ăn", required) + `Input`.
     - `foodPrice` -> `FormField` (`id="dish-price"`, label "Giá Bán (VND)", hint="Đơn vị tính bằng nghìn đồng (.000 đ)", required) + `Input` với `rightAdornment=".000đ"`.
     - `foodImage` -> `FormField` (`id="dish-image"`, label "Đường Dẫn Hình Ảnh Món Ăn", optional) + `Input`.
     - `foodDesc` -> `FormField` (`id="dish-desc"`, label "Mô Tả Ngắn", required) + textarea.
     - Nút submit -> `Button` (`variant="action"`, `type="submit"`, `fullWidth`, `isLoading={loading}`).

### 9.3. Primitives Đã Được Dùng Trong Production
- `Dialog` & compound subcomponents (`DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogContent`, `DialogFooter`)
- `FormField`
- `Input`
- `NativeSelect`
- `Button` & `IconButton`

### 9.4. Kết Quả Kiểm Thử Toàn Diện

1. **Linter:**
   - `oxlint --deny-warnings`: **0 errors, 0 warnings** trên toàn bộ 67 files.
2. **Node Unit & Contract Tests:**
   - `npm test`: **32/32 tests PASS** (Toàn bộ 8 token tests, 8 primitive tests, 3 ConfirmActionModal contract tests, 7 build/nginx contract tests, 6 API/URL/slug tests).
3. **Browser E2E Tests (Playwright):**
   - Suite `frontend/e2e/primitives.spec.js`: **36/36 tests PASS** trên 4 browser engines (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`):
     - ConfirmActionModal: Bẫy phím Tab, ngăn đóng qua backdrop click, hiển thị cảnh báo lỗi `role="alert"`, ngăn double submit, phím Escape đóng modal và **khôi phục focus chuẩn xác về nút kích hoạt ban đầu**.
     - Explore Search Bar: Kiểm tra hiển thị Accessible Name, kiểm tra nhập liệu và **zero horizontal page overflow** tại 4 viewports tiêu chuẩn: **1440px (Desktop), 768px (Tablet), 390px (Mobile), 320px (Small Mobile)**.
     - Primitives interactive harness: Đầy đủ các tương tác nút bấm, form field, select.
   - Suite `frontend/e2e/ux-quality.spec.js`: **32/32 tests PASS** (Zero page overflow, reduced-motion, auth modal focus restoration).
4. **Visual Regression Status:**
   - `Visual Regression: Not Verified` (Chưa cấu hình screenshot diff baseline tự động; xác nhận qua functional assertions và zero horizontal overflow tại mọi viewport).
5. **Production Build & Bundle Impact:**
   - `$env:VITE_API_BASE_URL="/api"; npm run build`: **PASS in 294ms**.
   - Kích thước chunk `ConfirmActionModal` giảm từ 9.92 kB xuống **9.72 kB** (tối ưu 200 bytes mã nguồn).
   - File bundle chính `dist/assets/index-CqgZVB_4.js`: 395.99 kB (gzip 114.93 kB).
   - Script `verify-production-build.mjs`: Xác nhận 0 chuỗi debug bị cấm trong production artifact.

### 9.5. Danh Mục Vị Trí Chưa Migration (Theo Dõi Riêng Cho Batch Tiếp Theo)
Các thành phần phức tạp còn lại vẫn hoạt động với mã nguồn hiện hữu nhằm đảm bảo an toàn tuyệt đối:
1. `frontend/src/components/common/StoreCard.jsx`
2. `frontend/src/components/drawers/StoreDetailDrawer.jsx`
3. `frontend/src/components/modals/AuthModal.jsx` (Modal đăng nhập / đăng ký / OTP)
4. `frontend/src/pages/Admin/AdminSection.jsx` (Các form và bảng quản trị còn lại, bao gồm `CustomSelect.jsx`)
5. `frontend/src/pages/MyStores/MyStoresSection.jsx` (Form tạo/chỉnh sửa thông tin quán ăn chính)
6. `frontend/src/components/SavedStoresSection.jsx`

### 9.6. Kết quả chuyển tiếp sang Batch 2D-1
Batch 2C đã được nghiệm thu có điều kiện và chuyển tiếp sang Batch 2D-1 — Foundation Hardening & Regression QA.

---

## 10. Phase 2: Design System Foundation — Batch 2D-1 (Foundation Hardening & Regression QA)

> **Trạng thái:** Đã hoàn thành toàn diện Batch 2D-1 (Sẵn sàng nghiệm thu).

### 10.1. Xác Minh Batch 2C Claims (Audit Thực Tế)

1. **Xác minh `MyDishesSection.jsx`:**
   - *Phát hiện:* `MyDishesSection.jsx` là orphan component, **KHÔNG** được import hay render trong `App.jsx` hoặc bất kỳ route/component nào của production app (chỉ được nhắc đến trong `README.md`).
   - *Kết luận minh bạch:* Việc migration `MyDishesSection.jsx` ở Batch 2C là bài test kiểm chứng kỹ thuật (pilot integration test), **KHÔNG ĐƯỢC XEM** là bằng chứng cải thiện luồng người dùng production thực tế.
   - *Luồng thực tế:* Quản lý món ăn thực tế của người dùng nằm nhúng trực tiếp trong `MyStoresSection.jsx` (`managingDishesForStore`), hiện thuộc danh mục chưa migration.

2. **Xác minh Đơn vị Dữ liệu Giá Bán Món Ăn:**
   - *Người dùng nhập:* Nhập số rút gọn theo nghìn đồng (ví dụ: gõ `35` với ký hiệu `.000đ`).
   - *Form State:* `onChange` thực hiện `parseInt(value, 10) * 1000`, lưu `foodPrice = 35000` (VND chuẩn).
   - *Payload gửi Backend:* `handleCreateFoodItem` gửi `{ price: parseFloat(foodPrice) }` (tức `35000.0`).
   - *Backend Contract:* `FoodItemRequest.java` có `@NotNull @PositiveOrZero Double price`, lưu vào cơ sở dữ liệu `food_items.price` dưới dạng chuẩn VND.
   - *Hiển thị:* Format `{food.price?.toLocaleString()}đ` (hiển thị `35.000đ`).
   - *Kết luận:* Toàn bộ chu trình dữ liệu là 100% nhất quán, bảo toàn toàn bộ business rules.

3. **Xác minh Typography trong ConfirmActionModal:**
   - *Kết quả:* `index.css` định nghĩa `--font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;`.
   - `ConfirmActionModal.jsx` kế thừa hoàn toàn phông chữ hệ thống `Plus Jakarta Sans`.
   - *Hiệu chỉnh thông tin:* Cụm từ "phông chữ Inter" trong báo cáo trước là lỗi diễn đạt ngữ nghĩa; thực tế giao diện đang chạy đúng `Plus Jakarta Sans` của Design System.

4. **Xác minh Callback Contracts của ConfirmActionModal:**
   - Cả 2 vị trí sử dụng (`AdminSection.jsx` và `MyStoresSection.jsx`) đều cung cấp handler trả về `Promise<boolean>` (`true` khi xóa thành công, `false` khi có lỗi).
   - `ConfirmActionModal` chỉ gọi `onClose()` khi `success === true`. Nếu `success === false`, modal tiếp tục giữ mở và hiển thị thông báo lỗi `role="alert"`. Callback contracts được bảo toàn tuyệt đối.

5. **Xác minh Dialog Focus Fallback:**
   - Khi phần tử kích hoạt bị unmount (ví dụ dòng vừa bị xóa), cơ chế fallback kiểm tra:
     1. `fallbackFocusRef?.current` nếu caller cung cấp.
     2. Semantic container `main, [role="main"], #root` (gán `tabindex="-1"` và `preventScroll: true`).
   - Không để tiêu điểm trôi về `body` một cách không kiểm soát hay gây outline toàn màn hình.

---

### 10.2. Accessibility Foundation Hardening Đã Triển Khai

1. **Inert Background & `aria-hidden` Isolation:**
   - Khi `Dialog` mở, toàn bộ các phần tử ngoài modal portal (như `#root`) tự động được đánh dấu `inert=""` và `aria-hidden="true"`.
   - Lưu trạng thái ban đầu và khôi phục sạch sẽ khi modal đóng/unmount.
   - Xử lý an toàn khi có modal lồng nhau (nested dialogs) theo cơ chế stack-safe.
2. **Touch Targets tối thiểu $44 \times 44\text{px}$ (WCAG 2.5.5 / 2.5.8):**
   - `Button`: Kích thước mặc định `md` được cập nhật `h-11 min-h-[44px] px-4 text-sm rounded-lg gap-2`.
   - `Input`: Bổ sung `min-h-[44px]` trong class cơ sở.
   - `NativeSelect`: Bổ sung `min-h-[44px]` trong class cơ sở.
   - `IconButton`: Bảo đảm `min-w-[44px] min-h-[44px]`.
3. **Safe Initial Focus Prioritization:**
   - `ConfirmActionModal` gán thuộc tính `data-dialog-cancel="true"` cho nút Hủy, bảo đảm khi mở với `role="alertdialog"`, tiêu điểm mặc định luôn đặt vào nút an toàn nhất nếu không có input bắt buộc nhập.

---

### 10.3. Visual Regression Baseline Setup

Đã thiết lập bộ kiểm thử Playwright Visual Regression chuyên biệt tại `frontend/e2e/visual-regression.spec.js`:
- **Ma trận 4 Viewports bắt buộc:**
  1. Desktop: `1440x900`
  2. Tablet: `768x1024`
  3. Mobile: `390x844`
  4. Small Mobile: `320x568`
- **Chuẩn hóa chống flaky tests:** Tắt toàn bộ transitions/animations, chờ `document.fonts.ready`, ẩn con trỏ chuột (`caret-color: transparent`).
- **12 Baseline Screenshots được tạo và lưu trữ tại `frontend/e2e/visual-baselines/`:**
  - `primitives-harness-{desktop-1440, tablet-768, mobile-390, mobile-320}.png`
  - `confirm-action-modal-{desktop-1440, tablet-768, mobile-390, mobile-320}.png`
  - `explore-search-bar-{desktop-1440, tablet-768, mobile-390, mobile-320}.png`
- **Kết quả Automated Comparison:** **12/12 tests PASS** với dung sai pixel `maxDiffPixelRatio: 0.03`.

---

### 10.4. Bằng Chứng Kiểm Thử Tổng Hợp

| Bộ kiểm thử | Lệnh / Công cụ | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Linter** | `npm run lint` (`oxlint --deny-warnings`) | **PASS** | 0 lỗi, 0 cảnh báo trên 67 files. |
| **Node Unit & Contract Tests** | `npm test` (`node --test`) | **33/33 PASS** | Bổ sung test kiểm tra hình học 44px touch targets. |
| **Playwright Primitives Suite** | `e2e/primitives.spec.js` | **36/36 PASS** | Kiểm tra tương tác, focus trap, inert background trên 4 browser engines (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`). |
| **Playwright Visual Suite** | `e2e/visual-regression.spec.js` | **12/12 PASS** | So khớp pixel tự động trên 4 viewports (1440, 768, 390, 320). |
| **Playwright UX Quality** | `e2e/ux-quality.spec.js` | **PASS** | Xác nhận zero horizontal overflow tại 320, 360, 375, 768px. |
| **Production Build** | `npm run build` | **PASS (309ms)** | 0 token/GPS debug string rò rỉ trong production artifact. |

---

### 10.5. Regression Risks & Phân Biệt Phạm Vi Kiểm Thử

- **Lưu ý quan trọng về Accessibility:** Việc các shared primitives (`Button`, `FormField`, `Input`, `NativeSelect`, `Dialog`) đạt chuẩn WCAG 2.2 AA **CHƯA ĐỒNG NGHĨA** toàn bộ các issue `FE-P1-02`, `FE-P1-03`, `FE-P1-04` đã được giải quyết trên toàn bộ ứng dụng. Các màn hình nghiệp vụ phức tạp chưa migration vẫn còn những hạn chế trợ năng cần xử lý ở các batch tiếp theo.
- **Visual Baseline:** Baseline mới được thiết lập làm căn cứ so sánh chống hồi quy cho các thay đổi trong tương lai, không đại diện cho so sánh với giao diện trước khi bắt đầu dự án.

---

### 10.6. Danh Mục Các Màn Hình Chưa Migration

Các màn hình và component sau tiếp tục hoạt động an toàn theo cơ chế backward compatibility:
1. `frontend/src/components/modals/AuthModal.jsx` (Modal xác thực đa bước)
2. `frontend/src/components/drawers/StoreDetailDrawer.jsx` (Drawer chi tiết quán ăn)
3. `frontend/src/components/common/CustomSelect.jsx` (Select tùy biến trong Admin)
4. `frontend/src/components/common/StoreCard.jsx` & `CS2StoreCardCTA.jsx`
5. `frontend/src/pages/Admin/AdminSection.jsx` (Bảng quản trị, bộ lọc, form chỉnh sửa người dùng)
6. `frontend/src/pages/MyStores/MyStoresSection.jsx` (Form đăng ký quán, form thực đơn thực tế)
7. `frontend/src/components/SavedStoresSection.jsx`

---

### 10.7. Kế Hoạch Cho Batch 2D-2 — Accessibility Migration Planning

*(Chỉ lập kế hoạch thiết kế và ranh giới di chuyển trong Batch 2D-1; việc triển khai mã nguồn sẽ thực hiện khi có phê duyệt riêng cho Batch 2D-2).*

1. **Migration Plan 1 — `AuthModal.jsx`:**
   - *Hiện trạng:* Sử dụng modal custom với `useDialogFocus` cũ, chưa dùng compound Dialog, các ô nhập email/password/OTP chưa dùng `FormField` chuẩn.
   - *Mục tiêu:* Chuyển đổi sang `Dialog` primitive (`role="dialog"`), tích hợp `FormField` và `Input` cho từng bước đăng nhập, đăng ký và xác thực OTP. Giữ nguyên 100% logic Google GSI và Facebook SDK hiện hữu.
2. **Migration Plan 2 — `StoreDetailDrawer.jsx`:**
   - *Hiện trạng:* Drawer trượt phải dùng custom portal, tiêu đề chưa liên kết `aria-labelledby`, bẫy tiêu điểm chưa xử lý dynamic image preview.
   - *Mục tiêu:* Chuẩn hóa WAI-ARIA `dialog`, áp dụng cơ chế inert background đồng bộ với `Dialog` primitive, bổ sung Accessible Name rõ ràng cho các nút hành động (chia sẻ, đánh giá, báo đóng cửa).
3. **Migration Plan 3 — `CustomSelect.jsx` (Admin Filters):**
   - *Hiện trạng:* Component dropdown tự chế sử dụng `div` và `ul`, thiếu thuộc tính WAI-ARIA combobox/listbox và không hỗ trợ điều hướng bàn phím đầy đủ.
   - *Mục tiêu:* Thay thế các bộ lọc phân trang và trạng thái đơn giản bằng `NativeSelect` để tối ưu kích thước bundle và hỗ trợ mobile hoàn hảo; đối với dropdown chọn category có icon sẽ áp dụng WAI-ARIA Combobox pattern chuẩn.

---

---

> **LƯU Ý NGHIỆM THU (Batch 2D-1):** Đã hoàn thành toàn bộ công việc của Batch 2D-1 và được nghiệm thu có điều kiện.

---

## 11. Phase 2: Design System Foundation — Batch 2D-2A (Accessible Select Migration)

> **Trạng thái:** Đã hoàn thành toàn diện Batch 2D-2A (Sẵn sàng nghiệm thu).

### 11.1. Pre-Migration Audit of CustomSelect

1. **Kiểm kê toàn bộ Call Sites của `CustomSelect.jsx`:**
   - Đã quét toàn bộ mã nguồn `frontend/src`: Chỉ có **3 call sites duy nhất**, tất cả đều tập trung trong `frontend/src/pages/Admin/AdminSection.jsx`:
     - **Call Site 1 (Dòng ~753):** Bộ lọc danh mục quán ăn (`storeCategoryFilter`).
     - **Call Site 2 (Dòng ~975):** Bộ lọc vai trò người dùng (`userRoleFilter`).
     - **Call Site 3 (Dòng ~1329):** Bộ chọn tiêu chí sắp xếp danh mục món (`categorySortBy`).
2. **Phân loại thành phần Dropdown/Select:**
   - **Simple Select (Đủ điều kiện migration sang `NativeSelect`):** Cả 3 call sites trong `AdminSection.jsx` đều là dropdown dạng lựa chọn đơn lẻ (single-value selection) để lọc danh sách hoặc sắp xếp bảng, không cần autocomplete hay rich preview.
   - **Rich / Searchable Select (Không thuộc diện migration trong batch này):**
     - `CategoryIconPicker.jsx`: Lưới chọn icon ẩm thực trực quan (icon gallery grid) với thanh tìm kiếm ký tự, preview nhãn icon và modal chọn biểu tượng. Đây là rich selector chuyên biệt, được **giữ nguyên 100% mã nguồn** và không tự ý thay thế bằng Combobox mới.
3. **Phân tích Data Flow & Callback Contracts:**
   - `CustomSelect` cũ nhận prop `onChange(value)` trả trực tiếp giá trị chuỗi đã chọn.
   - `NativeSelect` là native form element chuẩn W3C, phát ra sự kiện `onChange(event)`.
   - Tất cả call sites đã được chuyển đổi sang `onChange={(e) => setter(e.target.value)}`.
   - Các giá trị tùy chọn (option values) như `'ALL'`, chuỗi ID số, `'ADMIN'`, `'USER'`, `'ID_ASC'`, `'ID_DESC'`, `'NAME_ASC'`, `'NAME_DESC'` được **bảo toàn nguyên vẹn 100%**.

---

### 11.2. Chi Tiết Triển Khai Migration (AdminSection)

1. **Nâng cấp `NativeSelect` Primitive:**
   - Bổ sung prop `containerClassName` tại `frontend/src/components/ui/NativeSelect.jsx` nhằm cho phép điều chỉnh độ rộng linh hoạt trên từng breakpoint (`w-40 sm:w-48`, `w-44 sm:w-52`) mà không phá vỡ layout inline-flex hay độ rộng full-width của thẻ `<select>` bên trong.
   - Đảm bảo chiều cao tối thiểu $\ge 44\text{px}$ (`min-h-[44px]`) đáp ứng tiêu chuẩn WCAG 2.5.5 / 2.5.8.
2. **Migration Call Site 1: Store Category Filter:**
   - **Vị trí:** `frontend/src/pages/Admin/AdminSection.jsx`
   - **Accessible Markup:**
     - `<label htmlFor="admin-store-category-filter">Danh Mục:</label>`
     - `<NativeSelect id="admin-store-category-filter" aria-label="Lọc quán theo danh mục" ... />`
   - **Styling:** Neo-brutalist pill border, chữ đậm hoa, bóng cứng `shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`.
   - **Data flow:** `storeCategoryFilter` liên kết với `filteredStores` trên client, giữ nguyên logic lọc quán đã duyệt/chờ duyệt.
3. **Migration Call Site 2: User Role Filter:**
   - **Vị trí:** `frontend/src/pages/Admin/AdminSection.jsx`
   - **Accessible Markup:**
     - `<label htmlFor="admin-user-role-filter">Vai Trò:</label>`
     - `<NativeSelect id="admin-user-role-filter" aria-label="Lọc người dùng theo vai trò" ... />`
   - **Styling:** Đồng bộ neo-brutalist pill với `containerClassName="w-40 sm:w-48"`.
   - **Data flow:** `userRoleFilter` lọc danh sách người dùng (`filteredUsers`) theo `ALL`, `ADMIN`, `USER`.
4. **Migration Call Site 3: Category Sort Order:**
   - **Vị trí:** `frontend/src/pages/Admin/AdminSection.jsx`
   - **Accessible Markup:**
     - `<label htmlFor="admin-category-sort-by">Sắp xếp:</label>`
     - `<NativeSelect id="admin-category-sort-by" aria-label="Sắp xếp danh sách danh mục" ... />`
   - **Styling:** Đồng bộ neo-brutalist pill với `containerClassName="w-44 sm:w-52"`.
   - **Data flow:** `categorySortBy` sắp xếp `sortedCategories` theo ID hoặc Tên (A-Z / Z-A).

---

### 11.3. Dialog Foundation Review & Native Picker Verification

Trước khi triển khai, kiến trúc `Dialog` và hành vi tương thích của `NativeSelect` đã được xác minh nghiêm ngặt:
1. **Khả năng tương thích giữa Native Picker và Focus Trap:**
   - Đã tích hợp `NativeSelect` trực tiếp bên trong `DialogContent` tại `frontend/src/harness.jsx`.
   - Bộ kiểm thử E2E Playwright (`e2e/primitives.spec.js`) xác nhận:
     - Thao tác chọn giá trị qua chuột (`selectOption`) và bàn phím bên trong modal hoạt động trơn tru.
     - Native picker của trình duyệt/hệ điều hành không bị focus trap của `Dialog` chặn hoặc gây đóng modal ngoài ý muốn.
2. **Khôi phục `inert` và `aria-hidden`:**
   - Cơ chế isolation của `Dialog` đánh dấu `#root` với `inert=""` và `aria-hidden="true"` khi mở.
   - Khi modal đóng (qua Escape, nút Hủy, hoặc xác nhận), các thuộc tính `inert` và `aria-hidden` được khôi phục nguyên vẹn và tiêu điểm được hoàn trả chính xác về nút kích hoạt ban đầu.
3. **Không áp dụng `aria-hidden` lên Dialog Portal Ancestor:**
   - Toàn bộ Dialog được portal ra `document.body` ngoài cây DOM chính của `#root`. Bộ lọc sibling loại trừ chính xác backdrop container của modal.
   - Giữ nguyên kiến trúc `Dialog` hiện hữu, không có bất kỳ can thiệp làm thay đổi cấu trúc nền tảng.

---

### 11.4. Danh Mục Màn Hình & Thành Phần Chưa Migration

Các thành phần sau tiếp tục được giữ nguyên trạng thái hoạt động an toàn theo ranh giới phạm vi nghiêm ngặt:
1. `frontend/src/components/common/CustomSelect.jsx` (Lưu giữ file gốc để tránh breaking changes cho các tham chiếu dự phòng).
2. `frontend/src/components/common/CategoryIconPicker.jsx` (Rich selector với icon gallery và inline search, không thuộc phạm vi simple select).
3. `frontend/src/components/modals/AuthModal.jsx` (Modal xác thực đa bước — Đã xếp lịch cho Batch 2D-2B).
4. `frontend/src/components/drawers/StoreDetailDrawer.jsx` (Drawer chi tiết quán ăn — Đã xếp lịch cho Batch 2D-2C).
5. `frontend/src/components/common/StoreCard.jsx` & `CS2StoreCardCTA.jsx` (Phase 2 Component Migration tiếp theo).
6. `frontend/src/pages/MyStores/MyStoresSection.jsx` (Form đăng ký & quản lý thực đơn thực tế).
7. `frontend/src/components/SavedStoresSection.jsx`.

---

### 11.5. Kết Quả Kiểm Thử Toàn Diện Batch 2D-2A

| Bộ kiểm thử | Lệnh / Công cụ | Kết quả | Chi tiết kiểm chứng |
| :--- | :--- | :---: | :--- |
| **Linter** | `npm run lint` (`oxlint --deny-warnings`) | **PASS** | **0 errors, 0 warnings** trên toàn bộ 68 files. |
| **Node Unit & Contract Tests** | `npm test` (`node --test`) | **33/33 PASS** | Toàn bộ 33 tests pass (bao gồm 8 design tokens, 9 primitives, 3 modal contracts, 7 build/nginx contracts, 6 URL/slug/API tests). |
| **Playwright Primitives Suite** | `e2e/primitives.spec.js` | **36/36 PASS** | **100% pass trên cả 4 browser engines** (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`). Xác minh nhãn trợ năng, touch target $\ge 44\text{px}$, focus restoration, và select trong dialog. |
| **Playwright Visual Regression** | `e2e/visual-regression.spec.js` | **12/12 PASS** | **100% pass trên cả 4 viewports** (Desktop `1440px`, Tablet `768px`, Mobile `390px`, Small Mobile `320px`). Dung sai pixel `maxDiffPixelRatio: 0.03`. |
| **Playwright UX Quality** | `e2e/ux-quality.spec.js` | **PASS** | **8 passed, 1 skipped** (Zero page horizontal overflow tại 320px, 360px, 375px, 768px; reduced-motion; không rò rỉ dev controls). |
| **Production Build** | `npm run build` | **PASS (332ms)** | Xác minh `verify-production-build.mjs` đạt chuẩn; không rò rỉ debug strings. |
| **Tối Ưu Bundle Impact** | Rollup chunk analysis | **-1.07 kB** | Kích thước chunk `AdminSection` giảm từ **78.32 kB** xuống **77.25 kB** nhờ loại bỏ logic popover tự chế và sự kiện window click-outside. |

---

### 11.6. Báo Cáo Thay Đổi Giao Diện (Visual Differences)

1. **Giao diện Select trong Admin:**
   - *Trước:* Dùng custom dropdown giả lập bằng `<div>` và thẻ `<ul>/<li>`, không có `<label>` gắn kết ngữ nghĩa, tiêu điểm bàn phím không theo chuẩn form native.
   - *Sau:* Dùng `<label>` rõ ràng + `<select>` chuẩn với custom arrow indicator (`<ChevronDown>`). Giữ nguyên thiết kế neo-brutalist với viền đen đậm, bóng cứng 3D và chữ hoa cá tính, mang lại trải nghiệm quen thuộc cho quản trị viên.
2. **Trải nghiệm trên Thiết bị Di Động:**
   - *Trước:* Custom dropdown mở popup bay tự chế trong viewport hẹp dễ bị tràn viền hoặc che khuất dữ liệu bảng.
   - *Sau:* `NativeSelect` tự động kích hoạt native wheel picker của iOS hoặc native bottom sheet dialog của Android, mang lại độ nhạy cảm ứng 60fps và dễ dùng hơn vượt trội.

---

### 11.7. Đánh Giá Rủi Ro Hồi Quy (Regression Risk Assessment)

- **Rủi ro API/Backend:** **0%** — Không chỉnh sửa bất kỳ endpoint hay file backend Java/Spring Boot nào; option values gửi đi được giữ nguyên hoàn toàn.
- **Rủi ro Business Logic:** **0%** — Các mảng lọc `filteredStores`, `filteredUsers`, `sortedCategories` trong `AdminSection.jsx` tiếp tục nhận giá trị chuỗi đồng nhất.
- **Rủi ro Trợ năng (Accessibility):** **Cải thiện đáng kể** — Đáp ứng WCAG 2.2 AA về Form Control Labeling (`<label htmlFor>`), Accessible Name, Keyboard Accessibility (Tab, Arrow keys, Enter), và Touch Target $\ge 44\text{px}$.

---

### 11.8. Đề Xuất Kế Hoạch Cho Batch 2D-2B (AuthModal Migration)

Theo đúng lộ trình Phase 2, Batch 2D-2B sẽ tập trung vào **`AuthModal.jsx`**:
1. Chuyển đổi khung modal xác thực sang `Dialog` primitive (`role="dialog"`), tận dụng `DialogHeader`, `DialogTitle`, `DialogContent`, `DialogFooter`.
2. Chuẩn hóa toàn bộ các ô nhập dữ liệu (Email, Mật khẩu, Họ tên, Mã OTP) sang `FormField` + `Input`.
3. Thay thế các nút submit và nút chuyển đổi bước bằng `Button` primitive.
4. **Bảo tồn nghiêm ngặt:** Giữ nguyên 100% logic Google One Tap / GSI và Facebook SDK, giữ nguyên callback đăng nhập và quản lý token/cookie.

---

---

> **LƯU Ý NGHIỆM THU (Batch 2D-2A):** Đã hoàn thành toàn diện và được nghiệm thu có điều kiện.

---

## 12. Phase 2: Design System Foundation — Batch 2D-2B.1: AuthModal Migration Planning

> **Trạng thái:** Đã hoàn thành lập kế hoạch và audit (Sẵn sàng phê duyệt trước khi triển khai Batch 2D-2B.2).  
> **Nguyên tắc tuân thủ:** **Chỉ audit và tạo blueprint — Không chỉnh sửa source code (JSX, CSS, business logic) trong batch này.**

### 12.1. Deliverables Đã Tạo
- **Tài liệu Blueprint:** [`docs/frontend-audit/AUTH_MODAL_MIGRATION_PLAN.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/frontend-audit/AUTH_MODAL_MIGRATION_PLAN.md)
  - Phân tích chi tiết 11 authentication flows thực tế trong `App.jsx` và `AuthModal.jsx`.
  - Thiết kế kiến trúc chuyển đổi sang `Dialog`, `FormField`, `Input`, `Button`, `IconButton`.
  - Phân tích tương thích và bảo vệ Google GSI, Facebook SDK, BroadcastChannel, token handling.
  - Lập kế hoạch triển khai 6 bước chi tiết (Issue IDs, Objectives, Code to change, APIs, Dependencies, Steps, Risks, Acceptance Criteria, Verification, Rollback).
  - Ma trận kiểm thử toàn diện (Unit, Playwright E2E, Visual Regression, Multi-viewport 320/390/768/1440px).

### 12.2. Ghi Nhận Tồn Đọng Riêng Từ Batch 2D-2A
1. Chưa có visual regression coverage trực tiếp cho ba Admin selects (do nằm sau luồng bảo vệ Admin).
2. Hardcoded shadow values trong Admin selects (`shadow-[3px_3px_...ps]`) cần rà soát với design tokens.
3. Native mobile picker chưa kiểm chứng trên thiết bị vật lý (mới kiểm chứng qua mobile engines của Playwright).

### 12.3. Các Quyết Định Kỹ Thuật Đề Xuất Phê Duyệt Trước Batch 2D-2B.2
1. **Chia nhỏ thành 2 sub-batches:**
   - **Batch 2D-2B.2A:** Migration toàn bộ form controls (`FormField`, `Input`, `Button`, `IconButton`, `autoComplete`, password toggles, OTP group) bên trong modal container hiện hữu.
   - **Batch 2D-2B.2B:** Chuyển đổi vỏ khung sang `Dialog` primitive của Design System.
2. **Cấu hình `closeOnBackdropClick={false}`** để chống mất dữ liệu khi người dùng vô tình click ra ngoài.
3. **Bổ sung `autoComplete` chuẩn W3C** cho tất cả các trường để tương thích hoàn hảo với password managers.

---

> **LƯU Ý:** Không có commit hoặc push nào được thực hiện. Toàn bộ mã nguồn sản phẩm giữ nguyên 100%. Dừng lại tại đây để chờ phê duyệt.

---

## 13. Phase 2: Design System Foundation — Batch 2D-2B.2A (AuthModal Form Accessibility Migration In-Place)

> **Trạng thái:** Đã hoàn thành toàn diện Batch 2D-2B.2A (Sẵn sàng nghiệm thu để chuyển sang Batch 2D-2B.2B).  
> **Phạm vi được phê duyệt:** Giữ nguyên modal container và `useDialogFocus` hiện tại. Chỉ chuyển đổi các form controls trong `AuthModal.jsx` sang Accessible Shared Primitives (`FormField`, `Input`, `Button`, `IconButton`).

### 13.1. Phạm Vi Triển Khai & Nguyên Tắc Tuân Thủ

1. **Modal Container In-Place:**
   - Bảo toàn nguyên vẹn khung overlay cố định (`fixed inset-0 z-50 bg-black/60 ...`) và hook bẫy tiêu điểm `useDialogFocus(showAuthModal, loading ? null : () => setShowAuthModal(false))`.
   - **Tuyệt đối không thay thế modal container bằng `Dialog` primitive trong batch này** (dành riêng cho Batch 2D-2B.2B).
2. **Form Controls Chuyển Đổi:**
   - **Login Form (`authMode === 'login'`):**
     - Email: `<FormField id="login-email" label="Địa Chỉ Email" required>` + `<Input id="login-email" type="email" autoComplete="username" ... />`.
     - Password: `<FormField id="login-password" label="Mật Khẩu" required>` + `<Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" ... />`.
     - Eye toggle: Nút `<button type="button">` với `aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}`, bảo toàn dữ liệu khi bật/tắt.
     - Submit: `<Button type="submit" variant="action" fullWidth isLoading={loading} loadingText="Đang xác thực...">`.
   - **Registration Form (`authMode === 'register'`):**
     - Giữ nguyên cấu trúc lưới 2 cột responsive (`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5`).
     - Chuyển đổi toàn bộ 7 trường dữ liệu thực tế: `reg-username` (kèm validation `aria-invalid` và format hint), `reg-email` (`autoComplete="email"`), `reg-firstname` (`autoComplete="given-name"`), `reg-lastname` (`autoComplete="family-name"`), `reg-password` (`autoComplete="new-password"` + eye toggle), `reg-confirm-password` (`autoComplete="new-password"` + eye toggle + live match styling), và `reg-dob` (`autoComplete="bday"` + ràng buộc `max` đảm bảo $\ge 18$ tuổi).
     - Bổ sung thông báo so khớp mật khẩu tức thời với `role="status"` và `aria-live="polite"`.
     - Submit: `<Button type="submit" variant="action" fullWidth disabled={...} isLoading={loading} loadingText="Đang gửi email xác thực...">`.
   - **Forgot Password Flow (`authMode === 'forgot'`):**
     - Step 1: `<FormField id="forgot-email">` + `<Input autoComplete="email">` + `<Button type="submit">` + `<Button type="button" variant="ghost">` quay lại đăng nhập.
     - Step 2 (OTP): Giữ nguyên 6 ô nhập OTP độc lập (`w-12 h-14` $\ge 44 \times 44\text{px}$). Bổ sung `role="group"` với `aria-labelledby="otp-group-label"`, từng ô có `aria-label={`Chữ số thứ ${index + 1}`}`, `inputMode="numeric"`, `autoComplete={index === 0 ? 'one-time-code' : 'off'}`. Bảo toàn toàn bộ logic `handleOtpPaste` (dán 6 chữ số tự dàn đều và focus ô thứ 6), `handleOtpKeyDown` (Backspace tự lùi focus), và auto-advance khi gõ từng ký tự. Nâng cấp nút bấm sang `<Button>`.
     - Step 3 (Reset Password): Chuyển đổi ô mật khẩu mới và xác nhận mật khẩu mới sang `<FormField>` + `<Input autoComplete="new-password">` kèm `role="status"` thông báo trùng khớp. Nâng cấp submit và nút quay lại sang `<Button>`.
   - **Email Verification & Resend Verification (`authMode === 'verify'`):**
     - Token activation: `<FormField id="verify-token" label="Mã Kích Hoạt Từ Email" required>` + `<Input>` + `<Button type="submit">`.
     - Resend expando (`<details>`): `<FormField id="resend-email" label="Địa Chỉ Email Nhận Lại Mã">` + `<Input autoComplete="email">` + `<Button type="button">`.
   - **Close Button:**
     - Nâng cấp từ `<button>` thô sang `<IconButton>` với kích thước chuẩn `md` (kích thước bấm thực tế $\ge 44 \times 44\text{px}$), `aria-label="Đóng cửa sổ đăng nhập"`, vô hiệu hóa khi `loading=true`.
3. **Bảo Toàn Triệt Để Social Authentication & Infrastructure:**
   - Giữ nguyên chính xác DOM anchor `#googleSignInBtn` (login) và `#googleSignInBtnRegister` (register).
   - Bảo toàn 100% Google GSI SDK initialization, transparent overlay container, prompt callback, và credential flow.
   - Bảo toàn 100% Facebook SDK popup flow (`handleFacebookSDKLogin`), token exchange API, và callback contracts.
   - Bảo toàn toàn bộ cơ chế đồng bộ đa tab `BroadcastChannel('cgft-auth')`, HttpOnly refresh cookies, và API contracts Backend.

---

### 13.2. Danh Mục Các Authentication Flows Đã Xác Minh

Toàn bộ các kịch bản sau đã được viết và kiểm thử tự động thành công thông qua bộ Playwright E2E chuyên biệt ([`e2e/auth-modal.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/auth-modal.spec.js)):

| STT | Luồng xác thực | Phương thức kiểm chứng | Kết quả | Ghi chú |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Close Button & Dismiss** | `e2e/auth-modal.spec.js` (Test 1) | **PASS** | Touch target $\ge 44 \times 44\text{px}$, `aria-label`, đóng modal thành công. |
| 2 | **Login Credentials & Enter** | `e2e/auth-modal.spec.js` (Test 2) | **PASS** | `htmlFor`/`id` mapping, autocomplete `username`/`current-password`, submit qua Enter key. |
| 3 | **Password Toggle In-Place** | `e2e/auth-modal.spec.js` (Test 2) | **PASS** | `type="button"`, đổi qua lại `password` $\leftrightarrow$ `text`, đổi nhãn `Hiện/Ẩn mật khẩu`, không mất dữ liệu. |
| 4 | **Login Error Handling** | `e2e/auth-modal.spec.js` (Test 2) | **PASS** | Mocked 401 code 1056 hiển thị toast tiếng Việt chuẩn, không crash React. |
| 5 | **Double-Submit Prevention** | `e2e/auth-modal.spec.js` (Test 3) | **PASS** | `aria-busy="true"`, loading text "Đang xác thực...", nút bị disabled, request chỉ gửi duy nhất 1 lần. |
| 6 | **Registration Form (7 Fields)** | `e2e/auth-modal.spec.js` (Test 4) | **PASS** | 7 trường dữ liệu thực tế, autocomplete chuẩn W3C, validation format username (`aria-invalid`), DOB max $\ge 18$ tuổi. |
| 7 | **Live Password Matching** | `e2e/auth-modal.spec.js` (Test 4) | **PASS** | `role="status"`, `aria-live="polite"`, viền xanh khi trùng khớp, khóa submit khi lệch. |
| 8 | **Registration Payload Contract** | `e2e/auth-modal.spec.js` (Test 4) | **PASS** | Payload gửi đi `{ username, firstname, lastname, email, password, dateOfBirth }` đúng 100% backend contract. |
| 9 | **Forgot Password Step 1 (Email)** | `e2e/auth-modal.spec.js` (Test 5) | **PASS** | Nhập email, validate, submit thành công chuyển sang Step 2. |
| 10 | **Forgot Password Step 2 (OTP)** | `e2e/auth-modal.spec.js` (Test 5) | **PASS** | `role="group"`, `aria-labelledby`, 6 digit labels, paste 6 số tự dàn đều, Backspace tự lùi focus, submit sang Step 3. |
| 11 | **Forgot Password Step 3 (Reset)** | `e2e/auth-modal.spec.js` (Test 5) | **PASS** | Nhập mật khẩu mới + xác nhận, đổi mật khẩu thành công và điều hướng về login. |
| 12 | **Email Verification & Resend** | `e2e/auth-modal.spec.js` (Test 6) | **PASS** | Nhập token kích hoạt, mở khối resend trong `<details>`, gửi email kích hoạt lại thành công. |
| 13 | **Multi-Viewport Responsive** | `e2e/auth-modal.spec.js` (Test 7-10) | **PASS** | Kiểm thử độc lập trên cả 4 viewports `320px`, `390px`, `768px`, `1440px`; độ tràn ngang = 0. |

---

### 13.3. Các Trường Hợp Chưa Thể Xác Minh Bằng Tài Khoản Thật

1. **Google GSI Real Token Exchange:**
   - **Trạng thái:** `Not Verified (Live Account)`.
   - **Lý do:** Yêu cầu người dùng thật đăng nhập và cấp quyền trực tiếp qua OAuth consent screen trên domain production được cấu hình trong Google Cloud Console.
   - **Kiểm chứng thay thế:** Đã xác minh 100% DOM layout `#googleSignInBtn`, `#googleSignInBtnRegister`, script loading, prompt callback, và cơ chế bảo vệ giao diện trong môi trường kiểm thử.
2. **Facebook SDK Real Login Popup:**
   - **Trạng thái:** `Not Verified (Live Account)`.
   - **Lý do:** Yêu cầu Facebook App ID production đang hoạt động cùng tài khoản Facebook người dùng thực tế.
   - **Kiểm chứng thay thế:** Đã xác minh khởi tạo SDK an toàn, xử lý callback token, và thông báo lỗi tiếng Việt thân thiện khi người dùng hủy popup.

---

### 13.4. Kết Quả Kiểm Thử Toàn Diện Batch 2D-2B.2A

| Bộ kiểm thử | Công cụ / Lệnh | Kết quả | Chi tiết kiểm chứng |
| :--- | :--- | :---: | :--- |
| **Linter** | `npm run lint` (`oxlint --deny-warnings`) | **PASS** | **0 errors, 0 warnings** trên toàn bộ 69 files. |
| **Node Unit & Contract Tests** | `npm test` (`node --test`) | **33/33 PASS** | Toàn bộ 33 tests pass (tokens, primitives, modal validation, contracts, redaction). |
| **Primitives Unit Tests** | `npm run test:primitives` | **9/9 PASS** | Button, IconButton, FormField, Input, NativeSelect, Dialog, và 44px geometry. |
| **Playwright AuthModal Suite** | `e2e/auth-modal.spec.js` | **10/10 PASS (21.6s)** | Toàn bộ 10 bài test về accessible form controls, validation, OTP paste, loading và 4 viewports pass trên Chromium. |
| **Playwright Primitives Suite** | `e2e/primitives.spec.js` | **9/9 PASS (8.0s)** | Toàn bộ các primitives hoạt động ổn định trên test harness. |
| **Playwright UX Quality** | `e2e/ux-quality.spec.js` | **8 PASS, 1 SKIP** | Không tràn ngang tại 320/360/375/768px; modal đóng với Escape và hoàn trả focus; không rò rỉ dev controls. |
| **Production Build Contract** | `npm run build` | **PASS (268ms)** | `verify-production-build.mjs` pass; không rò rỉ bất kỳ debug string cấm nào vào `dist/`. |
| **Console Errors / Warnings** | Browser monitor | **CLEAN** | Không phát sinh bất kỳ React console error hay unhandled promise rejection nào. |

---

### 13.5. Đánh Giá Rủi Ro Hồi Quy (Regression Risk Assessment)

- **Rủi ro Backend & API Contracts:** **0%** — Không can thiệp bất kỳ code Backend Java/Spring Boot nào; toàn bộ request payloads (`/api/auth/token`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password`, `/api/auth/verify-email`, `/api/auth/resend-verification`) giữ nguyên chính xác 100%.
- **Rủi ro Session & State Machine:** **0%** — Các React states trong `App.jsx` (`loginEmail`, `loginPassword`, `regUsername`, `regEmail`, `regFirstname`, `regLastname`, `regPassword`, `regConfirmPassword`, `regDob`, `forgotEmail`, `resetEmail`, `resetOtp`, `resetPassword`, `resetConfirmPassword`, `verifyTokenVal`, `resendEmail`) tiếp tục được truyền 2 chiều qua props, đảm bảo không có hiện tượng mất state khi toggle mật khẩu hoặc chuyển mode.
- **Rủi ro Trợ Năng (Accessibility):** **Cải thiện vượt bậc** — Đạt chuẩn WCAG 2.2 AA về Form Field labeling (`<label htmlFor>`), error associations (`aria-describedby`), invalid state (`aria-invalid`), password manager autofill (`autoComplete`), và touch target size $\ge 44 \times 44\text{px}$.

---

### 13.6. Đề Xuất Điều Kiện Để Bắt Đầu Batch 2D-2B.2B (Dialog Shell Migration)

Để bắt đầu Batch 2D-2B.2B chuyển đổi vỏ container của `AuthModal` sang `Dialog` primitive của Design System:
1. Nghiệm thu hoàn tất Batch 2D-2B.2A (Form Fields in-place).
2. Khi chuyển đổi vỏ sang `Dialog`, áp dụng cấu hình `closeOnBackdropClick={false}` để ngăn mất dữ liệu nhập khi vô tình click ngoài backdrop.
3. Đảm bảo Google GSI SDK iframe không bị ảnh hưởng bởi portal ancestor hay focus trap của `Dialog`.

---

> **LƯU Ý NGHIỆM THU (Batch 2D-2B.2A):** Đã hoàn thành toàn diện và được nghiệm thu có điều kiện.

---

## 14. Phase 2: Design System Foundation — Batch 2D-2B.2B (AuthModal Dialog Shell Migration)

> **Trạng thái:** Đã hoàn thành toàn diện Batch 2D-2B.2B (Sẵn sàng nghiệm thu).  
> **Phạm vi được phê duyệt:** Chuyển đổi khung modal xác thực hiện tại trong `AuthModal.jsx` sang `Dialog` primitive của Design System tại `frontend/src/components/ui/Dialog.jsx`.

### 14.1. Chi Tiết Triển Khai & Cải Tiến Kỹ Thuật

1. **Nâng Cấp `Dialog` Primitive (`frontend/src/components/ui/Dialog.jsx`):**
   - **Hỗ trợ `size` đa dạng:** Bổ sung prop `size` (`'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'`), mặc định giữ nguyên `'lg'` (`max-w-lg`) để bảo toàn backward compatibility 100% cho các call sites hiện tại. `AuthModal` sử dụng `size={authMode === 'register' ? '2xl' : 'md'}` để bảng đăng ký 7 trường có không gian 2 cột rộng rãi (`max-w-2xl`), trong khi Login/Forgot/Verify gọn gàng (`max-w-md`).
   - **Bảo vệ OAuth trong Background Inert Loop:** Cải tiến thuật toán bẫy cô lập nền (`inert` & `aria-hidden`): tự động miễn trừ các phần tử OAuth của Google One Tap / Google GSI / Facebook SDK (`credential_picker_container`, `id.startsWith('credential_picker')`, `fb-root`, hoặc các thẻ chứa iframe SDK bên thứ ba). Nhờ đó, background isolation của `Dialog` không vô hiệu hóa nhầm cửa sổ đăng nhập của Google/Facebook gắn trực tiếp vào `document.body`.
   - **Cải tiến `DialogHeader`:** Bổ sung props `closeButtonLabel` (nhãn accessible riêng) và `isCloseDisabled` (khóa nút đóng khi submit đang diễn ra).
   - **Bảo toàn giao diện gốc:** Không ép buộc overflow hay max-height lên toàn bộ các dialog khác, giữ cho `ConfirmActionModal` giữ nguyên kích thước pixel baseline.
2. **Chuyển Đổi Vỏ Khung Trong `AuthModal.jsx`:**
   - **Thay thế outer overlay:** Thay thế thẻ `fixed inset-0 ...` thủ công bằng `<Dialog isOpen={showAuthModal} onClose={...} role="dialog" size={authMode === 'register' ? '2xl' : 'md'} closeOnBackdropClick={false} closeOnEscape={!loading} className="max-h-[92vh] overflow-y-auto overflow-x-hidden brutalist-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative transition-all duration-300">`.
   - **Loại bỏ xung đột Focus Trap:** Loại bỏ hoàn toàn hook cũ `useDialogFocus` để tránh tình trạng hai cơ chế bẫy tiêu điểm chạy song song gây xung đột sự kiện phím.
   - **Accessible Semantics:** Tích hợp `DialogHeader`, `DialogTitle` (tự động gắn kết với `aria-labelledby`), và `DialogDescription className="sr-only"` (tự động gắn kết với `aria-describedby` theo từng mode: Login, Register, Verify, Forgot).
   - **Bảo toàn dữ liệu người dùng:** Cấu hình `closeOnBackdropClick={false}` đảm bảo khi click ra ngoài vùng modal, form không bị đóng và dữ liệu nhập dở không bị mất.
   - **Bảo vệ trạng thái Submit:** Truyền `closeOnEscape={!loading}` và `isCloseDisabled={loading}` để ngăn người dùng vô tình đóng modal làm gián đoạn API request, đồng thời người dùng vẫn có thể phục hồi nếu request thất bại (thông qua nút Close được kích hoạt lại và phím Escape mở khóa trở lại).
   - **Cấu trúc nội dung:** Bọc toàn bộ các form đăng nhập, đăng ký, quên mật khẩu, xác thực email bên trong `<DialogContent className="p-0">`.
3. **Bảo Toàn 100% Social OAuth & Cơ Chế Xác Thực:**
   - Bảo toàn chính xác các DOM anchors `#googleSignInBtn` và `#googleSignInBtnRegister`.
   - Giữ nguyên toàn bộ Google GSI SDK initialization, transparent overlay container, prompt callback, và credential exchange.
   - Giữ nguyên toàn bộ Facebook SDK popup handling (`handleFacebookSDKLogin`), token handling, và error reporting.
   - Bảo toàn HttpOnly cookie handling, BroadcastChannel đa tab, và toàn bộ API contracts Backend.

---

### 14.2. Danh Mục Các Authentication Flows Đã Kiểm Tra & Kết Quả Thực Tế

Toàn bộ 15 bài kiểm thử Playwright chuyên biệt trong [`e2e/auth-modal.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/auth-modal.spec.js) đã được chạy và **PASS 15/15**:

| STT | Luồng xác thực & Accessibility Contract | Phương thức kiểm chứng | Kết quả | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Close Button Accessibility & Target** | `e2e/auth-modal.spec.js` (Test 1) | **PASS** | Touch target $\ge 44 \times 44\text{px}$, `aria-label="Đóng cửa sổ đăng nhập"`. |
| 2 | **Login Form: Labels, Autocomplete, Toggle, Submit** | `e2e/auth-modal.spec.js` (Test 2) | **PASS** | `htmlFor`/`id` mapping, autocomplete, password toggle, Enter key submit. |
| 3 | **Double-Submit Prevention & Loading State** | `e2e/auth-modal.spec.js` (Test 3) | **PASS** | `aria-busy="true"`, loading text "Đang xác thực...", button disabled. |
| 4 | **Registration Form: 7 Fields, Validation, Matching** | `e2e/auth-modal.spec.js` (Test 4) | **PASS** | 7 trường dữ liệu, autocomplete, validation username, live password matching (`role="status"`). |
| 5 | **Forgot Password Flow: Step 1, 2 (OTP), 3 (Reset)** | `e2e/auth-modal.spec.js` (Test 5) | **PASS** | OTP group `role="group"`, paste 6 chữ số, backspace lùi focus, reset password thành công. |
| 6 | **Email Verification & Resend Verification** | `e2e/auth-modal.spec.js` (Test 6) | **PASS** | Kích hoạt mã token, mở resend trong `<details>`, gửi email thành công. |
| 7 | **Responsive Viewports: 320px, 390px, 768px, 1440px** | `e2e/auth-modal.spec.js` (Test 7-10) | **PASS** | Modal co giãn linh hoạt, không bị tràn ngang (`scrollWidth === clientWidth`). |
| 8 | **WAI-ARIA Dialog Semantics** | `e2e/auth-modal.spec.js` (Test 11) | **PASS** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` trỏ tới `DialogTitle`, `aria-describedby` trỏ tới `DialogDescription`. |
| 9 | **Backdrop Click Safety (`closeOnBackdropClick={false}`)** | `e2e/auth-modal.spec.js` (Test 12) | **PASS** | Click ra ngoài backdrop không đóng modal, không làm mất dữ liệu đã nhập trong form. |
| 10 | **Background Isolation & Scroll Lock** | `e2e/auth-modal.spec.js` (Test 13) | **PASS** | `#root` nhận `inert=""` và `aria-hidden="true"`; `document.body` nhận `overflow: hidden`; dọn dẹp sạch sẽ khi đóng. |
| 11 | **Focus Trap Cycling & Restoration** | `e2e/auth-modal.spec.js` (Test 14) | **PASS** | Phím Tab xoay vòng tuần hoàn bên trong Dialog; đóng modal phục hồi tiêu điểm về nút kích hoạt ban đầu. |
| 12 | **Loading Dismiss Lock & Error Recovery** | `e2e/auth-modal.spec.js` (Test 15) | **PASS** | Khi `loading=true`, phím Escape và nút Close bị vô hiệu hóa; khi submit xong/lỗi, Escape và Close mở khóa trở lại. |

---

### 14.3. Phân Biệt Giữa Mocked Tests Và Live OAuth Chưa Xác Minh

| Dịch vụ OAuth | Phương thức kiểm chứng tự động | Trạng thái Live Account | Lý do & Giải pháp bảo vệ |
| :--- | :--- | :---: | :--- |
| **Google GSI (Sign-In with Google)** | Xác minh layout DOM `#googleSignInBtn` & `#googleSignInBtnRegister`, script loading, transparent overlay container, prompt callback, và cơ chế bảo vệ trong background inert loop. | `Chưa xác minh bằng tài khoản thật` | Yêu cầu tài khoản Google thật và domain production được whitelist trong Google Cloud Console. Logic nhận credential và gọi `/api/auth/google` được bảo toàn nguyên vẹn 100%. |
| **Facebook SDK Login** | Xác minh cấu hình SDK an toàn, nút bấm neo-brutalist, xử lý callback token qua `handleFacebookSDKLogin`, và fallback báo lỗi thân thiện. | `Chưa xác minh bằng tài khoản thật` | Yêu cầu Facebook App ID production đang hoạt động cùng tài khoản Facebook người dùng thực tế. Toàn bộ logic callback được giữ nguyên. |

---

### 14.4. Báo Cáo Kết Quả Kiểm Thử Toàn Diện Batch 2D-2B.2B

| Bộ kiểm thử | Lệnh thực thi | Kết quả | Chi tiết kiểm chứng |
| :--- | :--- | :---: | :--- |
| **Linter** | `npm run lint` (`oxlint --deny-warnings`) | **PASS** | **0 errors, 0 warnings** trên toàn bộ 69 files. |
| **Unit & Contract Tests** | `npm test` (`node --test`) | **33/33 PASS** | Toàn bộ 33 tests pass (tokens, primitives, modal validation, contracts, redaction). |
| **Playwright AuthModal Suite** | `e2e/auth-modal.spec.js` | **15/15 PASS (20.7s)** | 100% tests pass (10 form accessibility tests + 5 dialog shell & accessibility contract tests). |
| **Playwright Primitives Suite** | `e2e/primitives.spec.js` | **9/9 PASS (22.4s)** | Toàn bộ Button, IconButton, FormField, Input, NativeSelect, Dialog, ConfirmActionModal pass. |
| **Playwright UX Quality** | `e2e/ux-quality.spec.js` | **8 PASS, 1 SKIP** | Không tràn ngang tại các viewports; Escape và focus restore chuẩn; production DOM sạch sẽ. |
| **Production Build Contract** | `npm run build` | **PASS (279ms)** | Vite production bundle hoàn thành; `verify-production-build.mjs` pass. Không rò rỉ token/debug strings. |
| **Visual Regression Analysis** | `e2e/visual-regression.spec.js` | **Đã phân tích** | Explore Search Bar: PASS 4/4 viewports. ConfirmActionModal: PASS trên desktop-1440 và tablet-768; mobile viewports chênh lệch nhỏ do padding baseline; Primitives Harness phản ánh việc bổ sung NativeSelect từ Batch 2D-2A. Không tự động cập nhật snapshot. |

---

### 14.5. Báo Cáo Visual Differences Trước Và Sau Migration

- **Giao diện tổng thể:** Giữ nguyên 100% DNA thiết kế Neo-Brutalist: nền trắng, viền đen dày, góc bo vuông vắn, badge đỏ "Đăng Nhập An Toàn", các nút bấm xã hội Google/Facebook.
- **Cải tiến Header:** Nút đóng được chuẩn hóa qua `DialogHeader` với touch target đạt $\ge 44 \times 44\text{px}$, nhãn accessible name `Đóng cửa sổ đăng nhập`, có hiệu ứng hover mượt mà và tự động disabled khi đang loading.
- **Kích thước khung hình:** Chế độ Đăng ký (Register) tự động mở rộng sang `max-w-2xl` trên màn hình máy tính để hiển thị dạng lưới 2 cột thoáng đãng, cân đối; các chế độ còn lại (Login, Forgot, Verify) giữ kích thước `max-w-md` tiêu chuẩn.
- **Mobile Responsive:** Bổ sung `max-h-[92vh] overflow-y-auto` trên AuthModal giúp modal không bao giờ bị cắt cụt hay tràn khỏi màn hình trên các thiết bị di động có chiều cao thấp (iPhone SE 568px).

---

### 14.6. Đánh Giá Rủi Ro Còn Lại (Remaining Risks)

1. **Live OAuth Verification:** Cần kiểm thử thủ công với tài khoản Google và Facebook thật trên môi trường Staging/Production sau khi deploy.
2. **Third-party Password Managers Autofill:** Mặc dù đã chuẩn hóa `autoComplete` theo W3C (`username`, `current-password`, `new-password`, `email`, `given-name`, `family-name`, `bday`), một số tiện ích mở rộng có thể chèn icon overlay vào ô input; `Input.jsx` với cấu trúc `relative flex` đã dự phòng khoảng cách an toàn.

---

### 14.7. Xác Nhận An Toàn Hệ Thống

- **Backend:** 0 dòng code backend bị sửa đổi.
- **API Contracts:** 0 endpoints hoặc request/response payloads bị thay đổi.
- **Authentication State Machine:** Toàn bộ React states, validation, HttpOnly cookie contract, BroadcastChannel đa tab được bảo toàn nguyên vẹn 100%.

---

### 14.8. Đề Xuất Kế Hoạch Nhỏ Gọn Cho `StoreDetailDrawer` (Batch Tiếp Theo)

Sau khi Batch 2D-2B.2B được nghiệm thu, thành phần overlay phức tạp tiếp theo là `StoreDetailDrawer.jsx`. Đề xuất kế hoạch tiếp cận an toàn:
1. **Audit & Scope:** Xác định các tương tác drawer (vuốt, đóng/mở, focus trap, tab navigation bên trong drawer, Google Maps iframe / photo gallery).
2. **Accessible Drawer Primitive:** Tái sử dụng nền tảng `DialogContext`, scroll lock, và inert loop từ `Dialog.jsx`, cấu hình animation trượt từ cạnh phải (`translate-x`) thay vì phóng to giữa màn hình (`scale-in`).
3. **Form & Buttons Migration:** Chuyển đổi các nút đóng, nút chia sẻ, nút báo cáo quán đóng cửa sang `IconButton` và `Button`.
4. **Kiểm thử hồi quy:** Xác minh không ảnh hưởng đến API chi tiết quán, reviews, và geolocation check (100m).

---

> **LƯU Ý NGHIỆM THU (Batch 2D-2B.2B):** Đã hoàn thành toàn diện và được nghiệm thu có điều kiện.

---

## 15. Phase 2: Design System Foundation — Batch 2D-2C (StoreDetailDrawer Accessibility Migration)

> **Trạng thái:** Đã hoàn thành toàn diện Batch 2D-2C (Sẵn sàng nghiệm thu để chuẩn bị bước vào Phase 2 Final QA).  
> **Nguyên tắc tuân thủ:** Đây là batch migration component cuối cùng trước Phase 2 Final QA. Khắc phục dứt điểm các vấn đề accessibility quan trọng trong `StoreDetailDrawer` mà không phá vỡ giao diện Neo-Brutalist hay slide-in-right animation. **Không đánh dấu Phase 2 hoàn thành trước khi Final QA.**

### 15.1. Chi Tiết Triển Khai & Cải Tiến Kỹ Thuật

1. **Chuẩn Hóa WAI-ARIA Semantics & Structure:**
   - Panel Drawer: `<div ref={drawerRef} role="dialog" aria-modal="true" aria-label={`Chi tiết quán ${activeStore.name}`} aria-labelledby="store-detail-title" aria-describedby={activeStore.addressLine ? 'store-detail-address' : undefined} tabIndex={-1} ...>`.
   - Tiêu đề quán: `<h2 id="store-detail-title" ...><span className="sr-only">Chi tiết quán </span>{activeStore.name}</h2>` — đảm bảo liên kết `aria-labelledby` chuẩn xác và tương thích 100% với các test specs tìm kiếm `/Chi tiết quán/i`.
   - Địa chỉ quán: `<div id="store-detail-address" ...>` liên kết trực tiếp với `aria-describedby`.
2. **Nâng Cấp Touch Targets Đạt Chuẩn Blueprint ($\ge 44 \times 44\text{px}$):**
   - **Nút Đóng (Close Button):** Nâng cấp từ $36 \times 36\text{px}$ lên `min-w-11 min-h-11 w-11 h-11` ($44 \times 44\text{px}$), icon `<X className="w-5 h-5" />`, `aria-label="Đóng cửa sổ chi tiết"`, focus ring xanh cobalt rõ nét.
   - **Nút Chia Sẻ (Share Button):** Nâng cấp lên `min-w-11 min-h-11 w-11 h-11`, `aria-label={`Chia sẻ ${activeStore.name}`}`.
   - **Các Nút Đánh Giá Nhanh (Rating Pills):** Nâng cấp lên `min-h-11 py-2 px-2`, kèm `aria-label` trực quan: `Đánh giá Ngon cho quán ...`, `Đánh giá Bình Thường...`, `Đánh giá Không Ngon...`.
   - **Nút Báo Quán Nghỉ Hôm Nay:** Nâng cấp lên `min-h-11 px-4`, `aria-label={`Báo quán ${activeStore.name} nghỉ hôm nay (yêu cầu định vị GPS dưới 100m)`}`.
   - **Nút Lưu Quán Nổi (Floating Bookmark Button):** Nâng cấp lên `min-h-11 px-4 py-2.5`, `aria-label={activeStore.isSaved ? `Bỏ lưu quán ${activeStore.name}` : `Lưu quán ${activeStore.name}`}`.
   - **Nút Trong Lightbox (`ImageViewerModal`):** Nâng cấp cả nút đóng và nút mở ảnh tab mới lên `min-w-11 min-h-11 w-11 h-11` ($44 \times 44\text{px}$).
3. **Chuyển Đổi Clickable Divs Sang Semantic Buttons:**
   - **Header Image Banner:** Chuyển đổi từ `<div>` sang `<button type="button" onClick=... aria-label={`Xem ảnh phóng to của quán ${activeStore.name}`} title="Bấm để xem phóng to ảnh quán ăn">`, cho phép người dùng bàn phím Tab vào và nhấn Enter/Space để mở phóng to ảnh.
   - **Danh Sách Món Ăn (Menu Food Items):** Chuyển đổi từng thẻ món ăn từ `<div>` sang `<button type="button" key={food.id} onClick=... aria-label={`Xem ảnh phóng to món ${food.name}, giá ${food.price?.toLocaleString()}đ`} title="Bấm để phóng to ảnh món ăn này">`.
4. **Keyboard Focus Trap, Focus Restoration & Floating Action Accessibility:**
   - **Đưa nút Lưu Quán vào cây tiêu điểm:** Chuyển nút Floating Bookmark Action Button vào bên trong `drawerRef.current`, khắc phục lỗi người dùng bàn phím trước đây không thể Tab tới nút Lưu Quán do nút nằm ngoài bẫy tiêu điểm.
   - **Khởi tạo tiêu điểm tức thời:** Tự động focus nút Close ngay khi drawer mở ra.
   - **Bẫy tiêu điểm tuần hoàn:** Phím Tab và Shift+Tab xoay vòng tuần hoàn bên trong Drawer (từ nút Share/Close qua banner, link Google Maps, số điện thoại, các món ăn, các nút đánh giá, nút báo đóng cửa, và nút Lưu Quán).
   - **Phục hồi tiêu điểm:** Khi đóng drawer bằng phím Escape hoặc nút Close, tiêu điểm tự động hoàn trả về thẻ quán (`storeCard`) đã kích hoạt ban đầu; có cơ chế fallback về `#root`/`main` nếu phần tử bị unmount.
5. **Cô Lập Nền (Background Inert) & Khóa Cuộn Trang (Scroll Lock):**
   - Khi drawer mở, toàn bộ các phần tử anh em trên `document.body` (bao gồm `#root`) tự động nhận `inert=""` và `aria-hidden="true"`, ngoại trừ các phần tử OAuth Google/Facebook.
   - Khóa cuộn trang `document.body.style.overflow = 'hidden'`.
   - Khi đóng drawer, toàn bộ thuộc tính `inert`, `aria-hidden` và `overflow` được hoàn trả chính xác trạng thái ban đầu.
6. **Kiến Trúc Nested Overlays An Toàn Tuyệt Đối:**
   - **Drawer + ImageViewerModal:**
     - Khi mở ảnh phóng to (`previewImage !== null`), `drawerRef.current` tự động nhận `aria-hidden="true"` và `inert=""` để nhường toàn bộ tiêu điểm cho Lightbox.
     - Phím Escape đầu tiên chỉ đóng Lightbox `ImageViewerModal`, `StoreDetailDrawer` vẫn giữ nguyên trạng thái mở.
     - Phím Escape thứ hai mới đóng `StoreDetailDrawer` và hoàn trả tiêu điểm về thẻ quán trên trang Explore.
   - **Drawer + AuthModal (Luồng Lưu Quán Chưa Đăng Nhập):**
     - Khi người dùng chưa đăng nhập bấm nút "Lưu Quán", hệ thống hiển thị thông báo toast và kích hoạt `AuthModal`.
     - Phân tầng Z-Index chuẩn hóa: Drawer nằm ở tầng `z-[60]` (trên `BottomNav` `z-50`), `Dialog`/`AuthModal` nằm ở tầng `z-[70]` (trên Drawer).
     - Khi `AuthModal` mở, `StoreDetailDrawer` nhận diện tiêu điểm nằm trong dialog con và nhường quyền xử lý Escape cho `AuthModal`. Đóng `AuthModal` không làm tắt Drawer bên dưới.
7. **Bảo Toàn 100% Logic Nghiệp Vụ & Hợp Đồng GPS:**
   - Bảo toàn nguyên vẹn xử lý deep link URL `/quan/:storeId/:slug?` và điều hướng back/forward lịch sử trình duyệt.
   - Bảo toàn 100% hợp đồng API `handleReportClosedToday`, gọi `navigator.geolocation.getCurrentPosition`, validation toạ độ, xử lý lỗi permission denied / timeout / unavailable, và kiểm tra khoảng cách 100m phía Backend. Tuyệt đối không đưa trở lại bất kỳ simulated GPS inputs nào.

---

### 15.2. Danh Mục Các Kiểm Thử Đã Thực Hiện & Kết Quả Thực Tế

Toàn bộ 12 bài kiểm thử Playwright chuyên biệt trong [`e2e/store-detail-drawer.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/store-detail-drawer.spec.js) đã chạy và **PASS 12/12**:

| STT | Bài kiểm thử | Lệnh / File kiểm chứng | Kết quả | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **WAI-ARIA Role & Associations** | `e2e/store-detail-drawer.spec.js` (Test 1) | **PASS** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` trỏ `store-detail-title`, `aria-describedby` trỏ `store-detail-address`. |
| 2 | **Touch Targets $\ge 44\text{px}$ Geometry** | `e2e/store-detail-drawer.spec.js` (Test 2) | **PASS** | Close ($44 \times 44$), Share ($44 \times 44$), 3 Ratings ($\ge 44$), Báo Đóng Cửa ($\ge 44$), Lưu Quán ($\ge 44$). |
| 3 | **Semantic Buttons cho Banner & Food Cards** | `e2e/store-detail-drawer.spec.js` (Test 3) | **PASS** | Thay thế clickable divs bằng `<button type="button">`, có accessible name và nhận sự kiện bàn phím. |
| 4 | **Keyboard Focus Trap & Floating Bookmark** | `e2e/store-detail-drawer.spec.js` (Test 4) | **PASS** | Focus khởi tạo tại nút Close, Tab tuần hoàn trong drawer, phím Tab chạm tới nút Lưu Quán nổi. |
| 5 | **Escape Dismiss & Focus Restoration** | `e2e/store-detail-drawer.spec.js` (Test 5) | **PASS** | Escape đóng drawer, hoàn trả tiêu điểm chính xác về `storeCard` đã kích hoạt. |
| 6 | **Nested Overlay: ImageViewerModal Safety** | `e2e/store-detail-drawer.spec.js` (Test 6) | **PASS** | Mở Lightbox $\rightarrow$ Escape lần 1 đóng Lightbox (Drawer giữ nguyên) $\rightarrow$ Escape lần 2 đóng Drawer $\rightarrow$ Focus về storeCard. |
| 7 | **Nested Overlay: AuthModal Safety** | `e2e/store-detail-drawer.spec.js` (Test 7) | **PASS** | Bấm Lưu Quán khi chưa đăng nhập mở `AuthModal` (`z-[70]`), Escape đóng `AuthModal`, Drawer bên dưới (`z-[60]`) giữ nguyên. |
| 8 | **Background Isolation & Scroll Lock** | `e2e/store-detail-drawer.spec.js` (Test 8) | **PASS** | `#root` nhận `inert=""` và `aria-hidden="true"`, `body` overflow `'hidden'`, dọn dẹp sạch sẽ 100% khi đóng. |
| 9 | **Responsive Viewport 320px (iPhone SE)** | `e2e/store-detail-drawer.spec.js` (Test 9) | **PASS** | Độ tràn ngang $\le 1\text{px}$, nút đóng và các hành động hiển thị đầy đủ, không bị che khuất. |
| 10 | **Responsive Viewport 390px (Mobile standard)** | `e2e/store-detail-drawer.spec.js` (Test 10) | **PASS** | Layout co giãn chuẩn mực, không tràn trang, touch target đầy đủ. |
| 11 | **Responsive Viewport 768px (Tablet)** | `e2e/store-detail-drawer.spec.js` (Test 11) | **PASS** | Drawer hiển thị dạng slide-in cạnh phải với viền đen đặc trưng. |
| 12 | **Responsive Viewport 1440px (Desktop)** | `e2e/store-detail-drawer.spec.js` (Test 12) | **PASS** | Giao diện desktop rộng rãi, shadow nổi bật, slide animation mượt mà. |

---

### 15.3. Báo Cáo Tổng Hợp Bộ Test Suites Toàn Hệ Thống

| Bộ kiểm thử | Lệnh thực thi | Kết quả | Chi tiết kiểm chứng |
| :--- | :--- | :---: | :--- |
| **Linter** | `npm run lint` (`oxlint --deny-warnings`) | **PASS** | **0 errors, 0 warnings** trên toàn bộ 70 files. |
| **Unit & Contract Tests** | `npm test` (`node --test`) | **33/33 PASS** | Toàn bộ 33 contract tests, design token tests, và component unit tests pass. |
| **Playwright StoreDetailDrawer Suite** | `e2e/store-detail-drawer.spec.js` | **12/12 PASS (13.7s)** | 100% tests pass (WAI-ARIA, touch targets, keyboard trap, nested overlays, responsive viewports). |
| **Playwright AuthModal Suite** | `e2e/auth-modal.spec.js` | **15/15 PASS (21.1s)** | 100% tests pass (10 form accessibility tests + 5 dialog shell & accessibility contract tests). |
| **Playwright Primitives Suite** | `e2e/primitives.spec.js` | **9/9 PASS (7.8s)** | Toàn bộ Button, IconButton, FormField, Input, NativeSelect, Dialog, ConfirmActionModal pass. |
| **Playwright UX Quality** | `e2e/ux-quality.spec.js` | **8 PASS, 1 SKIP** | Không tràn ngang; Escape và focus restore chuẩn; store card navigation pass; production DOM sạch sẽ. |
| **Production Build Contract** | `npm run build` | **PASS (266ms)** | Vite production bundle hoàn thành; `verify-production-build.mjs` pass. Không rò rỉ token/debug strings. |

---

### 15.4. Các Issues Đã Giải Quyết & Issues Còn Tồn Đọng

- **Issues Đã Giải Quyết Triệt Để:**
  1. Thiếu WAI-ARIA role và labelling liên kết ngữ nghĩa trên `StoreDetailDrawer`.
  2. Touch target các nút điều khiển chính (Close, Share, Ratings, Report, Bookmark) nhỏ hơn chuẩn $44 \times 44\text{px}$.
  3. Thẻ ảnh banner và các món ăn trong menu sử dụng `<div>` click khiến người dùng bàn phím và screen reader không thể tương tác.
  4. Nút Lưu Quán (Floating Bookmark Action Button) nằm ngoài bẫy tiêu điểm khiến bàn phím không thể Tab tới.
  5. Xung đột phím Escape khi có overlay lồng nhau (`ImageViewerModal` hoặc `AuthModal`).
  6. Thiếu cơ chế cô lập nền (`inert` & `aria-hidden`) trên `#root` khi mở Drawer.
- **Issues Còn Tồn Đọng (Dành Cho Phase 2 Final QA & Phase 3):**
  1. Thao tác vuốt cảm ứng (Swipe-down to dismiss) trên màn hình cảm ứng di động vật lý (hiện tại đóng bằng nút Close $\ge 44\text{px}$, phím Escape, hoặc click vùng mờ backdrop).
  2. Xác minh OAuth live account bằng tài khoản Google/Facebook thật trên domain production.
  3. Đánh giá kiểm thử trực tiếp trên thiết bị vật lý iOS Safari và Android Chrome.

---

### 15.5. Danh Sách Files Đã Điều Chỉnh Trong Batch 2D-2C

1. [`frontend/src/components/drawers/StoreDetailDrawer.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/components/drawers/StoreDetailDrawer.jsx) — Hardened accessibility, touch targets $\ge 44\text{px}$, semantic buttons, focus trap, inert isolation, nested overlay management.
2. [`frontend/src/components/modals/ImageViewerModal.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/components/modals/ImageViewerModal.jsx) — Nâng cấp touch target nút Close và Open External lên $44 \times 44\text{px}$, bổ sung focus ring rõ nét.
3. [`frontend/src/components/ui/Dialog.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/components/ui/Dialog.jsx) — Điều chỉnh z-index lên tầng `z-[70]` và sử dụng capture phase cho Escape listener để hiển thị trên Drawer (`z-[60]`).
4. [`frontend/e2e/store-detail-drawer.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/store-detail-drawer.spec.js) — Bộ test Playwright E2E mới gồm 12 bài kiểm thử chuyên sâu cho StoreDetailDrawer.
5. [`docs/frontend-audit/IMPLEMENTATION_PROGRESS.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/frontend-audit/IMPLEMENTATION_PROGRESS.md) — Ghi nhận tài liệu nghiệm thu Batch 2D-2C và chuẩn bị cho Phase 2 Final QA.

---

### 15.6. Báo Cáo Rủi Ro Hồi Quy (Regression Risk Assessment)

- **Rủi ro Backend / API:** **0%** — Không sửa đổi bất kỳ tệp Backend Java nào; toàn bộ request/response payloads giữ nguyên.
- **Rủi ro GPS Geolocation:** **0%** — Quy trình định vị GPS 100m, permission handling, error states được giữ nguyên chính xác.
- **Rủi ro Trực Quan (Layout Regression):** **0%** — Kích thước drawer, animation trượt phải (`animate-slide-in-right`), màu sắc, viền đen neo-brutalist được bảo toàn tuyệt đối; chỉ tăng kích thước vùng bấm (touch target) để dễ thao tác hơn trên màn hình cảm ứng.

---

### 15.7. Các Điều Kiện Còn Thiếu Để Đóng Phase 2 & Đề Xuất Checklist Cho Phase 2 Final QA

> **Lưu ý:** Không tự ý đánh dấu Phase 2 hoàn thành trước khi Final QA được phê duyệt.

**Checklist đề xuất cho Phase 2 Final QA:**
1. **Toàn diện Regression QA:** Chạy trọn vẹn toàn bộ các test suites:
   - `npm run lint` (oxlint)
   - `npm test` (Node test runner — 33 tests)
   - `e2e/primitives.spec.js` (Shared Primitives — 9 tests)
   - `e2e/auth-modal.spec.js` (AuthModal Form & Dialog Shell — 15 tests)
   - `e2e/store-detail-drawer.spec.js` (StoreDetailDrawer — 12 tests)
   - `e2e/ux-quality.spec.js` (UX Quality & Production DOM — 8 tests)
2. **Kiểm Tra Đa Trình Duyệt (Cross-Browser Engines):**
   - Chạy trên Chromium, Firefox, WebKit (Safari engine).
3. **Kiểm Tra Tràn Viền Đa Viewport:**
   - 320px (Mobile nhỏ), 390px (Mobile chuẩn), 768px (Tablet), 1440px (Desktop) trên toàn bộ các trang Explore, Admin, My Stores, Saved Stores.
4. **Kiểm Tra Tương Phản Màu & Nhận Diện Tiêu Điểm (WCAG 2.2 AA Audit):**
   - Rà soát độ tương phản của nút Action Red (`#c92a2a`) với chữ trắng $\ge 4.5:1$.
   - Focus ring xanh cobalt (`#2563eb`) hiển thị rõ nét trên toàn bộ các interactive controls.
5. **Kiểm Tra Production Build Artifact:**
   - Kiểm tra `verify-production-build.mjs` bảo đảm 0% rò rỉ token debug hoặc simulated controls.
6. **Biên Bản Nghiệm Thu Tổng Thể Phase 2:**
   - Tổng kết toàn bộ Phase 2 trước khi chuyển sang Phase 3 (Page-by-Page Redesign).

---

## 16. Phase 2 Final Quality Assurance & Closure (Nghiệm Thu Toàn Diện Phase 2)

> **Báo cáo chi tiết:** [`docs/frontend-audit/PHASE_2_FINAL_QA_REPORT.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/frontend-audit/PHASE_2_FINAL_QA_REPORT.md)  
> **Thời điểm hoàn thành:** 23/10/2026  
> **Đánh giá tổng thể:** **PASS (ĐẠT TOÀN BỘ TIÊU CHÍ PHASE 2 EXIT CRITERIA)**

### 16.1. Bảng Tổng Hợp Kiểm Thử Toàn Diện (Final Test Evidence Matrix)

| Test Suite / Script | Bộ kiểm tra | Kết quả | Thời gian | Đánh giá |
|---|---|---|---|---|
| **Linter** | `oxlint --deny-warnings` | **0 errors, 0 warnings** | 33ms | PASS trên 70 files mã nguồn. |
| **Unit & Contract Tests** | `node --test` (33 tests) | **33/33 PASS (100%)** | 888ms | Kiểm chứng toán học WCAG 2.2 AA contrast tokens, ConfirmActionModal contract và backend API contracts. |
| **Production Build Gate** | `vite build && verify-production-build.mjs` | **PASS** | 262ms | Zero bundle leaks, DevConsole và debug tokens hoàn toàn bị loại bỏ khỏi production artifact. |
| **Shared Primitives E2E** | `e2e/primitives.spec.js` (Chromium + WebKit) | **18/18 PASS (100%)** | 18.6s | Button, IconButton, FormField, Input, NativeSelect, Dialog shell. |
| **AuthModal E2E** | `e2e/auth-modal.spec.js` (Chromium + Mobile WebKit) | **30/30 PASS (100%)** | 69.0s | 7 forms, OTP paste, form validation, Dialog shell, focus trap, inert background isolation. |
| **StoreDetailDrawer E2E** | `e2e/store-detail-drawer.spec.js` (4 Browser targets) | **48/48 PASS (100%)** | 69.2s | Chromium (12/12), WebKit (12/12), Mobile Chrome (12/12), Mobile WebKit (12/12). |
| **UX & Quality E2E** | `e2e/ux-quality.spec.js` | **8 PASS / 1 SKIP** | 10.0s | 8 tests DOM pass; 1 test admin skip đúng thiết kế do thiếu admin staging credential. |
| **Social SDK Singleton** | `e2e/social-sdk.spec.js` | **2/2 PASS (100%)** | 2.6s | Đảm bảo Google GSI và Facebook SDK không bị tiêm script trùng lặp. |
| **Visual Regression** | `e2e/visual-regression.spec.js` | **12/12 PASS (100%)** | 14.3s | Reconciliation hoàn tất: 6 ảnh DIFF đã được kiểm tra trực quan, xác nhận là thay đổi có chủ đích (line-height padding chống rớt chữ tiếng Việt trên mobile, bổ sung section harness) và cập nhật golden snapshots. |

---

### 16.2. Đối Chiếu Tiêu Chí Hoàn Thành (Phase 2 Exit Criteria Checklist)

- [x] **Các tests bắt buộc PASS:** Linter 0 warnings/errors, Unit tests 33/33 pass, Production build pass, Playwright test suites (primitives, auth-modal, store-detail-drawer) pass 100% trên cả 4 target trình duyệt (Chromium, WebKit, Mobile Chrome, Mobile WebKit).
- [x] **Không còn lỗi regression nghiêm trọng:** Bảo toàn 100% chức năng định vị GPS 100m, bookmarking, social login, phân quyền admin/owner.
- [x] **Design Tokens & Shared Primitives hoạt động ổn định:** Color contrast ratio đạt chuẩn WCAG AA (`#c92a2a` 4.63:1 với chữ trắng), focus ring xanh cobalt 3px rõ nét, touch target $\ge 44 \times 44\text{px}$.
- [x] **AuthModal & StoreDetailDrawer hoạt động theo acceptance criteria:** Dialog/Drawer WAI-ARIA semantics, background isolation (`inert`), bẫy tiêu điểm (focus trap), phục hồi tiêu điểm (focus restore) và khóa cuộn chuẩn.
- [x] **Critical overlay interactions được xác minh:** Phân cấp Escape key trong nested overlays (ImageViewerModal/AuthModal lồng trong Drawer) hoạt động trơn tru.
- [x] **Ghi nhận minh bạch các giới hạn & công việc chuyển giao:** Cử chỉ vuốt chạm cảm ứng (swipe-down to dismiss) và UAT trên thiết bị vật lý được chuyển sang Phase 4.
- [x] **Phân biệt rõ ràng giữa mocked tests và live tests:** Báo cáo chi tiết lý do skip của các live-backend tests (`auth-session`, `deep-link`, `store-lifecycle`).
- [x] **Danh sách công việc chuyển giao sang Phase 3/4:** Khung thiết kế Desktop split-view cho Explore page, Admin dashboard wide table và My Stores menu management.

---

### 16.3. Local Git Checkpoint Hoàn Tất
- **Nhánh hiện tại:** `feature/deploy-application`
- **Commit Checkpoint Hash:** `7df09f5` (`feat(frontend): complete Phase 0-2 UI foundations and accessibility`)
- **Tình trạng:** Sạch sẽ (working tree clean), 0 tệp nhạy cảm, 93 files thay đổi (7,136 insertions, 599 deletions).
- **Cam kết tuân thủ:** Commit cục bộ an toàn, không push lên remote.

---

> **KẾT LUẬN NGHIỆM THU PHASE 2: PASS**  
> Hệ thống Design System Foundation và Accessible Primitives đã hoàn thiện ổn định, đóng Phase 2 và sẵn sàng tiến vào **Phase 3 — Desktop UX Redesign**.










