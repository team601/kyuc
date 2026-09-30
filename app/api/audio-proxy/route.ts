import { NextRequest, NextResponse } from 'next/server';

function detectAudioMime(buffer: Uint8Array): string {
  // MP4 / M4A / AAC: look for 'ftyp' in bytes 4..16
  if (buffer.length >= 12) {
    const headerStr = String.fromCharCode(...buffer.slice(4, 12));
    if (headerStr.includes('ftyp')) {
      return 'audio/mp4';
    }
  }

  // WebM: 1A 45 DF A3
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'audio/webm';
  }

  // MP3: ID3 or FF FB / FF F3 / FF F2
  if (buffer.length >= 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return 'audio/mpeg';
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }

  // WAV: 'RIFF' .... 'WAVE'
  if (buffer.length >= 12) {
    const riff = String.fromCharCode(...buffer.slice(0, 4));
    const wave = String.fromCharCode(...buffer.slice(8, 12));
    if (riff === 'RIFF' && wave === 'WAVE') {
      return 'audio/wav';
    }
  }

  // OGG: 'OggS'
  if (buffer.length >= 4) {
    const ogg = String.fromCharCode(...buffer.slice(0, 4));
    if (ogg === 'OggS') {
      return 'audio/ogg';
    }
  }

  return 'audio/mp4'; // Default to audio/mp4 on fallback for maximum iOS compatibility
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Security: only allow proxying from our Supabase storage domain
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const allowedHost = new URL(supabaseUrl).hostname;
      if (targetUrl.hostname !== allowedHost && !targetUrl.hostname.endsWith('.supabase.co')) {
        return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
      }
    } catch {
      // fallback
    }
  }

  const rangeHeader = request.headers.get('range');
  const headers: Record<string, string> = {};
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      headers,
      cache: 'force-cache',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(upstreamRes.body, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
      });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const detectedMime = detectAudioMime(uint8);

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', detectedMime);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Content-Length', arrayBuffer.byteLength.toString());
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new NextResponse(arrayBuffer, {
      status: upstreamRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error proxying audio' },
      { status: 500 }
    );
  }
}
