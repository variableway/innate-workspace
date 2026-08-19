import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Zap, Puzzle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const rationaleCards = [
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    color: '#10B981',
    description:
      'WASM sandbox + capability-based permissions',
    body: 'Plugins run in a WASM sandbox with Extism, meaning they cannot access the file system, network, or other resources without explicit permission. Each plugin declares its capabilities, and the runtime enforces them at the boundary.',
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: Zap,
    color: '#F59E0B',
    description:
      'Rust core + GPU-accelerated UI rendering',
    body: 'Rust provides C++-level performance with memory safety guarantees. Zero-cost abstractions mean you pay nothing for the expressiveness of high-level code. The UI layer uses the system WebView for native GPU-accelerated rendering.',
  },
  {
    id: 'extensibility',
    title: 'Extensibility',
    icon: Puzzle,
    color: '#8B5CF6',
    description:
      'MCP protocol enables infinite tool combinations',
    body: 'The Model Context Protocol is rapidly becoming the universal standard for AI tool connectivity. With 9,400+ MCP servers and 97M monthly downloads, MCP gives AgentForge access to an ever-growing ecosystem of tools.',
  },
];

export default function DesignRationale() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Header
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: 30 });
        const st = ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(headerRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }

      // Cards
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.set(card, { opacity: 0, y: 40 });
        const st = ScrollTrigger.create({
          trigger: card,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(card, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: index * 0.12,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      });

      // CTA
      if (ctaRef.current) {
        gsap.set(ctaRef.current, { opacity: 0, y: 20 });
        const st = ScrollTrigger.create({
          trigger: ctaRef.current,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(ctaRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power3.out",
            });
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
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 opacity-0">
          <span className="font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.12em] uppercase text-[#A78BFA]">
            Design Rationale
          </span>
          <h2
            className="mt-3 font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
          >
            Why This Architecture?
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {rationaleCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group relative rounded-xl p-6 md:p-8 transition-all duration-400 opacity-0"
                style={{
                  background: '#0C0B14',
                  border: '1px solid rgba(138, 133, 160, 0.08)',
                }}
              >
                {/* Hover border glow */}
                <div
                  className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}40 0%, transparent 60%)`,
                  }}
                />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${card.color}15` }}
                  >
                    <Icon size={22} style={{ color: card.color }} />
                  </div>

                  {/* Title */}
                  <h3 className="font-['Space_Grotesk'] font-semibold text-[1.25rem] text-[#E0DDF0] mb-2">
                    {card.title}
                  </h3>

                  {/* Highlight description */}
                  <p
                    className="font-['JetBrains_Mono'] text-[0.8rem] font-medium mb-3"
                    style={{ color: card.color }}
                  >
                    {card.description}
                  </p>

                  {/* Body */}
                  <p className="font-['Inter'] text-[0.85rem] text-[#8A85A0] leading-relaxed">
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
          <Link
            to="/mvp"
            className="inline-flex items-center gap-2 font-['Inter'] font-semibold text-[0.875rem] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            }}
          >
            Explore the MVP
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/extension"
            className="inline-flex items-center font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] px-6 py-3 rounded-lg border border-[rgba(138,133,160,0.2)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300"
          >
            View Full Capabilities
          </Link>
        </div>
      </div>
    </section>
  );
}
