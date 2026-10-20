'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { questions } from '@/lib/questions';
import { mediaSrc } from '@/lib/media';
import { AppShell } from '@/components/app/AppShell';
import { StoryPhoto } from '@/components/app/StoryPhoto';
import { categoryTone } from '@/components/app/storyMeta';
import a from '@/components/app/app.module.css';
import { loadDraft, clearDraft } from '@/lib/draftStore';
import { uploadStoryAudio } from '@/lib/storageUpload';
import styles from './dashboard.module.css';

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  question_en?: string | null;
  question_vi?: string | null;
  user_id: string;
  is_public?: boolean;
  visibility?: string | null;
  authorName?: string;
  authorRole?: string;
  isFamilyStory?: boolean;
}

interface PendingDraft {
  category: string;
  questionEn: string;
  questionVi: string;
  text: string;
  audio?: Blob | null;
  savedAt: number;
}

interface DashboardClientProps {
  userId: string;
  displayName: string;
  userEmail: string;
  stories: Story[] | null;
  familyMemberCount?: number;
}

export function DashboardClient({ userId, displayName, userEmail, stories, familyMemberCount = 1 }: DashboardClientProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'family'>('all');
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [claimingDraft, setClaimingDraft] = useState(false);

  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    // Homepage draft: IndexedDB holds the recording; localStorage is the text-only fallback.
    (async () => {
      const draft = await loadDraft('landing');
      if (draft && (draft.audio || draft.text?.trim())) {
        setPendingDraft({
          category: draft.category || 'roots',
          questionEn: draft.questionEn || '',
          questionVi: draft.questionVi || '',
          text: draft.text || '',
          audio: draft.audio ?? null,
          savedAt: draft.savedAt,
        });
        return;
      }
      try {
        const stored = localStorage.getItem('kyuc_pending_draft');
        if (stored) setPendingDraft(JSON.parse(stored) as PendingDraft);
      } catch {}
    })();
  }, []);

  const forgetDraft = async () => {
    await clearDraft('landing');
    try {
      localStorage.removeItem('kyuc_pending_draft');
    } catch {}
    setPendingDraft(null);
  };

  const handleDismissDraft = async () => {
    if (pendingDraft?.audio && !window.confirm(lang === 'vi'
      ? 'Bỏ qua sẽ xóa bản ghi âm chưa lưu này. Không thể khôi phục lại.'
      : 'Dismissing deletes this unsaved recording. This cannot be undone.')) return;
    await forgetDraft();
  };

  const handleClaimDraft = async () => {
    if (!pendingDraft) return;
    setClaimingDraft(true);
    setClaimError(null);
    const supabase = createClient();
    let audioPath: string | null = null;
    try {
      if (pendingDraft.audio) {
        audioPath = await uploadStoryAudio(supabase, userId, pendingDraft.audio);
      }
      const title = (lang === 'vi' ? pendingDraft.questionVi : pendingDraft.questionEn).slice(0, 60) || 'Untitled';
      // Private until the storyteller chooses to share it.
      const { error } = await supabase.from('stories').insert({
        user_id: userId,
        title,
        category: pendingDraft.category || 'roots',
        question_en: pendingDraft.questionEn,
        question_vi: pendingDraft.questionVi,
        content_text: pendingDraft.text || '',
        audio_url: audioPath,
        visibility: 'private',
        is_public: false,
      });
      if (error) throw error;

      await forgetDraft();
      router.refresh();
    } catch {
      if (audioPath) await supabase.storage.from('audio').remove([audioPath]);
      // Keep the draft so nothing is lost; the user can retry.
      setClaimError(lang === 'vi'
        ? 'Chưa lưu được. Bản nháp vẫn được giữ trên trình duyệt này, vui lòng thử lại.'
        : 'Could not save yet. The draft is still kept in this browser. Please try again.');
    } finally {
      setClaimingDraft(false);
    }
  };

  const vi = lang === 'vi';
  const audioCount = stories?.filter(s => s.audio_url).length ?? 0;
  const myStories = (stories || []).filter(s => s.user_id === userId);
  const familyStories = (stories || []).filter(s => s.user_id !== userId);
  const myStoriesCount = myStories.length;
  const familyStoriesCount = familyStories.length;

  const displayedStories = activeTab === 'all'
    ? (stories || [])
    : activeTab === 'mine'
      ? myStories
      : familyStories;

  // Câu hỏi hôm nay: đổi theo ngày, bấm "Câu khác" để xem câu tiếp theo
  const [questionOffset, setQuestionOffset] = useState(0);
  const [today, setToday] = useState<Date | null>(null);
  // ngày lấy theo máy người dùng sau khi hydrate, tránh lệch múi giờ giữa server và trình duyệt
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setToday(new Date()), []);
  const dayIndex = today ? Math.floor(today.getTime() / 86400000) : 0;
  const todayQuestion = questions[(dayIndex + questionOffset) % questions.length];
  const firstName = displayName.split(' ')[0] || displayName;
  const countLabel = (n: number, one: string, many: string, viLabel = vi) => `${n} ${viLabel || n === 1 ? one : many}`;

  return (
    <AppShell active="home" wide>
      <div className={styles.layout}>
        <section className={`${styles.welcome} ${a.screenIn}`}>
          <p className={a.muted} suppressHydrationWarning>
            {today
              ? today.toLocaleDateString(vi ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
              : ' '}
          </p>
          <h1 className={a.hello}>{vi ? `Chào ${firstName}` : `Hello, ${firstName}`}</h1>
          <p className={a.muted}>
            {stories?.length
              ? bt.dashboard.subHasStories(stories.length)
              : bt.dashboard.subNoStories}
          </p>

          <div className={`${a.qCard} ${styles.qCard}`}>
            <span className={a.qLabel}>{vi ? 'Câu hỏi hôm nay' : "Today's question"}</span>
            <p className={a.qText}>{todayQuestion[lang]}</p>
            <button type="button" className={styles.otherQ} onClick={() => setQuestionOffset(o => o + 1)}>
              {vi ? 'Câu khác' : 'Another question'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
              </svg>
            </button>
          </div>

          <Link
            href={`/story/new?category=${todayQuestion.category}&q=${todayQuestion.id}`}
            className={`${a.pill} ${a.pillCoral} ${a.pillBlock}`}
          >
            <span className={a.recDot} aria-hidden="true" />
            {vi ? 'Bắt đầu kể' : 'Start telling'}
          </Link>

          <div className={styles.stats}>
            <span className={`${a.tag} ${a.blush}`}>{countLabel(stories?.length ?? 0, vi ? 'câu chuyện' : 'story', 'stories')}</span>
            <span className={`${a.tag} ${a.butter}`}>{countLabel(audioCount, vi ? 'bản ghi âm' : 'recording', 'recordings')}</span>
            <Link href="/family" className={`${a.tag} ${a.mint}`}>{countLabel(familyMemberCount, vi ? 'người trong nhà' : 'family member', 'family members', vi)}</Link>
          </div>
        </section>

        <section className={styles.listCol} aria-label={bt.nav.myStories}>
          {pendingDraft && (
            <div className={`${a.notice} ${a.noticeWarm} ${a.pop1}`}>
              <strong className={styles.draftTitle}>
                {vi ? 'Bạn có một ký ức chưa lưu từ trang chủ' : 'You have an unsaved memory from the homepage'}
              </strong>
              <span>
                &ldquo;{vi ? pendingDraft.questionVi : pendingDraft.questionEn}&rdquo;
                {pendingDraft.audio && (vi ? ' · có kèm bản ghi âm' : ' · includes a voice recording')}
              </span>
              {claimError && <span role="alert" className={styles.draftError}>{claimError}</span>}
              <div className={styles.draftActions}>
                <button onClick={handleClaimDraft} disabled={claimingDraft} className={`${a.pill} ${a.pillCoral} ${a.pillSm}`}>
                  {claimingDraft
                    ? (vi ? 'Đang lưu…' : 'Saving…')
                    : (vi ? 'Lưu vào tài khoản' : 'Save to my archive')}
                </button>
                <button onClick={handleDismissDraft} className={`${a.pill} ${a.pillSm} ${styles.draftDismiss}`}>
                  {vi ? 'Bỏ qua' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.listHead}>
            <h2 className={styles.listTitle}>{vi ? 'Kho câu chuyện' : 'Your archive'}</h2>
            {familyStoriesCount > 0 && (
              <div className={a.chips} role="tablist">
                {([
                  ['all', bt.dashboard.tabs.all, stories?.length ?? 0],
                  ['mine', bt.dashboard.tabs.mine, myStoriesCount],
                  ['family', bt.dashboard.tabs.family, familyStoriesCount],
                ] as const).map(([key, label, count]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={activeTab === key}
                    onClick={() => setActiveTab(key)}
                    className={`${a.chip} ${activeTab === key ? a.chipOn : ''}`}
                  >
                    {label} · {count}
                  </button>
                ))}
              </div>
            )}
          </div>

          {displayedStories.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </span>
              <h3 className={styles.emptyTitle}>{bt.dashboard.empty.title}</h3>
              <p className={a.muted}>{bt.dashboard.empty.desc}</p>
              <Link href="/story/new" className={`${a.pill} ${a.pillCoral}`}>{bt.dashboard.empty.cta}</Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {displayedStories.map((story, i) => {
                const tone = categoryTone(story.category);
                const thumb = mediaSrc(story.image_url, 'photos');
                const q = vi ? (story.question_vi || story.question_en) : (story.question_en || story.question_vi);
                return (
                  <li key={story.id} className={i < 6 ? a.screenIn : undefined} style={i < 6 ? { animationDelay: `${0.05 * i}s` } : undefined}>
                    <Link href={`/story/${story.id}`} className={styles.row}>
                      {thumb ? (
                        <StoryPhoto src={thumb} alt="" className={styles.thumb} compact />
                      ) : (
                        <span className={`${styles.thumb} ${styles.thumbTone} ${tone.className}`} aria-hidden="true">
                          {story.audio_url ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                            </svg>
                          ) : (
                            <span className={styles.thumbLetter}>{(story.title || '?').trim()[0]?.toUpperCase()}</span>
                          )}
                        </span>
                      )}
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{story.title}</span>
                        {q && q !== story.title && <span className={styles.rowQuestion}>{q}</span>}
                        <span className={styles.rowMeta}>
                          <span className={`${a.tag} ${tone.className}`}>{tone[lang]}</span>
                          {story.isFamilyStory && (
                            <span className={`${a.tag} ${a.sand}`}>
                              {bt.dashboard.fromAuthor(story.authorName || bt.dashboard.familyBadge)}
                            </span>
                          )}
                          {story.audio_url && (
                            <span className={styles.audioMark} aria-label={vi ? 'Có ghi âm' : 'Has audio'}>
                              <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
                            </span>
                          )}
                          <span className={a.small}>
                            {new Date(story.created_at).toLocaleDateString(vi ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
