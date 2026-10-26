# CG FoodTour — Phase 4 Implementation Progress: Batch 4B-1

> **Document ID:** `PHASE_4_IMPLEMENTATION_PROGRESS`
> **Status:** Batch 4B-1 & UX Refinement Complete — Ready for Review
> **Batch:** Phase 4B-1: Global Navigation & Mobile Shell (with UX Refinement)
> **Date:** October 25, 2026
> **Author:** Senior React Frontend Engineer, Responsive UI/UX Engineer & QA Automation Engineer
> **Target Release:** Local Development Baseline (Pre-Production)

---

## 1. Executive Summary

Phase 4B-1 is the first implementation batch of Phase 4 Responsive Design & Mobile Optimization. This batch strictly resolves the 4 global navigation defects identified during Phase 4A audit (`RESP-NAV-001`, `RESP-NAV-002`, `RESP-NAV-003`, `RESP-NAV-004`).

All 4 defects have been resolved, verified across 9 responsive viewport sizes (from 320px up to 1440px), confirmed via 16 automated Playwright E2E tests, 38 unit/contract tests, zero Oxlint lint warnings, and a clean production build. Phase 3 Neo-Brutalist desktop identity remains 100% regression-free.

---

## 2. Issues Resolved

| Issue ID | Component | Viewport | Severity | Summary & Solution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`RESP-NAV-001`** | `Header.jsx` | `768×1024` (Tablet) | **P0** | **Tablet Header Overflow Resolved:** Desktop center navigation links deferred from `md:` (768px) to `lg:` (1024px). `BottomNav` is displayed on `< 1024px` (`lg:hidden`), ensuring zero navigation gap between 768px and 1023px. Login button/Avatar pill is 100% contained within the viewport (`x + width <= 768px`). | **RESOLVED** |
| **`RESP-NAV-002`** | `Header.jsx` | `320×568` (Small Mobile) | **P1** | **Mobile Login Clipping Resolved:** Login button collapses to `<LogIn />` icon on `< sm:` while preserving `min-h-[44px] min-w-[44px]` touch target; renders full text `"Đăng Nhập ↗"` on `sm:` and desktop. Brand logo badge hidden on `< 360px`. Added accessible Info icon shortcut (`lg:hidden`). Zero clipping. | **RESOLVED** |
| **`RESP-NAV-003`** | `BottomNav.jsx` | `320×568`, `375×667` | **P1** | **BottomNav Overcrowding Resolved:** Streamlined into exactly 4 primary tabs: Khám Phá, Vòng Xoay, Đã Lưu, Tài Khoản. Touch target widths on 320px expanded to ~75px (height >= 48px), exceeding WCAG 2.2 44×44px standards. Authenticated users access Profile, My Stores, Admin (role-based), About, and Logout via a new Neo-Brutalist Mobile Account Sheet. Anonymous users tap Tài Khoản to open AuthModal in-place. | **RESOLVED** |
| **`RESP-NAV-004`** | `BottomNav.jsx`, `index.html`, `App.jsx` | Modern iOS / Android | **P2** | **Safe Area Insets Implemented:** Configured `viewport-fit=cover` in `index.html`. Added `pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]` to `BottomNav` and `pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]` to Mobile Account Sheet. Adjusted `<main>` padding in `App.jsx` to `pb-24 lg:pb-8` to guarantee complete clearance over bottom navigation. | **RESOLVED** |

---

## 3. Files Modified & Created

### 3.1. Source Code Files Modified
- [`frontend/index.html`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/index.html):
  - Updated `<meta name="viewport">` with `viewport-fit=cover` to allow `env(safe-area-inset-bottom)` to be calculated on notched mobile displays.
