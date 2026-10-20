import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Permanently deletes the signed-in user's account:
// 1. every file they own in the audio, photos and avatars buckets (storage delete policies allow own folder),
// 2. the auth user via the `delete_my_account()` RPC, which cascades to profiles, stories and family_members.
// Any failure stops the process and is reported, so the UI never claims a deletion that didn't happen.

const BUCKETS = ['audio', 'photos', 'avatars'] as const;
const PAGE = 1000;

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function listFiles(supabase: Supabase, bucket: string, prefix: string, depth = 0): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(`list ${bucket}: ${error.message}`);
    for (const entry of data ?? []) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) {
        files.push(path);
      } else if (depth < 3) {
        // Folder (e.g. "<uid>/avatars"): descend.
        files.push(...(await listFiles(supabase, bucket, path, depth + 1)));
      }
    }
    if (!data || data.length < PAGE) break;
  }
  return files;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (String(body?.confirm ?? '').trim().toUpperCase() !== 'DELETE') {
    return NextResponse.json({ error: 'confirmation_required' }, { status: 400 });
  }

  try {
    for (const bucket of BUCKETS) {
      const files = await listFiles(supabase, bucket, user.id);
      for (let i = 0; i < files.length; i += 100) {
        const batch = files.slice(i, i + 100);
        const { error } = await supabase.storage.from(bucket).remove(batch);
        if (error) throw new Error(`remove ${bucket}: ${error.message}`);
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'storage_delete_failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  const { error: rpcError } = await supabase.rpc('delete_my_account');
  if (rpcError) {
    return NextResponse.json({ error: 'account_delete_failed', detail: rpcError.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
