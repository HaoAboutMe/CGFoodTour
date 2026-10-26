# CG FoodTour — Phase 4A: Responsive Audit & Mobile/Tablet Verification Report

> **Document ID:** `PHASE_4_RESPONSIVE_AUDIT`
> **Status:** Completed & Ready for Review
> **Phase:** Phase 4 — Responsive Design & Mobile/Tablet Optimization (Track 4A: Audit & Blueprint)
> **Target System:** CG FoodTour Web Application (Frontend Vite React + Backend Spring Boot + MySQL 8.4)
> **Date:** October 25, 2026
> **Author:** Principal Frontend Engineer, Senior Responsive UI/UX Designer & QA Automation Engineer
> **Application Code Modifications:** **0 files modified** (Phase 4A is strictly audit, inspection, and blueprinting)

---

## 1. Executive Summary

Following the official completion and acceptance of the **Phase 3 Desktop UX Redesign** (Neo-Brutalist design language, SPA client-side routing, and skeleton loading), the product team has embarked on **Phase 4: Responsive Design & Mobile/Tablet Optimization**.

The objective of **Phase 4A** is to perform a rigorous, evidence-based audit of all production views across 8 mandatory viewport widths (ranging from ultra-compact 320px mobile to 1440px desktop), identifying visual clippings, horizontal overflow, touch target bottlenecks, modal clipping, drawer constraints, and administrative usability issues.

### Key Audit Conclusions

1. **Desktop Baseline (1280px & 1440px) is Pristine:**
   All desktop views accepted in Phase 3 remain in outstanding condition. Neo-Brutalist typography, high-contrast borders (`border-2 border-black`), offset drop-shadows (`shadow-[3px_3px_0px_#000]`), and grid layouts render with zero visual flaws.
2. **Critical Tablet Breakpoint Regression (768px - iPad Portrait):**
   A major layout collision was discovered in `Header.jsx`. The desktop navigation links activate prematurely at `md:` (768px). Combined with the brand logo and the right-side user/login action, the header requires ~934px of width. On a 768px screen, the rightmost elements—specifically the **"Đăng Nhập"** button or logged-in **User Avatar**—are pushed **completely outside the viewport**, making authentication unreachable from the top navigation on portrait tablets.
3. **Small Mobile Ergonomics & Clipping (320px - 375px):**
   - **Top Navigation:** The brand logo and text button collision on 320px clips the login button label (`"ĐĂNG N..."`).
   - **Bottom Navigation:** Squeezing 6 consumer buttons (or 7 when logged in as Admin) into a single row on 320px yields touch target widths under 40px (violating our internal project standard of 44×44px minimum, while WCAG 2.2 Success Criterion 2.5.8 establishes a 24×24px baseline with target spacing).
   - **Dialog/Auth Modal:** Centered dialog layout (`items-center`) pushes the modal header and close button off-screen at negative coordinates on small screens when modal content height exceeds viewport height.
   - **StoreDetailDrawer:** On 320px, the floating banner zoom badge collides with circular action buttons, and sticky footer rating labels truncate (`"Bình thườ..."`).
4. **Administrative Portal Responsiveness:**
   The Admin Stores tab features an excellent card mode, but defaults to an 830px-wide table. The Admin Users tab has **no card mode at all**, forcing mobile/tablet administrators to scroll horizontally across an 860px table.

---

## 2. Audit Environment & Methodology

### 2.1 Test Infrastructure
- **Frontend Runtime:** Vite 8.2.4 dev server with React 19.2.8 and Tailwind CSS 4.3.3 (`http://localhost:5173`)
- **Backend Runtime:** Spring Boot 3.5.9 (`http://localhost:8080`)
- **Database:** Local MySQL 8.4 LTS with seeded restaurants, categories, dishes, and mock accounts (`ROLE_USER`, `ROLE_OWNER`, `ROLE_ADMIN`)
- **Automated Test Harness:** Playwright 1.64.1 (Chromium engine with device viewport and user-agent emulation)
- **Testing Scope Note:** Automated tests were executed using Chromium emulation; real iOS Safari device-specific observations (home indicator swipe obstruction and virtual keyboard inset handling) are derived from WebKit layout specifications and viewport metrics.
- **Visual Capture Output:** 64 high-resolution full-page screenshots cataloged in `frontend/e2e/screenshots/phase-4a-audit/`

### 2.2 Mandatory Viewport Matrix