- [`frontend/src/layouts/Header.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/layouts/Header.jsx):
  - Changed desktop nav container from `hidden md:flex` to `hidden lg:flex`.
  - Added responsive short labels for navigation links on 1024px–1279px viewports (`shortLabel`), switching to full labels on `xl:` (1280px+).
  - Pinned `#login-btn` with `shrink-0 min-h-[44px] min-w-[44px]`, rendering `<LogIn className="sm:hidden" />` on mobile and `"Đăng Nhập ↗"` on `sm:`.
  - Adjusted Avatar pill button: `min-h-[44px] min-w-[44px] shrink-0` with responsive text truncation.
  - Added mobile `<Info />` shortcut button (`lg:hidden`) for anonymous mobile visitors to access "Về Chúng Tôi" in 1 tap without drawer navigation.
- [`frontend/src/layouts/BottomNav.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/layouts/BottomNav.jsx):
  - Completely redesigned to 4 primary tabs: Khám Phá (`Compass`), Vòng Xoay (`Dices`), Đã Lưu (`Bookmark`), Tài Khoản (`User`/`LogIn`).
  - Switched visibility from `md:hidden` to `lg:hidden` so tablet portrait users (768px–1023px) have full native bottom navigation, eliminating any breakpoint navigation gap.
  - Added safe area padding: `pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]`.
  - Implemented Neo-Brutalist Mobile Account Menu / Bottom Sheet:
    - User summary card (avatar, name, username, email, role badge: Quản Trị / Chủ Quán / Thành Viên).
    - Links to Profile (`profile`), My Stores (`my-stores`), Admin (`admin` - only if `isUserAdmin`), About (`about`), and Logout (`handleLogout`).
    - Full A11y: `role="dialog"`, `aria-modal="true"`, Escape key dismiss, focus trap, outside click backdrop dismiss, scroll lock with cleanup.
    - Safe area padding inside sheet: `pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]`.
  - Anonymous user behavior: tapping "Tài Khoản" tab opens `AuthModal` directly in `'login'` mode with zero route deviation.
- [`frontend/src/App.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/App.jsx):
  - Passed `handleLogout={handleLogout}` to `BottomNav`.
  - Updated `<main>` bottom padding from `pb-24 md:pb-8` to `pb-24 lg:pb-8` and `pb-20 lg:pb-0` for admin mode.

### 3.2. Test Files Created & Updated
- [`frontend/e2e/phase4b-1-navigation.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/phase4b-1-navigation.spec.js):
  - Comprehensive 16-test suite covering:
    1. Tablet Header overflow & login reachability (768px, 820px).
    2. Small mobile Header & touch target compliance (320px, 375px).
    3. BottomNav 4-tab consolidation & touch target compliance (320px).
    4. Authenticated Mobile Account Bottom Sheet (Admin role).
    5. Store Owner Mobile Account Bottom Sheet (Chủ Quán badge, absence of Admin link).
    6. iOS safe area insets and viewport meta verification.
    7. Desktop baseline regression protection (1280px, 1440px).
    8. Full 9-viewport sweep for zero horizontal page overflow.
- [`frontend/e2e/phase4-audit.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/phase4-audit.spec.js): Cleaned unused imports for zero lint warnings.
- [`frontend/e2e/phase4-audit-auth.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/phase4-audit-auth.spec.js): Cleaned unused parameters for zero lint warnings.

### 3.3. Documentation Updates
- [`docs/responsive-audit/PHASE_4_RESPONSIVE_AUDIT.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/responsive-audit/PHASE_4_RESPONSIVE_AUDIT.md): Corrected toolchain versions, component paths, WCAG 2.2 touch target definitions, and WebKit/Chromium testing scope notes.
- [`docs/responsive-audit/PHASE_4_IMPLEMENTATION_BLUEPRINT.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/responsive-audit/PHASE_4_IMPLEMENTATION_BLUEPRINT.md): Corrected component paths (`src/layouts/...`).
- [`docs/responsive-audit/PHASE_4_ISSUE_MATRIX.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/responsive-audit/PHASE_4_ISSUE_MATRIX.md): Updated status and resolution details for `RESP-NAV-001` through `RESP-NAV-004`.
- [`docs/responsive-audit/PHASE_4_IMPLEMENTATION_PROGRESS.md`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/docs/responsive-audit/PHASE_4_IMPLEMENTATION_PROGRESS.md): This progress document.

---

## 4. Key Design Decisions

