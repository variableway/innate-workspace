import { useRef } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin();

export default function DocHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.word');
      gsap.from(words, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
      });
    }
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[50vh] flex flex-col items-center justify-center pt-16 pb-12 px-6"
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
          Docs
        </span>
      </motion.div>

      {/* Headline */}
      <h1
        ref={headlineRef}
        className="font-['Space_Grotesk'] font-bold text-[clamp(2rem,5vw,4.5rem)] leading-[1.0] tracking-[-0.03em] text-[#E0DDF0] text-center mb-4"
      >
        <span className="word inline-block">Documentation</span>
      </h1>

      {/* Subtitle */}
      <motion.p
        className="font-['Inter'] text-[1.125rem] leading-[1.6] text-[#8A85A0] text-center max-w-[600px] mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        Everything you need to build with AgentForge
      </motion.p>

      {/* Search bar */}
      <motion.div
        className="w-full max-w-[600px] relative"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <div
          className="flex items-center h-12 rounded-[10px] border border-[#1A1830] transition-all duration-300 focus-within:border-[#8B5CF6]/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
          style={{ background: 'var(--bg-surface, #0C0B14)' }}
        >
          <Search className="ml-4 size-4 text-[#5A5570] shrink-0" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="flex-1 bg-transparent border-none outline-none px-3 font-['Inter'] text-[1rem] text-[#E0DDF0] placeholder:text-[#5A5570]"
          />
          <kbd className="hidden sm:flex items-center justify-center mr-3 px-2 py-0.5 rounded text-[0.75rem] font-['JetBrains_Mono'] text-[#5A5570] border border-[#1A1830] bg-[#0E0D18]">
            ⌘K
          </kbd>
        </div>
      </motion.div>
    </section>
  );
}
