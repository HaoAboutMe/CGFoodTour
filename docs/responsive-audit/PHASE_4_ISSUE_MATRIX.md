# CG FoodTour — Phase 4A: Responsive Defect & Issue Matrix

> **Document ID:** `PHASE_4_ISSUE_MATRIX`
> **Status:** Completed & Ready for Review
> **Phase:** Phase 4 — Responsive Design & Mobile/Tablet Optimization (Track 4A: Audit & Blueprint)
> **Date:** October 25, 2026
> **Author:** Principal Frontend Engineer & QA Automation Engineer

---

## 1. Issue Severity Classification

- **P0 (Critical / Blocker):** Core user journey blocked, critical controls rendered off-screen or unclickable, data loss risk.
- **P1 (High):** Major layout distortion, text clipping of essential information, touch target violation (< 44px), severe horizontal table scroll on mobile.
- **P2 (Medium):** Minor text truncation in secondary controls, missing platform safe areas, non-optimal default view modes.
- **P3 (Low / Polish):** Aesthetic alignment, spacing refinement, micro-typography tuning on specific screen sizes.

---

## 2. Master Issue Matrix

| Issue ID | Component | Viewport | Severity | Summary | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`RESP-NAV-001`** | `Header.jsx` | `768×1024` (Tablet) | **P0** | Desktop nav triggers at `md:` (768px), pushing Login button & Avatar off-screen | **RESOLVED (Batch 4B-1)** |
| **`RESP-NAV-002`** | `Header.jsx` | `320×568` (Mobile) | **P1** | Brand logo + "ĐĂNG NHẬP" text button overflows 320px row; text clips | **RESOLVED (Batch 4B-1)** |
| **`RESP-NAV-003`** | `BottomNav.jsx` | `320×568`, `375×667` | **P1** | 6 to 7 buttons packed in one row; touch targets drop to 39px–46px (WCAG violation) | **RESOLVED (Batch 4B-1)** |
| **`RESP-NAV-004`** | `BottomNav.jsx` | Mobile (iOS) | **P2** | Missing `env(safe-area-inset-bottom)`; home indicator bar covers bottom labels | **RESOLVED (Batch 4B-1)** |
| **`RESP-MODAL-001`** | `Dialog.jsx`, `AuthModal.jsx` | `320×568` (Mobile) | **P0** | `items-center` centering pushes modal header and Close "X" button off top of screen | Identified |
| **`RESP-MODAL-002`** | Input Fields (`Dialog.jsx`, `AuthModal.jsx`) | Mobile (iOS) | **P2** | Text input font sizes < 16px trigger automatic iOS Safari viewport zoom | Identified |
| **`RESP-DRAWER-001`** | `StoreDetailDrawer.jsx` | `320×568` (Mobile) | **P1** | Floating banner zoom badge collides with top-right circular share & close buttons | Identified |
| **`RESP-DRAWER-002`** | `StoreDetailDrawer.jsx` | `320×568` (Mobile) | **P1** | Sticky footer rating button grid forces text truncation ("Bình thườ...") | Identified |
| **`RESP-SPIN-001`** | `CS2CaseOpener.jsx` | `320×568` (Mobile) | **P2** | Top control bar `grid-cols-2` truncates button labels ("ÂM THA...", "QUÁN S...") | Identified |
| **`RESP-ADMIN-001`** | `AdminSection.jsx` (Users Tab) | `< 768px` (Mobile/Tablet) | **P1** | No mobile card layout for Users; forced horizontal scrolling on `min-w-[860px]` table | Identified |
| **`RESP-ADMIN-002`** | `AdminSection.jsx` (Stores Tab) | `< 768px` (Mobile/Tablet) | **P2** | Stores tab defaults to `min-w-[830px]` table view instead of existing responsive card view | Identified |
| **`RESP-FORM-001`** | `Dialog.jsx`, `MyStoresSection.jsx` | `320×568` (Mobile) | **P2** | Store creation and dish management modal forms lack sticky bottom submit footers | Identified |

---

## 3. Detailed Defect Inventory

---

### Defect: RESP-NAV-001

