import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREVIEWS_DIR = path.resolve(__dirname, '../e2e/email-previews/after');

fs.mkdirSync(PREVIEWS_DIR, { recursive: true });

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BRAND_NAME = 'CẦN GIUỘC FOODTOUR';
const SUPPORT_EMAIL = 'cangiuocfoodtour@gmail.com';
const COPYRIGHT_YEAR = '2026';

function wrapEmailLayout(title, badgeText, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="vi" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Basic resets for clients supporting style blocks */
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F6F2; }
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .email-content { padding: 22px 16px !important; }
            .header-table td { padding: 12px 14px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F6F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!-- Full width canvas -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F7F6F2" style="background-color: #F7F6F2; width: 100%; margin: 0; padding: 28px 12px;">
        <tr>
            <td align="center">
                <!-- Main Container Card (600px max) -->
                <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border: 2.5px solid #111827; border-radius: 16px; box-shadow: 6px 6px 0px #111827; overflow: hidden;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="border-bottom: 2.5px solid #111827; background-color: #FFFFFF; padding: 18px 24px;">
                            <table role="presentation" class="header-table" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" style="vertical-align: middle;">
                                        <span style="display: inline-block; background-color: #C92A2A; color: #FFFFFF; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 999px; border: 1.5px solid #111827;">
                                            🍜 ${BRAND_NAME}
                                        </span>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <span style="font-size: 11px; font-weight: 800; color: #4B5563; text-transform: uppercase; letter-spacing: 0.8px;">
                                            ${escapeHtml(badgeText)}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content Body -->
                    <tr>
                        <td class="email-content" style="padding: 30px 26px; color: #111827; font-size: 15px; line-height: 1.6;">
                            ${bodyHtml}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="border-top: 2px solid #E5E7EB; background-color: #FAFAFA; padding: 22px 24px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; color: #6B7280; font-weight: 600;">
                                Đây là email tự động từ hệ thống Cần Giuộc FoodTour. Vui lòng không trả lời trực tiếp email này.
                            </p>
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #4B5563;">
                                Hỗ trợ kỹ thuật & đóng góp ý kiến: <a href="mailto:${SUPPORT_EMAIL}" style="color: #C92A2A; font-weight: 700; text-decoration: none;">${SUPPORT_EMAIL}</a>
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #9CA3AF; font-weight: 500;">
                                &copy; ${COPYRIGHT_YEAR} Cần Giuộc FoodTour Team. Mọi quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// 1. Verification
function buildVerificationHtml(verificationLink) {
  const safeLink = escapeHtml(verificationLink || '');
  const contentHtml = `
<h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.3px;">
    Kích Hoạt Tài Khoản Của Bạn 🚀
</h2>
<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #374151;">
    Xin chào bạn,<br><br>
    Cảm ơn bạn đã đăng ký tài khoản tại <strong>Cần Giuộc FoodTour</strong>!
    Để bắt đầu trải nghiệm bản đồ ẩm thực đặc sản và lưu lại những quán ăn yêu thích,
    vui lòng bấm vào nút bên dưới để xác thực tài khoản:
</p>

<!-- CTA Button -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto;" align="center">
    <tr>
        <td align="center" bgcolor="#C92A2A" style="border-radius: 10px; border: 2.5px solid #111827; box-shadow: 3px 3px 0px #111827; background-color: #C92A2A;">
            <a href="${safeLink}" target="_blank" style="font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF !important; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 28px; display: inline-block;">
                Kích Hoạt Tài Khoản Ngay ↗
            </a>
        </td>
    </tr>
</table>

<!-- Expiry & Fallback Link Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 2px solid #111827; border-radius: 12px; margin: 24px 0 20px 0;">
    <tr>
        <td style="padding: 16px 18px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #111827;">
                ⏰ <strong>Thời hạn hiệu lực:</strong> Liên kết kích hoạt này có hiệu lực trong vòng <strong>24 giờ</strong>.
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #4B5563;">
                Nếu nút bấm trên không mở được, bạn hãy sao chép liên kết dưới đây và dán trực tiếp vào trình duyệt:
            </p>
            <div style="background-color: #FFFFFF; border: 1.5px solid #D1D5DB; border-radius: 8px; padding: 10px 14px; word-break: break-all;">
                <a href="${safeLink}" style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #C92A2A; text-decoration: underline; font-weight: 600;">${safeLink}</a>
            </div>
        </td>
    </tr>
</table>

<!-- Security Notice -->
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6B7280;">
    🔒 <strong>Lưu ý an toàn:</strong> Nếu bạn không thực hiện đăng ký tài khoản tại Cần Giuộc FoodTour, vui lòng bỏ qua email này. Tài khoản sẽ không được kích hoạt nếu không bấm vào liên kết xác nhận.
</p>`;

  return wrapEmailLayout("Xác Thực Tài Khoản", "XÁC THỰC EMAIL", contentHtml);
}

// 2. OTP
function buildOtpHtml(otp) {
  const safeOtp = escapeHtml(otp || '------');
  const contentHtml = `
<h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.3px;">
    Yêu Cầu Đặt Lại Mật Khẩu 🔐
</h2>
<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #374151;">
    Xin chào bạn,<br><br>
    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Cần Giuộc FoodTour liên kết với địa chỉ email này.
    Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để tiến hành đổi mật khẩu mới:
</p>

<!-- OTP Display Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto;" align="center">
    <tr>
        <td align="center" bgcolor="#FFFBEB" style="border-radius: 12px; border: 2.5px solid #111827; box-shadow: 4px 4px 0px #111827; background-color: #FFFBEB; padding: 18px 40px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #4B5563; margin-bottom: 6px;">MÃ OTP XÁC THỰC</div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #C92A2A; font-family: 'Courier New', Courier, monospace; line-height: 1.2;">
                ${safeOtp}
            </div>
        </td>
    </tr>
</table>

<!-- Security & Expiration Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF2F2; border: 2px solid #111827; border-radius: 12px; margin: 20px 0 18px 0;">
    <tr>
        <td style="padding: 14px 18px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #991B1B;">
                ⏰ <strong>Thời hạn:</strong> Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; color: #7F1D1D; line-height: 1.5;">
                🔒 <strong>Bảo mật:</strong> Tuyệt đối <strong>KHÔNG chia sẻ mã này</strong> cho bất kỳ ai, kể cả quản trị viên hay nhân viên hỗ trợ của CGFoodTour.
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6B7280;">
    Nếu bạn không gửi yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể yên tâm bỏ qua email này.
</p>`;

  return wrapEmailLayout("Mã OTP Đặt Lại Mật Khẩu", "BẢO MẬT & OTP", contentHtml);
}

// 3. Account Disabled
function buildAccountDisabledHtml(username, reason) {
  const safeUsername = escapeHtml(username || 'người dùng');
  const safeReason = escapeHtml(reason || 'Không có lý do chi tiết từ quản trị viên.').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');

  const contentHtml = `
<h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.3px;">
    Thông Báo Khóa Tài Khoản ⚠️
</h2>
<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
    Xin chào <strong>@${safeUsername}</strong>,<br><br>
    Ban quản trị Cần Giuộc FoodTour xin thông báo tài khoản của bạn đã bị tạm khóa do vi phạm chính sách hoặc tiêu chuẩn cộng đồng của hệ thống.
    Các phiên đăng nhập hiện tại đã được thu hồi và bạn sẽ tạm thời không thể đăng nhập cho đến khi tài khoản được mở khóa.
</p>

<!-- Reason Box -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF2F2; border: 2px solid #111827; border-radius: 12px; margin: 20px 0;">
    <tr>
        <td style="padding: 16px 18px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #991B1B; letter-spacing: 0.5px;">
                📌 LÝ DO KHÓA TÀI KHOẢN TỪ QUẢN TRỊ VIÊN
            </p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; line-height: 1.6;">
                ${safeReason}
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
    Nếu bạn cho rằng quyết định này có sự nhầm lẫn hoặc cần cung cấp thêm thông tin giải trình, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi qua email:
    <a href="mailto:${SUPPORT_EMAIL}" style="color: #C92A2A; font-weight: 700; text-decoration: underline;">${SUPPORT_EMAIL}</a>.
</p>
<p style="margin: 0; font-size: 13px; color: #6B7280;">
    Vui lòng không trả lời trực tiếp email tự động này.
</p>`;

  return wrapEmailLayout("Thông Báo Khóa Tài Khoản", "QUẢN TRỊ VIÊN", contentHtml);
}

// 4. Account Enabled
function buildAccountEnabledHtml(username) {
  const safeUsername = escapeHtml(username || 'người dùng');

  const contentHtml = `
<h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.3px;">
    Chào Mừng Bạn Trở Lại CGFoodTour 🎉
</h2>
<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
    Xin chào <strong>@${safeUsername}</strong>,<br><br>
    Chúng tôi rất vui mừng thông báo rằng tài khoản Cần Giuộc FoodTour của bạn đã được quản trị viên mở khóa thành công.
    Bạn có thể đăng nhập và tiếp tục sử dụng tất cả các chức năng của hệ thống ngay bây giờ.
</p>

<!-- Success Box -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ECFDF5; border: 2px solid #111827; border-radius: 12px; margin: 20px 0;">
    <tr>
        <td style="padding: 16px 18px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #065F46; letter-spacing: 0.5px;">
                ✅ TÀI KHOẢN ĐÃ SẴN SÀNG HOẠT ĐỘNG
            </p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; line-height: 1.6;">
                Các quán ăn đã được duyệt trước đó của bạn (nếu có) cũng đã xuất hiện công khai trở lại trên bản đồ ẩm thực Cần Giuộc.
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
    Chúng tôi thành thật xin lỗi vì những bất tiện bạn gặp phải trong thời gian tài khoản tạm khóa.
    Nếu vẫn gặp bất kỳ trở ngại nào khi đăng nhập hoặc sử dụng tài khoản, hãy liên hệ ngay với chúng tôi qua email:
    <a href="mailto:${SUPPORT_EMAIL}" style="color: #C92A2A; font-weight: 700; text-decoration: underline;">${SUPPORT_EMAIL}</a>.
</p>
<p style="margin: 0; font-size: 13px; color: #6B7280;">
    Rất hân hạnh được đồng hành cùng bạn trên hành trình khám phá ẩm thực Cần Giuộc!
</p>`;

  return wrapEmailLayout("Chào Mừng Bạn Trở Lại", "TÀI KHOẢN", contentHtml);
}

// 5. Store Status
function buildStoreStatusHtml(storeName, actionType, reason) {
  const safeStoreName = escapeHtml(storeName || 'Quán ăn');
  const normalizedAction = (actionType || '').toUpperCase();

  let actionBadge;
  let actionHeading;
  let actionBoxBg;
  let actionTextColor;
  let nextStepsText;

  switch (normalizedAction) {
    case 'HIDE':
      actionBadge = 'ĐÃ TẠM ẨN';
      actionHeading = 'Quán Ăn Của Bạn Đã Bị Tạm Ẩn ⚠️';
      actionBoxBg = '#FEF2F2';
      actionTextColor = '#991B1B';
      nextStepsText = 'Quán ăn tạm thời không hiển thị công khai trên bản đồ. Bạn có thể đăng nhập vào mục "Quán Ăn Của Tôi" để kiểm tra, cập nhật lại thông tin chưa phù hợp và gửi yêu cầu khôi phục đến ban quản trị.';
      break;
    case 'REJECT_RECOVERY_REQUEST':
      actionBadge = 'TỪ CHỐI KHÔI PHỤC';
      actionHeading = 'Yêu Cầu Khôi Phục Quán Ăn Bị Từ Chối ❌';
      actionBoxBg = '#FEF2F2';
      actionTextColor = '#991B1B';
      nextStepsText = 'Yêu cầu khôi phục quán ăn chưa được chấp thuận do chưa đáp ứng đủ tiêu chuẩn hoặc chưa khắc phục các vấn đề trước đó. Vui lòng rà soát lại lý do từ quản trị viên hoặc liên hệ bộ phận hỗ trợ để được hướng dẫn chi tiết.';
      break;
    case 'HARD_DELETE':
      actionBadge = 'ĐÃ XÓA VĨNH VIỄN';
      actionHeading = 'Thông Báo Xóa Quán Ăn Khỏi Hệ Thống 🗑️';
      actionBoxBg = '#FEF2F2';
      actionTextColor = '#991B1B';
      nextStepsText = 'Quán ăn và toàn bộ dữ liệu thực đơn liên quan đã được xóa khỏi hệ thống theo quyết định kiểm duyệt. Mọi thắc mắc hoặc khiếu nại vui lòng gửi về hòm thư hỗ trợ của chúng tôi.';
      break;
    default:
      actionBadge = 'CẬP NHẬT TRẠNG THÁI';
      actionHeading = 'Cập Nhật Trạng Thái Quán Ăn 📢';
      actionBoxBg = '#F3F4F6';
      actionTextColor = '#374151';
      nextStepsText = 'Vui lòng đăng nhập vào hệ thống để kiểm tra chi tiết trạng thái hoạt động của quán ăn.';
  }

  const safeReason = escapeHtml(reason || 'Không có lý do chi tiết từ quản trị viên.').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');

  const contentHtml = `
<h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.3px;">
    ${actionHeading}
</h2>
<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
    Kính gửi Chủ quán ăn,<br><br>
    Ban quản trị Cần Giuộc FoodTour vừa cập nhật trạng thái đối với quán ăn của bạn:
</p>

<!-- Store & Status Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 2px solid #111827; border-radius: 12px; margin: 16px 0;">
    <tr>
        <td style="padding: 16px 18px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="left" style="font-size: 16px; font-weight: 800; color: #111827;">
                        🏪 ${safeStoreName}
                    </td>
                    <td align="right">
                        <span style="display: inline-block; background-color: ${actionBoxBg}; color: ${actionTextColor}; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1.5px solid #111827;">
                            ${actionBadge}
                        </span>
                    </td>
                </tr>
            </table>
            <div style="border-top: 1px dashed #D1D5DB; margin: 12px 0 10px 0;"></div>
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">
                📌 LÝ DO TỪ QUẢN TRỊ VIÊN
            </p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; line-height: 1.6;">
                "${safeReason}"
            </p>
        </td>
    </tr>
</table>

<!-- Next Steps Guidance Card -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFBEB; border: 2px solid #111827; border-radius: 12px; margin: 0 0 20px 0;">
    <tr>
        <td style="padding: 14px 18px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #92400E; letter-spacing: 0.5px;">
                💡 HƯỚNG DẪN TIẾP THEO
            </p>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #78350F; line-height: 1.5;">
                ${nextStepsText}
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
    Nếu có bất kỳ thắc mắc hoặc cần giải đáp thêm, vui lòng liên hệ với bộ phận hỗ trợ CGFoodTour qua email:
    <a href="mailto:${SUPPORT_EMAIL}" style="color: #C92A2A; font-weight: 700; text-decoration: underline;">${SUPPORT_EMAIL}</a>.
</p>`;

  return wrapEmailLayout("Thông Báo Quán Ăn: " + safeStoreName, "QUÁN ĂN", contentHtml);
}

// Generate the 7 Preview Files
const previews = [
  {
    name: '1-verification.html',
    html: buildVerificationHtml('https://cgfoodtour.com/verify-email?token=8f8d9b1a-2e3c-4d5e-a6b7-8c9d0e1f2a3b')
  },
  {
    name: '2-otp.html',
    html: buildOtpHtml('849201')
  },
  {
    name: '3-account-disabled.html',
    html: buildAccountDisabledHtml(
      'nguyenvana_foodie',
      'Tài khoản đăng tải nhiều bình luận spam quảng cáo và nội dung vi phạm tiêu chuẩn cộng đồng về an toàn thực phẩm trên các quán ăn tại Cần Giuộc nhiều lần dù đã nhận cảnh báo từ quản trị viên.'
    )
  },
  {
    name: '4-account-enabled.html',
    html: buildAccountEnabledHtml('nguyenvana_foodie')
  },
  {
    name: '5-store-hidden.html',
    html: buildStoreStatusHtml(
      'Bánh Xèo Tôm Nhảy Cô Ba Cần Giuộc & Đặc Sản Miền Tây',
      'HIDE',
      'Thông tin giấy phép vệ sinh an toàn thực phẩm đã hết hạn kiểm định. Ảnh chụp không gian quán bị mờ, địa chỉ định vị trên bản đồ chưa chính xác so với tọa độ thực tế.'
    )
  },
  {
    name: '6-store-recovery-rejected.html',
    html: buildStoreStatusHtml(
      'Quán Lẩu Mắm Bến Đò Cần Giuộc',
      'REJECT_RECOVERY_REQUEST',
      'Hình ảnh minh chứng bổ sung vẫn chưa đính kèm giấy chứng nhận vệ sinh an toàn thực phẩm có dấu mộc công chứng mới nhất. Vui lòng cập nhật đúng giấy tờ hợp lệ.'
    )
  },
  {
    name: '7-store-hard-deleted.html',
    html: buildStoreStatusHtml(
      'Quán Ốc Đêm Ngã Ba Tân Kim (Chi nhánh cũ)',
      'HARD_DELETE',
      'Quán ăn đã ngừng hoạt động kinh doanh vĩnh viễn tại địa điểm này và chủ quán đã xác nhận đóng cửa qua đường dây nóng.'
    )
  }
];

for (const { name, html } of previews) {
  const filePath = path.join(PREVIEWS_DIR, name);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Generated AFTER preview: ${filePath}`);
}
console.log('All 7 AFTER email preview files generated successfully!');
