import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREVIEWS_DIR = path.resolve(__dirname, '../e2e/email-previews/before');

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

// 1. Verification Email Template (from EmailService.java line 189)
function buildBeforeVerification(verificationLink) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #F7F6F2;
            color: #111111;
            padding: 30px 15px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 3px solid #111111;
            border-radius: 20px;
            box-shadow: 8px 8px 0px #111111;
            padding: 32px 28px;
        }
        .header-pill {
            background-color: #FF3E3E;
            color: #FFFFFF;
            padding: 10px 20px;
            border: 2.5px solid #111111;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            box-shadow: 3px 3px 0px #111111;
        }
        .header-table {
            width: 100%;
            margin-bottom: 28px;
            border-bottom: 3px solid #111111;
            padding-bottom: 16px;
        }
        .content h2 {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
            color: #111111;
        }
        .content p {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #333333;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 36px;
            background-color: #FF3E3E;
            color: #FFFFFF !important;
            text-decoration: none;
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: 3px solid #111111;
            border-radius: 14px;
            box-shadow: 5px 5px 0px #111111;
        }
        .info-card {
            background-color: #F7F6F2;
            border: 2.5px solid #111111;
            border-radius: 16px;
            padding: 18px;
            margin: 24px 0;
            box-shadow: 4px 4px 0px #111111;
        }
        .info-card p {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            color: #111111;
        }
        .link-pill {
            background-color: #FFFFFF;
            border: 2px solid #111111;
            border-radius: 10px;
            padding: 12px 16px;
            margin-top: 12px;
            word-break: break-all;
            text-align: left;
        }
        .link-pill p {
            margin: 0;
            font-size: 12px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: 700;
            color: #FF3E3E;
        }
        .footer {
            margin-top: 32px;
            border-top: 3px solid #111111;
            padding-top: 20px;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            font-weight: 800;
            color: #555555;
            margin-bottom: 6px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 15px 8px;
            }
            .container {
                padding: 20px 16px;
                border-radius: 16px;
            }
            .button {
                padding: 14px 24px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="left">
                    <span class="header-pill">🍜 CẦN GIUỘC FOODTOUR</span>
                </td>
                <td align="right">
                    <span style="font-size: 12px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">XÁC THỰC EMAIL</span>
                </td>
            </tr>
        </table>

        <div class="content">
            <h2>Kích Hoạt Tài Khoản Của Bạn 🚀</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Cần Giuộc FoodTour</strong>! Để bắt đầu trải nghiệm và khám phá bản đồ ẩm thực đặc sản hấp dẫn, vui lòng bấm vào nút bên dưới để kích hoạt tài khoản:</p>

            <div class="button-container">
                <a href="${verificationLink}" class="button">Kích Hoạt Tài Khoản Ngay ↗</a>
            </div>

            <div class="info-card">
                <p>📌 <strong>Mẹo:</strong> Nếu nút bấm trên không hoạt động, bạn có thể sao chép liên kết dưới đây và dán trực tiếp vào trình duyệt:</p>
                <div class="link-pill">
                    <p>${verificationLink}</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Cần Giuộc FoodTour Team &copy; 2026</strong></p>
            <p>Khám phá văn hóa ẩm thực Cần Giuộc - Nhanh chóng & Tiện lợi</p>
        </div>
    </div>
</body>
</html>`;
}

// 2. OTP Template (from EmailService.java line 366)
function buildBeforeOtp(otp) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #F7F6F2;
            color: #111111;
            padding: 30px 15px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 3px solid #111111;
            border-radius: 20px;
            box-shadow: 8px 8px 0px #111111;
            padding: 32px 28px;
        }
        .header-pill {
            background-color: #FF3E3E;
            color: #FFFFFF;
            padding: 10px 20px;
            border: 2.5px solid #111111;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            box-shadow: 3px 3px 0px #111111;
        }
        .header-table {
            width: 100%;
            margin-bottom: 28px;
            border-bottom: 3px solid #111111;
            padding-bottom: 16px;
        }
        .content p {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #333333;
        }
        .otp-container {
            text-align: center;
            margin: 32px 0;
        }
        .otp-box {
            display: inline-block;
            background-color: #FFE600;
            border: 3px solid #111111;
            border-radius: 16px;
            padding: 20px 44px;
            box-shadow: 6px 6px 0px #111111;
        }
        .otp-label {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #111111;
            margin-bottom: 8px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 10px;
            color: #FF3E3E;
            font-family: 'Courier New', Courier, monospace;
        }
        .warning-card {
            background-color: #FFFBEB;
            border: 2.5px solid #111111;
            border-radius: 14px;
            padding: 16px;
            margin: 24px 0;
            box-shadow: 4px 4px 0px #111111;
        }
        .warning-card p {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            color: #B45309;
        }
        .footer {
            margin-top: 32px;
            border-top: 3px solid #111111;
            padding-top: 20px;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            font-weight: 800;
            color: #555555;
            margin-bottom: 6px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 15px 8px;
            }
            .container {
                padding: 20px 16px;
            }
            .otp-box {
                padding: 16px 28px;
            }
            .otp-code {
                font-size: 34px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="left">
                    <span class="header-pill">🔐 BẢO MẬT HỆ THỐNG</span>
                </td>
                <td align="right">
                    <span style="font-size: 12px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">MÃ OTP</span>
                </td>
            </tr>
        </table>

        <div class="content">
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Cần Giuộc FoodTour của bạn. Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để tiến hành đổi mật khẩu:</p>

            <div class="otp-container">
                <div class="otp-box">
                    <div class="otp-label">MÃ OTP XÁC THỰC</div>
                    <div class="otp-code">${otp}</div>
                </div>
            </div>

            <div class="warning-card">
                <p>⏰ <strong>Lưu ý:</strong> Mã OTP có hiệu lực trong <strong>5 phút</strong>. Vì mục đích bảo mật, tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Cần Giuộc FoodTour Team &copy; 2026</strong></p>
        </div>
    </div>
</body>
</html>`;
}