1. **Tablet Navigation Strategy (768px–1023px):**
   - *Problem:* Showing desktop center navigation at 768px caused massive 197px horizontal overflow, pushing the login button off-screen to `x = 864px`.
   - *Alternative Considered:* Hiding desktop nav without providing an alternative would create a dead zone where tablet users have no way to navigate between pages.
   - *Decision:* Shift desktop top navigation container from `hidden md:flex` to `hidden lg:flex` (1024px+), while keeping `BottomNav` active on all screens under 1024px (`lg:hidden`). On 768px portrait tablets, the header requires only ~392px (leaving 376px headroom), and bottom navigation provides effortless thumb reachability.
2. **BottomNav Streamlining to 4 Primary Tabs:**
   - *Problem:* Packing 6 or 7 buttons in a single row on 320px reduced touch targets to 39px–46px and caused multi-line label truncation.
   - *Decision:* Restrict the bottom bar to 4 core consumer tabs (Khám Phá, Vòng Xoay, Đã Lưu, Tài Khoản). Secondary destinations (Profile, My Stores, Admin, About, Logout) are accessed via a high-fidelity Neo-Brutalist Mobile Account Sheet. This gives every tab ~75px of width on 320px, exceeding WCAG 2.2 standards.
3. **Anonymous vs Authenticated "Tài Khoản" Behavior:**
   - *Anonymous Visitor:* Tapping the 4th tab ("Đăng Nhập") opens the existing `AuthModal` directly in login mode with zero route deviation or page reload.
   - *Authenticated User:* Tapping the 4th tab ("Tài Khoản") opens the Mobile Account Bottom Sheet with full accessibility (focus trap, Escape key dismiss, backdrop tap dismiss, body scroll lock with cleanup).
4. **Safe Area Inset Handling:**
   - Instead of fixed bottom padding that collides with the iPhone home indicator, `pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]` was applied to `BottomNav` and `pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]` to the bottom sheet. On devices without a home bar (or Android/Desktop), it defaults to standard rem spacing.

---

## 5. Verification & Quality Gates

### 5.1. Quality Gates Summary

| Quality Gate | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Lint** | `npm run lint` (`oxlint --deny-warnings`) | **PASS (0 warnings, 0 errors)** | 103 files verified in 64ms |
| **Frontend Unit Tests** | `npm run test` (`node --test`) | **PASS (38 passed, 0 failed)** | 38 contract/unit tests passed |
| **Frontend Production Build** | `npm run build` (`vite build && verify:build`) | **PASS** | 1857 modules transformed in 309ms; artifact verified |
| **Dedicated Navigation E2E** | `npx playwright test e2e/phase4b-1-navigation.spec.js --project=chromium` | **PASS (16 passed, 0 failed)** | All 16 tests passed in 26.5s |

### 5.2. Viewport Sweep Test Results (Zero Horizontal Overflow)

| Viewport | Device Profile | Status | Horizontal Overflow Diff |
| :--- | :--- | :--- | :--- |
| `320×568` | iPhone SE 1st gen | **PASS** | `scrollWidth - clientWidth <= 0` |
| `375×667` | iPhone SE 2nd gen / iPhone 8 | **PASS** | `scrollWidth - clientWidth <= 0` |
| `390×844` | iPhone 12/13/14 | **PASS** | `scrollWidth - clientWidth <= 0` |
| `430×932` | iPhone 14/15/16 Pro Max | **PASS** | `scrollWidth - clientWidth <= 0` |
| `768×1024` | iPad Mini / 9.7" Portrait | **PASS** | `scrollWidth - clientWidth <= 0` |
| `820×1180` | iPad Air 10.9" Portrait | **PASS** | `scrollWidth - clientWidth <= 0` |
| `1024×768` | iPad Landscape | **PASS** | `scrollWidth - clientWidth <= 0` |
| `1280×800` | Laptop | **PASS** | `scrollWidth - clientWidth <= 0` |
| `1440×900` | Desktop | **PASS** | `scrollWidth - clientWidth <= 0` |

---

## 6. Screenshot Evidence Index

