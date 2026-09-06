import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Code2, Puzzle, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ContributePath {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

const paths: ContributePath[] = [
  {
    icon: Code2,
    title: 'Code',
    description: 'Contribute to the core runtime on GitHub',
    link: 'https://github.com',
    linkLabel: 'View GitHub',
  },
  {
    icon: Puzzle,
    title: 'Plugins',
    description: 'Build and publish MCP servers',
    link: 'https://github.com',
    linkLabel: 'Plugin Docs',
  },
  {
    icon: MessageSquare,
    title: 'Feedback',
    description: 'Share your use cases and suggestions',
    link: 'https://discord.com',
    linkLabel: 'Join Discord',
  },
  {
    icon: Share2,
    title: 'Share',
    description: 'Spread the word about AgentForge',
    link: 'https://x.com',
    linkLabel: 'Share on X',
  },
];

export default function Contribute() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current || !cardsRef.current) return;

    const headerEls = headerRef.current.querySelectorAll('.fade-up');
    gsap.fromTo(
      headerEls,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: headerRef.current, start: 'top 80%', once: true },
      }
    );

    const cards = cardsRef.current.querySelectorAll('.contribute-card');
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 80%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            GET INVOLVED
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            Join the Community
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[640px] mx-auto">
            AgentForge is an open-source project that thrives on community contributions.
            Whether you&apos;re a developer, designer, writer, or just enthusiastic about
            AI agents &mdash; there&apos;s a way to contribute.
          </p>
        </div>

        {/* Contribution Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {paths.map((path) => (
            <a
              key={path.title}
              href={path.link}
              target="_blank"
              rel="noopener noreferrer"
              className="contribute-card group block rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'rgba(138, 133, 160, 0.08)',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: '0 0 25px rgba(139, 92, 246, 0.1)' }}
              />

              <div className="relative z-10">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                >
                  <path.icon className="w-5 h-5 text-[#A78BFA]" />
                </div>

                <h3 className="font-['Space_Grotesk'] font-semibold text-[1.05rem] text-[#E0DDF0] mb-2">
                  {path.title}
                </h3>

                <p className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.6] mb-4">
                  {path.description}
                </p>

                <span className="inline-flex items-center gap-1.5 font-['Inter'] text-[0.8rem] font-medium text-[#8B5CF6] group-hover:gap-2 transition-all duration-300">
                  {path.linkLabel}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
