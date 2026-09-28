'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function FamilyClient() {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', background: 'white',
        borderBottom: '1px solid var(--color-border-light)'
      }}>
        <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500 }}>
          {bt.family.backToDashboard}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            }}>
              {bt.nav.signOut}
            </button>
          </form>
        </div>
      </header>
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧‍👦</div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          {bt.family.title}
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
          {lang === 'vi'
            ? 'Vòng tròn gia đình riêng tư và kể chuyện cộng tác đang trong giai đoạn xem trước. Sắp ra mắt!'
            : 'Private family circles and collaborative storytelling is currently in preview. Coming soon!'}
        </p>
        <Link href="/story/new" className="btn btn-primary">
          {bt.profile.actions.newStory}
        </Link>
      </main>
    </div>
  );
}
