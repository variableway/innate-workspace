import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface Step {
  number: string;
  title: string;
  description: string;
  code: string;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Download AgentForge',
    description: 'Get the <20MB binary for your platform',
    code: '# macOS\nbrew install agentforge\n\n# Linux\ncurl -fsSL https://agentforge.dev/install.sh | bash\n\n# Windows\nwinget install AgentForge',
  },
  {
    number: '02',
    title: 'Install Your First Plugin',
    description: 'Browse the marketplace and click Install',
    code: '# Browse available plugins\nagentforge plugin search\n\n# Install the filesystem plugin\nagentforge plugin add mcp-server-filesystem',
  },
  {
    number: '03',
    title: 'Configure Your Provider',
    description: 'Add your Claude, GPT, or Ollama API key',
    code: '# Set your LLM provider\nagentforge config set llm.provider openai\n\n# Add your API key\nagentforge config set llm.api_key sk-...',
  },
  {
    number: '04',
    title: 'Build Something Amazing',
    description: 'Use natural language to create your first tool',
    code: '# Launch AgentForge\nagentforge run\n\n# Then say:\n# "Create a tool that summarizes PDFs\n#  and saves the output to my desktop"',
  },
];

export default function GettingStartedGuide() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Header animation
    gsap.from('.gsg-header', {
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

    // Steps animation
    stepsRef.current.forEach((step, i) => {
      if (step) {
        gsap.from(step, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 85%',
            once: true,
          },
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6"
      style={{ background: 'var(--bg-surface, #0C0B14)' }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="gsg-header text-center mb-16">
          <span className="inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4 px-3 py-1 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)]">
            GETTING STARTED
          </span>
          <h2 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] tracking-[-0.02em] text-[#E0DDF0]">
            Your First 5 Minutes
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => { stepsRef.current[index] = el; }}
              className="grid grid-cols-1 lg:grid-cols-[80px_1fr_1fr] gap-6 items-start"
            >
              {/* Step Number */}
              <div className="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-[#8B5CF6]/30 bg-[rgba(139,92,246,0.1)] shrink-0">
                <span className="font-['Space_Grotesk'] font-bold text-[1.5rem] text-[#8B5CF6]">
                  {step.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="pt-2">
                <h3 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.125rem,1.5vw,1.5rem)] tracking-[-0.01em] text-[#E0DDF0] mb-2">
                  {step.title}
                </h3>
                <p className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0]">
                  {step.description}
                </p>
              </div>

              {/* Code Block */}
              <div
                className="rounded-lg border border-[rgba(138,133,160,0.08)] overflow-hidden"
                style={{ background: 'var(--bg-code, #0E0D18)' }}
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(138,133,160,0.08)]">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/60" />
                  <span className="ml-2 font-['JetBrains_Mono'] text-[0.75rem] text-[#5A5570]">terminal</span>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="font-['JetBrains_Mono'] text-[0.875rem] leading-[1.6] text-[#E0DDF0]">
                    {step.code.split('\n').map((line, i) => {
                      const isComment = line.trim().startsWith('#');
                      const isCommand = !isComment && line.trim().length > 0;
                      return (
                        <div key={i}>
                          {isComment ? (
                            <span className="text-[#6B9E6B]">{line}</span>
                          ) : isCommand ? (
                            <>
                              <span className="text-[#8B5CF6]">$ </span>
                              <span className="text-[#E0DDF0]">{line}</span>
                            </>
                          ) : (
                            <span>&nbsp;</span>
                          )}
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
