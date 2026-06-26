import Link from 'next/link';
import { Zap, Twitter, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { siteContent } from '@/config/siteContent';

const footerLinks = {
  Product: [
    { label: 'Upload & Print', href: '/upload' },
  ],
  Delivery: [
    { label: 'Delivery Zones', href: '/zones' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-accent/20 mt-20 bg-card text-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:py-16 flex flex-col gap-8 md:gap-12">
        
        {/* TopSummary Section (100% width) */}
        <div className="space-y-4 w-full">
          <Link href="/" className="flex items-center gap-2.5 w-fit" aria-label="TechAZsure Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--bg-accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)]">
              <Zap size={16} className="text-[var(--text-on-accent)]" fill="var(--text-on-accent)" />
            </div>
            <span className="font-bold text-[19px] text-[var(--text-on-page)] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {siteContent.navbar.logoText}
            </span>
          </Link>

          <p className="text-base text-[var(--text-on-card)] leading-relaxed max-w-2xl font-medium">
            {siteContent.footer.description}
          </p>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-6 text-sm text-[var(--text-on-card)] pt-1">
            <a href={`mailto:${siteContent.footer.email}`} className="flex items-center gap-2 hover:text-[var(--bg-accent)] transition-colors w-fit font-medium">
              <Mail size={13} />
              {siteContent.footer.email}
            </a>
            <a href={`tel:${siteContent.footer.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 hover:text-[var(--bg-accent)] transition-colors w-fit font-medium">
              <Phone size={13} />
              {siteContent.footer.phone}
            </a>
            <span className="flex items-center gap-2 font-medium">
              <MapPin size={13} />
              {siteContent.footer.location}
            </span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2.5 pt-1">
            {[
              { Icon: Twitter, href: '#', label: 'Twitter' },
              { Icon: Github, href: '#', label: 'GitHub' },
              { Icon: Linkedin, href: '#', label: 'LinkedIn' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-on-card)] hover:text-[var(--text-on-page)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-glass)] transition-all duration-200"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Divider between Summary and Links */}
        <div className="border-t border-accent/20 w-full" />

        {/* BottomLinks Section */}
        <div className="grid grid-cols-3 gap-6 md:max-w-4xl md:mx-auto w-full">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-on-page)]">
                {category}
              </h3>
              <ul className="flex flex-col gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-on-card)] hover:text-[var(--text-on-page)] leading-tight transition-colors duration-150 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-accent/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-on-card)] w-full font-medium">
          <p>© {new Date().getFullYear()} {siteContent.footer.copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--text-on-page)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-on-page)] transition-colors">Terms of Service</Link>
            <Link href="/refunds" className="hover:text-[var(--text-on-page)] transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
