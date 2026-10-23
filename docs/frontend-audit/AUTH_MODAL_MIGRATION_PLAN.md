# CG FoodTour — Batch 2D-2B.1: AuthModal Migration Plan

> **Loại tài liệu:** Implementation-Ready Blueprint & Audit Plan  
> **Target Component:** `frontend/src/components/modals/AuthModal.jsx` (704 dòng mã nguồn)  
> **Ngày lập kế hoạch:** 23/10/2026  
> **Trạng thái:** Sẵn sàng phê duyệt để triển khai Batch 2D-2B.2  
> **Nguyên tắc cốt lõi:** **Chỉ lập kế hoạch và audit — Không chỉnh sửa source code trong batch này.**

---

## 1. Executive Overview & Scope Boundaries

### 1.1. Mục Tiêu Tổng Thể
Chuyển đổi toàn diện `AuthModal.jsx` sang hệ thống **Accessible Shared Primitives** đã được chuẩn hóa trong Phase 2 (`Dialog`, `DialogHeader`, `DialogTitle`, `DialogContent`, `FormField`, `Input`, `Button`, `IconButton`) nhằm giải quyết triệt để:
- **Lỗi FE-P1-02:** Toàn bộ 15+ nhãn form trong `AuthModal.jsx` hiện không có liên kết ngữ nghĩa `htmlFor` - `id`.
- **Lỗi Accessibility Form Controls:** Thiếu thuộc tính `autocomplete` tiêu chuẩn cho password managers, nút ẩn/hiện mật khẩu thiếu `aria-label`, 6 ô nhập OTP thiếu `role="group"` và `aria-label` cho từng chữ số.
- **Lỗi Dialog Isolation:** Hiện đang sử dụng `useDialogFocus` cũ, chưa áp dụng cơ chế khóa cuộn trang (`body scroll lock`), chưa có background `inert` và `aria-hidden` chuẩn WAI-ARIA khi modal hiển thị.

### 1.2. Ranh Giới Phạm Vi Nghiêm Ngặt (Non-Negotiable Constraints)
1. **Zero Backend Changes:** Không thay đổi bất kỳ file Java, controller Spring Boot, entity hoặc database schema nào.
2. **Zero API Contract Changes:** Giữ nguyên 100% endpoints, HTTP methods, headers, payload structures và response status codes.
3. **Zero Auth State Machine Changes:** Không thay đổi state orchestration trong `frontend/src/App.jsx` (`showAuthModal`, `authMode`, `loginEmail`, `loginPassword`, `reg...`, `forgot...`, `reset...`).
4. **Bảo Tồn Token & Cookie Handling:** Giữ nguyên cơ chế lưu trữ JWT token trong memory (`tokenRef.current`) và refresh cookie HttpOnly (`cgft_refresh`).
5. **Bảo Tồn Google GSI & Facebook SDK:** Tuyệt đối không thay đổi cơ chế khởi tạo và callback của Google One Tap / GSI và Facebook SDK; giữ nguyên chính xác các ID DOM định vị `#googleSignInBtn` và `#googleSignInBtnRegister`.
6. **Bảo Tồn BroadcastChannel:** Giữ nguyên kênh đồng bộ đa tab `'cgft-auth'`.
7. **Không Tái Xuất Hiện Manual OAuth Tokens:** Bảo đảm các ô nhập token JWT / Access Token thủ công đã loại bỏ ở Phase 1 (FE-P1-05) không xuất hiện lại trong bất kỳ kịch bản nào.
8. **Không Thay Đổi Logic Nghiệp Vụ:** Giữ nguyên quy tắc kiểm tra 18 tuổi, username 3-20 ký tự không dấu, độ dài mật khẩu 8-72 ký tự, định dạng OTP 6 chữ số.

---

## 2. Authentication Flow Inventory

Dưới đây là bảng kiểm kê chi tiết toàn bộ 11 luồng xác thực thực tế trong hệ thống, được đối chiếu trực tiếp từ source code `frontend/src/App.jsx` và `frontend/src/components/modals/AuthModal.jsx`:

