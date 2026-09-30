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
  const fromEmail = process.env.EMAIL_FROM || 'kyuc° <onboarding@resend.dev>';

  const isVi = lang === 'vi';
  const roleDisplay = inviterRole ? ` (${inviterRole})` : '';

  const subject = isVi
    ? `${inviterName} mời bạn tham gia Vòng tròn gia đình trên kyuc°`
    : `${inviterName} invited you to join their Family Circle on kyuc°`;

  const acceptUrl = `${appUrl}/family?invite=${inviteId}&email=${encodeURIComponent(toEmail)}`;

  const html = `
<!DOCTYPE html>
<html lang="${isVi ? 'vi' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2926; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EFE8DE; box-shadow: 0 4px 20px rgba(45, 41, 38, 0.05); overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 20px; text-align: center; background-color: #FFFDF9; border-bottom: 1px solid #F4EFEA;">
        <span style="font-size: 26px; font-weight: 800; color: #E8503A; letter-spacing: -0.5px;">
          kyuc<sup style="font-size: 14px; top: -0.8em; font-weight: 400;">°</sup>
        </span>
        <div style="margin-top: 12px; display: inline-block; background-color: #FFF2EE; color: #E8503A; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
          👨‍👩‍👧‍👦 ${isVi ? 'Vòng tròn Ký ức Gia đình' : 'Family Circle'}
        </div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1E1B18; line-height: 1.35; text-align: center;">
          ${isVi ? `${inviterName} muốn kết nối cùng bạn` : `${inviterName} wants to connect with you`}
        </h1>
        
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #55504D;">
          ${
            isVi
              ? `Chào bạn,<br><br><strong>${inviterName}</strong> vừa mời bạn tham gia <strong>Vòng tròn gia đình${roleDisplay}</strong> trên <strong>kyuc°</strong>. Đây là nơi mọi người trong gia đình cùng lưu giữ giọng nói, chia sẻ những kỷ niệm và câu chuyện cuộc đời vô giá qua các thế hệ.`
              : `Hello,<br><br><strong>${inviterName}</strong> has invited you to join their <strong>Family Circle${roleDisplay}</strong> on <strong>kyuc°</strong>. It's a private family sanctuary to preserve voices, share cherished memories, and cherish oral histories across generations.`
          }
        </p>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${acceptUrl}" style="display: inline-block; background-color: #E8503A; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(232, 80, 58, 0.25);">
                ${isVi ? 'Tham gia Vòng tròn gia đình →' : 'Join Family Circle →'}
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color: #FAF7F2; border: 1px dashed #E2D7C8; border-radius: 10px; padding: 14px 18px; margin: 20px 0 0; font-size: 13px; color: #736F6E; line-height: 1.5;">
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
      <td style="padding: 24px 32px; background-color: #FAF7F2; border-top: 1px solid #F4EFEA; text-align: center; font-size: 12px; color: #9E9995; line-height: 1.5;">
        <p style="margin: 0 0 6px;">kyuc° — Nơi ký ức và giọng nói gia đình được lưu giữ mãi mãi.</p>
        <p style="margin: 0;"><a href="${appUrl}" style="color: #736F6E; text-decoration: underline;">kyuc.alignlab.com</a></p>
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
