import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: stories } = await supabase
    .from('stories')
    .select('id, category, created_at')
    .eq('user_id', user.id);

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend';

  const categoryCounts = {
    roots: stories?.filter(s => s.category === 'roots').length ?? 0,
    traditions: stories?.filter(s => s.category === 'traditions').length ?? 0,
    life_lessons: stories?.filter(s => s.category === 'life_lessons').length ?? 0,
  };

  return (
    <ProfileClient
      displayName={displayName}
      userEmail={user.email ?? ''}
      userCreatedAt={user.created_at}
      categoryCounts={categoryCounts}
      totalStories={stories?.length ?? 0}
    />
  );
}
