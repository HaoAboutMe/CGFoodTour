# Blueprint — Chỉ cập nhật banner khi người dùng áp dụng chỉnh sửa quán

Ngày lập: 17/10/2026
Phạm vi: form chỉnh sửa quán, upload Cloudinary, trạng thái kiểm duyệt và cleanup media.
Trạng thái: đã triển khai code ngày 17/10/2026; còn chờ browser E2E với Cloudinary/database thật.

## 1. Hiện tượng

Trong form chỉnh sửa quán, người dùng chọn banner mới rồi bấm **Quay Lại Danh Sách** mà không bấm **Lưu Thay Đổi Quán Ăn**. Tuy nhiên:

- ảnh mới đã được upload lên Cloudinary;
- `bannerImageUrl` và `bannerImagePublicId` trong database đã đổi;
- ảnh cũ có thể đã bị xóa sau khi transaction commit;
- nút quay lại chỉ đóng form nên không thể phục hồi trạng thái trước đó.

Lỗi xảy ra với quán ở mọi trạng thái như `PENDING`, `APPROVED`, `REJECTED` hoặc `HIDDEN`.

## 2. Nguyên nhân hiện tại

Luồng frontend hiện tại:

```text
chọn file trong form edit
→ handleFileChange(..., "editBanner")
→ handleUploadStoreBanner(storeId, file)
→ PATCH /v1/stores/{id}/banner
→ loadGlobalData()
→ database và Cloudinary đã thay đổi
```

Trong khi đó nút quay lại chỉ gọi `setEditingStore(null)`.

Backend `updateStoreBanner` đang thực hiện đúng một hành động cập nhật độc lập:

```text
upload ảnh mới
→ cập nhật store trong database
→ sau commit xóa ảnh cũ
```

Vấn đề không nằm ở cleanup Cloudinary của endpoint này, mà ở việc frontend gọi endpoint mutation ngay khi người dùng mới chọn file.

Ngoài lỗi cancel, việc upload banner bằng endpoint riêng còn tách banner khỏi lần cập nhật metadata. Với quán `APPROVED`, ảnh có thể đổi ngay trong khi các thay đổi metadata chưa được áp dụng hoặc chưa chuyển qua quy trình duyệt lại.

## 3. Kết quả mong muốn

### Khi chỉ chọn ảnh

- Chỉ tạo preview cục bộ bằng `URL.createObjectURL(file)`.
- Không gọi backend.
- Không upload Cloudinary.
- Không cập nhật database.
- Không reload danh sách quán.

### Khi bấm quay lại/hủy

- Xóa file đang chờ khỏi state.
- Thu hồi object URL bằng `URL.revokeObjectURL`.
- Database, ảnh Cloudinary và trạng thái quán giữ nguyên.

### Khi bấm lưu

- Metadata và banner được gửi trong cùng một thao tác áp dụng.
- Backend xác thực quyền, dữ liệu và file trước khi đổi reference trong database.
- Nếu thành công, response chứa toàn bộ store mới nhất.
- Nếu thất bại, database tiếp tục trỏ đến banner cũ và ảnh mới không bị bỏ mồ côi trên Cloudinary.

## 4. Quyết định thiết kế

Sử dụng một endpoint multipart dành cho thao tác chỉnh sửa hoàn chỉnh. Không sử dụng cơ chế “upload tạm ngay khi chọn file” vì cơ chế đó cần draft token, TTL cleanup và xử lý tab/browser bị đóng.

Giữ endpoint JSON hiện tại để tương thích với client cũ:

```http
PUT /api/v1/stores/{id}
Content-Type: application/json
```

Thêm overload theo `Content-Type`:

```http
PUT /api/v1/stores/{id}
Content-Type: multipart/form-data

store: application/json; StoreRequest
banner: image/jpeg | image/png | image/gif (optional)
```

Frontend form chỉnh sửa chuyển sang endpoint multipart này. Nếu không chọn banner mới, request chỉ có part `store`.

