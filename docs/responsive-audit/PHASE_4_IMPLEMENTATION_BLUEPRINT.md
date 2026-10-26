# CG FoodTour — Phase 4: Implementation Blueprint & Execution Plan

> **Document ID:** `PHASE_4_IMPLEMENTATION_BLUEPRINT`
> **Status:** Completed & Ready for Review
> **Phase:** Phase 4 — Responsive Design & Mobile/Tablet Optimization
> **Current Milestone:** Phase 4A (Audit & Blueprint)
> **Next Milestone:** Phase 4B (Execution Batches 4B-1 to 4B-5 upon PO Approval)
> **Date:** October 25, 2026
> **Author:** Principal Frontend Engineer, Senior Responsive UI/UX Designer & QA Automation Engineer

---

## 1. Architectural Principles & Design System

The core design philosophy for Phase 4 is **Mobile-First Neo-Brutalist Adaptation**.
Rather than shrinking down the desktop layout or abandoning the distinct brand aesthetic, we adapt the Neo-Brutalist design language to feel native, tactile, and effortless on handheld touch devices.

### 1.1 Non-Negotiable Design Rules

1. **Zero Desktop Regression:**
   The desktop experience accepted in Phase 3 (`≥ 1024px`, especially `1280px` and `1440px`) must remain **100% intact**. All responsive adjustments must be strictly constrained via responsive Tailwind breakpoint modifiers (`<lg:`, `sm:`, `md:`) or viewport-scoped media queries.
2. **Neo-Brutalist Tactile Touch Targets:**
   - On desktop, shadows are `shadow-[3px_3px_0px_#000]` or `shadow-[4px_4px_0px_#000]`.
   - On mobile touch displays, shadows are scaled to `shadow-[2px_2px_0px_#000]` to avoid visual crowding while preserving high-contrast depth.
   - All interactive touch targets (buttons, tabs, inputs) must achieve a minimum dimension of **44 × 44px** (WCAG 2.2 Success Criterion 2.5.8), with **48 × 48px** preferred for primary actions.
3. **Hardware & OS Ergonomics:**
   - Support iOS dynamic safe area insets via `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`.
   - Prevent automatic iOS Safari viewport zoom by maintaining `font-size: 16px` (`text-base`) on all text input elements on mobile.
   - Guard against viewport height calculation bugs on mobile browsers (address bar expansion/contraction) using modern dynamic viewport units (`dvh` and `svh`).

---

## 2. Breakpoint Taxonomy

