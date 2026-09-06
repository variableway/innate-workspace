import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Check,
  Clock,
  AlertTriangle,
  Terminal,
  Globe,
  Cpu,
  ShoppingCart,
  Code2,
  Brain,
  FileCode,
  AppWindow,
  Workflow,
  Layers,
  Users,
  Package,
  Share2,
  BookOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const phases = [
  {
    id: 'phase1',
    number: '01',
    title: 'Core Foundation',
    timeline: 'Month 0-2',
    color: '#6366F1',
    icon: Terminal,
    description:
      'The foundation of AgentForge — a cross-platform desktop application with a Rust runtime, MCP integration, and local SQLite storage.',
    deliverables: [
      { text: 'Tauri v2 desktop shell with React UI', icon: Code2 },
      { text: 'MCP Host with 5 built-in tool integrations', icon: Layers },
      { text: 'SQLite unified storage (config, memory, vectors)', icon: DatabaseIcon },
      { text: 'Basic code editor (Monaco) + terminal', icon: FileCode },
      { text: 'Claude/GPT/Ollama provider support', icon: Brain },
    ],
    milestones: [
      { week: 'Week 1-2', task: 'Project scaffold + Tauri setup' },
      { week: 'Week 3-4', task: 'Rust runtime + MCP client' },
      { week: 'Week 5-6', task: 'UI + Plugin system' },
      { week: 'Week 7-8', task: 'Testing + Documentation' },
    ],
    deliverableText: 'Downloadable app with plugin system',
    risks: [
      { level: 'Low', text: 'Tauri v2 is production-ready', color: '#10B981' },
      { level: 'Medium', text: 'MCP protocol evolution', color: '#F59E0B' },
    ],
  },
  {
    id: 'phase2',
    number: '02',
    title: 'Automation',
    timeline: 'Month 2-4',
    color: '#A855F7',
    icon: Globe,
    description:
      'Phase 2 transforms AgentForge from a chat-based assistant into an action-taking agent with browser and desktop automation.',
    deliverables: [
      { text: 'Playwright browser automation (browser-use)', icon: AppWindow },
      { text: 'UI-TARS desktop automation agent', icon: Cpu },
      { text: 'WASM plugin sandbox (Extism)', icon: Layers },
      { text: 'A2A multi-agent orchestration', icon: Workflow },
      { text: 'Agent Studio visual workflow builder', icon: Sparkles },
    ],
    milestones: [
      { week: 'Month 1', task: 'Browser automation core' },
      { week: 'Month 2', task: 'Visual perception + safety' },
      { week: 'Month 3', task: 'Integration + testing' },
    ],
    deliverableText: 'Full browser + desktop automation',
    risks: [
      { level: 'Medium', text: 'Visual perception accuracy', color: '#F59E0B' },
      { level: 'Medium', text: 'Browser automation reliability', color: '#F59E0B' },
    ],
  },
  {
    id: 'phase3',
    number: '03',
    title: 'Ecosystem',
    timeline: 'Month 4-6',
    color: '#EC4899',
    icon: ShoppingCart,
    description:
      'The final MVP phase opens AgentForge to the community — a plugin marketplace and visual Agent Studio for building custom agents.',
    deliverables: [
      { text: 'Plugin marketplace with ratings/reviews', icon: ShoppingCart },
      { text: 'One-click publish (package as Tauri app)', icon: Package },
      { text: 'CRDT sync for multi-device support', icon: Share2 },
      { text: 'Community plugin templates', icon: Users },
      { text: 'Plugin SDK v1.0 with documentation', icon: BookOpen },
      { text: 'Community forum and support channels', icon: MessageSquare },
    ],
    milestones: [
      { week: 'Month 1', task: 'Marketplace + Studio core' },
      { week: 'Month 2', task: 'Publish + sync system' },
      { week: 'Month 3', task: 'Community + launch' },
    ],
    deliverableText: 'Complete product-building platform',
    risks: [
      { level: 'Low', text: 'Established plugin ecosystem', color: '#10B981' },
      { level: 'High', text: 'Community adoption', color: '#EF4444' },
    ],
  },
];

