import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kyuc.alignlab.com'),
  title: {
    default: "kyuc° — Record & Preserve Family Stories in Their Own Voice",
    template: "%s | kyuc°",
  },
  description: "Record your parents' and grandparents' stories with guided questions, voice recordings, and written memories. Preserve your family history in English or Vietnamese.",
  keywords: [
    "ký ức gia đình",
    "lưu giữ câu chuyện",
    "ghi âm gia đình",
    "family stories",
    "oral history app",
    "preserve family voices",
    "grandparents questions",
    "family archive"
  ],
  alternates: {
    canonical: 'https://kyuc.alignlab.com',
    languages: {
      'en': 'https://kyuc.alignlab.com/?lang=en',
      'vi': 'https://kyuc.alignlab.com/?lang=vi',
      'x-default': 'https://kyuc.alignlab.com',
    },
  },
  openGraph: {
    title: "kyuc° — Record & Preserve Family Stories in Their Own Voice",
    description: "Small conversations. A lasting connection. Preserve your family's stories in their own voice.",
    url: 'https://kyuc.alignlab.com',
    siteName: 'kyuc°',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/hero-family.jpg',
        width: 1200,
        height: 630,
        alt: "kyuc° — Keep your family's stories alive",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "kyuc° — Record & Preserve Family Stories in Their Own Voice",
    description: "Preserve your family's stories in their own voice. Safe, private, and forever.",
    images: ['/images/hero-family.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://kyuc.alignlab.com/#website',
      url: 'https://kyuc.alignlab.com',
      name: 'kyuc°',
      description: "Preserve your parents' and grandparents' stories with guided voice recordings and written memories.",
      inLanguage: ['en', 'vi'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://kyuc.alignlab.com/#app',
      name: 'kyuc°',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: 'A private digital archive to record, transcribe, and preserve family stories across generations.',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${lora.variable}`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
