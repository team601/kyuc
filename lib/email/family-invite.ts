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
  lang = 'vi',
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

  const subject = isVi
    ? `${inviterName} mời bạn tham gia Vòng tròn gia đình trên kyuc°`
    : `${inviterName} invited you to join their Family Circle on kyuc°`;

  const acceptUrl = `${appUrl}/family?invite=${inviteId}&email=${encodeURIComponent(toEmail)}`;

  const logoUrl = `${appUrl}/images/logo.jpg`;

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
                <img src="${logoUrl}" alt="kyuc°" width="136" style="display: block; border: 0; outline: none; text-decoration: none; width: 136px; height: auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 12px;">
              <span style="display: inline-block; background-color: #FFF2EE; border: 1px solid #FED8CE; color: #E8503A; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase;">
                👨‍👩‍👧‍👦 ${isVi ? 'Không gian Ký ức Gia đình' : 'Family Memory Space'}
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
              <h1 style="margin: 0 0 8px; font-size: 23px; font-weight: 800; color: #1E1B18; line-height: 1.3; text-align: center; letter-spacing: -0.4px;">
                ${isVi ? `${inviterName} mời bạn vào Vòng tròn gia đình` : `${inviterName} invited you to join the Family Circle`}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #8C827A; text-align: center;">
                ${isVi ? (inviterRole ? `Vai trò trong gia đình: <strong>${inviterRole}</strong>` : 'Cùng gìn giữ và kể lại câu chuyện của tổ ấm') : (inviterRole ? `Family role: <strong>${inviterRole}</strong>` : 'Preserving your family heritage together')}
              </p>
            </td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="background-color: #FAF7F2; border: 1px solid #EFE8DE; border-radius: 14px; padding: 20px 22px; margin-bottom: 26px;">
          <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: #3D3835;">
            ${
              isVi
                ? `Chào bạn,<br><br><strong>${inviterName}</strong>${roleDisplay} vừa gửi lời mời bạn cùng tham gia vào <strong>Không gian Gia đình</strong> trên <strong>kyuc°</strong>. Đây là nơi riêng tư dành riêng cho tổ ấm — để mọi người cùng lắng nghe giọng nói của nhau, lưu giữ những kỷ niệm quý giá và chia sẻ những câu chuyện cuộc đời của nhiều thế hệ.`
                : `Hello,<br><br><strong>${inviterName}</strong>${roleDisplay} has invited you to join their private <strong>Family Space</strong> on <strong>kyuc°</strong> — a sanctuary to preserve voices, share family memories, and keep timeless stories alive across generations.`
            }
          </p>
        </div>

        <!-- 3 Feature Pillars -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: #FFFFFF; border: 1px solid #F2ECE4; border-radius: 12px; padding: 12px 14px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #FAF6F0;">
              <span style="font-size: 17px; margin-right: 8px;">🎙️</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Giọng nói chân thực' : 'Authentic Voice'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Lưu giữ âm sắc và nụ cười thân thương của người thân.' : 'Preserve voice and laughter forever.'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #FAF6F0;">
              <span style="font-size: 17px; margin-right: 8px;">📖</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Trang sách ký ức' : 'Memory Archive'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Mỗi câu chuyện là một phần di sản quý giá cho con cháu.' : 'Stories that build your family legacy.'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px;">
              <span style="font-size: 17px; margin-right: 8px;">🔒</span>
              <strong style="font-size: 14px; color: #2D2926;">${isVi ? 'Bảo mật gia đình' : 'Private & Safe'}:</strong>
              <span style="font-size: 13px; color: #736F6E; margin-left: 4px;">${isVi ? 'Chỉ các thành viên được mời mới có quyền xem và nghe.' : 'Strictly accessible only by your circle.'}</span>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px;">
          <tr>
            <td align="center">
              <a href="${acceptUrl}" style="display: inline-block; background: #E8503A; background: linear-gradient(135deg, #E8503A 0%, #D43D27 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 6px 18px rgba(232, 80, 58, 0.28); letter-spacing: -0.2px;">
                ${isVi ? 'Tham gia Vòng tròn gia đình →' : 'Join Family Circle →'}
              </a>
            </td>
          </tr>
        </table>

        <!-- Note Box -->
        <div style="background-color: #FFFDF9; border: 1px dashed #E2D7C8; border-radius: 10px; padding: 14px 18px; margin: 20px 0 0; font-size: 13px; color: #787069; line-height: 1.5;">
          ${
            isVi
              ? `💡 <em>Lưu ý:</em> Nếu bạn chưa có tài khoản trên kyuc°, vui lòng đăng ký tài khoản với chính email <strong>${toEmail}</strong> để được tự động kết nối vào gia đình.`
              : `💡 <em>Note:</em> If you don't have an account on kyuc° yet, simply sign up with <strong>${toEmail}</strong> to automatically connect with your family.`
          }
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #FAF7F2; border-top: 1px solid #F4EFEA; text-align: center; font-size: 12px; color: #8C827A; line-height: 1.6;">
        <p style="margin: 0 0 6px; font-weight: 600; color: #55504D;">kyuc° — Nơi ký ức và giọng nói gia đình được lưu giữ mãi mãi.</p>
        <p style="margin: 0 0 8px;"><a href="${appUrl}" style="color: #E8503A; text-decoration: none; font-weight: 600;">kyuc.alignlab.com</a></p>
        <p style="margin: 0; font-size: 11px; color: #A8A19B;">${isVi ? `Email này được gửi đến ${toEmail} theo lời mời từ ${inviterName}.` : `This invitation was sent to ${toEmail} by ${inviterName}.`}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
      }),
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

