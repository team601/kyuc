'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const { lang, t } = useLanguage();

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>

        {/* ── Left: Text Content ── */}
        <div className={styles.content}>
          <p className={`section-label ${styles.eyebrow}`}>
            {t.hero.eyebrow}
          </p>

          <h1 className={styles.headline}>
            {t.hero.headlinePart1}{' '}
            <span className={styles.headlineSecond}>{t.hero.headlinePart2}</span>{' '}
            <span className={styles.headlineAccent}>{t.hero.headlinePart3}</span>
          </h1>

          <p className={styles.description}>
            {t.hero.description}
          </p>

          <div className={styles.actions}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              {t.hero.cta}
              <svg className="arrow-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 15L15 3M15 3H7M15 3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p className={styles.subtext}>{t.hero.subtext}</p>
          </div>
        </div>

        {/* ── Right: Image + Overlays ── */}
        <div className={styles.visual}>
          <div className={styles.imageWrap}>
            <Image
              src="/images/hero-family.webp"
              alt={lang === 'vi' ? 'Bà và cháu cùng xem lại ảnh gia đình' : 'Family sharing cherished memories'}
              width={680}
              height={520}
              priority
              className={styles.image}
            />

            {/* Floating badge */}
            <div className={styles.badge}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5S11.59 1.5 8 1.5z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.hero.badge}
            </div>

            {/* Audio waveform card */}
            <div className={styles.waveCard}>
              <div className={styles.waveform}>
                {[3, 5, 8, 4, 10, 6, 3, 7, 5, 9, 4, 6, 8, 3, 5].map((h, i) => (
                  <div
                    key={i}
                    className={styles.waveBar}
                    style={{
                      height: `${h * 4}px`,
                      animationDelay: `${i * 0.1}s`,
                      background: i < 8 ? 'var(--color-brand)' : 'var(--color-border)',
                    }}
                  />
                ))}
              </div>
              <div className={styles.waveText}>
                <p className={styles.waveQuote}>
                  {lang === 'vi' ? '“Tôi chưa bao giờ kể điều này cho ai nghe…”' : '“I haven’t told this story to anyone in years…”'}
                </p>
                <p className={styles.waveSubtext}>
                  {lang === 'vi' ? 'Khởi đầu của điều đáng giữ mãi.' : 'The start of something worth holding on to.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ticker Banner ── */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.tickerItems}>
              <span>{lang === 'vi' ? 'Mỗi gia đình có một câu chuyện.' : 'Every family has a story.'}</span>
              <span className={styles.dot}>·</span>
              <span>In English. Bằng tiếng Việt.</span>
              <span className={styles.dot}>·</span>
              <span>{lang === 'vi' ? 'Bằng chính giọng nói của họ.' : 'In their own voice.'}</span>
              <span className={styles.dot}>·</span>
              <span>{lang === 'vi' ? 'Dành cho những người họ yêu thương.' : 'For the people they love.'}</span>
              <span className={styles.dot}>·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
