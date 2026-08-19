import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is AgentForge?',
    answer:
      'AgentForge is a lightweight, open-source AI Agent Runtime that lets you build, modify, and ship AI-powered tools through a plugin system. It\'s based on Tauri, Rust, and SQLite — keeping everything local and under your control.',
  },
  {
    question: 'Do I need coding experience?',
    answer:
      'Basic familiarity with command line helps, but AgentForge is designed for builders of all levels. You can use natural language to create tools, and the visual Agent Studio lets you build workflows without writing code.',
  },
  {
    question: 'Is my data sent to the cloud?',
    answer:
      'No. AgentForge is local-first. Your data stays on your device in a SQLite database. Only API calls to your chosen LLM provider leave your machine, and you control which provider to use.',
  },
  {
    question: 'What plugins are available?',
    answer:
      'AgentForge supports the entire MCP ecosystem (9,400+ servers), including web browsers, code editors, file systems, databases, and more. You can also build custom plugins.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'AgentForge is free and open-source (MIT license). You only pay for the LLM API usage you consume, and many providers offer free tiers or local options like Ollama.',
  },
  {
    question: 'Can I distribute what I build?',
    answer:
      'Yes! The One-Click Publish feature packages your customized AgentForge as a standalone application that you can distribute to users.',
  },
  {
    question: 'What platforms are supported?',
    answer:
      'AgentForge runs on macOS, Windows, and Linux thanks to Tauri\'s cross-platform capabilities.',
  },
  {
    question: 'How do I get help?',
    answer:
      'Join our Discord community, check the documentation, or open an issue on GitHub. We\'re an active open-source community.',
  },
];

export default function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.faq-header', {
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

    gsap.from('.faq-accordion', {
      opacity: 0,
      y: 20,
      duration: 0.7,
      delay: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="faq-header text-center mb-12">
          <span className="inline-block font-['Inter'] text-[0.75rem] font-medium tracking-[0.08em] uppercase text-[#A78BFA] mb-4 px-3 py-1 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)]">
            FAQ
          </span>
          <h2 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] tracking-[-0.02em] text-[#E0DDF0]">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion */}
        <div className="faq-accordion">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="rounded-[12px] border border-[rgba(138,133,160,0.08)] px-6 overflow-hidden"
                style={{ background: 'var(--bg-surface, #0C0B14)' }}
              >
                <AccordionTrigger className="font-['Space_Grotesk'] font-semibold text-[1rem] tracking-[-0.01em] text-[#E0DDF0] py-4 hover:no-underline hover:text-[#A78BFA] transition-colors duration-300">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-['Inter'] text-[1rem] leading-[1.65] text-[#8A85A0] pb-4 pt-0">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
