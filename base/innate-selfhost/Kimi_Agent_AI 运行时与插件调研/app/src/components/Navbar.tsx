import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Architecture', path: '/architecture' },
  { label: 'MVP', path: '/mvp' },
  { label: 'Extension', path: '/extension' },
  { label: 'Roadmap', path: '/roadmap' },
  { label: 'Docs', path: '/docs' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={
          scrolled
            ? 'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#05040A]/80 border-b border-white/5 transition-all duration-300'
            : 'fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-transparent transition-all duration-300'
        }
      >
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span
              className="font-['Space_Grotesk'] font-bold text-[1rem] tracking-[0.12em] text-[#E2E0F0] uppercase"
            >
              Agent<span className="text-[#7B61FF]">Forge</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative font-['Inter'] font-medium text-[0.875rem] text-[#8A85A0] hover:text-[#E2E0F0] transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-[-4px] left-0 w-full h-[1px] bg-[#7B61FF] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:block shrink-0">
            <Link
              to="/waitlist"
              className="inline-flex items-center font-['Inter'] font-semibold text-[0.875rem] text-white px-5 py-2 rounded-full transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              }}
            >
              Join Waitlist
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 text-[#E2E0F0]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-[#05040A]/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[70] w-[280px] bg-[#0A0814] border-l border-[#1A1830] flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-[#1A1830]">
                <span className="font-['Space_Grotesk'] font-bold text-[0.875rem] tracking-[0.12em] text-[#E2E0F0] uppercase">
                  Menu
                </span>
                <button
                  className="flex items-center justify-center w-10 h-10 text-[#E2E0F0]"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex flex-col gap-1 p-6 flex-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                  >
                    <Link
                      to={link.path}
                      className="block font-['Inter'] font-medium text-[1rem] text-[#8A85A0] hover:text-[#E2E0F0] py-3 transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Drawer CTA */}
              <div className="p-6 border-t border-[#1A1830]">
                <Link
                  to="/waitlist"
                  className="flex items-center justify-center font-['Inter'] font-semibold text-[0.875rem] text-white px-5 py-3 rounded-full transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  }}
                >
                  Join Waitlist
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
