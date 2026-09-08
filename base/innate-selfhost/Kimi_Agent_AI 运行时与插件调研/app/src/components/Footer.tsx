import { Link } from 'react-router-dom';

const productLinks = [
  { label: 'Architecture', path: '/architecture' },
  { label: 'MVP', path: '/mvp' },
  { label: 'Extension', path: '/extension' },
  { label: 'Roadmap', path: '/roadmap' },
];

const resourceLinks = [
  { label: 'Documentation', path: '/docs' },
  { label: 'API Reference', path: '/docs' },
  { label: 'Tutorials', path: '/docs' },
];

const communityLinks = [
  { label: 'GitHub', path: 'https://github.com' },
  { label: 'Discord', path: 'https://discord.com' },
  { label: 'X (Twitter)', path: 'https://x.com' },
];

export default function Footer() {
  return (
    <footer className="bg-[#020105] border-t border-[#1A1830]">
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="inline-block">
              <span className="font-['Space_Grotesk'] font-bold text-[1rem] tracking-[0.12em] text-[#E2E0F0] uppercase">
                Agent<span className="text-[#7B61FF]">Forge</span>
              </span>
            </Link>
            <p className="font-['Inter'] text-[0.875rem] text-[#686677] leading-relaxed max-w-[260px]">
              The AI Agent Runtime with a powerful plugin system for building intelligent applications.
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-['Space_Grotesk'] font-semibold text-[0.875rem] text-[#E2E0F0] tracking-wide">
              Product
            </h4>
            <ul className="flex flex-col gap-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-['Inter'] text-[0.875rem] text-[#686677] hover:text-[#E2E0F0] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-['Space_Grotesk'] font-semibold text-[0.875rem] text-[#E2E0F0] tracking-wide">
              Resources
            </h4>
            <ul className="flex flex-col gap-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-['Inter'] text-[0.875rem] text-[#686677] hover:text-[#E2E0F0] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-['Space_Grotesk'] font-semibold text-[0.875rem] text-[#E2E0F0] tracking-wide">
              Community
            </h4>
            <ul className="flex flex-col gap-2">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Inter'] text-[0.875rem] text-[#686677] hover:text-[#E2E0F0] transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-[#1A1830]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-['Inter'] text-[0.75rem] text-[#5A5570]">
            &copy; 2026 AgentForge. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5A5570] hover:text-[#E2E0F0] transition-colors duration-300"
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5A5570] hover:text-[#E2E0F0] transition-colors duration-300"
              aria-label="Discord"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 9a5 5 0 0 0-4-2 5 5 0 0 0-4 2" />
                <path d="M10 18a5 5 0 0 0 4 2 5 5 0 0 0 4-2" />
                <path d="M8 9a5 5 0 0 0-4 2 5 5 0 0 0 4 2" />
                <path d="M16 11a5 5 0 0 0 4-2 5 5 0 0 0-4-2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5A5570] hover:text-[#E2E0F0] transition-colors duration-300"
              aria-label="X (Twitter)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
