'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function AudioPlayer({ src, title, className }: AudioPlayerProps) {
  const { lang } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSrc, setCurrentSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [didRetryProxy, setDidRetryProxy] = useState(false);

  // Sync if prop src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setDidRetryProxy(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Autoplay policy or playback error
        handleAudioError();
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setHasError(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const handleAudioError = () => {
    // If native playback fails (e.g. iOS Safari with WebM / bad Content-Type), try audio-proxy once!
    if (!didRetryProxy && !currentSrc.includes('/api/audio-proxy')) {
      setDidRetryProxy(true);
      const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(src)}`;
      setCurrentSrc(proxyUrl);
      if (audioRef.current) {
        audioRef.current.load();
      }
    } else {
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.playerCard} ${className || ''}`}>
      <audio
        ref={audioRef}
        src={currentSrc}
        preload="metadata"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={handleAudioError}
      />

      <div className={styles.mainRow}>
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={styles.playBtn}
          title={isPlaying ? (lang === 'vi' ? 'Tạm dừng' : 'Pause') : (lang === 'vi' ? 'Phát' : 'Play')}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress & Time */}
        <div className={styles.scrubberArea}>
          <div
            className={styles.progressBarContainer}
            onClick={handleSeek}
            role="slider"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
          >
            <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
          </div>

          <div className={styles.timeRow}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed & Download actions */}
        <div className={styles.controlsRight}>
          <button
            type="button"
            onClick={toggleSpeed}
            className={styles.speedBtn}
            title={lang === 'vi' ? 'Tốc độ phát' : 'Playback Speed'}
          >
            {playbackRate}x
          </button>

          <a
            href={src}
            download="audio-recording"
            className={styles.downloadLink}
            title={lang === 'vi' ? 'Tải tệp âm thanh' : 'Download audio file'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>{lang === 'vi' ? 'Tải' : 'Save'}</span>
          </a>
        </div>
      </div>

      {/* Graceful error state if format cannot be decoded natively */}
      {hasError && (
        <div className={styles.errorBanner}>
          <span>
            {lang === 'vi'
              ? 'Thiết bị chưa hỗ trợ định dạng này trực tiếp.'
              : 'Device cannot play this audio format directly.'}
          </span>
          <a href={src} download="audio-recording" target="_blank" rel="noopener noreferrer">
            {lang === 'vi' ? 'Tải về máy để nghe' : 'Download to listen'}
          </a>
        </div>
      )}
    </div>
  );
}
