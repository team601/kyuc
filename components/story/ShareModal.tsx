'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  storyId: string;
  storyTitle: string;
  onClose: () => void;
  isPublicInitially?: boolean;
}

export function ShareModal({
  storyId,
  storyTitle,
  onClose,
  isPublicInitially = true,
}: ShareModalProps) {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];
  const [copied, setCopied] = useState(false);

  // Generate share URL - works in browser
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${storyId}`
    : `/share/${storyId}`;

  const handleCopy = async () => {
    try {
      // Ensure story is set to public in database
      const supabase = createClient();
      await supabase
        .from('stories')
        .update({ is_public: true })
        .eq('id', storyId);

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const supabase = createClient();
        await supabase
          .from('stories')
          .update({ is_public: true })
          .eq('id', storyId);

        await navigator.share({
          title: storyTitle,
          text: lang === 'vi' ? `Ký ức gia đình: ${storyTitle}` : `Family Memory: ${storyTitle}`,
          url: shareUrl,
        });
      } catch (err) {
        // user cancelled or failed, ignore
      }
    } else {
      handleCopy();
    }
  };

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(storyTitle)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(storyTitle + ' - ' + shareUrl)}`;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{bt.story.shareModalTitle}</h2>
            <p className={styles.desc}>{bt.story.shareDesc}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.publicBadge}>
          <span>🌐</span>
          <span>{bt.story.publicNotice}</span>
        </div>

        <div className={styles.linkBox}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className={styles.linkInput}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
          >
            {copied ? bt.story.linkCopied : bt.story.copyLink}
          </button>
        </div>

        <div className={styles.actions}>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button className={styles.nativeShareBtn} onClick={handleNativeShare}>
              <span>📤</span> {bt.story.shareNative}
            </button>
          )}

          <div className={styles.socialRow}>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <span>📘</span> Facebook
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <span>🐦</span> X / Twitter
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <span>💬</span> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
