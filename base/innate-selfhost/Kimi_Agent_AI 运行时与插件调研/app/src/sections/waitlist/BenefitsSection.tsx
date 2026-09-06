import { useRef } from 'react';
import { Key, MessageCircle, Mail } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface BenefitCard {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
}

const benefits: BenefitCard[] = [
  {
    icon: Key,
    title: 'Early Access',
    description: 'Be the first to try new features before they\'re public. Your feedback directly shapes the product.',
  },
  {
    icon: MessageCircle,
    title: 'Direct Input',
    description: 'Shape the product with your feedback. Join a focused community of AI agent builders.',
  },
  {
    icon: Mail,
    title: 'Exclusive Community',
    description: 'Join our private Discord for waitlist members. Share ideas, get support, and collaborate.',
  },
];

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    gsap.from('.benefits-header', {
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

    cardsRef.current.forEach((card, i) => {
      if (card) {
        gsap.from(card, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          delay: 0.2 + i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="benefits-header text-center mb-16">
          <span className="inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4 px-3 py-1 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)]">
            WHAT YOU GET
          </span>
          <h2 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] tracking-[-0.02em] text-[#E0DDF0]">
            Benefits of Joining
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group rounded-[12px] border border-[rgba(138,133,160,0.08)] p-8 text-center transition-all duration-[0.4s] hover:border-[rgba(139,92,246,0.3)] hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)]"
                style={{ background: 'var(--bg-surface, #0C0B14)' }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-6 text-[#8B5CF6]" />
                </div>

                {/* Title */}
                <h3 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.125rem,1.5vw,1.25rem)] tracking-[-0.01em] text-[#E0DDF0] mb-3">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0]">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
