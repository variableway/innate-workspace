import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';
import { Pencil, Package, Share2, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PubStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

const pubSteps: PubStep[] = [
  { icon: Pencil, title: 'Design', description: 'Build your agent in Agent Studio' },
  { icon: Package, title: 'Package', description: "Run 'agentforge publish' \u2014 auto-generates installers" },
  { icon: Share2, title: 'Distribute', description: 'Share via direct link, marketplace, or app store' },
  { icon: RefreshCw, title: 'Update', description: 'Push updates seamlessly with built-in auto-updater' },
];

const channels = [
  'Direct Download',
  'AgentForge Marketplace',
  'GitHub Releases',
  'Homebrew / Chocolatey / APT',
];

export default function Publishing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const channelsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!textRef.current || !stepsRef.current || !channelsRef.current || !ctaRef.current) return;

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

    const steps = stepsRef.current.querySelectorAll('.pub-step');
    gsap.fromTo(
      steps,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%', once: true },
      }
    );

    const chEls = channelsRef.current.querySelectorAll('.channel-tag');
    gsap.fromTo(
      chEls,
      { y: 15, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: channelsRef.current, start: 'top 80%', once: true },
      }
    );

    gsap.fromTo(
      ctaRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', once: true },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Text */}
        <div ref={textRef} className="text-center mb-16">
          <span className="fade-up inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4">
            CAPABILITY 04
          </span>
          <h2 className="fade-up font-['Space_Grotesk'] font-bold text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#E0DDF0] leading-[1.15] mb-4">
            From Agent to Product in One Click
          </h2>
          <p className="fade-up font-['Inter'] text-[1rem] text-[#8A85A0] leading-[1.65] max-w-[720px] mx-auto">
            Your custom agent configuration isn&apos;t just a config file &mdash; it&apos;s a product.
            AgentForge&apos;s publishing system packages your agent as a standalone desktop application,
            complete with auto-updater, branding, and platform-specific installers.
          </p>
        </div>

        {/* Publishing Steps */}
        <div ref={stepsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {pubSteps.map((step, i) => (
            <div
              key={step.title}
              className="pub-step relative rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-void)',
                borderColor: 'rgba(138, 133, 160, 0.08)',
              }}
            >
              {/* Step number */}
              <div className="absolute top-3 right-3 font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570]">
                0{i + 1}
              </div>

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <step.icon className="w-5 h-5 text-[#A78BFA]" />
              </div>

              <h3 className="font-['Space_Grotesk'] font-semibold text-[1.05rem] text-[#E0DDF0] mb-1">
                {step.title}
              </h3>
              <p className="font-['Inter'] text-[0.875rem] text-[#8A85A0] leading-[1.5]">
                {step.description}
              </p>

              {/* Connector arrow for desktop (not on last item) */}
              {i < pubSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#5A5570]">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Distribution Channels */}
        <div ref={channelsRef} className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <span className="font-['Inter'] text-[0.8rem] text-[#5A5570] mr-2">
            Distribution:
          </span>
          {channels.map((ch) => (
            <span
              key={ch}
              className="channel-tag font-['Inter'] text-[0.75rem] text-[#8A85A0] px-3 py-1.5 rounded-md border"
              style={{
                backgroundColor: 'rgba(138, 133, 160, 0.05)',
                borderColor: 'rgba(138, 133, 160, 0.1)',
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-['Inter'] font-semibold text-[0.875rem] text-white transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'var(--gradient-cta)',
              }}
            >
              See the Roadmap
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] border transition-all duration-300 hover:bg-[rgba(139,92,246,0.05)]"
              style={{ borderColor: 'rgba(138, 133, 160, 0.2)' }}
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
