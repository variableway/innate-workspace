import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ParticleField from './ParticleField';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '9,400+', label: 'MCP Tools' },
  { value: '40+', label: 'LLM Providers' },
  { value: '<20MB', label: 'Binary' },
  { value: '100%', label: 'Local' },
];

function SplitText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className: string;
  delay?: number;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const chars = containerRef.current.querySelectorAll('.char');
      gsap.fromTo(
        chars,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.03,
          ease: 'expo.out',
          delay: delay,
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <span ref={containerRef} className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="char inline-block"
          style={{ opacity: 0, whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Badge fade in first
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', delay: 0.3 }
      );

      // Subtitle fades up after headline (headline uses SplitText component)
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 1.1 }
      );

      // CTA buttons
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out', delay: 1.5 }
      );

      // Stats bar
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', delay: 1.8 }
      );

      // Scroll indicator
      gsap.fromTo(
        chevronRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 2.2 }
      );

      // Parallax on scroll - content moves up faster
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          if (contentRef.current) {
            gsap.set(contentRef.current, {
              y: -progress * 200,
              opacity: 1 - progress * 1.5,
            });
          }
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.08) 0%, transparent 60%), #05040A',
        }}
      />

      {/* Three.js Particle Field */}
      <ParticleField />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-[3] flex flex-col items-center text-center px-6 max-w-[900px] mx-auto"
      >
        {/* Pill Badge */}
        <div ref={badgeRef} className="mb-8" style={{ opacity: 0 }}>
          <span
            className="inline-flex items-center font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.08em] px-4 py-1.5 rounded-full border"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#A78BFA',
              borderColor: 'rgba(139, 92, 246, 0.2)',
            }}
          >
            Open Source AI Agent Runtime
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.04em] text-[#E0DDF0] mb-6">
          <SplitText text="Build AI Agents" className="block" delay={0.5} />
          <SplitText
            text="That Work For You"
            className="block"
            delay={0.65}
          />
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-['Inter'] text-[1.125rem] leading-[1.6] text-[#8A85A0] max-w-[640px] mb-10"
          style={{ opacity: 0 }}
        >
          A lightweight, plugin-powered runtime. Connect to 9,400+ MCP servers.
          Ship custom AI tools as standalone products.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 mb-16" style={{ opacity: 0 }}>
          <Link
            to="/waitlist"
            className="inline-flex items-center justify-center font-['Inter'] font-semibold text-[0.875rem] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
            }}
          >
            Join the Waitlist
          </Link>
          <Link
            to="/architecture"
            className="inline-flex items-center justify-center font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] px-6 py-3 rounded-lg border border-[rgba(138,133,160,0.2)] bg-transparent hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300"
          >
            View Architecture
          </Link>
        </div>

        {/* Stats Bar */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10"
          style={{ opacity: 0 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-['JetBrains_Mono'] text-[1.5rem] sm:text-[2rem] text-[#E0DDF0]">
                {stat.value}
              </span>
              <span className="font-['Inter'] text-[0.75rem] text-[#5A5570] mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={chevronRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3]"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="font-['Inter'] text-[0.7rem] text-[#5A5570] uppercase tracking-widest">
            Scroll
          </span>
          <ChevronDown size={18} className="text-[#5A5570]" />
        </div>
      </div>
    </section>
  );
}
