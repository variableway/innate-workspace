import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '9,400+', label: 'MCP Servers Available' },
  { value: '96%', label: 'Smaller than Electron' },
  { value: '75%', label: 'Less Memory Usage' },
];

function CountUp({
  target,
  suffix = '',
}: {
  target: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const numericValue = parseFloat(target.replace(/[^0-9.]/g, ''));
  const prefix = target.startsWith('<') ? '<' : '';

  useGSAP(
    () => {
      if (!ref.current) return;
      const obj = { value: 0 };
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            value: numericValue,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              if (ref.current) {
                const formatted =
                  numericValue >= 1000
                    ? Math.round(obj.value).toLocaleString()
                    : Math.round(obj.value).toString();
                ref.current.textContent = `${prefix}${formatted}${suffix}`;
              }
            },
          });
        },
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

export default function ProductVisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!leftRef.current || !codeRef.current) return;

      const leftElements = leftRef.current.querySelectorAll('.animate-in');
      gsap.fromTo(
        leftElements,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: leftRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        codeRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: codeRef.current,
            start: 'top 80%',
            once: true,
          },
          delay: 0.3,
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-24 px-6 relative z-10">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left column - Text (55%) */}
          <div ref={leftRef} className="lg:w-[55%]">
            <span
              className="animate-in block font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.12em] mb-4"
              style={{
                background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                opacity: 0,
              }}
            >
              THE VISION
            </span>

            <h2
              className="animate-in font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0] mb-6"
              style={{ opacity: 0 }}
            >
              Why AgentForge Exists
            </h2>

            <div
              className="animate-in space-y-4 mb-10"
              style={{ opacity: 0 }}
            >
              <p className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0]">
                Every developer has had this moment: you build a quick script to
                automate something with AI, and suddenly it becomes your team&apos;s
                most-used tool. But turning that script into a real product — with
                a UI, plugin system, and distribution — means months of
                infrastructure work.
              </p>
              <p className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0]">
                AgentForge removes that barrier. It&apos;s a lightweight runtime
                that lets you <span className="text-[#E0DDF0] font-medium">BUILD</span>,{' '}
                <span className="text-[#E0DDF0] font-medium">MODIFY</span>, and{' '}
                <span className="text-[#E0DDF0] font-medium">INTEGRATE</span>{' '}
                AI-powered tools through plugins — then turn your modifications
                into standalone products anyone can use.
              </p>
            </div>

            {/* Stats row */}
            <div
              className="animate-in grid grid-cols-3 gap-6"
              style={{ opacity: 0 }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span
                    className="font-['JetBrains_Mono'] text-[clamp(1.25rem,3vw,2rem)]"
                    style={{
                      background:
                        'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    <CountUp target={stat.value} />
                  </span>
                  <p className="font-['Inter'] text-[0.875rem] text-[#5A5570] mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Code block (45%) */}
          <div ref={codeRef} className="lg:w-[45%] flex items-center" style={{ opacity: 0 }}>
            <div
              className="w-full rounded-xl overflow-hidden border border-[rgba(138,133,160,0.08)] shadow-2xl"
              style={{
                background: '#0E0D18',
                transform: 'rotate(-2deg)',
              }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(138,133,160,0.08)]">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="ml-3 font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570]">
                  agentforge-plugin-hello.ts
                </span>
              </div>
              {/* Code */}
              <div className="p-5 overflow-x-auto">
                <pre className="font-['JetBrains_Mono'] text-[0.8rem] leading-[1.7]">
                  <code>
                    <span className="text-[#8B5CF6]">import</span>
                    <span className="text-[#E0DDF0]"> {'{ '}</span>
                    <span className="text-[#06B6D4]">defineTool</span>
                    <span className="text-[#E0DDF0]"> {'} '}</span>
                    <span className="text-[#8B5CF6]">from</span>
                    <span className="text-[#10B981]"> &apos;@agentforge/sdk&apos;</span>
                    <span className="text-[#E0DDF0]">;</span>
                    {'\n\n'}
                    <span className="text-[#8B5CF6]">export default</span>
                    <span className="text-[#06B6D4]"> defineTool</span>
                    <span className="text-[#E0DDF0]">({'{'}</span>
                    {'\n  '}
                    <span className="text-[#E0DDF0]">name: </span>
                    <span className="text-[#10B981]">&apos;hello-world&apos;</span>
                    <span className="text-[#E0DDF0]">,</span>
                    {'\n  '}
                    <span className="text-[#E0DDF0]">description: </span>
                    <span className="text-[#10B981]">&apos;A simple greeting tool&apos;</span>
                    <span className="text-[#E0DDF0]">,</span>
                    {'\n  '}
                    <span className="text-[#E0DDF0]">handler: </span>
                    <span className="text-[#8B5CF6]">async</span>
                    <span className="text-[#E0DDF0]"> ({'({ '}</span>
                    <span className="text-[#06B6D4]">name</span>
                    <span className="text-[#E0DDF0]"> {'})'}) =&gt; {'{'}</span>
                    {'\n    '}
                    <span className="text-[#8B5CF6]">return</span>
                    <span className="text-[#10B981]">{` \`Hello, \${name}! \u{1F44B}\``}</span>
                    <span className="text-[#E0DDF0]">;</span>
                    {'\n  '}
                    <span className="text-[#E0DDF0]">{'}'},</span>
                    {'\n'}
                    <span className="text-[#E0DDF0]">{'}'});</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
