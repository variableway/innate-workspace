import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Plug, Cpu, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface EcosystemCard {
  icon: LucideIcon;
  headline: string;
  body: string;
  badge: string;
}

const cards: EcosystemCard[] = [
  {
    icon: Shield,
    headline: 'Tauri v2',
    body: 'Cross-platform desktop framework. 96% smaller than Electron, 75% less memory. Native performance with web technologies.',
    badge: 'Foundation',
  },
  {
    icon: Plug,
    headline: 'Model Context Protocol',
    body: '9,400+ public MCP servers with 97M monthly SDK downloads. The emerging \'USB-C for AI\' — universal tool connectivity.',
    badge: 'Integration',
  },
  {
    icon: Cpu,
    headline: 'Rust Runtime',
    body: 'Memory-safe, zero-cost abstractions. Blazing fast plugin loading with minimal overhead and rock-solid reliability.',
    badge: 'Runtime',
  },
  {
    icon: Database,
    headline: 'Local-First AI',
    body: 'Offline-capable with SQLite storage. Works with Ollama, 40+ LLM providers. Your data stays on your machine.',
    badge: 'Privacy',
  },
];

export default function EcosystemSection() {
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
            delay: i * 0.1,
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
    <section
      ref={sectionRef}
      className="py-20 px-6 relative z-10"
      style={{ background: '#0C0B14' }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="section-header mb-12" style={{ opacity: 0 }}>
          <span
            className="block font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.12em] mb-4"
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            BUILT ON PROVEN TECH
          </span>
          <h2 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] leading-[1.15] text-[#E0DDF0]">
            Standing on the Shoulders of Giants
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.headline}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="group relative rounded-xl p-6 border border-[rgba(138,133,160,0.08)] transition-all duration-400 cursor-default"
                style={{
                  background: '#0C0B14',
                  opacity: 0,
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(138, 133, 160, 0.08)';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Badge */}
                <span
                  className="inline-block font-['Inter'] font-medium text-[0.65rem] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full mb-4"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#A78BFA',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  {card.badge}
                </span>

                {/* Icon */}
                <div className="mb-4">
                  <Icon
                    size={28}
                    className="text-[#8B5CF6] transition-transform duration-400 group-hover:scale-105"
                    strokeWidth={1.5}
                  />
                </div>

                {/* Headline */}
                <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] tracking-[-0.01em] text-[#E0DDF0] mb-2">
                  {card.headline}
                </h3>

                {/* Body */}
                <p className="font-['Inter'] text-[0.875rem] leading-[1.6] text-[#8A85A0]">
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
