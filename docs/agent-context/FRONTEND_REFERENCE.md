# Frontend Reference

## 1. Khởi tạo và kiến trúc

`src/main.jsx` mount React 19 trong `StrictMode` + `BrowserRouter`. `App.jsx` là application shell và orchestration layer: token, user, data, form state, manual route selection, API wrapper, SSE, social SDK và callback nghiệp vụ.

Không có Context/Redux/React Query/form library/type system. Các page nhận state/action qua props. `AdminSection`, `MyStoresSection`, `CS2CaseOpener`, `DevConsole` lazy-load; các page nhỏ import eager.

Styling: Tailwind 4 qua Vite plugin + `index.css`; design neo-brutalist; icons Lucide. Leaflet được dùng trong `MapPicker`, Photon là geocoding provider.

## 2. Route/Page catalog

URL được đọc bằng `location.pathname.substring(1)` và kiểm whitelist trong `App.jsx:146-174`; không có `<Routes>`.

| URL | Page | Guard UI | Data/API và thao tác |
|---|---|---|---|
| `/` | `ExploreSection` (URL giữ nguyên `/`) | Public | categories/stores |
| `/explore` | `ExploreSection` | Public | tìm kiếm, category multi-filter, gần tôi, đang mở, grid/compact, detail/save |
| `/cs2-spinner` | `CS2CaseOpener` | Public | quay local trên `stores`: all/one/multi category/custom stores, open-only |
| `/saved` | `SavedStoresSection` | Public shell; prompt login | saved list/search/detail/unsave |
| `/about` | `AboutSection` | Public | nội dung giới thiệu/CTA |
| `/profile` | `ProfileSection` | token + `currentUser` | self info/avatar/password |
| `/my-stores` | `MyStoresSection` | token + `currentUser` | create/edit/hide/recover/delete stores; dishes; submissions |
| `/admin` | `AdminSection` | token; component kiểm ADMIN | dashboard, moderation, users, categories |

Unknown path không redirect explicit: ở lần tải đầu `activeTab` mặc định vẫn là Explore; nếu path đổi từ một tab đang mở, tab trước có thể vẫn được giữ. Guard token chỉ kiểm chuỗi localStorage; profile fetch/backend vẫn là nguồn xác thực thật.

## 3. Các page/component chính

### ExploreSection

- Chỉ hiển thị store `APPROVED` dù backend đã filter.
- Search name/address/landmark/food; category filter; open-now từ local clock; near-me từ browser Geolocation và Haversine.
- Nếu store thiếu tọa độ, code tạo fallback từ phép toán `st.id % n`; ID là string nên có thể thành `NaN`, làm distance không tin cậy.
- Infinite batching bằng `visibleCount`, không phải server pagination.

### StoreCard / StoreDetailDrawer

Hiển thị banner, category, open status, location/price/rating/save. Drawer hiển thị food items; action rating, report closed bằng lat/lng state, bookmark. Rating/report callback sẽ mở login nếu không có token.

### MyStoresSection

Owner portal ba bước tạo store; chỉnh sửa accordion; quản lý món; trạng thái submission; moderation self-service. Client parse tọa độ bằng regex; short HTTP URL fallback sang backend parser. Form validation bắt name/category/landmark/address/GPS nhưng backend không bắt GPS.

`MapPicker` được import/state khai báo nhưng lint báo unused trong section hiện tại. Upload banner/food gọi generic Cloudinary endpoint trước khi store/item được lưu, nên asset orphan có thể tồn tại nếu người dùng bỏ form.

### AdminSection

Guard `isUserAdmin` trả access-denied UI. Tabs: dashboard, all stores/moderation, users, categories. Filter/pagination đều client-side trên arrays đã tải. Không có UI role/permission catalog. Nhiều props liên quan food upload hiện unused theo lint.

### CS2CaseOpener

Toàn bộ selection/spin chạy client-side trên approved stores đã tải; `requestAnimationFrame` 5 giây và Web Audio tick. Không gọi backend random API; `App` vẫn giữ handlers random/ranking nhưng Explore không dùng chúng theo lint.

### AuthModal

Login/register/social/manual token, forgot password 3 bước, manual verification token/resend. Google/Facebook SDK script nằm trong `index.html`; App khởi tạo callbacks. Dev-mode manual OAuth token UI hiển thị cho mọi người mở modal.

## 4. HTTP client và session

Base URL:

```js
VITE_API_BASE_URL || (DEV ? 'http://localhost:8080/api' : '/api')
```

`makeRequest(method, endpoint, body, isMultipart)`:

