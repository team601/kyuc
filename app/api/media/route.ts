import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isMediaBucket, isSafeStoragePath } from '@/lib/media';

// Serves private story media (audio, photos) to viewers that storage RLS allows:
// the owner, accepted family members of a family-visible story, or anyone for a public story.
// Signed URLs are short-lived and never cached publicly.

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const NO_STORE = 'private, no-store, max-age=0';

function detectAudioMime(buffer: Uint8Array): string | null {
  // MP4 / M4A / AAC: 'ftyp' in bytes 4..12
  if (buffer.length >= 12 && String.fromCharCode(...buffer.slice(4, 12)).includes('ftyp')) {
    return 'audio/mp4';
  }
  // WebM: 1A 45 DF A3
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'audio/webm';
  }
  // MP3: ID3 or frame sync
  if (buffer.length >= 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return 'audio/mpeg';
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }
  // WAV: 'RIFF' .... 'WAVE'
  if (
    buffer.length >= 12 &&
    String.fromCharCode(...buffer.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...buffer.slice(8, 12)) === 'WAVE'
  ) {
    return 'audio/wav';
  }
  // OGG: 'OggS'
  if (buffer.length >= 4 && String.fromCharCode(...buffer.slice(0, 4)) === 'OggS') {
    return 'audio/ogg';
  }
  return null;
}

function mimeFromExtension(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webm': return 'audio/webm';
    case 'ogg': return 'audio/ogg';
    case 'wav': return 'audio/wav';
    case 'mp3': return 'audio/mpeg';
    default: return 'audio/mp4'; // m4a / aac; best default for iOS
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const bucket = params.get('b');
  const path = params.get('p') ?? '';

  if (!isMediaBucket(bucket) || !isSafeStoragePath(path)) {
    return NextResponse.json({ error: 'Invalid media reference' }, { status: 400, headers: { 'Cache-Control': NO_STORE } });
  }

  const download = params.get('download') === '1';
  const stream = params.get('stream') === '1' && bucket === 'audio';

  const supabase = await createClient();
  const fileName = `kyuc-${path.split('/').pop()}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, download ? { download: fileName } : undefined);

  if (error || !data?.signedUrl) {
    // Missing file and "not allowed" look the same on purpose.
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': NO_STORE } });
  }

  if (!stream) {
    const res = NextResponse.redirect(data.signedUrl, 302);
    res.headers.set('Cache-Control', NO_STORE);
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  }

  // Stream mode: re-serve the bytes with a sniffed Content-Type.
  // Fallback for players (iOS Safari) that reject the stored Content-Type.
  const range = request.headers.get('range');
  try {
    const upstream = await fetch(data.signedUrl, {
      headers: range ? { Range: range } : undefined,
      cache: 'no-store',
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': NO_STORE } });
    }

    const body = new Uint8Array(await upstream.arrayBuffer());
    const startsAtZero = !range || /^bytes=0-/.test(range);
    const contentType = (startsAtZero && detectAudioMime(body)) || mimeFromExtension(path);

    const headers = new Headers({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': body.byteLength.toString(),
      'Cache-Control': NO_STORE,
    });
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    return new NextResponse(body, { status: upstream.status === 206 ? 206 : 200, headers });
  } catch {
    return NextResponse.json({ error: 'Could not load audio' }, { status: 502, headers: { 'Cache-Control': NO_STORE } });
  }
}