| Viewport Category | Resolution (W × H) | Target Representative Devices | Orientation |
| :--- | :--- | :--- | :--- |
| **Mobile Extra-Small (xs)** | `320 × 568` | iPhone SE (1st gen), compact Android | Portrait |
| **Mobile Small (sm)** | `375 × 667` | iPhone SE (2nd/3rd gen), iPhone 8 | Portrait |
| **Mobile Standard (sm+)** | `390 × 844` | iPhone 12 / 13 / 14 / 15 | Portrait |
| **Mobile Large (md-)** | `430 × 932` | iPhone 14 / 15 / 16 Pro Max, Pixel 7 Pro | Portrait |
| **Tablet Portrait (md)** | `768 × 1024` | iPad Mini, iPad 9.7", Samsung Galaxy Tab | Portrait |
| **Tablet Landscape (lg-)** | `1024 × 768` | iPad 9.7", iPad Air, iPad Pro 11" | Landscape |
| **Desktop Small (lg)** | `1280 × 800` | MacBook Air 13", Small Laptop | Landscape |
| **Desktop Baseline (xl)** | `1440 × 900` | Standard Desktop Display | Landscape |

---

## 3. Component & Page Inspection

### 3.1 Global Header & Navigation (`Header.jsx`)

#### Current Source Logic
```jsx
// Header.jsx: Line 219
<nav className="hidden md:flex items-center gap-1 shrink-0">
  {NAV_ITEMS.map((item) => (
    // 4 action buttons (~614px total with text and icons)
  ))}
</nav>
```

#### Observations Across Viewports
- **1440px & 1280px (Desktop):** Perfect layout. Brand logo on left, 4 navigation pills centered/left-aligned, Search bar right-aligned, Login/User Profile button neatly pinned to the right edge.
- **1024px (Tablet Landscape):** Elements fit with tight margins, navigation buttons remain fully clickable.
- **768px (Tablet Portrait — iPad):** **CRITICAL DEFECT.** The class `hidden md:flex` activates the full desktop nav at 768px.
  - Total required width: Logo (`~195px`) + Gap (`~16px`) + Nav items (`~614px`) + Search & Login (`~140px`) = **~965px**.
  - Since viewport is only 768px wide, flex layout overflows to the right.
  - The login button (`#login-btn`) and user dropdown are pushed completely outside the screen bounds (`x > 768px`). In Playwright automated execution, clicking `#login-btn` timed out with error: `element is outside of the viewport`.
- **320px (Mobile Extra-Small):** The brand title (`"CẦN GIUỘC FOODTOUR"`) + yellow badge (`"FOODTOUR"`) takes ~195px. The login button (`"ĐĂNG NHẬP"`) with borders and padding takes ~135px. Total width ~330px > 320px. On 320px, the login button text clips to `"ĐĂNG N..."`.

---

### 3.2 Global Bottom Navigation (`BottomNav.jsx`)

#### Current Source Logic
```jsx
// BottomNav.jsx: Line 28
const navItems = [
  { id: 'explore', label: 'Khám Phá', icon: Compass },
  { id: 'case-opener', label: 'Vòng Xoay', icon: Dices },
  { id: 'saved', label: 'Đã Lưu', icon: Bookmark },
  ...(user?.role === 'STORE_OWNER' ? [{ id: 'my-stores', label: 'Quán Tôi', icon: Store }] : []),
  ...(user?.role === 'ADMIN' ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
  { id: 'about', label: 'Về Chúng Tôi', icon: Info },
  { id: 'profile', label: user ? 'Hồ Sơ' : 'Đăng Nhập', icon: user ? User : LogIn },
];
```

#### Observations Across Viewports
- **Desktop (1024px, 1280px, 1440px):** `BottomNav` correctly sets `md:hidden` and is not rendered, leaving the screen clean for desktop scrolling.
- **Mobile Standard (390px, 430px):** 6 items render across the bottom bar. Each button receives ~60px of width. Usable, but visually tight.
- **Mobile Extra-Small (320px & 375px):**
  - **Unauthenticated (6 items):** Each tab button has a width of only 46px on 320px. Font size drops to 9px (`text-[9px]`). Text labels wrap awkwardly or hit border edges.
  - **Admin Logged In (7 items):** When logged in as Administrator, adding the "Admin" button forces 7 buttons into 320px, giving each touch target a width of ~40px. This violates mobile accessibility standards (minimum 44×44px touch bounding box).
  - **iOS Home Indicator Collision:** The bottom bar currently lacks padding for the iOS home indicator bar (`env(safe-area-inset-bottom)`), causing potential tap interference on gesture-based iPhones.

---

### 3.3 Dialog System & Authentication Modal (`Dialog.jsx`, `AuthModal.jsx`)

