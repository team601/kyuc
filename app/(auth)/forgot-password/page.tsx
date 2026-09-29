'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isVi = lang === 'vi';

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/reset-password`;
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      // Always show success to prevent email enumeration attacks
      setSubmitted(true);
    } catch (err: any) {
      // Still show neutral confirmation or safe error
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>kyuc<sup>°</sup></span>
          </Link>
          <h1 className={styles.title}>
            {isVi ? 'Quên mật khẩu' : 'Forgot Password'}
          </h1>
          <p className={styles.subtitle}>
            {isVi
              ? 'Nhập địa chỉ email tài khoản của bạn để nhận liên kết khôi phục.'
              : 'Enter your account email to receive a secure recovery link.'}
          </p>
        </div>

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className={styles.successIcon}>📬</div>
            <div style={{ textAlign: 'center', lineHeight: 1.6, color: 'var(--color-ink-soft)', fontSize: 'var(--text-sm)' }}>
              {isVi ? (
                <>
                  Nếu email <strong>{email}</strong> tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (kể cả mục Spam).
                </>
              ) : (
                <>
                  If an account exists for <strong>{email}</strong>, a secure password reset link has been dispatched. Please check your inbox and spam folder.
                </>
              )}
            </div>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
            >
              {isVi ? 'Quay lại Đăng nhập' : 'Back to Sign In'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div>
              <label className="form-label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading
                ? (isVi ? 'Đang gửi…' : 'Sending link…')
                : (isVi ? 'Gửi liên kết khôi phục' : 'Send Reset Link')}
            </button>
          </form>
        )}

        <p className={styles.switchLink}>
          <Link href="/login">
            {isVi ? '← Quay lại Đăng nhập' : '← Back to Sign In'}
          </Link>
        </p>
      </div>
    </div>
  );
}
