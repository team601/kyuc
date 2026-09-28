'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './profile.module.css';

interface ProfileClientProps {
  displayName: string;
  userEmail: string;
  userCreatedAt: string;
  categoryCounts: {
    roots: number;
    traditions: number;
    life_lessons: number;
  };
  totalStories: number;
}

export function ProfileClient({
  displayName,
  userEmail,
  userCreatedAt,
  categoryCounts,
  totalStories,
}: ProfileClientProps) {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const initial = displayName[0].toUpperCase();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>{bt.profile.backToStories}</Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <div className={styles.headerRight}>
          <LanguageSwitcher />
          <form action="/auth/signout" method="POST">
            <button type="submit" style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background 0.15s ease'
            }}>
              {bt.nav.signOut}
            </button>
          </form>
        </div>
      </header>

      <main className={styles.main}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initial}</div>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.email}>{userEmail}</p>
          <p className={styles.joined}>
            {bt.profile.memberSince}{' '}
            {new Date(userCreatedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{totalStories}</span>
            <span className={styles.statLabel}>{bt.profile.stats.totalStories}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.roots}</span>
            <span className={styles.statLabel}>{bt.profile.stats.roots}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.traditions}</span>
            <span className={styles.statLabel}>{bt.profile.stats.traditions}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.life_lessons}</span>
            <span className={styles.statLabel}>{bt.profile.stats.lifeLessons}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/story/new" className="btn btn-primary">{bt.profile.actions.newStory}</Link>
          <Link href="/family" className="btn btn-ghost">{bt.profile.actions.familySpace}</Link>
          <form action="/auth/signout" method="POST" style={{ display: 'inline' }}>
            <button
              type="submit"
              className="btn btn-ghost"
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              {bt.profile.actions.signOut}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
