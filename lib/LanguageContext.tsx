'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.vi;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: translations.vi,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    // Check URL params first (great for crawlers & shared links)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang') as Language | null;
      if (urlLang === 'en' || urlLang === 'vi') {
        setLangState(urlLang);
        document.documentElement.lang = urlLang;
        try {
          localStorage.setItem('kyuc_lang', urlLang);
        } catch {}
        return;
      }

      const saved = localStorage.getItem('kyuc_lang') as Language | null;
      if (saved === 'en' || saved === 'vi') {
        setLangState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = 'en';
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
    try {
      localStorage.setItem('kyuc_lang', newLang);
    } catch {}
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
