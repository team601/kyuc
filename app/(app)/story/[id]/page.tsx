import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { StoryDetailClient } from './StoryDetailClient';

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!story) notFound();

  return <StoryDetailClient story={story} />;
}
