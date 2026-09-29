import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
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

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story || !story.is_public) {
    notFound();
  }

  const categoryLabels: Record<string, { en: string; vi: string }> = {
    roots: { en: 'Roots', vi: 'Gốc Rễ' },
    traditions: { en: 'Traditions', vi: 'Truyền Thống' },
    life_lessons: { en: 'Life Lessons', vi: 'Bài Học Cuộc Đời' },
  };

  const catLabel = categoryLabels[story.category]?.vi || story.category;
  const question = story.question_vi || story.question_en;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <div className={styles.headerRight}>
          <LanguageSwitcher />
          <Link href="/login" className="btn btn-ghost btn-sm">
            Đăng nhập / Sign in
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.meta}>
            <span className={styles.category}>{catLabel}</span>
            <span className={styles.date}>
              {new Date(story.created_at).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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
              <p className={styles.audioLabel}>🎙 Lắng nghe giọng nói</p>
              <audio controls src={story.audio_url} className={styles.audio} />
            </div>
          )}

          {story.audio_transcript && (
            <div className={styles.transcriptWrap}>
              <div className={styles.transcriptHeader}>
                <span className={styles.transcriptTitle}>
                  <span>📝</span> Bản chép lời giọng nói
                </span>
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
          <h2 className={styles.inviteTitle}>Ghi lại câu chuyện của gia đình bạn</h2>
          <p className={styles.inviteDesc}>
            Mỗi thế hệ đều có những câu chuyện vô giá. Bắt đầu lưu giữ giọng nói và ký ức của cha mẹ, ông bà ngay hôm nay trên kyuc°.
          </p>
          <Link href="/signup" className={styles.inviteBtn}>
            Bắt đầu miễn phí →
          </Link>
        </div>
      </main>
    </div>
  );
}
