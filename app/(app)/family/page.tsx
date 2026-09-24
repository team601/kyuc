import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', background: 'white',
        borderBottom: '1px solid var(--color-border-light)'
      }}>
        <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Stories
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
          }}>
            Sign Out
          </button>
        </form>
      </header>
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧‍👦</div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Family Sharing Space
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
          Private family circles and collaborative storytelling is currently in preview.
          Coming soon!
        </p>
        <Link href="/story/new" className="btn btn-primary">+ New Story</Link>
      </main>
    </div>
  );
}
