import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Rocket, Globe, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Milestone {
  icon: LucideIcon;
  title: string;
  quarter: string;
  description: string;
  status: 'done' | 'ongoing' | 'planned' | 'future';
}

const milestones: Milestone[] = [
  {
    icon: Rocket,
    title: 'First Alpha',
    quarter: 'Q3 2026',
    description:
      'A working agent that can browse the web, execute code, and hold multi-turn conversations. Available for macOS and Linux.',
    status: 'ongoing',
  },
  {
    icon: Globe,
    title: 'Public Beta',
    quarter: 'Q4 2026',
    description:
      'Full-featured desktop app with plugin marketplace, visual workflow builder, and cross-platform support. Open to all waitlist members.',
    status: 'planned',
  },
  {
    icon: Award,
    title: 'v1.0 Release',
    quarter: 'Q1 2027',
    description:
      'Stable, production-ready platform with multi-agent support, WASM sandbox, and enterprise features. The foundation of a self-sustaining ecosystem.',
    status: 'future',
  },
];

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  done: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Completed' },
  ongoing: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'In Progress' },
  planned: { color: '#5A5570', bg: 'rgba(90, 85, 112, 0.1)', label: 'Planned' },
  future: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Future' },
};

export default function KeyMilestones() {
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

    const cards = cardsRef.current.querySelectorAll('.milestone-card');
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 80%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            KEY MILESTONES
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15]">
            What Success Looks Like
          </h2>
        </div>

        {/* Milestone Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {milestones.map((ms) => (
            <MilestoneCard key={ms.title} milestone={ms} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const { icon: Icon, title, quarter, description, status } = milestone;
  const config = statusColors[status];

  return (
    <div
      className="milestone-card group relative rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg-void)',
        borderColor: 'rgba(138, 133, 160, 0.08)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: '0 0 25px rgba(139, 92, 246, 0.1)' }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: config.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        {/* Quarter badge */}
        <span
          className="inline-block font-['JetBrains_Mono'] text-[0.7rem] font-medium px-2.5 py-1 rounded-full mb-3"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {quarter}
        </span>

        {/* Title */}
        <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] text-[#E0DDF0] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.6] mb-4">
          {description}
        </p>

        {/* Status badge */}
        <span
          className="inline-block font-['Inter'] text-[0.7rem] font-medium px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: config.bg,
            color: config.color,
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
