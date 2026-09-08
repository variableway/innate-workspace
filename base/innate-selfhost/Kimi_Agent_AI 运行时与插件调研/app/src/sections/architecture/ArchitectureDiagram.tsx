import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Monitor,
  Cpu,
  Puzzle,
  Database,
  ArrowDown,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const layers = [
  {
    id: 'ui',
    name: 'UI Layer',
    icon: Monitor,
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(129,140,248,0.2) 100%)',
    technologies: ['Tauri v2', 'React', 'TypeScript', 'Tailwind CSS'],
    description: 'Cross-Platform Desktop',
    stats: [
      { value: '<20MB', label: 'Bundle Size' },
      { value: '<100ms', label: 'Startup' },
    ],
  },
  {
    id: 'runtime',
    name: 'Runtime Layer',
    icon: Cpu,
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(192,132,252,0.2) 100%)',
    technologies: ['Rust', 'MCP Host', 'A2A Client', 'Auth'],
    description: 'Memory-Safe Core Engine',
    stats: [
      { value: 'Zero-Cost', label: 'Abstractions' },
      { value: 'Async', label: 'I/O' },
    ],
  },
  {
    id: 'plugin',
    name: 'Plugin Layer',
    icon: Puzzle,
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(236,72,153,0.4) 0%, rgba(244,114,182,0.2) 100%)',
    technologies: ['MCP Servers', 'WASM/WASI', 'Sandbox', 'Extensions'],
    description: '9,400+ MCP Servers',
    stats: [
      { value: '9,400+', label: 'MCP Servers' },
      { value: '97M', label: 'Downloads/mo' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage Layer',
    icon: Database,
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(6,182,212,0.4) 0%, rgba(34,211,238,0.2) 100%)',
    technologies: ['SQLite', 'sqlite-vec', 'Single File', 'FTS5'],
    description: 'Local-First Database',
    stats: [
      { value: '500KB', label: 'Library' },
      { value: '1 File', label: 'Database' },
    ],
  },
];

const connectors = [
  { label: 'Tauri Bridge API' },
  { label: 'MCP Protocol (stdio / SSE)' },
  { label: 'SQLite / File System' },
];

export default function ArchitectureDiagram() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const connectorsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Animate each layer sliding in from bottom with stagger
      layersRef.current.forEach((layer, index) => {
        if (!layer) return;

        gsap.set(layer, {
          opacity: 0,
          y: 60,
        });

        const st = ScrollTrigger.create({
          trigger: layer,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(layer, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: index * 0.15,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      });

      // Animate connectors
      connectorsRef.current.forEach((conn) => {
        if (!conn) return;

        gsap.set(conn, { opacity: 0, scaleY: 0 });

        const st = ScrollTrigger.create({
          trigger: conn,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(conn, {
              opacity: 1,
              scaleY: 1,
              duration: 0.5,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      });
    }, sectionRef);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1100px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.12em] uppercase text-[#A78BFA]">
            Four-Layer Stack
          </span>
          <h2
            className="mt-3 font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
          >
            The AgentForge Stack
          </h2>
        </div>

        {/* Layer Stack */}
        <div className="flex flex-col items-center gap-0">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div key={layer.id} className="w-full flex flex-col items-center">
                {/* Layer Card */}
                <div
                  ref={(el) => { layersRef.current[index] = el; }}
                  className="w-full relative group"
                >
                  {/* Glow effect on hover */}
                  <div
                    className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: layer.borderGradient }}
                  />
                  <div
                    className="relative w-full rounded-xl p-6 md:p-8 transition-all duration-500"
                    style={{
                      background: '#0C0B14',
                      border: '1px solid rgba(138, 133, 160, 0.1)',
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: `${layer.color}15` }}
                      >
                        <Icon size={24} style={{ color: layer.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="font-['Space_Grotesk'] font-semibold text-[1.25rem] md:text-[1.5rem] text-[#E0DDF0]">
                              {layer.name}
                            </h3>
                            <p className="mt-1 font-['Inter'] text-[0.875rem] text-[#8A85A0]">
                              {layer.description}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-4 md:gap-6">
                            {layer.stats.map((stat) => (
                              <div key={stat.label} className="text-left md:text-right">
                                <div
                                  className="font-['JetBrains_Mono'] text-[1rem] md:text-[1.125rem] font-bold"
                                  style={{ color: layer.color }}
                                >
                                  {stat.value}
                                </div>
                                <div className="font-['JetBrains_Mono'] text-[0.65rem] text-[#5A5570] uppercase tracking-wide">
                                  {stat.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Technologies */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {layer.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center font-['JetBrains_Mono'] text-[0.7rem] px-2.5 py-1 rounded-md"
                              style={{
                                background: `${layer.color}10`,
                                color: layer.color,
                                border: `1px solid ${layer.color}25`,
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < connectors.length && (
                  <div
                    ref={(el) => { connectorsRef.current[index] = el; }}
                    className="flex flex-col items-center py-2 origin-top"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ArrowDown size={16} className="text-[#5A5570]" />
                      <span
                        className="font-['JetBrains_Mono'] text-[0.65rem] text-[#5A5570] uppercase tracking-wider px-3 py-1 rounded-full"
                        style={{ background: '#141224' }}
                      >
                        {connectors[index].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
