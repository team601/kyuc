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

  // 1. Fetch connected circles to identify family members
  const { data: myCircles } = await supabase
    .from('family_members')
    .select('id, owner_id, member_id, member_email, role, custom_name, status')
    .or(`member_email.ilike.${userEmail},member_id.eq.${userId},owner_id.eq.${userId}`)
    .eq('status', 'accepted');

  const connectedOwnerIds = (myCircles || []).map(c => c.owner_id).filter(id => id !== userId);
  const connectedMemberIds = (myCircles || []).map(c => c.member_id).filter(id => id && id !== userId);
  const familyUserIds = Array.from(new Set([...connectedOwnerIds, ...connectedMemberIds]));

  const allUserIds = Array.from(new Set([userId, ...familyUserIds]));

  // 2. Fetch profiles for author badges
  const authorMap: Record<string, { name: string; role?: string }> = {};
  if (familyUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', familyUserIds);

    if (profiles) {
      profiles.forEach(p => {
        const circleInfo = myCircles?.find(c => c.owner_id === p.id || c.member_id === p.id);
        authorMap[p.id] = {
          name: circleInfo?.custom_name || p.display_name || 'Người thân',
          role: circleInfo?.role || undefined,
        };
      });
    }
  }

  // 3. Fetch stories
  const { data: rawStories } = await supabase
    .from('stories')
    .select('id, title, category, created_at, content_text, audio_url, image_url, question_en, question_vi, user_id, is_public, visibility')
    .in('user_id', allUserIds)
    .order('created_at', { ascending: false });

  // Filter out any other user's private stories
  const visibleStories = (rawStories || [])
    .filter(s => {
      if (s.user_id === userId) return true;
      return s.visibility !== 'private' || s.is_public === true;
    })
    .map(s => ({
      ...s,
      authorName: s.user_id !== userId ? authorMap[s.user_id]?.name || 'Gia đình' : undefined,
      authorRole: s.user_id !== userId ? authorMap[s.user_id]?.role : undefined,
      isFamilyStory: s.user_id !== userId,
    }));

  return (
    <DashboardClient
      userId={userId}
      displayName={displayName || 'Friend'}
      userEmail={userEmail}
      stories={visibleStories}
      familyMemberCount={(myCircles?.length || 0) + 1}
    />
  );
}

