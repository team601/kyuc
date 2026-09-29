'use client';

import { useState, useRef, useCallback } from 'react';
import { questions, getRandomQuestion, categoryMeta, type Category } from '@/lib/questions';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './QuestionDemo.module.css';

const FIRST_QUESTION = questions.find(q => q.category === 'roots') || questions[0];

export default function QuestionDemo() {
  const { lang, setLang, t } = useLanguage();
  const [category, setCategory] = useState<Category>('roots');
  const [question, setQuestion] = useState(FIRST_QUESTION);
  const [storyText, setStoryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextQuestion = () => {
    setQuestion(getRandomQuestion(category));
    setStoryText('');
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setQuestion(getRandomQuestion(cat));
    setStoryText('');
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
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
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      alert(
        lang === 'vi'
          ? 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.'
          : 'Could not access microphone. Please allow microphone permissions.'
      );
    }
  }, [lang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const downloadAudio = () => {
    if (!audioBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(audioBlob);
    a.download = `kyuc-story-${Date.now()}.webm`;
    a.click();
  };

  const downloadText = () => {
    if (!storyText.trim()) return;
    const blob = new Blob([
      `${question[lang]}\n\n${storyText}\n\n---\nSaved with kyuc° (https://kyuc.app)`
    ], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kyuc-story-${Date.now()}.txt`;
    a.click();
  };

  const handleSaveToAccount = () => {
    try {
      const draft = {
        category,
        questionEn: question.en,
        questionVi: question.vi,
        text: storyText,
        savedAt: Date.now(),
      };
      localStorage.setItem('kyuc_pending_draft', JSON.stringify(draft));
      window.location.href = '/signup';
    } catch {}
  };

  const currentCategory = categoryMeta[category];

  return (
    <section id="try" className={styles.section}>
      <div className="container">
        <div className={styles.inner}>

          {/* ── Left: Intro ── */}
          <div className={styles.intro}>
            <p className="section-label">
              {lang === 'vi' ? 'Ký ức đầu tiên bắt đầu ở đây' : 'Your first memory begins here'}
            </p>
            <h2 className={styles.introTitle}>
              {lang === 'vi' ? (
                <>
                  Bạn hỏi.<br />
                  Họ nhớ.<br />
                  <span className={styles.introAccent}>Bạn sẽ vui vì đã hỏi.</span>
                </>
              ) : (
                <>
                  You ask.<br />
                  They remember.<br />
                  <span className={styles.introAccent}>You’ll be so glad you did.</span>
                </>
              )}
            </h2>
            <p className={styles.introDesc}>
              {lang === 'vi'
                ? 'Thử một câu hỏi. Ghi lại câu trả lời bằng văn bản hoặc bằng giọng nói của họ.'
                : 'Try a question. Record the answer in writing or in their own voice.'}
            </p>

            {/* Language toggle */}
            <div className={styles.langToggle}>
              <button
                className={lang === 'vi' ? styles.langActive : styles.langBtn}
                onClick={() => setLang('vi')}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button
                className={lang === 'en' ? styles.langActive : styles.langBtn}
                onClick={() => setLang('en')}
              >
                🇬🇧 English
              </button>
            </div>

            <p className={styles.note}>
              {lang === 'vi'
                ? 'Bản thảo của bạn được lưu trên trình duyệt này. Bản ghi âm sẽ mất khi rời trang — hãy tải xuống để giữ lại.'
                : 'Your draft is stored temporarily in this browser. Please download your recording to keep it.'}
            </p>
          </div>

          {/* ── Right: Question Card ── */}
          <div className={styles.card}>
            {/* Category tabs */}
            <div className={styles.categoryTabs}>
              {(Object.keys(categoryMeta) as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={category === cat ? styles.tabActive : styles.tab}
                >
                  {categoryMeta[cat].label[lang]}
                </button>
              ))}
            </div>

            {/* Question */}
            <div className={styles.questionWrap}>
              <p className={styles.questionLabel}>{currentCategory.number} — {currentCategory.label[lang].toUpperCase()}</p>
              <h3 className={styles.question}>{question[lang]}</h3>
              <button onClick={handleNextQuestion} className={styles.nextQuestion}>
                {t.questionDemo.anotherQuestion}
              </button>
            </div>

            {/* Text area */}
            <div className={styles.inputGroup}>
              <label className="form-label">
                {lang === 'vi' ? 'Câu chuyện của bạn' : 'Your story'}
              </label>
              <textarea
                className="form-textarea"
                placeholder={lang === 'vi' ? 'Tôi nhớ…' : 'I remember…'}
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                rows={5}
              />
            </div>

            {/* Record controls */}
            <div className={styles.recordRow}>
              <button
                className={`btn ${isRecording ? styles.recordingBtn : 'btn-primary'}`}
                onClick={isRecording ? stopRecording : startRecording}
                id="record-btn"
              >
                {isRecording ? (
                  <>
                    <span className={styles.recDot} />
                    {lang === 'vi' ? 'Dừng ghi' : 'Stop recording'}
                  </>
                ) : (
                  <>
                    <span className={styles.recDot} style={{ background: 'white' }} />
                    {lang === 'vi' ? 'Ghi âm ký ức' : 'Record story'}
                  </>
                )}
              </button>
              <span className={styles.timer}>{formatTime(recordingTime)}</span>
            </div>

            {/* Audio playback */}
            {audioUrl && (
              <div className={styles.audioPlayer}>
                <audio controls src={audioUrl} className={styles.audio} />
              </div>
            )}

            {/* Download actions */}
            <div className={styles.downloads}>
              {audioBlob && (
                <button onClick={downloadAudio} className={styles.downloadLink}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  {lang === 'vi' ? 'Tải bản ghi âm' : 'Download audio'}
                </button>
              )}
              {storyText.trim() && (
                <button onClick={downloadText} className={styles.downloadLink}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  {lang === 'vi' ? 'Tải câu chuyện văn bản' : 'Download text story'}
                </button>
              )}
              {(storyText.trim() || audioBlob) && (
                <button
                  onClick={handleSaveToAccount}
                  className={styles.downloadLink}
                  style={{
                    background: 'var(--color-brand)',
                    color: 'white',
                    borderColor: 'var(--color-brand)',
                    fontWeight: 600,
                  }}
                >
                  <span>✨</span>
                  {lang === 'vi' ? 'Lưu vào tài khoản gia đình' : 'Save to family archive'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
