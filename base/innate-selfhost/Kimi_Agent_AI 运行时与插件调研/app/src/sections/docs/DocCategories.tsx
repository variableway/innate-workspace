import { useRef } from 'react';
import {
  BookOpen,
  Puzzle,
  Layers,
  Code,
  Workflow,
  HelpCircle,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface CategoryCard {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  links: string[];
}

const categories: CategoryCard[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Installation, first plugin, and your first AI product',
    links: ['Installation Guide', 'Quick Start Tutorial', 'System Requirements'],
  },
  {
    icon: Puzzle,
    title: 'Plugin Development',
    description: 'Build MCP servers and WASM plugins for AgentForge',
    links: ['MCP Server Guide', 'WASM Plugin Tutorial', 'Plugin API Reference'],
  },
  {
    icon: Layers,
    title: 'Architecture Guide',
    description: "Deep dive into AgentForge's 4-layer architecture",
    links: ['Runtime Design', 'Storage Layer', 'Security Model'],
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation for AgentForge SDK',
    links: ['Core API', 'Plugin API', 'Authentication'],
  },
  {
    icon: Workflow,
    title: 'Agent Studio',
    description: 'Visual workflow builder documentation',
    links: ['Node Types', 'Conditional Logic', 'Deployment'],
  },
  {
    icon: HelpCircle,
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    links: ['FAQ', 'Error Codes', 'Community Support'],
  },
];

export default function DocCategories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Header animation
    gsap.from('.doc-cat-header', {
      opacity: 0,
      y: 30,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    // Cards stagger animation
    cardsRef.current.forEach((card, i) => {
      if (card) {
        gsap.from(card, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="doc-cat-header text-center mb-16">
          <span className="inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4 px-3 py-1 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)]">
            BROWSE BY TOPIC
          </span>
          <h2 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] tracking-[-0.02em] text-[#E0DDF0]">
            Find What You Need
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group rounded-[12px] border border-[rgba(138,133,160,0.08)] p-6 transition-all duration-[0.4s] cursor-pointer hover:border-[rgba(139,92,246,0.3)] hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)]"
                style={{ background: 'var(--bg-surface, #0C0B14)' }}
              >
                {/* Icon */}
                <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    className="size-8"
                    style={{
                      stroke: 'url(#icon-gradient)',
                    }}
                  />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Title */}
                <h3 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.125rem,1.5vw,1.5rem)] tracking-[-0.01em] text-[#E0DDF0] mb-2">
                  {cat.title}
                </h3>

                {/* Description */}
                <p className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0] mb-4">
                  {cat.description}
                </p>

                {/* Links */}
                <ul className="space-y-2">
                  {cat.links.map((link) => (
                    <li key={link}>
                      <span className="font-['Inter'] text-[0.875rem] text-[#7B61FF] hover:text-[#A78BFA] transition-colors duration-300 cursor-pointer inline-flex items-center gap-1 group/link">
                        <span className="w-1 h-1 rounded-full bg-[#7B61FF] group-hover/link:bg-[#A78BFA] transition-colors" />
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