| Flow # | Tên Luồng | Trạng Thái Mode | Files Liên Quan | API Endpoint | Validation Rules | Ghi Chú Kỹ Thuật & Focus Contract |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Manual Login** | `authMode === 'login'` | `AuthModal.jsx`, `App.jsx` | `POST /auth/token` | Email hợp lệ, Password non-empty. | Nhận `{ email, password }`. Nếu mã lỗi `1011` (chưa verify), tự chuyển sang mode `'verify'` kèm email. |
| **2** | **Registration** | `authMode === 'register'` | `AuthModal.jsx`, `App.jsx` | `POST /auth/register` | Username: `/^[a-zA-Z0-9_]{3,20}$/`; Email <= 50 chars; Pass 8-72 chars; Pass === ConfirmPass; Đủ 18 tuổi (`isAtLeast18(regDob)`). | Gửi thông tin đăng ký, hiển thị toast thành công và tự động chuyển về `authMode = 'login'`. |
| **3** | **Email Verification** | `authMode === 'verify'` | `AuthModal.jsx`, `App.jsx` | `POST /auth/verify-email` | Token non-empty (dán từ link kích hoạt email). | Gửi `{ token }`. Thành công chuyển về `'login'`. |
| **4** | **Resend Verification** | `authMode === 'verify'` (khối `<details>`) | `AuthModal.jsx`, `App.jsx` | `POST /auth/resend-verification?email=...` | Email hợp lệ. | Nằm trong accordion `<details>`. Gửi email kích hoạt mới mà không làm mất mode hiện tại. |
| **5** | **Forgot Pass: Step 1 (Request OTP)** | `authMode === 'forgot'` && `forgotStep === 1` | `AuthModal.jsx`, `App.jsx` | `POST /auth/forgot-password` | Email đăng ký hợp lệ. | Nhập email nhận OTP. Thành công lưu `resetEmail` và chuyển sang `forgotStep = 2`. |
| **6** | **Forgot Pass: Step 2 (Verify OTP)** | `authMode === 'forgot'` && `forgotStep === 2` | `AuthModal.jsx`, `App.jsx` | `POST /auth/verify-otp` | 6 ký tự số nguyên (`^\d{6}$`). | 6 ô input đơn lẻ hỗ trợ Paste 6 số, phím Backspace, tự động nhảy focus sang ô tiếp theo. Thành công chuyển `forgotStep = 3`. |
| **7** | **Forgot Pass: Step 3 (Reset Pass)** | `authMode === 'forgot'` && `forgotStep === 3` | `AuthModal.jsx`, `App.jsx` | `POST /auth/reset-password` | Mật khẩu mới >= 8 ký tự, trùng khớp xác nhận mật khẩu. | Gửi `{ email, otp, newPassword }`. Thành công thu hồi toàn bộ token cũ, xóa session và chuyển về `'login'`. |
| **8** | **Google GSI / One Tap** | `authMode` `'login'` hoặc `'register'` | `AuthModal.jsx`, `App.jsx`, `index.html` | `POST /auth/google-login` | ID Token JWT từ Google SDK. | Render GSI button iframe vào `#googleSignInBtn` hoặc `#googleSignInBtnRegister`. Click kích hoạt `window.google.accounts.id.prompt()`. Nhận credential token gửi về backend. |
| **9** | **Facebook SDK Login** | `authMode` `'login'` hoặc `'register'` | `AuthModal.jsx`, `App.jsx`, `index.html` | `POST /auth/facebook-login` | Access Token từ `FB.login`. | Kích hoạt `window.FB.login()` mở popup xác thực OAuth Facebook. Nhận `authResponse.accessToken` gửi về backend. |
| **10** | **Session Sync & Refresh** | Toàn bộ ứng dụng | `App.jsx` | `POST /auth/refresh`, `POST /auth/logout` | Token trong memory + HttpOnly cookie `cgft_refresh`. | Tự động làm mới token trước khi hết hạn qua `getRefreshDelay()`. Đồng bộ login/logout đa tab qua `BroadcastChannel('cgft-auth')`. |
| **11** | **Mode Switching & Retention** | Chuyển đổi qua lại giữa các mode | `AuthModal.jsx` | *N/A* (Client State) | Giữ nguyên dữ liệu người dùng đã nhập khi vô tình chuyển mode (không làm mất form data). | Cần đảm bảo tiêu điểm bàn phím nhảy mượt mà tới ô input đầu tiên của mode mới mà không gây out-of-screen jump. |

---

## 3. Migration Strategy & Architectural Design

### 3.1. Phân Tích Chuyển Đổi Sang Primitives

