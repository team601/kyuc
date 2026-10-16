// Media helpers for private Supabase Storage buckets.
// The DB stores a storage PATH (e.g. "<user-uuid>/1700000000.m4a").
// Older rows hold a full getPublicUrl() link; storagePathFrom() handles both.
// Browsers never load bucket URLs directly: everything goes through /api/media,
// which signs a short-lived URL only if storage RLS lets the viewer read the file.

export type MediaBucket = 'audio' | 'photos';

export const MEDIA_BUCKETS: readonly MediaBucket[] = ['audio', 'photos'];

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SAFE_PATH = new RegExp(`^${UUID}/(avatars/)?[A-Za-z0-9][A-Za-z0-9._-]*$`, 'i');
const STORAGE_URL = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/([^?#]+)/;

export function isMediaBucket(value: string | null): value is MediaBucket {
  return value === 'audio' || value === 'photos';
}

export function isSafeStoragePath(path: string): boolean {
  return SAFE_PATH.test(path) && !path.includes('..');
}

/** Returns the storage path inside `bucket`, or null if the value is not a valid reference to it. */
export function storagePathFrom(value: string | null | undefined, bucket: MediaBucket): string | null {
  if (!value) return null;
  let path = value.trim();

  if (path.startsWith('/api/media?')) {
    const params = new URLSearchParams(path.slice('/api/media?'.length));
    if (params.get('b') !== bucket) return null;
    path = params.get('p') ?? '';
    return isSafeStoragePath(path) ? path : null;
  }

  const match = path.match(STORAGE_URL);
  if (match) {
    if (match[1] !== bucket) return null;
    try {
      path = decodeURIComponent(match[2]);
    } catch {
      return null;
    }
  } else if (/^https?:\/\//i.test(path)) {
    return null;
  }

  return isSafeStoragePath(path) ? path : null;
}

/** Owner folder (first segment) of a storage path. */
export function storageOwnerId(path: string): string {
  return path.split('/')[0];
}

interface MediaSrcOptions {
  download?: boolean;
  stream?: boolean;
  /** Origin to build an absolute URL (e.g. for Open Graph images). */
  origin?: string;
}

/**
 * Converts a stored media value into a URL the browser can load.
 * - Private-bucket references become /api/media?b=…&p=…
 * - Other http(s) URLs (public avatars bucket, Google profile photos) are returned unchanged.
 * - Invalid private-bucket references return null.
 */
export function mediaSrc(
  value: string | null | undefined,
  bucket: MediaBucket,
  options: MediaSrcOptions = {}
): string | null {
  if (!value) return null;

  const path = storagePathFrom(value, bucket);
  if (!path) {
    const isExternal = /^https?:\/\//i.test(value) && !STORAGE_URL.test(value);
    const isOtherBucket = STORAGE_URL.test(value) && value.match(STORAGE_URL)?.[1] !== bucket;
    return isExternal || isOtherBucket ? value : null;
  }

  const params = new URLSearchParams({ b: bucket, p: path });
  if (options.download) params.set('download', '1');
  if (options.stream) params.set('stream', '1');
  return `${options.origin ?? ''}/api/media?${params.toString()}`;
}

/** File extension for a recorded audio blob. */
export function audioExtension(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
