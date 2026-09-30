import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShareClient } from './ShareClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: story } = await supabase
    .from('stories')
    .select('title, content_text, image_url, is_public, visibility')
    .eq('id', id)
    .maybeSingle();

  if (!story || story.visibility === 'private' || (!story.is_public && !story.visibility)) {
    return {
      title: 'Story not found | kyuc°',
    };
  }

  const description =
    story.content_text?.slice(0, 160) ||
    'Một câu chuyện gia đình được lưu giữ trọn vẹn trên kyuc°.';

  return {
    title: `${story.title} | kyuc°`,
    description,
    openGraph: {
      title: `${story.title} | kyuc°`,
      description,
      images: story.image_url ? [story.image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${story.title} | kyuc°`,
      description,
      images: story.image_url ? [story.image_url] : undefined,
    },
  };
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: story, error } = await supabase
    .from('stories')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error || !story) {
    notFound();
  }

  const visibility = story.visibility || (story.is_public ? 'public' : 'family');

  // If story is strictly private and viewer is not the creator, return 404
  if (visibility === 'private' && story.user_id !== user?.id) {
    notFound();
  }

  // If story is family-only, verify viewer membership in the creator's family circle
  let isFamilyAuthorized = false;
  if (user) {
    if (user.id === story.user_id) {
      isFamilyAuthorized = true;
    } else {
      const userEmail = (user.email || '').toLowerCase();
      const { data: membership } = await supabase
        .from('family_members')
        .select('id')
        .eq('status', 'accepted')
        .or(
          `and(owner_id.eq.${story.user_id},or(member_id.eq.${user.id},member_email.eq.${userEmail})),and(owner_id.eq.${user.id},member_id.eq.${story.user_id})`
        )
        .maybeSingle();

      if (membership) {
        isFamilyAuthorized = true;
      }
    }
  }

  const isLockedForFamily = visibility === 'family' && !isFamilyAuthorized;
  const authorName = (story.profiles as any)?.display_name || 'Người thân';

  return (
    <ShareClient
      story={story}
      isLockedForFamily={isLockedForFamily}
      authorName={authorName}
    />
  );
}
