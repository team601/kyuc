import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FamilyClient } from './FamilyClient';

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <FamilyClient />;
}
