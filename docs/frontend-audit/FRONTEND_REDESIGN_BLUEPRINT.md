# CG FoodTour — Frontend Audit & Redesign Blueprint

> Loại tài liệu: Audit và kế hoạch triển khai, không phải implementation  
> Ngày kiểm định: 23/10/2026  
> Phạm vi: `frontend/` và các điểm tích hợp giao diện có thể quan sát được  
> Chuẩn mục tiêu: WCAG 2.2 AA, responsive từ 320 px, production UI không chứa công cụ phát triển  
> Trạng thái bằng chứng: **Verified by code**, **Verified by runtime**, **Verified by test/build**, hoặc **Needs verification**

---

# PART I – EXECUTIVE ASSESSMENT

## 1. Executive summary

Frontend hiện có một cá tính thị giác rõ: nền kem, viền đen, màu đỏ chủ đạo, bóng đổ cứng và typography đậm theo hướng neo-brutalist. Các luồng nghiệp vụ chính đã khá đầy đủ, code splitting đã được áp dụng cho những trang nặng và build/lint/test hiện đều vượt qua. Đây là nền tảng đáng giữ lại.

Tuy nhiên, sản phẩm **chưa đạt chuẩn phát hành thương mại công khai ở tầng Frontend**. Nguyên nhân không phải do thiếu tính năng, mà do chất lượng trải nghiệm không đồng đều: giao diện 320 px bị cắt nội dung; bottom navigation che nội dung và có touch target quá nhỏ; nhiều form không có label lập trình được; dropdown, sheet và một số modal thiếu mô hình bàn phím/focus; màu thương hiệu đang được dùng cho chữ hoặc nền chữ trắng với tương phản không đạt AA; công cụ nhập token OAuth và tọa độ GPS giả lập còn xuất hiện trong UI người dùng; trang admin chưa có mô hình mobile phù hợp; route không tồn tại bị hiển thị như trang Khám phá thay vì 404.

Kết luận chiến lược: **không cần viết lại toàn bộ Frontend**. Cần evolutionary redesign theo thứ tự: bảo vệ logic hiện có → dọn UI production → dựng design tokens và primitives truy cập được → sửa navigation/mobile → chuẩn hóa từng trang → accessibility/performance → regression QA.

## 2. Quality score

| Tiêu chí | Trọng số | Điểm /10 | Điểm quy đổi | Căn cứ |
|---|---:|---:|---:|---|
| Visual Design & Aesthetics | 15% | 6.6 | 0.99 | Có bản sắc rõ nhưng quá nhiều card/viền/bóng, chữ rất nhỏ và hierarchy thiếu ổn định. |
| Desktop Layout | 10% | 7.2 | 0.72 | 1280–1920 px nhìn chung cân đối; 1024 px bắt đầu chật, trang quản trị dày đặc. |
| Responsive & Mobile UX | 20% | 5.2 | 1.04 | 320 px bị cắt header; bottom nav che nội dung; 6–7 tab quá dày; admin/table chưa chuyển hình thái. |
| Usability & User Flows | 15% | 6.5 | 0.98 | Luồng chính tồn tại, feedback có nhưng global loading/toast và một số hành động/nhãn gây nhiễu. |
| Design System Consistency | 10% | 6.0 | 0.60 | Có helper CSS ban đầu nhưng màu, radius, shadow, font size, z-index vẫn hardcode nhiều. |
| Accessibility | 10% | 4.3 | 0.43 | Thiếu label association, ARIA state, keyboard model, contrast AA và mobile target size. |
| Component Architecture | 10% | 4.7 | 0.47 | `App.jsx`, `MyStoresSection`, `AdminSection` là monolith; logic, data và presentation trộn lẫn. |
| Performance & Production Readiness | 10% | 6.8 | 0.68 | Build/code split tốt; font và social SDK tải toàn cục, chưa đo CWV/Lighthouse thực tế. |
| **Tổng** | **100%** | **5.9/10** | **5.91** | **Below Standard — cần cải thiện đáng kể trước public release.** |

Điểm 5.9 phản ánh chất lượng production nghiêm ngặt, không phản ánh số lượng tính năng. Giao diện chạy được và có nét riêng không đủ để vượt qua các lỗi mobile, accessibility và production cleanup.

## 3. Strengths

- Nhận diện neo-brutalist có chủ đích và xuyên suốt: đỏ/đen/kem, viền dày, shadow offset.
- Luồng public quan trọng tương đối đầy đủ: khám phá, lưu quán, chi tiết quán, Google Maps, vòng quay chọn quán, deep link.
- Luồng tài khoản và chủ quán có nhiều trạng thái thực tế: xác thực email, reset password, profile, đăng/sửa quán, staged media, dirty-state confirmation.
- `StoreDetailDrawer` đã có `role="dialog"`, `aria-modal`, Escape và focus trap.
- `DevConsole` hiện đã được chặn bằng `import.meta.env.DEV && isAdmin()`.
- Admin, My Stores và CS2 được lazy-load; production build chia chunk hợp lý.
- Lint, unit/contract tests, production build và một tập E2E không làm biến đổi dữ liệu đều pass.
- Có fallback API error tiếng Việt và redaction utility cho dữ liệu nhạy cảm.

## 4. Weaknesses

- Accessibility chưa được coi là contract của shared component.
- Mobile đang là desktop co lại ở nhiều khu vực thay vì bố cục thích ứng theo ưu tiên nội dung.
- Design tokens chưa đủ sức kiểm soát màu, typography, spacing, shadow, radius và z-layer.
- Các feature component quá lớn, khó cô lập regression và khó kiểm thử.
- Một số công cụ dành cho developer/test xuất hiện trong production-facing UI.
- Trạng thái feedback dùng global overlay hoặc toast chưa semantic, dễ cản trở thao tác.
- Trang admin và bảng dữ liệu chưa có chiến lược mobile thực sự.
- Thiếu 404, footer/legal/support entry point và resilience khi ảnh từ xa lỗi.

## 5. Top 10 critical issues

1. **FE-P1-01:** Header và bottom navigation không dùng được ổn định ở 320 px; nội dung bị cắt/che.
2. **FE-P1-02:** Form thiếu quan hệ `label`–control và icon button thiếu accessible name.
3. **FE-P1-03:** Các cặp đỏ/trắng, đỏ/kem và xanh trạng thái không đạt WCAG AA cho text nhỏ.
4. **FE-P1-04:** Select, user menu, category sheet và nhiều modal thiếu keyboard/focus/ARIA contract.
5. **FE-P1-05:** Manual OAuth token và GPS giả lập là development/test controls đang hiện cho người dùng.
6. **FE-P1-06:** Admin mobile phụ thuộc table cuộn ngang và modal tự chế; chưa bảo đảm thao tác bằng touch/bàn phím.
7. **FE-P1-07:** Dashboard admin hiển thị một số tổng số từ mảng trang hiện tại, có nguy cơ tạo số liệu sai.
8. **FE-P1-08:** Route không tồn tại âm thầm render Explore, tạo trải nghiệm sai và canonical metadata không đúng.
9. **FE-P1-09:** Ảnh quán lỗi không có fallback runtime nhất quán, làm card trông hỏng.
10. **FE-P2-01:** Monolith component và prop plumbing làm tăng mạnh rủi ro regression khi redesign.

Không phát hiện P0 đã xác minh trong phạm vi audit này. Manual token UI là rủi ro P1 nghiêm trọng, nhưng chưa có bằng chứng ứng dụng tự làm lộ token của người khác hoặc server secret nên không nâng thành P0.

## 6. Production readiness verdict

**Verdict: HOLD đối với public production; có thể dùng closed beta có kiểm soát sau khi hoàn thành Phase 1 và các P1 thuộc navigation/accessibility.**

Các điều kiện tối thiểu để bỏ HOLD:

- Không còn clipping/overlay và target dưới 44 × 44 px ở navigation 320–430 px.
- Không có manual token/GPS test control trong production UI.
- Form chính, menu và modal dùng được bằng bàn phím, có accessible name/focus restore.
- Tất cả cặp màu text/action đạt WCAG 2.2 AA.
- Admin critical actions có layout mobile hoặc policy “desktop required” được xác nhận và chặn rõ ràng.
- Có 404 thực, fallback ảnh, production build và regression suite pass.

## 7. Audit limitations

- Đã kiểm tra runtime public tại 1920×1080, 1440×900, 1366×768, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×667 và 320×568. Một số ảnh chụp đầu dùng origin `127.0.0.1` bị CORS local; kết luận dữ liệu được xác minh lại bằng `localhost`.
- Không đăng nhập bằng tài khoản thật và không tạo/sửa/xóa dữ liệu vì phạm vi cấm thao tác làm biến đổi dữ liệu. Các màn hình authenticated được audit bằng code; runtime sau đăng nhập được đánh dấu Needs verification.
- Chưa kiểm tra Safari/iOS, Chrome Android thật, virtual keyboard, NVDA, VoiceOver, high-contrast mode và zoom 200% bằng trình duyệt thật.
- Chưa chạy Lighthouse/WebPageTest nên không bịa số LCP, INP, CLS hay Core Web Vitals.
- Không xác minh được OAuth Google/Facebook trên domain HTTPS thật trong audit local.

---

# PART II – PROJECT INVENTORY

## 1. Framework and stack

| Hạng mục | Hiện trạng | Evidence |
|---|---|---|
| Framework | React 19.2.8 + Vite 8.2.4 | `frontend/package.json` |
| Routing | React Router DOM 7.18.2 nhưng view chính được chọn thủ công từ `location.pathname`/`activeTab` | `frontend/src/App.jsx:209-278`, `2036-2290` |
| Styling | Tailwind CSS 4.3.3 + CSS helper trong `index.css`; nhiều arbitrary values | `frontend/src/index.css`, JSX toàn dự án |
| Icons | Lucide React | `frontend/package.json` và imports |
| Maps | Leaflet/React Leaflet chỉ thấy trong `MapPicker` chưa được route sử dụng | `frontend/src/components/common/MapPicker.jsx` |
| State | React local state/context-by-props; không có external state store | `App.jsx`, feature components |
| Auth UI | Modal nhiều mode, access token trong memory, refresh cookie contract, Google/Facebook SDK | `AuthModal.jsx`, `App.jsx`, `index.html` |
| Data | `fetch` wrapper tại App và prop callbacks xuống feature | `App.jsx:600-750` |
| Font | Plus Jakarta Sans qua Google Fonts `@import` | `frontend/src/index.css:1` |
| Test | Vitest/Node contract tests + Playwright E2E | `frontend/package.json`, `frontend/e2e/`, `frontend/scripts/` |

## 2. Route and page inventory

| Route/surface | Authentication | Main component | Runtime status |
|---|---|---|---|
| `/`, `/explore` | Public | `ExploreSection` | Verified public |
| `/quan/:storeId/:slug?` | Public | Explore + `StoreDetailDrawer` | Verified by code; deep link behavior previously covered by project tests |
| `/saved` | Optional | `SavedStoresSection` | Verified anonymous; authenticated needs verification |
| `/cs2-spinner` | Public | `CS2CaseOpener` | Verified public |
| `/about` | Public | `AboutSection` | Verified public |
| `/profile` | Required | `ProfileSection` | Code verified; runtime authenticated not verified |
| `/my-stores` | Required | `MyStoresSection` + `MySubmissionsSection` | Code verified; runtime authenticated not verified |
| `/admin` | Admin | `AdminSection` | Code verified; runtime authenticated not verified |
| Auth modal | Public overlay | `AuthModal` modes login/register/forgot/verify/resend | Code + partial E2E focus verified |
| Unknown path | Public | Currently falls through to Explore | Runtime verified defect |
| `WidgetsSection` | No route | Demo/dead surface | Static verified |
| `MapPicker` | No route/import found | Unused modal-like map picker | Static verified |

## 3. Layout inventory

- Global shell: `App.jsx` with header, main, bottom navigation, global loading, toasts, auth/status/image/action modals and detail drawer.
- Public header: `frontend/src/layouts/Header.jsx`.
- Mobile bottom navigation: `frontend/src/layouts/BottomNav.jsx`.
- Admin fixed application shell: internal sidebar/header/content in `AdminSection.jsx`.
- Content containers: mostly `max-w-7xl`, page-specific grids and responsive stacks.

## 4. Important component inventory

| Nhóm | Components |
|---|---|
| Navigation | `Header`, `BottomNav`, admin sidebar, local tabs/subtabs |
| Discovery | `ExploreSection`, `StoreCard`, filter sheet, `SavedStoresSection` |
| Detail | `StoreDetailDrawer`, `ImageViewerModal`, food menu/rating/report controls |
| Auth/account | `AuthModal`, `AccountStatusModal`, `ProfileSection` |
| Owner | `MyStoresSection`, `MySubmissionsSection`, category/icon picker, maps guide, dish manager |
| Admin | dashboard, stores grid, user/category tables, moderation/user/category dialogs |
| Shared inputs | `CustomSelect`, raw inputs/buttons/checkboxes duplicated across pages |
| Feedback | global loading overlay, toast stack, skeleton helpers, empty states |
| Destructive actions | `ConfirmActionModal`, `StoreActionModal` |
| Development | `DevConsole`, OAuth manual-token details, simulated GPS inputs |