function DatabaseIcon(props: { size?: number; className?: string }) {
  return (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function PhaseCard({
  phase,
  index,
}: {
  phase: (typeof phases)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Main card
      if (cardRef.current) {
        gsap.set(cardRef.current, { opacity: 0, y: 60 });
        const st = ScrollTrigger.create({
          trigger: cardRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(cardRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }

      // Content items stagger
      if (contentRef.current) {
        const items = contentRef.current.querySelectorAll('.deliverable-item');
        items.forEach((item, i) => {
          gsap.set(item, { opacity: 0, x: -20 });
          const st = ScrollTrigger.create({
            trigger: item,
            start: 'top 90%',
            once: true,
            onEnter: () => {
              gsap.to(item, {
                opacity: 1,
                x: 0,
                duration: 0.5,
                delay: i * 0.08,
                ease: "power3.out",
              });
            },
          });
          triggers.push(st);
        });
      }

      // Sidebar
      if (sidebarRef.current) {
        gsap.set(sidebarRef.current, { opacity: 0, x: 40 });
        const st = ScrollTrigger.create({
          trigger: sidebarRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(sidebarRef.current, {
              opacity: 1,
              x: 0,
              duration: 0.7,
              delay: 0.2,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }
    }, cardRef);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, []);

  const Icon = phase.icon;
  const isEven = index % 2 === 1;

  return (
    <div ref={cardRef} className="opacity-0 relative">
      {/* Phase card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#0C0B14',
          border: `1px solid ${phase.color}20`,
        }}
      >
        {/* Phase Header */}
        <div
          className="px-5 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderBottom: `1px solid ${phase.color}15` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${phase.color}15` }}
            >
              <Icon size={22} style={{ color: phase.color }} />
            </div>
            <div>
              <span
                className="font-['JetBrains_Mono'] text-[0.65rem] tracking-[0.12em] uppercase"
                style={{ color: phase.color }}
              >
                PHASE {phase.number}
              </span>
              <h3 className="font-['Space_Grotesk'] font-semibold text-[1.25rem] md:text-[1.5rem] text-[#E0DDF0]">
                {phase.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-['JetBrains_Mono'] text-[0.7rem] tracking-[0.08em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: `${phase.color}10`,
                color: phase.color,
                border: `1px solid ${phase.color}25`,
              }}
            >
              {phase.timeline}
            </span>
          </div>
        </div>

        {/* Phase Body */}
        <div className="p-5 md:p-8">
          <div
            className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12`}
          >
            {/* Content Side */}
            <div ref={contentRef} className="flex-1">
              <p className="font-['Inter'] text-[0.9rem] text-[#8A85A0] leading-relaxed mb-6">
                {phase.description}
              </p>

              {/* Deliverables */}
              <div className="mb-6">
                <h4 className="font-['Space_Grotesk'] font-semibold text-[0.875rem] text-[#E0DDF0] uppercase tracking-wide mb-4">
                  Deliverables
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {phase.deliverables.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <li
                        key={i}
                        className="deliverable-item flex items-center gap-3 opacity-0"
                      >
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: `${phase.color}15` }}
                        >
                          <Check size={12} style={{ color: phase.color }} />
                        </div>
                        <ItemIcon size={14} className="text-[#5A5570] flex-shrink-0" />
                        <span className="font-['Inter'] text-[0.85rem] text-[#E0DDF0]">
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Deliverable Highlight Box */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: `${phase.color}08`,
                  border: `1px solid ${phase.color}20`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} style={{ color: phase.color }} />
                  <span
                    className="font-['JetBrains_Mono'] text-[0.65rem] uppercase tracking-[0.1em]"
                    style={{ color: phase.color }}
                  >
                    Key Deliverable
                  </span>
                </div>
                <p className="font-['Space_Grotesk'] font-semibold text-[1rem] text-[#E0DDF0]">
                  {phase.deliverableText}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div ref={sidebarRef} className="lg:w-[300px] flex-shrink-0 opacity-0">
              <div className="flex flex-col gap-4">
                {/* Milestones Card */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    background: '#141224',
                    border: '1px solid rgba(138, 133, 160, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-[#8A85A0]" />
                    <h5 className="font-['Space_Grotesk'] font-semibold text-[0.8rem] text-[#E0DDF0] uppercase tracking-wide">
                      Milestones
                    </h5>
                  </div>
                  <div className="flex flex-col gap-3">
                    {phase.milestones.map((m, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570] flex-shrink-0 w-[70px]">
                          {m.week}
                        </span>
                        <span className="font-['Inter'] text-[0.8rem] text-[#8A85A0]">
                          {m.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Assessment Card */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    background: '#141224',
                    border: '1px solid rgba(138, 133, 160, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={14} className="text-[#8A85A0]" />
                    <h5 className="font-['Space_Grotesk'] font-semibold text-[0.8rem] text-[#E0DDF0] uppercase tracking-wide">
                      Risk Assessment
                    </h5>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {phase.risks.map((risk, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span
                          className="font-['JetBrains_Mono'] text-[0.65rem] uppercase tracking-wide px-2 py-0.5 rounded"
                          style={{
                            background: `${risk.color}15`,
                            color: risk.color,
                          }}
                        >
                          {risk.level}
                        </span>
                        <span className="font-['Inter'] text-[0.75rem] text-[#8A85A0]">
                          {risk.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhaseTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Timeline vertical line animation
      if (timelineLineRef.current) {
        gsap.set(timelineLineRef.current, { scaleY: 0, transformOrigin: 'top center' });
        const st = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 1,
          onUpdate: (self) => {
            if (timelineLineRef.current) {
              gsap.to(timelineLineRef.current, {
                scaleY: self.progress,
                duration: 0.1,
                ease: 'none',
              });
            }
          },
        });
        triggers.push(st);
      }
    }, sectionRef);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 relative">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.12em] uppercase text-[#A78BFA]">
            Implementation Plan
          </span>
          <h2
            className="mt-3 font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
          >
            Three Phases to Launch
          </h2>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical timeline line (visible on desktop) */}
          <div
            ref={timelineLineRef}
            className="hidden lg:block absolute left-[50%] top-0 bottom-0 w-[2px] -translate-x-1/2 z-0"
            style={{
              background:
                'linear-gradient(180deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
            }}
          />

          {/* Phase Nodes */}
          <div className="flex flex-col gap-12 lg:gap-16 relative z-10">
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative">
                {/* Center node on timeline (desktop) */}
                <div
                  className="hidden lg:flex absolute left-1/2 -translate-x-1/2 -top-2 w-10 h-10 rounded-full items-center justify-center z-20"
                  style={{
                    background: `${phase.color}20`,
                    border: `2px solid ${phase.color}60`,
                  }}
                >
                  <span
                    className="font-['Space_Grotesk'] font-bold text-[0.75rem]"
                    style={{ color: phase.color }}
                  >
                    {phase.number}
                  </span>
                </div>

                <div className="lg:pt-6">
                  <PhaseCard phase={phase} index={index} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
