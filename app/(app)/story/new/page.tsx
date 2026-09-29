'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getRandomQuestion, categoryMeta, type Category } from '@/lib/questions';
import PhotoUploader from '@/components/story/PhotoUploader';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './new.module.css';

function NewStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('category') as Category) || 'roots';

  const { lang, setLang } = useLanguage();
  const bt = backendTranslations[lang];

  const [category, setCategory] = useState<Category>(initialCat);
  const [question, setQuestion] = useState(() => getRandomQuestion(initialCat));
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
  const [step, setStep] = useState<'category' | 'record' | 'save'>('category');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setQuestion(getRandomQuestion(cat));
    setStep('record');
  };

  const handleNextQuestion = () => {
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      // Web Speech API real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

          recognition.onresult = (event: any) => {
            let transcriptText = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                transcriptText += event.results[i][0].transcript + ' ';
              }
            }
            if (transcriptText) {
              setAudioTranscript(prev => (prev ? prev + ' ' : '') + transcriptText.trim());
            }
          };

          recognition.onerror = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // ignore speech recognition error
        }
      }
    } catch {
      alert(lang === 'vi'
        ? 'Không thể truy cập micro. Vui lòng kiểm tra quyền trình duyệt.'
        : 'Could not access microphone. Please check browser permissions.');
    }
  }, [lang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    let audio_url = null;
    let image_url = null;

    // Upload audio if exists
    if (audioBlob) {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('audio').getPublicUrl(uploadData.path);
        audio_url = urlData.publicUrl;
      }
    }

    // Upload photo if exists
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'webp';
      const photoPath = `${user.id}/${Date.now()}.${ext}`;
      const { data: photoData, error: photoError } = await supabase.storage
        .from('photos')
        .upload(photoPath, photoFile, { contentType: photoFile.type });
      if (!photoError && photoData) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(photoData.path);
        image_url = urlData.publicUrl;
      }
    }

    // Save story
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
    }).select().single();

    if (error) {
      alert(lang === 'vi' ? 'Không thể lưu câu chuyện. Vui lòng thử lại.' : 'Could not save story. Please try again.');
    } else if (story) {
      router.push(`/story/${story.id}`);
    }
    setSaving(false);
  };

  const meta = categoryMeta[category];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>
          {bt.newStory.backToStories}
        </Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <div className={styles.headerLangWrap}>
          <LanguageSwitcher />
        </div>
      </header>

      <main className={styles.main}>
        {/* Step 1: Choose Category */}
        {step === 'category' && (
          <div className={styles.stepWrap}>
            <p className="section-label">{bt.newStory.stepCategory.eyebrow}</p>
            <h1 className={styles.stepTitle}>{bt.newStory.stepCategory.title}</h1>
            <p className={styles.stepDesc}>{bt.newStory.stepCategory.desc}</p>

            <div className={styles.categoryGrid}>
              {(Object.keys(categoryMeta) as Category[]).map(cat => {
                const m = categoryMeta[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={styles.categoryCard}
                    style={{ background: m.color }}
                  >
                    <span className={styles.catNumber}>{m.number}</span>
                    <h3 className={styles.catLabel}>{m.label[lang]}</h3>
                    <p className={styles.catTagline}>{m.tagline[lang]}</p>
                    <p className={styles.catSample}>{m.sampleQuestion[lang]}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Record */}
        {step === 'record' && (
          <div className={styles.recordWrap}>
            <div className={styles.recordLeft}>
              <p className="section-label" style={{ color: 'var(--color-brand)' }}>
                {meta.number} — {meta.label[lang].toUpperCase()}
              </p>
              <h2 className={styles.recordTitle}>
                {bt.newStory.stepRecord.title}
              </h2>
              <p className={styles.recordDesc}>
                {bt.newStory.stepRecord.desc}
              </p>

              {/* Language toggle — synced with LanguageContext */}
              <div className={styles.langRow}>
                <button
                  className={lang === 'en' ? styles.langActive : styles.langBtn}
                  onClick={() => setLang('en')}
                >🇬🇧 English</button>
                <button
                  className={lang === 'vi' ? styles.langActive : styles.langBtn}
                  onClick={() => setLang('vi')}
                >🇻🇳 Tiếng Việt</button>
              </div>

              <button
                onClick={() => setStep('category')}
                className={styles.changeCategory}
              >
                {bt.newStory.stepRecord.changeTheme}
              </button>
            </div>

            <div className={styles.recordCard}>
              {/* Question */}
              <div className={styles.questionBox}>
                <p className={styles.questionLabel}>{meta.label[lang]}</p>
                <h3 className={styles.question}>{question[lang]}</h3>
                <button onClick={handleNextQuestion} className={styles.nextQ}>
                  {bt.newStory.stepRecord.anotherPrompt}
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="form-label" htmlFor="story-title">{bt.newStory.stepRecord.titleLabel}</label>
                <input
                  id="story-title"
                  type="text"
                  className="form-input"
                  placeholder={bt.newStory.stepRecord.titlePlaceholder}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Text */}
              <div>
                <label className="form-label">{bt.newStory.stepRecord.storyLabel}</label>
                <textarea
                  className="form-textarea"
                  placeholder={bt.newStory.stepRecord.storyPlaceholder}
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  rows={6}
                />
              </div>

              {/* Photo Attachment */}
              <PhotoUploader
                onPhotoSelected={setPhotoFile}
                caption={photoCaption}
                onCaptionChange={setPhotoCaption}
              />

              {/* Record */}
              <div className={styles.recordControls}>
                <button
                  className={`btn ${isRecording ? styles.recordingBtn : 'btn-primary'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <><span className={styles.recDot} /> {bt.newStory.stepRecord.stopRecording} {formatTime(recordingTime)}</>
                  ) : (
                    <><span className={styles.recDotWhite} /> {bt.newStory.stepRecord.startRecording}</>
                  )}
                </button>
                {!isRecording && recordingTime > 0 && (
                  <span className={styles.recorded}>{bt.newStory.stepRecord.recorded} {formatTime(recordingTime)}</span>
                )}
              </div>

              {audioUrl && (
                <audio controls src={audioUrl} style={{ width: '100%', marginTop: '0.5rem' }} />
              )}

              {/* Voice Transcript */}
              {(isRecording || audioTranscript || audioUrl) && (
                <div style={{
                  background: '#FFFBF7',
                  border: '1px solid #F3E7DC',
                  borderRadius: 'var(--radius-lg, 0.75rem)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8C4325', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📝</span> {bt.story.audioTranscript}
                    </span>
                    {isRecording && (
                      <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                        {bt.story.speechToTextActive}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={audioTranscript}
                    onChange={e => setAudioTranscript(e.target.value)}
                    placeholder={lang === 'vi' ? 'Bản chép lời giọng nói sẽ hiển thị tại đây khi ghi âm...' : 'Speech-to-text transcript will appear here while recording...'}
                    style={{ fontSize: '0.9rem', lineHeight: 1.6 }}
                  />
                </div>
              )}

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? bt.newStory.stepRecord.saving : bt.newStory.stepRecord.save}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <NewStoryContent />
    </Suspense>
  );
}