## 5. Forms inventory

- Login, register, resend verification, verify OTP/token, forgot password OTP/new password.
- Profile information, avatar staging and change password.
- Create/edit store three-step form, maps parsing, category picker, opening hours and media.
- Create/edit/delete dishes.
- Ratings and closed-store report.
- Admin reject/hide/recover reason, user role/status edit, category CRUD.
- Search/filter forms in Explore, Saved and Admin.

## 6. UI state inventory

| State | Current implementation | Assessment |
|---|---|---|
| Loading | Global full-screen overlay + local skeleton/spinners | Present but global overlay too disruptive; accessibility incomplete |
| Error | Vietnamese toast mapping + inline errors in some forms | Present but inconsistent announcement/focus |
| Empty | Explore/Saved/Admin sections have empty messages | Present; quality varies |
| Success | Toasts and flow transitions | Present; toast semantics missing |
| Disabled | Many buttons disable during submit | Present but visual/ARIA consistency incomplete |
| Offline/network | Generic API fallback | Partial; no durable retry/offline state |
| Image failure | Initial fallback source only | Incomplete: no consistent `onError` recovery |

## 7. Primary user flows

1. Discover/search/filter store → open detail → maps/share/save/rate/report.
2. Register → verify email → login → refresh → logout.
3. Forgot/reset password.
4. Google/Facebook login.
5. Edit profile/avatar/change password.
6. Create store → upload staged media → submit → track status.
7. Edit store/dishes → save or discard changes.
8. Admin review/approve/reject/hide/recover store.
9. Admin lock/unlock/update/delete user and manage category.
10. Use CS2 spinner to select a restaurant.

## 8. Styling and current design system

`index.css` defines font, four high-level colors, animations and helpers such as `.brutalist-card`, `.brutalist-btn-*`, `.brutalist-input`, `.brutalist-select`, badge and skeleton. Đây là seed của design system, chưa phải hệ thống hoàn chỉnh.

Static scan cho thấy màu `#ff3e3e` xuất hiện khoảng 272 lần, `#f7f6f2` 81 lần, `#111111` 60 lần; radius, shadow và z-index có nhiều arbitrary values. Có ít nhất 135 shadow offset 2 px cùng nhiều biến thể 3/4/6/8 px; `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` được trộn rộng rãi. Hai trang lớn dùng hàng chục cỡ chữ 8–11 px.

## 9. Skill application map

| Skill | Cách áp dụng thực tế | Nhóm audit |
|---|---|---|
| `redesign-existing-projects` | Audit trước, giữ route/logic/brand wins, chọn evolutionary redesign và có rollback/regression gates | Strategy, roadmap, handoff |
| `responsive-design` | Mobile-first, content-driven breakpoints, 44 px target, `100dvh`, safe area, reflow thay vì co nhỏ | Mobile/tablet, breakpoint spec |
| `checklist-design` | Đối chiếu accessibility, tokens, type, color, button, input, modal, drawer, toast, table, navigation và auth/media flows | Audit + QA checklist |
| `design-taste-frontend`, `-v1` | Kiểm tra hierarchy, over-card, state completeness, anti-slop và density | Visual/UX assessment |
| `high-end-visual-design` | Dùng làm quality bar cho composition, polish và perceived quality; không áp glass/animation máy móc | Visual gap analysis |
| `minimalist-ui` | Giảm nhiễu, ưu tiên CTA, bỏ thông tin kỹ thuật và card/border không cần thiết | Cleanup, page redesign |
| `industrial-brutalist-ui` | Xác nhận phong cách hiện tại phù hợp neo-brutalist; giữ hình học/bóng cứng nhưng sửa density/accessibility | Brand/design system |
| `vercel-react-best-practices` | Audit code splitting, global listeners, render state, third-party script/font và component boundaries | Architecture/performance |
| `brandkit` | Dùng nguyên tắc consistency/asset governance; không tạo brand board vì nhiệm vụ không yêu cầu sinh ảnh | Brand consistency |
| `full-output-enforcement` | Bảo đảm đủ 12 phần, issue có acceptance và không để placeholder | Document completeness |
| `gpt-taste` | Chỉ tham khảo hierarchy/copy; không dùng các chỉ dẫn ngẫu nhiên, GSAP hay AIDA không phù hợp sản phẩm địa phương | Limited use |
| `stitch-design-taste` | Không áp dụng workflow Stitch vì không có Stitch project/tool trong phạm vi | Not applicable |
| `image-to-code` | Không áp dụng vì audit dựa trên code/runtime, không tái dựng UI từ ảnh | Not applicable |
| `imagegen-frontend-web/mobile` | Không áp dụng vì user cấm implementation và không cần tạo asset mới | Not applicable |

---

# PART III – CURRENT UI AUDIT

## 1. Desktop assessment

### 1920×1080 và 1440×900

- Container khoảng `max-w-7xl` giúp nội dung không bị kéo quá rộng; grid Explore bốn cột rõ ràng.
- Hero, filter và cards có cùng ngôn ngữ hình học. Tuy nhiên card nào cũng có viền/bóng mạnh nên hierarchy cấp 1–3 cạnh tranh nhau.
- Store card chứa nhiều metadata cỡ nhỏ; tên, trạng thái, khoảng cách, category, address và action chen trong một bề mặt thấp.
- Admin dùng fixed shell phù hợp desktop nhưng density cao, trộn tiếng Việt/Anh và emoji với Lucide.
- About là trang có composition tốt nhất nhưng desktop/mobile duy trì bằng hai cây JSX riêng.

### 1366×768 và 1280×800

- Header vẫn dùng được nhưng vùng nội dung dọc giảm; global top padding và card shadow làm lượng thông tin above-the-fold thấp.
- Drawer/modal có nguy cơ chiếm hầu hết chiều cao ở 768 px; những modal inline dài cần footer sticky và scroll body tách biệt.
- CS2 có nhiều nhóm cấu hình trước khi tới kết quả; cần progressive disclosure.

### 1024×768

- Header desktop bắt đầu chật; số lượng nav/action gần ngưỡng overflow.
- `md` đang đồng thời quyết định nhiều thay đổi lớn, trong khi nội dung cần chuyển trạng thái ở các điểm khác nhau.
- Admin sidebar + bảng làm vùng content hẹp; horizontal table không phải giải pháp hoàn chỉnh cho tablet.

## 2. Tablet assessment

- 768×1024 kích hoạt cấu trúc desktop ở một số chỗ (`md`) nhưng chiều ngang chưa đủ cho mật độ text/action hiện tại.
- Bottom navigation/header switch đúng một breakpoint kỹ thuật thay vì theo độ rộng thực của content.
- Drawer chi tiết chuyển từ bottom sheet sang right drawer từ `sm`, quá sớm đối với tablet portrait nhỏ; cần rule theo content.
- Forms hai cột cần về một cột ở tablet portrait khi helper/error text dài.
- Admin cần compact sidebar/rail hoặc off-canvas hoàn chỉnh, không chỉ thu nhỏ bảng.

## 3. Mobile assessment

### 390–430 px

- Public shell nhìn chung nhận diện rõ, cards horizontal tiết kiệm chiều cao.
- Bottom nav sáu mục có label 9–10 px, thiếu `aria-current`, thiếu safe-area; fixed bar che CTA/contact ở About và content cuối trang.
- Category chips dùng horizontal scroll nhưng dấu hiệu còn nội dung ở bên phải không rõ.
- Store cards ép metadata và ellipsis quá mức; người dùng khó so sánh địa chỉ/trạng thái.
- CS2 kéo dài, nhiều group control và modal, cần rút gọn theo task chính.

### 320×568

- **Verified runtime:** nút đăng nhập ở Header bị cắt phía phải. `overflow-x-hidden` che triệu chứng nên document không báo horizontal overflow.
- Search placeholder và filter controls bị nén/wrap khó đọc.
- Bottom nav chiếm chiều ngang cho sáu mục và phủ lên vùng tương tác cuối trang.
- Text 8–10 px và icon target nhỏ khiến UI không đạt độ đọc/chạm thực tế.

### Zoom và virtual keyboard

- Static code cho thấy nhiều fixed overlay, fixed bottom nav và `h-screen`; có rủi ro khi zoom/keyboard mở.
- **Needs verification:** browser zoom 200%, iOS visual viewport và Android keyboard chưa được kiểm tra thực tế.

## 4. Visual design assessment

### Có giá trị cần giữ

- Primary red, cream canvas, black outline và hard shadow tạo recognition.
- Category icon, badges và illustrations có giọng điệu vui, địa phương, khác biệt dashboard SaaS mặc định.
- CTA chính nhìn rõ ở desktop.

### Khoảng cách tới high-end quality

- Mọi khối đều “nói lớn”: border 2–4 px, shadow offset và uppercase black weight lặp quá nhiều.
- Radius không có grammar; card, modal, chip, input thay đổi tùy file.
- Typography hierarchy bị đảo: metadata 8–10 px trong khi nhiều label uppercase/tracking mạnh.
- Màu semantic chưa được token hóa; cùng success/error có nhiều xanh/đỏ khác nhau.
- Hình ảnh lỗi phá vỡ perceived quality và không có skeleton aspect-ratio contract thống nhất.

## 5. UX assessment

- Navigation chính hiểu được ở desktop; mobile có quá nhiều destination ngang hàng.
- Search/filter có chức năng nhưng thiếu số kết quả rõ ràng và affordance cho horizontal category list.
- Deep link store là điểm mạnh, nhưng unknown path không có recovery.
- Auth đầy đủ nhưng nhãn kỹ thuật và manual token block khiến người dùng phổ thông mất niềm tin.
- Global loading overlay chặn toàn trang cho cả request cục bộ; feedback nên nằm gần hành động.
- Toast có copy nghiệp vụ nhưng không công bố tới assistive tech và close target không semantic.
- Owner flows mạnh về chức năng nhưng component quá dài và form dài gây cognitive load.
- Admin dashboard có nguy cơ hiển thị số liệu theo page slice, ảnh hưởng quyết định quản trị.

## 6. Accessibility assessment (WCAG 2.2 AA)

| Nhóm | Trạng thái | Evidence |
|---|---|---|
| Contrast | Fail verified | White/`#ff3e3e` ≈ 3.49:1; `#ff3e3e`/cream ≈ 3.23:1; success text pair ≈ 2.91:1 |
| Form labels | Fail static | 79 `<label>` nhưng không tìm thấy `htmlFor`; nhiều label là sibling thay vì wrapping |
| Accessible names | Partial/fail | Icon-only password/close/action buttons không đồng đều `aria-label` |
| Keyboard navigation | Partial | Detail drawer tốt; custom select, menu, cards và nhiều inline modal thiếu chuẩn |
| Focus management | Partial | Shared modal hook tồn tại nhưng chưa dùng xuyên suốt |
| ARIA state | Fail static | Không tìm thấy `aria-current`, `aria-pressed`, `aria-expanded`, `aria-controls` trong các navigation/filter chính |
| Semantic HTML | Partial | `div` clickable cho logo/card/image; nested interactions trong role button |
| Error announcement | Fail/partial | Toast/inline errors thiếu `role=alert/status`, `aria-live`, `aria-describedby` nhất quán |
| Reduced motion | Pass tested | E2E reduced-motion pass và CSS có điều chỉnh |
| Touch target | Fail runtime/static | Bottom nav và nhiều icon action dưới 44×44 px |
| Screen reader | Not verified | Chưa chạy NVDA/VoiceOver |
| Zoom 200% | Not verified | Chưa test browser thật |

## 7. Architecture assessment

- `App.jsx` dài khoảng 2,438 dòng, có khoảng 94 `useState`, 12 `useEffect`, hàng chục API calls và prop bag lớn.
- `MyStoresSection.jsx` khoảng 2,244 dòng; `AdminSection.jsx` khoảng 2,021; `CS2CaseOpener.jsx` khoảng 1,164; `AuthModal.jsx` khoảng 749.
- Data fetching, auth/session, routing, SSE, metadata, feature state, modal orchestration và presentation cùng nằm trong `App`.
- About duy trì riêng mobile/desktop tree; Saved tái tạo card thay vì shared variants; modal/dialog implementations bị phân mảnh.
- `BottomNav` đăng ký scroll listener phụ thuộc state và set state trên mỗi scroll; listener bị tái tạo thường xuyên.
- `MapPicker`, `WidgetsSection`, `CS2StoreCardCTA`, `MyDishesSection` không có usage route/import được xác minh; cần xác nhận trước khi xóa.

