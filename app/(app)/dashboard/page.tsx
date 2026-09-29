import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch stories
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend';

  return (
    <DashboardClient
      userId={user.id}
      displayName={displayName}
      userEmail={user.email ?? ''}
      stories={stories}
    />
  );
}
