'use client';

import { useLanguage } from '@/lib/LanguageContext';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/components/legal/LegalPageLayout.module.css';

export default function PrivacyPage() {
  const { lang } = useLanguage();

  if (lang === 'vi') {
    return (
      <LegalPageLayout
        title="Chính Sách Bảo Mật"
        subtitle="Cách kyuc° bảo vệ giọng nói, câu chuyện và dữ liệu thiêng liêng của gia đình bạn."
        lastUpdated="Cập nhật lần cuối: 29 tháng 9, 2026"
      >
        <div className={styles.highlightBox}>
          <strong>Nguyên tắc cốt lõi:</strong> Ký ức và giọng nói của gia đình bạn là riêng tư tuyệt đối theo mặc định. Chúng tôi không bao giờ bán dữ liệu của bạn, và <em>không sử dụng giọng nói hay câu chuyện của bạn để huấn luyện bất kỳ mô hình AI công khai nào</em>.
        </div>

        <h2>1. Dữ liệu chúng tôi thu thập</h2>
        <p>Khi bạn sử dụng kyuc°, chúng tôi chỉ thu thập thông tin tối thiểu cần thiết để lưu trữ và trao truyền ký ức gia đình:</p>
        <ul>
          <li><strong>Thông tin tài khoản:</strong> Tên hiển thị, địa chỉ email, ảnh đại diện khi bạn đăng ký tài khoản trực tiếp hoặc qua Google Sign-In.</li>
          <li><strong>Nội dung câu chuyện:</strong> Các đoạn ghi âm giọng nói (audio), bản chép lời (transcript), văn bản câu chuyện tự viết và hình ảnh kỷ niệm bạn tải lên.</li>
          <li><strong>Không gian gia đình:</strong> Danh sách người thân được bạn mời vào không gian gia đình của mình.</li>
          <li><strong>Dữ liệu kỹ thuật:</strong> Thông tin thiết bị cơ bản và cookie phiên đăng nhập bảo mật (không dùng cookies theo dõi quảng cáo).</li>
        </ul>

        <h2>2. Lưu trữ và Bảo vệ Dữ liệu</h2>
        <p>
          Mọi tệp âm thanh và hình ảnh của bạn được lưu trữ trong hệ thống lưu trữ đám mây mã hóa (Supabase Storage trên hạ tầng AWS chuẩn quốc tế). Các bản ghi âm mặc định được bảo vệ ở chế độ riêng tư (Private Storage), chỉ có thể truy cập thông qua phiên đăng nhập được xác thực hoặc liên kết có chữ ký điện tử (Signed URL) có thời hạn giới hạn.
        </p>

        <h2>3. Sử dụng Trí tuệ Nhân tạo (AI) và Chép Lời</h2>
        <p>
          Nếu bạn chọn sử dụng tính năng chuyển giọng nói thành văn bản (Speech-to-Text), dữ liệu âm thanh chỉ được xử lý tạm thời để tạo bản ghi chữ cho bạn. Chúng tôi cam kết:
        </p>
        <ul>
          <li>Dữ liệu giọng nói của bạn <strong>không bao giờ</strong> được dùng để huấn luyện mô hình ngôn ngữ hoặc mô hình giọng nói AI.</li>
          <li>Chỉ có bạn và những người thân bạn chủ động chia sẻ mới có quyền đọc bản chép lời.</li>
        </ul>

        <h2>4. Quyền làm chủ dữ liệu của bạn</h2>
        <p>Bạn giữ toàn quyền sở hữu 100% đối với câu chuyện và giọng nói của mình:</p>
        <ul>
          <li><strong>Quyền chỉnh sửa và xóa:</strong> Bạn có thể chỉnh sửa hoặc xóa vĩnh viễn từng câu chuyện, tệp ghi âm, hoặc toàn bộ tài khoản bất cứ lúc nào.</li>
          <li><strong>Quyền tải xuống (Export):</strong> Bạn có thể tải về tệp âm thanh gốc và câu chuyện của mình về máy tính để lưu trữ ngoại tuyến lâu dài.</li>
          <li><strong>Xóa tài khoản:</strong> Khi bạn yêu cầu xóa tài khoản, tất cả câu chuyện, âm thanh, ảnh và thông tin cá nhân sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu đang hoạt động.</li>
        </ul>

        <h2>5. Liên hệ</h2>
        <p>
          Nếu bạn có bất kỳ câu hỏi nào về quyền riêng tư hoặc muốn yêu cầu xóa dữ liệu, vui lòng liên hệ chúng tôi qua email: <strong>privacy@kyuc.alignlab.com</strong>.
        </p>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How kyuc° protects your family's voices, stories, and sacred memories."
      lastUpdated="Last updated: September 29, 2026"
    >
      <div className={styles.highlightBox}>
        <strong>Core Principle:</strong> Your family memories and voices are private by default. We never sell your data, and <em>we never use your audio recordings or stories to train any public AI models</em>.
      </div>

      <h2>1. Information We Collect</h2>
      <p>When you use kyuc°, we collect only what is strictly necessary to preserve and share family stories:</p>
      <ul>
        <li><strong>Account Information:</strong> Display name, email address, and avatar when you sign up directly or via Google Sign-In.</li>
        <li><strong>Story Content:</strong> Audio voice recordings, transcripts, written memories, and uploaded family photos.</li>
        <li><strong>Family Connections:</strong> Contact emails of family members you invite to your private family space.</li>
        <li><strong>Technical Data:</strong> Basic device information and secure session cookies (no third-party tracking or advertising pixels).</li>
      </ul>

      <h2>2. Storage and Data Protection</h2>
      <p>
        All audio and image files are stored in encrypted cloud storage (Supabase Storage on industry-standard AWS infrastructure). Your audio recordings are private by default, accessible only through authenticated user sessions or time-limited signed URLs.
      </p>

      <h2>3. Artificial Intelligence & Transcription</h2>
      <p>
        When you use voice-to-text or transcription features, audio is processed solely to generate your memory transcript. We guarantee:
      </p>
      <ul>
        <li>Your voice data is <strong>never</strong> used to train AI models or speech synthesizers.</li>
        <li>Only you and family members you explicitly invite can view the resulting transcripts.</li>
      </ul>

      <h2>4. Your Data Rights & Ownership</h2>
      <p>You retain 100% ownership of your memories, recordings, and words:</p>
      <ul>
        <li><strong>Edit and Delete:</strong> You can edit or permanently delete any recording, story, or photo at any time.</li>
        <li><strong>Export:</strong> You can download your original audio recordings and stories for offline family archives.</li>
        <li><strong>Account Deletion:</strong> Upon account deletion, all active recordings, photos, stories, and personal identifiers are permanently removed from production databases.</li>
      </ul>

      <h2>5. Contact Us</h2>
      <p>
        If you have questions about privacy, data handling, or wish to submit a data erasure request, please reach out to: <strong>privacy@kyuc.alignlab.com</strong>.
      </p>
    </LegalPageLayout>
  );
}