// 3. Account Disabled Template (from EmailService.java line 97)
function buildBeforeAccountDisabled(username, reason) {
  const safeUsername = escapeHtml(username || 'người dùng');
  const safeReason = escapeHtml(reason || 'Không có lý do chi tiết');
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Space Grotesk', Arial, sans-serif; background: #F7F6F2; color: #111111; padding: 25px 15px; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 3px solid #111111; border-radius: 20px; padding: 28px; box-shadow: 6px 6px 0 #111111; }
        .header { background: #FDE047; padding: 12px 20px; border: 2.5px solid #111111; border-radius: 12px; font-size: 15px; font-weight: 900; text-transform: uppercase; margin-bottom: 24px; box-shadow: 3px 3px 0 #111111; }
        p { font-size: 15px; font-weight: 600; line-height: 1.6; }
        .reason { background: #FFF7ED; border: 2.5px solid #111111; border-radius: 14px; padding: 18px; margin: 22px 0; box-shadow: 4px 4px 0 #111111; }
        .reason-title { margin: 0 0 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .reason-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
        .notice { color: #555555; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Thông báo từ quản trị viên CGFoodTour</div>
        <p>Xin chào <strong>@${safeUsername}</strong>,</p>
        <p>Tài khoản CGFoodTour của bạn đã bị quản trị viên khóa. Các phiên đăng nhập hiện tại đã bị thu hồi và bạn sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.</p>
        <div class="reason">
            <p class="reason-title">Lý do khóa tài khoản</p>
            <p class="reason-text">${safeReason}</p>
        </div>
        <p class="notice">Nếu cần trao đổi thêm, vui lòng liên hệ bộ phận hỗ trợ CGFoodTour. Không trả lời trực tiếp email tự động này.</p>
        <p>Trân trọng,<br><strong>Cần Giuộc FoodTour Team</strong></p>
    </div>
</body>
</html>`;
}

// 4. Account Enabled Template (from EmailService.java line 149)
function buildBeforeAccountEnabled(username) {
  const safeUsername = escapeHtml(username || 'người dùng');
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Space Grotesk', Arial, sans-serif; background: #F7F6F2; color: #111111; padding: 25px 15px; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 3px solid #111111; border-radius: 20px; padding: 28px; box-shadow: 6px 6px 0 #111111; }
        .header { background: #6EE7B7; padding: 12px 20px; border: 2.5px solid #111111; border-radius: 12px; font-size: 15px; font-weight: 900; text-transform: uppercase; margin-bottom: 24px; box-shadow: 3px 3px 0 #111111; }
        p { font-size: 15px; font-weight: 600; line-height: 1.6; }
        .welcome { background: #ECFDF5; border: 2.5px solid #111111; border-radius: 14px; padding: 18px; margin: 22px 0; box-shadow: 4px 4px 0 #111111; }
        .welcome p { margin: 0; }
        .notice { color: #555555; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Chào mừng bạn trở lại CGFoodTour</div>
        <p>Xin chào <strong>@${safeUsername}</strong>,</p>
        <div class="welcome">
            <p>Tài khoản CGFoodTour của bạn đã được mở khóa. Bạn có thể đăng nhập và tiếp tục sử dụng các chức năng của hệ thống ngay bây giờ.</p>
        </div>
        <p>Chúng tôi thành thật xin lỗi vì những bất tiện bạn gặp phải trong thời gian tài khoản bị khóa và rất vui được chào đón bạn trở lại cộng đồng CGFoodTour.</p>
        <p class="notice">Các quán đã được duyệt trước đó có thể xuất hiện công khai trở lại. Nếu vẫn gặp vấn đề khi đăng nhập hoặc sử dụng tài khoản, vui lòng liên hệ bộ phận hỗ trợ.</p>
        <p>Trân trọng,<br><strong>Cần Giuộc FoodTour Team</strong></p>
    </div>
</body>
</html>`;
}

// 5. Store Status Template (from EmailService.java line 550)
function buildBeforeStoreStatus(storeName, actionType, reason) {
  let actionText = 'đã được CẬP NHẬT TRẠNG THÁI';
  if (actionType === 'HIDE') actionText = 'đã bị ẨN';
  else if (actionType === 'HARD_DELETE') actionText = 'đã bị XÓA VĨNH VIỄN';
  else if (actionType === 'REJECT_RECOVERY_REQUEST') actionText = 'đã bị TỪ CHỐI KHÔI PHỤC';

  const safeStoreName = escapeHtml(storeName || 'Quán ăn');
  const safeReason = escapeHtml(reason || 'Không có lý do chi tiết').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Space Grotesk', sans-serif; background-color: #F7F6F2; color: #111111; padding: 25px 15px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 3px solid #111111; border-radius: 20px; padding: 28px; box-shadow: 6px 6px 0px #111111; }
        .header { background-color: #FF3E3E; color: #FFFFFF; padding: 12px 20px; border: 2.5px solid #111111; border-radius: 12px; font-size: 15px; font-weight: 900; text-transform: uppercase; margin-bottom: 24px; box-shadow: 3px 3px 0px #111111; }
        .reason-card { background-color: #FFFBEB; border: 2.5px solid #111111; border-radius: 14px; padding: 18px; margin: 20px 0; box-shadow: 4px 4px 0px #111111; }
        .reason-card p { margin: 0; font-size: 14px; font-weight: 700; color: #111111; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">📢 THÔNG BÁO TỪ QUẢN TRỊ VIÊN CGFoodTour</div>
        <p style="font-size: 15px; font-weight: 600;">Xin chào Chủ quán,</p>
        <p style="font-size: 15px; font-weight: 600; margin-top: 10px;">Quản trị viên hệ thống đã thực hiện thao tác đối với quán ăn <strong>${safeStoreName}</strong> của bạn. Trạng thái hiện tại: <strong style="color: #FF3E3E;">${actionText}</strong>.</p>
        <div class="reason-card">
            <p>📌 <strong>Lý do từ Admin:</strong></p>
            <p style="margin-top: 6px; font-style: italic;">"${safeReason}"</p>
        </div>
        <p style="font-size: 14px; font-weight: 600; color: #555555;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận hỗ trợ CGFoodTour.</p>
        <p style="font-size: 14px; font-weight: 800; margin-top: 16px;">Trân trọng,<br><strong>Cần Giuộc FoodTour Team</strong></p>
    </div>
</body>
</html>`;
}

// Generate all Before previews:
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '1-verification.html'),
  buildBeforeVerification('https://cgfoodtour.com/api/auth/verify-email/complete?token=test-verification-token-abc123xyz')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '2-otp.html'),
  buildBeforeOtp('849205')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '3-account-disabled.html'),
  buildBeforeAccountDisabled('nguyenvan_a', 'Tài khoản có dấu hiệu đăng tải nội dung quảng cáo spam nhiều lần và vi phạm tiêu chuẩn cộng đồng về đánh giá quán ăn.')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '4-account-enabled.html'),
  buildBeforeAccountEnabled('nguyenvan_a')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '5-store-hidden.html'),
  buildBeforeStoreStatus('Bánh Xèo Rau Rừng Cần Giuộc', 'HIDE', 'Quán ăn tạm thời bị ẩn do phản ánh của thực khách về giờ mở cửa không chính xác và thiếu giấy chứng nhận ATVSTP.')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '6-store-recovery-rejected.html'),
  buildBeforeStoreStatus('Bún Riêu Cua Đồng Cô Ba', 'REJECT_RECOVERY_REQUEST', 'Từ chối yêu cầu khôi phục. Lý do: Chưa bổ sung hình ảnh thực tế quán ăn và menu niêm yết giá theo yêu cầu từ đợt kiểm tra trước.')
);
fs.writeFileSync(
  path.join(PREVIEWS_DIR, '7-store-hard-deleted.html'),
  buildBeforeStoreStatus('Trà Sữa Nhà Làm 247', 'HARD_DELETE', 'Quán ăn đã ngừng hoạt động tại địa chỉ đăng ký trên 6 tháng và chủ quán xác nhận giải thể.')
);

console.log('Successfully generated 7 Before HTML email previews in:', PREVIEWS_DIR);
