'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { AppShell } from '@/components/app/AppShell';
import { createClient } from '@/lib/supabase/client';
import PhotoUploader from '@/components/story/PhotoUploader';
import { mediaSrc, storagePathFrom } from '@/lib/media';
import styles from './edit.module.css';

interface Story {
  id: string;
  user_id: string;
  title: string;
  category: string;
  content_text?: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  image_url?: string | null;
  photo_caption?: string | null;
  is_public?: boolean;
  visibility?: 'private' | 'family' | 'public';
}

export function StoryEditClient({ story }: { story: Story }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [title, setTitle] = useState(story.title || '');
  const [category, setCategory] = useState(story.category || 'roots');
  const [visibility, setVisibility] = useState<'private' | 'family' | 'public'>(
    story.visibility || (story.is_public ? 'public' : 'family')
  );
  const [contentText, setContentText] = useState(story.content_text || '');
  const [photoCaption, setPhotoCaption] = useState(story.photo_caption || '');
  const [imageUrl, setImageUrl] = useState(story.image_url || '');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState(story.audio_transcript || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chép lại lời từ bản ghi trên server (Whisper qua Groq)
  const [retranscribing, setRetranscribing] = useState(false);

  const handleRetranscribe = async () => {
    if (audioTranscript.trim() && !window.confirm(lang === 'vi'
      ? 'Chép lại sẽ thay bản chép lời hiện tại, kể cả chỗ bạn đã sửa. Tiếp tục?'
      : 'This replaces the current transcript, including your edits. Continue?')) return;
    setRetranscribing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.transcript) throw new Error();
      setAudioTranscript(data.transcript);
    } catch {
      setMessage({ type: 'error', text: lang === 'vi' ? 'Chưa chép lời được, vui lòng thử lại.' : 'Could not transcribe yet. Please try again.' });
    } finally {
      setRetranscribing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Stored as a storage path in the private photos bucket.
      let finalImageUrl = storagePathFrom(imageUrl, 'photos') ?? (imageUrl || null);

      // Upload new photo if user selected one
      if (newPhotoFile) {
        const ext = newPhotoFile.name.split('.').pop() || 'webp';
        const photoPath = `${story.user_id}/${Date.now()}.${ext}`;
        const { data: photoData, error: photoError } = await supabase.storage
          .from('photos')
          .upload(photoPath, newPhotoFile, { contentType: newPhotoFile.type });

        if (photoError || !photoData) {
          throw new Error(
            lang === 'vi'
              ? 'Không tải được ảnh lên. Câu chuyện chưa được lưu, vui lòng thử lại.'
              : 'Photo upload failed. Your changes were not saved. Please try again.'
          );
        }
        finalImageUrl = photoData.path;
      } else if (photoRemoved) {
        finalImageUrl = null;
      }

      const { error } = await supabase
        .from('stories')
        .update({
          title: title.trim(),
          category,
          visibility,
          is_public: visibility === 'public',
          content_text: contentText.trim() || null,
          photo_caption: photoCaption.trim() || null,
          image_url: finalImageUrl,
          audio_transcript: audioTranscript.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      if (error) throw error;

      setMessage({ type: 'success', text: bt.story.savedSuccess || 'Saved successfully!' });
      setTimeout(() => {
        router.push(`/story/${story.id}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating story' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(bt.story.deleteConfirm);
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting story');
      setDeleting(false);
    }
  };

  return (
    <AppShell back={{ href: `/story/${story.id}`, label: lang === 'vi' ? 'Câu chuyện' : 'Story' }}>
      <div className={styles.main}>
        <form onSubmit={handleSave} className={styles.card}>
          <h1 className={styles.pageTitle}>{bt.story.editTitle}</h1>

          {message && (
            <div className={`${styles.statusMessage} ${message.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
              {message.text}
            </div>
          )}

          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'vi' ? 'Tiêu đề câu chuyện' : 'Story Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className={styles.input}
              placeholder="e.g. Grandma's secret recipe..."
            />
          </div>

          {/* Category */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {bt.story.category}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="roots">{lang === 'vi' ? 'Gốc Rễ (Roots)' : 'Roots'}</option>
              <option value="traditions">{lang === 'vi' ? 'Truyền Thống (Traditions)' : 'Traditions'}</option>
              <option value="life_lessons">{lang === 'vi' ? 'Bài Học Cuộc Đời (Life Lessons)' : 'Life Lessons'}</option>
            </select>
          </div>

          {/* Privacy & Visibility */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'vi' ? 'Quyền riêng tư câu chuyện' : 'Story Privacy & Visibility'}
            </label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as any)}
              className={styles.select}
            >
              <option value="family">{lang === 'vi' ? '👨‍👩‍👧‍👦 Vòng tròn gia đình (Chỉ thành viên xem được)' : '👨‍👩‍👧‍👦 Family Circle Only'}</option>
              <option value="public">{lang === 'vi' ? '🌐 Công khai (Bất kỳ ai có liên kết)' : '🌐 Public via Link'}</option>
              <option value="private">{lang === 'vi' ? '🔒 Riêng tư (Chỉ mình tôi)' : '🔒 Private to Me'}</option>
            </select>
          </div>

          {/* Photo */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'vi' ? 'Ảnh kỷ niệm' : 'Cherished Photo'}
            </label>
            <PhotoUploader
              initialPreview={mediaSrc(imageUrl, 'photos') || undefined}
              onPhotoSelected={(file) => {
                if (file) {
                  setNewPhotoFile(file);
                  setPhotoRemoved(false);
                } else {
                  setNewPhotoFile(null);
                  setPhotoRemoved(true);
                  setImageUrl('');
                }
              }}
              caption={photoCaption}
              onCaptionChange={setPhotoCaption}
            />
          </div>

          {/* Audio Transcript */}
          <div className={styles.fieldGroup}>
            <div className={styles.transcriptHint}>
              <label className={styles.label}>
                {bt.story.audioTranscript}
              </label>
              {story.audio_url && (
                <button
                  type="button"
                  onClick={handleRetranscribe}
                  disabled={retranscribing}
                  style={{
                    background: 'var(--color-blush)',
                    color: 'var(--color-brand-dark)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {retranscribing
                    ? (lang === 'vi' ? 'Đang chép lời…' : 'Transcribing…')
                    : (lang === 'vi' ? 'Chép lại từ bản ghi' : 'Transcribe recording')}
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={audioTranscript}
              onChange={e => setAudioTranscript(e.target.value)}
              placeholder={lang === 'vi' ? 'Nội dung chép lời từ băng ghi âm...' : 'Audio transcript content...'}
              className={styles.textarea}
            />
          </div>

          {/* Written story text */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {bt.story.textSection}
            </label>
            <textarea
              rows={8}
              value={contentText}
              onChange={e => setContentText(e.target.value)}
              placeholder={lang === 'vi' ? 'Ký ức được viết lại...' : 'Written memories...'}
              className={styles.textarea}
            />
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className={styles.deleteBtn}
            >
              {deleting ? bt.story.deleting : `🗑 ${bt.story.deleteStory}`}
            </button>

            <button
              type="submit"
              disabled={saving || deleting}
              className={styles.saveBtn}
            >
              {saving ? bt.story.saving : bt.story.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