```
┌────────────────────────────────────────────────────────────────────────┐
│ Dialog (role="dialog", aria-modal="true", inert background isolation)  │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ DialogHeader: Badge "ĐĂNG NHẬP AN TOÀN" + DialogTitle + IconButton  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ DialogContent: Mode Switching State (Login / Register / Forgot...) │ │
│ │                                                                    │ │
│ │  • FormField + Input (Email, Username, Name, DOB, Token)           │ │
│ │  • FormField + Input với rightAdornment (Password + Eye toggle)   │ │
│ │  • FormField + 6-digit OTP Input Group (inputMode="numeric")       │ │
│ │  • Social Auth Buttons (Google GSI wrapper + Facebook SDK)         │ │
│ │  • Button (variant="action", isLoading, fullWidth)                 │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

1. **`Dialog` & Compound Subcomponents:**
   - Sử dụng `Dialog` primitive làm vỏ bao bọc ngoài cùng (`role="dialog"`).
   - `DialogHeader` hiển thị badge "Đăng Nhập An Toàn", `DialogTitle` phản ánh ngữ cảnh động theo `authMode` (ví dụ: "ĐĂNG NHẬP", "TẠO TÀI KHOẢN", "XÁC THỰC EMAIL", "QUÊN MẬT KHẨU").
   - Nút đóng modal sử dụng `IconButton` với `variant="ghost"`, kích thước touch target đạt chuẩn $44 \times 44\text{px}$.
2. **`FormField`:**
   - Đóng gói từng trường nhập liệu kèm nhãn ngữ nghĩa `<label htmlFor="...">` tự động tạo ID duy nhất qua `useId()`.
   - Quản lý nhãn phụ (hint) và thông báo lỗi (error alert với `role="alert"` và `aria-describedby`).
3. **`Input`:**
   - Kế thừa các token thiết kế neo-brutalist (viền đen 2px, nền `var(--color-surface)`, chiều cao `min-h-[44px]`).
   - Tích hợp `rightAdornment` cho nút bấm hiển thị/ẩn mật khẩu với `IconButton` có `aria-label` tương ứng ("Hiện mật khẩu" / "Ẩn mật khẩu").
4. **`Button`:**
   - Thay thế các class `.brutalist-btn-red` cũ bằng `<Button variant="action" fullWidth isLoading={loading} loadingText="...">`.
   - Ngăn chặn triệt để hiện tượng double submit nhờ cơ chế pointer-events và keyboard lock khi `isLoading={true}`.

### 3.2. Password Manager Compatibility (Autocomplete Contract)
Để hỗ trợ tối đa các trình quản lý mật khẩu (Chrome Password Manager, 1Password, Bitwarden, Apple Keychain), toàn bộ các input sẽ được bổ sung thuộc tính `autoComplete` tiêu chuẩn W3C:
- **Login Email:** `autoComplete="username"` (hoặc `"email"`)
- **Login Password:** `autoComplete="current-password"`
- **Register Username:** `autoComplete="username"`
- **Register Email:** `autoComplete="email"`
- **Register Firstname:** `autoComplete="given-name"`
- **Register Lastname:** `autoComplete="family-name"`
- **Register Password:** `autoComplete="new-password"`
- **Register Confirm Password:** `autoComplete="new-password"`
- **Register DOB:** `autoComplete="bday"`
- **Forgot Email:** `autoComplete="email"`
- **OTP Digits:** `autoComplete="one-time-code"`
- **Reset New Password:** `autoComplete="new-password"`

### 3.3. OTP Input Group Accessibility Pattern
6 ô nhập ký tự OTP trong Forgot Password Step 2 sẽ được nâng cấp khả năng trợ năng:
- Bọc toàn bộ 6 ô input trong một container mang ngữ nghĩa `role="group"` với thuộc tính `aria-label="Mã xác thực OTP gồm 6 chữ số"`.
- Mỗi ô input đơn lẻ có `aria-label={`Chữ số thứ ${index + 1}`}`, `inputMode="numeric"`, `pattern="[0-9]*"`.
- Bảo toàn 100% logic xử lý Paste chuỗi 6 ký tự (`handleOtpPaste`) và phím điều hướng Backspace (`handleOtpKeyDown`).

---

## 4. Dialog Architecture Verification

### 4.1. Phân Tích Tương Thích SDK Bên Thứ Ba (Google GSI & Facebook)
1. **Google GSI Button Rendering:**
   - `App.jsx` định vị phần tử container qua `document.getElementById('googleSignInBtn')` và `document.getElementById('googleSignInBtnRegister')`.
   - Nếu `AuthModal` sử dụng `Dialog` primitive (portal ra `document.body`):
     - Thẻ `div#googleSignInBtn` nằm trong DOM của portal (`document.body > [dialog-backdrop] > [dialog]`), **KHÔNG** nằm trong `#root`.
     - Cơ chế cô lập nền của `Dialog.jsx` chỉ gán `inert=""` và `aria-hidden="true"` cho các con trực tiếp của `document.body` ngoại trừ chính `backdropRef.current`. Do đó, nút Google GSI nằm bên trong modal sẽ **hoàn toàn không bị inert**.
     - Khi Google SDK render iframe vào `#googleSignInBtn`, iframe nằm hoàn toàn bên trong cây DOM khả dụng của modal.
2. **Third-Party Authentication Popups & Focus Trap:**
   - Khi người dùng click "Tiếp Tục Với Facebook", `FB.login()` mở một cửa sổ popup của trình duyệt (`window.open`). Tiêu điểm hệ điều hành rời khỏi tab hiện tại sang cửa sổ popup. Focus trap của `Dialog` chỉ bẫy sự kiện `keydown` (phím Tab) bên trong document của tab hiện tại, do đó **không có bất kỳ xung đột nào** với popup của Facebook hay Google.
   - Khi popup đóng lại, tiêu điểm quay lại tab chính và được giữ an toàn trong modal.
