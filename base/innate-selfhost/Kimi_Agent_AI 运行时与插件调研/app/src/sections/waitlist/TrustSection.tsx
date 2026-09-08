import { useRef } from 'react';
import { BadgeCheck, Lock, CreditCard } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const badges = [
  { icon: BadgeCheck, label: 'Free Forever' },
  { icon: Lock, label: 'Open Source' },
  { icon: CreditCard, label: 'No Credit Card Required' },
];

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.trust-badges-row > *', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 85%',
        once: true,
      },
    });

    gsap.from('.trust-counter', {
      opacity: 0,
      y: 10,
      duration: 0.5,
      delay: 0.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 85%',
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-12 px-6">
      <div className="max-w-[640px] mx-auto text-center">
        {/* Badges Row */}
        <div className="trust-badges-row flex flex-wrap items-center justify-center gap-4 mb-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.08)]"
              >
                <Icon className="size-4 text-[#A78BFA]" />
                <span className="font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA]">
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Counter */}
        <p className="trust-counter font-['Inter'] text-[0.875rem] text-[#5A5570]">
          Join <span className="text-[#8A85A0] font-medium">500+</span> builders on the waitlist
        </p>
      </div>
    </section>
  );
}
