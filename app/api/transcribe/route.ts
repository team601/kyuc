import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { storagePathFrom } from '@/lib/media';

// Chép lời bản ghi của một câu chuyện bằng Whisper (Groq), rồi lưu vào stories.audio_transcript.
// Chỉ chủ câu chuyện gọi được; file âm thanh được tải từ bucket riêng tư bằng phiên của chính họ.

export const maxDuration = 60;

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3';
/** Giới hạn file của gói miễn phí Groq */
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let storyId: string | undefined;
  try {
    ({ storyId } = await request.json());
  } catch {
    // body rỗng hoặc sai định dạng
  }
  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'missing_story' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: story } = await supabase
    .from('stories')
    .select('id, user_id, audio_url')
    .eq('id', storyId)
    .eq('user_id', user.id)
    .single();

  const path = storagePathFrom(story?.audio_url, 'audio');
  if (!story || !path) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: audio, error: downloadError } = await supabase.storage.from('audio').download(path);
  if (downloadError || !audio) {
    return NextResponse.json({ error: 'audio_unavailable' }, { status: 404 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }

  const form = new FormData();
  form.append('file', audio, path.split('/').pop() || 'audio.m4a');
  form.append('model', MODEL);
  form.append('response_format', 'json');
  form.append('temperature', '0');
  // Không ép ngôn ngữ: giao diện có thể là tiếng Anh trong khi người kể nói tiếng Việt, Whisper tự nhận ra

  let transcript = '';
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return NextResponse.json({ error: status === 429 ? 'rate_limited' : 'provider_error' }, { status });
    }
    const data = (await res.json()) as { text?: string };
    transcript = (data.text ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'provider_error' }, { status: 502 });
  }

  if (!transcript) {
    return NextResponse.json({ error: 'empty' }, { status: 422 });
  }

  const { error: updateError } = await supabase
    .from('stories')
    .update({ audio_transcript: transcript })
    .eq('id', story.id)
    .eq('user_id', user.id);
  if (updateError) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ transcript });
}
