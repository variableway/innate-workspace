import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function ExtensionHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (!headlineRef.current || !subtitleRef.current) return;

    const words = headlineRef.current.querySelectorAll('.word');

    gsap.fromTo(
      words,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
      }
    );

    gsap.fromTo(
      subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.4, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[60vh] flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-[720px] mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <span className="font-['Inter'] text-[0.75rem] font-medium text-[#5A5570] tracking-wide uppercase">
            Home / Extension
          </span>
        </nav>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="font-['Space_Grotesk'] font-bold text-[clamp(2rem,5vw,4.5rem)] leading-[1.0] tracking-[-0.03em] text-[#E0DDF0] mb-6"
        >
          <span className="word inline-block">Beyond</span>{' '}
          <span className="word inline-block">the</span>{' '}
          <span className="word inline-block">Foundation</span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-['Inter'] text-[1.125rem] text-[#8A85A0] leading-[1.6] max-w-[640px] mx-auto"
        >
          Full capabilities of the AgentForge platform. From multi-agent orchestration
          to visual workflow design to seamless product distribution.
        </p>
      </div>
    </section>
  );
}
