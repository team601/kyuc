import type { SupabaseClient } from '@supabase/supabase-js';
import { audioExtension } from '@/lib/media';

// Uploads to the private story buckets. Both return the storage PATH to save in the DB
// and throw on failure, so callers never save a story that silently lost its media.

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

export class UploadError extends Error {}

export async function uploadStoryAudio(supabase: SupabaseClient, userId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new UploadError('too_large');
  }
  const mime = blob.type || 'audio/webm';
  const path = `${userId}/${Date.now()}.${audioExtension(mime)}`;
  const { data, error } = await supabase.storage.from('audio').upload(path, blob, { contentType: mime });
  if (error || !data?.path) {
    throw new UploadError(error?.message || 'upload_failed');
  }
  return data.path;
}

export async function uploadStoryPhoto(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'webp').replace(/[^A-Za-z0-9]/g, '') || 'webp';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type });
  if (error || !data?.path) {
    throw new UploadError(error?.message || 'upload_failed');
  }
  return data.path;
}
