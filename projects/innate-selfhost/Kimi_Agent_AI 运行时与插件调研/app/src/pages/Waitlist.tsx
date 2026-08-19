import { useEffect } from 'react';
import WaitlistHero from '@/sections/waitlist/WaitlistHero';
import WaitlistForm from '@/sections/waitlist/WaitlistForm';
import TrustSection from '@/sections/waitlist/TrustSection';
import BenefitsSection from '@/sections/waitlist/BenefitsSection';

export default function Waitlist() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg-void, #05040A)' }}>
      <WaitlistHero />
      <WaitlistForm />
      <TrustSection />
      <BenefitsSection />
    </div>
  );
}