All Phase 4B-1 verification screenshots have been captured and saved to `frontend/e2e/screenshots/phase-4b1-verification/`:

| Artifact Name | Viewport | Target | Description |
| :--- | :--- | :--- | :--- |
| `tablet-header-768x1024.png` | `768×1024` | Tablet Header | Login button fully contained (`x + width <= 768px`), zero overflow, 4-tab BottomNav present |
| `tablet-header-820x1024.png` | `820×1024` | Tablet Header | iPad Air portrait zero overflow verification |
| `mobile-header-320px.png` | `320×568` | Small Mobile Header | Icon Login button, Info shortcut, zero clipping, 44×44px touch target |
| `mobile-header-375px.png` | `375×667` | Mobile Header | Standard mobile header with 44×44px buttons |
| `bottomnav-4tabs-320px.png` | `320×568` | Bottom Navigation | Exactly 4 tabs with ~75px touch target width, zero label wrapping |
| `account-sheet-mobile-375px.png` | `375×667` | Mobile Account Sheet | Neo-Brutalist bottom sheet with user summary, role badge, navigation links, and logout |
| `desktop-header-1280px.png` | `1280×800` | Desktop Header | Condensed labels (`shortLabel`), Phase 3 styling intact |
| `desktop-header-1440px.png` | `1440×900` | Desktop Header | Full Phase 3 labels, zero visual regression |

---

## 7. Desktop Regression Protection

1. **Neo-Brutalist Aesthetics:**
   - 4px borders, hard drop shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`), brand red `#ff3e3e`, uppercase heavy typography, and crisp borders are preserved across all breakpoints.
2. **Desktop Header Navigation:**
   - On viewports >= 1024px (`lg:` and `xl:`), full desktop navigation buttons render identical to Phase 3.
   - At 1440px+, full labels ("Khám Phá Ẩm Thực", "Vòng Xoay Quán Ăn", "Quán Đã Lưu", "Về Chúng Tôi") render with full spacing.
   - `#login-btn` displays `"Đăng Nhập ↗"`.
   - Desktop user avatar dropdown menu functions with zero modification.
3. **Desktop Layout:**
   - `<main>` bottom padding on desktop is `lg:pb-8`, keeping footers and content spacing identical to Phase 3 baseline.
   - `BottomNav` is completely hidden on desktop (`lg:hidden`).

---

## 8. Known Limitations & Follow-Up Items for Batch 4B-2

- **Testing Environment:**
  - Automated tests ran on Playwright Chromium emulation on Windows. Real iOS WebKit home bar interaction is implemented per Apple WebKit Human Interface Guidelines (`env(safe-area-inset-bottom)` and `viewport-fit=cover`), but physical Safari hardware testing should be performed during final user acceptance testing.
- **Scope Boundaries Preserved:**
  - `RESP-MODAL-001` & `RESP-MODAL-002` (Dialog centering & font-size 16px) were NOT touched in this batch.
  - `RESP-DRAWER-001` & `RESP-DRAWER-002` (StoreDetailDrawer layout on 320px) were NOT touched in this batch.
  - `RESP-SPIN-001` (CS2 Spinner controls) was NOT touched in this batch.
  - `RESP-ADMIN-001` & `RESP-ADMIN-002` (Admin cards & table views) were NOT touched in this batch.
  - All remaining issues are queued for subsequent Phase 4 batches (Batch 4B-2: Modals, Drawers & Forms; Batch 4B-3: Admin & CS2 Spinner).

---

## 9. Phase 4B-1 UX Refinement — Header Search & Explore Filters

### 9.1 Overview & PO Directives

Following the initial completion of Batch 4B-1, the Product Owner requested a targeted **UX Refinement** to elevate the handheld search and discovery ergonomics before final sign-off:
1. **UX Decision A — Header Quick Search & Responsive About (< 1024px):**
   - Replace the duplicate Profile Dropdown / Avatar in Header on mobile/tablet with a prominent Neo-Brutalist Search action button (`#header-search-btn`).
   - Replace the responsive Login button with an **About** button (`#header-about-btn`, icon `Info`, >= 44×44px, navigating to `about`).
   - Centralize mobile/tablet authentication into the Bottom Navigation's 4th tab ("Đăng Nhập").
   - After the user logs in, the responsive header right actions retain **ONLY the Search button** (all other secondary controls are cleanly hidden).
   - Desktop Header (>= 1024px) remains 100% intact with `#login-btn` and center navigation.
