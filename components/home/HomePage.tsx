'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { homeContent, type HomeContent } from '@/lib/homeContent';
import { createClient } from '@/lib/supabase/client';
import { HomeImage, HomeImagesProvider } from './HomeImage';
import { StoryStage } from './StoryStage';
import s from './home.module.css';

const START_HREF = '/story/new';

export default function HomePage({ images }: { images: Record<string, string> }) {
  const { lang } = useLanguage();
  const t: HomeContent = homeContent[lang];

  return (
    <HomeImagesProvider value={images}>
      <div className={s.home}>
        <HomeNav t={t} />
        <main>
          <StoryStage t={t} />
          <WhyNow t={t} />
          <Archive t={t} />
          <Weekly t={t} />
          <Keep t={t} />
          <Languages t={t} />
          <TrustFaq t={t} />
          <Closing t={t} />
        </main>
        <HomeFooter t={t} />
      </div>
    </HomeImagesProvider>
  );
}

function HomeNav({ t }: { t: HomeContent }) {
  const { lang, setLang } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data?.user));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session?.user));
      return () => subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  const links = (
    <>
      <a href="#how" onClick={() => setOpen(false)}>{t.nav.how}</a>
      <a href="#keep" onClick={() => setOpen(false)}>{t.nav.keep}</a>
      <a href="#story" onClick={() => setOpen(false)}>{t.nav.story}</a>
      <a href="#faq" onClick={() => setOpen(false)}>{t.nav.faq}</a>
    </>
  );

  return (
    <header className={s.nav}>
      <div className={s.navInner}>
        {/* Chỗ đặt logo: thay khi có logo chính thức */}
        <Link href="/" className={s.logo} aria-label="kyuc.ai home">kyuc<span>.ai</span></Link>
        <nav aria-label="Main" className={s.navLinks}>{links}</nav>
        <div role="group" aria-label={t.nav.language} className={s.langSwitch}>
          <button type="button" aria-pressed={lang === 'en'} className={lang === 'en' ? s.langOn : ''} onClick={() => setLang('en')}>EN</button>
          <button type="button" aria-pressed={lang === 'vi'} className={lang === 'vi' ? s.langOn : ''} onClick={() => setLang('vi')}>VI</button>
        </div>
        {loggedIn ? (
          <Link href="/dashboard" className={s.navCta}>{t.nav.dashboard}</Link>
        ) : (
          <>
            <Link href="/login" className={s.navLogin}>{t.nav.login}</Link>
            <Link href={START_HREF} className={s.navCta}>{t.nav.start}</Link>
          </>
        )}
        <button type="button" className={s.menuBtn} aria-label={t.nav.menu} aria-expanded={open} aria-controls="home-mobile-menu" onClick={() => setOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      {open && (
        <nav id="home-mobile-menu" aria-label="Mobile" className={s.mobileMenu}>
          {links}
          {!loggedIn && <Link href="/login">{t.nav.login}</Link>}
        </nav>
      )}
    </header>
  );
}

function WhyNow({ t }: { t: HomeContent }) {
  return (
    <section aria-label={t.why.quote} className={`${s.section} ${s.afterStage}`}>
      <div className={s.whyCard}>
        <HomeImage name="kyuc-why-now" alt={t.why.imageAlt} className={s.whyImg} />
        <div className={s.whyText}>
          <p className={s.whyQuote}>{t.why.quote}</p>
          <p className={s.muted}>{t.why.body}</p>
        </div>
      </div>
    </section>
  );
}

