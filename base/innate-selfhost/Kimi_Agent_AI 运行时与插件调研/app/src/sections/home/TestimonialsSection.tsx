import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  handle: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'I turned my internal CLI tool into a desktop app in a weekend. The plugin system is incredibly intuitive — I connected 3 MCP servers without writing any glue code.',
    name: 'Sarah Chen',
    role: 'Indie Developer',
    initials: 'SC',
    handle: '@sarahchen_dev',
  },
  {
    quote:
      'We evaluated 5 different agent frameworks. AgentForge was the only one that let us ship a working prototype to stakeholders in under a week. The Rust runtime is blazing fast.',
    name: 'Marcus Rivera',
    role: 'Technical Lead, DataFlow',
    initials: 'MR',
    handle: '@marcusrivera',
  },
  {
    quote:
      'The architecture is clean and the plugin API is well-designed. I\'ve already contributed two plugins and the community is incredibly welcoming.',
    name: 'Yuki Tanaka',
    role: 'Open Source Contributor',
    initials: 'YT',
    handle: '@yukitanaka',
  },
];

const stats = [
  { value: '200+', label: 'Waitlist Signups' },
  { value: '12', label: 'Plugins in Development' },
  { value: '3', label: 'Core Contributors' },
];

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full text-[0.875rem] font-['Space_Grotesk'] font-semibold text-white shrink-0"
      style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      }}
    >
      {initials}
    </div>
  );
}

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const header = sectionRef.current?.querySelector('.section-header');
      if (header) {
        gsap.fromTo(
          header,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            delay: i * 0.15,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              once: true,
            },
          }
        );

        // Avatar rotate-in
        const avatar = card.querySelector('.avatar-wrapper');
        if (avatar) {
          gsap.fromTo(
            avatar,
            { rotation: -10, scale: 0.8, opacity: 0 },
            {
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: 0.6,
              ease: 'expo.out',
              delay: i * 0.15 + 0.2,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }
      });

      // Stats bar
      const statsBar = sectionRef.current?.querySelector('.stats-bar');
      if (statsBar) {
        gsap.fromTo(
          statsBar,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: statsBar,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 relative z-10"
      style={{ background: '#0C0B14' }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="section-header text-center mb-12" style={{ opacity: 0 }}>
          <span
            className="block font-['Inter'] font-medium text-[0.75rem] uppercase tracking-[0.12em] mb-4"
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            COMMUNITY
          </span>
          <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0] mb-4">
            What Early Adopters Are Saying
          </h2>
          <p className="font-['Inter'] text-[1rem] text-[#8A85A0] max-w-[600px] mx-auto">
            Join hundreds of developers already experimenting with AgentForge
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {testimonials.map((t, i) => (
            <div
              key={t.handle}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="rounded-xl p-6 border border-[rgba(138,133,160,0.08)] transition-all duration-400 flex flex-col"
              style={{
                background: '#0A0814',
                opacity: 0,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(138, 133, 160, 0.08)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Quote */}
              <div className="mb-6 flex-1">
                <span className="text-[#7B61FF] text-[1.5rem] leading-[1]">
                  &ldquo;
                </span>
                <p className="font-['Inter'] text-[0.9rem] leading-[1.65] text-[#E0DDF0]/90 mt-1">
                  {t.quote}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="avatar-wrapper">
                  <Avatar initials={t.initials} />
                </div>
                <div>
                  <p className="font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0]">
                    {t.name}
                  </p>
                  <p className="font-['Inter'] text-[0.75rem] text-[#5A5570]">
                    {t.role}
                  </p>
                </div>
              </div>

              {/* Handle */}
              <p className="font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570] mt-3 ml-[52px]">
                {t.handle}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div
          className="stats-bar flex flex-wrap justify-center gap-8 sm:gap-16 py-6 border-t border-[rgba(138,133,160,0.08)]"
          style={{ opacity: 0 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-['JetBrains_Mono'] text-[1.5rem] sm:text-[2rem] text-[#E0DDF0]">
                {stat.value}
              </span>
              <span className="font-['Inter'] text-[0.75rem] text-[#5A5570] mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
