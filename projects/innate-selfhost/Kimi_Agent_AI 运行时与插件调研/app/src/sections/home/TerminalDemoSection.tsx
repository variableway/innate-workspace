import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TerminalLine {
  text: string;
  color: string;
  indent?: boolean;
}

const terminalLines: TerminalLine[] = [
  { text: '$ agentforge init my-agent', color: '#7B61FF' },
  { text: '✓ Created my-agent/ directory', color: '#10B981' },
  { text: '✓ Initialized plugin system', color: '#10B981' },
  { text: '✓ Connected to local MCP hub (12 servers available)', color: '#10B981' },
  { text: '', color: '#E0DDF0' },
  { text: '$ agentforge plugin add browser-use', color: '#7B61FF' },
  { text: '✓ Installed browser-use v2.1.0', color: '#10B981' },
  { text: '✓ Added 3 new tools: navigate, click, extract', color: '#10B981' },
  { text: '', color: '#E0DDF0' },
  { text: '$ agentforge run', color: '#7B61FF' },
  { text: '🤖 AgentForge ready. Available tools:', color: '#06B6D4' },
  { text: '- web_search, file_read, code_execute', color: '#8A85A0', indent: true },
  { text: '- navigate, click, extract (browser-use)', color: '#8A85A0', indent: true },
  { text: '', color: '#E0DDF0' },
  { text: '> Search for MCP servers related to "database"', color: '#F59E0B' },
  { text: '🔍 Found 47 MCP servers for "database"', color: '#06B6D4' },
  { text: '1. mcp-server-sqlite — SQLite database operations', color: '#8A85A0', indent: true },
  { text: '2. mcp-server-postgres — PostgreSQL connector', color: '#8A85A0', indent: true },
  { text: '...', color: '#5A5570', indent: true },
];

const TYPING_SPEED = 30; // ms per character

export default function TerminalDemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentLineText, setCurrentLineText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const typingRef = useRef({
    lineIndex: 0,
    charIndex: 0,
    active: false,
  });

  const startTyping = useCallback(() => {
    if (typingRef.current.active) return;
    typingRef.current.active = true;
    typingRef.current.lineIndex = 0;
    typingRef.current.charIndex = 0;
    setIsTyping(true);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!isTyping) return;

    const typeNext = () => {
      const { lineIndex, charIndex } = typingRef.current;

      if (lineIndex >= terminalLines.length) {
        setIsTyping(false);
        setIsComplete(true);
        typingRef.current.active = false;
        return;
      }

      const line = terminalLines[lineIndex];

      if (line.text === '') {
        setVisibleLines(lineIndex + 1);
        setCurrentLineText('');
        typingRef.current.lineIndex = lineIndex + 1;
        typingRef.current.charIndex = 0;
        setTimeout(typeNext, TYPING_SPEED);
        return;
      }

      if (charIndex < line.text.length) {
        const nextCharIndex = charIndex + 1;
        typingRef.current.charIndex = nextCharIndex;
        setCurrentLineText(line.text.substring(0, nextCharIndex));
        setVisibleLines(lineIndex);
        setTimeout(typeNext, TYPING_SPEED);
      } else {
        setVisibleLines(lineIndex + 1);
        setCurrentLineText('');
        typingRef.current.lineIndex = lineIndex + 1;
        typingRef.current.charIndex = 0;
        setTimeout(typeNext, TYPING_SPEED * 2);
      }
    };

    const timer = setTimeout(typeNext, TYPING_SPEED);
    return () => clearTimeout(timer);
  }, [isTyping, visibleLines, currentLineText]);

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

      if (terminalRef.current) {
        gsap.fromTo(
          terminalRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: terminalRef.current,
              start: 'top 75%',
              once: true,
              onEnter: () => {
                startTyping();
              },
            },
          }
        );
      }
    },
    { scope: sectionRef, dependencies: [startTyping] }
  );

  return (
    <section ref={sectionRef} className="py-24 px-6 relative z-10">
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
            SEE IT IN ACTION
          </span>
          <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.03em] leading-[1.0] text-[#E0DDF0]">
            Watch AgentForge Build Real Tools
          </h2>
        </div>

        {/* Terminal Card */}
        <div
          ref={terminalRef}
          className="max-w-[800px] mx-auto rounded-2xl overflow-hidden border border-[rgba(138,133,160,0.08)] shadow-2xl"
          style={{ background: '#0E0D18', opacity: 0 }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(138,133,160,0.08)]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#10B981]" />
            <span className="ml-4 font-['JetBrains_Mono'] text-[0.7rem] text-[#5A5570]">
              agentforge — zsh
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-5 sm:p-6 min-h-[320px]">
            <pre className="font-['JetBrains_Mono'] text-[0.8rem] sm:text-[0.85rem] leading-[1.7]">
              {terminalLines.map((line, i) => {
                if (i >= visibleLines) return null;
                const isCurrentLine = i === visibleLines - 1 && isTyping;
                return (
                  <div
                    key={i}
                    className={line.indent ? 'pl-4' : ''}
                    style={{ color: line.color }}
                  >
                    {isCurrentLine ? currentLineText : line.text}
                    {isCurrentLine && (
                      <span
                        className="inline-block w-2 h-4 bg-[#E0DDF0] ml-0.5 align-middle"
                        style={{
                          animation: 'blink 1s step-end infinite',
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {/* Cursor at end when complete */}
              {isComplete && (
                <span
                  className="inline-block w-2 h-4 bg-[#E0DDF0] ml-0.5 align-middle"
                  style={{
                    animation: 'blink 1s step-end infinite',
                  }}
                />
              )}
            </pre>
          </div>
        </div>

        {/* CTA below terminal */}
        <div className="text-center mt-10">
          <Link
            to="/docs"
            className="inline-flex items-center justify-center font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] px-6 py-3 rounded-lg border border-[rgba(138,133,160,0.2)] bg-transparent hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
