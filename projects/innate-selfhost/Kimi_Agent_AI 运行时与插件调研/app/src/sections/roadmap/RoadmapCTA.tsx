import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function RoadmapCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const els = sectionRef.current.querySelectorAll('.cta-animate');
    gsap.fromTo(
      els,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[720px] mx-auto text-center">
        <h2 className="cta-animate font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
          Be Part of the Journey
        </h2>
        <p className="cta-animate font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] mb-8">
          Join the waitlist to get early access, follow our progress, and help build
          the future of AI agent tooling.
        </p>

        <div className="cta-animate flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/waitlist"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-['Inter'] font-semibold text-[0.875rem] text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'var(--gradient-cta)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
            }}
          >
            Join the Waitlist
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] border transition-all duration-300 hover:bg-[rgba(139,92,246,0.05)]"
            style={{ borderColor: 'rgba(138, 133, 160, 0.2)' }}
          >
            <Github className="w-4 h-4" />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
