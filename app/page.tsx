import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import WhatKyucKeeps from '@/components/landing/WhatKyucKeeps';
import StoryCategories from '@/components/landing/StoryCategories';
import QuestionDemo from '@/components/landing/QuestionDemo';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <WhatKyucKeeps />
        <StoryCategories />
        <QuestionDemo />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