3. **Google One Tap Overlay:**
   - Nếu `window.google.accounts.id.prompt()` kích hoạt giao diện One Tap ở góc trên màn hình, One Tap iframe được Google chèn vào `document.body`.
   - **Biện pháp phòng ngừa rủi ro:** Trong `Dialog.jsx`, hàm cô lập nền đã bỏ qua `backdropRef.current`. Cần đảm bảo quy tắc không gán `inert` lên các phần tử chứa `credential_picker_container` của Google nếu chúng xuất hiện song song.

### 4.2. Escape & Backdrop Dismiss Behavior
- **Backdrop Click:** Trong các form xác thực nhạy cảm (đặc biệt form Đăng ký gồm 8 trường dữ liệu), việc người dùng vô tình click chuột trượt ra ngoài vùng modal có thể làm mất toàn bộ dữ liệu đang nhập dở. Vì vậy, **bắt buộc cấu hình `closeOnBackdropClick={false}`** cho `AuthModal`, người dùng chỉ đóng modal có chủ đích qua phím Escape hoặc nút "Đóng" (X).
- **Phím Escape:** Khi `loading === true`, phím Escape phải bị vô hiệu hóa để tránh hủy modal khi request mạng đang xử lý dở dang (bảo toàn contract hiện tại: `loading ? null : () => setShowAuthModal(false)`).

### 4.3. Focus Restoration & Mode Switching
- Khi modal đóng, tiêu điểm phải được khôi phục chính xác về phần tử đã kích hoạt mở modal ban đầu (ví dụ: Nút "Đăng Nhập ↗" trên Header hoặc nút tab Profile trên BottomNav).
- Khi chuyển đổi giữa các mode (`login` ↔ `register` ↔ `forgot` ↔ `verify`): Cần có một `useEffect` nhỏ lắng nghe sự thay đổi của `authMode` hoặc `forgotStep` để chủ động chuyển tiêu điểm đến ô nhập liệu đầu tiên của màn hình mới (ví dụ: `#login-email` hoặc `#reg-username`), tránh để tiêu điểm bị kẹt ở phần tử vừa bị unmount.

### 4.4. Đề Xuất Chiến Lược Di Chuyển Hai Giai Đoạn (Two-Phase Incremental Migration)
Nhằm triệt tiêu tối đa rủi ro hồi quy đối với Google GSI và Facebook SDK, Batch 2D-2B được đề xuất chia thành 2 sub-batch rõ ràng:
- **Batch 2D-2B.2A (Form Fields & Accessibility In-Place):** Giữ nguyên container modal hiện tại (với `useDialogFocus`), chuyển đổi toàn bộ 100% các ô nhập liệu, labels, nút bấm, password eye toggles và OTP controls sang `FormField`, `Input`, `Button`, `IconButton`. Kiểm thử toàn bộ tương tác form và social auth.
- **Batch 2D-2B.2B (Dialog Primitive Shell):** Chuyển đổi khung vỏ ngoài sang `Dialog` primitive của Design System, bổ sung inert background, scroll lock và focus restoration hoàn chỉnh.

---

## 5. Step-by-Step Implementation Plan

### BƯỚC 1: Chuẩn Hóa Accessible Form Controls Cho Form Đăng Nhập (Login)

1. **Issue IDs:** `FE-P1-02`, `FE-P1-04`, `FE-P3-01`.
2. **Mục tiêu:** Thay thế các input và label thủ công trong màn hình Login bằng `FormField` và `Input` primitive, bổ sung `autoComplete`, nâng cấp nút ẩn/hiện mật khẩu và nút submit.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 143–193 (`{authMode === 'login' && ...}`).
5. **Component APIs được sử dụng:**
   - `<FormField id="login-email" label="Địa Chỉ Email" required>`
   - `<Input id="login-email" type="email" autoComplete="username" ... />`
   - `<FormField id="login-password" label="Mật Khẩu" required>`
   - `<Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" rightAdornment={...} ... />`
   - `<Button type="submit" variant="action" fullWidth isLoading={loading} loadingText="Đang xác thực...">`
6. **Dependencies:** `FormField.jsx`, `Input.jsx`, `Button.jsx`, `IconButton.jsx`.
7. **Implementation Steps:**
   - Bọc trường email bằng `FormField` với label rõ ràng và `htmlFor="login-email"`.
   - Bọc trường password bằng `FormField`, chuyển nút "Quên mật khẩu?" thành link/button phụ có tiêu điểm rõ ràng.
   - Đưa nút Eye toggle vào `rightAdornment` của `Input` kèm `aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}`.
   - Thay thế nút submit bằng `Button` primitive.
