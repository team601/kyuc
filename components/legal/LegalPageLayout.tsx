'use client';

import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
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
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.header}>
          <div className="container">
            <div className={styles.headerInner}>
              <span className={styles.badge}>kyuc° trust & safety</span>
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
      <Footer />
    </>
  );
}