- Lấy `jwtToken` từ localStorage/state; gắn Authorization.
- JSON stringify hoặc FormData.
- Không có timeout/AbortController.
- Parse JSON theo content-type, còn lại text.
- HTTP 401 (trừ login/refresh/social) → gọi refresh rồi retry một lần.
- Nếu refresh thất bại → clear session.
- 403 không có xử lý chung; caller toast error.
- Network error trả `{success:false,error:{message}}`.

SSE dùng native EventSource nên không gửi Bearer; endpoint vì vậy public. Reconnect sau 5 giây, cleanup close/timeout đúng lúc effect unmount/token đổi.

## 5. Auth client

- `jwtToken` và `refreshToken` trong localStorage; backend chỉ trả token nên login ban đầu lưu refresh string rỗng.
- Refresh-on-401 chỉ chạy nếu `refreshToken` có giá trị; proactive refresh fallback sang access token và sau lần thành công lưu token mới làm refresh token. Login ban đầu lưu `refreshToken=''`, nên access token dev 5 phút có thể hết hạn trước interval 10 phút. Nhánh refresh-on-401 còn giữ token refresh cũ khi backend không trả `refreshToken`, dù backend vừa blacklist token đó.
- Reload: token state → fetch `/users/me`; invalid token cuối cùng bị 401/refresh/logout.
- Logout chỉ local; không gọi `/auth/logout`, vì vậy JWT vẫn hợp lệ server-side đến expiry.
- `storage` listener đồng bộ tab khác.
- Role lấy từ profile response; UI admin ẩn theo role nhưng authorization backend độc lập.

JWT trong localStorage có rủi ro bị đọc nếu có XSS. Không thấy `dangerouslySetInnerHTML` trong React source, nhưng third-party scripts vẫn nằm trong trust boundary.

## 6. Form validation và mismatch

- Register: username regex 3–20 ASCII/number/underscore, email max50, password min6, confirm; không gửi DOB dù state/form có `regDob`; gọi sai endpoint `/auth/register`.
- Backend registration yêu cầu password min8 và DOB min5.
- Profile UI ghi password min6; backend DTO nói min8 nhưng controller thiếu `@Valid`, runtime hiện nhận ngắn hơn nếu old password đúng.
- Manual verify-email coi mọi HTTP 200 là thành công; backend bắt lỗi và trả HTML error page vẫn với HTTP 200, nên token sai cũng tạo success toast trong SPA.
- Store form client đòi GPS; backend cho phép null. Backend đòi times/address/landmark/category/name.
- Image upload generic không client-limit rõ ở common handler; avatar UI/backend có 2 MiB.

## 7. State/loading/error behavior

- Một boolean `loading` toàn app; concurrent requests có thể bật/tắt chồng nhau.
- `loadGlobalData` không hiển thị toast khi category/store fetch thất bại và vẫn tắt loading.
- Nhiều action reload toàn bộ categories/stores sau mutation.
- SSE cũng reload global data, tạo request duplication sau mutation broadcast.
- Empty states có ở Explore, Saved, MyStores, spinner; admin failure thường trả empty list/toast.
- Không có error boundary.

## 8. Quality/performance findings

`npm run lint` thành công nhưng có cảnh báo:

- Unused imports/props/state ở Widgets, Explore, Header, Admin, MyStores, CS2.
- `set-state-in-effect` ở BottomNav, StoreActionModal, CS2, MyStores.
- Missing hook dependencies ở MapPicker/MyStores.
- `processGmapsUrlInput` được đọc trong effect trước declaration theo rule `react/immutability`.
- Fast-refresh warning khi component file export thêm helper/constant.

Đã có code splitting cho ba page nặng. Chưa có bundle report/build result do sandbox từ chối build. Component size và prop drilling là vấn đề bảo trì có bằng chứng, nhưng chưa đo re-render bằng profiler.

## 9. Files cần đọc theo thay đổi

- Auth: `App.jsx` (state/effects/makeRequest/handlers), `AuthModal.jsx`, `Header.jsx`, `BottomNav.jsx`.
- Discovery: `ExploreSection.jsx`, `StoreCard.jsx`, `StoreDetailDrawer.jsx`, `timeUtils.js`.
- Store/dish: `App.jsx`, `MyStoresSection.jsx`, `MyDishesSection.jsx`, `MySubmissionsSection.jsx`, `StoreActionModal.jsx`.
- Admin: `App.jsx`, `AdminSection.jsx`, common category/modal components.
- Map: `MyStoresSection.jsx`, `MapPicker.jsx`, backend parse API.
- API base/build: `.env.example`, `vite.config.js`, `package.json`, `index.html`.

