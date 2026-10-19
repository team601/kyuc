'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HomeContent } from '@/lib/homeContent';
import { NoiseTransitionBg } from './NoiseTransitionBg';
import type { StageSlide } from './composeSlide';
import { PhoneScreens } from './PhoneScreens';
import { useHomeImages } from './HomeImage';
import s from './home.module.css';

/** Chiều cao cuộn cho mỗi bước, tính theo chiều cao màn hình */
const STEP_VH = 1.5;
/** Tốc độ điện thoại trôi ra ở bước cuối so với tốc độ cuộn */
const EXIT_SPEED = 1.6;

/**
 * Phần mở đầu: các khung ảnh (ảnh + chữ vẽ chung) chuyển theo vị trí cuộn, điện thoại dính giữa màn hình.
 * Chữ hiển thị được vẽ vào khung ảnh; bản HTML của chữ được giữ lại (ẩn) cho trình đọc màn hình và SEO.
 */
export function StoryStage({ t }: { t: HomeContent }) {
  const images = useHomeImages();
  const wrapRef = useRef<HTMLElement>(null);
  const positionRef = useRef(0);
  const [step, setStep] = useState(0);
  const phoneRef = useRef<HTMLDivElement>(null);

  const slides = useMemo<StageSlide[]>(
    () => [
      {
        kind: 'hero',
        src: images['kyuc-hero'] ?? '',
        focus: '50% 45%',
        focusMobile: '20% 45%',
        side: 'center',
        tone: 'light',
        pill: t.hero.pilot,
        title: t.hero.title,
        body: t.hero.sub,
      },
      ...t.steps.map<StageSlide>(st => ({
        kind: 'step',
        src: images[st.image] ?? '',
        focus: st.focus,
        focusMobile: st.focusMobile,
        side: st.side,
        tone: st.tone,
        eyebrow: st.label,
        title: st.title,
        body: st.body,
        note: 'planned' in st && st.planned ? t.comingSoon : undefined,
      })),
      // bước cuối: nền kem của section kế tiếp dâng lên bằng chấm pixel, nối liền mạch xuống dưới
      { kind: 'blank', src: '', focus: '50% 50%', side: 'center', tone: 'dark', title: '' },
    ],
    [images, t],
  );

  const onStepChange = useCallback((next: number) => setStep(next), []);

  useEffect(() => {
    // kích thước điện thoại + vị trí ở màn hero (đỉnh điện thoại nằm dưới tiêu đề)
    const geo = { scale: 1, heroOffset: 0 };
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const vh = window.innerHeight;
      const scrolled = -wrap.getBoundingClientRect().top;
      positionRef.current = Math.max(0, scrolled / (vh * STEP_VH));

      // điện thoại đi đúng theo cuộn: trôi lên cùng trang từ hero tới giữa màn hình rồi dính lại,
      // và ở bước cuối lại trôi lên ra khỏi màn hình, nhanh hơn trang để section bên dưới không dính sát điện thoại
      const exitStart = t.steps.length * STEP_VH * vh;
      let offset = Math.max(0, geo.heroOffset - Math.max(0, scrolled));
      if (scrolled > exitStart) offset = -(scrolled - exitStart) * EXIT_SPEED;
      const phone = phoneRef.current;
      if (phone) phone.style.transform = `translate(-50%, -50%) translateY(${offset}px) scale(${geo.scale})`;
    };
    const onResize = () => {
      const vh = window.innerHeight;
      const mobile = window.innerWidth < 900;
      geo.scale = mobile ? Math.min(0.72, (vh - 330) / 660) : Math.min(1, (vh - 120) / 660);
      const center = mobile ? vh * 0.34 : vh * 0.5;
      geo.heroOffset = vh * (mobile ? 0.5 : 0.56) + 330 * geo.scale - center;
      onScroll();
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
    // số bước cố định theo nội dung
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exiting = step > t.steps.length;
  const active = step > 0 && !exiting ? t.steps[step - 1] : null;
  const dotsLight = !active || active.tone === 'light';

  return (
    <section ref={wrapRef} className={s.stageWrap} aria-labelledby="hero-title">
      <span id="how" className={s.howAnchor} />
      <div className={`${s.stage} ${exiting ? s.stageExit : ''}`}>
        <NoiseTransitionBg slides={slides} positionRef={positionRef} onStepChange={onStepChange} />

        <div className={s.srOnly}>
          <p>{t.hero.pilot}</p>
          <h1 id="hero-title">{t.hero.title}</h1>
          <p>{t.hero.sub}</p>
          {t.steps.map(st => (
            <div key={st.label}>
              <h2>{st.label}: {st.title}</h2>
              <p>{st.body}{'planned' in st && st.planned ? ` (${t.comingSoon})` : ''}</p>
            </div>
          ))}
        </div>

        <div ref={phoneRef} className={s.phoneSlot}>
          <PhoneScreens step={Math.min(step, t.steps.length)} t={t.phone} />
        </div>

        <div className={`${s.dots} ${dotsLight ? '' : s.dotsDark}`} style={{ opacity: exiting ? 0 : 1 }} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span key={i} className={`${s.dot} ${step === i ? s.dotOn : ''}`} />
          ))}
        </div>
        <span className={`${s.scrollHint} ${step === 0 ? s.on : ''}`} aria-hidden="true">{t.hero.scrollHint}</span>
      </div>
    </section>
  );
}