Không đưa file hoặc base64 vào `StoreRequest` JSON.

## 5. Backend blueprint

### 5.1. Controller

Trong `StoreController`:

- giữ method JSON hiện tại với `consumes = application/json`;
- thêm method multipart cùng URL với `consumes = multipart/form-data`;
- nhận `@RequestPart("store") @Valid StoreRequest`;
- nhận `@RequestPart(value = "banner", required = false) MultipartFile`;
- cả hai method gọi chung business service để không lệch authorization hoặc state transition;
- chỉ broadcast `STORES_UPDATED` sau khi service hoàn tất thành công.

### 5.2. Service dùng chung

Tách phần cập nhật metadata hiện tại thành một method nội bộ, ví dụ:

```java
updateStoreInternal(storeId, request, optionalBanner, actorEmail)
```

Thứ tự xử lý:

```text
1. Lock/load store và actor.
2. Kiểm tra owner/admin.
3. Validate StoreRequest, category, Google Maps URL và tọa độ.
4. Nếu có banner: validate loại file, kích thước và nội dung ảnh.
5. Upload ảnh mới lên Cloudinary.
6. Áp dụng metadata và reference ảnh mới lên entity.
7. Áp dụng state transition kiểm duyệt.
8. saveAndFlush database.
9. Transaction commit thành công → xóa ảnh cũ theo best-effort.
10. Transaction rollback/thất bại → xóa ảnh mới theo best-effort.
```

Không xóa ảnh cũ trước khi transaction database commit.

### 5.3. Cleanup ảnh mới khi rollback

Mở rộng `ManagedImageService` bằng helper đăng ký lifecycle cho ảnh mới, hoặc đăng ký `TransactionSynchronization` ngay trong store service:

- `afterCommit`: xóa `oldPublicId`;
- `afterCompletion(STATUS_ROLLED_BACK)`: xóa `newPublicId`;
- nếu lỗi xảy ra trước khi synchronization được đăng ký: gọi `deleteBestEffort(newPublicId)` trong `catch`;
- mọi lỗi delete tiếp tục đi qua `MediaCleanupQueueService`.

Phải tránh trường hợp cùng một `publicId` bị lên lịch xóa hai lần.

### 5.4. Trạng thái kiểm duyệt

Giữ đúng policy hiện có:

- owner sửa quán không ở trạng thái `HIDDEN` → chuyển `PENDING`, `isVerified=false`, xóa rejection cũ;
- admin sửa → giữ state theo policy admin hiện hành;
- quán `HIDDEN` do admin không được owner tự làm public lại thông qua chỉnh sửa;
- thay banner cũng được xem là chỉnh sửa quán, không được bypass state transition bằng endpoint ảnh riêng.

Endpoint `PATCH /v1/stores/{id}/banner` cần chọn một trong hai cách:

1. Khuyến nghị: giữ để tương thích nhưng áp dụng cùng state transition khi actor là owner.
2. Hoặc giới hạn endpoint này cho admin và buộc owner dùng endpoint edit multipart.

Không để owner gọi endpoint banner riêng để thay hình của quán `APPROVED` mà quán vẫn giữ nguyên trạng thái duyệt.

### 5.5. Đồng thời và stale edit

Nên dùng optimistic locking bằng `@Version` trên `Store`, hoặc gửi `updatedAt/version` trong request:

- nếu quán đã được cập nhật ở tab khác, trả `409 Conflict`;
- không để form cũ ghi đè banner hoặc metadata mới hơn;
- đây là phần nên làm trong cùng batch nếu schema local vẫn đang cho phép `ddl-auto=update`.

Nếu chưa đưa optimistic locking vào batch này, phải ghi rõ đây là giới hạn còn lại và không được mô tả thao tác là chống concurrent edit hoàn toàn.

## 6. Frontend blueprint

### 6.1. State mới cho form edit

