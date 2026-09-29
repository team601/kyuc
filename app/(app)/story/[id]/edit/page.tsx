import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { StoryEditClient } from './StoryEditClient';

export default async function StoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story) {
    notFound();
  }

  // Ensure only the story author can edit
  if (story.user_id !== user.id) {
    redirect('/dashboard');
  }

  return <StoryEditClient story={story} />;
}