function Archive({ t }: { t: HomeContent }) {
  const a = t.archive;
  return (
    <section aria-labelledby="archive-h" className={s.sandBand}>
      <div className={s.sectionInner}>
        <div className={s.headRow}>
          <div className={s.headStack}>
            <p className={s.eyebrow}>{a.eyebrow}</p>
            <h2 id="archive-h" className={s.h2}>{a.title}</h2>
          </div>
          <p className={`${s.muted} ${s.headNote}`}>{a.body}</p>
        </div>
        <div className={s.browser} role="img" aria-label={a.title}>
          <div className={s.browserBar} aria-hidden="true">
            <span /><span /><span />
            <em>{a.url}</em>
          </div>
          <div className={s.browserBody} aria-hidden="true">
            <div className={s.sidebar}>
              <strong>{a.sidebarTitle}</strong>
              {a.chapters.map((c, i) => (
                <span key={c} className={i === 0 ? s.chapterOn : undefined}>{c}</span>
              ))}
              <span className={s.nextQ}>{a.next}</span>
            </div>
            <div className={s.storyPane}>
              <div className={s.storyMedia}>
                <HomeImage name="kyuc-old-photos" alt="" className={s.storyImg} />
                <div className={s.player}>
                  <span className={s.playBtn}><svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="#fff" /></svg></span>
                  <span className={s.playWave}>{[10, 22, 16, 26, 12, 20, 14, 24, 10, 18].map((h, i) => <span key={i} style={{ height: h, background: i < 5 ? '#C93D2A' : '#F2765F' }} />)}</span>
                  <span className={s.small}>0:48 / 2:14</span>
                </div>
              </div>
              <div className={s.storyCopy}>
                <span className={s.pills}>{a.tabs.map((tab, i) => <span key={tab} className={i === 0 ? s.pillOn : s.pill}>{tab}</span>)}</span>
                <span className={s.storyTitle}>{a.storyTitle}</span>
                <span className={s.small}>{a.storyMeta}</span>
                <span className={s.storyBody}>{a.storyBefore}<mark>{a.storyHighlight}</mark>{a.storyAfter}</span>
                <span className={s.small}>{a.highlightNote}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Weekly({ t }: { t: HomeContent }) {
  const w = t.weekly;
  return (
    <section aria-labelledby="weekly-h" className={`${s.section} ${s.split}`}>
      <div className={s.weeklyVisual}>
        <HomeImage name="kyuc-weekly" alt={w.imageAlt} className={s.weeklyImg} />
        <div className={s.messages} aria-hidden="true">
          {[w.msg1, w.msg2].map((m, i) => (
            <div key={i} className={s.message}>
              <div className={s.messageHead}><b className={i === 0 ? s.coralText : s.tealText}>{m.from}</b><span>{m.time}</span></div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={s.splitText}>
        <p className={s.eyebrow}>{w.eyebrow}</p>
        <h2 id="weekly-h" className={s.h2}>{w.title}</h2>
        <p className={s.muted}>{w.body}</p>
        <p className={s.badge}>{w.badge}</p>
      </div>
    </section>
  );
}

function Keep({ t }: { t: HomeContent }) {
  const k = t.keep;
  const tones = [s.toneBlush, s.toneButter, s.toneMint];
  return (
    <section id="keep" className={s.section}>
      <div className={s.centerHead}>
        <p className={s.eyebrow}>{k.eyebrow}</p>
        <h2 className={s.h2}>{k.title}</h2>
      </div>
      <div className={s.keepGrid}>
        {k.cards.map((c, i) => (
          <div key={c.title} className={`${s.keepCard} ${tones[i]}`}>
            {c.image ? (
              <HomeImage name={c.image} alt={c.alt} className={s.keepImg} />
            ) : (
              <div className={s.bookWrap} aria-hidden="true">
                <div className={s.book}><span>{k.bookTitle}</span><small>1948 · today</small></div>
              </div>
            )}
            <div className={s.keepText}>
              <span className={c.live ? s.statusLive : s.statusSoon}>{c.live ? k.inPilot : t.comingSoon}</span>
              <h3 className={s.h3}>{c.title}</h3>
              <p className={s.muted}>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Languages({ t }: { t: HomeContent }) {
  const l = t.lang;
  return (
    <section id="story" className={s.butterBand}>
      <div className={s.sectionInner}>
        <div className={s.headRow}>
          <div className={s.headStack}>
            <p className={`${s.eyebrow} ${s.goldText}`}>{l.eyebrow}</p>
            <h2 className={s.h2}>{l.titleA}<br /><em>{l.titleB}</em></h2>
          </div>
          <p className={`${s.muted} ${s.headNote}`}>{l.body}</p>
        </div>
        <div className={s.langGrid}>
          <figure lang="vi" className={s.langFigure}>
            <HomeImage name="kyuc-ma-va-chau" alt={l.viAlt} className={s.langImg} />
            <figcaption><span lang="en">{l.viLabel}</span>{l.viQuote}</figcaption>
          </figure>
          <figure lang="en" className={s.langFigure}>
            <HomeImage name="kyuc-grandparents" alt={l.enAlt} className={s.langImg} />
            <figcaption><span>{l.enLabel}</span>{l.enQuote}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function TrustFaq({ t }: { t: HomeContent }) {
  return (
    <section className={`${s.section} ${s.trustRow}`}>
      <div className={s.trust} aria-labelledby="trust-h">
        <h2 id="trust-h" className={s.h2Small}>{t.trust.title}</h2>
        <ul>
          {t.trust.items.map(([title, body]) => (
            <li key={title}><strong>{title}</strong> <span>{body}</span></li>
          ))}
        </ul>
        <Link href="/privacy" className={s.textLink}>{t.trust.more}</Link>
      </div>
      <div id="faq" className={s.faq}>
        <h2 className={s.h2Small}>{t.faq.title}</h2>
        {t.faq.items.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Closing({ t }: { t: HomeContent }) {
  const c = t.closing;
  return (
    <section id="start" className={s.section}>
      <div className={s.closing}>
        <HomeImage name="kyuc-family-dinner" alt={c.imageAlt} className={s.closingImg} />
        <div className={s.closingCard}>
          <h2 className={s.h2Small}>{c.titleA} <em>{c.titleB}</em></h2>
          <p className={s.muted}>{c.body}</p>
          <div className={s.ctaRow}>
            <Link href={START_HREF} className={s.btnCoral}>{c.start}</Link>
            <Link href="/signup" className={s.btnSoft}>{c.join}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFooter({ t }: { t: HomeContent }) {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <span className={s.logo}>kyuc<span>.ai</span></span>
        <nav aria-label="Legal" className={s.footerLinks}>
          <Link href="/privacy">{t.footer.privacy}</Link>
          <Link href="/terms">{t.footer.terms}</Link>
          <Link href="/security">{t.footer.security}</Link>
        </nav>
        <span>{t.footer.bilingual} · {t.footer.copyright}</span>
      </div>
    </footer>
  );
}