2. **UX Decision B — Simplified Explore Page (< 1024px):** Hide the full-width search bar and horizontal category chips on mobile/tablet, displaying food stall cards higher above the fold while retaining quick filters (Gần Tôi, Đang Mở Cửa) and applied filter summary badges.
3. **UX Decision C — Dedicated Search & Filter Screen:** Build a dedicated, full-screen/modal search experience with a Draft/Apply lifecycle model and a scalable, searchable, multi-select category selector capable of smoothly handling hundreds of categories without UI degradation.

---

### 9.2 UX Architecture Decisions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MOBILE & TABLET (< 1024px)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Header - Anonymous State]                                                 │
│  Logo + Brand ───────────── [Search 🔍 (>=44px)] [About ⓘ (>=44px)]         │
│                                                                             │
│  [Header - Authenticated State]                                             │
│  Logo + Brand ────────────────────────── [Header Search Button 🔍 (>=44px)] │
│                                                                             │
│  [Explore View - Simplified, No Redundant Buttons]                          │
│  Compact Hero Banner                                                        │
│  [📍 Gần Tôi] [🟢 Đang Mở Cửa]                                              │
│  Applied Badges: [🔍 "tên quán" ✕] [🏷️ "Hủ tiếu" ✕]                        │
│  ─── Store Cards (Immediately visible above the fold!) ───────────────────  │
│                                                                             │
│  [BottomNav]                                                                │
│  [Khám Phá] [Vòng Xoay] [Đã Lưu] [Đăng Nhập (Auth) / Tài Khoản (Sheet)]     │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼ (Tapping Search Button on Header)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Main SearchFilter View                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Bar: "Bộ Lọc & Tìm Kiếm" ─────────────────────────── [✕ Close]        │
│  Search Input: "Tìm tên quán ăn, địa chỉ, khu vực..." + [✕ Clear]           │
│  Quick Toggles: [📍 Quán gần tôi] [🟢 Đang mở cửa]                          │
│  Category Entry Row:                                                        │
│    [Sliders] Danh Mục Món Ăn — Tất cả danh mục / N đã chọn ──────────── [>] │
│  Footer: [Đặt Lại (Discard)] ────────────── [Áp Dụng Bộ Lọc (Commit)]       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼ (Tapping Category Entry Row)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dedicated Category Picker Subview (No Nested Scrolling!)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Bar: [← Quay lại] "Chọn Danh Mục (N đã chọn)" ─────────────── [Xong]   │
│  Search Input: "Tìm kiếm trong 150+ danh mục (vd: phở, bún)..." + [✕ Clear] │
│  Sub-bar: "Kết quả tìm kiếm (75)" ───────────── [Bỏ chọn tất cả (2)]       │
│  Primary Scrollable List:                                                   │
│    - When no keyword: Curated suggestions + Selected items                 │
│    - When typing: Accent-insensitive Vietnamese matching results            │
│    - Empty state: Clean alert when 0 matches found                          │
│  Footer: [Hoàn Tất Lựa Chọn (N đã chọn) ↗]                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Decision Details
- **Elimination of Redundant Search Button in Explore:** Removed the mobile button `Bộ Lọc & Tìm Kiếm` from Explore. Handheld users access the modal via the prominent Header Search icon (`#header-search-btn`), streamlining Explore layout.
- **Single-Row Category Entry in Main View:** Replaced the cumbersome vertical checkbox list on the Main SearchFilter screen with a sleek, single-row card (`#open-category-picker-btn`).
- **Dedicated Category Picker Subview:** Tapping the category row transitions to an unconstrained, dedicated picker subview with instant accent-insensitive search, eliminating nested scrolling conflicts and gracefully handling 100–300+ categories.
- **Responsive Header Right Actions:** On mobile/tablet (< 1024px):
  - When anonymous: displays Search (`#header-search-btn`) and About (`#header-about-btn`). Tapping About navigates directly to the About page without taking up BottomNav tab space. Login is accessed via the 4th tab on BottomNav.
  - When authenticated: displays ONLY the Search button (`#header-search-btn`). Profile, My Stores, Admin, About, and Logout are consolidated inside the Mobile Account Sheet.
