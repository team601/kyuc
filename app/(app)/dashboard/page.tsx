import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const headerUserId = reqHeaders.get('x-user-id');
  const headerUserEmail = reqHeaders.get('x-user-email') || '';
  const headerUserName = decodeURIComponent(reqHeaders.get('x-user-name') || '');

  const supabase = await createClient();

  let userId = headerUserId;
  let userEmail = headerUserEmail;
  let displayName = headerUserName;

  // Fallback if header wasn't set (e.g. direct dev invocation)
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    userId = user.id;
    userEmail = user.email || '';
    displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend';
  }

  // Fetch stories directly with user_id
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, category, created_at, content_text, audio_url, image_url, question_en, question_vi, user_id, is_public')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      userId={userId}
      displayName={displayName || 'Friend'}
      userEmail={userEmail}
      stories={stories || []}
    />
  );
}
