import { useRef } from 'react';
import { CheckCircle, GitBranch, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin();

const trustBadges = [
  { icon: CheckCircle, label: 'Free Forever' },
  { icon: GitBranch, label: 'Open Source' },
  { icon: Zap, label: 'Early Access' },
];

export default function WaitlistHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.word');
      gsap.from(words, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[50vh] flex flex-col items-center justify-center pt-16 pb-8 px-6"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
      }}
    >
      {/* Breadcrumb */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <span className="font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#5A5570]">
          Home
        </span>
        <span className="text-[#5A5570]">/</span>
        <span className="font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#8B5CF6]">
          Waitlist
        </span>
      </motion.div>

      {/* Headline */}
      <h1
        ref={headlineRef}
        className="font-['Space_Grotesk'] font-bold text-[clamp(2rem,5vw,4.5rem)] leading-[1.0] tracking-[-0.03em] text-[#E0DDF0] text-center mb-4"
      >
        <span className="word inline-block">Join</span>{' '}
        <span className="word inline-block">the</span>{' '}
        <span className="word inline-block">Waitlist</span>
      </h1>

      {/* Subtitle */}
      <motion.p
        className="font-['Inter'] text-[1.125rem] leading-[1.6] text-[#8A85A0] text-center max-w-[560px] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        Be among the first to build AI products with AgentForge
      </motion.p>

      {/* Trust Badges */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        {trustBadges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.label}
              className="flex items-center gap-2 font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#5A5570]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <Icon className="size-4 text-[#10B981]" />
              {badge.label}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
