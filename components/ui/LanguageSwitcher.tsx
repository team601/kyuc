'use client';

import { useLanguage } from '@/lib/LanguageContext';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className={styles.wrapper} title="Switch language / Đổi ngôn ngữ">
      <button
        id="lang-switcher-vi"
        className={`${styles.btn} ${lang === 'vi' ? styles.active : ''}`}
        onClick={() => setLang('vi')}
        aria-pressed={lang === 'vi'}
        aria-label="Tiếng Việt"
      >
        VI
      </button>
      <span className={styles.divider} aria-hidden="true">·</span>
      <button
        id="lang-switcher-en"
        className={`${styles.btn} ${lang === 'en' ? styles.active : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
