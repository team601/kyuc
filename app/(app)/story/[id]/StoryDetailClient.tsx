'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { ShareModal } from '@/components/story/ShareModal';
import styles from './story.module.css';

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  image_url?: string | null;
  photo_caption?: string | null;
  question_en?: string | null;
  question_vi?: string | null;
  is_public?: boolean;
}

interface StoryDetailClientProps {
  story: Story;
}

export function StoryDetailClient({ story }: StoryDetailClientProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const categoryLabels: Record<string, { en: string; vi: string }> = {
    roots:        { en: 'Roots',        vi: 'Gốc Rễ' },
    traditions:   { en: 'Traditions',   vi: 'Truyền Thống' },
    life_lessons: { en: 'Life Lessons', vi: 'Bài Học Cuộc Đời' },
  };

  const catLabel = categoryLabels[story.category]?.[lang] || story.category.replace(/_/g, ' ');
  const question = lang === 'vi'
    ? (story.question_vi || story.question_en)
    : (story.question_en || story.question_vi);

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

  const handleCopyTranscript = async () => {
    if (!story.audio_transcript) return;
    try {
      await navigator.clipboard.writeText(story.audio_transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>{bt.story.backToDashboard}</Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LanguageSwitcher />
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          {/* Top Bar with Category, Date, and Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className={styles.meta}>
              <span className={styles.category}>{catLabel}</span>
              <span className={styles.date}>
                {new Date(story.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>

            {/* Quick Actions (Share, Edit, Delete) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                title={bt.story.shareStory}
              >
                <span>↗</span> {bt.story.shareStory}
              </button>
              <Link
                href={`/story/${story.id}/edit`}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>✏️</span> {bt.story.editStory}
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-ghost btn-sm"
                style={{ color: '#DC2626', borderColor: '#FECACA' }}
                title={bt.story.deleteStory}
              >
                {deleting ? bt.story.deleting : `🗑 ${bt.story.deleteStory}`}
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className={styles.title}>{story.title}</h1>

          {/* Question */}
          {question && (
            <blockquote className={styles.question}>
              &ldquo;{question}&rdquo;
            </blockquote>
          )}

          {/* Cherished Photo */}
          {story.image_url && (
            <div className={styles.photoWrap}>
              <img
                src={story.image_url}
                alt={story.photo_caption || story.title}
                className={styles.photoImg}
              />
              {story.photo_caption && (
                <p className={styles.photoCaption}>
                  <span>📷</span>
                  {story.photo_caption}
                </p>
              )}
            </div>
          )}

          {/* Audio player */}
          {story.audio_url && (
            <div className={styles.audioWrap}>
              <p className={styles.audioLabel}>🎙 {bt.story.audioSection}</p>
              <audio controls src={story.audio_url} className={styles.audio} />
            </div>
          )}

          {/* Audio Transcript */}
          {story.audio_transcript && (
            <div style={{
              background: '#FFFBF7',
              border: '1px solid #F3E7DC',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#8C4325', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📝</span> {bt.story.transcriptSection}
                </span>
                <button
                  onClick={handleCopyTranscript}
                  style={{
                    background: 'none',
                    border: '1px solid #E5DFD7',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: copiedTranscript ? '#16A34A' : '#736F6E',
                    fontWeight: 600,
                  }}
                >
                  {copiedTranscript ? bt.story.transcriptCopied : bt.story.copyTranscript}
                </button>
              </div>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: 'var(--color-ink)',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                {story.audio_transcript}
              </p>
            </div>
          )}

          {/* Story text */}
          {story.content_text && (
            <div className={styles.content}>
              {story.content_text.split('\n').map((para: string, i: number) =>
                para.trim() ? <p key={i}>{para}</p> : null
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className={styles.actions}>
            {story.audio_url && (
              <a href={story.audio_url} download className="btn btn-ghost btn-sm">
                ↓ {lang === 'vi' ? 'Tải âm thanh' : 'Download Audio'}
              </a>
            )}
            <button
              onClick={() => setShowShareModal(true)}
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: 600 }}
            >
              <span>↗</span> {bt.story.shareStory}
            </button>
            <Link href="/story/new" className="btn btn-primary btn-sm">
              {lang === 'vi' ? '+ Câu chuyện mới' : '+ New Story'}
            </Link>
          </div>
        </article>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          storyId={story.id}
          storyTitle={story.title}
          onClose={() => setShowShareModal(false)}
          isPublicInitially={story.is_public}
        />
      )}
    </div>
  );
}
