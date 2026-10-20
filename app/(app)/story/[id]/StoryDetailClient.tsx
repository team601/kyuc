'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';
import { ShareModal } from '@/components/story/ShareModal';
import { AudioPlayer } from '@/components/story/AudioPlayer';
import { AppShell } from '@/components/app/AppShell';
import { StoryPhoto } from '@/components/app/StoryPhoto';
import { categoryTone, visibilityOf } from '@/components/app/storyMeta';
import { mediaSrc } from '@/lib/media';
import a from '@/components/app/app.module.css';
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
  visibility?: 'private' | 'family' | 'public';
}

interface StoryDetailClientProps {
  story: Story;
}

const VISIBILITY = {
  vi: { private: 'Riêng tư', family: 'Gia đình', public: 'Công khai' },
  en: { private: 'Private', family: 'Family', public: 'Public' },
};

export function StoryDetailClient({ story }: StoryDetailClientProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];
  const vi = lang === 'vi';

  const [showShareModal, setShowShareModal] = useState(false);
  const imageSrc = mediaSrc(story.image_url, 'photos');
  const audioSrc = mediaSrc(story.audio_url, 'audio');
  const audioDownloadSrc = mediaSrc(story.audio_url, 'audio', { download: true });
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tone = categoryTone(story.category);
  const catLabel = tone[lang];
  const visibility = visibilityOf(story);
  const question = vi
    ? (story.question_vi || story.question_en)
    : (story.question_en || story.question_vi);
  const date = new Date(story.created_at).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

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
    <AppShell back={{ href: '/dashboard', label: vi ? 'Câu chuyện' : 'Stories' }}>
      <article className={`${styles.article} ${a.screenIn}`}>
        <div className={styles.metaRow}>
          <span className={`${a.tag} ${tone.className}`}>{catLabel}</span>
          <span className={a.small}>{date}</span>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className={`${a.tag} ${a.sand} ${styles.visibility}`}
            title={vi ? 'Thay đổi quyền riêng tư' : 'Change privacy'}
          >
            <VisibilityIcon kind={visibility} />
            {VISIBILITY[lang][visibility]}
          </button>
        </div>

        <h1 className={a.title}>{story.title}</h1>

        {question && (
          <div className={styles.kyucAsk}>
            <span className={styles.kyucLabel}>{vi ? 'Kyuc hỏi' : 'Kyuc asked'}</span>
            <p className={styles.kyucBubble}>{question}</p>
          </div>
        )}

        {imageSrc && (
          <figure className={styles.photo}>
            <StoryPhoto src={imageSrc} alt={story.photo_caption || story.title} className={styles.photoImg} />
            {story.photo_caption && <figcaption className={styles.caption}>{story.photo_caption}</figcaption>}
          </figure>
        )}

        {audioSrc && (
          <section className={styles.section} aria-label={bt.story.audioSection}>
            <h2 className={styles.sectionLabel}>{vi ? 'Giọng kể' : 'In their voice'}</h2>
            <AudioPlayer src={audioSrc} downloadHref={audioDownloadSrc ?? undefined} />
          </section>
        )}

        {story.audio_transcript && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionLabel}>{bt.story.transcriptSection}</h2>
              <button type="button" onClick={handleCopyTranscript} className={`${a.chip} ${styles.copyBtn}`}>
                {copiedTranscript ? bt.story.transcriptCopied : bt.story.copyTranscript}
              </button>
            </div>
            <p className={styles.transcript}>{story.audio_transcript}</p>
          </section>
        )}

        {story.content_text && story.content_text.trim() && (
          <section className={styles.section}>
            {(story.audio_transcript || audioSrc) && (
              <h2 className={styles.sectionLabel}>{vi ? 'Ghi chép' : 'Written down'}</h2>
            )}
            <div className={styles.content}>
              {story.content_text.split('\n').map((para: string, i: number) =>
                para.trim() ? <p key={i}>{para}</p> : null
              )}
            </div>
          </section>
        )}

        <div className={`${a.pillRow} ${styles.actions}`}>
          <button type="button" onClick={() => setShowShareModal(true)} className={`${a.pill} ${a.pillCoral}`}>
            {bt.story.shareStory}
          </button>
          <Link href={`/story/${story.id}/edit`} className={`${a.pill} ${a.pillSoft}`}>
            {bt.story.editStory}
          </Link>
        </div>

        <div className={styles.footer}>
          <Link href="/story/new" className={`${a.pill} ${a.pillGhost} ${a.pillSm}`}>
            {vi ? '+ Kể thêm một chuyện' : '+ Record another story'}
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`${a.pill} ${a.pillDanger} ${a.pillSm}`}
          >
            {deleting ? bt.story.deleting : bt.story.deleteStory}
          </button>
        </div>
      </article>

      {showShareModal && (
        <ShareModal
          storyId={story.id}
          storyTitle={story.title}
          onClose={() => {
            setShowShareModal(false);
            router.refresh();
          }}
          initialVisibility={visibility}
          isPublicInitially={story.is_public}
        />
      )}
    </AppShell>
  );
}

function VisibilityIcon({ kind }: { kind: 'private' | 'family' | 'public' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'private' && <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>}
      {kind === 'family' && <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5" /></>}
      {kind === 'public' && <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>}
    </svg>
  );
}
