import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch stories count
  const { data: stories } = await supabase
    .from('stories')
    .select('id, category, created_at')
    .eq('user_id', user.id);

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, display_name, language_pref')
    .eq('id', user.id)
    .single();

  const isGoogleUser = user.app_metadata?.provider === 'google' ||
    user.identities?.some(id => id.provider === 'google') || false;

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;

  const categoryCounts = {
    roots: stories?.filter(s => s.category === 'roots').length ?? 0,
    traditions: stories?.filter(s => s.category === 'traditions').length ?? 0,
    life_lessons: stories?.filter(s => s.category === 'life_lessons').length ?? 0,
  };

  return (
    <ProfileClient
      userId={user.id}
      initialDisplayName={displayName}
      initialAvatarUrl={avatarUrl}
      userEmail={user.email ?? ''}
      userCreatedAt={user.created_at}
      categoryCounts={categoryCounts}
      totalStories={stories?.length ?? 0}
      isGoogleUser={isGoogleUser}
    />
  );
}
