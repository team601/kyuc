'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please check your Supabase credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
    } catch (err: any) {
      setError(err?.message || 'Google sign-in error. Please check credentials.');
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✉️</div>
          <h2 className={styles.title}>Check your email!</h2>
          <p className={styles.subtitle}>
            We’ve sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account and start capturing family stories.
          </p>
          <Link href="/login" className="btn btn-ghost" style={{ marginTop: '1rem', justifyContent: 'center', width: '100%' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className={styles.title}>Preserve family stories</h1>
          <p className={styles.subtitle}>Free forever. Takes less than a minute.</p>
        </div>

        {/* Google */}
        <button onClick={handleGoogleSignup} className={styles.googleBtn} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <form onSubmit={handleSignup} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div>
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              className="form-input"
              placeholder="e.g. Linh Nguyen"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className={styles.terms}>
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