## 8. Performance assessment

Production build với biến môi trường audit hợp lệ:

| Artifact | Raw | Gzip |
|---|---:|---:|
| CSS | 79.89 kB | 13.09 kB |
| Main JS | 385.59 kB | 111.36 kB |
| Admin chunk | 78.38 kB | 14.64 kB |
| My Stores chunk | 76.43 kB | 13.96 kB |
| CS2 chunk | 36.84 kB | 8.21 kB |
| CategoryIcon chunk | 24.24 kB | 9.51 kB |

Đánh giá:

- Code splitting cho các feature nặng là tốt.
- Main gzip ~111 kB chưa phải blocker, nhưng cần bundle budget để tránh tăng dần.
- Google Font qua CSS `@import` tạo render-blocking/third-party dependency; nên self-host/subset.
- Google/Facebook SDK tải toàn cục từ `index.html`. Dự án từng ưu tiên ổn định social login, vì vậy **không tự ý lazy-load lại**; cần đo và xin xác nhận trước khi đổi chiến lược.
- Ảnh remote thiếu resilience/onError và policy kích thước; có nguy cơ CLS/blank/broken state.
- Chưa có số liệu CWV thực tế; mọi target dưới đây là acceptance target, không phải số đo hiện tại.

---

# PART IV – DEVELOPMENT UI CLEANUP

| Classification | Surface | File/location | Hiện trạng | Hành động đề xuất |
|---|---|---|---|---|
| **REMOVE** | Google ID Token JWT input | `AuthModal.jsx:246-266` | Người dùng có thể mở `<details>` và nhập token thô | Không render trong production-facing AuthModal; không xóa OAuth integration |
| **REMOVE** | Facebook Access Token input | `AuthModal.jsx:267-286` | Token kỹ thuật xuất hiện trong login UI | Loại khỏi UI production; nếu test cần, đặt ở harness riêng không build production |
| **REMOVE** | Simulated GPS coordinate inputs | `StoreDetailDrawer.jsx:364-390` | Test coordinates nằm trong report UI | Dùng geolocation thực; test injection chỉ qua E2E fixture/dev harness |
| **REPLACE** | “Security Gateway” | `AuthModal.jsx:138` | Nhãn kỹ thuật tiếng Anh không giúp người dùng | Đổi thành mô tả nghiệp vụ tiếng Việt, ví dụ “Đăng nhập an toàn” hoặc bỏ badge |
| **REPLACE** | Manual verification token field | `AuthModal.jsx` verify mode | Buộc người dùng hiểu UUID/token | Ưu tiên tự đọc link hoặc OTP; giữ recovery path thân thiện nếu backend yêu cầu |
| **REPLACE** | Raw enum/English admin copy | `AdminSection.jsx:424,523` và status labels | “Dashboard Overview”, “Needs Attention”, `APPROVED`… | Mapping sang tiếng Việt; enum nội bộ không đổi |
| **REPLACE** | Technical API errors | `App.jsx`, toast callers | Mapping đã có nhưng fallback vẫn cần audit | Luôn hiển thị hành động tiếp theo; log kỹ thuật ở telemetry, không UI |
| **RESTRICT** | DevConsole | `App.jsx:2391`, `DevConsole.jsx` | Đã DEV + admin gate | Giữ gate; production build test phải xác nhận không có label/payload/token tools |
| **RESTRICT** | API request/response logs and refresh control | `DevConsole.jsx` | Có giá trị debug, không có giá trị end-user | Chỉ dev; redaction bắt buộc và không persist token |
| **RESTRICT** | Widgets/demo screen | `pages/Widgets`, `CS2StoreCardCTA` | Không route, có dấu hiệu thử nghiệm | Xác nhận owner; chuyển story/demo hoặc xóa ở phase refactor |
| **RESTRICT** | Unused MapPicker | `components/common/MapPicker.jsx` | Overlay bản đồ gọi dịch vụ Photon trực tiếp, không route | Không đưa production route; xác nhận rồi xóa dependency nếu thật sự chết |
| **KEEP** | Trạng thái mở/đóng quán, moderation status | Store/admin UI | Có giá trị nghiệp vụ | Giữ nhưng dùng label/icon semantic, không dựa màu đơn thuần |
| **KEEP** | Google Maps public link đã sanitize | Store detail | Hữu ích cho chỉ đường | Giữ hostname policy và accessible link label |
| **KEEP** | Loading/error/success feedback | Toàn ứng dụng | Cần cho UX | Giữ logic, thay presentation bằng accessible local feedback |

Ẩn một control không phải là biện pháp bảo mật hoàn chỉnh. Phase 1 phải đồng thời xác minh token không đi vào production logs, analytics, DOM snapshot hoặc error reporting; authorization và redaction backend/frontend vẫn phải được giữ.

---

# PART V – DESIGN SYSTEM SPECIFICATION

## 1. Design direction

Giữ neo-brutalist làm DNA: black outline, offset shadow, cream canvas, red accent, icon minh họa vui. Giảm cường độ theo hierarchy: chỉ primary surfaces/CTA có shadow rõ; supporting surfaces dùng border mảnh hoặc không card. Không ghép thêm glassmorphism, gradient SaaS hoặc industrial tactical HUD.

## 2. Color tokens

| Vai trò | Hiện tại | Đề xuất | Quy tắc |
|---|---|---|---|
| Canvas | `#F7F6F2` | `--color-canvas: #F7F6F2` | Nền toàn trang |
| Surface | `#FFFFFF` | `--color-surface: #FFFFFF` | Card/input/dialog |
| Ink | `#111111` | `--color-text: #111111` | Body text |
| Muted text | nhiều neutral | `--color-text-muted: #525252` | Phải ≥4.5:1 trên canvas/surface |
| Brand red | `#FF3E3E` | `--color-brand: #FF3E3E` | Decorative, border, large graphic hoặc nền với text đen |
| Action red | chưa tách | `--color-action: #C92A2A` | Nền button với text trắng hoặc chữ link đỏ; verify ≥4.5:1 |
| Action hover | `#E11D48` rời rạc | `--color-action-hover: #A61E1E` | Không đổi meaning |
| Success | nhiều xanh | `--color-success-text: #087F5B`, `--color-success-bg: #E6FCF5` | Kèm icon/text |
| Warning | nhiều vàng/cam | `--color-warning-text: #92400E`, `--color-warning-bg: #FFF7D6` | Kèm icon/text |
| Danger | nhiều đỏ | `--color-danger-text: #B42318`, `--color-danger-bg: #FEF3F2` | Destructive only |
| Focus | chưa thống nhất | `--color-focus: #2563EB` | Ring 3 px + offset, nhìn rõ trên đỏ/đen/trắng |

Không hỗ trợ dark mode trong phase đầu nếu chưa có product requirement. Light-only nhất quán tốt hơn dark mode nửa vời.

## 3. Typography

- Font: giữ Plus Jakarta Sans nhưng self-host WOFF2, preload weight thực dùng, `font-display: swap`.
- Display: `clamp(2rem, 1.4rem + 2.4vw, 4rem)`, line-height 1.05, 800/900.
- H1: `clamp(1.75rem, 1.4rem + 1vw, 2.5rem)`, 1.15, 800.
- H2: `clamp(1.375rem, 1.2rem + .6vw, 1.875rem)`, 1.2, 800.
- H3: 1.125rem, 1.3, 750/800.
- Body large: 1rem/1.6; body: 0.875rem–1rem/1.55.
- Label: 0.8125rem/1.35, 700; không uppercase toàn bộ đoạn dài.
- Caption/meta: tối thiểu 0.75rem (12 px), 1.4. Không dùng 8–11 px cho thông tin cần đọc.
- Tracking uppercase chỉ dành cho eyebrow ngắn; không vượt `0.08em`.

## 4. Spacing and layout

- Primitive scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Component padding: compact 8/12; default 12/16; comfortable 16/24.
- Page gutter: 16 px narrow, 24 px mid, 32 px wide.
- Content max width: 1280 px; reading width: 680–760 px; form width: 560–720 px.
- Grid: 4 columns narrow, 8 mid, 12 wide; gap 12/16/24 tương ứng.

## 5. Radius, borders and shadows

- `radius-sm: 8px` input nhỏ; `radius-md: 12px` input/button; `radius-lg: 16px` card/dialog; `radius-pill: 9999px` chip/avatar.
- Không dùng full pill cho container/action dài không phải chip.
- Border: 2 px cho interactive/card chính; 1 px cho divider/supporting surface; 3 px chỉ brand emphasis.
- Shadow: `sm 2px 2px 0 #111`, `md 4px 4px 0 #111`, `lg 6px 6px 0 #111`; loại bỏ các offset 1.5/2.5/7/8/10 tùy tiện.
- Selected/pressed dùng translate 1–2 px + giảm shadow, không dựa màu duy nhất.

## 6. Breakpoints

| Token | Width | Ý nghĩa content |
|---|---:|---|
| `narrow` | 0–639 | Một cột, compact header, 4–5 primary nav destinations |
| `mid` | 640–899 | Tablet portrait/large mobile, two-column khi nội dung cho phép |
| `wide` | 900–1279 | Header desktop, compact sidebar/table decisions |
| `xwide` | ≥1280 | Full desktop grid and admin density |

Tailwind default có thể được giữ nếu component rules ánh xạ nhất quán; chỉ thêm custom breakpoint khi test content chứng minh cần. Container query dùng cho StoreCard/Admin panel nếu cùng component nằm ở main grid và drawer.

## 7. Component variants

- `Button`: primary, secondary, ghost, danger; size sm/md/lg; icon-only; loading; disabled.
- `Field`: text/email/password/date/textarea; label, hint, error, success; IDs tự sinh; `aria-describedby`.
- `Select`: native variant cho simple form; accessible listbox variant khi cần custom icon/search.
- `Card`: plain, outlined, elevated, interactive; không shadow tất cả.
- `Badge`: neutral/info/success/warning/danger; luôn có text/icon.
- `Dialog`: confirmation, form, destructive; shared focus trap, Escape, restore, scroll lock.
- `Sheet`: bottom trên narrow, side trên wide; safe area và sticky actions.
- `Toast`: status/error, `aria-live`, semantic close button; mobile placement không che nav.
- `DataList`: table wide, stacked card/definition list narrow.
- `EmptyState`, `InlineAlert`, `Skeleton`, `ImageWithFallback`, `Pagination` dùng chung.

## 8. Interaction and accessibility contract

- Mọi interactive target tối thiểu 44×44 CSS px trên touch.
- `:focus-visible` 3 px, contrast ≥3:1 và không bị shadow che.
- Buttons dùng `<button>`, navigation dùng `<a>/<NavLink>`, không dùng clickable `<div>` nếu không có lý do đặc biệt.
- Toggle phải có `aria-pressed`; current navigation có `aria-current="page"`; expandable control có `aria-expanded` + `aria-controls`.
- Dialog/sheet: label/description, focus initial hợp lý, trap, Escape, restore trigger, background inert.
- Error: text cụ thể, liên kết control qua `aria-describedby`, announce bằng live region; focus summary khi submit thất bại.
- Motion 150–220 ms, chỉ opacity/transform; tôn trọng `prefers-reduced-motion`.
- Layer tokens: base 0, sticky 20, header 30, nav 40, overlay 50, dialog 60, toast 70, lightbox 80; bỏ `9999/100000` tùy tiện.

---

# PART VI – PAGE-BY-PAGE REDESIGN

## 1. Global shell, `/`, routing and unknown route

**Current state:** `App.jsx` điều phối route, session, API, SSE, metadata, feature state và overlay. Header desktop đổi thành bottom navigation ở mobile; unknown route giữ URL sai nhưng render Explore.

**Problems:** shell quá nhiều trách nhiệm; 320 px cắt login action; bottom nav phủ content; global loading chặn toàn ứng dụng; toast thiếu semantics; không có 404/skip link/footer.

**Desktop redesign:** giữ header một hàng, giới hạn nhóm primary nav, profile menu semantic; thêm skip link; chỉ dùng page-level progress cho navigation và inline loading cho thao tác cục bộ; thêm footer public gọn.

**Tablet redesign:** chuyển sang compact header từ khi label/action không còn vừa, không chờ đúng `md`; overflow actions vào menu “Thêm”.

**Mobile redesign:** header hai vùng có `min-width:0`; brand link semantic; 4–5 bottom destinations tối đa; Saved/Profile/Admin phụ thuộc trạng thái được đưa vào “Tài khoản/Thêm”; safe-area padding; bar không auto-hide khi người dùng keyboard/screen reader điều hướng.

**Components/files:** `App.jsx`, `layouts/Header.jsx`, `layouts/BottomNav.jsx`, new `AppShell`, `RouteBoundary`, `NotFoundPage`, `PublicFooter`, `ToastRegion`.

