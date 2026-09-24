import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: stories } = await supabase
    .from('stories')
    .select('id, category, created_at')
    .eq('user_id', user.id);

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend';
  const initial = displayName[0].toUpperCase();

  const categoryCounts = {
    roots: stories?.filter(s => s.category === 'roots').length ?? 0,
    traditions: stories?.filter(s => s.category === 'traditions').length ?? 0,
    life_lessons: stories?.filter(s => s.category === 'life_lessons').length ?? 0,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>← Back to Stories</Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
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
            Sign Out
          </button>
        </form>
      </header>

      <main className={styles.main}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initial}</div>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.email}>{user.email}</p>
          <p className={styles.joined}>
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stories?.length ?? 0}</span>
            <span className={styles.statLabel}>Total Stories</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.roots}</span>
            <span className={styles.statLabel}>Roots</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.traditions}</span>
            <span className={styles.statLabel}>Traditions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{categoryCounts.life_lessons}</span>
            <span className={styles.statLabel}>Life Lessons</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/story/new" className="btn btn-primary">+ New Story</Link>
          <Link href="/family" className="btn btn-ghost">Family Space</Link>
          <form action="/auth/signout" method="POST" style={{ display: 'inline' }}>
            <button
              type="submit"
              className="btn btn-ghost"
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              Sign Out / Đăng xuất
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
