'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import s from './app.module.css';

export type AppTab = 'home' | 'new' | 'family' | 'profile';

const LABELS = {
  vi: { home: 'Câu chuyện', new: 'Ghi âm', family: 'Gia đình', profile: 'Hồ sơ', signOut: 'Đăng xuất' },
  en: { home: 'Stories', new: 'Record', family: 'Family', profile: 'Profile', signOut: 'Sign out' },
};

/**
 * Khung chung của web app, theo đúng mockup điện thoại ở trang chủ:
 * nền kem, một cột nội dung hẹp ở giữa, thanh tab dưới cùng trên điện thoại với nút ghi âm tròn màu san hô.
 */
export function AppShell({
  active,
  back,
  wide = false,
  children,
}: {
  active?: AppTab;
  back?: { href: string; label: string };
  wide?: boolean;
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const t = LABELS[lang];

  return (
    <div className={s.shell}>
      <header className={s.topBar}>
        <div className={s.topInner}>
          {back ? (
            <Link href={back.href} className={s.backLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>{back.label}</span>
            </Link>
          ) : (
            <Link href="/dashboard" className={s.logo}>kyuc<span>.ai</span></Link>
          )}

          <nav className={s.deskNav} aria-label="App">
            <NavLink tab="home" active={active} label={t.home} />
            <NavLink tab="family" active={active} label={t.family} />
            <NavLink tab="profile" active={active} label={t.profile} />
            <Link href="/story/new" className={`${s.pill} ${s.pillCoral} ${s.pillSm}`}>
              <span className={s.recDot} aria-hidden="true" /> {t.new}
            </Link>
          </nav>

          <div className={s.topRight}>
            <LanguageSwitcher />
            <form action="/auth/signout" method="POST" className={s.deskOnly}>
              <button type="submit" className={s.iconBtn} title={t.signOut} aria-label={t.signOut}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={`${s.content} ${wide ? s.contentWide : ''}`}>{children}</main>

      <nav className={s.tabBar} aria-label="App">
        <TabLink tab="home" active={active} label={t.home} icon={<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />} />
        <TabLink tab="family" active={active} label={t.family} icon={<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5" /></>} />
        <Link href="/story/new" className={`${s.tabRec} ${active === 'new' ? s.tabRecOn : ''}`} aria-label={t.new}>
          <span className={s.tabRecDot} />
        </Link>
        <TabLink tab="profile" active={active} label={t.profile} icon={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />
        <form action="/auth/signout" method="POST" className={s.tabForm}>
          <button type="submit" className={s.tab}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t.signOut}</span>
          </button>
        </form>
      </nav>
    </div>
  );
}

const HREF: Record<AppTab, string> = { home: '/dashboard', new: '/story/new', family: '/family', profile: '/profile' };

function NavLink({ tab, active, label }: { tab: AppTab; active?: AppTab; label: string }) {
  return (
    <Link href={HREF[tab]} className={`${s.navLink} ${active === tab ? s.navOn : ''}`} aria-current={active === tab ? 'page' : undefined}>
      {label}
    </Link>
  );
}

function TabLink({ tab, active, label, icon }: { tab: AppTab; active?: AppTab; label: string; icon: React.ReactNode }) {
  return (
    <Link href={HREF[tab]} className={`${s.tab} ${active === tab ? s.tabOn : ''}`} aria-current={active === tab ? 'page' : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      <span>{label}</span>
    </Link>
  );
}
