import { useEffect } from 'react';
import DocHero from '@/sections/docs/DocHero';
import DocCategories from '@/sections/docs/DocCategories';
import GettingStartedGuide from '@/sections/docs/GettingStartedGuide';
import FAQSection from '@/sections/docs/FAQSection';

export default function Docs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg-void, #05040A)' }}>
      <DocHero />
      <DocCategories />
      <GettingStartedGuide />
      <FAQSection />
    </div>
  );
}
