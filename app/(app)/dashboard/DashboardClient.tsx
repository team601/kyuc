'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { categoryMeta, type Category } from '@/lib/questions';
import styles from './dashboard.module.css';

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  question_en?: string | null;
  question_vi?: string | null;
  user_id: string;
  is_public?: boolean;
  visibility?: string | null;
  authorName?: string;
  authorRole?: string;
  isFamilyStory?: boolean;
}

interface PendingDraft {
  category: string;
  questionEn: string;
  questionVi: string;
  text: string;
  savedAt: number;
}

interface DashboardClientProps {
  userId: string;
  displayName: string;
  userEmail: string;
  stories: Story[] | null;
  familyMemberCount?: number;
}

export function DashboardClient({ userId, displayName, userEmail, stories, familyMemberCount = 1 }: DashboardClientProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'family'>('all');
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [claimingDraft, setClaimingDraft] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kyuc_pending_draft');
      if (stored) {
        const parsed = JSON.parse(stored) as PendingDraft;
        setPendingDraft(parsed);
      }
    } catch {}
  }, []);

  const handleClaimDraft = async () => {
    if (!pendingDraft) return;
    setClaimingDraft(true);
    try {
      const supabase = createClient();
      const title = (lang === 'vi' ? pendingDraft.questionVi : pendingDraft.questionEn).slice(0, 60);
      const { error } = await supabase.from('stories').insert({
        user_id: userId,
        title,
        category: pendingDraft.category || 'roots',
        question_en: pendingDraft.questionEn,
        question_vi: pendingDraft.questionVi,
        content_text: pendingDraft.text || '',
      });

      if (!error) {
        localStorage.removeItem('kyuc_pending_draft');
        setPendingDraft(null);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setClaimingDraft(false);
    }
  };

  const audioCount = stories?.filter(s => s.audio_url).length ?? 0;
  const myStories = (stories || []).filter(s => s.user_id === userId);
  const familyStories = (stories || []).filter(s => s.user_id !== userId);
  const myStoriesCount = myStories.length;
  const familyStoriesCount = familyStories.length;

  const displayedStories = activeTab === 'all'
    ? (stories || [])
    : activeTab === 'mine'
      ? myStories
      : familyStories;

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${styles.navActive}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {bt.nav.myStories}
          </Link>
          <Link href="/story/new" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            {bt.nav.newStory}
          </Link>
          <Link href="/family" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {bt.nav.familySpace}
          </Link>
          <Link href="/profile" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {bt.nav.profile}
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          {/* Language Switcher */}
          <div className={styles.langRow}>
            <LanguageSwitcher />
          </div>

          <Link href="/profile" className={styles.userInfo}>
            <div className={styles.avatar}>{displayName[0].toUpperCase()}</div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail}>{userEmail}</p>
            </div>
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className={styles.signOutBtn} id="dashboard-sidebar-signout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>{bt.nav.signOut}</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileBar}>
          <Link href="/" className={styles.mobileLogo}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>kyuc<sup>°</sup></span>
          </Link>
          <div className={styles.mobileActions}>
            <LanguageSwitcher />
            <Link href="/family" className={styles.mobileLink}>{bt.nav.familySpace}</Link>
            <Link href="/profile" className={styles.mobileLink}>{bt.nav.profile}</Link>
            <form action="/auth/signout" method="POST">
              <button type="submit" className={styles.mobileSignOutBtn}>
                {bt.nav.signOut}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>{bt.dashboard.greeting}, {displayName} 👋</h1>
            <p className={styles.greetingSub}>
              {stories?.length
                ? bt.dashboard.subHasStories(stories.length)
                : bt.dashboard.subNoStories}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/story/new" className="btn btn-primary">
              {bt.dashboard.newStoryBtn}
            </Link>
            <form action="/auth/signout" method="POST" className={styles.headerSignOutForm}>
              <button type="submit" className={styles.headerSignOutBtn} id="dashboard-header-signout" title={bt.nav.signOut}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>{bt.nav.signOut}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Pending Pre-signup Draft Recovery Card */}
        {pendingDraft && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FDBA74',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✨</span> {lang === 'vi' ? 'Bạn có một ký ức chưa lưu từ trang chủ!' : 'You have an unsaved memory from the homepage!'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#9A3412', marginTop: '0.25rem' }}>
                &ldquo;{lang === 'vi' ? pendingDraft.questionVi : pendingDraft.questionEn}&rdquo;
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={handleClaimDraft}
                disabled={claimingDraft}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                {claimingDraft
                  ? (lang === 'vi' ? 'Đang lưu…' : 'Saving…')
                  : (lang === 'vi' ? 'Lưu vào tài khoản ngay' : 'Save to archive now')}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('kyuc_pending_draft');
                  setPendingDraft(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9A3412',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                {lang === 'vi' ? 'Bỏ qua' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stories?.length ?? 0}</span>
            <span className={styles.statLabel}>{bt.dashboard.stats.stories}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{audioCount}</span>
            <span className={styles.statLabel}>{bt.dashboard.stats.audioRecordings}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{familyMemberCount}</span>
            <span className={styles.statLabel}>{bt.dashboard.stats.familyMember}</span>
          </div>
        </div>

        {/* Tab Filters if family stories exist */}
        {stories && stories.length > 0 && familyStoriesCount > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '0.85rem' }}>
            <button
              onClick={() => setActiveTab('all')}
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
            >
              {bt.dashboard.tabs.all} ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`btn btn-sm ${activeTab === 'mine' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
            >
              {bt.dashboard.tabs.mine} ({myStoriesCount})
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`btn btn-sm ${activeTab === 'family' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
            >
              👨‍👩‍👧‍👦 {bt.dashboard.tabs.family} ({familyStoriesCount})
            </button>
          </div>
        )}

        {/* Stories grid */}
        {!displayedStories || displayedStories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📖</div>
            <h3 className={styles.emptyTitle}>{bt.dashboard.empty.title}</h3>
            <p className={styles.emptyDesc}>{bt.dashboard.empty.desc}</p>
            <Link href="/story/new" className="btn btn-primary">
              {bt.dashboard.empty.cta}
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {displayedStories.map(story => (
              <Link href={`/story/${story.id}`} key={story.id} className={styles.storyCard}>
                {story.image_url && (
                  <div className={styles.cardThumb}>
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className={styles.cardThumbImg}
                      loading="lazy"
                    />
                  </div>
                )}
                {story.isFamilyStory && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FFF2EE',
                    color: '#E8503A',
                    border: '1px solid #FED8CE',
                    borderRadius: '999px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    width: 'fit-content',
                    marginBottom: '0.5rem',
                  }}>
                    <span>👨‍👩‍👧‍👦</span>
                    <span>{bt.dashboard.fromAuthor(story.authorName || bt.dashboard.familyBadge)}{story.authorRole ? ` (${story.authorRole})` : ''}</span>
                  </div>
                )}
                <div className={styles.storyMeta}>
                  <span className={styles.storyCategory}>
                    {categoryMeta[story.category as Category]?.label[lang] || story.category.replace(/_/g, ' ')}
                  </span>
                  <span className={styles.storyDate}>
                    {new Date(story.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className={styles.storyTitle}>{story.title}</h3>
                {(story.question_en || story.question_vi) && (
                  <p className={styles.storyQuestion}>
                    &ldquo;{lang === 'vi' ? (story.question_vi || story.question_en) : (story.question_en || story.question_vi)}&rdquo;
                  </p>
                )}
                {story.content_text && (
                  <p className={styles.storyPreview}>
                    {story.content_text.slice(0, 120)}…
                  </p>
                )}
                <div className={styles.storyFooter}>
                  {story.audio_url && (
                    <span className={styles.audioTag}>{bt.dashboard.story.audioRecorded}</span>
                  )}
                  <span className={styles.readMore}>{bt.dashboard.story.readMore}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