8. **Regression Risks:** Nguy cơ mất giá trị state `loginEmail` hoặc `loginPassword` nếu sai callback `onChange`.
9. **Acceptance Criteria:**
   - Nhấp vào chữ "Địa Chỉ Email" kích hoạt tiêu điểm vào ô nhập email.
   - Password Manager gợi ý tự động điền email và mật khẩu.
   - Phím Enter submit form bình thường.
   - Nút ẩn/hiện mật khẩu có accessible name, bấm đổi type text/password chính xác.
10. **Verification Methods:** Playwright test kiểm tra liên kết label, autocomplete attribute và form submission.
11. **Rollback Strategy:** Khôi phục đoạn markup form login gốc từ git history.

---

### BƯỚC 2: Chuẩn Hóa Accessible Form Controls Cho Form Đăng Ký (Register)

1. **Issue IDs:** `FE-P1-02`, `FE-P1-04`.
2. **Mục tiêu:** Chuẩn hóa toàn bộ 7 trường dữ liệu trong form Đăng ký (Username, Email, Họ, Tên, Mật khẩu, Xác nhận mật khẩu, Ngày sinh) sang `FormField` + `Input`, giữ nguyên bố cục lưới responsive 2 cột và logic xác thực 18 tuổi.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 258–400 (`{authMode === 'register' && ...}`).
5. **Component APIs được sử dụng:**
   - `<FormField id="reg-username" label="Username" hint="(3-20 ký tự, không dấu / khoảng trắng)" required error={...}>`
   - `<FormField id="reg-email" label="Email" required>`
   - `<FormField id="reg-firstname" label="Họ" required>`
   - `<FormField id="reg-lastname" label="Tên" required>`
   - `<FormField id="reg-password" label="Mật Khẩu" hint="Tối thiểu 8 ký tự" required>`
   - `<FormField id="reg-confirm-password" label="Xác Nhận Mật Khẩu" required>`
   - `<FormField id="reg-dob" label="Ngày Sinh" hint="Phải từ đủ 18 tuổi" required>`
   - `<Button type="submit" variant="action" fullWidth isLoading={loading} disabled={...}>`
6. **Dependencies:** `FormField.jsx`, `Input.jsx`, `Button.jsx`, `IconButton.jsx`.
7. **Implementation Steps:**
   - Giữ nguyên bố cục lưới `grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5`.
   - Chuyển từng cặp `<label>` + `<input>` sang `<FormField>` + `<Input>`.
   - Tích hợp `aria-live="polite"` hoặc `role="status"` cho thông báo trùng khớp mật khẩu.
   - Bổ sung đầy đủ thuộc tính `autoComplete`.
   - Nâng cấp nút Hoàn tất đăng ký sang `Button` primitive.
8. **Regression Risks:** Thay đổi logic lọc ký tự của Username (`regUsername.toLowerCase().replace(/[^a-z0-9_]/g, '')`) hoặc định dạng ngày tháng của `regDob`.
9. **Acceptance Criteria:**
   - 100% các ô nhập liệu có label kết nối lập trình được.
   - Thông báo mật khẩu khớp/không khớp được screen reader đọc chuẩn xác.
   - Form ngăn chặn submit khi chưa đủ điều kiện (disabled/loading).
10. **Verification Methods:** Unit test kiểm tra validation logic, Playwright test kiểm tra tương tác form trên mobile 320px/390px và desktop 1440px.
11. **Rollback Strategy:** Khôi phục đoạn markup form register gốc.

---

### BƯỚC 3: Chuẩn Hóa Luồng Quên Mật Khẩu (Forgot Password - Steps 1, 2, 3)

1. **Issue IDs:** `FE-P1-02`, `FE-P1-04`.
2. **Mục tiêu:** Chuẩn hóa Step 1 (nhập email), Step 2 (nhập mã OTP 6 số) và Step 3 (nhập mật khẩu mới), bổ sung WAI-ARIA group cho các ô OTP.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 466–637 (`{authMode === 'forgot' && ...}`).
5. **Component APIs được sử dụng:**
   - `<FormField id="forgot-email" label="Địa Chỉ Email" required>`
   - OTP inputs với `role="group"`, `aria-label="Mã OTP gồm 6 chữ số"`, mỗi ô có `aria-label={`Số thứ ${index + 1}`}`, `autoComplete="one-time-code"`.
   - `<FormField id="reset-password" label="Mật Khẩu Mới" required>`
   - `<FormField id="reset-confirm-password" label="Xác Nhận Mật Khẩu Mới" required>`
   - `<Button type="submit" variant="action" fullWidth isLoading={loading}>`
