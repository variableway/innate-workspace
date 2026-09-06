import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Cpu, MemoryStick, Wifi, FolderOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PermissionLevel {
  label: string;
  description: string;
  color: string;
}

const permissionLevels: PermissionLevel[] = [
  { label: 'Trusted', description: 'Full access, signed by core team', color: '#10B981' },
  { label: 'Verified', description: 'Network + FS access, community reviewed', color: '#06B6D4' },
  { label: 'Sandboxed', description: 'CPU/memory limits, no network, restricted FS', color: '#F59E0B' },
  { label: 'Custom', description: 'User-defined permissions per plugin', color: '#8B5CF6' },
];

const resourceLimits = [
  { icon: Cpu, label: 'CPU', value: '100ms' },
  { icon: MemoryStick, label: 'Memory', value: '50MB' },
  { icon: Wifi, label: 'Network', value: 'Blocked' },
  { icon: FolderOpen, label: 'Filesystem', value: './data/*' },
];

export default function WASMSandbox() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const levelsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!textRef.current || !diagramRef.current || !levelsRef.current) return;

    const textEls = textRef.current.querySelectorAll('.fade-up');
    gsap.fromTo(
      textEls,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: textRef.current, start: 'top 80%', once: true },
      }
    );

    gsap.fromTo(
      diagramRef.current,
      { scale: 0.95, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: diagramRef.current, start: 'top 80%', once: true },
      }
    );

    const levels = levelsRef.current.querySelectorAll('.perm-level');
    gsap.fromTo(
      levels,
      { x: 20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: levelsRef.current, start: 'top 80%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Text */}
        <div ref={textRef} className="text-center mb-16">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            CAPABILITY 02
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            Safe Execution for Community Plugins
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[720px] mx-auto">
            The plugin ecosystem thrives when developers can share their work safely.
            AgentForge&apos;s WASM sandbox runs third-party plugins in an isolated environment
            with fine-grained permission controls and resource limits.
          </p>
        </div>

        {/* Two Column: Diagram + Permission Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Sandbox Architecture Diagram */}
          <div
            ref={diagramRef}
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: 'var(--bg-void)',
              borderColor: 'rgba(138, 133, 160, 0.08)',
            }}
          >
            <div className="text-center mb-4">
              <span className="font-['JetBrains_Mono'] text-[0.75rem] text-[#5A5570] uppercase tracking-wide">
                Host Runtime
              </span>
            </div>

            {/* Outer container */}
            <div
              className="rounded-lg p-4 border border-dashed"
              style={{ borderColor: 'rgba(139, 92, 246, 0.25)' }}
            >
              <div className="text-center mb-3">
                <span className="font-['JetBrains_Mono'] text-[0.7rem] text-[#8B5CF6] uppercase tracking-wide">
                  WASM Sandbox
                </span>
              </div>

              {/* Inner container */}
              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  borderColor: 'rgba(139, 92, 246, 0.2)',
                }}
              >
                <div className="text-center mb-4">
                  <span className="font-['JetBrains_Mono'] text-[0.8rem] text-[#E0DDF0]">
                    Plugin (isolated)
                  </span>
                </div>

                {/* Resource Limits */}
                <div className="grid grid-cols-2 gap-2">
                  {resourceLimits.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-2 rounded-md"
                      style={{ backgroundColor: 'rgba(5, 4, 10, 0.6)' }}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span className="font-['JetBrains_Mono'] text-[0.7rem] text-[#8A85A0]">
                        {label}:
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[0.7rem] text-[#E0DDF0]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Permission Levels */}
          <div ref={levelsRef} className="flex flex-col gap-3">
            <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] text-[#E0DDF0] mb-2">
              Permission Levels
            </h3>
            {permissionLevels.map((level) => (
              <div
                key={level.label}
                className="perm-level flex items-start gap-4 px-5 py-4 rounded-lg border-l-2 transition-all duration-300 hover:translate-x-1"
                style={{
                  backgroundColor: 'var(--bg-void)',
                  borderColor: 'rgba(138, 133, 160, 0.08)',
                  borderLeftColor: level.color,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: level.color }}
                />
                <div>
                  <span className="font-['Space_Grotesk'] font-semibold text-[0.95rem] text-[#E0DDF0] block">
                    {level.label}
                  </span>
                  <span className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.5]">
                    {level.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
