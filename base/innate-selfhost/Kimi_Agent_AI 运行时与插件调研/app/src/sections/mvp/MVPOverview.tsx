import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const phases = [
  {
    number: '01',
    title: 'Core Foundation',
    badge: 'Month 0-2',
    color: '#6366F1',
    description: 'Desktop shell, MCP host, SQLite storage, basic editor',
  },
  {
    number: '02',
    title: 'Automation',
    badge: 'Month 2-4',
    color: '#A855F7',
    description: 'Browser automation, desktop agent, WASM sandbox, workflows',
  },
  {
    number: '03',
    title: 'Ecosystem',
    badge: 'Month 4-6',
    color: '#EC4899',
    description: 'Plugin marketplace, one-click publish, multi-device sync',
  },
];

export default function MVPOverview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

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

      // Timeline line animation (desktop only)
      if (timelineRef.current) {
        gsap.set(timelineRef.current, { scaleX: 0, transformOrigin: 'left center' });
        const st = ScrollTrigger.create({
          trigger: timelineRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(timelineRef.current, {
              scaleX: 1,
              duration: 1,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }

      // Cards
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.set(card, { opacity: 0, y: 50 });
        const st = ScrollTrigger.create({
          trigger: card,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(card, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: index * 0.15,
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
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0C0B14' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <span className="font-['JetBrains_Mono'] text-[0.75rem] tracking-[0.12em] uppercase text-[#A78BFA]">
            The Approach
          </span>
          <h2
            className="mt-3 font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
          >
            Ship Fast, Iterate Faster
          </h2>
          <p className="mt-4 font-['Inter'] text-[1rem] text-[#8A85A0] max-w-[600px] mx-auto leading-relaxed">
            AgentForge&apos;s MVP follows a lean, three-phase approach. Each phase delivers a working
            product that can be used and tested by real users.
          </p>
        </div>

        {/* Phase Cards with Timeline */}
        <div className="relative">
          {/* Desktop Timeline Connector Line */}
          <div
            ref={timelineRef}
            className="hidden lg:block absolute top-[60px] left-[16%] right-[16%] h-[2px] z-0"
            style={{
              background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
            }}
          />

          {/* Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {phases.map((phase, index) => (
              <div
                key={phase.number}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group opacity-0"
              >
                <div
                  className="relative rounded-xl p-6 md:p-8 h-full transition-all duration-400"
                  style={{
                    background: '#0C0B14',
                    border: '1px solid rgba(138, 133, 160, 0.08)',
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${phase.color}30 0%, transparent 70%)`,
                    }}
                  />

                  <div className="relative">
                    {/* Phase Badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-['Space_Grotesk'] font-bold text-[1rem]"
                        style={{
                          background: `${phase.color}15`,
                          color: phase.color,
                          border: `2px solid ${phase.color}40`,
                        }}
                      >
                        {phase.number}
                      </div>
                      <span
                        className="font-['JetBrains_Mono'] text-[0.7rem] tracking-[0.08em] uppercase px-3 py-1 rounded-full"
                        style={{
                          background: `${phase.color}10`,
                          color: phase.color,
                          border: `1px solid ${phase.color}25`,
                        }}
                      >
                        {phase.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-['Space_Grotesk'] font-semibold text-[1.25rem] text-[#E0DDF0] mb-2">
                      {phase.title}
                    </h3>

                    {/* Description */}
                    <p className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
