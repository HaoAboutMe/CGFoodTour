package com.cangiuoc.cgfoodtour.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("EmailTemplateBuilder & Content Verification Tests (Batch 3F-E)")
class EmailTemplateBuilderTest {

    @Nested
    @DisplayName("1. Email Verification Template")
    class VerificationEmailTests {

        @Test
        @DisplayName("renders HTML with branded header, 24-hour expiry, button CTA and fallback link")
        void rendersVerificationHtmlProperly() {
            String link = "https://cgfoodtour.com/api/auth/verify-email/complete?token=test-token-123";
            String html = EmailTemplateBuilder.buildVerificationHtml(link);

            assertThat(html)
                    .contains("CẦN GIUỘC FOODTOUR")
                    .contains("XÁC THỰC EMAIL")
                    .contains("Kích Hoạt Tài Khoản Của Bạn")
                    .contains("24 giờ")
                    .contains("Kích Hoạt Tài Khoản Ngay ↗")
                    .contains(link)
                    .contains("cangiuocfoodtour@gmail.com")
                    .contains("role=\"presentation\"")
                    .contains("max-width: 600px")
                    .doesNotContain("<script>")
                    .doesNotContain("%s");
        }

        @Test
        @DisplayName("escapes dangerous characters in verification link")
        void escapesDangerousLinkCharacters() {
            String maliciousLink = "https://cgfoodtour.com/verify?token=abc\"><script>alert(1)</script>";
            String html = EmailTemplateBuilder.buildVerificationHtml(maliciousLink);

            assertThat(html)
                    .doesNotContain("<script>alert(1)</script>")
                    .contains("&lt;script&gt;alert(1)&lt;/script&gt;");
        }

        @Test
        @DisplayName("renders plain-text alternative with all essential details and 24-hour expiry")
        void rendersVerificationPlainTextProperly() {
            String link = "https://cgfoodtour.com/api/auth/verify-email/complete?token=test-token-123";
            String plain = EmailTemplateBuilder.buildVerificationPlainText(link);

            assertThat(plain)
                    .contains("CẦN GIUỘC FOODTOUR - XÁC THỰC TÀI KHOẢN")
                    .contains("24 giờ")
                    .contains(link)
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("<html>")
                    .doesNotContain("%s");
        }
    }

    @Nested
    @DisplayName("2. OTP Password Reset Template")
    class OtpEmailTests {

        @Test
        @DisplayName("renders HTML with prominent 6-digit OTP, 5-minute expiry and security warnings")
        void rendersOtpHtmlProperly() {
            String otp = "849205";
            String html = EmailTemplateBuilder.buildOtpHtml(otp);

            assertThat(html)
                    .contains("CẦN GIUỘC FOODTOUR")
                    .contains("BẢO MẬT &amp; OTP")
                    .contains("MÃ OTP XÁC THỰC")
                    .contains(otp)
                    .contains("5 phút")
                    .contains("KHÔNG chia sẻ mã này")
                    .contains("cangiuocfoodtour@gmail.com")
                    .contains("max-width: 600px")
                    .doesNotContain("%s");
        }

        @Test
        @DisplayName("handles null OTP safely with fallback placeholder")
        void handlesNullOtpSafely() {
            String html = EmailTemplateBuilder.buildOtpHtml(null);
            assertThat(html).contains("------").doesNotContain("null");
        }

        @Test
        @DisplayName("renders plain-text OTP with 5-minute expiry")
        void rendersOtpPlainTextProperly() {
            String otp = "849205";
            String plain = EmailTemplateBuilder.buildOtpPlainText(otp);

            assertThat(plain)
                    .contains("CẦN GIUỘC FOODTOUR - MÃ OTP ĐẶT LẠI MẬT KHẨU")
                    .contains("[ 849205 ]")
                    .contains("5 phút")
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("<html>")
                    .doesNotContain("%s");
        }
    }

    @Nested
    @DisplayName("3. Account Disabled Template")
    class AccountDisabledEmailTests {

        @Test
        @DisplayName("renders HTML with reason, escaped username, and support contact")
        void rendersAccountDisabledHtmlProperly() {
            String username = "foodlover_01";
            String reason = "Vi phạm quy tắc cộng đồng: spam đánh giá ảo.";
            String html = EmailTemplateBuilder.buildAccountDisabledHtml(username, reason);

            assertThat(html)
                    .contains("CẦN GIUỘC FOODTOUR")
                    .contains("QUẢN TRỊ VIÊN")
                    .contains("Thông Báo Khóa Tài Khoản")
                    .contains("@foodlover_01")
                    .contains("Vi phạm quy tắc cộng đồng: spam đánh giá ảo.")
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("%s");
        }

        @Test
        @DisplayName("escapes XSS payloads in username and reason")
        void escapesXssPayloadsInAccountDisabled() {
            String username = "<script>alert('user')</script>";
            String reason = "<b>bold</b> <img src=x onerror=alert(1)>";
            String html = EmailTemplateBuilder.buildAccountDisabledHtml(username, reason);

            assertThat(html)
                    .doesNotContain("<script>alert('user')</script>")
                    .contains("&lt;script&gt;alert(&#39;user&#39;)&lt;/script&gt;")
                    .doesNotContain("<img src=x")
                    .contains("&lt;img src=x");
        }

        @Test
        @DisplayName("handles null/blank username and reason safely")
        void handlesNullAccountDisabledInputs() {
            String html = EmailTemplateBuilder.buildAccountDisabledHtml(null, null);
            assertThat(html)
                    .contains("người dùng")
                    .contains("Không có lý do chi tiết từ quản trị viên.")
                    .doesNotContain("null");
        }