- **Single Account Entry Point on Mobile:** On mobile/tablet (`< 1024px`), user account management is cleanly centralized in the Bottom Navigation's 4th tab ("Tài Khoản" / "Đăng Nhập").
- **Search Scope Accuracy:** In adherence to backend database realities, `StoreRepository.java` queries `name`, `addressLine`, and `landmarkNote`. The UI search input accurately states `"Tìm tên quán ăn, địa chỉ, khu vực..."` and avoids misleading claims regarding dish-level keyword search.
- **Above-The-Fold Discovery:** By hiding the bulky 200px+ controls (search input and horizontal chip scroller) on mobile Explore, store cards are pulled up into the immediate viewport, dramatically reducing cognitive load and scrolling friction.

---

### 9.3 Component Design & Implementation

#### 1. `SearchFilterModal.jsx` (`frontend/src/components/modals/SearchFilterModal.jsx`)
- **Portal Rendering:** Renders into `document.body` via React `createPortal`.
- **View Hierarchy:** Manages `currentView` (`'main'` vs `'categoryPicker'`) within a single dialog container:
  - `'main'`: Header with close button, search input, quick toggles, single category summary row, and Apply/Reset footer.
  - `'categoryPicker'`: Header with Back/Done actions, category search input, count badge, clear action, primary scrollable category list, and Done footer.
- **Accessibility:**
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby="search-modal-title"`.
  - Focus trap (`keydown` Tab cycling between first and last focusable elements).
  - Dismissible via Escape key (closes picker first, then modal).
  - Browser History integration: pushes a popstate dummy history item; pressing Android/browser Back navigates from picker back to main, or closes modal.
  - Body scroll lock (`document.body.style.overflow = 'hidden'`) with guaranteed cleanup on unmount.
  - Mobile safe area insets: `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`.

#### 2. Redesigned Category Selector & Dedicated Picker
- Designed specifically to scale from 8 to 300+ categories:
  - **Single Row Summary:** Main screen displays `Danh Mục Món Ăn — Tất cả danh mục / N danh mục đã chọn >` with up to 2 preview badges.
  - **Instant Accent-Insensitive Filter:** Category search input strips Vietnamese diacritics (e.g. typing "pho" matches "Phở").
  - **Curated Suggestions:** Before typing, renders selected items and up to 12 initial category suggestions instead of dumping 300 items at once.
  - **Selection Indicator:** Displays `#category-selected-count-badge` showing `(N đã chọn)` with a one-click `#category-clear-selection-btn`.
  - **Zero Nested Scrolling:** Category results occupy the primary vertical scroll container of the Dedicated Category Picker subview.
  - **Empty State:** High-contrast alert when the category query yields no results, with a reset query button.

#### 3. Draft / Apply State Management
- **Draft Isolation:** Changes to search text, open-now, near-me, and categories inside the modal are held exclusively in local React state (`draftQuery`, `draftCategories`, `draftOpenNow`, `draftNearMe`). The parent Explore view does NOT re-query or re-render during draft editing.
- **Commit on Apply:** Clicking `#search-apply-btn` passes committed parameters `(committedQuery, committedFilters)` to the parent handlers, which:
  - Updates `searchQuery` and `publicFilters` synchronously.
  - Resets pagination `page` to `0`.
  - Closes the modal.
  - Triggers exactly ONE network fetch with the consolidated filter state.
- **Discard on Cancel/Back/Escape:** Closing the modal without clicking Apply discards all draft modifications, restoring applied filters pristine.
- **Individual Badge Dismiss:** Users on the Explore page can click the `✕` on individual applied filter badges (`#applied-query-badge`, `#applied-category-badge`) to quickly clear a filter without opening the modal.

