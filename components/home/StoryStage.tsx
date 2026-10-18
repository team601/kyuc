'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HomeContent } from '@/lib/homeContent';
import { NoiseTransitionBg, type BgSlide } from './NoiseTransitionBg';
import { PhoneScreens } from './PhoneScreens';
import { useHomeImages } from './HomeImage';
import s from './home.module.css';

/** Chiều cao cuộn cho mỗi bước, tính theo chiều cao màn hình */
const STEP_VH = 0.9;

/** Phần mở đầu: ảnh nền + điện thoại dính giữa màn hình. Ảnh nền chuyển theo đúng vị trí cuộn. */
export function StoryStage({ t, startHref }: { t: HomeContent; startHref: string }) {
  const images = useHomeImages();
  const wrapRef = useRef<HTMLElement>(null);
  const positionRef = useRef(0);
  const [step, setStep] = useState(0);
  const [scale, setScale] = useState(1);
  // vị trí điện thoại ở màn hero: đỉnh điện thoại nằm dưới tiêu đề, đè lên mép dưới ảnh
  const [heroOffset, setHeroOffset] = useState(0);

  const slides = useMemo<BgSlide[]>(
    () => [
      { src: images['kyuc-hero'] ?? '', focus: '50% 45%', blur: 9, alt: '' },
      ...t.steps.map(st => ({ src: images[st.image] ?? '', focus: st.focus, alt: st.imageAlt })),
    ],
    // ảnh nền không đổi theo ngôn ngữ
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images],
  );

  const onStepChange = useCallback((next: number) => setStep(next), []);

  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const vh = window.innerHeight;
      const scrolled = -wrap.getBoundingClientRect().top;
      positionRef.current = Math.max(0, scrolled / (vh * STEP_VH));
    };
    const onResize = () => {
      const vh = window.innerHeight;
      const mobile = window.innerWidth < 900;
      const sc = mobile ? Math.min(0.72, (vh - 330) / 660) : Math.min(1, (vh - 120) / 660);
      setScale(sc);
      const center = mobile ? vh * 0.34 : vh * 0.5;
      setHeroOffset(vh * (mobile ? 0.5 : 0.56) + 330 * sc - center);
      onScroll();
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const active = step > 0 ? t.steps[step - 1] : null;
  const dotsLight = !active || active.tone === 'light';

  return (
    <section ref={wrapRef} className={s.stageWrap} aria-label={t.hero.title}>
      <span id="how" className={s.howAnchor} />
      <div className={s.stage}>
        <NoiseTransitionBg slides={slides} positionRef={positionRef} onStepChange={onStepChange} />
        <div className={`${s.heroTint} ${step === 0 ? s.on : ''}`} aria-hidden="true" />
        {/* chỉ dùng trên mobile, nơi chữ nằm đè lên chủ thể ảnh */}
        <div className={`${s.mobileShade} ${active ? s.on : ''}`} aria-hidden="true" />

        <div className={`${s.heroText} ${step === 0 ? s.on : ''}`}>
          <p className={s.pilot}>{t.hero.pilot}</p>
          <h1 className={s.heroTitle}>{t.hero.title}</h1>
          <p className={s.heroSub}>{t.hero.sub}</p>
        </div>

        <div
          className={s.phoneSlot}
          style={{ transform: `translate(-50%, -50%) translateY(${step === 0 ? heroOffset : 0}px) scale(${scale})` }}
        >
          <PhoneScreens step={step} t={t.phone} />
        </div>

        {t.steps.map((st, i) => (
          <div
            key={st.label}
            className={`${s.stepText} ${st.side === 'left' ? s.stepLeft : s.stepRight} ${st.tone === 'light' ? s.toneLight : s.toneDark} ${step === i + 1 ? s.on : ''}`}
          >
            <span className={s.eyebrow}>{st.label}</span>
            <h2 className={s.stepTitle}>{st.title}</h2>
            <p className={s.stepBody}>
              {st.body}
              {'planned' in st && st.planned && <span className={s.soon}> {t.comingSoon}</span>}
            </p>
            {i === t.steps.length - 1 && (
              <div className={s.ctaRow}>
                <Link href={startHref} className={s.btnCoral}>{t.stepCtas.start}</Link>
                <a href="#keep" className={s.btnSoft}>{t.stepCtas.keep}</a>
              </div>
            )}
          </div>
        ))}

        <div className={`${s.dots} ${dotsLight ? '' : s.dotsDark}`} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span key={i} className={`${s.dot} ${step === i ? s.dotOn : ''}`} />
          ))}
        </div>
        <span className={`${s.scrollHint} ${step === 0 ? s.on : ''}`} aria-hidden="true">{t.hero.scrollHint}</span>
      </div>
    </section>
  );
}
