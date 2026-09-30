'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';
import styles from './ShareModal.module.css';

export type StoryVisibility = 'private' | 'family' | 'public';

interface ShareModalProps {
  storyId: string;
  storyTitle: string;
  onClose: () => void;
  initialVisibility?: StoryVisibility;
  isPublicInitially?: boolean;
}

export function ShareModal({
  storyId,
  storyTitle,
  onClose,
  initialVisibility,
  isPublicInitially,
}: ShareModalProps) {
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Determine initial visibility
  const [visibility, setVisibility] = useState<StoryVisibility>(() => {
    if (initialVisibility) return initialVisibility;
    if (isPublicInitially) return 'public';
    return 'family';
  });

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${storyId}`
      : `/share/${storyId}`;

  const handleVisibilityChange = async (newVal: StoryVisibility) => {
    setVisibility(newVal);
    setUpdating(true);
    try {
      const supabase = createClient();
      await supabase
        .from('stories')
        .update({
          visibility: newVal,
          is_public: newVal === 'public',
        })
        .eq('id', storyId);
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
        await navigator.share({
          title: storyTitle,
          text: lang === 'vi' ? `Ký ức gia đình: ${storyTitle}` : `Family Memory: ${storyTitle}`,
          url: shareUrl,
        });
      } catch {
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
            <h2 className={styles.title}>
              {lang === 'vi' ? 'Quyền riêng tư & Chia sẻ' : 'Privacy & Sharing'}
            </h2>
            <p className={styles.desc}>
              {lang === 'vi'
                ? 'Chọn ai có thể lắng nghe và đọc câu chuyện ký ức này.'
                : 'Choose who can listen to and read this memory.'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* 3-Level Visibility Option Selector */}
        <div className={styles.visibilityGroup}>
          {/* Family Only */}
          <label
            className={`${styles.visibilityOption} ${visibility === 'family' ? styles.visibilityOptionSelected : ''}`}
            onClick={() => handleVisibilityChange('family')}
          >
            <input
              type="radio"
              name="story-visibility"
              value="family"
              checked={visibility === 'family'}
              onChange={() => handleVisibilityChange('family')}
            />
            <div className={styles.visibilityContent}>
              <span className={styles.visibilityLabel}>
                <span>👨‍👩‍👧‍👦</span> {lang === 'vi' ? 'Vòng tròn gia đình (Khuyên dùng)' : 'Family Circle (Recommended)'}
              </span>
              <span className={styles.visibilityDesc}>
                {lang === 'vi'
                  ? 'Chỉ các thành viên đã kết nối trong Vòng tròn gia đình mới có thể xem và nghe.'
                  : 'Only accepted members in your Family Circle can view and listen.'}
              </span>
            </div>
          </label>

          {/* Public */}
          <label
            className={`${styles.visibilityOption} ${visibility === 'public' ? styles.visibilityOptionSelected : ''}`}
            onClick={() => handleVisibilityChange('public')}
          >
            <input
              type="radio"
              name="story-visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => handleVisibilityChange('public')}
            />
            <div className={styles.visibilityContent}>
              <span className={styles.visibilityLabel}>
                <span>🌐</span> {lang === 'vi' ? 'Công khai qua liên kết' : 'Public via Link'}
              </span>
              <span className={styles.visibilityDesc}>
                {lang === 'vi'
                  ? 'Bất kỳ ai có đường link này đều có thể lắng nghe trực tiếp mà không cần đăng nhập.'
                  : 'Anyone with this link can listen directly without signing in.'}
              </span>
            </div>
          </label>

          {/* Private */}
          <label
            className={`${styles.visibilityOption} ${visibility === 'private' ? styles.visibilityOptionSelected : ''}`}
            onClick={() => handleVisibilityChange('private')}
          >
            <input
              type="radio"
              name="story-visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={() => handleVisibilityChange('private')}
            />
            <div className={styles.visibilityContent}>
              <span className={styles.visibilityLabel}>
                <span>🔒</span> {lang === 'vi' ? 'Chỉ mình tôi' : 'Private to Me'}
              </span>
              <span className={styles.visibilityDesc}>
                {lang === 'vi'
                  ? 'Ký ức hoàn toàn riêng tư. Chỉ có bạn mới có thể truy cập.'
                  : 'Completely private. Only you can view this story.'}
              </span>
            </div>
          </label>
        </div>

        {/* Current status notice */}
        <div
          className={`${styles.statusNotice} ${
            visibility === 'public'
              ? styles.statusPublic
              : visibility === 'family'
              ? styles.statusFamily
              : styles.statusPrivate
          }`}
        >
          <span>{visibility === 'public' ? '🌐' : visibility === 'family' ? '👨‍👩‍👧‍👦' : '🔒'}</span>
          <span>
            {visibility === 'public'
              ? lang === 'vi'
                ? 'Liên kết công khai đã sẵn sàng để gửi cho bạn bè, người thân.'
                : 'Public link is ready to share with friends and family.'
              : visibility === 'family'
              ? lang === 'vi'
                ? 'Được bảo vệ: Người nhận cần đăng nhập tài khoản gia đình để mở.'
                : 'Protected: Recipients must sign in with their family account to listen.'
              : lang === 'vi'
              ? 'Đang ở chế độ riêng tư. Hãy chọn Gia đình hoặc Công khai để chia sẻ liên kết.'
              : 'Story is private. Choose Family or Public to enable link sharing.'}
          </span>
        </div>

        {/* Link Box (disabled if private) */}
        {visibility !== 'private' && (
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
              {copied ? (lang === 'vi' ? '✓ Đã sao chép' : '✓ Copied') : (lang === 'vi' ? 'Sao chép link' : 'Copy link')}
            </button>
          </div>
        )}

        {/* Social / Native share buttons if not private */}
        {visibility !== 'private' && (
          <div className={styles.actions}>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button className={styles.nativeShareBtn} onClick={handleNativeShare}>
                <span>📤</span> {lang === 'vi' ? 'Chia sẻ qua ứng dụng trên máy' : 'Share via Device App'}
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
        )}
      </div>
    </div>
  );
}