**Expected UX:** navigation không biến mất/cắt; URL sai có đường hồi phục; feedback không chặn task đang làm.

**Acceptance criteria:** hoạt động tại 320–1920 px và zoom 200%; no overlap cuối trang; `aria-current`; unknown route trả trang 404 branded; auth/deep link không regression.

## 2. Explore — `/explore`

**Current state:** hero, search, near-me, open-now, category chips/sheet, grid/list desktop, horizontal cards mobile, load more và empty state.

**Problems:** hero “Bản đồ” không phản ánh view mặc định; search chỉ dựa placeholder; filter toggles thiếu state semantic; category scroller thiếu affordance; card mobile quá dày/tiny; filter sheet thiếu dialog contract.

**Desktop redesign:** title/description gắn nhiệm vụ tìm quán; filter bar chia search, quick filters, category; result count + clear filters; grid/list controls có accessible label và pressed state; giảm số border/shadow cạnh tranh.

**Tablet redesign:** search full row, filter group xuống row hai; grid 2–3 cột theo container; category sheet hoặc popover tùy available space.

**Mobile redesign:** search 44 px; quick filters ưu tiên “Gần tôi”, “Đang mở”; category mở bottom sheet; result summary/clear; cards một cột với title/address/status đọc được, không ép font dưới 12 px.

**Components/files:** `pages/Explore/ExploreSection.jsx`, `components/common/StoreCard.jsx`, shared `FilterBar`, `FilterSheet`, `ResultSummary`.

**Expected UX:** người dùng hiểu bộ lọc đang tác động đến đâu, biết có bao nhiêu kết quả và bỏ filter dễ dàng.

**Acceptance criteria:** filter state announced; Escape/trap/restore sheet; no clipping; empty state có “Xóa bộ lọc”; near-me permission/error rõ ràng.

## 3. Store detail — `/quan/:storeId/:slug?`

**Current state:** bottom sheet mobile/right drawer desktop với ảnh, Maps, menu, bookmark, share, rating và report; dialog semantics cơ bản đã tốt.

**Problems:** ảnh/food thumbnail dùng clickable div; GPS test controls xuất hiện; fixed save action cạnh tranh bottom nav; metadata dày; ảnh lỗi thiếu fallback.

**Desktop redesign:** giữ right drawer nhưng phân cấp hero → essential facts → primary actions → menu/reviews; sticky action vùng drawer; semantic image gallery buttons.

**Tablet redesign:** drawer rộng tối đa theo container; khi chiều ngang nhỏ chuyển full-height sheet; body scroll riêng, action footer cố định.

**Mobile redesign:** full-width bottom sheet hoặc route-like full screen; drag handle chỉ decorative; Maps/call/save/share target 44 px; bottom padding gồm action footer + safe area, không đụng app nav.

**Components/files:** `components/drawers/StoreDetailDrawer.jsx`, `ImageViewerModal.jsx`, new `StoreHero`, `StoreFacts`, `StoreActions`, `ImageWithFallback`.

**Expected UX:** thông tin quan trọng đọc nhanh, media/close/action sử dụng được bằng keyboard và touch.

**Acceptance criteria:** không có GPS giả lập production; all gallery actions semantic; focus trap/restore/Escape pass; URL canonical/deep link/back-forward giữ nguyên; Maps URL safety không đổi.

## 4. Saved stores — `/saved`

**Current state:** anonymous prompt; authenticated search, cards, empty state và load more.

**Problems:** card pattern trùng `StoreCard`; mobile footer nav che content; anonymous page có nhiều dead space; search label chưa chuẩn.

**Desktop redesign:** dùng shared StoreCard variant; compact header với count/search/sort; anonymous state liên kết trực tiếp login.

**Tablet redesign:** 2-column grid hoặc list theo container.

**Mobile redesign:** một cột, action save riêng; CTA anonymous nằm trong thumb zone; reserve bottom safe space.

**Components/files:** `components/SavedStoresSection.jsx`, `StoreCard.jsx`, shell spacing.

**Expected UX:** saved list nhất quán Explore và ít code trùng.

**Acceptance criteria:** same card API; no duplicate styling; accessible empty/login CTA; pagination/load-more feedback cục bộ.

## 5. CS2 spinner — `/cs2-spinner`

**Current state:** roulette 3D, sound, open-only, bốn selection modes, category filter và winner modal.

**Problems:** 1,164-line monolith; mobile quá dài; nhiều label 8–11 px; control cạnh tranh với primary spin; modal accessibility cần chuẩn hóa.

**Desktop redesign:** hai cột: wheel/result là primary, configuration là secondary; advanced modes trong disclosure; selected pool summary luôn thấy.

**Tablet redesign:** wheel trên, compact controls dưới; sticky “Quay” trong vùng feature, không che content.

**Mobile redesign:** một task tại một thời điểm; chọn mode → chọn phạm vi → quay; options ít dùng trong accordion/sheet; winner modal full-width accessible.

**Components/files:** `pages/CS2CaseOpener/CS2CaseOpener.jsx`, split `SpinnerStage`, `SpinnerConfig`, `SelectionMode`, `WinnerDialog`.

**Expected UX:** giảm cognitive load và scroll, vẫn giữ cá tính vui.

**Acceptance criteria:** all controls 44 px; sound state announced; no autoplay before gesture; reduced motion alternative; modal keyboard contract pass.

## 6. About — `/about`

**Current state:** hero, purpose, values, contact và CTA; mobile/desktop là hai cây JSX riêng.

**Problems:** duplication dễ drift; mobile CTA/contact bị nav che; thiếu team/trust/legal links/footer.

**Desktop redesign:** một semantic content tree với CSS reflow; giữ visual storytelling; thêm người chịu trách nhiệm/contact/support và footer legal.

**Tablet redesign:** values 2-column rồi stack theo content.

**Mobile redesign:** cùng content order, bỏ decorative duplication; CTA full-width; end padding đủ cho nav.

**Components/files:** `pages/About/AboutSection.jsx`, new `PublicFooter`.

**Expected UX:** câu chuyện đáng tin và maintainable hơn.

**Acceptance criteria:** một content source; no overlap; headings đúng cấp; contact link hoạt động; Privacy/Terms/Data deletion entry points tồn tại hoặc được product xác nhận trước public release.

## 7. Authentication surfaces — login/register/verify/forgot/reset

**Current state:** một modal nhiều mode, Google/Facebook SDK, OTP six-box, resend, reset password; focus hook đã áp một phần.

**Problems:** manual token controls; “Security Gateway”; label không gắn control; social control dùng overlay div; password icon thiếu name; OTP chưa có group/label/paste contract; modal 749 dòng.

**Desktop redesign:** modal 480–560 px; title/context rõ theo mode; social buttons thật; divider; field primitives; inline errors và local submit state.

**Tablet redesign:** giữ centered dialog với scroll body và sticky action khi cần.

**Mobile redesign:** full-screen auth sheet/page với keyboard-safe `100dvh`; primary submit trong flow, không fixed che field; OTP hỗ trợ paste/autofill `one-time-code`.

**Components/files:** `components/modals/AuthModal.jsx`, `hooks/useDialogFocus.js`, new `AuthShell`, `FormField`, `PasswordField`, `OtpField`, `SocialLoginButton`.

**Expected UX:** không còn thuật ngữ/token kỹ thuật, luồng dễ hiểu và dùng được với assistive tech.

**Acceptance criteria:** manual token UI absent production; labels/errors accessible; Google/Facebook click + disabled/loading hoạt động; Escape/focus restore; register→verify→login và reset flow regression pass.

## 8. Profile — `/profile`

**Current state:** avatar staged upload, thông tin cá nhân và đổi mật khẩu.

**Problems:** labels không associate; avatar edit phụ thuộc hover/icon; password toggle thiếu name; save state chưa thống nhất shared pattern.

**Desktop redesign:** content chia “Hồ sơ” và “Bảo mật” bằng tabs/sections rõ, form width giới hạn; save bar cục bộ.

**Tablet redesign:** single-column sections với navigation anchor/tabs scrollable.

**Mobile redesign:** avatar action luôn hiện và có text; inputs full width; password rules trước submit; buttons 44 px.

**Components/files:** `pages/Profile/ProfileSection.jsx`, shared field/upload/save status.

**Expected UX:** người dùng biết thay đổi nào chưa lưu, upload lỗi không làm mất avatar cũ.

**Acceptance criteria:** keyboard upload; file restrictions visible; cancel/save staged media đúng; change password revoke flow không regression; authenticated runtime verification required.

## 9. My Stores hub — `/my-stores`

**Current state:** tabs danh sách/submissions, create 3 bước, edit accordion, media staging, maps parser, category modal, dishes manager.

**Problems:** 2,244-line component; form dài, nhiều state; labels/modal accessibility không đồng đều; hierarchy giữa store status, edit và dishes dày đặc.

**Desktop redesign:** hub có overview + status filters; create/edit là route/subroute hoặc controlled workspace; three-step form có review; dishes là section/module riêng.

**Tablet redesign:** cards 1–2 cột; form một cột khi helper dài; sidebar stepper chuyển horizontal compact.

**Mobile redesign:** vertical stepper/progress; sticky save/continue không che keyboard; image uploader grid 2 cột; status/action menu tách destructive cuối.

**Components/files:** `pages/MyStores/MyStoresSection.jsx`, `MySubmissionsSection.jsx`, `StoreActionModal.jsx`, category picker; split hooks/modules.

**Expected UX:** chủ quán hiểu trạng thái và không mất draft/media; agent có thể sửa từng feature không ảnh hưởng cả trang.

**Acceptance criteria:** create/edit/discard/staged upload regression pass; step validation/focus error; all dialogs shared primitive; status transitions/copy giữ business rules.

## 10. Admin dashboard — `/admin` dashboard

**Current state:** fixed shell, metrics, needs-attention table, sidebar và pagination-related data.

**Problems:** mobile shell chưa hoàn chỉnh; counts approved/users được tính từ arrays hiện có; mixed English/emoji; table dày.

**Desktop redesign:** semantic metrics từ backend summary; needs-attention ưu tiên theo severity/time; consistent action bar; bỏ emoji decorative khỏi heading hoặc aria-hide.

**Tablet redesign:** collapsible rail/off-canvas có backdrop, trap và restore; cards 2 cột; priority list thay table nếu hẹp.

**Mobile redesign:** task queue dạng cards, metrics 2-column, mỗi card có one primary action + overflow; nếu product quyết định admin desktop-only phải hiển thị controlled blocking message, không render table hỏng.

**Components/files:** `pages/Admin/AdminSection.jsx`, App admin data loaders, backend summary contract only if approved separately.

**Expected UX:** admin ra quyết định dựa số đúng, thao tác không nhầm.

**Acceptance criteria:** summary totals không phụ thuộc current page; sidebar keyboard accessible; no horizontal page overflow; all critical actions reachable 320 px or explicit desktop-only policy.

## 11. Admin stores

**Current state:** filter/grid, approve/reject/hide/recover/edit/detail and pagination.

**Problems:** nhiều action ngang hàng; inline modals khác shared dialog; status raw/mixed; mobile density cao.

**Desktop redesign:** filter toolbar, status tabs, store row/card with primary review; secondary actions in menu; detail drawer reusable.

**Tablet/mobile redesign:** card list with status, owner, submitted date and primary review; filters in sheet; destructive/reason form in full-screen dialog on narrow.

**Files:** `AdminSection.jsx`, shared dialog/menu/filter/data-list.

**Acceptance criteria:** transition controls obey backend rules; reason required where applicable; focus and confirmation pass; pagination count correct.

## 12. Admin users

**Current state:** searchable table/tree with role/status/edit/lock/unlock/delete.

**Problems:** clickable cells/avatar div, horizontal table, action density, role/status internal labels.

**Desktop redesign:** data table with semantic row actions and explicit selection; dangerous delete visually separated; status/role translated.

**Tablet/mobile redesign:** stacked user cards/definition lists; one primary manage button opens accessible sheet; lock reason and unlock email outcome clear.

**Files:** `AdminSection.jsx`, shared `ResponsiveDataList`, `UserAdminDialog`.

**Acceptance criteria:** user row fully keyboard accessible; 44 px actions; role/status changes preserve revoke logic; delete warning lists consequences; admin/non-admin permissions regression pass.

## 13. Admin categories

**Current state:** category form/table with icons and CRUD.

**Problems:** duplicate modal/form patterns, table adaptation and labels incomplete.

**Desktop redesign:** compact table + dedicated create/edit dialog using field primitives.

**Tablet/mobile redesign:** cards with icon/name/count/actions; full-width form sheet.

**Files:** `AdminSection.jsx`, `CategoryIconPicker.jsx`, shared dialog/fields.

**Acceptance criteria:** CRUD errors inline; icon has accessible label/preview; destructive confirmation; no overflow.

## 14. Unrouted/development surfaces