6. **Dependencies:** `FormField.jsx`, `Input.jsx`, `Button.jsx`.
7. **Implementation Steps:**
   - Chuẩn hóa Step 1 với `FormField` cho email.
   - Nâng cấp Step 2: Bọc 6 ô OTP trong `fieldset` hoặc `div role="group"`, giữ nguyên các handler `handleOtpDigitChange`, `handleOtpKeyDown`, `handleOtpPaste`.
   - Chuẩn hóa Step 3 với `FormField` cho mật khẩu mới và xác nhận mật khẩu mới.
8. **Regression Risks:** Làm hỏng hành vi paste chuỗi 6 ký tự hoặc phím Backspace tự lùi ô trong các ô OTP.
9. **Acceptance Criteria:**
   - Người dùng dán mã OTP từ clipboard (Ctrl+V) tự động điền đủ 6 ô.
   - Nhấn Backspace tại ô trống tự động xóa và lùi về ô trước đó.
   - Screen reader đọc rõ vị trí từng chữ số OTP.
10. **Verification Methods:** Playwright test giả lập thao tác gõ từng phím số, paste clipboard, và submit xác thực OTP.
11. **Rollback Strategy:** Khôi phục đoạn markup quên mật khẩu gốc.

---

### BƯỚC 4: Chuẩn Hóa Luồng Xác Thực Email & Gửi Lại Mã (Verify & Resend)

1. **Issue IDs:** `FE-P1-02`, `FE-P3-01`.
2. **Mục tiêu:** Chuẩn hóa form nhập token kích hoạt và accordion gửi lại email xác thực sang `FormField` và `Button`.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 641–698 (`{authMode === 'verify' && ...}`).
5. **Component APIs được sử dụng:**
   - `<FormField id="verify-token" label="Mã Kích Hoạt Từ Email" required>`
   - `<FormField id="resend-email" label="Địa Chỉ Email Nhận Lại Mã">`
   - `<Button type="submit" variant="action" fullWidth isLoading={loading}>`
6. **Dependencies:** `FormField.jsx`, `Input.jsx`, `Button.jsx`.
7. **Implementation Steps:**
   - Gắn kết nhãn rõ ràng cho ô dán mã kích hoạt `verifyTokenVal`.
   - Gắn kết nhãn cho ô `resendEmail` bên trong `<details>`.
   - Nâng cấp các nút bấm thành `Button` primitive.
8. **Regression Risks:** Không gửi được tham số email trong query string `/auth/resend-verification?email=...`.
9. **Acceptance Criteria:**
   - Cả 2 ô nhập liệu đều có `label` gắn kết ngữ nghĩa.
   - Thao tác gửi lại email kích hoạt không làm gián đoạn trạng thái xác thực.
10. **Verification Methods:** Unit/Integration test kiểm tra submit form verify và resend.
11. **Rollback Strategy:** Khôi phục đoạn markup verify email gốc.

---

### BƯỚC 5: Bảo Toàn Social Auth Buttons & Nâng Cấp Nút Đóng Modal

1. **Issue IDs:** `FE-P1-02`, `FE-P1-05`, `WCAG 2.5.5`.
2. **Mục tiêu:** Giữ nguyên 100% vùng container trong suốt của Google GSI SDK (`#googleSignInBtn` và `#googleSignInBtnRegister`) và nút Facebook SDK; nâng cấp nút Đóng (X) đạt chuẩn touch target tối thiểu 44px.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 119–127 (nút X), dòng 201–243 & 408–450 (Social buttons).
5. **Component APIs được sử dụng:**
   - `<IconButton icon={<X className="w-5 h-5" />} aria-label="Đóng cửa sổ đăng nhập" variant="surface" size="md" onClick={...} />`
   - Bảo toàn container Google GSI: `<div id="googleSignInBtn" className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer flex justify-center items-center z-10 w-full h-full" ...></div>`.
6. **Dependencies:** `Button.jsx` (`IconButton`).
7. **Implementation Steps:**
   - Nâng cấp nút Đóng góc trên bên phải thành `IconButton` với kích thước tối thiểu $44 \times 44\text{px}$.
   - Rà soát cẩn thận các thuộc tính của `#googleSignInBtn` và `#googleSignInBtnRegister` để bảo đảm `App.jsx` render được iframe của Google mà không bị lệch vị trí.
8. **Regression Risks:** Vô tình làm lệch hoặc mất container `#googleSignInBtn`, khiến Google GSI không tìm thấy node để render nút tiếp tục bằng Google.
9. **Acceptance Criteria:**
   - Nút Đóng có kích thước $\ge 44 \times 44\text{px}$, nhãn accessible "Đóng cửa sổ đăng nhập".
   - Google Sign-In SDK và Facebook SDK khởi tạo và nhận click bình thường.
10. **Verification Methods:** Playwright DOM assertions xác nhận sự tồn tại của `#googleSignInBtn` và kích thước nút Đóng.
11. **Rollback Strategy:** Khôi phục markup nút đóng và social buttons gốc.

---

