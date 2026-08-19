import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Monitor,
  Cpu,
  Puzzle,
  Database,
  ChevronDown,
  Zap,
  Shield,
  Layers,
  HardDrive,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface TechCard {
  id: string;
  layer: string;
  icon: typeof Monitor;
  accentColor: string;
  headline: string;
  stat: string;
  statLabel: string;
  description: string;
  features: string[];
  iconAccent: typeof Zap;
}

const techCards: TechCard[] = [
  {
    id: 'tauri',
    layer: 'LAYER 01',
    icon: Monitor,
    accentColor: '#6366F1',
    headline: 'Tauri v2',
    stat: '96%',
    statLabel: 'smaller than Electron',
    description:
      'The UI layer uses Tauri v2 — a cross-platform desktop framework that bundles a lightweight WebView with a Rust backend. Unlike Electron which ships an entire Chromium instance, Tauri uses the system\'s native WebView.',
    features: [
      'System WebView instead of bundled Chromium',
      '75% less memory usage than Electron apps',
      'Native OS integration for menus, notifications, and file dialogs',
      'Cross-platform: macOS, Windows, Linux',
    ],
    iconAccent: Zap,
  },
  {
    id: 'rust',
    layer: 'LAYER 02',
    icon: Cpu,
    accentColor: '#A855F7',
    headline: 'Rust Runtime',
    stat: 'Zero-Cost',
    statLabel: 'abstractions',
    description:
      'The runtime is the heart of AgentForge — a Rust-based core that handles plugin loading, MCP client communication, and agent orchestration. Rust\'s ownership model guarantees memory safety without a garbage collector.',
    features: [
      'Memory-safe systems programming with async/await',
      'No GC pauses — consistent performance',
      'Tokio async runtime for non-blocking I/O',
      'Compile-time error prevention',
    ],
    iconAccent: Shield,
  },
  {
    id: 'mcp',
    layer: 'LAYER 03',
    icon: Puzzle,
    accentColor: '#EC4899',
    headline: 'MCP Protocol',
    stat: '9,400+',
    statLabel: 'tools available',
    description:
      'The Model Context Protocol (MCP) is the USB-C for AI — a universal standard for connecting AI assistants to data sources and tools. With 97M monthly downloads and growing, it\'s becoming the de facto plugin standard.',
    features: [
      'The USB-C for AI — universal connectivity standard',
      '97M monthly SDK downloads',
      'Supports stdio and SSE transports',
      'Automatic reconnection and health checks',
    ],
    iconAccent: Layers,
  },
  {
    id: 'sqlite',
    layer: 'LAYER 04',
    icon: Database,
    accentColor: '#06B6D4',
    headline: 'SQLite',
    stat: '500KB',
    statLabel: 'library size',
    description:
      'SQLite is the most deployed database in the world — and with the sqlite-vec extension, it now supports vector search too. A single file contains your entire database: no server, no configuration, no hassle.',
    features: [
      'The most deployed database in the world',
      'Single-file, zero-configuration setup',
      'Full-text search (FTS5) built-in',
      'Vector search with sqlite-vec extension',
    ],
    iconAccent: HardDrive,
  },
];

function ExpandableCard({ card, index }: { card: TechCard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardContainerRef.current) return;

    gsap.set(cardContainerRef.current, { opacity: 0, y: 40 });

    const st = ScrollTrigger.create({
      trigger: cardContainerRef.current,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(cardContainerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: index * 0.12,
          ease: "power3.out",
        });
      },
    });

    return () => {
      st.kill();
    };
  }, [index]);

  const Icon = card.icon;
  const IconAccent = card.iconAccent;

  return (
    <div ref={cardContainerRef} className="opacity-0">
      <div
        ref={cardRef}
        className="rounded-xl overflow-hidden transition-all duration-400"
        style={{
          background: '#0C0B14',
          border: expanded
            ? `1px solid ${card.accentColor}40`
            : '1px solid rgba(138, 133, 160, 0.1)',
        }}
      >
        {/* Card Header - Always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 md:gap-6 p-5 md:p-6 text-left cursor-pointer group"
        >
          {/* Layer number badge */}
          <div
            className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ background: `${card.accentColor}15` }}
          >
            <Icon size={24} style={{ color: card.accentColor }} />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span
                  className="font-['JetBrains_Mono'] text-[0.65rem] tracking-[0.12em] uppercase"
                  style={{ color: card.accentColor }}
                >
                  {card.layer}
                </span>
                <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] md:text-[1.25rem] text-[#E0DDF0] mt-0.5">
                  {card.headline}
                </h3>
              </div>

              {/* Stat pill */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: `${card.accentColor}10` }}
                >
                  <IconAccent size={14} style={{ color: card.accentColor }} />
                  <span
                    className="font-['JetBrains_Mono'] text-[0.8rem] font-bold"
                    style={{ color: card.accentColor }}
                  >
                    {card.stat}
                  </span>
                  <span className="font-['Inter'] text-[0.7rem] text-[#8A85A0]">
                    {card.statLabel}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className="text-[#5A5570] transition-transform duration-300 flex-shrink-0"
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Expandable Content */}
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-400"
          style={{
            maxHeight: expanded ? '500px' : '0px',
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
            <div
              className="pt-4 border-t"
              style={{ borderColor: 'rgba(138, 133, 160, 0.1)' }}
            >
              <p className="font-['Inter'] text-[0.9rem] text-[#8A85A0] leading-relaxed">
                {card.description}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {card.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className="flex items-start gap-3"
                    style={{
                      transitionDelay: expanded ? `${fIndex * 50}ms` : '0ms',
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateX(0)' : 'translateX(-10px)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: `${card.accentColor}15` }}
                    >
                      <Zap size={10} style={{ color: card.accentColor }} />
                    </div>
                    <span className="font-['Inter'] text-[0.85rem] text-[#E0DDF0]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TechDeepDive() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

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

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0C0B14' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <span className="font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.12em] uppercase text-[#A78BFA]">
            Technology Deep Dive
          </span>
          <h2
            className="mt-3 font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
          >
            Under the Hood
          </h2>
        </div>

        {/* Expandable Cards */}
        <div className="flex flex-col gap-4 max-w-[900px] mx-auto">
          {techCards.map((card, index) => (
            <ExpandableCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
