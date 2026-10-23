# SEO, prerender và sitemap backlog

> Trạng thái: BACKLOG — không thuộc phạm vi triển khai Blueprint 11
> Điều kiện bắt đầu: có domain canonical và staging HTTPS ổn định

## Mục tiêu

Giúp trang chi tiết quán có nội dung HTML và metadata phù hợp ngay khi bot hoặc ứng dụng chia sẻ truy cập, thay vì phụ thuộc hoàn toàn vào JavaScript phía trình duyệt.

## Công việc dự kiến

1. Chọn chiến lược render cho route `/quan/{storeId}/{slug}`: SSR, static prerender có revalidation, hoặc dịch vụ render dành cho crawler.
2. Chỉ index quán `APPROVED`; quán `PENDING`, `REJECTED`, `HIDDEN` và đã xóa phải trả `404` hoặc `noindex` theo visibility policy.
3. Render server-side `title`, description, canonical URL, Open Graph image và structured data `LocalBusiness` từ public store DTO.
4. Sinh `sitemap.xml` động theo dữ liệu đã duyệt, có `lastmod`, phân trang nếu vượt giới hạn sitemap và loại bỏ URL không còn public.
5. Thêm `robots.txt` theo từng môi trường: staging chặn index, production chỉ cho index route public.
6. Kiểm tra preview thật trên Google, Facebook và Zalo sau khi có domain HTTPS.

## Tiêu chí nghiệm thu

- View source của deep link chứa metadata riêng của quán mà không cần chạy JavaScript.
- Canonical chỉ trỏ về domain production và không chứa query tracking.
- Sitemap không lộ quán không public.
- Reload/deep link vẫn hoạt động; bot nhận HTTP status đúng.
- Không đưa email chủ quán, moderation reason hoặc dữ liệu nội bộ vào metadata/structured data.

## Lý do tách khỏi Blueprint 11

SPA hiện đã cập nhật title, description, canonical và URL chia sẻ đúng trong trình duyệt. SSR/prerender làm thay đổi kiến trúc build/deploy và chỉ kiểm chứng đầy đủ khi có domain thật, vì vậy cần một batch độc lập thay vì trộn vào đợt UX local.