        @Test
        @DisplayName("renders plain-text alternative for account disabled")
        void rendersAccountDisabledPlainTextProperly() {
            String plain = EmailTemplateBuilder.buildAccountDisabledPlainText("foodlover", "Spam");
            assertThat(plain)
                    .contains("CẦN GIUỘC FOODTOUR - THÔNG BÁO KHÓA TÀI KHOẢN")
                    .contains("@foodlover")
                    .contains("\"Spam\"")
                    .contains("cangiuocfoodtour@gmail.com");
        }
    }

    @Nested
    @DisplayName("4. Account Enabled Template")
    class AccountEnabledEmailTests {

        @Test
        @DisplayName("renders HTML with welcome back message and support contact")
        void rendersAccountEnabledHtmlProperly() {
            String username = "hoanhao";
            String html = EmailTemplateBuilder.buildAccountEnabledHtml(username);

            assertThat(html)
                    .contains("CẦN GIUỘC FOODTOUR")
                    .contains("TÀI KHOẢN")
                    .contains("Chào Mừng Bạn Trở Lại")
                    .contains("@hoanhao")
                    .contains("TÀI KHOẢN ĐÃ SẴN SÀNG HOẠT ĐỘNG")
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("%s");
        }

        @Test
        @DisplayName("renders plain-text alternative for account enabled")
        void rendersAccountEnabledPlainTextProperly() {
            String plain = EmailTemplateBuilder.buildAccountEnabledPlainText("hoanhao");
            assertThat(plain)
                    .contains("CẦN GIUỘC FOODTOUR - CHÀO MỪNG BẠN TRỞ LẠI")
                    .contains("@hoanhao")
                    .contains("cangiuocfoodtour@gmail.com");
        }
    }

    @Nested
    @DisplayName("5. Store Status Notification Template")
    class StoreStatusNotificationTests {

        @Test
        @DisplayName("renders HIDE status with clear recovery instructions for owner")
        void rendersHideStatusHtmlProperly() {
            String storeName = "Bánh Xèo Rau Rừng";
            String reason = "Chưa cập nhật giấy ATVSTP.";
            String html = EmailTemplateBuilder.buildStoreStatusHtml(storeName, "HIDE", reason);

            assertThat(html)
                    .contains("CẦN GIUỘC FOODTOUR")
                    .contains("QUÁN ĂN")
                    .contains("Quán Ăn Của Bạn Đã Bị Tạm Ẩn")
                    .contains("Bánh Xèo Rau Rừng")
                    .contains("ĐÃ TẠM ẨN")
                    .contains("Chưa cập nhật giấy ATVSTP.")
                    .contains("HƯỚNG DẪN TIẾP THEO")
                    .contains("Quán Ăn Của Tôi")
                    .contains("gửi yêu cầu khôi phục")
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("%s");
        }

        @Test
        @DisplayName("renders REJECT_RECOVERY_REQUEST status with guidance")
        void rendersRejectRecoveryStatusHtmlProperly() {
            String storeName = "Bún Riêu Cua Đồng";
            String reason = "Ảnh chụp thực tế chưa rõ nét.";
            String html = EmailTemplateBuilder.buildStoreStatusHtml(storeName, "REJECT_RECOVERY_REQUEST", reason);

            assertThat(html)
                    .contains("Yêu Cầu Khôi Phục Quán Ăn Bị Từ Chối")
                    .contains("TỪ CHỐI KHÔI PHỤC")
                    .contains("Bún Riêu Cua Đồng")
                    .contains("Ảnh chụp thực tế chưa rõ nét.");
        }

        @Test
        @DisplayName("renders HARD_DELETE status with finality explanation")
        void rendersHardDeleteStatusHtmlProperly() {
            String storeName = "Trà Sữa 247";
            String reason = "Ngừng kinh doanh quá 6 tháng.";
            String html = EmailTemplateBuilder.buildStoreStatusHtml(storeName, "HARD_DELETE", reason);

            assertThat(html)
                    .contains("Thông Báo Xóa Quán Ăn Khỏi Hệ Thống")
                    .contains("ĐÃ XÓA VĨNH VIỄN")
                    .contains("Trà Sữa 247")
                    .contains("toàn bộ dữ liệu thực đơn liên quan đã được xóa");
        }

        @Test
        @DisplayName("escapes dynamic store names and reasons with multi-line breaks")
        void escapesStoreNameAndMultilineReason() {
            String storeName = "Quán <script>evil()</script> & \"Ngon\"";
            String reason = "Dòng 1\nDòng 2\r\nDòng 3";
            String html = EmailTemplateBuilder.buildStoreStatusHtml(storeName, "HIDE", reason);

            assertThat(html)
                    .doesNotContain("<script>evil()</script>")
                    .contains("&lt;script&gt;evil()&lt;/script&gt;")
                    .contains("&amp; &quot;Ngon&quot;")
                    .contains("Dòng 1<br>Dòng 2<br>Dòng 3");
        }

        @Test
        @DisplayName("renders plain-text alternative for store status")
        void rendersStoreStatusPlainTextProperly() {
            String plain = EmailTemplateBuilder.buildStoreStatusPlainText("Bánh Xèo Cần Giuộc", "HIDE", "Vi phạm giờ mở cửa");

            assertThat(plain)
                    .contains("CẦN GIUỘC FOODTOUR - THÔNG BÁO VỀ QUÁN ĂN")
                    .contains("Tên quán: Bánh Xèo Cần Giuộc")
                    .contains("Trạng thái hiện tại: ĐÃ BỊ TẠM ẨN")
                    .contains("\"Vi phạm giờ mở cửa\"")
                    .contains("gửi yêu cầu khôi phục")
                    .contains("cangiuocfoodtour@gmail.com")
                    .doesNotContain("<html>");
        }
    }
}