### BƯỚC 6: Tích Hợp Vỏ Khung `Dialog` Primitive & Hoàn Thiện Accessibility Isolation

1. **Issue IDs:** `FE-P1-04`, `WAI-ARIA Dialog`.
2. **Mục tiêu:** Chuyển đổi khung modal tự chế sang `Dialog` primitive của Design System (`role="dialog"`), hỗ trợ portal ra `document.body`, background inert isolation, scroll locking và focus restoration.
3. **Files bị ảnh hưởng:** `frontend/src/components/modals/AuthModal.jsx`.
4. **Code hiện tại cần thay đổi:** Dòng 62–64, dòng 116–139 và dòng 701–702.
5. **Component APIs được sử dụng:**
   - `<Dialog isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} role="dialog" closeOnBackdropClick={false} className={...}>`
   - `<DialogHeader>`
   - `<DialogTitle>{dynamicTitle}</DialogTitle>`
   - `<DialogContent>`
6. **Dependencies:** `Dialog.jsx`, `dialogContext.js`.
7. **Implementation Steps:**
   - Thay thế thẻ bọc ngoài cùng bằng `<Dialog isOpen={showAuthModal} onClose={...} closeOnBackdropClick={false}>`.
   - Chuyển header thành `<DialogHeader>` và `<DialogTitle>`.
   - Bổ sung hook chuyển tiêu điểm mượt mà khi người dùng đổi `authMode` hoặc `forgotStep`.
   - Kiểm tra kỹ việc khôi phục tiêu điểm về nút mở ban đầu khi modal đóng lại.
8. **Regression Risks:** Xung đột portal với Google One Tap hoặc body scroll lock không nhả khi unmount.
9. **Acceptance Criteria:**
   - Khi modal mở, `#root` có thuộc tính `inert=""` và `aria-hidden="true"`.
   - Khi modal đóng, thuộc tính `inert` và `aria-hidden` được xóa sạch, tiêu điểm trở về nút ban đầu.
   - Phím Escape đóng modal khi `loading === false`, không đóng khi `loading === true`.
   - Click backdrop không làm đóng modal ngoài ý muốn.
10. **Verification Methods:** Bộ kiểm thử Playwright chuyên biệt chạy trên 4 browser engines (`chromium`, `webkit`, `mobile-chrome`, `mobile-webkit`).
11. **Rollback Strategy:** Chuyển về container modal in-place nếu phát sinh lỗi portal ngoài tầm kiểm soát.

---

## 6. Comprehensive Testing Strategy

### 6.1. Phân Loại Môi Trường Kiểm Thử
- **Automated Mocked Tests (CI/Local):** Kiểm tra cấu trúc DOM, nhãn trợ năng, WAI-ARIA roles, touch targets, keyboard navigation, Tab focus trap, Escape, form validation, và mock API responses (200, 400, 401, 1011).
- **HTTPS Real-World Verification (Production/Staging):** Kiểm tra tương tác thực tế với máy chủ Google GSI OAuth và Facebook OAuth trên domain được đăng ký OAuth Redirect URI hợp lệ.

### 6.2. Ma Trận Kiểm Thử Chi Tiết

| Kịch Bản Kiểm Thử | Loại Test | Công Cụ | Tiêu Chí Đạt (Pass Criteria) |
| :--- | :---: | :---: | :--- |
| **Lint & Static Check** | Automated | `oxlint --deny-warnings` | 0 errors, 0 warnings trên toàn bộ codebase. |
| **Unit / Contract Tests** | Automated | `node --test` | 100% tests hiện tại tiếp tục PASS; thêm tests kiểm tra accessibility contracts của AuthModal. |
| **Login Form Interaction** | Automated | Playwright E2E | Nhập email, password, toggle eye button, submit form, hiển thị loading state `aria-busy="true"`. |
| **Register Validation** | Automated | Playwright E2E | Báo lỗi khi username < 3 ký tự hoặc chứa ký tự đặc biệt; báo lỗi khi mật khẩu không khớp; chặn submit khi < 18 tuổi. |
| **OTP Paste & Navigation** | Automated | Playwright E2E | Dán chuỗi `"123456"` tự động điền vào 6 ô; nhấn Backspace tự động lùi và xóa ô trước. |
| **Keyboard Navigation & Trap** | Automated | Playwright E2E | Phím Tab duyệt vòng lặp bên trong modal, không rò rỉ tiêu điểm ra `#root`. |
| **Escape Dismiss & Restoration** | Automated | Playwright E2E | Phím Escape đóng modal khi không loading và khôi phục tiêu điểm về nút kích hoạt ban đầu. |
| **Background Inert Isolation** | Automated | Playwright E2E | `#root` nhận `inert=""` và `aria-hidden="true"` khi modal mở, và mất đi khi modal đóng. |
| **Zero Manual Token Leaks** | Automated | Build Verification | `verify-production-build.mjs` xác nhận không còn bất kỳ ô nhập token JWT / Access Token nào trong artifact. |
| **Multi-Viewport Responsive** | Automated | Playwright E2E | Kiểm tra hiển thị và zero horizontal overflow tại 4 viewports chuẩn: **320px**, **390px**, **768px**, **1440px**. |
| **Visual Regression Snapshots** | Automated | Playwright Visual | Chụp ảnh baseline và so sánh dung sai pixel `maxDiffPixelRatio: 0.03`. |
| **Google & Facebook SDK Handshake** | Manual/Real | Trình duyệt thật (HTTPS) | Xác nhận Google GSI iframe hiển thị và Facebook popup mở bình thường. |

