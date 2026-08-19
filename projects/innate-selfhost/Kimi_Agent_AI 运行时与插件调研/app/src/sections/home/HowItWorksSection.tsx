import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, Settings, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    number: '01',
    icon: Code,
    title: 'Build Your Agent',
    body: "Define your agent's personality, skills, and workflow using simple configuration. Choose from pre-built templates or start from scratch.",
  },
  {
    number: '02',
    icon: Settings,
    title: 'Add Plugins & Tools',
    body: 'Browse the plugin marketplace or create custom plugins. Connect to MCP servers, add browser automation, or integrate with your existing tools.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Ship as Product',
    body: 'Package your agent as a standalone desktop app. Distribute to your team, publish to the marketplace, or sell as a product.',
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const arrowsRef = useRef<(SVGSVGElement | null)[]>([]);

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

      stepsRef.current.forEach((step, i) => {
        if (!step) return;
        gsap.fromTo(
          step,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'expo.out',
            delay: i * 0.2,
            scrollTrigger: {
              trigger: step,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      // Arrow draw-on animation
      arrowsRef.current.forEach((arrow, i) => {
        if (!arrow) return;
        const path = arrow.querySelector('line');
        if (!path) return;
        const length = 60;
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: stepsRef.current[i],
              start: 'top 80%',
              once: true,
            },
            delay: 0.4 + i * 0.2,
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 relative z-10"
      style={{ background: '#0C0B14' }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="section-header mb-16" style={{ opacity: 0 }}>
          <span
            className="block font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.12em] mb-4"
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HOW IT WORKS
          </span>
          <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0]">
            From Idea to AI Agent in Three Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 lg:items-stretch">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  ref={(el) => { stepsRef.current[i] = el; }}
                  className="group flex-1 rounded-xl p-6 border border-[rgba(138,133,160,0.08)] transition-all duration-400"
                  style={{
                    background: '#0A0814',
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
                  {/* Step number */}
                  <span className="block font-['JetBrains_Mono'] text-[3rem] leading-[1] text-[#5A5570] mb-4">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.15)',
                    }}
                  >
                    <Icon
                      size={22}
                      className="text-[#8B5CF6]"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-['Space_Grotesk'] font-semibold text-[1.125rem] tracking-[-0.01em] text-[#E0DDF0] mb-2">
                    {step.title}
                  </h3>

                  {/* Body */}
                  <p className="font-['Inter'] text-[0.875rem] leading-[1.6] text-[#8A85A0]">
                    {step.body}
                  </p>
                </div>

                {/* Connecting arrow (desktop only, not on last item) */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center w-12 shrink-0 self-center">
                    <svg
                      ref={(el) => { arrowsRef.current[i] = el; }}
                      width="48"
                      height="24"
                      viewBox="0 0 48 24"
                      fill="none"
                      className="overflow-visible"
                    >
                      <line
                        x1="0"
                        y1="12"
                        x2="40"
                        y2="12"
                        stroke="url(#arrowGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="60"
                        strokeDashoffset="60"
                      />
                      <polygon
                        points="36,6 44,12 36,18"
                        fill="url(#arrowGrad)"
                      />
                      <defs>
                        <linearGradient
                          id="arrowGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                    </svg>
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