Trong `MyStoresSection`:

```text
pendingEditBannerFile
editBannerPreviewUrl
originalEditingStore (snapshot hoặc store source không bị mutate)
isSavingStore
```

Không dùng `editingStore.bannerImageUrl` để lưu object URL tạm vào dữ liệu server.

### 6.2. Khi chọn banner

`handleFileChange(..., "editBanner")` chỉ:

- validate sớm MIME và giới hạn 2 MB để phản hồi nhanh;
- revoke preview cũ nếu người dùng chọn lại file;
- lưu `File` vào `pendingEditBannerFile`;
- tạo `editBannerPreviewUrl`;
- hiển thị preview mới kèm nhãn “Chưa lưu”.

Không được gọi:

- `handleUploadStoreBanner`;
- `/v1/stores/{id}/banner`;
- `loadGlobalData()`.

### 6.3. Khi bấm lưu

`handleUpdateStore` nhận thêm file đang chờ hoặc nhận một object form hoàn chỉnh:

```text
FormData
├── store: Blob(JSON, application/json)
└── banner: File (nếu có)
```

Trong lúc request:

- khóa nút lưu, quay lại và input file để tránh double submit;
- không dùng loading toàn trang nếu làm form bị unmount giữa request;
- thành công: cập nhật list từ response, reset file/preview, đóng form và hiển thị toast;
- thất bại: giữ form cùng preview để người dùng sửa hoặc thử lại; không giả định ảnh đã được lưu.

### 6.4. Khi quay lại hoặc đổi quán đang edit

Tạo một hàm duy nhất, ví dụ `discardStoreEdit()`:

- nếu đang save thì không cho đóng form;
- reset `pendingEditBannerFile`;
- revoke `editBannerPreviewUrl`;
- reset state Google Maps/edit phụ trợ;
- `setEditingStore(null)`;
- không gọi API mutation.

Gọi cleanup tương tự trong `useEffect` cleanup khi component unmount.

Nếu metadata hoặc banner đã thay đổi cục bộ, có thể mở modal xác nhận:

```text
Bạn có thay đổi chưa lưu. Bạn có muốn bỏ các thay đổi này không?
```

Không dùng `window.confirm` nếu dự án đã có modal dùng chung.

### 6.5. Preview

Ưu tiên hiển thị:

```text
editBannerPreviewUrl
→ editingStore.bannerImageUrl
→ placeholder
```

Object URL chỉ tồn tại trong vòng đời form và luôn được revoke khi chọn lại, lưu thành công, hủy hoặc unmount để tránh memory leak.

## 7. Không mở rộng ngoài phạm vi

Batch này không cần:

- tạo bảng media draft;
- upload ảnh theo chunk;
- background upload từ frontend;
- thay đổi Cloudinary provider;
- thay đổi toàn bộ workflow moderation sang versioned store draft.

Luồng tạo quán hiện đã giữ file banner ở local trước khi submit nên không phải nguyên nhân trực tiếp của lỗi cancel này. Tuy nhiên cần thêm xử lý rõ ràng nếu tạo store thành công nhưng upload banner thất bại; có thể làm ở batch tiếp theo hoặc tái sử dụng endpoint multipart create sau khi edit flow ổn định.

## 8. Test bắt buộc

### 8.1. Frontend

- Chọn banner mới không tạo network request.
- Chọn banner rồi quay lại: không gọi upload/update API.
- Chọn lại banner: object URL trước được revoke.
- Bấm lưu không có ảnh: gửi multipart chỉ với `store`.
- Bấm lưu có ảnh: gửi đúng `store` và `banner`.
- Backend trả lỗi: form và preview vẫn còn để retry.
- Thành công: preview được revoke, form đóng và list dùng response mới.
- Double click lưu chỉ tạo một request.

### 8.2. Backend

