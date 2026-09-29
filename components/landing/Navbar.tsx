'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setUser(data?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        window.removeEventListener('scroll', handler);
        subscription.unsubscribe();
      };
    } catch {
      return () => window.removeEventListener('scroll', handler);
    }
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4C6 4 6 14 6 24M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="6" r="2" fill="#E8503A" opacity="0.5"/>
          </svg>
          <span className={styles.logoText}>kyuc<sup>°</sup></span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.links}>
          <a href="#how-it-works" className={styles.link}>{t.nav.howItWorks}</a>
          <a href="#stories" className={styles.link}>{t.nav.stories}</a>
          <a href="#try" className={styles.link}>{t.nav.try}</a>
        </div>

        {/* Language switch + CTA */}
        <div className={styles.cta}>
          <div className={styles.langSwitch} role="group" aria-label="Language selection">
            <button
              onClick={() => setLang('vi')}
              className={`${styles.langBtn} ${lang === 'vi' ? styles.langActive : ''}`}
              title="Tiếng Việt"
            >
              🇻🇳 VI
            </button>
            <button
              onClick={() => setLang('en')}
              className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
              title="English"
            >
              🇬🇧 EN
            </button>
          </div>

          {user ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              {lang === 'vi' ? 'Bảng điều khiển' : 'Dashboard'}
              <svg className="arrow-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L12 2M12 2H5M12 2V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">{t.nav.login}</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                {t.nav.signup}
                <svg className="arrow-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 12L12 2M12 2H5M12 2V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={menuOpen ? styles.barOpen : ''}></span>
          <span className={menuOpen ? styles.barOpen : ''}></span>
          <span className={menuOpen ? styles.barOpen : ''}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t.nav.howItWorks}</a>
          <a href="#stories" onClick={() => setMenuOpen(false)}>{t.nav.stories}</a>
          <a href="#try" onClick={() => setMenuOpen(false)}>{t.nav.try}</a>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 0' }}>
            <button
              onClick={() => { setLang('vi'); setMenuOpen(false); }}
              className={`${styles.langBtn} ${lang === 'vi' ? styles.langActive : ''}`}
              style={{ border: '1px solid var(--color-border)', padding: '6px 12px' }}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => { setLang('en'); setMenuOpen(false); }}
              className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
              style={{ border: '1px solid var(--color-border)', padding: '6px 12px' }}
            >
              🇬🇧 English
            </button>
          </div>
          <div className={styles.mobileActions}>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                {lang === 'vi' ? 'Vào Bảng điều khiển →' : 'Go to Dashboard →'}
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>{t.nav.login}</Link>
                <Link href="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>{t.nav.startNow}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