---

## 7. Outstanding Issues from Batch 2D-2A

Ghi nhận độc lập các vấn đề tồn đọng từ Batch 2D-2A để theo dõi và xử lý đúng thời điểm, **không tự ý mở rộng phạm vi xử lý trong task lập kế hoạch AuthModal**:

1. **Visual Regression Coverage Cho Ba Admin Selects:**
   - *Hiện trạng:* Ba selects mới được migration trong `AdminSection.jsx` nằm sau màn hình quản trị yêu cầu quyền Admin, chưa có kịch bản visual snapshot tự động riêng biệt trong `e2e/visual-regression.spec.js` (hiện visual suite mới bao phủ Primitives Harness, ConfirmActionModal và Explore Search Bar).
   - *Kế hoạch:* Sẽ bổ sung test snapshot riêng cho AdminSection khi thực hiện batch kiểm thử toàn diện Admin.
2. **Rà Soát Hardcoded Shadow Values Với Design Tokens:**
   - *Hiện trạng:* Các selects trong Admin hiện sử dụng giá trị hardcoded `shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]` để phù hợp với pill-button kích thước nhỏ thay vì token `var(--shadow-brutalist-sm)`.
   - *Kế hoạch:* Sẽ rà soát và tạo token bổ trợ `var(--shadow-brutalist-xs)` trong đợt refactor CSS tokens diện rộng.
3. **Kiểm Chứng Native Mobile Picker Trên Thiết Bị Vật Lý:**
   - *Hiện trạng:* Đã kiểm thử thành công qua giả lập Mobile Chrome và Mobile WebKit của Playwright; chưa tiến hành kiểm thử trên điện thoại iOS / Android vật lý thực tế.
   - *Kế hoạch:* Thực hiện kiểm thử trên thiết bị thật trước khi đóng Phase 2.

---

## 8. Technical Decisions & Approvals Required

Trước khi bắt đầu triển khai mã nguồn trong **Batch 2D-2B.2**, các quyết định kỹ thuật sau cần được thống nhất và phê duyệt:

1. **Quyết định 1: Áp Dụng Chiến Lược Di Chuyển Hai Giai Đoạn (Two-Phase):**
   - *Đề xuất:* Triển khai **Batch 2D-2B.2A** trước để chuẩn hóa 100% các trường form, labels, autocomplete, nút bấm, eye toggle và OTP bên trong modal hiện tại. Sau khi kiểm thử toàn diện đạt chuẩn, triển khai tiếp **Batch 2D-2B.2B** để chuyển đổi vỏ khung sang `Dialog` primitive.
   - *Lý do:* Giảm thiểu tối đa rủi ro xung đột portal với Google GSI và Facebook SDK, cho phép cô lập và kiểm chứng từng phần độc lập.
2. **Quyết định 2: Cấu Hình `closeOnBackdropClick={false}`:**
   - *Đề xuất:* Không cho phép click ra ngoài backdrop để đóng AuthModal. Người dùng chỉ đóng modal qua phím Escape hoặc nút Đóng (X).
   - *Lý do:* Bảo vệ dữ liệu người dùng đang nhập trong form Đăng ký (8 trường thông tin) và form Đặt lại mật khẩu.
3. **Quyết định 3: Tích Hợp Autocomplete Tiêu Chuẩn Cho Password Managers:**
   - *Đề xuất:* Bắt buộc bổ sung `autoComplete="username"`, `current-password`, `new-password`, `one-time-code` cho tất cả các ô nhập liệu tương ứng.
   - *Lý do:* Nâng cao trải nghiệm người dùng hiện đại và đáp ứng chuẩn WCAG 2.2 Input Purpose (1.3.5).

---

> **KẾT LUẬN & DỪNG LẠI:** Kế hoạch chuyển đổi `AuthModal.jsx` đã được xây dựng hoàn chỉnh và sẵn sàng để thực thi. Toàn bộ mã nguồn, CSS và business logic đều được giữ nguyên 100%. Dừng lại tại đây để chờ phê duyệt trước khi bắt đầu Batch 2D-2B.2.
