import { useEffect } from 'react';
import HeroSection from '@/sections/home/HeroSection';
import ProductVisionSection from '@/sections/home/ProductVisionSection';
import EcosystemSection from '@/sections/home/EcosystemSection';
import FeaturesSection from '@/sections/home/FeaturesSection';
import HowItWorksSection from '@/sections/home/HowItWorksSection';
import TerminalDemoSection from '@/sections/home/TerminalDemoSection';
import TestimonialsSection from '@/sections/home/TestimonialsSection';
import CTASection from '@/sections/home/CTASection';

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      {/* Hero - full viewport with particle background */}
      <HeroSection />

      {/* Product Vision - asymmetric two-column */}
      <ProductVisionSection />

      {/* Ecosystem Proof - dark band with 4 cards */}
      <EcosystemSection />

      {/* Key Features - 6 feature cards */}
      <FeaturesSection />

      {/* How It Works - 3 steps with connecting arrows */}
      <HowItWorksSection />

      {/* Terminal Demo - typewriter effect */}
      <TerminalDemoSection />

      {/* Testimonials - social proof */}
      <TestimonialsSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  );
}
