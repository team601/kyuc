'use client';

import { useLanguage } from '@/lib/LanguageContext';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/components/legal/LegalPageLayout.module.css';

export default function SecurityPage() {
  const { lang } = useLanguage();

  if (lang === 'vi') {
    return (
      <LegalPageLayout
        title="Bảo Mật Dữ Liệu & Riêng Tư"
        subtitle="Tổng quan kiến trúc bảo mật nhiều lớp bảo vệ ký ức gia đình của bạn tại kyuc°."
        lastUpdated="Cập nhật lần cuối: 29 tháng 9, 2026"
      >
        <div className={styles.highlightBox}>
          <strong>Cam kết bảo mật:</strong> Ký ức gia đình là báu vật riêng tư. Chúng tôi áp dụng triết lý "Private by default" (Mặc định riêng tư) trong mọi dòng mã và cấu hình máy chủ.
        </div>

        <h2>1. Mã Hóa Truyền Tải & Mã Hóa Lưu Trữ</h2>
        <p>
          Mọi kết nối giữa trình duyệt của bạn và máy chủ kyuc° đều được mã hóa bằng HTTPS/TLS 1.3 hiện đại nhất với chính sách HSTS (HTTP Strict Transport Security). Các tệp âm thanh và hình ảnh của bạn được lưu trữ an toàn trên hạ tầng đám mây đạt tiêu chuẩn bảo mật SOC 2 Type II và ISO 27001.
        </p>

        <h2>2. Row Level Security (RLS) ở Cấp Cơ Sở Dữ Liệu</h2>
        <p>
          Chúng tôi sử dụng Row Level Security (RLS) của PostgreSQL trực tiếp trên cơ sở dữ liệu Supabase:
        </p>
        <ul>
          <li>Mỗi câu chuyện, bản ghi âm và thông tin cá nhân đều gắn chặt với ID tài khoản duy nhất của bạn.</li>
          <li>Người dùng khác hoàn toàn không thể xem, đoán mã hay truy xuất câu chuyện của bạn bằng cách can thiệp URL hay API.</li>
          <li>Chỉ khi bạn chủ động bật chế độ "Chia sẻ công khai", câu chuyện đó mới tạo ra liên kết chia sẻ riêng biệt.</li>
        </ul>

        <h2>3. Cơ Chế Lưu Trữ Private & Signed URL</h2>
        <p>
          Các tệp ghi âm giọng nói không được lưu trữ ở dạng liên kết công khai vĩnh viễn. Thay vào đó, hệ thống tạo liên kết có chữ ký số (Signed URLs) với thời hạn hết hạn ngắn để phát âm thanh trong phiên đăng nhập của bạn.
        </p>

        <h2>4. Xác Thực Hiện Đại & Chống Tấn Công</h2>
        <ul>
          <li><strong>Xác thực an toàn:</strong> Hỗ trợ Google OAuth với chuẩn PKCE (Proof Key for Code Exchange) và xác thực email với cookie HttpOnly, SameSite.</li>
          <li><strong>Bảo vệ Header:</strong> Cấu hình nghiêm ngặt CSP (Content Security Policy), X-Frame-Options (chống Clickjacking) và X-Content-Type-Options.</li>
          <li><strong>Giới hạn tần suất (Rate Limiting):</strong> Bảo vệ các cổng đăng nhập và yêu cầu khôi phục mật khẩu trước các cuộc tấn công thử mật khẩu hàng loạt.</li>
        </ul>

        <h2>5. Báo cáo vấn đề bảo mật</h2>
        <p>
          Nếu bạn là nhà nghiên cứu bảo mật và phát hiện nguy cơ tiềm ẩn, vui lòng thông báo cho đội ngũ kỹ thuật của chúng tôi qua: <strong>security@kyuc.alignlab.com</strong>. Chúng tôi luôn trân trọng và phản hồi nhanh chóng.
        </p>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      title="Data Security & Architecture"
      subtitle="How our multi-layered security infrastructure safeguards your family memories."
      lastUpdated="Last updated: September 29, 2026"
    >
      <div className={styles.highlightBox}>
        <strong>Security Philosophy:</strong> Family memories are sacred. We design kyuc° to be strictly "Private by Default" across our database, storage buckets, and application code.
      </div>

      <h2>1. Encryption in Transit and at Rest</h2>
      <p>
        Every request between your browser and our servers is encrypted using modern TLS 1.3 with Strict Transport Security (HSTS). All recordings and image files are housed in cloud storage compliant with SOC 2 Type II and ISO 27001 standards.
      </p>

      <h2>2. Database-level Row Level Security (RLS)</h2>
      <p>
        We enforce PostgreSQL Row Level Security (RLS) on all data tables:
      </p>
      <ul>
        <li>Every story, audio track, and transcript is permanently bound to your authenticated user identifier.</li>
        <li>Unauthorized users cannot inspect, query, or enumerate other families' stories by guessing IDs or tampering with URLs.</li>
        <li>Only stories explicitly designated as public generate a secured, token-scoped share link.</li>
      </ul>

      <h2>3. Private Object Storage & Signed URLs</h2>
      <p>
        Audio files are stored in private storage containers. Instead of static, permanent public URLs, authorized media is served via expiring signed URLs generated strictly on-demand for legitimate account owners.
      </p>

      <h2>4. Modern Authentication & Abuse Prevention</h2>
      <ul>
        <li><strong>Secure Auth:</strong> Powered by PKCE (Proof Key for Code Exchange) with Google OAuth and HttpOnly session cookies.</li>
        <li><strong>Security Headers:</strong> Full suite of Content Security Policy, strict frame isolation, and nosniff protections.</li>
        <li><strong>Rate Limiting:</strong> Throttling on authentication and password reset endpoints to mitigate brute force attacks.</li>
      </ul>

      <h2>5. Vulnerability Disclosure</h2>
      <p>
        If you discover a security concern, please contact our security team at: <strong>security@kyuc.alignlab.com</strong>.
      </p>
    </LegalPageLayout>
  );
}