**Current state:** `WidgetsSection`, `CS2StoreCardCTA`, `MyDishesSection`, `MapPicker` have no confirmed active route/use.

**Redesign decision:** không redesign trước khi xác định owner. Lập dependency/import report; nếu dead, xóa trong Phase 3 sau approval; nếu là demo, chuyển Storybook/dev-only; nếu feature tương lai, ghi ADR và không bundle production.

**Acceptance criteria:** không còn dead production bundle/import; không xóa fixture/feature có owner; Leaflet dependency chỉ giữ khi có route thực.

---

# PART VII – RESPONSIVE IMPLEMENTATION PLAN

## 1. Strategy

1. Bắt đầu ở 320 px với content priority, sau đó mở rộng; không thiết kế desktop rồi scale down.
2. Breakpoint theo thời điểm component không còn vừa, không theo tên thiết bị.
3. Dùng CSS grid/flex `minmax(0, 1fr)`, `min-width:0`, `clamp()` và container query; tránh JS `window.innerWidth` cho presentation.
4. Fixed/sticky element phải khai báo safe area và reserved content space.
5. `100dvh` thay `100vh/h-screen` cho full-screen mobile overlay khi phù hợp.

## 2. Transformation rules

| Pattern | Wide | Mid | Narrow |
|---|---|---|---|
| Public navigation | Full header nav | Compact header + overflow | 4–5 bottom tabs + account/more |
| Store grid | 4 columns | 2–3 columns | 1 readable card/list |
| Admin sidebar | Fixed | Collapsible rail/off-canvas | Accessible off-canvas |
| Data table | Semantic table | Reduced columns | Stacked cards/definition list |
| Dialog | Centered, max width | Centered/full-height as needed | Full-screen or bottom sheet |
| Filters | Inline toolbar | Two-row/popover | Bottom sheet + active chips |
| Form | 2 columns only related fields | 1–2 based content | One column |
| Actions | Inline group | Primary + overflow | Sticky primary + “Thêm” menu |

## 3. Mobile navigation rules

- Tối đa năm top-level tabs; label tối thiểu 12 px; target 44×44.
- `aria-current="page"`; icon decorative `aria-hidden`; visible label không bị truncate vô nghĩa.
- `padding-bottom: env(safe-area-inset-bottom)` và main content reserve exact nav height.
- Không auto-hide theo scroll mặc định; nếu giữ phải tôn trọng reduced motion/focus/keyboard và không re-render mỗi pixel.

## 4. Table adaptation

- Không mặc định dùng `overflow-x-auto` cho critical admin task.
- Chọn 3–5 trường ưu tiên cho card mobile; phần còn lại trong details disclosure.
- Actions luôn có text/name, destructive cuối menu.
- Desktop table giữ header, scope, caption và focusable row actions; pagination nằm ngoài scroll container.

## 5. Modal adaptation

- Narrow: bottom sheet cho filter/short choices; full screen cho auth/long forms.
- Max body height dựa `100dvh`; header/footer cố định trong dialog, body scroll.
- Không để app bottom nav nằm trên dialog; background inert.

## 6. Overflow prevention

- Global `overflow-x-hidden` không được dùng để che lỗi layout; chỉ dùng tại component có animation được kiểm soát.
- Mọi flex child chứa text có `min-width:0`; long URL/email dùng wrap/break hợp lý.
- Media có `aspect-ratio`, `width/height`, `object-fit` và fallback.
- Test tiếng Việt dài, email dài, tên quán 60–100 ký tự và zoom 200%.

## 7. Viewport test matrix

| Viewport | Public shell | Explore/detail | Auth | Owner | Admin | Zoom/keyboard |
|---|---|---|---|---|---|---|
| 320×568 | Required | Required | Required | Required | Required/policy | Virtual keyboard |
| 375×667 | Required | Required | Required | Required | Required | 200% sample |
| 390×844 | Required | Required | Required | Required | Required | Android/iOS |
| 430×932 | Required | Required | Required | Required | Required | Safe area |
| 768×1024 | Required | Required | Required | Required | Required | Portrait |
| 1024×768 | Required | Required | Required | Required | Required | Landscape |
| 1280×800 | Required | Required | Required | Required | Required | Small laptop |
| 1366×768 | Required | Required | Required | Required | Required | Desktop short |
| 1440×900 | Required | Required | Required | Required | Required | Baseline |
| 1920×1080 | Required | Required | Required | Required | Required | Wide |

Kiểm tra thêm ở từng pixel nơi nav/filter/card bắt đầu wrap, đặc biệt 340–360, 600–700 và 850–950 px.

---

# PART VIII – COMPONENT REFACTOR PLAN

## 1. Reuse/merge

- Hợp nhất Explore/Saved/admin preview card trên `StoreCard` primitives và variants.
- Hợp nhất reason/confirm/account/store action modals trên `Dialog` + `FormDialog` + `ConfirmDialog`.
- Dùng một `FormField` contract cho auth/profile/store/admin.
- Dùng một `StatusBadge` mapping cho store/user/account trạng thái.
- Dùng một `ImageWithFallback` cho store/banner/avatar/menu image.

## 2. Split

| Current component | Split target |
|---|---|
| `App.jsx` | `AppRouter`, `AppShell`, `AuthProvider/useSession`, `ApiClient`, `NotificationProvider`, feature loaders, overlay host |
| `AuthModal.jsx` | Auth shell + per-mode forms + social buttons + OTP field |
| `MyStoresSection.jsx` | list, submissions, store form, media manager, hours, dishes, maps, feature hooks |
| `AdminSection.jsx` | shell, dashboard, stores, users, categories, dialogs and data hooks |
| `CS2CaseOpener.jsx` | stage, configuration, selection modes, winner dialog and state hook |
| `AboutSection.jsx` | one semantic tree + reusable sections; remove mobile/desktop duplication |

## 3. Remove after evidence/approval

- `WidgetsSection`, `CS2StoreCardCTA`, `MyDishesSection`, `MapPicker` nếu import graph và owner xác nhận dead.
- `react.svg`, `vite.svg`, unused favicon/assets nếu không dùng bởi tests/docs.
- Leaflet dependencies nếu `MapPicker` bị loại và không còn usage.

## 4. New shared APIs

```jsx
<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" loading disabled />
<FormField id label hint error required>{control}</FormField>
<Dialog open onClose title description initialFocus size="sm|md|lg|full" />
<Sheet side="bottom|right" open onClose title actions />
<StatusBadge tone="neutral|info|success|warning|danger" icon>{label}</StatusBadge>
<ImageWithFallback src alt aspect="store|avatar|food" fallback />
<ResponsiveDataList columns mobileFields rowActions />
<ToastRegion messages onDismiss />
```

Props mô tả behavior/semantics, không nhận chuỗi class dài từ caller trừ escape hatch được kiểm soát.

## 5. Integration sequence

1. Thêm tokens và primitives không thay UI hiện có.
2. Viết tests contract/accessibility cho primitives.
3. Migrate một vertical slice nhỏ: Auth hoặc Explore filters.
4. So visual regression; giữ callback/API shape bằng adapters.
5. Migrate Profile → Store detail → Owner → Admin.
6. Chỉ xóa old CSS/component sau khi usage về 0 và regression pass.

---

# PART IX – PRIORITIZED ISSUE BACKLOG

## P0 – Blocker

Không có P0 được xác minh trong phạm vi read-only audit. Nếu sau này phát hiện production bundle/telemetry tự phát tán access/refresh token, issue đó phải lập tức được nâng P0 và dừng release.

## P1 – Critical UX / release blockers

### FE-P1-01 — Mobile shell bị cắt và bottom navigation che nội dung

1. **Priority:** P1.
2. **Page/route:** Tất cả public routes.
3. **Component:** `Header`, `BottomNav`, global shell.
4. **File/location:** `layouts/Header.jsx`, `layouts/BottomNav.jsx:17-154`, `App.jsx:2036-2052,2429`.
5. **Viewport:** nghiêm trọng ở 320×568; ảnh hưởng 375–430 px và safe-area devices.
6. **Current state:** login action bị cắt ở 320 px; 6–7 nav item có label 9–10 px; fixed bar phủ CTA/content.
7. **Evidence/reproduction:** mở `/explore` 320×568 và `/about` 390×844; quan sát action phải và nội dung cuối; runtime verified.
8. **Root cause/hypothesis:** quá nhiều destination, fixed widths/gaps, `overflow-x-hidden` che lỗi, không reserve đúng safe area.
9. **User impact:** không vào đăng nhập, không đọc/bấm được action cuối; lỗi trực tiếp với người dùng điện thoại nhỏ.
10. **Improvement:** compact header, tối đa 4–5 tabs, overflow menu, target 44 px, safe-area token và content inset.
11. **Skills:** responsive-design, checklist-design/mobile-tab-bar, redesign-existing-projects.
12. **Dependencies:** xác nhận IA mobile và destination ưu tiên.
13. **Acceptance criteria:** no clipping/overlap ở test matrix; labels ≥12 px; all targets 44 px; current tab announced.
14. **Verification:** Playwright screenshots + bounding-box assertions + iOS/Android real-device smoke.
15. **Regression watch:** route switching, back/forward, admin visibility và auth CTA.

### FE-P1-02 — Form và icon control thiếu accessible name/relationship

1. **Priority:** P1.
2. **Page/route:** Auth, Profile, My Stores, Admin, filters.
3. **Component:** inputs, password buttons, upload controls, search.
4. **File/location:** `AuthModal.jsx`, `ProfileSection.jsx`, `MyStoresSection.jsx`, `AdminSection.jsx`; static scan: 79 labels, 0 `htmlFor`.
5. **Viewport:** tất cả; nặng hơn với screen reader/voice control.
6. **Current state:** label thường là sibling; placeholder thay label; icon button không có tên đồng đều.
7. **Evidence/reproduction:** inspect accessibility tree hoặc tab qua form và gọi tên control bằng screen reader.
8. **Root cause/hypothesis:** raw controls được copy thay vì shared `FormField`/`IconButton` contract.
9. **User impact:** screen reader không biết field; click label không focus; lỗi form khó sửa.
10. **Improvement:** IDs ổn định, `htmlFor`, `aria-describedby`, visible label, named icon button và error summary.
11. **Skills:** checklist-design/accessibility,input, vercel-react-best-practices.
12. **Dependencies:** shared field primitives; giữ backend validation rules.
13. **Acceptance criteria:** axe không có label/name violations trên luồng chính; mỗi error liên kết đúng field; password toggle công bố state.
14. **Verification:** Testing Library/axe + NVDA/VoiceOver manual + keyboard-only form completion.
15. **Regression watch:** autofill, OTP paste, browser password manager và localized copy.

### FE-P1-03 — Tương phản màu không đạt WCAG AA

1. **Priority:** P1.
2. **Page/route:** toàn ứng dụng.
3. **Component:** primary button/badge/link/status text.
4. **File/location:** `index.css` và mọi occurrence `#ff3e3e`, `#0ca678`.
5. **Viewport:** tất cả.
6. **Current state:** white/red ≈3.49:1, red/cream ≈3.23:1, green pair ≈2.91:1 cho text nhỏ.
7. **Evidence/reproduction:** contrast calculation từ computed colors; static verified.
8. **Root cause/hypothesis:** brand primitive dùng trực tiếp làm semantic action/text token.
9. **User impact:** text khó đọc, đặc biệt low vision/mobile/outdoor; không đạt AA.
10. **Improvement:** tách brand red decorative khỏi action red accessible; text đen trên bright red hoặc white trên `#C92A2A`; semantic status pairs.
11. **Skills:** brandkit, checklist-design/color, design-taste-frontend.
12. **Dependencies:** token foundation và visual approval cho red action.
13. **Acceptance criteria:** normal text ≥4.5:1, large/UI ≥3:1; focus ring ≥3:1; state không chỉ dùng màu.
14. **Verification:** automated contrast + manual spot check computed styles.
15. **Regression watch:** hover/disabled/selected and email-like visual consistency.

### FE-P1-04 — Dialog, sheet, dropdown và custom select thiếu keyboard/focus contract

1. **Priority:** P1.
2. **Page/route:** Explore filter, Header menu, Auth, My Stores, Admin.
3. **Component:** `CustomSelect`, category sheet, inline admin modals, user dropdown.
4. **File/location:** `CustomSelect.jsx:32-68`, `ExploreSection.jsx:484+`, `Header.jsx`, `AdminSection.jsx:1449+`.
5. **Viewport:** tất cả; sheet đặc biệt mobile.
6. **Current state:** thiếu listbox/menu roles, arrow/Escape, `aria-expanded/controls`; một số modal không dùng focus hook.
7. **Evidence/reproduction:** keyboard-only Tab/Arrow/Escape; inspect ARIA static; detail drawer là positive control.
8. **Root cause/hypothesis:** nhiều local overlay implementations thay vì primitive chung.
9. **User impact:** kẹt/mất focus, không biết control mở/đóng, không chọn được bằng bàn phím.
10. **Improvement:** native select khi đủ; accessible listbox/menu primitive; shared dialog/sheet lifecycle.
11. **Skills:** checklist-design/modal,drawer,dropdown; responsive-design.
12. **Dependencies:** dialog/select primitives; overlay layer tokens.
13. **Acceptance criteria:** WAI-ARIA keyboard pattern pass, background inert, Escape/restore/initial focus đúng.
14. **Verification:** Playwright keyboard suite + accessibility tree + manual screen reader.
15. **Regression watch:** click-outside, portal stacking, scroll lock và mobile keyboard.

