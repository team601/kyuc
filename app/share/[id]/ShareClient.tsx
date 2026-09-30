'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AudioPlayer } from '@/components/story/AudioPlayer';
import { createClient } from '@/lib/supabase/client';
import styles from './share.module.css';

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
}

export function ShareClient({ story }: { story: Story }) {
  const { lang } = useLanguage();
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const categoryLabels: Record<string, { en: string; vi: string }> = {
    roots: { en: 'Roots', vi: 'Gốc Rễ' },
    traditions: { en: 'Traditions', vi: 'Truyền Thống' },
    life_lessons: { en: 'Life Lessons', vi: 'Bài Học Cuộc Đời' },
  };

  const catLabel =
    categoryLabels[story.category]?.[lang] ||
    story.category.replace(/_/g, ' ');

  const question =
    lang === 'vi'
      ? story.question_vi || story.question_en
      : story.question_en || story.question_vi;

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
        <Link href="/" className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 4v20M6 14L20 6M6 14L20 22"
              stroke="#E8503A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            kyuc<sup>°</sup>
          </span>
        </Link>
        <div className={styles.headerRight}>
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              {lang === 'vi' ? 'Bảng điều khiển' : 'Dashboard'}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm">
              {lang === 'vi' ? 'Đăng nhập' : 'Sign in'}
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.meta}>
            <span className={styles.category}>{catLabel}</span>
            <span className={styles.date}>
              {new Date(story.created_at).toLocaleDateString(
                lang === 'vi' ? 'vi-VN' : 'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </span>
          </div>

          <h1 className={styles.title}>{story.title}</h1>

          {question && (
            <blockquote className={styles.question}>
              &ldquo;{question}&rdquo;
            </blockquote>
          )}

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

          {story.audio_url && (
            <div className={styles.audioWrap}>
              <p className={styles.audioLabel}>
                🎙 {lang === 'vi' ? 'Lắng nghe giọng nói' : 'Listen to voice recording'}
              </p>
              <AudioPlayer src={story.audio_url} />
            </div>
          )}

          {story.audio_transcript && (
            <div className={styles.transcriptWrap}>
              <div className={styles.transcriptHeader}>
                <span className={styles.transcriptTitle}>
                  <span>📝</span>{' '}
                  {lang === 'vi'
                    ? 'Bản chép lời giọng nói'
                    : 'Voice Transcript'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  style={{
                    background: 'none',
                    border: '1px solid #E5DFD7',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-md, 0.375rem)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: copiedTranscript ? '#16A34A' : '#736F6E',
                    fontWeight: 600,
                  }}
                >
                  {copiedTranscript
                    ? lang === 'vi'
                      ? '✓ Đã sao chép'
                      : '✓ Copied'
                    : lang === 'vi'
                    ? 'Sao chép'
                    : 'Copy'}
                </button>
              </div>
              <div className={styles.transcriptContent}>
                {story.audio_transcript}
              </div>
            </div>
          )}

          {story.content_text && (
            <div className={styles.content}>
              {story.content_text.split('\n').map((para: string, i: number) =>
                para.trim() ? <p key={i}>{para}</p> : null
              )}
            </div>
          )}
        </article>

        {/* Call to action for readers */}
        <div className={styles.inviteCard}>
          <h2 className={styles.inviteTitle}>
            {lang === 'vi'
              ? 'Ghi lại câu chuyện của gia đình bạn'
              : 'Preserve your family’s stories'}
          </h2>
          <p className={styles.inviteDesc}>
            {lang === 'vi'
              ? 'Mỗi thế hệ đều có những câu chuyện vô giá. Bắt đầu lưu giữ giọng nói và ký ức của cha mẹ, ông bà ngay hôm nay trên kyuc°.'
              : 'Every generation holds priceless memories. Start recording and cherishing the voices of your parents and grandparents today on kyuc°.'}
          </p>
          <Link href="/signup" className={styles.inviteBtn}>
            {lang === 'vi' ? 'Bắt đầu miễn phí →' : 'Start free →'}
          </Link>
        </div>
      </main>
    </div>
  );
}
