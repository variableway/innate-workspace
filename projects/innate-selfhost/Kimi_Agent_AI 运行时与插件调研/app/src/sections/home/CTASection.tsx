import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const elements = sectionRef.current?.querySelectorAll('.animate-in');
      if (!elements) return;

      elements.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            delay: i * 0.2,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              once: true,
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-24 px-6 relative z-10 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.12) 0%, transparent 70%), #05040A',
        }}
      />

      {/* Subtle pulse overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
          animation: 'pulseGlow 4s ease-in-out infinite',
        }}
      />

      <div className="relative z-[1] max-w-[800px] mx-auto text-center">
        <h2
          className="animate-in font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0] mb-5"
          style={{ opacity: 0 }}
        >
          Ready to Build Your First Agent?
        </h2>

        <p
          className="animate-in font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0] max-w-[560px] mx-auto mb-8"
          style={{ opacity: 0 }}
        >
          Join the waitlist to get early access, contribute to the open-source
          project, or just stay in the loop.
        </p>

        <div
          className="animate-in flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          style={{ opacity: 0 }}
        >
          <Link
            to="/waitlist"
            className="inline-flex items-center justify-center font-['Inter'] font-semibold text-[1.125rem] text-white px-8 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.35)',
            }}
          >
            Join the Waitlist
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center justify-center font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] px-6 py-3 rounded-lg border border-[rgba(138,133,160,0.2)] bg-transparent hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300"
          >
            Read the Docs
          </Link>
        </div>

        <p
          className="animate-in font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.08em] text-[#5A5570]"
          style={{ opacity: 0 }}
        >
          No spam. Unsubscribe anytime. Open source on GitHub.
        </p>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.18; }
        }
      `}</style>
    </section>
  );
}
