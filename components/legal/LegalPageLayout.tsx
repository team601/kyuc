'use client';

import React from 'react';
import { HomeFooter, HomeNav } from '@/components/home/HomePage';
import home from '@/components/home/home.module.css';
import { homeContent } from '@/lib/homeContent';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './LegalPageLayout.module.css';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const { lang } = useLanguage();
  const t = homeContent[lang];
  return (
    <div className={home.home}>
      <HomeNav t={t} solid />
      <main className={styles.page}>
        <header className={styles.header}>
          <div className="container">
            <div className={styles.headerInner}>
              <span className={styles.badge}>kyuc.ai trust & safety</span>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
              <p className={styles.meta}>{lastUpdated}</p>
            </div>
          </div>
        </header>

        <section className={styles.contentSection}>
          <div className="container">
            <article className={styles.article}>
              {children}
            </article>
          </div>
        </section>
      </main>
      <HomeFooter t={t} />
    </div>
  );
}
