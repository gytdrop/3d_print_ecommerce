'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Upload, Menu, X, MapPin, Zap } from 'lucide-react';
import { siteContent } from '@/config/siteContent';

const navLinks = [
  { label: 'Delivery Zones', href: '/zones' },
  { label: 'Explore', href: '/explore' },
  { label: 'About', href: '/about' },
];


export default function Header() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [pincode, setPincode]     = useState('');
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);

  // Scroll-aware nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Placeholder zone check — will be replaced by real API call
  const handleZoneCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      // TODO: POST /api/zones/check?pincode=...
      setZoneLabel('⚡ 8-Hour Express available');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'nav-blur shadow-[0_1px_40px_rgba(0,0,0,0.4)]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="TechAZsure Home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--bg-accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)] group-hover:shadow-[0_0_28px_var(--accent-glow)] transition-shadow duration-300">
                <Zap size={16} className="text-[var(--text-on-accent)]" fill="var(--text-on-accent)" />
              </div>
              <span
                className="font-bold text-[17px] tracking-tight text-[var(--text-on-page)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {siteContent.navbar.logoText}
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Right side: Zone pill + CTA ── */}
            <div className="hidden md:flex items-center gap-3">
              {/* Pincode / zone indicator */}
              <form
                onSubmit={handleZoneCheck}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-glass)] transition-all duration-200 hover:border-[var(--border-mid)] group"
              >
                <MapPin size={13} className="text-[var(--text-muted)] group-focus-within:text-[var(--bg-accent)] transition-colors" />
                {zoneLabel ? (
                  <span className="text-xs font-medium text-[var(--success)] whitespace-nowrap pr-1">
                    {zoneLabel}
                  </span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter pincode"
                      className="bg-transparent text-xs text-[var(--text-on-card)] placeholder:text-[var(--text-muted)] outline-none w-24"
                      aria-label="Enter pincode for delivery check"
                    />
                    {pincode.length === 6 && (
                      <button type="submit" className="text-[10px] font-semibold text-[var(--bg-accent)] uppercase tracking-wider hover:text-[var(--accent-hover)] transition-colors">
                        Check
                      </button>
                    )}
                  </>
                )}
              </form>

              <Link href="/upload" className="btn-accent py-2 px-4 text-sm">
                <Upload size={14} />
                {siteContent.navbar.ctaText}
              </Link>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-on-card)] hover:text-[var(--text-on-page)] hover:bg-[var(--bg-glass)] transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <nav className="px-4 py-4 flex flex-col gap-3" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link py-2 border-b border-[var(--border-subtle)] last:border-0"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/upload" className="btn-accent justify-center mt-2" onClick={() => setMenuOpen(false)}>
                <Upload size={14} />
                {siteContent.navbar.ctaText}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer so content starts below fixed nav */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
