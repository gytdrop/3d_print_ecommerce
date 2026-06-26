import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  Globe,
  Settings,
  Users,
  Compass,
  FileText,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Our Mission & technology',
  description: 'Learn about the mission, technology, and team behind TechAZsure 3D Printing Service.',
};

const values = [
  {
    icon: Zap,
    title: 'Extreme Speed',
    desc: 'National labs take 4-7 days to ship parts. By operating localized print micro-farms inside city hubs, we deliver in as little as 8 hours.',
  },
  {
    icon: Settings,
    title: 'Precision Quoting',
    desc: 'Our backend uses exact physical volume, density, and print time metrics to create fair, immediate quotes without hidden fees.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    desc: 'Every print undergoes dimensional checks and post-processing verification before being packaged and handed to our riders.',
  },
  {
    icon: Globe,
    title: 'Eco-Friendly Fleet',
    desc: 'Local micro-hub routing minimizes cross-country logistics emissions. Our final-mile delivery partners utilize electric two-wheelers.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen py-8 px-4 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* ── Page Header ── */}
        <div className="text-center mb-8 mt-4 md:mb-8 md:mb-16 md:mt-8">
          <span className="badge badge-accent mb-4">Our Mission &amp; Vision</span>
          <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl text-[var(--text-on-page)]">
            About <span className="gradient-text">TechAZsure</span>
          </h1>
          <p className="text-[var(--text-on-card)] text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Bridging the gap between instant digital design and physical manufacturing. Get your parts exactly when you need them.
          </p>
        </div>

        {/* ── Core Section: Our Story ── */}
        <div className="glass-card p-8 mb-8 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
            <Compass size={18} className="text-[var(--bg-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-on-page)] uppercase tracking-wider">The Synthesis of Speed &amp; Quality</h2>
          </div>

          <div className="flex flex-col gap-4 text-sm text-[var(--text-on-card)] leading-relaxed">
            <p>
              TechAZsure was founded to solve a frustrating bottleneck in hardware product development: <strong>waiting weeks for prototype iterations</strong>. While digital designs could be modified in seconds, waiting for a national factory to manufacture, pack, and ship parts created massive friction.
            </p>
            <p>
              We realized that the solution lay in combining two powerful philosophies:
            </p>
            <ul className="list-disc list-inside space-y-2 py-2 text-[var(--text-on-page)] font-medium">
              <li>
                <strong className="text-[var(--bg-accent)]">Craftcloud&apos;s Model:</strong> Industrial material selection, fully transparent specifications, and instant geometric pricing.
              </li>
              <li>
                <strong className="text-[var(--cyan)]">3Dash&apos;s Model:</strong> Hyper-local dispatch hubs, 8-hour express delivery, and a clean, single-page checkout flow.
              </li>
            </ul>
            <p>
              By setting up high-performance, modular 3D print farms right inside key urban areas, we run a completely decentralized manufacturing network. Your file is routed to the hub closest to your pincode, printed immediately, and delivered by local motorcycle couriers.
            </p>
          </div>
        </div>

        {/* ── Values Grid ── */}
        <div className="mb-8 md:mb-16">
          <h2 className="heading-section text-xl text-[var(--text-on-page)] mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className="glass-card p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] border border-[var(--bg-accent)]/20 flex items-center justify-center">
                  <v.icon size={18} className="text-[var(--bg-accent)]" />
                </div>
                <h3 className="heading-section text-base text-[var(--text-on-page)] font-bold">{v.title}</h3>
                <p className="text-xs text-[var(--text-on-card)] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact & Details ── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Farm details */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="heading-section text-sm text-[var(--text-on-page)] flex items-center gap-2">
              <Users size={14} className="text-[var(--bg-accent)]" />
              Who We Serve
            </h3>
            <p className="text-xs text-[var(--text-on-card)] leading-relaxed">
              We cater to rapid-prototyping hardware engineers, industrial designers, robotics hobbyists, architectural students, and manufacturing businesses who need high-fidelity components on tight schedules.
            </p>
            <div className="mt-auto text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
              <FileText size={11} /> Capacity: 120+ active machines across Mumbai
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="heading-section text-sm text-[var(--text-on-page)] flex items-center gap-2">
              <Mail size={14} className="text-[var(--bg-accent)]" />
              Get in Touch
            </h3>
            <p className="text-xs text-[var(--text-on-card)] leading-relaxed">
              For volume partnerships, custom print runs exceeding standard material dimensions, or enterprise contract pricing, contact our support team.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-on-card)]">
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-[var(--text-muted)]" />
                <span>support@techazsure.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-[var(--text-muted)]" />
                <span>Micro-Farm Hub 02, Bandra West, Mumbai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 md:mt-16">
          <Link href="/upload" className="btn-accent px-10 py-4">
            Upload &amp; Try TechAZsure
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