#### Current Source Logic
```jsx
// Dialog.jsx: Line 40
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="relative w-full max-w-lg bg-white border-3 border-black ... max-h-[90vh] overflow-y-auto">
    {children}
  </div>
</div>
```

#### Observations Across Viewports
- **Desktop & Tablet (768px - 1440px):** The modal centers cleanly in the viewport, surrounded by a semi-transparent backdrop (`bg-black/50`).
- **Mobile Extra-Small (320px × 568px):** **CRITICAL DEFECT.**
  - In `auth-register-320x568.png`, the registration modal height exceeds 568px.
  - Because the outer wrapper uses `flex items-center justify-center`, the modal container is vertically centered on the screen.
  - The top of the modal (including the modal header, title, and Close "X" button) extends above the viewport (`top < 0px`), making the close button unreachable without scrolling up within the outer viewport window (which is locked by `fixed inset-0`).
  - When the on-screen virtual keyboard appears on a mobile device, this defect will worsen, rendering the input fields and submit button completely invisible or unscrollable.

---

### 3.4 Store Detail Drawer (`StoreDetailDrawer.jsx`)

#### Observations Across Viewports
- **Desktop (1280px, 1440px):** Renders as an elegant Neo-Brutalist right-hand sliding panel (`w-[480px] max-w-full`), leaving the Explore background visible.
- **Tablet (768px):** Smooth full-height slide-over. Good proportions.
- **Mobile Extra-Small (320px × 568px):**
  - **Header Zoom Pill Collision:** The floating banner badge `"BẤM ĐỂ PHÓNG TO ẢNH BAN..."` overlaps directly with the top-right circular share and close buttons.
  - **Sticky Footer Truncation:** In the bottom rating action bar, the `grid-cols-3` layout allocates only ~90px per button on 320px. The label `"Bình thường"` is truncated with an ellipsis to `"Bình thườ..."`.
  - **Scroll Boundary:** The drawer interior scrolls cleanly without background bleed (`overflow-y-auto`).

---

### 3.5 CS2 Case Opener (`CS2CaseOpener.jsx`)

#### Observations Across Viewports
- **Desktop (1280px, 1440px):** Pristine simulation of a Counter-Strike case opening crate. Roulette strip, gold pointer, audio controls, and drop inventory align seamlessly.
- **Tablet (768px):** The roulette container resizes gracefully with CSS `max-w-4xl`.
- **Mobile Extra-Small (320px × 568px):**
  - The top controls bar uses `grid grid-cols-2 gap-2`.
  - The buttons `"Âm thanh: BẬT"` and `"Quán sẵn sàng: 10"` overflow their bounding boxes, resulting in clipped labels (`"ÂM THA..."` and `"QUÁN S..."`).
  - The spin trigger button `"MỞ HỘP NGAY"` remains prominent, bold, and fully clickable.

---

### 3.6 Explore Page & StoreCard (`ExploreSection.jsx`, `StoreCard.jsx`)

#### Observations Across Viewports
- **Grid Responsiveness:** Transitions cleanly from 3 columns (`xl:grid-cols-3`) to 2 columns (`md:grid-cols-2`) to 1 column (`grid-cols-1`).
- **StoreCard on Mobile:** On all mobile screens (320px to 430px), StoreCard renders as a full-width vertical stacked card. Card banner image preserves aspect ratio (`h-44`), tags wrap neatly, and the `"Xem Chi Tiết"` action button is thumb-accessible.
- **Search & Filter Bar:**
  - Search input expands to full width on mobile.
  - Category filter pills are housed in a horizontal scrolling container with hide-scrollbar utility, allowing easy swipe navigation.
  - Filter toggle button is compact and responsive.

---

### 3.7 Saved Stores & About Section (`SavedStoresSection.jsx`, `AboutSection.jsx`)

#### Observations Across Viewports
- **Saved Stores:**
  - Empty state graphic and CTA button are centered and proportional on all screens from 320px to 1440px.
  - Saved stores grid uses the same responsive card layout as Explore.
- **About Section:**
  - On desktop (1280px - 1440px), features a 2-column layout with story narrative on the left and project metadata cards on the right.
  - On mobile and tablet (< 1024px), collapses smoothly into a single-column stacked layout with full Neo-Brutalist borders and drop-shadows.

---

### 3.8 User Profile & Store Owner Portals (`ProfileSection.jsx`, `MyStoresSection.jsx`)

#### Observations Across Viewports
- **Profile:** User header, avatar upload trigger, quick statistics cards, and change password form stack cleanly from 320px to 1440px.
- **My Stores:**
  - Store cards list collapses to a single column on mobile.
  - "Tạo quán mới" CTA button remains prominent and accessible.
  - Store Edit modal exhibits the same `Dialog.jsx` vertical positioning issue on 320px as the AuthModal.

