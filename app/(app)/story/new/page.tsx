'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getRandomQuestion, categoryMeta, questions, type Category, type Question } from '@/lib/questions';
import { saveDraft, loadDraft, clearDraft, draftHasContent, type StoryDraft } from '@/lib/draftStore';
import { uploadStoryAudio, uploadStoryPhoto, UploadError } from '@/lib/storageUpload';
import { useUnsavedGuard } from '@/lib/useUnsavedGuard';
import PhotoUploader from '@/components/story/PhotoUploader';
import { AudioPlayer } from '@/components/story/AudioPlayer';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { AppShell } from '@/components/app/AppShell';
import { categoryTone } from '@/components/app/storyMeta';
import a from '@/components/app/app.module.css';
import styles from './new.module.css';

function NewStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('category') as Category) || 'roots';
  // ?q=<id> từ "Câu hỏi hôm nay" ở dashboard: vào thẳng bước ghi âm với đúng câu hỏi đó
  const initialQuestion = questions.find(q => q.id === searchParams.get('q'));

  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [category, setCategory] = useState<Category>(initialQuestion?.category ?? initialCat);
  const [question, setQuestion] = useState<Question>(() => initialQuestion ?? getRandomQuestion(initialCat));
  const [title, setTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'category' | 'record' | 'save'>(initialQuestion ? 'record' : 'category');
  const [showWriting, setShowWriting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restorableDraft, setRestorableDraft] = useState<StoryDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [localBackupFailed, setLocalBackupFailed] = useState(false);

  const hasUnsavedWork = isRecording || !!audioBlob || !!storyText.trim() || !!audioTranscript.trim();
  useUnsavedGuard(hasUnsavedWork && !saving);

  // Offer to restore an unsaved draft from an earlier visit (refresh, crash, failed upload).
  useEffect(() => {
    loadDraft('story-new').then(draft => {
      if (draftHasContent(draft)) setRestorableDraft(draft);
      setDraftChecked(true);
    });
  }, []);

  // Keep a local backup of unsaved work in this browser until it is saved to the account.
  // Paused while an older draft is waiting to be restored or discarded, so it is never overwritten.
  useEffect(() => {
    if (!draftChecked || restorableDraft || isRecording) return;
    if (!audioBlob && !storyText.trim() && !audioTranscript.trim()) return;
    const timer = setTimeout(() => {
      saveDraft('story-new', {
        audio: audioBlob,
        audioMime: audioBlob?.type ?? null,
        text: storyText,
        title,
        transcript: audioTranscript,
        photoCaption,
        category,
        questionId: question.id,
        questionEn: question.en,
        questionVi: question.vi,
        savedAt: Date.now(),
      }).then(ok => setLocalBackupFailed(!ok && !!audioBlob));
    }, 500);
    return () => clearTimeout(timer);
  }, [draftChecked, restorableDraft, isRecording, audioBlob, storyText, title, audioTranscript, photoCaption, category, question]);

  const handleRestoreDraft = () => {
    const draft = restorableDraft;
    if (!draft) return;
    const cat = (draft.category && draft.category in categoryMeta ? draft.category : category) as Category;
    const restoredQuestion: Question =
      questions.find(q => q.id === draft.questionId) ||
      (draft.questionEn || draft.questionVi
        ? { id: draft.questionId || 'restored', category: cat, en: draft.questionEn || draft.questionVi || '', vi: draft.questionVi || draft.questionEn || '' }
        : question);
    setCategory(cat);
    setQuestion(restoredQuestion);
    setStoryText(draft.text || '');
    if (draft.text?.trim()) setShowWriting(true);
    setTitle(draft.title || '');
    setAudioTranscript(draft.transcript || '');
    setPhotoCaption(draft.photoCaption || '');
    if (draft.audio) {
      setAudioBlob(draft.audio);
      setAudioUrl(URL.createObjectURL(draft.audio));
    }
    setRestorableDraft(null);
    setStep('record');
  };

  const handleDiscardDraft = async () => {
    const msg = restorableDraft?.audio
      ? (lang === 'vi' ? 'Xóa bản ghi âm chưa lưu này? Không thể khôi phục lại.' : 'Delete this unsaved recording? This cannot be undone.')
      : (lang === 'vi' ? 'Xóa bản nháp chưa lưu này?' : 'Delete this unsaved draft?');
    if (!window.confirm(msg)) return;
    await clearDraft('story-new');
    setRestorableDraft(null);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setQuestion(getRandomQuestion(cat));
    setStep('record');
  };

  const handleNextQuestion = () => {
    if (audioBlob && !window.confirm(lang === 'vi'
      ? 'Đổi câu hỏi sẽ bỏ bản ghi âm hiện tại. Bạn chắc chứ?'
      : 'Changing the question discards the current recording. Continue?')) return;
    setQuestion(getRandomQuestion(category));
    setStoryText('');
    setAudioTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [micError, setMicError] = useState<string | null>(null);

  const getOptimalAudioMimeType = () => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    if (isIOS || isSafari) {
      if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) return 'audio/mp4;codecs=mp4a.40.2';
      if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
      if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac';
    }

    const candidates = [
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }
    return '';
  };

  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = getOptimalAudioMimeType();
      const options = preferredMime ? { mimeType: preferredMime } : undefined;
      let recorder: MediaRecorder;
      try {
        recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const actualMime = recorder.mimeType || preferredMime || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setMicError(lang === 'vi'
        ? 'Trình duyệt chưa cho phép truy cập micro. Hãy bấm vào biểu tượng ổ khóa cạnh thanh địa chỉ để bật lại quyền, hoặc chuyển sang viết trực tiếp câu chuyện bên dưới.'
        : 'Microphone access is blocked. Please check your browser address bar permissions or write your story directly in the text box.');
    }
  }, [lang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const handleSave = async () => {
    if (!storyText.trim() && !audioBlob && !photoFile) {
      alert(lang === 'vi'
        ? 'Vui lòng viết câu chuyện, ghi âm hoặc đính kèm ảnh.'
        : 'Please write a story, record audio, or attach a photo.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // The draft is backed up in this browser and can be restored after signing in.
      setSaving(false);
      router.push('/login');
      return;
    }

    let audio_url: string | null = null;
    let image_url: string | null = null;

    // Never save a story whose media failed to upload: keep everything on screen and let the user retry.
    try {
      if (audioBlob) audio_url = await uploadStoryAudio(supabase, user.id, audioBlob);
      if (photoFile) image_url = await uploadStoryPhoto(supabase, user.id, photoFile);
    } catch (err) {
      const tooLarge = err instanceof UploadError && err.message === 'too_large';
      setSaveError(tooLarge
        ? (lang === 'vi' ? 'Bản ghi âm vượt quá dung lượng tối đa (50MB). Hãy tải bản ghi về máy để giữ lại.' : 'The recording is over the 50MB limit. Please download it to keep a copy.')
        : (lang === 'vi'
          ? 'Chưa tải lên được. Bản ghi âm vẫn còn ở đây, vui lòng kiểm tra kết nối và bấm Lưu lại.'
          : 'Upload failed. Your recording is still here. Check your connection and press Save again.'));
      if (audio_url) await supabase.storage.from('audio').remove([audio_url]);
      setSaving(false);
      return;
    }

    // New stories are private until the storyteller chooses to share them.
    const { data: story, error } = await supabase.from('stories').insert({
      user_id: user.id,
      title: title || question[lang].slice(0, 60),
      question_en: question.en,
      question_vi: question.vi,
      category,
      content_text: storyText,
      audio_url,
      audio_transcript: audioTranscript.trim() || null,
      image_url,
      photo_caption: photoCaption || null,
      language: lang,
      visibility: 'private',
      is_public: false,
    }).select().single();

    if (error || !story) {
      if (audio_url) await supabase.storage.from('audio').remove([audio_url]);
      if (image_url) await supabase.storage.from('photos').remove([image_url]);
      setSaveError(lang === 'vi'
        ? 'Không thể lưu câu chuyện. Nội dung vẫn còn ở đây, vui lòng thử lại.'
        : 'Could not save the story. Everything is still here. Please try again.');
      setSaving(false);
      return;
    }

    await clearDraft('story-new');
    router.push(`/story/${story.id}`);
  };

  const vi = lang === 'vi';
  const hasAnswer = !!audioUrl || !!storyText.trim();

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (audioBlob && !window.confirm(vi
      ? 'Ghi lại sẽ thay bản ghi âm hiện tại. Bạn chắc chứ?'
      : 'Recording again replaces the current recording. Continue?')) return;
    startRecording();
  };

  return (
    <AppShell active="new" back={{ href: '/dashboard', label: vi ? 'Câu chuyện' : 'Stories' }}>
      {restorableDraft && (
        <div role="status" className={`${a.notice} ${a.noticeWarm} ${styles.notice}`}>
          <span>
            {restorableDraft.audio
              ? (vi ? 'Bạn có một bản ghi âm chưa lưu trên trình duyệt này.' : 'You have an unsaved recording in this browser.')
              : (vi ? 'Bạn có một bản nháp chưa lưu trên trình duyệt này.' : 'You have an unsaved draft in this browser.')}
          </span>
          <div className={a.pillRow}>
            <button type="button" className={`${a.pill} ${a.pillCoral} ${a.pillSm}`} onClick={handleRestoreDraft}>
              {vi ? 'Khôi phục' : 'Restore'}
            </button>
            <button type="button" className={`${a.pill} ${a.pillSoft} ${a.pillSm}`} onClick={handleDiscardDraft}>
              {vi ? 'Xóa' : 'Discard'}
            </button>
          </div>
        </div>
      )}

      {/* Bước 1: chọn chủ đề */}
      {step === 'category' && (
        <div className={`${styles.stepWrap} ${a.screenIn}`}>
          <span className={styles.progress}><span className={styles.progressFill} style={{ width: '33%' }} /></span>
          <h1 className={a.title}>{bt.newStory.stepCategory.title}</h1>
          <p className={a.muted}>{bt.newStory.stepCategory.desc}</p>

          <div className={styles.categoryList}>
            {(Object.keys(categoryMeta) as Category[]).map((cat, i) => {
              const m = categoryMeta[cat];
              const tone = categoryTone(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`${styles.categoryCard} ${tone.className} ${[a.pop1, a.pop2, a.pop3][i] ?? ''}`}
                >
                  <span className={styles.catTop}>
                    <span className={styles.catLabel}>{tone[lang]}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  <span className={styles.catTagline}>{m.tagline[lang]}</span>
                  <span className={styles.catSample}>{m.sampleQuestion[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bước 2: ghi âm */}
      {step === 'record' && (
        <div className={`${styles.recordWrap} ${a.screenIn}`}>
          <span className={styles.progress}><span className={styles.progressFill} style={{ width: hasAnswer ? '100%' : '66%' }} /></span>

          <div className={styles.topicRow}>
            <span className={`${a.tag} ${categoryTone(category).className}`}>{categoryTone(category)[lang]}</span>
            <button onClick={() => setStep('category')} className={styles.linkBtn} disabled={isRecording}>
              {vi ? 'Đổi chủ đề' : 'Change topic'}
            </button>
          </div>

          <div className={styles.center}>
            <h1 className={styles.recQuestion}>{question[lang]}</h1>
            <button onClick={handleNextQuestion} className={styles.linkBtn} disabled={isRecording}>
              {bt.newStory.stepRecord.anotherPrompt}
            </button>
            <p className={a.muted}>
              {vi ? 'Cứ kể tự nhiên như đang nói chuyện. Không cần hoàn hảo.' : 'Just talk, the way you would at the table. It does not need to be perfect.'}
            </p>

            <span className={`${styles.wave} ${isRecording ? styles.waveLive : ''}`} aria-hidden="true">
              {WAVE.map((h, i) => (
                <span key={i} className={styles.bar} style={{ height: h, animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>

            <span className={`${styles.recStatus} ${isRecording ? styles.recStatusLive : ''}`} aria-live="polite">
              {isRecording
                ? `● ${vi ? 'Đang ghi' : 'Recording'} ${formatTime(recordingTime)}`
                : audioUrl
                  ? `${bt.newStory.stepRecord.recorded} ${formatTime(recordingTime)}`
                  : (vi ? 'Chạm để bắt đầu ghi âm' : 'Tap to start recording')}
            </span>

            <button
              type="button"
              className={`${styles.recBtn} ${isRecording ? styles.recBtnLive : ''}`}
              onClick={handleRecordPress}
              aria-label={isRecording
                ? (vi ? 'Dừng ghi âm' : 'Stop recording')
                : audioUrl ? (vi ? 'Ghi lại' : 'Record again') : (vi ? 'Bắt đầu ghi âm' : 'Start recording')}
            >
              <span className={isRecording ? styles.recStop : styles.recDot} />
            </button>
            {audioUrl && !isRecording && (
              <span className={a.small}>{vi ? 'Chạm nút để ghi lại' : 'Tap to record again'}</span>
            )}
          </div>

          {micError && (
            <div className={`${a.notice} ${a.noticeError}`} role="alert">
              <span>{micError}</span>
              <button
                type="button"
                className={a.noticeLink}
                onClick={() => {
                  setShowWriting(true);
                  setTimeout(() => document.getElementById('story-text-input')?.focus(), 50);
                }}
              >
                {vi ? 'Viết câu chuyện thay vì ghi âm' : 'Write the story instead'}
              </button>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className={`${a.stack} ${a.pop1}`}>
              <AudioPlayer src={audioUrl} title={vi ? 'Bản ghi vừa xong' : 'Your recording'} />
              <span className={a.small}>
                {vi ? 'Sau khi lưu, Kyuc sẽ tự chép lại lời kể thành chữ.' : 'After you save, Kyuc writes the recording down as text.'}
              </span>
            </div>
          )}

          {audioTranscript && !isRecording && (
            <div className={`${a.field} ${styles.transcript}`}>
              <label className={a.fieldLabel} htmlFor="story-transcript">
                {bt.story.audioTranscript}
              </label>
              <textarea
                id="story-transcript"
                rows={4}
                className={`${a.textarea} ${styles.serifText}`}
                value={audioTranscript}
                onChange={e => setAudioTranscript(e.target.value)}
                placeholder={vi ? 'Lời kể sẽ hiện ở đây khi ghi âm. Bạn có thể sửa lại.' : 'The words appear here as you speak. You can fix them later.'}
              />
            </div>
          )}

          <div className={styles.details}>
            {!showWriting && !storyText ? (
              <button type="button" className={`${a.pill} ${a.pillGhost} ${a.pillBlock}`} onClick={() => setShowWriting(true)}>
                {vi ? 'Hoặc viết thay vì nói' : 'Or write it instead'}
              </button>
            ) : (
              <div className={a.field}>
                <label className={a.fieldLabel} htmlFor="story-text-input">{bt.newStory.stepRecord.storyLabel}</label>
                <textarea
                  id="story-text-input"
                  className={`${a.textarea} ${styles.serifText}`}
                  placeholder={bt.newStory.stepRecord.storyPlaceholder}
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            <div className={a.field}>
              <label className={a.fieldLabel} htmlFor="story-title">{bt.newStory.stepRecord.titleLabel}</label>
              <input
                id="story-title"
                type="text"
                className={a.input}
                placeholder={bt.newStory.stepRecord.titlePlaceholder}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <PhotoUploader
              onPhotoSelected={setPhotoFile}
              caption={photoCaption}
              onCaptionChange={setPhotoCaption}
            />
          </div>

          {localBackupFailed && (
            <p role="status" className={`${a.notice} ${a.noticeWarm}`}>
              {vi
                ? 'Trình duyệt này không lưu tạm được bản ghi âm. Hãy bấm Lưu ngay, hoặc tải bản ghi về máy trước khi rời trang.'
                : 'This browser could not keep a backup of the recording. Save now, or download it before leaving this page.'}
            </p>
          )}

          {saveError && (
            <div role="alert" className={`${a.notice} ${a.noticeError}`}>
              <span>{saveError}</span>
              {audioUrl && (
                <a href={audioUrl} download={`kyuc-recording.${audioBlob?.type.includes('mp4') ? 'm4a' : 'webm'}`} className={a.noticeLink}>
                  {vi ? 'Tải bản ghi âm về máy' : 'Download the recording'}
                </a>
              )}
            </div>
          )}

          <div className={styles.saveBar}>
            <button
              className={`${a.pill} ${a.pillTeal} ${a.pillBlock}`}
              onClick={handleSave}
              disabled={saving || isRecording}
            >
              {saving ? bt.newStory.stepRecord.saving : (vi ? 'Lưu vào kho gia đình' : 'Save to the family archive')}
            </button>
            <span className={a.small}>{vi ? 'Chỉ mình bạn thấy cho tới khi bạn chọn chia sẻ.' : 'Only you can see it until you choose to share.'}</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const WAVE = [26, 44, 34, 58, 40, 66, 30, 52, 38, 60, 28, 46, 36];

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <NewStoryContent />
    </Suspense>
  );
}