### FE-P1-05 — Development/test controls xuất hiện trong end-user UI

1. **Priority:** P1.
2. **Page/route:** Auth modal và store detail.
3. **Component:** manual OAuth token forms, simulated GPS inputs.
4. **File/location:** `AuthModal.jsx:246-286`, `StoreDetailDrawer.jsx:364-390`.
5. **Viewport:** tất cả.
6. **Current state:** user thấy trường JWT/access token và có thể nhập tọa độ test.
7. **Evidence/reproduction:** mở `<details>` auth; mở report closed-store; static verified.
8. **Root cause/hypothesis:** diagnostic fallback được đặt trong production component mà không có build gate.
9. **User impact:** mất niềm tin, tăng nguy cơ token mishandling và báo cáo vị trí giả.
10. **Improvement:** bỏ khỏi production DOM; test qua harness/fixture; geolocation thật với consent/error UX.
11. **Skills:** minimalist-ui, checklist-design, full-output-enforcement.
12. **Dependencies:** xác nhận E2E không phụ thuộc manual controls; không xóa OAuth API logic.
13. **Acceptance criteria:** production bundle/runtime không có label/manual token/test GPS; dev harness vẫn đáp ứng test nếu cần.
14. **Verification:** production smoke + string scan bundle + auth/report regression.
15. **Regression watch:** social login stability và closed-store report testing.

### FE-P1-06 — Admin không có adaptive mobile interaction model

1. **Priority:** P1.
2. **Page/route:** `/admin` dashboard/stores/users/categories.
3. **Component:** fixed shell, sidebar, tables, inline modals.
4. **File/location:** `AdminSection.jsx:219+`, tables `549,1020,1345`, modals `1449+`.
5. **Viewport:** 320–1024 px.
6. **Current state:** table chủ yếu `overflow-x-auto`; sidebar/modal thiếu đầy đủ focus/menu semantics; nhiều action nhỏ.
7. **Evidence/reproduction:** static code verified; authenticated runtime **Needs verification**.
8. **Root cause/hypothesis:** desktop-first admin UI không có narrow content priority.
9. **User impact:** admin dễ bấm nhầm hoặc không hoàn thành moderation/user management trên mobile.
10. **Improvement:** responsive data cards, accessible off-canvas, primary + overflow actions, full-screen narrow forms.
11. **Skills:** responsive-design, checklist-design/admin-panel,table,drawer.
12. **Dependencies:** human decision: mobile-admin fully supported hay explicitly desktop-only.
13. **Acceptance criteria:** policy được ghi; nếu supported, critical tasks pass 320 px; nếu desktop-only, controlled block + desktop link, không UI vỡ.
14. **Verification:** authenticated Playwright per role + real touch device.
15. **Regression watch:** moderation transition, reason validation, permission visibility.

### FE-P1-07 — Dashboard admin có nguy cơ hiển thị tổng số theo trang hiện tại

1. **Priority:** P1.
2. **Page/route:** `/admin` dashboard.
3. **Component:** metric cards.
4. **File/location:** `AdminSection.jsx:210-211,496,515`.
5. **Viewport:** all admin.
6. **Current state:** `approvedStoresCount = stores.filter(...)` và `totalUsersCount = adminUsersList.length`.
7. **Evidence/reproduction:** static verified; so sánh khi backend có nhiều hơn page size cần runtime integration.
8. **Root cause/hypothesis:** page slice được tái sử dụng làm aggregate.
9. **User impact:** admin hiểu sai quy mô/trạng thái hệ thống.
10. **Improvement:** dashboard summary contract riêng hoặc page metadata total chính xác; label rõ scope.
11. **Skills:** checklist-design/admin-panel, high-end-visual-design hierarchy.
12. **Dependencies:** backend summary API may require separately approved change.
13. **Acceptance criteria:** totals giữ nguyên khi đổi page/filter trừ khi label nói rõ; test >1 page.
14. **Verification:** integration fixture nhiều trang + API contract test.
15. **Regression watch:** pending/recovery counts đã có logic riêng.

### FE-P1-08 — Không có 404 thực

1. **Priority:** P1.
2. **Page/route:** mọi unknown path.
3. **Component:** route selection/App.
4. **File/location:** `App.jsx:209-278,2036-2290`.
5. **Viewport:** tất cả.
6. **Current state:** `/does-not-exist` render Explore trong khi URL/canonical không tương ứng.
7. **Evidence/reproduction:** runtime verified bằng unknown URL.
8. **Root cause/hypothesis:** manual route mapping không có wildcard state.
9. **User impact:** nhầm lẫn, link lỗi không được giải thích, SEO/canonical sai.
10. **Improvement:** explicit route table + branded 404 với home/search/contact links.
11. **Skills:** checklist-design/website-404, redesign-existing-projects.
12. **Dependencies:** router refactor hoặc minimal wildcard handling.
13. **Acceptance criteria:** unknown path hiển thị 404, title/noindex phù hợp, links hoạt động; valid deep links không bị bắt nhầm.
14. **Verification:** routing E2E direct/reload/back-forward.
15. **Regression watch:** `/quan/:id/:slug?`, auth callbacks và canonical replace.

### FE-P1-09 — Media remote lỗi làm card/detail trông hỏng

1. **Priority:** P1.
2. **Page/route:** Explore, Saved, detail, Owner/Admin.
3. **Component:** store/banner/avatar/food images.
4. **File/location:** `StoreCard.jsx`, `StoreDetailDrawer.jsx`, page-local `<img>`.
5. **Viewport:** tất cả.
6. **Current state:** initial fallback URL có nhưng load failure sau render không được xử lý nhất quán.
7. **Evidence/reproduction:** runtime một số ảnh hiển thị broken/alt; network restriction có thể góp phần, nhưng thiếu `onError` verified static.
8. **Root cause/hypothesis:** image handling phân tán, không có shared primitive.
9. **User impact:** perceived quality thấp, layout/card khó hiểu.
10. **Improvement:** `ImageWithFallback`, fixed aspect, dimensions, retry policy, neutral branded fallback.
11. **Skills:** high-end-visual-design, checklist-design/card/uploading-media.
12. **Dependencies:** approved fallback asset và CDN size policy.
13. **Acceptance criteria:** 404/timeout/empty src đều render fallback không loop; no CLS đáng kể.
14. **Verification:** Playwright route-abort/image-404 tests + screenshots.
15. **Regression watch:** Cloudinary transformations, image viewer và alt content.

## P2 – Major improvements

### FE-P2-01 — Feature components là monolith, tăng regression risk

1. **Priority:** P2.
2. **Page/route:** global, auth, owner, admin, CS2.
3. **Component:** `App`, `MyStoresSection`, `AdminSection`, `CS2CaseOpener`, `AuthModal`.
4. **File/location:** các file lần lượt ~2438/2244/2021/1164/749 dòng.
5. **Viewport:** indirect, all.
6. **Current state:** API/business/presentation/state/overlay cùng file; prop bags rất lớn.
7. **Evidence/reproduction:** static line/state/effect scan.
8. **Root cause/hypothesis:** feature tăng dần không có boundary/hook/component contract.
9. **User impact:** sửa UI dễ phá auth/data/status, bug lâu được sửa.
10. **Improvement:** split theo vertical slice, providers/hooks/adapters, giữ public API callbacks.
11. **Skills:** vercel-react-best-practices, redesign-existing-projects.
12. **Dependencies:** characterization tests trước refactor.
13. **Acceptance criteria:** behavior parity; mỗi module có responsibility rõ; giảm prop drilling và side effect scope.
14. **Verification:** existing unit/E2E + new characterization tests + bundle comparison.
15. **Regression watch:** session refresh, SSE, route state, staged uploads.

### FE-P2-02 — Design tokens và component variants chưa đủ nhất quán

1. **Priority:** P2.
2. **Page/route:** all.
3. **Component:** cards/buttons/inputs/badges/layers.
4. **File/location:** `index.css` và arbitrary Tailwind classes toàn `src`.
5. **Viewport:** all.
6. **Current state:** hàng trăm màu hardcode, nhiều shadow/radius/z-index/font-size variants.
7. **Evidence/reproduction:** static frequency scan.
8. **Root cause/hypothesis:** helper class ban đầu không có semantic token enforcement.
9. **User impact:** UI cảm giác chắp vá, interaction state không đoán trước được.
10. **Improvement:** token layer Part V + primitives/variants + lint/review rule.
11. **Skills:** brandkit, design-taste-frontend, minimalist-ui.
12. **Dependencies:** visual approval tokens.
13. **Acceptance criteria:** no new raw brand/status colors; shared states; documented exceptions.
14. **Verification:** visual regression + static token usage report.
15. **Regression watch:** preserve recognizable brand, avoid generic SaaS look.

### FE-P2-03 — Typography quá nhỏ và density cao

1. **Priority:** P2.
2. **Page/route:** Store cards, BottomNav, Auth, My Stores, Admin, CS2.
3. **Component:** metadata/labels/badges.
4. **File/location:** numerous `text-[8px]`–`text-[11px]` in listed feature files.
5. **Viewport:** especially 320–430 px.
6. **Current state:** thông tin nghiệp vụ cần đọc được render dưới 12 px và uppercase/tracking.
7. **Evidence/reproduction:** static count + runtime mobile screenshots.
8. **Root cause/hypothesis:** cố giữ tất cả metadata trên compact card.
9. **User impact:** đọc chậm, khó ngoài trời, tăng lỗi thao tác.
10. **Improvement:** minimum 12 px, ưu tiên/ẩn secondary content có chủ đích, responsive type scale.
11. **Skills:** checklist-design/typography, responsive-design.
12. **Dependencies:** card/content hierarchy redesign.
13. **Acceptance criteria:** no essential text <12 px; body ≥14 px; zoom 200% no loss.
14. **Verification:** CSS scan + visual/zoom test.
15. **Regression watch:** Vietnamese wrapping and card height.

### FE-P2-04 — Duplicate UI patterns dễ drift

1. **Priority:** P2.
2. **Page/route:** About, Saved, Owner, Admin.
3. **Component:** dual About trees, duplicated store cards/forms/dialogs.
4. **File/location:** `AboutSection.jsx`, `SavedStoresSection.jsx`, large feature files.
5. **Viewport:** all.
6. **Current state:** desktop/mobile markup riêng và local variants không chung contract.
7. **Evidence/reproduction:** static component comparison.
8. **Root cause/hypothesis:** responsive solved by conditional markup rather than reflow/composition.
9. **User impact:** copy/state/fix xuất hiện không đồng đều giữa thiết bị/trang.
10. **Improvement:** single semantic tree, composition variants, shared cards/dialogs.
11. **Skills:** responsive-design, vercel-react-best-practices.
12. **Dependencies:** snapshot baseline.
13. **Acceptance criteria:** one content source; behavior parity; duplicate CSS/JSX materially reduced.
14. **Verification:** visual regression all viewports + import graph.
15. **Regression watch:** DOM order/screen reader order.

### FE-P2-05 — Loading/toast/error feedback chưa đúng phạm vi và semantics

1. **Priority:** P2.
2. **Page/route:** all.
3. **Component:** global overlay/toast stack/inline errors.
4. **File/location:** `App.jsx` overlay và toast host gần cuối file.
5. **Viewport:** all, mobile more disruptive.
6. **Current state:** request cục bộ có thể bật full-screen loading; toast clickable div/X icon; no live region.
7. **Evidence/reproduction:** static verified; network-throttle UX needs runtime.
8. **Root cause/hypothesis:** centralized boolean/message model không biết operation scope.
9. **User impact:** mất context, tưởng app treo, assistive tech không nhận feedback.
10. **Improvement:** operation-local loading, skeleton, accessible toast region, persistent inline retry cho lỗi quan trọng.
11. **Skills:** checklist-design/toast,loading,showing-input-error.
12. **Dependencies:** request state refactor.
13. **Acceptance criteria:** no global block for local save/load; status announced once; error có retry/next step.
14. **Verification:** network delay/failure E2E + screen reader live-region test.
15. **Regression watch:** duplicate notifications and submit double-click.

### FE-P2-06 — Third-party font/social SDK tải toàn cục và chưa có performance budget

