'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  src: string;
  /** Link tải về; mặc định dùng chính src */
  downloadHref?: string;
  title?: string;
  className?: string;
}

const BARS = 36;

/** Dạng sóng trang trí, cố định theo src để mỗi bản ghi có hình riêng nhưng không đổi khi render lại */
function wavePattern(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ i;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
    return Math.round((0.25 + r * 0.75) * envelope * 100);
  });
}

export function AudioPlayer({ src, downloadHref, title, className }: AudioPlayerProps) {
  const { lang } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fixingDurationRef = useRef(false);

  const [currentSrc, setCurrentSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [didRetryProxy, setDidRetryProxy] = useState(false);

  const wave = useMemo(() => wavePattern(src.replace(/[?&]stream=1/, '')), [src]);
  const download = downloadHref ?? src;

  // Sync if prop src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setDidRetryProxy(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => handleAudioError());
    }
  };

  const readDuration = (audio: HTMLAudioElement) => {
    let d = audio.duration;
    if (!isFinite(d) && audio.seekable && audio.seekable.length > 0) {
      const end = audio.seekable.end(0);
      if (isFinite(end) && end > 0) d = end;
    }
    return isFinite(d) && d > 0 ? d : 0;
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const d = readDuration(audio);
    if (d) {
      setDuration(d);
    } else if (audio.duration === Infinity && !fixingDurationRef.current) {
      // Bản ghi WebM từ MediaRecorder không có độ dài trong header: tua tới cuối để trình duyệt tự tính
      fixingDurationRef.current = true;
      audio.currentTime = 1e101;
    }
    setHasError(false);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fixingDurationRef.current) {
      const d = readDuration(audio);
      if (d) {
        fixingDurationRef.current = false;
        setDuration(d);
        audio.currentTime = 0;
      }
      return;
    }
    setCurrentTime(audio.currentTime);
    if (!duration) {
      const d = readDuration(audio);
      if (d) setDuration(d);
    }
  };

  const seekTo = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const next = Math.max(0, Math.min(1, pct)) * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  };

  const handleSeekKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    if (e.key === 'ArrowRight') seekTo((currentTime + 5) / duration);
    else if (e.key === 'ArrowLeft') seekTo((currentTime - 5) / duration);
    else return;
    e.preventDefault();
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const handleAudioError = () => {
    // If native playback fails (e.g. iOS Safari with WebM / bad Content-Type), retry once via the
    // media route's stream mode, which re-serves the bytes with a sniffed Content-Type.
    if (!didRetryProxy && src.startsWith('/api/media?') && !currentSrc.includes('stream=1')) {
      setDidRetryProxy(true);
      setCurrentSrc(`${src}&stream=1`);
      if (audioRef.current) {
        audioRef.current.load();
      }
    } else {
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playedBars = Math.round(progress * BARS);

  return (
    <div className={`${styles.player} ${className || ''}`}>
      <audio
        ref={audioRef}
        src={currentSrc}
        preload="metadata"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={() => {
          if (!fixingDurationRef.current && audioRef.current) {
            const d = readDuration(audioRef.current);
            if (d) setDuration(d);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={handleAudioError}
      />

      <div className={styles.row}>
        <button
          type="button"
          onClick={togglePlay}
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          aria-label={isPlaying ? (lang === 'vi' ? 'Tạm dừng' : 'Pause') : (lang === 'vi' ? 'Phát' : 'Play')}
          disabled={hasError}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1.2" />
              <rect x="14" y="4" width="4" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: 2 }}>
              <path d="M7 4.5v15l12.5-7.5z" />
            </svg>
          )}
        </button>

        <div className={styles.body}>
          {title && <span className={styles.title}>{title}</span>}
          <div
            className={styles.wave}
            onClick={handleSeek}
            onKeyDown={handleSeekKey}
            role="slider"
            aria-label={lang === 'vi' ? 'Vị trí phát' : 'Playback position'}
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
            tabIndex={0}
          >
            {wave.map((h, i) => (
              <span key={i} className={`${styles.bar} ${i < playedBars ? styles.barOn : ''}`} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className={styles.times}>
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSpeed}
          className={styles.speedBtn}
          aria-label={lang === 'vi' ? 'Tốc độ phát' : 'Playback speed'}
        >
          {playbackRate}×
        </button>
      </div>

      {hasError ? (
        <div className={styles.errorBanner} role="status">
          <span>
            {lang === 'vi'
              ? 'Thiết bị này chưa phát được định dạng bản ghi.'
              : 'This device cannot play the recording format.'}
          </span>
          <a href={download} download target="_blank" rel="noopener noreferrer">
            {lang === 'vi' ? 'Tải về để nghe' : 'Download to listen'}
          </a>
        </div>
      ) : (
        <a href={download} download className={styles.downloadLink}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {lang === 'vi' ? 'Tải bản ghi' : 'Download recording'}
        </a>
      )}
    </div>
  );
}
