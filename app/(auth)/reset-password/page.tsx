'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import styles from '../auth.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isVi = lang === 'vi';

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(isVi ? 'Mật khẩu phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || (isVi ? 'Đã xảy ra lỗi, vui lòng thử lại.' : 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>kyuc<sup>°</sup></span>
          </Link>
          <h1 className={styles.title}>
            {isVi ? 'Đặt lại mật khẩu' : 'Reset Password'}
          </h1>
          <p className={styles.subtitle}>
            {isVi
              ? 'Tạo mật khẩu mới an toàn cho tài khoản của bạn.'
              : 'Create a new secure password for your account.'}
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'center' }}>
            <div className={styles.successIcon}>✅</div>
            <p style={{ color: 'var(--color-ink)', fontWeight: 'var(--font-medium)' }}>
              {isVi ? 'Đổi mật khẩu thành công! Đang chuyển hướng...' : 'Password updated successfully! Redirecting...'}
            </p>
            <Link
              href="/dashboard"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isVi ? 'Vào Bảng điều khiển' : 'Go to Dashboard'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div>
              <label className="form-label" htmlFor="reset-new-password">
                {isVi ? 'Mật khẩu mới' : 'New Password'}
              </label>
              <input
                id="reset-new-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="reset-confirm-password">
                {isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading
                ? (isVi ? 'Đang cập nhật…' : 'Updating…')
                : (isVi ? 'Lưu mật khẩu mới' : 'Update Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
