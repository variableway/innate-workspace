import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const agentRoles = [
  { id: 'router', label: 'Router', sub: 'A2A Protocol', x: 0.5, y: 0 },
  { id: 'agent1', label: 'Agent 1', sub: 'Claude / Smol', x: 0.15, y: 0.55 },
  { id: 'agent2', label: 'Agent 2', sub: 'GPT / Default', x: 0.5, y: 0.55 },
  { id: 'agent3', label: 'Agent 3', sub: 'Gemini / Review', x: 0.85, y: 0.55 },
  { id: 'aggregator', label: 'Aggregator', sub: 'Result Compiler', x: 0.5, y: 1 },
];

const connections = [
  { from: 'router', to: 'agent1' },
  { from: 'router', to: 'agent2' },
  { from: 'router', to: 'agent3' },
  { from: 'agent1', to: 'aggregator' },
  { from: 'agent2', to: 'aggregator' },
  { from: 'agent3', to: 'aggregator' },
];

const features = [
  'Role-based agent definition with custom system prompts',
  'Inter-agent messaging with structured context passing',
  'Task decomposition with dependency graphs',
  'Parallel execution with result aggregation',
  'Human-in-the-loop approval checkpoints',
  'Automatic retry and fallback strategies',
];

export default function AgentOrchestration() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!textRef.current || !diagramRef.current || !featuresRef.current) return;

    // Text animation
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
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Diagram nodes animation
    const nodes = diagramRef.current.querySelectorAll('.agent-node');
    gsap.fromTo(
      nodes,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: diagramRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Connection lines
    const lines = diagramRef.current.querySelectorAll('.conn-line');
    gsap.fromTo(
      lines,
      { strokeDashoffset: 200 },
      {
        strokeDashoffset: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: diagramRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Features list
    const featEls = featuresRef.current.querySelectorAll('.feature-item');
    gsap.fromTo(
      featEls,
      { x: -20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Text Content */}
        <div ref={textRef} className="text-center mb-16">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            CAPABILITY 01
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            Teams of Agents Working Together
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[720px] mx-auto">
            Single agents are powerful. Teams of agents are transformative. AgentForge&apos;s
            multi-agent system lets you define specialized roles, establish communication
            protocols, and watch complex tasks get decomposed and executed automatically.
          </p>
        </div>

        {/* Agent Roles Diagram */}
        <div
          ref={diagramRef}
          className="relative max-w-[600px] mx-auto mb-16"
          style={{ aspectRatio: '4/3' }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 300"
            fill="none"
          >
            {connections.map((conn) => {
              const from = agentRoles.find((a) => a.id === conn.from)!;
              const to = agentRoles.find((a) => a.id === conn.to)!;
              return (
                <line
                  key={`${conn.from}-${conn.to}`}
                  className="conn-line"
                  x1={from.x * 400}
                  y1={from.y * 300 + 30}
                  x2={to.x * 400}
                  y2={to.y * 300 - 30}
                  stroke="url(#lineGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="200"
                  strokeDashoffset="200"
                  opacity="0.5"
                />
              );
            })}
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>

          {agentRoles.map((role) => (
            <div
              key={role.id}
              className="agent-node absolute flex flex-col items-center"
              style={{
                left: `${role.x * 100}%`,
                top: `${role.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="px-4 py-2.5 rounded-lg border transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(12, 11, 20, 0.9)',
                  borderColor: role.id === 'router' || role.id === 'aggregator'
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'rgba(138, 133, 160, 0.15)',
                  boxShadow:
                    role.id === 'router' || role.id === 'aggregator'
                      ? '0 0 20px rgba(139, 92, 246, 0.2)'
                      : 'none',
                }}
              >
                <span className="font-['JetBrains_Mono'] text-[0.8rem] font-medium text-[#E0DDF0] block text-center">
                  {role.label}
                </span>
                <span className="font-['JetBrains_Mono'] text-[0.65rem] text-[#5A5570] block text-center mt-0.5">
                  {role.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Features List */}
        <div
          ref={featuresRef}
          className="max-w-[600px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {features.map((feature) => (
            <div
              key={feature}
              className="feature-item flex items-start gap-3 px-4 py-3 rounded-lg"
              style={{ backgroundColor: 'rgba(138, 133, 160, 0.05)' }}
            >
              <CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
              <span className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.5]">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
