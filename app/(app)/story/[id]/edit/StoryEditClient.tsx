'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
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
}

export function StoryEditClient({ story }: { story: Story }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [title, setTitle] = useState(story.title || '');
  const [category, setCategory] = useState(story.category || 'roots');
  const [contentText, setContentText] = useState(story.content_text || '');
  const [photoCaption, setPhotoCaption] = useState(story.photo_caption || '');
  const [imageUrl, setImageUrl] = useState(story.image_url || '');
  const [audioTranscript, setAudioTranscript] = useState(story.audio_transcript || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Web Speech API for transcript dictation
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(lang === 'vi' ? 'Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp.' : 'Your browser does not support Web Speech Recognition.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setAudioTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('stories')
        .update({
          title: title.trim(),
          category,
          content_text: contentText.trim() || null,
          photo_caption: photoCaption.trim() || null,
          image_url: imageUrl || null,
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
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/story/${story.id}`} className={styles.back}>
          ← {bt.story.backToDashboard}
        </Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className={styles.main}>
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

          {/* Photo */}
          {imageUrl && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                {lang === 'vi' ? 'Ảnh kỷ niệm' : 'Cherished Photo'}
              </label>
              <div className={styles.previewPhoto}>
                <img src={imageUrl} alt="Story photo" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className={styles.removePhotoBtn}
                >
                  ✕ {lang === 'vi' ? 'Gỡ ảnh' : 'Remove photo'}
                </button>
              </div>
              <input
                type="text"
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                placeholder={lang === 'vi' ? 'Chú thích cho bức ảnh...' : 'Photo caption...'}
                className={styles.input}
              />
            </div>
          )}

          {/* Audio Transcript */}
          <div className={styles.fieldGroup}>
            <div className={styles.transcriptHint}>
              <label className={styles.label}>
                {bt.story.audioTranscript}
              </label>
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  background: isListening ? '#FEE2E2' : '#F3F4F6',
                  color: isListening ? '#DC2626' : '#4B5563',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {isListening ? bt.story.speechToTextActive : `🎙 ${bt.story.speechToTextHint}`}
              </button>
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
      </main>
    </div>
  );
}