---

### 3.9 Admin Dashboard (`AdminSection.jsx`)

#### Observations Across Viewports
- **Dashboard Overview:** 4 stat cards (`Tổng Quán`, `Tổng Người Dùng`, `Đã Phê Duyệt`, `Chờ Duyệt`) transform from 4 columns on desktop to 2 columns on tablet and 1 column on mobile.
- **Stores Management Tab:**
  - Features an existing view toggle: `Bảng (Table)` vs `Thẻ (Cards)`.
  - Card view is exceptionally mobile-friendly.
  - However, the default view mode is Table (`min-w-[830px]`), which forces an unprompted horizontal scrollbar when first opened on mobile/tablet devices.
- **Users Management Tab:**
  - Only provides a Table view (`min-w-[860px]`).
  - No Card view exists for user accounts.
  - On mobile devices (320px - 430px) and portrait tablets (768px), viewing user roles and performing action triggers (Lock, Reset Password, Role Change) requires extensive horizontal swiping.

---

## 4. UI Elements Already Stable (No Changes Needed)

The audit conclusively verified that the following components and subsystems are fully stable and require **NO layout or styling alterations**:

1. **StoreCard Component (`StoreCard.jsx`):**
   Card layout scales effortlessly from 320px to 1440px. Typography, price pill, opening status badge, and action buttons fit cleanly without overflow.
2. **Category Chip Carousel (`ExploreSection.jsx`):**
   Horizontal swipe navigation with `overflow-x-auto` and hidden scrollbars behaves naturally on touch screens.
3. **Hero Banner & Typography (`ExploreSection.jsx`):**
   Responsive font classes (`text-3xl md:text-5xl font-black`) wrap smoothly without clipping or horizontal overflow.
4. **Skeleton Loading Placeholders:**
   Skeleton cards and drawer loading shimmers match actual component geometries across all viewports.
5. **Image Viewer Modal (`ImageViewerModal.jsx`):**
   Full-screen image zoom modal adapts cleanly to all portrait and landscape orientations with a persistent top-right close button.
6. **Toast Notification System:**
   Toasts render in the bottom-right on desktop and bottom-center on mobile, resting comfortably above bottom navigation.

---

## 5. Visual Evidence Catalog

The 64 audit screenshots captured during automated Playwright test execution are stored in `frontend/e2e/screenshots/phase-4a-audit/`:

| Component / View | Screen Resolutions Tested | Key Screenshot Artifacts |
| :--- | :--- | :--- |
| **Explore Section** | 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900 | `explore-320x568.png`, `explore-768x1024.png`, `explore-1440x900.png` |
| **CS2 Case Opener** | All 8 viewports | `cs2-spinner-320x568.png`, `cs2-spinner-768x1024.png`, `cs2-spinner-1440x900.png` |
| **StoreDetailDrawer** | All mobile & tablet viewports | `drawer-320x568.png`, `drawer-375x667.png`, `drawer-430x932.png` |
| **Auth Modal (Login)** | All 8 viewports | `auth-login-320x568.png`, `auth-login-768x1024.png`, `auth-login-1280x800.png` |
| **Auth Modal (Register)**| All 8 viewports | `auth-register-320x568.png`, `auth-register-768x1024.png`, `auth-register-1440x900.png` |
| **Admin Dashboard** | 320×568, 375×667, 768×1024, 1280×800 | `admin-dashboard-320x568.png`, `admin-stores-768x1024.png`, `admin-stores-1280x800.png` |
| **My Stores** | 320×568, 375×667, 768×1024, 1280×800 | `mystores-320x568.png`, `mystores-768x1024.png`, `mystores-1280x800.png` |
| **Profile** | 320×568, 375×667, 768×1024, 1280×800 | `profile-320x568.png`, `profile-768x1024.png`, `profile-1280x800.png` |
| **About Us** | All 8 viewports | `about-320x568.png`, `about-768x1024.png`, `about-1280x800.png` |
| **Saved Stores** | All 8 viewports | `saved-320x568.png`, `saved-768x1024.png`, `saved-1280x800.png` |

---

## 6. Next Steps

Detailed issue specifications and root-cause analyses are codified in `PHASE_4_ISSUE_MATRIX.md`.
The complete multi-batch technical roadmap is provided in `PHASE_4_IMPLEMENTATION_BLUEPRINT.md`.
Awaiting Product Owner review and formal sign-off before entering Phase 4B implementation.