1. **Priority:** P2.
2. **Page/route:** all.
3. **Component:** document head, auth integration.
4. **File/location:** `index.css:1`, `index.html` social SDK scripts.
5. **Viewport:** all; mobile network most affected.
6. **Current state:** Google Font CSS import and SDKs load even without auth interaction.
7. **Evidence/reproduction:** static verified; actual timing not measured.
8. **Root cause/hypothesis:** integration stability prioritized over conditional loading.
9. **User impact:** possible delayed render/network/privacy cost.
10. **Improvement:** self-host/subset font; set bundle/third-party budget; benchmark SDK strategies before any change.
11. **Skills:** vercel-react-best-practices, responsive-design performance guidance.
12. **Dependencies:** human approval because lazy SDK was intentionally removed for stability.
13. **Acceptance criteria:** font no blocking third-party request; social login reliability unchanged; budget recorded.
14. **Verification:** Lighthouse/WebPageTest on HTTPS staging + OAuth E2E.
15. **Regression watch:** Google SDK readiness race and Facebook login clickability.

### FE-P2-07 — Public trust/recovery surfaces còn thiếu

1. **Priority:** P2.
2. **Page/route:** global/About/404.
3. **Component:** footer/legal/support.
4. **File/location:** no public footer/legal routes found; `AboutSection.jsx`.
5. **Viewport:** all.
6. **Current state:** About có contact nhưng không có consistent Privacy/Terms/data deletion/support access.
7. **Evidence/reproduction:** route/component inventory.
8. **Root cause/hypothesis:** feature delivery preceded public compliance shell.
9. **User impact:** giảm trust và khó tìm hỗ trợ/quyền dữ liệu.
10. **Improvement:** compact footer and approved legal/support pages; no invented legal copy without owner review.
11. **Skills:** checklist-design/footer,legal-privacy,about.
12. **Dependencies:** legal/product content approval.
13. **Acceptance criteria:** links present and valid; last-updated/contact shown; mobile no overlap.
14. **Verification:** link crawl + content review.
15. **Regression watch:** localization and cookie/auth policy accuracy.

### FE-P2-08 — StoreCard và clickable media chưa có semantic interaction model sạch

1. **Priority:** P2.
2. **Page/route:** Explore/Saved/detail.
3. **Component:** `StoreCard`, image gallery.
4. **File/location:** `StoreCard.jsx`, `StoreDetailDrawer.jsx` media blocks.
5. **Viewport:** all.
6. **Current state:** card `div role=button` chứa bookmark button; images clickable div.
7. **Evidence/reproduction:** static DOM inspection/tab order.
8. **Root cause/hypothesis:** whole-card click added after nested actions.
9. **User impact:** ambiguous focus/event bubbling; keyboard/screen reader action khó hiểu.
10. **Improvement:** stretched semantic link/button for primary navigation, sibling save action; media buttons named.
11. **Skills:** checklist-design/accessibility/card/button.
12. **Dependencies:** route callback/deep link adapter.
13. **Acceptance criteria:** no nested interactive semantics; Enter/Space behavior expected; bookmark does not open detail.
14. **Verification:** keyboard/event propagation tests + axe.
15. **Regression watch:** card drag/scroll on mobile and analytics events.

## P3 – Polish and maintainability

### FE-P3-01 — Copy/language/icon system chưa đồng nhất

1. **Priority:** P3.
2. **Page/route:** Auth/Admin/global.
3. **Component:** badges, headings, statuses.
4. **File/location:** `AuthModal.jsx:138`, `AdminSection.jsx:424,523` và raw enum labels.
5. **Viewport:** all.
6. **Current state:** tiếng Anh/Việt trộn, emoji trộn Lucide, technical copy xuất hiện.
7. **Evidence/reproduction:** static verified.
8. **Root cause/hypothesis:** copy thêm theo feature không có glossary.
9. **User impact:** cảm giác chưa hoàn thiện và giảm clarity.
10. **Improvement:** Vietnamese product glossary, status mapping, icon rule.
11. **Skills:** brandkit, minimalist-ui.
12. **Dependencies:** product copy approval.
13. **Acceptance criteria:** end-user copy tiếng Việt nhất quán; internal enum không render trực tiếp.
14. **Verification:** string inventory + editorial review.
15. **Regression watch:** backend JSON vẫn giữ English như contract.

### FE-P3-02 — Shadow/radius/card overuse làm hierarchy phẳng

1. **Priority:** P3.
2. **Page/route:** all.
3. **Component:** cards, panels, buttons.
4. **File/location:** arbitrary classes toàn `src`.
5. **Viewport:** all.
6. **Current state:** gần mọi surface có viền/bóng mạnh và radius khác nhau.
7. **Evidence/reproduction:** static frequency + visual review.
8. **Root cause/hypothesis:** brand style áp đồng cường độ cho mọi cấp.
9. **User impact:** khó biết đâu là CTA/section chính; visual fatigue.
10. **Improvement:** ba elevation levels; supporting content plain/divider; radius grammar.
11. **Skills:** high-end-visual-design, minimalist-ui, industrial-brutalist-ui.
12. **Dependencies:** token rollout.
13. **Acceptance criteria:** one dominant surface per region; shadows only interactive/emphasis; visual approval.
14. **Verification:** before/after screenshot review.
15. **Regression watch:** không làm mất cá tính brutalist.

### FE-P3-03 — Dead/unrouted code và asset cần được xác nhận

1. **Priority:** P3.
2. **Page/route:** none/unrouted.
3. **Component:** Widgets, MapPicker, MyDishes, CTA, React/Vite assets.
4. **File/location:** files listed in Part VIII.
5. **Viewport:** n/a.
6. **Current state:** không tìm thấy active usage trong `src`.
7. **Evidence/reproduction:** import/route scan; hero asset có thể là E2E fixture.
8. **Root cause/hypothesis:** prototypes/old implementation retained.
9. **User impact:** maintenance/dependency noise, potential bundle risk nếu reimport.
10. **Improvement:** owner/import/test check, then remove or move to dev/test location.
11. **Skills:** vercel-react-best-practices, full-output-enforcement.
12. **Dependencies:** human confirmation.
13. **Acceptance criteria:** each item marked keep/remove/move with reason; no broken test/import.
14. **Verification:** build/lint/test + import graph.
15. **Regression watch:** `hero.png` upload fixture and future feature intent.

---

# PART X – PHASED IMPLEMENTATION ROADMAP

## Phase 0 – Safety & Baseline

**Goal:** khóa hiện trạng, đo được regression và tách thay đổi UI khỏi business rules.

**Scope / Issue IDs:** baseline cho toàn bộ FE-P1/P2/P3; chưa redesign.

**Files:** toàn `frontend/src`, `frontend/e2e`, test scripts, blueprint này.

**Dependencies:** seed/read-only test account cho USER/OWNER/ADMIN; môi trường HTTPS staging khi có.

**Implementation sequence:**

1. Chụp visual baseline cho toàn bộ route/viewports và các auth states.
2. Ghi network/API contract cho mỗi flow; không snapshot token/PII.
3. Thêm characterization tests cho route, auth modal, store detail, create/edit/discard, moderation.
4. Lập inventory import/dead code và baseline bundle.
5. Chốt mobile admin policy, primary mobile nav destinations và accessible red action color.

**Detailed tasks:**

- Gắn test IDs chỉ khi semantic selector không đủ; ưu tiên role/name.
- Tạo fixtures không làm biến đổi production data.
- Lưu screenshot theo route/state/viewport, không chỉ happy path.
- Ghi bundle budget: main JS gzip không tăng quá 10% nếu chưa có approval; CSS gzip không tăng quá 10%.

**Acceptance criteria:** baseline đủ public/auth/owner/admin; tests ghi rõ mutable vs read-only; ba quyết định human được chốt.

**Verification:** lint, unit, production build, E2E baseline và Git diff review.

**Definition of Done:** mỗi P1 liên kết ít nhất một test hoặc manual verification case; không đổi behavior.

**Regression risks:** test phụ thuộc data live; screenshot không ổn định do animation/remote image.

## Phase 1 – Production UI Cleanup

**Goal:** loại bỏ/restrict UI kỹ thuật và cung cấp feedback nghiệp vụ an toàn.

**Scope / Issue IDs:** FE-P1-05, FE-P2-05, FE-P3-01; harden phần DevConsole.

**Files:** `AuthModal.jsx`, `StoreDetailDrawer.jsx`, `App.jsx`, `DevConsole.jsx`, API error mapping.

**Dependencies:** Phase 0; xác nhận E2E không dùng manual token/GPS fields.

**Implementation sequence:**

1. Viết production bundle string tests.
2. Tách manual OAuth/GPS test input sang dev harness hoặc fixture.
3. Thay technical copy và raw enum bằng Vietnamese mapping.
4. Chuyển toast thành semantic `ToastRegion`; phân loại inline/global errors.
5. Xác minh logs/redaction và DevConsole tree-shaking/gating.

**Detailed tasks:** không xóa auth/API/logging; chỉ thay surface. Kiểm tra DOM, source map policy, console và analytics không chứa token/OTP/password.

**Acceptance criteria:** bảng Part IV được xử lý đúng REMOVE/REPLACE/RESTRICT/KEEP; social/report flows vẫn chạy.

**Verification:** production build, bundle string scan, auth/report E2E, redaction unit tests.

**Definition of Done:** không còn development/test control trong production UI hoặc DOM; message end-user hoàn toàn nghiệp vụ.

**Regression risks:** làm hỏng social login fallback hoặc E2E selector; xử lý bằng dev-only harness và role selectors.

## Phase 2 – Design System Foundation

**Goal:** tạo primitives truy cập được và token hóa mà chưa thay đổi wholesale layout.

**Scope / Issue IDs:** FE-P1-02, FE-P1-03, FE-P1-04 foundation; FE-P2-02/03/05/08; FE-P3-02.

**Files:** `index.css`, new `components/ui/*`, `useDialogFocus`, selected shared components.

**Dependencies:** accessible palette approved; Phase 1 complete.

**Implementation sequence:** tokens → Button/IconButton → FormField → StatusBadge → ImageWithFallback → Dialog/Sheet → Toast → Select/Menu → ResponsiveDataList.

**Detailed tasks:**

- Giữ adapters/class aliases cho component cũ trong khi migrate.
- Mỗi primitive có focus/disabled/loading/error/reduced-motion states.
- Story/demo hoặc test page chỉ build dev; unit + accessibility tests cho API.
- Contrast table lưu cùng token docs.

**Acceptance criteria:** Part V contract implemented; no essential text dưới 12 px ở migrated surfaces; primitives axe-clean.

**Verification:** unit/axe, keyboard matrix, visual regression và contrast tooling.

**Definition of Done:** primitives dùng được mà không cần caller viết ARIA thủ công cho common path; documentation/props stable.

**Regression risks:** đổi toàn cục phá branding/layout; migrate incremental và keep compatibility layer.

## Phase 3 – Desktop UX Redesign

**Goal:** cải thiện hierarchy, navigation, feedback và maintainability ở desktop trước khi adaptive transforms.

**Scope / Issue IDs:** FE-P1-07/08/09, FE-P2-01/04/05/07/08, FE-P3-01/02/03.

**Files:** App shell/routing, Explore, Saved, detail, About, Auth, Profile, My Stores, Admin, CS2.

**Dependencies:** Phase 2 primitives; backend summary API approval cho FE-P1-07.

**Implementation sequence:** shell/404/footer → Explore/cards/detail → auth/profile → owner → admin → CS2 → About dedup/dead code.

**Detailed tasks:**

- Tách component theo Part VIII nhưng giữ callbacks/data shape.
- Thêm image fallback và local request feedback.
- Chuẩn hóa copy/status/action priority.
- Dashboard totals lấy nguồn aggregate đúng.
- Loại dead code chỉ sau import/owner confirmation.

**Acceptance criteria:** desktop page specs Part VI pass; unknown route 404; no broken media; business flow parity.

**Verification:** 1024/1280/1366/1440/1920 screenshot diff, regression tests, API request comparison.

**Definition of Done:** không còn monolith cần sửa để đổi một subfeature nhỏ; visual hierarchy được design review duyệt.

**Regression risks:** route/deep-link/session/SSE/staged media; giữ characterization tests làm gate.

## Phase 4 – Responsive & Mobile Redesign

**Goal:** hoàn thành adaptive UX thực sự cho 320–1024 px.

**Scope / Issue IDs:** FE-P1-01/04/06/09, FE-P2-03/04/08.

**Files:** Header, BottomNav, shell, all page/component files in Part VI.

**Dependencies:** Phase 3 structure; mobile admin policy approved.

**Implementation sequence:** global nav/safe area → Explore/detail/Saved → Auth/Profile → Owner forms → Admin → CS2/About.

**Detailed tasks:**

