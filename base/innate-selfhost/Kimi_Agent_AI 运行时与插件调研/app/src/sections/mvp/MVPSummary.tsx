import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const summaryTimeline = [
  {
    phase: 'Phase 1',
    time: 'Month 0-2',
    name: 'Core Foundation',
    color: '#6366F1',
    tag: 'Foundation',
  },
  {
    phase: 'Phase 2',
    time: 'Month 2-4',
    name: 'Automation',
    color: '#A855F7',
    tag: 'Capabilities',
  },
  {
    phase: 'Phase 3',
    time: 'Month 4-6',
    name: 'Ecosystem',
    color: '#EC4899',
    tag: 'Platform',
  },
];

const metrics = [
  { value: '8 weeks', label: 'Phase 1 Duration', color: '#6366F1' },
  { value: '3 months', label: 'Per Phase Average', color: '#A855F7' },
  { value: '6 months', label: 'Total MVP Timeline', color: '#EC4899' },
];

export default function MVPSummary() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Headline
      if (headlineRef.current) {
        gsap.set(headlineRef.current, { opacity: 0, y: 30 });
        const st = ScrollTrigger.create({
          trigger: headlineRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(headlineRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }

      // Timeline
      if (timelineRef.current) {
        const nodes = timelineRef.current.querySelectorAll('.timeline-node');
        gsap.set(nodes, { opacity: 0, scale: 0.8 });
        const st = ScrollTrigger.create({
          trigger: timelineRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(nodes, {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.15,
              ease: "power3.out",
            });
          },
        });
        triggers.push(st);
      }

      // Metrics
      metricsRef.current.forEach((metric, index) => {
        if (!metric) return;
        gsap.set(metric, { opacity: 0, y: 30 });
        const st = ScrollTrigger.create({
          trigger: metric,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(metric, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: index * 0.1,
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
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0C0B14' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Headline */}
        <h2
          ref={headlineRef}
          className="text-center font-['Space_Grotesk'] font-semibold text-[#E0DDF0] tracking-[-0.02em] mb-14 opacity-0"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
        >
          Three Phases. One Vision.
        </h2>

        {/* Summary Timeline */}
        <div
          ref={timelineRef}
          className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 mb-16"
        >
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 z-0">
            <div
              className="w-full h-full"
              style={{
                background:
                  'linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
              }}
            />
          </div>

          {summaryTimeline.map((item, index) => (
            <div
              key={item.phase}
              className="timeline-node relative z-10 flex flex-col items-center md:w-1/3 md:px-4 opacity-0"
            >
              <div
                className="w-full max-w-[280px] md:max-w-none rounded-xl p-5 text-center"
                style={{
                  background: '#0C0B14',
                  border: `1px solid ${item.color}25`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: `${item.color}15`,
                    border: `2px solid ${item.color}50`,
                  }}
                >
                  <span
                    className="font-['Space_Grotesk'] font-bold text-[0.7rem]"
                    style={{ color: item.color }}
                  >
                    {index + 1}
                  </span>
                </div>
                <span
                  className="font-['JetBrains_Mono'] text-[0.65rem] uppercase tracking-[0.1em]"
                  style={{ color: item.color }}
                >
                  {item.time}
                </span>
                <h4 className="font-['Space_Grotesk'] font-semibold text-[1rem] text-[#E0DDF0] mt-1">
                  {item.name}
                </h4>
                <span
                  className="inline-block mt-2 font-['JetBrains_Mono'] text-[0.65rem] uppercase tracking-wide px-2 py-0.5 rounded"
                  style={{
                    background: `${item.color}10`,
                    color: item.color,
                  }}
                >
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 max-w-[700px] mx-auto">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              ref={(el) => { metricsRef.current[index] = el; }}
              className="flex flex-col items-center text-center p-5 rounded-xl opacity-0"
              style={{
                background: '#0C0B14',
                border: '1px solid rgba(138, 133, 160, 0.08)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${metric.color}10` }}
              >
                <Clock size={18} style={{ color: metric.color }} />
              </div>
              <span
                className="font-['JetBrains_Mono'] text-[1.25rem] font-bold"
                style={{ color: metric.color }}
              >
                {metric.value}
              </span>
              <span className="font-['Inter'] text-[0.8rem] text-[#8A85A0] mt-1">
                {metric.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
          <Link
            to="/waitlist"
            className="inline-flex items-center gap-2 font-['Inter'] font-semibold text-[0.875rem] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            }}
          >
            Join the Waitlist
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/roadmap"
            className="inline-flex items-center font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] px-6 py-3 rounded-lg border border-[rgba(138,133,160,0.2)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300"
          >
            View Full Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}
