'use client';

import type { HomeContent } from '@/lib/homeContent';
import { HomeImage } from './HomeImage';
import s from './phone.module.css';

const WAVE = [40, 64, 48, 70, 36, 58, 30];

export function PhoneScreens({ step, t }: { step: number; t: HomeContent['phone'] }) {
  return (
    <div className={s.phone} role="img" aria-label={t.progressAria}>
      <span className={s.url} aria-hidden="true">kyuc.ai</span>
      {/* key theo bước để animation chạy lại mỗi lần đổi màn hình */}
      <div key={step} className={s.screen} aria-hidden="true">
        {step === 0 && <Welcome t={t.welcome} />}
        {step === 1 && <Setup t={t.setup} />}
        {step === 2 && <Record t={t.record} />}
        {step === 3 && <Follow t={t.follow} />}
        {step === 4 && <Review t={t.review} />}
        {step === 5 && <Family t={t.family} />}
      </div>
    </div>
  );
}

function Welcome({ t }: { t: HomeContent['phone']['welcome'] }) {
  return (
    <>
      <p className={s.muted}>{t.time}</p>
      <p className={s.hello}>{t.hello}</p>
      <p className={s.muted}>{t.intro}</p>
      <div className={s.qCard}>
        <span className={s.qLabel}>{t.qLabel}</span>
        <span className={s.qText}>{t.question}</span>
      </div>
      <span className={`${s.btn} ${s.btnCoral} ${s.bottom}`}>{t.cta}</span>
    </>
  );
}

function Setup({ t }: { t: HomeContent['phone']['setup'] }) {
  return (
    <>
      <p className={s.title}>{t.title}</p>
      <span className={s.small}>{t.nameLabel}</span>
      <span className={s.field}>{t.name}<span className={s.caret} /></span>
      <span className={s.small}>{t.callLabel}</span>
      <span className={s.chips}>
        {t.calls.map((c, i) => (
          <span key={c} className={`${s.chip} ${i === 0 ? `${s.chipCoral} ${s.pop1}` : ''}`}>{c}</span>
        ))}
      </span>
      <span className={s.small}>{t.langLabel}</span>
      <span className={s.chips}>
        {t.langs.map((l, i) => (
          <span key={l} className={`${s.chip} ${i === t.activeLang ? `${s.chipDark} ${s.pop2}` : ''}`}>{l}</span>
        ))}
      </span>
      <span className={`${s.btn} ${s.btnCoral} ${s.bottom} ${s.pop3}`}>{t.cta}</span>
    </>
  );
}

function Record({ t }: { t: HomeContent['phone']['record'] }) {
  return (
    <div className={s.center}>
      <span className={s.progress}><span className={s.progressFill} /></span>
      <p className={s.recQuestion}>{t.question}</p>
      <span className={s.muted}>{t.reassure}</span>
      <span className={s.wave}>
        {WAVE.map((h, i) => (
          <span
            key={i}
            className={s.bar}
            style={{ height: h, animationDelay: `${i * 0.15}s`, background: i < 4 ? '#E8503A' : '#F2765F' }}
          />
        ))}
      </span>
      <span className={s.recStatus}>● {t.status}</span>
      <span className={`${s.recBtn} ${s.bottom}`}><span className={s.recStop} /></span>
      <span className={s.recRow}><span>{t.pause}</span><span>{t.listen}</span></span>
    </div>
  );
}

function Follow({ t }: { t: HomeContent['phone']['follow'] }) {
  return (
    <>
      <span className={s.small}>{t.saved}</span>
      <span className={s.bubble}>{t.answer}</span>
      <span className={`${s.small} ${s.pop1}`}>{t.prompt}</span>
      <span className={`${s.bubbleKyuc} ${s.pop2}`}>{t.question}</span>
      <span className={`${s.btnRow} ${s.bottom} ${s.pop3}`}>
        <span className={`${s.btn} ${s.btnCoral}`}>{t.more}</span>
        <span className={`${s.btn} ${s.btnSoft}`}>{t.later}</span>
      </span>
    </>
  );
}

function Review({ t }: { t: HomeContent['phone']['review'] }) {
  return (
    <>
      <span className={s.tabs}>
        <span className={s.tabOn}>{t.tabs[0]}</span>
        <span className={s.tab}>{t.tabs[1]}</span>
      </span>
      <span className={s.title}>{t.title}</span>
      <span className={s.audio}>
        <span className={s.play}><svg width="10" height="10" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="#fff" /></svg></span>
        <span className={s.small}>{t.audio}</span>
      </span>
      <span className={s.typed}>{t.text}</span>
      <span className={s.small}>{t.note}</span>
      <span className={`${s.btnRow} ${s.bottom} ${s.pop3}`}>
        <span className={`${s.btn} ${s.btnTeal}`}>{t.approve}</span>
        <span className={`${s.btn} ${s.btnSoft}`}>{t.edit}</span>
      </span>
    </>
  );
}

function Family({ t }: { t: HomeContent['phone']['family'] }) {
  const tones = [s.mint, s.butter, s.blush];
  const pops = [s.pop1, s.pop2, s.pop3];
  return (
    <>
      <span className={s.title}>{t.title}</span>
      <span className={s.small}>{t.meta}</span>
      <span className={s.storyRow}>
        <HomeImage name="kyuc-old-photos" alt="" className={s.thumb} />
        <span className={s.storyText}><b>{t.story}</b><span className={s.small}>{t.storyMeta}</span></span>
      </span>
      {t.comments.map(([who, text], i) => (
        <span key={who} className={`${s.comment} ${tones[i]} ${pops[i]}`}><b>{who}</b> · {text}</span>
      ))}
      <span className={`${s.btn} ${s.btnSoft} ${s.bottom}`}>{t.cta}</span>
    </>
  );
}
