import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CheckCircle, Loader2, Clock, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Quarter {
  label: string;
  status: 'done' | 'ongoing' | 'planned' | 'future';
  milestones: string[];
  milestoneLabel: string;
  side: 'left' | 'right';
}

const quarters: Quarter[] = [
  {
    label: 'Q2 2026 \u2014 Foundation',
    status: 'done',
    milestones: [
      'Tauri v2 desktop shell',
      'MCP Host with 5+ tool integrations',
      'SQLite unified storage',
      'Code editor + terminal',
      'Multi-provider support (Claude, GPT, Ollama)',
    ],
    milestoneLabel: 'Public beta release',
    side: 'left',
  },
  {
    label: 'Q3 2026 \u2014 Automation',
    status: 'ongoing',
    milestones: [
      'Playwright browser automation',
      'UI-TARS desktop agent',
      'WASM plugin sandbox',
      'A2A multi-agent orchestration',
      'Agent Studio visual builder',
    ],
    milestoneLabel: 'Full automation platform',
    side: 'right',
  },
  {
    label: 'Q4 2026 \u2014 Ecosystem',
    status: 'planned',
    milestones: [
      'Plugin marketplace with ratings',
      'One-click publish',
      'CRDT multi-device sync',
      'Community templates gallery',
      'Plugin SDK documentation',
    ],
    milestoneLabel: 'Product-building platform',
    side: 'left',
  },
  {
    label: 'Q1 2027 \u2014 Scale',
    status: 'future',
    milestones: [
      'Cloud sync option (optional)',
      'Team collaboration features',
      'Mobile companion app',
      'Enterprise SSO/audit',
      'Plugin monetization',
    ],
    milestoneLabel: 'Platform maturity',
    side: 'right',
  },
];

const statusConfig: Record<
  Quarter['status'],
  { color: string; bg: string; icon: LucideIcon; label: string }
> = {
  done: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle, label: 'Completed' },
  ongoing: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: Loader2, label: 'In Progress' },
  planned: { color: '#5A5570', bg: 'rgba(90, 85, 112, 0.1)', icon: Clock, label: 'Planned' },
  future: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', icon: CircleDot, label: 'Future' },
};

export default function Timeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!timelineRef.current) return;

    const items = timelineRef.current.querySelectorAll('.timeline-item');
    items.forEach((item, i) => {
      const card = item.querySelector('.timeline-card');
      const node = item.querySelector('.timeline-node');

      if (card) {
        gsap.fromTo(
          card,
          {
            x: quarters[i].side === 'left' ? -60 : 60,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      if (node) {
        gsap.fromTo(
          node,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      // Milestones stagger
      const milestones = item.querySelectorAll('.milestone-item');
      gsap.fromTo(
        milestones,
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            once: true,
          },
        }
      );
    });

    // Timeline line draw animation
    const line = timelineRef.current.querySelector('.timeline-line');
    if (line) {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: 'power2.out',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1000px] mx-auto">
        <div ref={timelineRef} className="relative">
          {/* Central vertical line */}
          <div
            className="timeline-line absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 hidden md:block"
            style={{
              background:
                'linear-gradient(to bottom, #10B981 0%, #F59E0B 33%, #5A5570 66%, #8B5CF6 100%)',
            }}
          />

          {/* Mobile line */}
          <div
            className="timeline-line absolute left-4 top-0 bottom-0 w-0.5 md:hidden"
            style={{
              background:
                'linear-gradient(to bottom, #10B981 0%, #F59E0B 33%, #5A5570 66%, #8B5CF6 100%)',
            }}
          />

          <div className="flex flex-col gap-16">
            {quarters.map((q) => (
              <TimelineItem key={q.label} quarter={q} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ quarter }: { quarter: Quarter }) {
  const config = statusConfig[quarter.status];
  const StatusIcon = config.icon;
  const isLeft = quarter.side === 'left';

  return (
    <div className="timeline-item relative">
      {/* Desktop: alternating left/right layout */}
      <div
        className={`hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-start ${
          isLeft ? '' : 'md:grid-cols-[1fr_auto_1fr]'
        }`}
      >
        {/* Left content */}
        <div className={isLeft ? 'text-right' : 'order-3 text-left'}>
          {isLeft && (
            <TimelineCard quarter={quarter} config={config} StatusIcon={StatusIcon} />
          )}
        </div>

        {/* Center node */}
        <div className="relative flex flex-col items-center z-10">
          <div
            className="timeline-node w-4 h-4 rounded-full border-2"
            style={{
              backgroundColor: config.color,
              borderColor: config.color,
            }}
          />
        </div>

        {/* Right content */}
        <div className={isLeft ? 'order-3 text-left' : ''}>
          {!isLeft && (
            <TimelineCard quarter={quarter} config={config} StatusIcon={StatusIcon} />
          )}
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="md:hidden pl-12 relative">
        {/* Node on the line */}
        <div
          className="timeline-node absolute left-4 top-4 w-3 h-3 rounded-full border-2 -translate-x-1/2 z-10"
          style={{
            backgroundColor: config.color,
            borderColor: config.color,
          }}
        />
        <TimelineCard quarter={quarter} config={config} StatusIcon={StatusIcon} />
      </div>
    </div>
  );
}

function TimelineCard({
  quarter,
  config,
  StatusIcon,
}: {
  quarter: Quarter;
  config: (typeof statusConfig)['done'];
  StatusIcon: LucideIcon;
}) {
  return (
    <div
      className="timeline-card rounded-xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'rgba(138, 133, 160, 0.08)',
      }}
    >
      {/* Quarter label + Status */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="font-['JetBrains_Mono'] text-[0.8rem] font-medium bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)' }}
        >
          {quarter.label}
        </span>
        <span
          className="inline-flex items-center gap-1.5 font-['Inter'] text-[0.7rem] font-medium px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: config.bg,
            color: config.color,
          }}
        >
          <StatusIcon className={`w-3 h-3 ${quarter.status === 'ongoing' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          {config.label}
        </span>
      </div>

      {/* Milestones */}
      <ul className="flex flex-col gap-2 mb-4">
        {quarter.milestones.map((ms) => (
          <li
            key={ms}
            className="milestone-item flex items-start gap-2.5"
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <span className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.5]">
              {ms}
            </span>
          </li>
        ))}
      </ul>

      {/* Milestone highlight */}
      <div
        className="px-3 py-2 rounded-lg border-l-2"
        style={{
          backgroundColor: config.bg,
          borderLeftColor: config.color,
        }}
      >
        <span className="font-['Inter'] text-[0.8rem] font-medium" style={{ color: config.color }}>
          Milestone:
        </span>
        <span className="font-['Inter'] text-[0.8rem] text-[#8A85A0] ml-2 italic">
          {quarter.milestoneLabel}
        </span>
      </div>
    </div>
  );
}
