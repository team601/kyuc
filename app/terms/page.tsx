'use client';

import { useLanguage } from '@/lib/LanguageContext';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/components/legal/LegalPageLayout.module.css';

export default function TermsPage() {
  const { lang } = useLanguage();

  if (lang === 'vi') {
    return (
      <LegalPageLayout
        title="Điều Khoản Dịch Vụ"
        subtitle="Quy định sử dụng dịch vụ lưu giữ ký ức gia đình kyuc°."
        lastUpdated="Cập nhật lần cuối: 29 tháng 9, 2026"
      >
        <div className={styles.highlightBox}>
          Bằng việc đăng ký tài khoản hoặc sử dụng kyuc°, bạn đồng ý với các điều khoản dưới đây được thiết kế nhằm bảo vệ bạn và gia đình bạn.
        </div>

        <h2>1. Quyền sở hữu nội dung</h2>
        <p>
          Bạn giữ toàn bộ quyền tác giả, bản quyền và quyền sở hữu trí tuệ đối với mọi câu chuyện, bản ghi âm giọng nói và hình ảnh mà bạn tải lên hoặc ghi âm qua kyuc°. Chúng tôi không đòi hỏi bất kỳ quyền sở hữu nào đối với câu chuyện của bạn.
        </p>

        <h2>2. Sử dụng dịch vụ đúng mục đích</h2>
        <p>
          kyuc° là nền tảng dành riêng cho việc lưu giữ ký ức, lịch sử truyền miệng và gắn kết gia đình. Bạn đồng ý không:
        </p>
        <ul>
          <li>Ghi âm hoặc chia sẻ nội dung vi phạm pháp luật, quấy rối hoặc xúc phạm người khác.</li>
          <li>Ghi âm người khác mà không có sự đồng ý hoặc biết rõ của họ.</li>
          <li>Cố ý xâm nhập, khai thác lỗ hổng kỹ thuật hoặc gây ảnh hưởng tiêu cực tới hệ thống của chúng tôi.</li>
        </ul>

        <h2>3. Trách nhiệm bảo mật tài khoản</h2>
        <p>
          Bạn có trách nhiệm bảo mật mật khẩu và thiết bị đăng nhập của mình. Hãy thông báo ngay cho chúng tôi nếu bạn phát hiện bất kỳ dấu hiệu truy cập trái phép nào vào tài khoản của bạn.
        </p>

        <h2>4. Chấm dứt dịch vụ & Xóa tài khoản</h2>
        <p>
          Bạn có thể ngừng sử dụng dịch vụ và yêu cầu xóa tài khoản bất cứ lúc nào trong mục Cài đặt tài khoản. Chúng tôi tôn trọng quyết định của bạn và sẽ tiến hành xóa dữ liệu theo chính sách bảo mật đã cam kết.
        </p>

        <h2>5. Giới hạn trách nhiệm</h2>
        <p>
          kyuc° luôn nỗ lực cao nhất để bảo vệ tính toàn vẹn và sẵn sàng của dữ liệu. Tuy nhiên, chúng tôi khuyến khích các gia đình tải về (export) bản sao lưu tệp âm thanh gốc để lưu giữ ngoại tuyến lâu dài.
        </p>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="Terms governing your use of the kyuc° family story archive platform."
      lastUpdated="Last updated: September 29, 2026"
    >
      <div className={styles.highlightBox}>
        By registering or using kyuc°, you agree to these terms designed to protect you, your family, and our community.
      </div>

      <h2>1. Content Ownership</h2>
      <p>
        You retain full ownership, copyright, and intellectual property rights to all stories, voice recordings, transcripts, and photos you create or upload to kyuc°. We claim zero ownership over your family history.
      </p>

      <h2>2. Permitted Use</h2>
      <p>
        kyuc° is a safe harbor for family storytelling, oral history, and intergenerational connection. You agree not to:
      </p>
      <ul>
        <li>Upload illegal, abusive, defamatory, or harmful content.</li>
        <li>Record another person without their informed consent.</li>
        <li>Attempt unauthorized access or probe system vulnerabilities.</li>
      </ul>

      <h2>3. Account Security</h2>
      <p>
        You are responsible for keeping your login credentials secure. Please notify us immediately if you suspect unauthorized access to your account.
      </p>

      <h2>4. Termination & Deletion</h2>
      <p>
        You may delete your account and withdraw your data at any time from your account settings. We honor full deletion requests in accordance with our Privacy Policy.
      </p>

      <h2>5. Backup & Peace of Mind</h2>
      <p>
        While we provide redundant cloud backups, we strongly encourage families to periodically export and keep an offline copy of their recordings.
      </p>
    </LegalPageLayout>
  );
}