---

### 9.4 Files Changed & Created

| File | Change Type | Description |
| :--- | :--- | :--- |
| [`frontend/src/components/modals/SearchFilterModal.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/components/modals/SearchFilterModal.jsx) | **Created** | Dedicated Neo-Brutalist Search & Filter modal with draft/apply state, scalable category selector, and full A11y. |
| [`frontend/src/layouts/Header.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/layouts/Header.jsx) | **Modified** | Replaced mobile profile dropdown with `#header-search-btn` (`lg:hidden`, >= 44×44px, `aria-label="Tìm kiếm quán ăn"`). Wrapped desktop avatar menu in `hidden lg:block`. Added missing `Info` icon import. |
| [`frontend/src/pages/Explore/ExploreSection.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/pages/Explore/ExploreSection.jsx) | **Modified** | Simplified mobile Explore by hiding search bar & category chips (`hidden lg:flex`, `hidden lg:block`). Added mobile "Bộ Lọc & Tìm Kiếm" button and applied filter summary badges. Refactored internal state to derive directly from `publicFilters` props. Removed redundant bottom sheet portal. |
| [`frontend/src/layouts/BottomNav.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/layouts/BottomNav.jsx) | **Modified** | Added unambiguous IDs `#mobile-account-sheet` and `#mobile-account-sheet-close-btn` for testing reliability. |
| [`frontend/src/App.jsx`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/src/App.jsx) | **Modified** | Wired `SearchFilterModal` into global app root; connected `onOpenSearch` callback between `Header`, `ExploreSection`, and `SearchFilterModal`. |
| [`frontend/e2e/phase4b-1-refinement.spec.js`](file:///d:/My_Workspace/Java_Code/CanGiuocFoodTour/CanGiuocFoodTour/frontend/e2e/phase4b-1-refinement.spec.js) | **Created** | 17 comprehensive E2E tests validating UX Decisions A, B, C, synthetic 150+ category scaling, draft/apply lifecycle, keyboard reachability, and zero horizontal overflow across 9 viewports. |

---

### 9.5 Verification & Quality Gates

#### 1. Automated Test Suites

| Test Suite | Scope | Result | Execution Time |
| :--- | :--- | :--- | :--- |
| **Frontend Lint** (`npm run lint`) | Oxlint across 105 files | **PASS (0 warnings, 0 errors)** | 69ms |
| **Frontend Unit/Contract Tests** (`npm run test`) | Node test runner contract specs | **PASS (38 passed, 0 failed)** | 1075ms |
| **Production Build** (`npm run build`) | Vite build + artifact verification | **PASS** | 2.1s |
| **Phase 4B-1 UX Refinement E2E** (`phase4b-1-refinement.spec.js`) | 17 focused UX refinement tests | **PASS (17 passed, 0 failed)** | 31.9s |
| **Phase 4B-1 Navigation Regression E2E** (`phase4b-1-navigation.spec.js`) | 16 original shell navigation tests | **PASS (16 passed, 0 failed)** | 28.6s |

#### 2. Detailed UX Refinement Test Coverage (`phase4b-1-refinement.spec.js`)

1. **UX-A:** Header quick search button `#header-search-btn` is visible and clickable on mobile (`390px`) and tablet (`768px`) with >= 44×44px touch target.
2. **UX-A:** Authenticated mobile user sees Header Search and NO duplicate Profile Dropdown; Account Sheet remains fully functional in BottomNav.
3. **UX-A:** Anonymous visitor can reach AuthModal via "Tài Khoản" tab in BottomNav.
4. **UX-B:** Mobile Explore hides the bulky search bar and horizontal category chips, rendering food stall cards higher above the fold.
5. **UX-B:** Quick filter buttons (Gần Tôi, Đang Mở Cửa) remain accessible on mobile Explore.
6. **UX-C:** Search modal opens with focus, displays search input, quick toggles, scalable category selector, and clear/apply buttons.
7. **UX-C:** Scalable Category Selector handles 150+ synthetic categories with instant search filtering, multi-select, and clear selection.
8. **UX-C:** Empty state renders when category search query has no match.
9. **UX-C:** Draft / Apply Model: modifying drafts does NOT mutate applied filters until `#search-apply-btn` is clicked.
10. **UX-C:** Draft / Cancel Model: closing via `#search-modal-cancel-btn` or Back button discards unapplied drafts.
11. **UX-C:** Applied filter badges display on Explore with individual `✕` clear buttons that update state and trigger refetch.
12. **UX-C:** Applied filters persist when navigating between tabs (Explore ↔ Vòng Xoay ↔ Quán Đã Lưu).
13. **UX-C:** Search modal is dismissible via the Escape key.
14. **UX-C:** Search modal locks background body scroll and restores body scroll on close.
15. **UX-DESKTOP:** Desktop baseline (>= 1024px) retains full Phase 3 Header navigation, search bar, select dropdown, and category chips with zero visual regressions.
16. **UX-A11Y:** Safe area insets and modal dialog focus trap are fully compliant.
17. **OVERFLOW:** 9-viewport comprehensive zero-horizontal-overflow sweep (`320px` to `1440px`).

---

### 9.6 Screenshot Evidence Index

The following screenshots have been generated and archived in `frontend/e2e/screenshots/phase-4b1-refinement/`:

| Screenshot Path | Viewport | Visual Validation |
| :--- | :--- | :--- |
| `frontend/e2e/screenshots/phase-4b1-refinement/main-search-filter-view-390px.png` | `390×844` | Main Search & Filter view with single category row (`Danh mục món ăn — Tất cả danh mục >`), quick toggles, and search input. |
| `frontend/e2e/screenshots/phase-4b1-refinement/scalable-category-picker-subview.png` | `390×844` | Dedicated Category Picker subview with Back/Done actions, instant search filter `"pho"`, and multi-select checklist (no nested scroll). |
| `frontend/e2e/screenshots/phase-4b1-refinement/anonymous-header-about-mobile.png` | `375×667` | Header rendering `#header-search-btn` and `#header-about-btn` on mobile; login handled via BottomNav 4th tab. |
| `frontend/e2e/screenshots/phase-4b1-refinement/authenticated-header-search-mobile.png` | `390×844` | Header rendering ONLY `#header-search-btn` on mobile when authenticated; account management via BottomNav Account Sheet. |
| `frontend/e2e/screenshots/phase-4b1-refinement/simplified-mobile-explore-390px.png` | `390×844` | Simplified Explore view: NO redundant search button, quick filter buttons (Gần Tôi, Đang Mở Cửa), and stalls visible early above fold. |
| `frontend/e2e/screenshots/phase-4b1-refinement/desktop-baseline-1440px.png` | `1440×900` | Full Desktop Phase 3 experience completely unchanged: search bar, native select, horizontal chips, and avatar dropdown. |

---

### 9.7 Desktop Regression Status

- **Header Desktop (>= 1024px):** Desktop navigation links (`Khám Phá`, `Vòng Xoay`, `Quán Đã Lưu`, `Về Chúng Tôi`), Login button (`#login-btn`), and User Avatar Pill Dropdown remain active and identical to Phase 3.
- **Explore Desktop (>= 1024px):** Desktop search bar with NativeSelect, sorting controls, and horizontal category chips remain visible and functional. The "+ Xem thêm" button opens `SearchFilterModal` for convenient deep category searching on large displays as well.
- **No Style Pollution:** All mobile adaptations are gated behind `lg:hidden` or `max-lg:` constraints.

---

### 9.8 Known Limitations & Recommendations

- **Backend Query Scope:** Current backend `StoreRepository.java` queries store `name`, `addressLine`, and `landmarkNote`. Dish-level search requires future database indexing or search engine integration (Elasticsearch / PostgreSQL Full Text) which is out of scope for Phase 4.
- **Ready for PO Sign-Off:** With Phase 4B-1 and its UX Refinement 100% verified, the codebase is in pristine state for Product Owner final review before progressing to Batch 4B-2.
