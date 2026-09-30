import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FamilyClient } from './FamilyClient';

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const userEmail = (user.email || '').toLowerCase();

  // 1. Fetch current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const currentUser = {
    id: user.id,
    email: userEmail,
    displayName:
      profile?.display_name ||
      user.user_metadata?.display_name ||
      userEmail.split('@')[0] ||
      'Friend',
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
  };

  // 2. Fetch members invited by current user (I am owner)
  const { data: myInvites } = await supabase
    .from('family_members')
    .select('*')
    .eq('owner_id', user.id)
    .order('invited_at', { ascending: false });

  // 3. Fetch circles where current user is an accepted member (I was invited and accepted)
  const { data: joinedCircles } = await supabase
    .from('family_members')
    .select('*')
    .or(`member_email.eq.${userEmail},member_id.eq.${user.id}`)
    .eq('status', 'accepted');

  // 4. Fetch incoming pending invitations for current user
  const { data: pendingInvites } = await supabase
    .from('family_members')
    .select('*')
    .or(`member_email.eq.${userEmail},member_id.eq.${user.id}`)
    .eq('status', 'pending');

  // 5. Gather all connected user IDs to fetch profiles and stories
  const ownerIds = (joinedCircles || []).map(c => c.owner_id).filter(Boolean);
  const acceptedMemberIds = (myInvites || [])
    .filter(m => m.status === 'accepted' && m.member_id)
    .map(m => m.member_id as string);

  const profileIdsToFetch = Array.from(new Set([...ownerIds, ...acceptedMemberIds]));

  let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (profileIdsToFetch.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', profileIdsToFetch);

    if (profiles) {
      profileMap = profiles.reduce((acc, p) => {
        acc[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);
    }
  }

  // 6. Build bidirectional members list
  const combinedMembers: Array<{
    id: string;
    member_email: string;
    role?: string | null;
    status: 'pending' | 'accepted' | 'declined';
    invited_at: string;
    member_id?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    isOwner?: boolean;
  }> = [];

  // Add the owners who invited current user (if current user accepted)
  for (const circle of joinedCircles || []) {
    const ownerProf = profileMap[circle.owner_id];
    combinedMembers.push({
      id: `owner-${circle.id}`,
      member_email: ownerProf?.display_name ? `${ownerProf.display_name} (Host)` : 'Chủ vòng tròn',
      displayName: ownerProf?.display_name || 'Người tạo vòng tròn',
      avatarUrl: ownerProf?.avatar_url || null,
      role: circle.role ? `Gia đình (Vai trò của bạn: ${circle.role})` : 'Chủ vòng tròn',
      status: 'accepted',
      invited_at: circle.invited_at,
      member_id: circle.owner_id,
      isOwner: true,
    });
  }

  // Add members invited by current user
  for (const m of myInvites || []) {
    const memProf = m.member_id ? profileMap[m.member_id] : null;
    combinedMembers.push({
      id: m.id,
      member_email: m.member_email,
      displayName: m.custom_name || memProf?.display_name || null,
      avatarUrl: m.custom_avatar_url || memProf?.avatar_url || null,
      role: m.role || null,
      status: m.status,
      invited_at: m.invited_at,
      member_id: m.member_id,
      isOwner: false,
    });
  }

  // 7. Fetch family stories for current user + all connected family members
  const connectedUserIds = Array.from(new Set([user.id, ...ownerIds, ...acceptedMemberIds]));

  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, category, created_at, content_text, audio_url, image_url')
    .in('user_id', connectedUserIds)
    .order('created_at', { ascending: false });

  return (
    <FamilyClient
      currentUser={currentUser}
      initialMembers={combinedMembers}
      initialPendingInvites={pendingInvites || []}
      familyStories={stories || []}
    />
  );
}
