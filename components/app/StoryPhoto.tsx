'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import s from './StoryPhoto.module.css';

/** Ảnh câu chuyện; nếu không tải được thì hiện ô báo nhẹ nhàng thay vì biểu tượng ảnh vỡ */
export function StoryPhoto({ src, alt, className, compact = false }: { src: string; alt: string; className?: string; compact?: boolean }) {
  const { lang } = useLanguage();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`${s.fallback} ${compact ? s.compact : ''} ${className ?? ''}`} role="img" aria-label={alt}>
        <svg width={compact ? 20 : 28} height={compact ? 20 : 28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="15" rx="3" />
          <circle cx="9" cy="11" r="2" />
          <path d="M21 17l-5-5-9 8" />
        </svg>
        {!compact && <span>{lang === 'vi' ? 'Chưa tải được ảnh' : 'Photo unavailable'}</span>}
      </span>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
