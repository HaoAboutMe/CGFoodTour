# Blueprint 11 — Pre-beta UX and Quality Polish

> Trạng thái: PROPOSED — thực hiện sau các P0 release gate  
> Ưu tiên: P1/P2  
> Phạm vi duy nhất: chất lượng giao diện và trải nghiệm trước beta

## 1. Mục tiêu

Loại bỏ các điểm gây khó hiểu, thiếu nhất quán hoặc tạo cảm giác sản phẩm chưa hoàn thiện mà không mở rộng thêm nghiệp vụ lớn.

## 2. Workstream

### U1. Modal và feedback

- Thay `window.prompt()` xóa user bằng modal chuẩn có username confirmation và reason.
- Chuẩn hóa màu, kích thước, loading và disabled state cho destructive actions.
- Mọi lỗi API hiển thị tiếng Việt theo code; không dùng raw English message.
- Thêm empty/error/retry state cho danh sách quan trọng.

### U2. React correctness

- Phân loại toàn bộ lint warning: unused, hook dependency, set-state-in-effect, fast refresh.
- Ưu tiên warning có thể gây stale closure/request sai.
- Không thêm dependency máy móc gây loop; viết test cho behavior trước khi sửa effect phức tạp.
- Thiết lập lint budget để warning mới làm CI fail.

### U3. Responsive/accessibility

- Kiểm tra 320, 360, 375, 768 và desktop widths.
- Keyboard navigation, focus trap/restore cho modal/drawer.
- Label, accessible name, contrast và touch target tối thiểu.
- Test reduced motion và zoom 200% cho luồng chính.

### U4. Performance/assets

- Tối ưu logo 667 KB thành nhiều kích thước phù hợp.
- Dùng local fallback image thay Unsplash runtime dependency.
- Lazy-load ảnh ngoài viewport và đặt width/height giảm layout shift.
- Đo Lighthouse/Web Vitals trên staging; tối ưu theo số liệu.

### U5. Discovery/share polish

- Kiểm tra nearby/search/filter semantics với dữ liệu đủ lớn.
- Chuẩn hóa share/copy feedback.
- Đảm bảo canonical URL, title và description cập nhật đúng khi mở/đóng drawer.
- Lập backlog riêng cho SSR/prerender và sitemap; không trộn vào batch UX nếu chưa được duyệt.

## 3. Kiểm thử bắt buộc

- Component/utility tests cho error mapping và modal validation.
- Playwright keyboard/modal flows.
- Visual smoke trên desktop/mobile.
- Không có horizontal overflow ngoài thành phần cố ý.
- Production build/lint không có error và warning count giảm theo baseline.
- Lighthouse được đo cùng thiết bị/network profile trước và sau.

## 4. Tiêu chí hoàn thành

- [ ] Không còn native prompt/alert trong luồng quản trị chính.
- [ ] Không còn hook warning mức correctness chưa xử lý.
- [ ] Auth/store/admin flows dùng được bằng bàn phím.
- [ ] Giao diện ổn định từ 320 px trở lên.
- [ ] Logo/fallback assets được tối ưu và self-host.
- [ ] Có số liệu performance staging và không có regression đáng kể.
- [ ] UX issues còn lại được phân loại, không chặn closed beta.

## 5. Rollback

Mỗi nhóm U1–U5 nên là commit độc lập. Khi visual/behavior regression xuất hiện, revert đúng nhóm thay vì rollback các thay đổi security hoặc database.

