import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShareClient } from './ShareClient';

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  image_url?: string | null;
  photo_caption?: string | null;
  question_en?: string | null;
  question_vi?: string | null;
  is_public?: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: story } = await supabase
    .from('stories')
    .select('title, content_text, image_url, is_public')
    .eq('id', id)
    .single();

  if (!story || !story.is_public) {
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

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story || !story.is_public) {
    notFound();
  }

  return <ShareClient story={story} />;
}
