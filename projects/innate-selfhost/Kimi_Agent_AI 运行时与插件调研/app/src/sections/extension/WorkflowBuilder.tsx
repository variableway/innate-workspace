import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Blocks, Eye, GitBranch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WorkflowFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const workflowFeatures: WorkflowFeature[] = [
  {
    icon: Blocks,
    title: 'Node Library',
    description: '50+ pre-built nodes for common operations. Search, filter, and extend with custom nodes.',
  },
  {
    icon: Eye,
    title: 'Live Preview',
    description: 'Test your workflow step-by-step. See data flow through each node in real-time.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Every change is tracked. Branch, merge, and rollback workflows with git-like semantics.',
  },
];

const sampleWorkflow = [
  { label: 'Trigger', sub: 'Scheduled', color: '#8B5CF6' },
  { label: '\u2192', sub: '', color: '#5A5570' },
  { label: 'Web Scraper', sub: 'Data source', color: '#06B6D4' },
  { label: '\u2192', sub: '', color: '#5A5570' },
  { label: 'LLM Summary', sub: 'GPT-4', color: '#10B981' },
  { label: '\u2192', sub: '', color: '#5A5570' },
  { label: 'Email Sender', sub: 'Notification', color: '#F59E0B' },
  { label: '\u2192', sub: '', color: '#5A5570' },
  { label: 'Database', sub: 'Log result', color: '#EC4899' },
];

export default function WorkflowBuilder() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!textRef.current || !cardsRef.current || !flowRef.current) return;

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

    const cards = cardsRef.current.querySelectorAll('.wf-card');
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 80%', once: true },
      }
    );

    const flowItems = flowRef.current.querySelectorAll('.flow-item');
    gsap.fromTo(
      flowItems,
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: flowRef.current, start: 'top 80%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Text */}
        <div ref={textRef} className="text-center mb-16">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            CAPABILITY 03
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            Build Agents Without Writing Code
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[720px] mx-auto">
            The Visual Workflow Builder (Agent Studio) brings agent creation to everyone.
            Drag nodes, connect them with edges, configure parameters, and preview your
            agent in real-time. Export as a plugin or publish to the marketplace.
          </p>
        </div>

        {/* Feature Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16"
        >
          {workflowFeatures.map((feature) => (
            <div
              key={feature.title}
              className="wf-card rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'rgba(138, 133, 160, 0.08)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <feature.icon className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <h3 className="font-['Space_Grotesk'] font-semibold text-[1.05rem] text-[#E0DDF0] mb-2">
                {feature.title}
              </h3>
              <p className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.6]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Sample Workflow */}
        <div
          ref={flowRef}
          className="rounded-xl p-6 border overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'rgba(138, 133, 160, 0.08)',
          }}
        >
          <p className="font-['Inter'] text-[0.8rem] text-[#5A5570] mb-4 uppercase tracking-wide">
            Sample Workflow
          </p>
          <div className="flex items-center gap-2 flex-nowrap min-w-max">
            {sampleWorkflow.map((item, i) => (
              <div key={i} className="flow-item flex items-center">
                {item.label === '\u2192' ? (
                  <span className="font-['JetBrains_Mono'] text-[1rem] text-[#5A5570] mx-1">
                    {item.label}
                  </span>
                ) : (
                  <div
                    className="px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'rgba(5, 4, 10, 0.6)',
                      borderColor: `${item.color}30`,
                    }}
                  >
                    <span
                      className="font-['JetBrains_Mono'] text-[0.8rem] font-medium block"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="font-['JetBrains_Mono'] text-[0.65rem] text-[#5A5570] block mt-0.5">
                        {item.sub}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="font-['Inter'] text-[0.8rem] text-[#8A85A0] mt-4 italic">
            Built in under 5 minutes. Trigger (scheduled) &rarr; Web Scraper &rarr; LLM Summary &rarr; Email Sender &rarr; Log to Database.
          </p>
        </div>
      </div>
    </section>
  );
}