- Dùng matrix Part VII và test intermediate widths.
- Thay table bằng responsive data cards nơi cần.
- Modal dài thành full screen; filter thành bottom sheet.
- Bỏ JS viewport state khi CSS/container query đủ.
- Test long Vietnamese strings, image errors, keyboard and zoom.

**Acceptance criteria:** no clipping/overlap/horizontal page scroll; 44 px targets; no essential text dưới 12 px; task completion ở narrow.

**Verification:** Playwright bounding boxes/screenshots, real iOS/Android, virtual keyboard, orientation and 200% zoom.

**Definition of Done:** tất cả required cells trong viewport matrix pass hoặc có approved documented exception.

**Regression risks:** duplicate DOM/focus order, fixed nav layering, viewport keyboard behavior.

## Phase 5 – Accessibility & Performance

**Goal:** đạt WCAG 2.2 AA applicable và performance budget trên staging gần production.

**Scope / Issue IDs:** FE-P1-02/03/04, FE-P2-05/06/08.

**Files:** all interactive components, font/index head, asset pipeline, tests.

**Dependencies:** HTTPS staging, real OAuth config, design phases complete.

**Implementation sequence:** semantic/name → keyboard/focus → announcements/errors → contrast/zoom → font/media → third-party benchmark → CWV fixes.

**Detailed tasks:**

- NVDA+Chrome, VoiceOver+Safari smoke cho critical flows.
- Self-host/subset font.
- Benchmark current always-loaded SDK against any proposed alternative; không đổi nếu reliability kém.
- Set target p75 staging proxy: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; ghi actual measurement.
- Add error boundary and route-level recovery if not already robust.

**Acceptance criteria:** automated critical/serious a11y violations = 0 trên critical pages; keyboard-only completion; performance budget met or exception signed.

**Verification:** axe, screen readers, Lighthouse/WebPageTest, React profiler/network waterfall.

**Definition of Done:** report có actual evidence, không chỉ static claim.

**Regression risks:** font metrics/layout shift; SDK race; ARIA misuse worse than native semantics.

## Phase 6 – Regression Testing & Final QA

**Goal:** chứng minh redesign không phá nghiệp vụ và đủ điều kiện release.

**Scope / Issue IDs:** all.

**Files:** full frontend, tests, release checklist.

**Dependencies:** production-like HTTPS staging và test accounts.

**Implementation sequence:** clean DB/fixtures → automated suites → visual matrix → cross-browser/device → OAuth/email/upload flows → sign-off.

**Detailed tasks:**

- Chạy register→verify→login→refresh→logout.
- Google/Facebook; password revoke other session.
- Deep link/reload/back/forward/share.
- Upload/cancel/cleanup; create/edit/discard.
- Admin moderation/user/category by permissions.
- Network slow/offline/server errors and image failures.

**Acceptance criteria:** no P0/P1 open; P2 exceptions documented; production build and contract tests pass; visual/a11y/perf evidence attached.

**Verification:** checklist Part XI, release candidate smoke and stakeholder sign-off.

**Definition of Done:** release report references every issue ID, result, evidence and owner; rollback plan ready.

**Regression risks:** environment-only OAuth/cookie/CORS and real mobile browser differences.

---

# PART XI – TESTING & QA CHECKLIST

## Desktop

- [ ] 1024, 1280, 1366, 1440 và 1920 px không overflow/clipping.
- [ ] Header, content width, grid, alignment và vertical rhythm nhất quán.
- [ ] Tất cả route/deep link/reload/back-forward hoạt động.
- [ ] Drawer/modal không vượt viewport; body/action scroll đúng.
- [ ] Remote image lỗi có fallback và không đổi layout.

## Tablet

- [ ] 768 portrait và 1024 landscape dùng layout phù hợp, không phải desktop bị ép.
- [ ] Header/sidebar chuyển trạng thái trước khi content overlap.
- [ ] Forms reflow; helper/error text không bị cắt.
- [ ] Tables chuyển reduced columns/cards đúng spec.

## Mobile

- [ ] 320, 375, 390 và 430 px hoàn thành mọi critical task.
- [ ] Touch targets ≥44×44; label ≥12 px; không cuộn ngang.
- [ ] Bottom nav không che content/CTA và hỗ trợ safe area.
- [ ] Virtual keyboard không che active field/action.
- [ ] Orientation change không mất state hoặc tạo overlay sai.

## UI consistency

- [ ] Chỉ dùng approved semantic color/spacing/radius/shadow tokens.
- [ ] Button/field/card/status/dialog variants đúng contract.
- [ ] Copy tiếng Việt nhất quán; không render raw enum.
- [ ] Empty/loading/error/success states đủ và cùng giọng điệu.
- [ ] Icon family, size và accessible-name policy nhất quán.

## Accessibility

- [ ] Normal text ≥4.5:1; large/UI/focus ≥3:1.
- [ ] Tab order logic; focus visible; skip link hoạt động.
- [ ] Mọi field có label; error/hint liên kết và announce.
- [ ] Menu/listbox/dialog theo keyboard pattern; Escape/restore đúng.
- [ ] Current/pressed/expanded state được công bố.
- [ ] Reduced motion, 200% zoom, NVDA Chrome và VoiceOver Safari smoke pass.
- [ ] Automated axe critical/serious violations = 0 cho critical flows.

## Authentication UI

- [ ] Login/register labels, autofill, password toggle và errors đúng.
- [ ] Google/Facebook buttons thật sự clickable/loading/disabled accessible.
- [ ] Manual OAuth token controls không có trong production.
- [ ] Verify/resend/reset OTP paste/autofill/error/cooldown states rõ.
- [ ] Logout/change password/session revoke không regression.

## Forms and media

- [ ] Validation xảy ra đúng lúc, focus field lỗi đầu tiên.
- [ ] Save disabled khi unchanged; loading và success rõ.
- [ ] Unsaved changes/discard dialog hoạt động.
- [ ] File formats/size/progress/failure/retry/cancel rõ.
- [ ] Cancel upload/edit không thay media đã lưu; cleanup vẫn chạy.

## Navigation and routing

- [ ] Logo/link/nav dùng semantic elements.
- [ ] Mobile chỉ 4–5 primary tabs hoặc approved model.
- [ ] Unknown route hiển thị 404 và recovery links.
- [ ] Store canonical URL, share, reload và history đúng.
- [ ] Protected routes redirect và return intent đúng.

## Error/network handling

- [ ] 400/401/403/404/409/429/500 và offline có message/action phù hợp.
- [ ] Không hiển thị endpoint, stack trace, raw JSON hoặc internal IDs vô ích.
- [ ] Retry không gửi duplicate mutation.
- [ ] Toast/live region không spam hoặc che nav.

## Debug UI cleanup

- [ ] Production DOM/bundle không có OAuth manual token labels.
- [ ] Production UI không có simulated GPS/test controls.
- [ ] DevConsole chỉ DEV + admin và redacts secrets.
- [ ] Không log token/password/OTP/PII trong browser console/telemetry.
- [ ] Auth/API integration vẫn tồn tại và được test.

## Production build and performance

- [ ] `npm run lint` pass.
- [ ] Unit/contract tests pass.
- [ ] Production env contract + `npm run build` pass.
- [ ] Main/CSS/chunks trong approved budget.
- [ ] Font self-host/preload không gây CLS.
- [ ] Social OAuth pass trên HTTPS domain thật.
- [ ] Lighthouse/WebPageTest lưu actual LCP/INP/CLS; không dùng số giả.

---

# PART XII – IMPLEMENTATION HANDOFF

## 1. Reading order for the implementing agent

1. Đọc Part I để hiểu release blockers và mức điểm.
2. Đọc Part II–IV để biết inventory, evidence và production cleanup.
3. Đọc Part V làm design contract, không tự sáng tạo palette/component khác.
4. Đọc Part VI–VIII cho page/responsive/refactor specification.
5. Chọn issue từ Part IX theo priority, rồi thực hiện đúng phase Part X.
6. Dùng Part XI làm release evidence, không chỉ tick bằng cảm tính.

## 2. Files to inspect first

- `frontend/src/App.jsx`
- `frontend/src/index.css`
- `frontend/src/layouts/Header.jsx`
- `frontend/src/layouts/BottomNav.jsx`
- `frontend/src/components/modals/AuthModal.jsx`
- `frontend/src/components/common/CustomSelect.jsx`
- `frontend/src/components/common/StoreCard.jsx`
- `frontend/src/components/drawers/StoreDetailDrawer.jsx`
- `frontend/src/pages/Explore/ExploreSection.jsx`
- `frontend/src/pages/MyStores/MyStoresSection.jsx`
- `frontend/src/pages/Admin/AdminSection.jsx`
- `frontend/src/pages/CS2CaseOpener/CS2CaseOpener.jsx`
- `frontend/e2e/` và scripts contract hiện có.

## 3. Execution rules

- Một PR/commit group cho một phase hoặc vertical slice có thể rollback.
- Trước refactor phải thêm characterization test cho behavior sẽ chạm.
- Không đổi endpoint, payload, auth cookie/rotation, role rules, store state machine, maps safety hoặc staged-media semantics nếu không có approval riêng.
- Không đổi backend JSON English chỉ để phục vụ copy; map sang tiếng Việt ở presentation.
- Không dùng global CSS override để “sửa nhanh” component; migrate qua tokens/primitives.
- Không xóa dead-looking file/asset/dependency trước khi kiểm tra import, tests và hỏi owner.
- Không tái lazy-load social SDK chỉ vì performance; benchmark và xin xác nhận do dự án đã từng ưu tiên stability.

## 4. Verification protocol per issue

1. Reproduce và lưu evidence “before”.
2. Implement smallest scoped change.
3. Chạy unit/a11y test liên quan.
4. Chạy screenshot/bounding-box test viewports bị ảnh hưởng.
5. Chạy flow regression và production build.
6. Gắn evidence “after” vào issue/PR.
7. Kiểm tra Git diff không chứa secret, generated report hoặc thay đổi ngoài scope.

## 5. Decisions requiring human confirmation before implementation

- Mobile admin: full support hay desktop-only policy có controlled gate.
- Mobile primary navigation: bốn hoặc năm destination nào phải luôn hiện.
- Accessible action red: dùng white trên dark red hay black trên bright brand red.
- Legal/privacy/terms/data deletion copy và owner pháp lý.
- Backend admin aggregate endpoint cho dashboard totals.
- Xóa/move `MapPicker`, Widgets, MyDishes, unused assets và Leaflet.
- Bất kỳ thay đổi nào đối với social SDK loading strategy.
- Có cần route riêng thay drawer cho store detail mobile hay giữ adaptive sheet.

## 6. Definition of complete handoff

- Agent triển khai có thể map mỗi thay đổi tới issue ID, phase, file, acceptance và verification.
- Mọi exception có người quyết định, lý do và ngày.
- Không phase nào được gọi “done” khi chỉ đẹp ở một viewport hoặc chỉ mouse-click được.
- Release chỉ được đề xuất khi P0/P1 = 0 open và checklist production có evidence.

---

# AUDIT EXECUTION RECORD

## Commands/checks completed

- `npm run lint`: **PASS**, không warning/error được in ra.
- Production build với biến môi trường audit hợp lệ: **PASS**; build contract fail-fast ban đầu do local `.env` chứa localhost là behavior đúng, không phải source defect.
- Unit/contract tests: **16 PASS** (redaction, UI error mapping, Maps URL, store URL, modal validation, build/nginx contracts).
- Read-only Playwright subset: **6 PASS** (mobile no document horizontal overflow at selected widths, reduced motion, auth Escape/focus restoration). Lưu ý `overflow-x-hidden` có thể che clipping nên kết quả này không phủ định FE-P1-01.
- Public runtime screenshots: các viewport bắt buộc đã kiểm tra; authenticated runtime chưa chạy do không có test credentials và không được biến đổi dữ liệu.

## Definition-of-Done status for this audit

- [x] Đã đọc và áp dụng các skills phù hợp; skill không phù hợp được nêu rõ.
- [x] Đã khám phá framework, route, layout, styling, state, auth và assets.
- [x] Đã lập inventory pages/components/forms/states/flows.
- [x] Đã đánh giá desktop, tablet và mobile bằng code + public runtime.
- [x] Đã đánh giá UX, design system, architecture và performance ở mức công cụ cho phép.
- [x] Đã rà soát development/debug UI và phân loại REMOVE/REPLACE/RESTRICT/KEEP.
- [x] Đã lập P0–P3 backlog với acceptance/verification độc lập.
- [x] Đã đề xuất evolutionary redesign và roadmap sáu phase.
- [x] Đã tạo testing checklist và implementation handoff.
- [ ] Screen reader, real mobile device, authenticated admin/owner runtime, OAuth HTTPS và CWV: **chưa xác minh**, lý do ghi tại Part I.7.
- [x] Không chỉnh sửa source code ứng dụng; chỉ tạo tài liệu audit này.
