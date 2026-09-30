import fs from 'fs';
import path from 'path';

interface SendFamilyInviteParams {
  toEmail: string;
  inviterName: string;
  inviterRole?: string | null;
  inviteId: string;
  lang?: 'vi' | 'en';
}

export async function sendFamilyInviteEmail({
  toEmail,
  inviterName,
  inviterRole,
  inviteId,
  lang = 'en',
}: SendFamilyInviteParams): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Email dispatch skipped.');
    return { success: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kyuc.alignlab.com';
  const fromEmail = process.env.EMAIL_FROM || 'kyuc° <dev@align.vn>';

  const isVi = lang === 'vi';
  const roleDisplay = inviterRole ? ` (${inviterRole})` : '';

  // English is the primary language requested by user
  const subject = isVi
    ? `${inviterName} mời bạn tham gia Vòng tròn gia đình trên kyuc°`
    : `${inviterName} invited you to join their Family Circle on kyuc°`;

  const acceptUrl = `${appUrl}/family?invite=${inviteId}&email=${encodeURIComponent(toEmail)}`;

  // Attach logo directly as an inline CID attachment so email clients (Gmail, Apple Mail)
  // render the logo natively without broken image icons or proxy blocks.
  let attachments: Array<{ filename: string; content: string; content_id: string }> | undefined = undefined;
  let logoSrc = 'https://raw.githubusercontent.com/team601/kyuc/main/public/images/logo.jpg';

  try {
    const logoFilePath = path.join(process.cwd(), 'public', 'images', 'logo.jpg');
    if (fs.existsSync(logoFilePath)) {
      const logoBuffer = fs.readFileSync(logoFilePath);
      attachments = [
        {
          filename: 'logo.jpg',
          content: logoBuffer.toString('base64'),
          content_id: 'kyuc-logo',
        },
      ];
      logoSrc = 'cid:kyuc-logo';
    }
  } catch (err) {
    console.warn('[Email] Could not read local logo file, using raw GitHub URL:', err);
  }

  const html = `
<!DOCTYPE html>
<html lang="${isVi ? 'vi' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 36px 12px; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2926; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #EFEAE3; box-shadow: 0 12px 36px rgba(45, 35, 30, 0.07); overflow: hidden;">
    <!-- Brand Header with Official Logo -->
    <tr>
      <td style="padding: 32px 32px 24px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #F6F1EA;">
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td align="center">
              <a href="${appUrl}" style="text-decoration: none; display: inline-block;">
                <img src="${logoSrc}" alt="kyuc°" width="130" style="display: block; border: 0; outline: none; text-decoration: none; width: 130px; height: auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 14px;">
              <span style="display: inline-block; background-color: #FFF2EE; border: 1px solid #FED8CE; color: #E8503A; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                ${isVi ? '👨‍👩‍👧‍👦 Không gian Ký ức Gia đình' : '✦ A Private Sanctuary for Family Memories'}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 36px 36px 28px;">
        <!-- Inviter Avatar & Title -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 50%; background: linear-gradient(135deg, #E8503A 0%, #D43D27 100%); color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 52px; text-align: center; box-shadow: 0 4px 14px rgba(232, 80, 58, 0.28);">
                ${(inviterName || 'K')[0].toUpperCase()}
              </div>
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #1E1B18; line-height: 1.35; text-align: center; letter-spacing: -0.4px;">
                ${isVi ? `${inviterName} mời bạn vào Vòng tròn gia đình` : `You're invited to join ${inviterName}'s Family Circle`}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #8C827A; text-align: center;">
                ${
                  isVi
                    ? (inviterRole ? `Vai trò: <strong>${inviterRole}</strong> · Cùng lưu giữ di sản câu chuyện của tổ ấm` : 'Cùng lưu giữ di sản câu chuyện của tổ ấm')
                    : (inviterRole ? `<strong>${inviterName} (${inviterRole})</strong> wants to share and preserve family memories with you` : `<strong>${inviterName}</strong> wants to share and preserve family memories with you`)
                }
              </p>
            </td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="background-color: #FAF7F2; border: 1px solid #EFE8DE; border-radius: 14px; padding: 22px 24px; margin-bottom: 26px;">
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: #2D2926; font-weight: 600;">
            ${isVi ? 'Chào bạn,' : 'Hi there,'}
          </p>
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: #4A4440;">
            ${
              isVi
                ? `<strong>${inviterName}</strong>${roleDisplay} vừa gửi lời mời bạn cùng tham gia vào <strong>Không gian Gia đình</strong> trên <strong>kyuc°</strong>.`
                : `<strong>${inviterName}</strong>${roleDisplay} has invited you to join their private <strong>Family Circle</strong> on <strong>kyuc°</strong>.`
            }
          </p>
          <p style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4440;">
            ${
              isVi
                ? 'Đây là nơi ấm áp dành riêng cho tổ ấm — để mọi người cùng lắng nghe giọng nói của nhau, lưu giữ những kỷ niệm quý giá và chia sẻ những câu chuyện cuộc đời của nhiều thế hệ.'
                : 'Every family has stories that deserve to be kept forever — from childhood memories and family traditions, to the laughter around the dinner table and the lessons that shaped our lives.'
            }
          </p>
        </div>

        <!-- 3 Feature Pillars -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: #FFFFFF; border: 1px solid #F2ECE4; border-radius: 12px; padding: 12px 14px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #FAF6F0;">
              <span style="font-size: 17px; margin-right: 8px;">🎙️</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Giọng nói chân thực' : 'Authentic Voice'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Lưu giữ âm sắc và nụ cười thân thương của người thân.' : 'Listen to stories told in the familiar voices of the people you love.'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #FAF6F0;">
              <span style="font-size: 17px; margin-right: 8px;">📖</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Trang sách ký ức' : 'Living Keepsake'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Mỗi câu chuyện là một phần di sản quý giá cho con cháu.' : 'Build an enduring family heirloom together, one memory at a time.'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px;">
              <span style="font-size: 17px; margin-right: 8px;">🔒</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Bảo mật gia đình' : 'Private to Family'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Chỉ các thành viên được mời mới có quyền xem và nghe.' : 'Completely secure and accessible only to invited family members.'}</span>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 10px;">
          <tr>
            <td align="center">
              <a href="${acceptUrl}" style="display: inline-block; background: #E8503A; background: linear-gradient(135deg, #E8503A 0%, #D43D27 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 6px 18px rgba(232, 80, 58, 0.28); letter-spacing: -0.2px;">
                ${isVi ? 'Tham gia Vòng tròn gia đình →' : 'Accept Invitation & Join Circle →'}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 24px; text-align: center; font-size: 12px; color: #9E968F;">
          ${isVi ? 'Hoàn toàn miễn phí và bảo mật tuyệt đối' : 'Takes less than a minute · Free & completely private'}
        </p>

        <!-- Note Box -->
        <div style="background-color: #FFFDF9; border: 1px dashed #E2D7C8; border-radius: 10px; padding: 14px 18px; margin: 0; font-size: 13px; color: #787069; line-height: 1.55;">
          ${
            isVi
              ? `💡 <em>Lưu ý:</em> Nếu bạn chưa có tài khoản trên kyuc°, vui lòng đăng ký tài khoản với chính email <strong>${toEmail}</strong> để được tự động kết nối vào gia đình.`
              : `💡 <strong>New to kyuc°?</strong> Simply click the button above and create an account with <strong>${toEmail}</strong> — you'll be automatically connected to the family circle.`
          }
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #FAF7F2; border-top: 1px solid #F4EFEA; text-align: center; font-size: 12px; color: #8C827A; line-height: 1.6;">
        <p style="margin: 0 0 6px; font-weight: 600; color: #55504D;">
          ${isVi ? 'kyuc° — Nơi ký ức và giọng nói gia đình được lưu giữ mãi mãi.' : 'kyuc° — Where family voices and memories live on forever.'}
        </p>
        <p style="margin: 0 0 8px;"><a href="${appUrl}" style="color: #E8503A; text-decoration: none; font-weight: 600;">kyuc.alignlab.com</a></p>
        <p style="margin: 0; font-size: 11px; color: #A8A19B;">
          ${isVi ? `Email này được gửi đến ${toEmail} theo lời mời từ ${inviterName}.` : `This invitation was sent to ${toEmail} by ${inviterName}.`}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const payload: Record<string, any> = {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend Error]', data);
      return { success: false, error: data.message || 'Failed to dispatch email via Resend' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Resend Network Error]', err);
    return { success: false, error: err.message };
  }
}
