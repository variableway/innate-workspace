import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Users, Shield, Workflow, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  tag: string;
}

const capabilities: Capability[] = [
  {
    icon: Users,
    title: 'Multi-Agent Orchestration',
    description:
      'Chain multiple AI agents with A2A protocol. Each agent uses the best model for its task \u2014 Claude for coding, GPT for writing, Gemini for analysis.',
    features: [
      'Role-based routing',
      'Parallel execution',
      'Shared memory',
      'Human-in-the-loop',
    ],
    tag: 'Advanced',
  },
  {
    icon: Shield,
    title: 'WASM Sandbox',
    description:
      'Run untrusted plugins in isolated WebAssembly containers. <5ms startup, capability-based permissions, memory-safe by design.',
    features: [
      'Zero-trust security',
      'Sub-millisecond startup',
      'Memory isolation',
      'Cross-platform',
    ],
    tag: 'Security',
  },
  {
    icon: Workflow,
    title: 'Agent Studio',
    description:
      'Visual workflow builder for chaining tools and agents. Drag, connect, and deploy complex automation pipelines without writing code.',
    features: [
      'Visual node editor',
      '50+ built-in nodes',
      'Conditional logic',
      'Real-time preview',
    ],
    tag: 'No-Code',
  },
  {
    icon: Package,
    title: 'One-Click Publish',
    description:
      'Package your customized AgentForge as a standalone Tauri application. Your users get a polished product without seeing the underlying complexity.',
    features: [
      'White-label branding',
      'Auto-updater',
      'Code signing',
      'Cross-platform builds',
    ],
    tag: 'Distribution',
  },
];

export default function CapabilitiesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current || !cardsRef.current) return;

    // Header animation
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
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Cards animation
    const cards = cardsRef.current.querySelectorAll('.capability-card');
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            FULL CAPABILITIES
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            A Platform for Building AI Agents
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[720px] mx-auto">
            The foundation is just the beginning. AgentForge&apos;s architecture is designed
            to support a rich ecosystem of capabilities.
          </p>
        </div>

        {/* Capability Cards - 2x2 Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {capabilities.map((cap) => (
            <CapabilityCard key={cap.title} capability={cap} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({ capability }: { capability: Capability }) {
  const { icon: Icon, title, description, features, tag } = capability;

  return (
    <div
      className="capability-card group relative rounded-xl p-6 transition-all duration-400"
      style={{
        backgroundColor: 'var(--bg-void)',
        border: '1px solid rgba(138, 133, 160, 0.08)',
      }}
    >
      {/* Gradient border on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" 
        style={{ 
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0,0,0,0.3)' 
        }} 
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
        >
          <Icon className="w-6 h-6 text-[#A78BFA]" />
        </div>

        {/* Tag */}
        <span
          className="inline-block font-['Inter'] text-[0.75rem] font-medium tracking-wide uppercase px-3 py-1 rounded-full mb-4"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#A78BFA',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          {tag}
        </span>

        {/* Title */}
        <h3 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.125rem,1.5vw,1.5rem)] tracking-[-0.01em] text-[#E0DDF0] mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] mb-5">
          {description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <span
              key={feature}
              className="font-['Inter'] text-[0.75rem] text-[#8A85A0] px-2.5 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(138, 133, 160, 0.1)' }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
