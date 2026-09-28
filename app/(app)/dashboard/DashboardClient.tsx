'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
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
}

interface DashboardClientProps {
  displayName: string;
  userEmail: string;
  stories: Story[] | null;
}

export function DashboardClient({ displayName, userEmail, stories }: DashboardClientProps) {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const audioCount = stories?.filter(s => s.audio_url).length ?? 0;

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
            <span className={styles.statNum}>1</span>
            <span className={styles.statLabel}>{bt.dashboard.stats.familyMember}</span>
          </div>
        </div>

        {/* Stories grid */}
        {!stories || stories.length === 0 ? (
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
            {stories.map(story => (
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
                <div className={styles.storyMeta}>
                  <span className={styles.storyCategory}>{story.category}</span>
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
