'use client';

import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './WhatKyucKeeps.module.css';

export default function WhatKyucKeeps() {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

  const items = [
    {
      icon: '🎙️',
      title: isVi ? 'Giọng nói nguyên bản' : 'Original Voice',
      desc: isVi
        ? 'Lưu lại tiếng cười, ngữ điệu và hơi thở thân thương không thể thay thế.'
        : 'Capture the laughter, pauses, and tone that make their voice irreplaceable.',
    },
    {
      icon: '📝',
      title: isVi ? 'Bản chép lời chuẩn xác' : 'Written Transcripts',
      desc: isVi
        ? 'Chuyển lời nói thành văn bản rõ ràng để đọc, tìm kiếm và trích dẫn bất kỳ lúc nào.'
        : 'Every recording is transcribed so you can easily read, search, and quote forever.',
    },
    {
      icon: '✨',
      title: isVi ? 'Câu chuyện gia đình' : 'Polished Stories',
      desc: isVi
        ? 'Gắn kết câu trả lời với những kỷ niệm sâu sắc, bài học và truyền thống gia đình.'
        : 'Preserve responses with rich context, life lessons, and cultural traditions.',
    },
    {
      icon: '📷',
      title: isVi ? 'Hình ảnh kỷ niệm' : 'Precious Photos',
      desc: isVi
        ? 'Đính kèm những bức ảnh cũ gắn liền với câu chuyện để sống lại khoảnh khắc.'
        : 'Pair vintage snapshots and family albums directly with each spoken memory.',
    },
    {
      icon: '🔒',
      title: isVi ? 'Kho lưu trữ riêng tư 100%' : '100% Private Archive',
      desc: isVi
        ? 'Mặc định chỉ gia đình bạn được xem. Không quảng cáo, không AI huấn luyện, tải về bất cứ lúc nào.'
        : 'Private by default. Zero ads, zero AI training, and export your raw files anytime.',
    },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.label}>
            {isVi ? 'GIÁ TRỊ TRƯỜNG TỒN' : 'WHAT KYUC PRESERVES'}
          </span>
          <h2 className={styles.title}>
            {isVi
              ? 'Hơn cả lời nói. Lưu giữ vẹn nguyên ký ức.'
              : 'More than just words. A complete family heritage.'}
          </h2>
          <p className={styles.subtitle}>
            {isVi
              ? 'Một câu hỏi mở ra cả một thời đại. Đây là những gì kyuc° giúp bạn gìn giữ cho con cháu mai sau.'
              : 'One thoughtful prompt unlocks decades of memories. Here is what stays in your family archive forever.'}
          </p>
        </div>

        <div className={styles.grid}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.card}>
              <span className={styles.icon}>{item.icon}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