- Owner/admin hợp lệ cập nhật metadata không có banner.
- Owner cập nhật banner của quán `APPROVED` làm quán chuyển `PENDING` theo policy hiện tại.
- Quán `HIDDEN` không được owner làm public lại.
- Unauthorized user không làm phát sinh upload Cloudinary.
- File không hợp lệ không làm thay đổi database.
- Upload lỗi không làm thay đổi metadata/banner reference.
- Database save/commit lỗi xóa ảnh mới hoặc đưa vào cleanup queue.
- Commit thành công mới xóa ảnh cũ.
- Xóa ảnh cũ lỗi không rollback cập nhật đã commit và tạo cleanup task.
- JSON endpoint cũ vẫn hoạt động.

### 8.3. E2E thủ công

Chạy với quán ở từng trạng thái `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`:

1. Ghi lại URL/public ID ảnh cũ.
2. Mở edit, chọn ảnh mới, bấm quay lại.
3. Reload trang và kiểm tra ảnh/database/Cloudinary không đổi, không có asset mới.
4. Mở lại, chọn ảnh và bấm lưu.
5. Kiểm tra metadata, banner và state transition cùng phản ánh một lần apply.
6. Mô phỏng Cloudinary lỗi và database lỗi để kiểm tra rollback/cleanup.

## 9. Thứ tự triển khai

### Phase 1 — Backend contract

- Thêm multipart overload.
- Tái sử dụng authorization, validation và moderation transition.
- Hoàn thiện commit/rollback cleanup cho ảnh mới/cũ.
- Sửa hoặc giới hạn endpoint PATCH banner để không bypass moderation.
- Viết unit/integration tests.

### Phase 2 — Frontend staging

- Thêm pending file và preview state.
- Loại bỏ upload trong `handleFileChange(editBanner)`.
- Gửi multipart duy nhất khi lưu.
- Thêm discard cleanup và modal cảnh báo thay đổi chưa lưu.
- Viết frontend tests.

### Phase 3 — Xác nhận

- Chạy backend test, frontend test/build/lint.
- Chạy E2E cho bốn trạng thái quán.
- Kiểm tra Cloudinary không xuất hiện orphan asset trong luồng cancel/failure.
- Cập nhật `API_REFERENCE.md`, `KNOWN_ISSUES.md` và tài liệu thay đổi.

## 10. Definition of Done

- [x] Chọn banner trong form edit không tạo request backend.
- [x] Quay lại/hủy không thay đổi database hoặc Cloudinary.
- [x] Metadata và banner chỉ được áp dụng sau khi người dùng bấm lưu.
- [x] Database rollback không để lại ảnh mới không được tham chiếu.
- [x] Ảnh cũ chỉ bị xóa sau commit thành công.
- [x] Thay banner không bypass workflow moderation.
- [x] Preview object URL được cleanup đầy đủ.
- [x] Backend và frontend tests pass.
- [ ] E2E pass cho `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`.
- [x] Tài liệu API/issues phản ánh contract mới.

### Kết quả triển khai

- Frontend giữ `pendingEditBannerFile` và object URL preview; chọn ảnh không còn gọi `PATCH /banner`.
- Nút đóng/quay lại dùng modal bỏ thay đổi chưa lưu và dọn object URL.
- Form lưu gửi multipart gồm part JSON `store` và optional `banner`.
- Backend giữ JSON contract cũ, đồng thời nhận multipart cùng URL `PUT /v1/stores/{id}`.
- Ảnh mới được dọn khi transaction rollback; ảnh cũ chỉ được dọn sau commit và vẫn dùng cleanup queue khi Cloudinary delete lỗi.
- `PATCH /banner` được giữ để tương thích nhưng owner sửa banner của quán non-hidden sẽ chuyển quán về `PENDING`.
- Automated verification: backend 56 test pass; frontend production build và các test hiện có pass; lint không có error và còn warning cũ.
- Chưa thêm optimistic locking trong batch này; concurrent edit giữa nhiều tab vẫn là giới hạn còn lại.