| Breakpoint Token | Width Range | Target Devices & Scenarios | Layout Behavior |
| :--- | :--- | :--- | :--- |
| **`xs`** | `< 375px` | iPhone SE (1st gen), ultra-compact Android | Single-column, iconified controls, compact text, bottom sheet modals |
| **`sm`** | `375px – 639px` | Standard smartphones (iPhone 12/13/14/15, Galaxy S) | Single-column, thumb-zone optimized, 4-tab BottomNav |
| **`md`** | `640px – 767px` | Large phones, phablets, phone landscape | 2-column cards, compact search bar, bottom sheet modals |
| **`tablet`** | `768px – 1023px` | iPad Mini, iPad 9.7", Android tablets (Portrait) | 2-column cards, condensed header (no desktop nav overflow), centered dialogs |
| **`lg`** | `1024px – 1279px` | iPad Pro (Landscape), small laptops (13") | Full desktop navigation active, 3-column cards, side drawer |
| **`xl`** | `≥ 1280px` | Standard & wide desktop displays | **Phase 3 Baseline: 100% Unchanged** |

---

## 3. Classification of Solutions

To ensure code maintainability, each defect from `PHASE_4_ISSUE_MATRIX.md` is addressed using the appropriate engineering tier:

### 3.1 CSS Responsive Fixes
*Pure utility-class adjustments without altering state or markup hierarchy.*
- Migrate Header navigation container from `hidden md:flex` to `hidden lg:flex`.
- Add `pb-[max(0.75rem,env(safe-area-inset-bottom))]` to `BottomNav.jsx` and full-height scroll views.
- Apply `text-base sm:text-sm` on input fields to prevent iOS auto-zoom.
- Scale down borders/shadows on ultra-compact devices (`border-2 shadow-[2px_2px_0px_#000]`).

### 3.2 Layout Adaptations
*Restructuring flex/grid hierarchies to maintain usability across screen sizes.*
- Refactor `Dialog.jsx` overlay to `items-start sm:items-center` with `max-h-[92dvh]` and `overflow-y-auto`.
- Convert `StoreDetailDrawer.jsx` sticky rating footer from rigid 3-column grid to responsive stacked/flexible layout.
- Introduce responsive User Card view for `AdminSection.jsx` to replace unyielding `min-w-[860px]` table on mobile.

### 3.3 Mobile-Specific Interaction Changes
*Custom interactions that elevate handheld user experience.*
- Consolidate `BottomNav.jsx` into 4 primary consumer tabs (`Khám Phá`, `Vòng Xoay`, `Đã Lưu`, `Tài Khoản`), with secondary destinations (`Quán Tôi`, `Admin`, `Về Chúng Tôi`) accessible via an intuitive Account Sheet.
- Header Login button on `< 360px` collapses to a high-contrast icon button (`<LogIn />`) with `aria-label`.
- Auto-initialize Admin Stores view mode to `'cards'` when `window.innerWidth < 768px`.

### 3.4 Accessibility (A11y) & Performance Improvements
- Enforce 44×44px minimum tap target sizes on all bottom navigation items and floating buttons.
- Implement hardware-accelerated CSS transforms (`translate3d`) for drawer slide animations.
- Prevent background body scrolling when mobile drawer or modal is active (`overflow-hidden` on body).

---

## 4. Phased Implementation Roadmap (Phase 4B)

Phase 4B execution will proceed through **5 strictly sequential batches**.
Each batch must pass automated regression testing before proceeding to the next.

```
┌────────────────────────────────────────────────────────┐
│ Batch 4B-1: Global Navigation & Mobile Shell           │
│ (Header.jsx, BottomNav.jsx, Safe Area Insets)          │
└──────────────────────────┬─────────────────────────────┘
                           │ PASS
┌──────────────────────────▼─────────────────────────────┐
│ Batch 4B-2: Modals, Drawers & Overlay Ergonomics       │
│ (Dialog.jsx, AuthModal.jsx, StoreDetailDrawer.jsx)     │
└──────────────────────────┬─────────────────────────────┘
                           │ PASS
┌──────────────────────────▼─────────────────────────────┐
│ Batch 4B-3: Public Feature Views & Touch Ergonomics    │
│ (ExploreSection, CS2CaseOpener, About, SavedStores)    │
└──────────────────────────┬─────────────────────────────┘
                           │ PASS
┌──────────────────────────▼─────────────────────────────┐
│ Batch 4B-4: Admin Dashboard & Store Owner Portals      │
│ (AdminSection.jsx, MyStoresSection.jsx, Card Views)    │
└──────────────────────────┬─────────────────────────────┘
                           │ PASS
┌──────────────────────────▼─────────────────────────────┐
│ Batch 4B-5: Automated Cross-Device QA & Final Baseline │
│ (Full Playwright 8-Viewport Matrix, Visual Baseline)   │
└────────────────────────────────────────────────────────┘
```

---

### Batch 4B-1: Global Navigation & Mobile Shell

#### Target Components
- `frontend/src/layouts/Header.jsx`
- `frontend/src/layouts/BottomNav.jsx`
- `frontend/src/index.css`

#### Scope of Work
1. **Header Tablet Breakpoint Fix (`RESP-NAV-001`):**
   - Shift desktop navigation links from `hidden md:flex` to `hidden lg:flex`.
   - On screens `< 1024px`, the header renders only: Brand Logo (left) + Search trigger / Login / User Avatar (right).
   - Ensure the rightmost action elements (`#login-btn` or User Profile trigger) maintain `shrink-0` and never overflow the 768px boundary.
2. **Header 320px Overflow Fix (`RESP-NAV-002`):**
   - On screens `< 360px`, collapse the `"ĐĂNG NHẬP"` text button into an icon button (`<LogIn className="w-4 h-4" />`) with full accessible label.
   - Reduce logo badge padding on ultra-compact screens.
3. **Bottom Navigation Consolidation (`RESP-NAV-003`):**
   - Refactor `BottomNav.jsx` to render exactly **4 primary tabs**:
     1. `Khám Phá` (`Compass`)
     2. `Vòng Xoay` (`Dices`)
     3. `Đã Lưu` (`Bookmark`)
     4. `Tài Khoản` (`User` / `LogIn`)
   - Tapping `Tài Khoản` when logged out opens `AuthModal`. When logged in, it opens a clean Neo-Brutalist mobile quick-menu containing:
     - User Profile info
     - `Quán của tôi` (if `STORE_OWNER`)
     - `Quản trị hệ thống` (if `ADMIN`)
     - `Về chúng tôi`
     - `Đăng xuất`
   - Touch targets on all devices (320px to 430px) expand to ≥ 70px width and ≥ 48px height.
4. **iOS Safe Area Inset Support (`RESP-NAV-004`):**
   - Add safe-area padding: `pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]`.
   - Ensure main container padding accounts for the bottom bar height (`pb-20 sm:pb-24 lg:pb-8`).
5. **Phase 4B-1 UX Refinement (UX Decisions A, B, C):**
   - **UX-A (Header Quick Search):** Replaced duplicate Profile Dropdown on mobile/tablet (`< 1024px`) with a dedicated Header Quick Search button (`#header-search-btn`, ≥ 44×44px, `aria-label="Tìm kiếm quán ăn"`). BottomNav Account Sheet serves as the single source for mobile account management.
   - **UX-B (Simplified Explore):** Simplified Explore layout on `< 1024px` by moving the bulky search bar and horizontal category chips into the dedicated Search/Filter modal, bringing store cards above the fold while retaining quick filters (Gần Tôi, Đang Mở Cửa) and applied filter summary badges.
   - **UX-C (Dedicated Search & Scalable Category Selector):** Created `SearchFilterModal.jsx` with a Draft/Apply lifecycle model and a scalable, searchable, multi-select category selector capable of handling 100–300+ categories without horizontal chip clutter.

#### Acceptance Criteria
- [ ] On `768×1024` (iPad portrait), the Login button is 100% visible, fully inside the viewport, and Playwright `#login-btn` click succeeds without error.
- [ ] On `320×568`, the header fits within 320px with 0px horizontal overflow (`document.documentElement.scrollWidth === 320`).
- [ ] On `320×568`, each bottom navigation tab button is at least 44px wide and 44px high.
- [ ] No regression on Desktop (`1280px` & `1440px`): Desktop navigation remains visible, aligned, and identical to Phase 3.

---

### Batch 4B-2: Modals, Drawers & Overlay Ergonomics

#### Target Components
- `frontend/src/components/common/Dialog.jsx`
- `frontend/src/components/auth/AuthModal.jsx`
- `frontend/src/components/explore/StoreDetailDrawer.jsx`
- `frontend/src/components/common/ConfirmActionModal.jsx`

#### Scope of Work
1. **Dialog Vertical Off-screen Defect Fix (`RESP-MODAL-001`):**
   - In `Dialog.jsx`, replace `items-center` with `items-start sm:items-center`.
   - Set outer wrapper to `overflow-y-auto p-3 sm:p-4`.
   - Set dialog container to `my-auto sm:my-8 max-h-[92dvh] flex flex-col`.
   - Make the dialog header sticky (`sticky top-0 bg-white border-b-2 border-black z-10`) so the Close "X" button is permanently accessible regardless of scroll position.
2. **iOS Input Auto-Zoom Prevention (`RESP-MODAL-002`):**
   - Update input styling across modal forms to `text-base sm:text-sm` (16px on mobile, 14px on desktop).
3. **StoreDetailDrawer Floating Badge Fix (`RESP-DRAWER-001`):**
   - On `< 640px`, change banner zoom badge text from `"BẤM ĐỂ PHÓNG TO ẢNH BANNER"` to `"Phóng to"` with `<Maximize2 className="w-3.5 h-3.5" />`.
   - Prevent collision with circular share/close action buttons.
4. **StoreDetailDrawer Sticky Rating Footer Truncation Fix (`RESP-DRAWER-002`):**
   - Refactor rating button layout: On `< 375px`, stack emoji icon above text (`flex-col gap-0.5 py-1 text-xs`), preventing truncation of `"Bình thường"`.

#### Acceptance Criteria
- [ ] On `320×568`, opening the Registration modal renders the Close "X" button within the visible viewport bounds (`bounding_box.y >= 0`).
- [ ] Tapping any form input on mobile does not trigger iOS viewport scale changes.
- [ ] In `StoreDetailDrawer` on `320×568`, the zoom pill and circular action buttons do not overlap.
- [ ] In `StoreDetailDrawer` on `320×568`, all three rating buttons display full text without ellipsis clipping.

---

### Batch 4B-3: Public Feature Views & Touch Ergonomics

#### Target Components
- `frontend/src/components/explore/ExploreSection.jsx`
- `frontend/src/components/case-opener/CS2CaseOpener.jsx`
- `frontend/src/components/saved/SavedStoresSection.jsx`
- `frontend/src/components/about/AboutSection.jsx`

#### Scope of Work
1. **CS2 Case Opener Mobile Header Controls (`RESP-SPIN-001`):**
   - In `CS2CaseOpener.jsx`, update the top control bar on `< 375px` to use compact icon + state: `<Volume2 /> Bật/Tắt` and `<Store /> 10 quán`.
   - Ensure the roulette container maintains `overflow-hidden` with no horizontal document bleed.
2. **Explore Section Sticky Filters Refinement:**
   - Optimize sticky search bar top offset on mobile (`top-[60px]`).
   - Add subtle fade gradients on horizontal category chip scroll boundaries to indicate swipeability.
   - Ensure category chips have active touch feedback states (`active:translate-y-0.5`).
3. **About Section Mobile Polish:**
   - Ensure card margins and internal padding scale smoothly down to `p-4` on `< 375px`.

#### Acceptance Criteria
- [ ] CS2 Case Opener top buttons display complete, untruncated text on `320×568`.
- [ ] Explore section category chips swipe smoothly on touch screens with zero page-level horizontal overflow.
- [ ] About section renders cleanly with no text clipping across all 8 viewports.

---

### Batch 4B-4: Admin Dashboard & Store Owner Portals

#### Target Components
- `frontend/src/components/admin/AdminSection.jsx`
- `frontend/src/components/owner/MyStoresSection.jsx`
- `frontend/src/components/owner/DishManagementModal.jsx`

#### Scope of Work
1. **Admin Users Tab Mobile Card View (`RESP-ADMIN-001`):**
   - Develop a responsive stacked Card component for user accounts in `AdminSection.jsx`.
   - On screens `< 768px`, render the Card view by default (showing avatar, name, email, role badge, status badge, and thumb-friendly action buttons).
   - On screens `≥ 768px`, preserve the existing desktop table layout.
2. **Admin Stores Tab Auto-Card Mode (`RESP-ADMIN-002`):**
   - Initialize `storeViewMode` dynamically: `'cards'` if `window.innerWidth < 768`, otherwise `'table'`.
   - Keep manual toggle button accessible so administrators can switch modes if desired.
3. **Store & Dish Modal Forms Sticky Action Footers (`RESP-FORM-001`):**
   - In `MyStoresSection.jsx` and dish management modals, pin form action buttons (Save / Cancel) in a sticky footer (`sticky bottom-0 bg-gray-50 border-t-2 border-black p-3 flex gap-2 z-10`).
   - Enables immediate saving without having to scroll to the end of lengthy forms.

#### Acceptance Criteria
- [ ] On mobile viewports (320px - 430px), Admin Users tab renders cards without horizontal table scrollbars.
- [ ] Admin Stores tab opens in Card mode by default on mobile and tablet portrait.
- [ ] Store/Dish edit modals on mobile keep action buttons permanently accessible in a sticky footer.

---

### Batch 4B-5: Automated Cross-Device Regression Testing & Final QA

#### Scope of Work
1. **Automated Playwright Responsive Test Suite:**
   - Formalize `frontend/e2e/responsive-regression.spec.js` covering all 8 mandatory viewports:
     - `320×568`, `375×667`, `390×844`, `430×932`, `768×1024`, `1024×768`, `1280×800`, `1440×900`.
   - Automated assertions:
     - `document.documentElement.scrollWidth === window.innerWidth` (Zero horizontal overflow).
     - `#login-btn` and user avatar are inside viewport bounds and clickable on all screens.
     - Modal Close buttons have `bounding_box.y >= 0`.
     - Touch targets for all navigation elements have `width >= 44` and `height >= 44`.
2. **Full Visual Comparison & Baseline Archival:**
   - Capture post-implementation screenshots for all 8 viewports and compare against Phase 4A audit baseline screenshots in `frontend/e2e/screenshots/phase-4a-audit/`.
   - Verify that Desktop (1280px and 1440px) visual diff is **0%** (zero regression).

#### Acceptance Criteria
- [ ] 100% of automated Playwright responsive regression tests PASS.
- [ ] Zero horizontal overflow reported on any of the 8 viewports.
- [ ] Product Owner formal sign-off on Phase 4 deliverables.

---

## 5. Risk Assessment & Rollback Strategy

| Risk Scenario | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Desktop Visual Regression** | Low | High | Strict usage of responsive modifiers (`<lg:`, `sm:`, `md:`); desktop styles remain untouched; automated visual diff checks. |
| **Tablet Transition Clashing (768px - 1023px)** | Medium | High | Rigorously tested at 768px, 800px, 900px, and 1024px to ensure seamless handoff between mobile shell and desktop navigation. |
| **iOS Virtual Keyboard Layout Breakage** | Medium | Medium | Use modern `dvh` units and `items-start` positioning so active input fields remain visible above virtual keyboard. |
| **Git Working Tree Disruption** | Very Low | Low | Work structured in atomic, independent batches. Each batch is verified before any git checkpoint. |

---

## 6. Pre-Implementation Review Checklist

Before starting implementation in **Phase 4B**:

- [x] Full source code inspection completed.
- [x] Automated Playwright visual audit completed across all 8 viewports.
- [x] 64 audit screenshots captured and indexed.
- [x] Defect matrix documented with root-cause hypotheses and fixes (`PHASE_4_ISSUE_MATRIX.md`).
- [x] Technical blueprint and batch roadmap created (`PHASE_4_IMPLEMENTATION_BLUEPRINT.md`).
- [x] Zero application source code modified during Phase 4A.
- [ ] **Product Owner Formal Acceptance of Phase 4A Deliverables.**