- **Issue ID:** `RESP-NAV-001`
- **Page / Component:** `Header.jsx` (`<header role="banner">`)
- **Affected Viewport(s):** `768×1024` (Tablet Portrait — iPad Mini, iPad 9.7", Samsung Galaxy Tab)
- **Severity:** **P0 — Critical**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/explore-768x1024.png`
- **Reproduction Steps:**
  1. Open Chrome DevTools or Playwright test at resolution `768 × 1024`.
  2. Navigate to `http://localhost:5173/`.
  3. Observe the top header bar and attempt to click the "Đăng Nhập" button (`#login-btn`).
- **Expected Behavior:**
  On tablet portrait (768px), the top navigation bar must adapt gracefully: either by collapsing navigation links into a tablet hamburger drawer, or hiding desktop navigation in favor of `BottomNav`, ensuring the Brand Logo, Search Bar, and Login/User Avatar button remain 100% visible and clickable within the 768px container.
- **Actual Behavior:**
  Desktop navigation links activate at `md:` (768px). The 4 wide navigation buttons (`Khám Phá`, `Vòng Xoay`, `Quán Đã Lưu`, `Về Chúng Tôi`) consume ~614px. Combined with the Logo (~195px), the right edge of the header overflows. The **"Đăng Nhập"** button is pushed completely off the right edge of the screen (`x > 768px`). In automated Playwright testing, clicking `#login-btn` fails with:
  `Error: locator.click: Target page, context or browser has been closed / element is outside of the viewport`.
- **Root Cause Hypothesis:**
  In `Header.jsx` (line 219), the desktop navigation container is configured with:
  ```jsx
  <nav className="hidden md:flex items-center gap-1 shrink-0">
  ```
  Tailwind's `md:` breakpoint begins at `768px`. However, the sum of minimum widths of all header elements is `195px (Logo) + 16px (gap) + 614px (Nav) + 140px (Search & Login) = 965px`. At 768px, there is a deficit of **197px**, causing uncontrollable overflow.
- **Recommended Fix:**
  1. Change the desktop navigation breakpoint from `md:flex` to `lg:flex` (1024px+).
  2. On viewports `< 1024px`, keep the top navigation links hidden and let `BottomNav.jsx` handle main route navigation, OR provide a condensed tablet icon strip.
  3. Ensure `#login-btn` and the User Avatar always retain `shrink-0` and remain securely pinned inside the right header boundary.
- **Resolution (Batch 4B-1):**
  - Desktop nav links container switched from `hidden md:flex` to `hidden lg:flex`.
  - `BottomNav.jsx` switched to `lg:hidden` (visible on `< 1024px`), eliminating the 768px–1023px tablet navigation gap while keeping Header width under ~392px.
  - `#login-btn` and Avatar pill retain `shrink-0` and remain 100% inside viewport bounds at 768px and 820px tablet portrait.
  - Verified by Playwright test `RESP-NAV-001` in `phase4b-1-navigation.spec.js`.

---

### Defect: RESP-NAV-002

- **Issue ID:** `RESP-NAV-002`
- **Page / Component:** `Header.jsx`
- **Affected Viewport(s):** `320×568` (iPhone SE 1st gen, small Android phones)
- **Severity:** **P1 — High**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/explore-320x568.png`
- **Reproduction Steps:**
  1. Set viewport to `320 × 568`.
  2. Navigate to `http://localhost:5173/`.
  3. Inspect the right side of the header.
- **Expected Behavior:**
  On 320px screens, the header items should fit without clipping or overflow. If text cannot fit, the action button should gracefully degrade to an icon button (`<LogIn className="w-4 h-4" />`) with `aria-label="Đăng Nhập"`.
- **Actual Behavior:**
  The "ĐĂNG NHẬP" text button is squeezed against the right edge, causing its text to be truncated to `"ĐĂNG N..."`.
- **Root Cause Hypothesis:**
  Logo container takes ~180px (`CẦN GIUỘC` + `FOODTOUR` badge). The Login button has fixed horizontal padding `px-3.5 py-1.5` and uppercase text `"ĐĂNG NHẬP"`, demanding ~120px. On a 320px screen with container padding `px-3` (24px total), available width is only `296px`. `180px + 120px = 300px > 296px`.
- **Recommended Fix:**
  On `< 360px` or `max-sm:` viewports, display only the `LogIn` icon inside the login button with `aria-label="Đăng nhập"`, or shorten text to `"Vào"` / hide the secondary yellow `"FOODTOUR"` pill on ultra-compact screens.
- **Resolution (Batch 4B-1):**
  - `#login-btn` gracefully collapses to `<LogIn className="sm:hidden" />` on mobile while rendering full `"Đăng Nhập ↗"` on `sm:` and desktop.
  - Minimum touch target dimension enforced at `min-h-[44px] min-w-[44px]`.
  - Secondary `"FOODTOUR"` badge on brand logo hidden below 360px (`hidden xs:inline-flex`).
  - Added mobile Info icon shortcut (`min-h-[44px] min-w-[44px]`, `lg:hidden`) for 1-tap "Về Chúng Tôi" access.
  - Zero text clipping, zero horizontal overflow across 320px and 375px.
  - Verified by Playwright test `RESP-NAV-002` in `phase4b-1-navigation.spec.js`.

---

### Defect: RESP-NAV-003

- **Issue ID:** `RESP-NAV-003`
- **Page / Component:** `BottomNav.jsx` (`<nav role="navigation">`)
- **Affected Viewport(s):** `320×568`, `375×667`
- **Severity:** **P1 — High**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/explore-320x568.png`, `admin-dashboard-320x568.png`
- **Reproduction Steps:**
  1. Open mobile viewport `320 × 568` or `375 × 667`.
  2. Inspect the bottom navigation bar when logged out (6 buttons) and when logged in as Admin (7 buttons).
- **Expected Behavior:**
  Touch target dimensions must comply with WCAG 2.2 Success Criterion 2.5.8 (Target Size - Minimum: 44×44px or 48×48px recommended for touch devices). A mobile navigation bar should typically offer 4–5 core primary tabs.
- **Actual Behavior:**
  On 320px:
  - 6 items: width per button is `320px / 6 ≈ 53px`, minus borders and gaps = ~46px net touch area.
  - 7 items (Admin): width per button is `320px / 7 ≈ 45px`, minus borders = ~39px net touch area.
  - Text labels use `text-[9px]` or `text-[10px]`, causing awkward line wrapping (e.g., `"Vòng"` / `"Xoay"`, `"Về Chúng"` / `"Tôi"`).
- **Root Cause Hypothesis:**
  `BottomNav.jsx` appends every application route directly to the bottom row array (`explore`, `case-opener`, `saved`, `my-stores`, `admin`, `about`, `profile`), cluttering the bottom bar beyond mobile ergonomic thresholds.
- **Recommended Fix:**
  Consolidate `BottomNav` into **4 primary consumer tabs**:
  1. `Khám Phá` (Compass icon)
  2. `Vòng Xoay` (Dices icon)
  3. `Đã Lưu` (Bookmark icon)
  4. `Tài Khoản` (User / LogIn icon)
  Secondary destinations (`Về chúng tôi`, `Quán của tôi`, `Quản trị hệ thống`) should be moved inside the `Tài Khoản` profile drawer / bottom sheet, restoring spacious 75px–80px touch targets for all primary actions.
- **Resolution (Batch 4B-1):**
  - Consolidated `BottomNav.jsx` into exactly **4 primary tabs**: Khám Phá, Vòng Xoay, Đã Lưu, Tài Khoản.
  - Touch targets on 320px expanded to `min-h-[48px]`, width ~75px (exceeding WCAG 2.2 44×44px standard).
  - Implemented Neo-Brutalist Mobile Account Menu / Bottom Sheet for authenticated users:
    - User Profile Summary card with avatar, username, email, role badge (`Quản Trị`, `Chủ Quán`, `Thành Viên`).
    - Links to Profile (`profile`), My Stores (`my-stores`), Admin (`admin` - only when `isUserAdmin`), About (`about`), and Logout (`handleLogout`).
    - Full Accessibility: `role="dialog"`, `aria-modal="true"`, focus trap, Escape key dismiss, outside tap dismiss, body scroll lock with cleanup.
  - Anonymous users tapping "Tài Khoản" tab opens `AuthModal` in login mode with zero route deviation.
  - Verified by Playwright tests `RESP-NAV-003` (anonymous, admin, and store owner) in `phase4b-1-navigation.spec.js`.

---

### Defect: RESP-NAV-004

- **Issue ID:** `RESP-NAV-004`
- **Page / Component:** `BottomNav.jsx`
- **Affected Viewport(s):** Modern iPhones with Home Indicator (iPhone X, 12, 13, 14, 15, 16)
- **Severity:** **P2 — Medium**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/explore-390x844.png`, `explore-430x932.png`
- **Reproduction Steps:**
  1. Open app in Safari on iOS with native home swipe bar.
  2. Observe bottom bar icons and text labels.
- **Expected Behavior:**
  Bottom navigation bar should pad its bottom edge with `env(safe-area-inset-bottom)` so buttons and text labels remain cleanly separated from the iOS system home indicator.
- **Actual Behavior:**
  `BottomNav.jsx` uses fixed padding `py-2`. The iOS home indicator directly overlays the bottom text labels, causing accidental app switching when attempting to tap bottom navigation tabs.
- **Root Cause Hypothesis:**
  Absence of CSS safe-area utility: `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`.
- **Recommended Fix:**
  Add safe-area padding to `BottomNav.jsx`:
  ```jsx
  className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-black pb-[max(0.5rem,env(safe-area-inset-bottom))]"
  ```
- **Resolution (Batch 4B-1):**
  - Added `viewport-fit=cover` to `<meta name="viewport">` in `frontend/index.html`.
  - Added safe area padding to `BottomNav.jsx`: `pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]`.
  - Added safe area padding to Mobile Account Sheet: `pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]`.
  - Updated `<main>` bottom padding in `App.jsx` to `pb-24 lg:pb-8` (and `pb-20 lg:pb-0` for admin mode) to ensure interactive elements, buttons, toasts, and pagination clear the fixed BottomNav.
  - Verified by Playwright test `RESP-NAV-004` in `phase4b-1-navigation.spec.js`.

---

### Defect: RESP-MODAL-001

- **Issue ID:** `RESP-MODAL-001`
- **Page / Component:** `Dialog.jsx`, `AuthModal.jsx`
- **Affected Viewport(s):** `320×568` (iPhone SE 1st gen, small Android phones)
- **Severity:** **P0 — Critical**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/auth-register-320x568.png`
- **Reproduction Steps:**
  1. Set viewport to `320 × 568`.
  2. Open the Registration tab of the AuthModal.
  3. Observe modal positioning on the screen.
- **Expected Behavior:**
  The modal dialog must always keep its header, title, and close button within the visible viewport bounds. On small mobile screens, the dialog should either behave as a bottom sheet (`items-end`) or align from the top (`items-start pt-4`) with an internal scrollable body.
- **Actual Behavior:**
  The registration modal exceeds 568px in height. Because `Dialog.jsx` centers the modal with `flex items-center justify-center`, the top of the modal is pushed off-screen into negative Y-coordinates (`top < 0`). The modal title and Close "X" button are completely cut off and inaccessible.
- **Root Cause Hypothesis:**
  In `Dialog.jsx` (line 40):
  ```jsx
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  ```
  Flexbox `items-center` calculates center alignment based on container height. When child height > container height, half of the overflow extends upward off the top edge. In CSS, content pushed above `y = 0` cannot be scrolled to in standard overflow configurations.
- **Recommended Fix:**
  1. Change wrapper flex alignment from `items-center` to `items-start sm:items-center`.
  2. Add `overflow-y-auto` to the outer backdrop wrapper and give the dialog container `my-auto sm:my-8 max-h-[92dvh] flex flex-col`.
  3. Ensure the dialog header remains sticky (`sticky top-0 z-10 bg-white border-b-2 border-black`) so the Close button is permanently accessible.

---

### Defect: RESP-MODAL-002

- **Issue ID:** `RESP-MODAL-002`
- **Page / Component:** Text Input Elements (`Dialog.jsx`, `AuthModal.jsx`, `MyStoresSection.jsx`)
- **Affected Viewport(s):** iOS Safari (iPhone 320px to 430px)
- **Severity:** **P2 — Medium**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/auth-login-375x667.png`
- **Reproduction Steps:**
  1. Open AuthModal on iOS Safari.
  2. Tap into any text field configured with `text-xs` (12px) or `text-sm` (14px).
- **Expected Behavior:**
  Focusing on a form input must not trigger automatic browser viewport zoom on iOS devices.
- **Actual Behavior:**
  iOS Safari enforces a strict rule: any `<input>` or `<select>` with computed `font-size < 16px` automatically zooms the entire webpage, disrupting the viewport scale and causing horizontal shaking.
- **Root Cause Hypothesis:**
  Several modal input fields use Tailwind classes `text-sm` (`14px`) without mobile overrides.
- **Recommended Fix:**
  Apply `text-base sm:text-sm` (`16px` on mobile, `14px` on desktop) to all input, select, and textarea fields across the application.

---

### Defect: RESP-DRAWER-001

- **Issue ID:** `RESP-DRAWER-001`
- **Page / Component:** `StoreDetailDrawer.jsx`
- **Affected Viewport(s):** `320×568`
- **Severity:** **P1 — High**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/drawer-320x568.png`
- **Reproduction Steps:**
  1. Set viewport to `320 × 568`.
  2. Open any store detail drawer (e.g., "Bánh Xèo Cô Ba Cần Giuộc").
  3. Inspect the top banner image.
- **Expected Behavior:**
  The floating image hint badge and the circular action buttons (Share, Close) must have distinct bounding boxes and never collide or overlap.
- **Actual Behavior:**
  The badge `"BẤM ĐỂ PHÓNG TO ẢNH BAN..."` is positioned `top-3 left-3`. Due to its long label, its right boundary collides directly with and slides under the circular Share button (`top-3 right-14`), creating an illegible visual collision.
- **Root Cause Hypothesis:**
  Hardcoded label text `"BẤM ĐỂ PHÓNG TO ẢNH BANNER"` is too lengthy for narrow 320px displays.
- **Recommended Fix:**
  On mobile screens (`< 640px`), shorten the zoom badge text to `"Phóng to"` or display only the `Maximize2` icon with a tooltip.

---

### Defect: RESP-DRAWER-002

- **Issue ID:** `RESP-DRAWER-002`
- **Page / Component:** `StoreDetailDrawer.jsx` (Sticky Action Footer)
- **Affected Viewport(s):** `320×568`
- **Severity:** **P1 — High**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/drawer-320x568.png`
- **Reproduction Steps:**
  1. Set viewport to `320 × 568`.
  2. Open StoreDetailDrawer and scroll to the sticky rating footer.
- **Expected Behavior:**
  All three rating options (`Ngon`, `Bình thường`, `Không ngon`) must display complete, legible labels without text truncation.
- **Actual Behavior:**
  The middle button label is clipped with an ellipsis: `"Bình thườ..."`.
- **Root Cause Hypothesis:**
  The rating buttons are constrained in a `grid grid-cols-3 gap-2`. On a 320px display, after deducting drawer padding, each button gets ~88px of width, which is insufficient for the 10-character Vietnamese phrase `"Bình thường"`.
- **Recommended Fix:**
  1. On screens `< 375px`, shorten label to `"Tạm ổn"` or stack the emoji icon above the text (`flex flex-col items-center py-1.5`).
  2. Adjust font size to `text-xs font-bold`.

---

### Defect: RESP-SPIN-001

- **Issue ID:** `RESP-SPIN-001`
- **Page / Component:** `CS2CaseOpener.jsx`
- **Affected Viewport(s):** `320×568`
- **Severity:** **P2 — Medium**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/cs2-spinner-320x568.png`
- **Reproduction Steps:**
  1. Set viewport to `320 × 568`.
  2. Navigate to CS2 Case Opener.
  3. Inspect the top control bar above the roulette.
- **Expected Behavior:**
  Audio toggle and pool status buttons should fit cleanly without label clipping.
- **Actual Behavior:**
  The buttons display truncated text: `"ÂM THA..."` and `"QUÁN S..."`.
- **Root Cause Hypothesis:**
  Buttons use fixed `grid grid-cols-2 gap-2` containing verbose labels (`"ÂM THANH: BẬT"`, `"QUÁN SẴN SÀNG: 10"`).
- **Recommended Fix:**
  On `< 375px`, simplify button text to icon + state: `<Volume2 /> Bật` and `<Store /> 10 quán`.

---

### Defect: RESP-ADMIN-001

- **Issue ID:** `RESP-ADMIN-001`
- **Page / Component:** `AdminSection.jsx` (Users Tab)
- **Affected Viewport(s):** `< 768px` (Mobile & Tablet Portrait)
- **Severity:** **P1 — High**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/admin-dashboard-320x568.png`
- **Reproduction Steps:**
  1. Log in as Administrator on a mobile viewport (320px to 430px).
  2. Switch to the "Người Dùng" (Users) tab in the Admin section.
- **Expected Behavior:**
  User accounts should render in responsive stacked cards on mobile, similar to how store cards render, allowing one-tap actions for Lock/Unlock, Role Edit, and Password Reset.
- **Actual Behavior:**
  The Users tab only implements a traditional desktop table with `min-w-[860px]`. On mobile devices, administrators must swipe horizontally back and forth across 860px to view user emails, roles, and action buttons.
- **Root Cause Hypothesis:**
  `AdminSection.jsx` has a view mode toggle (`table` vs `cards`) implemented for the Stores tab, but **no card view was ever developed for the Users tab**.
- **Recommended Fix:**
  Create a responsive Card view for the Users tab:
  - Display user avatar, full name, email, and role badge in a compact Neo-Brutalist card.
  - Position action buttons in a neat, thumb-friendly bottom row.
  - Show the card view by default on screens `< 768px` and the table view on `>= 768px`.

---

### Defect: RESP-ADMIN-002

- **Issue ID:** `RESP-ADMIN-002`
- **Page / Component:** `AdminSection.jsx` (Stores Tab)
- **Affected Viewport(s):** `< 768px` (Mobile & Tablet Portrait)
- **Severity:** **P2 — Medium**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/admin-stores-768x1024.png`
- **Reproduction Steps:**
  1. Open Admin Stores tab on mobile or portrait tablet (768px).
- **Expected Behavior:**
  On screens under 768px, the interface should automatically default to the existing Card view.
- **Actual Behavior:**
  The component hardcodes the initial state: `const [storeViewMode, setStoreViewMode] = useState('table')`. This forces a wide `min-w-[830px]` table on first load.
- **Root Cause Hypothesis:**
  Lack of responsive viewport initialization in `useState`.
- **Recommended Fix:**
  Initialize `storeViewMode` based on viewport width:
  ```javascript
  const [storeViewMode, setStoreViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );
  ```

---

### Defect: RESP-FORM-001

- **Issue ID:** `RESP-FORM-001`
- **Page / Component:** `Dialog.jsx`, `MyStoresSection.jsx`, Dish Edit Modals
- **Affected Viewport(s):** `320×568` to `390×844`
- **Severity:** **P2 — Medium**
- **Screenshot Evidence:** `frontend/e2e/screenshots/phase-4a-audit/mystores-320x568.png`
- **Reproduction Steps:**
  1. On mobile, click "Tạo Quán Mới" or edit a dish.
  2. Observe modal action buttons (Save / Cancel).
- **Expected Behavior:**
  Form submit and cancel buttons should be pinned in a sticky footer at the bottom of the modal, ensuring they remain immediately accessible without scrolling all the way through long multi-field forms.
- **Actual Behavior:**
  Action buttons sit at the very end of the scrollable form body. Users must scroll past image uploads, address, tags, and hours before being able to tap "Lưu Thay Đổi".
- **Recommended Fix:**
  Structure modal forms with a flex-column layout:
  - Sticky Header (`sticky top-0 bg-white border-b-2 border-black z-10`)
  - Scrollable Body (`flex-1 overflow-y-auto p-4`)
  - Sticky Footer (`sticky bottom-0 bg-gray-50 border-t-2 border-black p-3 flex gap-2 z-10`)
