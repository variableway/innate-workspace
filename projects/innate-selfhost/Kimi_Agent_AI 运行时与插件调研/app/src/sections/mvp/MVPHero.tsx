import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ChevronDown } from 'lucide-react';

export default function MVPHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.fromTo(
        breadcrumbRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }
      )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.2'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        )
        .fromTo(
          chevronRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.2'
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center px-6"
      style={{ minHeight: '60vh', paddingTop: '64px' }}
    >
      {/* Breadcrumb */}
      <div ref={breadcrumbRef} className="opacity-0 mb-6">
        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.08em] text-[#5A5570]">
          <Link to="/" className="hover:text-[#E0DDF0] transition-colors duration-300">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#8A85A0]">MVP</span>
        </div>
      </div>

      {/* Headline */}
      <h1
        ref={headlineRef}
        className="opacity-0 font-['Space_Grotesk'] font-bold text-center leading-none tracking-[-0.03em]"
        style={{
          fontSize: 'clamp(2rem, 5vw, 4.5rem)',
          color: '#E0DDF0',
        }}
      >
        Minimum Viable Product
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="opacity-0 mt-6 font-['Inter'] text-[1.125rem] text-[#8A85A0] text-center leading-relaxed max-w-[640px]"
      >
        A focused roadmap from zero to first AI product. Each phase builds on the last, delivering real value at every step.
      </p>

      {/* Scroll cue */}
      <div
        ref={chevronRef}
        className="opacity-0 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570] tracking-wide">
          Scroll to explore
        </span>
        <ChevronDown size={18} className="text-[#5A5570] animate-bounce" />
      </div>
    </section>
  );
}
