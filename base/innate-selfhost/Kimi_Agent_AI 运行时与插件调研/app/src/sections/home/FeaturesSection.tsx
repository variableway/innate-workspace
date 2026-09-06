import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Puzzle,
  Zap,
  Monitor,
  Brain,
  Package,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  link: string;
  linkText: string;
}

const features: Feature[] = [
  {
    icon: Puzzle,
    title: 'Plugin-Powered Extensibility',
    body: 'Install, configure, and combine plugins from a growing ecosystem. Each plugin adds new tools, skills, and capabilities to your agent.',
    link: '/extension',
    linkText: 'Explore Plugins',
  },
  {
    icon: Zap,
    title: 'Lightweight Rust Runtime',
    body: 'Built in Rust for maximum performance and minimal resource usage. Start instantly, run forever, never slow down your system.',
    link: '/architecture',
    linkText: 'See Architecture',
  },
  {
    icon: Monitor,
    title: 'Desktop-Native, Everywhere',
    body: 'Powered by Tauri v2 for true cross-platform desktop apps. One codebase, native performance on macOS, Windows, and Linux.',
    link: '/mvp',
    linkText: 'View MVP',
  },
  {
    icon: Brain,
    title: 'Any LLM, Any Provider',
    body: 'Connect to 40+ LLM providers including OpenAI, Anthropic, Google, and local models via Ollama. Switch providers without changing code.',
    link: '/docs',
    linkText: 'Learn More',
  },
  {
    icon: Package,
    title: 'Turn Mods Into Products',
    body: 'Your custom agent configurations become standalone distributable products. Share with your team or publish to the marketplace.',
    link: '/roadmap',
    linkText: 'See Roadmap',
  },
  {
    icon: GitBranch,
    title: 'Open Source Foundation',
    body: 'Fully open source core. Self-host, modify, and extend. Community-driven development with clear contribution guidelines.',
    link: '/docs',
    linkText: 'Read Docs',
  },
];

function FloatingIcon({
  icon: Icon,
  index,
}: {
  icon: LucideIcon;
  index: number;
}) {
  return (
    <div
      className="flex items-center justify-center w-12 h-12 rounded-lg mb-4"
      style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        animation: `float 3s ease-in-out infinite`,
        animationDelay: `${index * 0.3}s`,
      }}
    >
      <Icon
        size={24}
        className="text-[#8B5CF6]"
        strokeWidth={1.5}
      />
    </div>
  );
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const header = sectionRef.current?.querySelector('.section-header');
      if (header) {
        gsap.fromTo(
          header,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            delay: (i % 3) * 0.08,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-24 px-6 relative z-10">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="section-header text-center mb-16" style={{ opacity: 0 }}>
          <span
            className="block font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.12em] mb-4"
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            WHAT YOU GET
          </span>
          <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0] max-w-[800px] mx-auto mb-4">
            Everything You Need, Nothing You Don&apos;t
          </h2>
          <p className="font-['Inter'] text-[1rem] text-[#8A85A0] max-w-[600px] mx-auto">
            AgentForge packs enterprise-grade capabilities into a lightweight
            runtime. Build fast, ship faster.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="group rounded-xl p-6 border border-[rgba(138,133,160,0.08)] transition-all duration-400"
              style={{
                background: '#0C0B14',
                opacity: 0,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(138, 133, 160, 0.08)';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}
            >
              <FloatingIcon icon={feature.icon} index={i} />

              <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] tracking-[-0.01em] text-[#E0DDF0] mb-2">
                {feature.title}
              </h3>

              <p className="font-['Inter'] text-[0.875rem] leading-[1.6] text-[#8A85A0] mb-4">
                {feature.body}
              </p>

              <Link
                to={feature.link}
                className="inline-flex items-center gap-1 font-['Inter'] font-medium text-[0.875rem] transition-colors duration-300 group/link"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {feature.linkText}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover/link:translate-x-1"
                  style={{ color: '#8B5CF6' }}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Float animation keyframes injected via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </section>
  );
}
