'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './story.module.css';

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  photo_caption?: string | null;
  question_en?: string | null;
  question_vi?: string | null;
}

interface StoryDetailClientProps {
  story: Story;
}

export function StoryDetailClient({ story }: StoryDetailClientProps) {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const categoryLabels: Record<string, { en: string; vi: string }> = {
    roots:        { en: 'Roots',        vi: 'Gốc Rễ' },
    traditions:   { en: 'Traditions',   vi: 'Truyền Thống' },
    life_lessons: { en: 'Life Lessons', vi: 'Bài Học Cuộc Đời' },
  };

  const catLabel = categoryLabels[story.category]?.[lang] || story.category;
  const question = lang === 'vi'
    ? (story.question_vi || story.question_en)
    : (story.question_en || story.question_vi);

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
          {/* Category badge */}
          <div className={styles.meta}>
            <span className={styles.category}>{catLabel}</span>
            <span className={styles.date}>
              {new Date(story.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
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

          {/* Story text */}
          {story.content_text && (
            <div className={styles.content}>
              {story.content_text.split('\n').map((para: string, i: number) =>
                para.trim() ? <p key={i}>{para}</p> : null
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {story.audio_url && (
              <a href={story.audio_url} download className="btn btn-ghost btn-sm">
                ↓ {lang === 'vi' ? 'Tải âm thanh' : 'Download Audio'}
              </a>
            )}
            <Link href="/story/new" className="btn btn-primary btn-sm">
              {lang === 'vi' ? '+ Câu chuyện mới' : '+ New Story'}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
