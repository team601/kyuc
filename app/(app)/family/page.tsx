import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FamilyClient } from './FamilyClient';

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const currentUser = {
    id: user.id,
    email: user.email || '',
    displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Friend',
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
  };

  // Fetch members invited by current user
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('owner_id', user.id)
    .order('invited_at', { ascending: false });

  // Fetch pending invitations where member_email matches current user
  const { data: pendingInvites } = await supabase
    .from('family_members')
    .select('*')
    .eq('member_email', user.email)
    .eq('status', 'pending');

  // Fetch family stories (for owner + family)
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, category, created_at, content_text, audio_url, image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <FamilyClient
      currentUser={currentUser}
      initialMembers={members || []}
      initialPendingInvites={pendingInvites || []}
      familyStories={stories || []}
    />
  );
}
