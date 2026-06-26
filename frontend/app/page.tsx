'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteContent } from '@/config/siteContent';

export default function HomePage() {
  const { hero, uploadFlow } = siteContent;

  interface PricingTier {
    id: string;
    name: string;
    price: number;
    size: string;
    popular?: boolean;
  }

  const pricingTiers: PricingTier[] = [
    { id: 'small', ...uploadFlow.pricing.small },
    { id: 'medium', ...uploadFlow.pricing.medium, popular: true },
    { id: 'large', ...uploadFlow.pricing.large },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = hero.heroSliderImages || [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative bg-page text-on-page min-h-[100dvh] overflow-x-hidden" style={{ contain: 'content' }}>
      {/* ─── Hero Section: Responsive ─── */}
      <section
        className="relative w-full overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <DesktopView hero={hero} slides={slides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
        <MobileView hero={hero} slides={slides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
      </section>



      {/* ─── Sizing & Pricing Section ─── */}
      <section
        id="pricing"
        className="py-12 md:py-24 px-4 relative z-10 border-t border-card/20 bg-card/10"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 id="pricing-heading" className="heading-display text-3xl sm:text-4xl text-on-page">
              {uploadFlow.sizeSelectLabel}
            </h2>
            <p className="mt-2 md:mt-3 text-sm text-on-card max-w-md mx-auto">
              Choose the perfect glowing frame size for your home or as a gift.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4 relative transition-all duration-300 ${
                  tier.popular
                    ? 'border-accent bg-accent-muted shadow-[0_0_20px_var(--accent-glow)]'
                    : 'border-card/20 hover:border-card/40'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 right-4 bg-accent text-[var(--text-on-accent)] border-none text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <div>
                  <h3 className="heading-section text-lg text-on-page">{tier.name}</h3>
                  <p className="text-xs text-bg-accent font-medium mt-1">{tier.size}</p>
                </div>

                <div className="my-1">
                  <span className="text-3xl font-extrabold text-on-page">₹{tier.price}</span>
                  <span className="text-[10px] text-on-card/60 ml-1.5">all-inclusive</span>
                </div>

                <ul className="space-y-2 my-1 flex-1">
                  <li className="flex items-center gap-2 text-xs text-on-card">
                    <CheckCircle size={12} className="text-bg-accent" />
                    <span>Custom lithophane stand</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-on-card">
                    <CheckCircle size={12} className="text-bg-accent" />
                    <span>USB powered warm LED base</span>
                  </li>
                </ul>

                <Link
                  href="/upload"
                  className="w-full text-center py-2.5 rounded-xl font-medium text-xs transition-colors bg-accent hover:opacity-95 font-bold shadow-sm"
                  style={tier.popular ? { color: 'var(--text-on-accent)' } : { color: 'var(--text-on-accent)', background: 'var(--bg-accent)' }}
                >
                  Select {tier.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

interface ViewProps {
  hero: {
    badgeText: string;
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroSliderImages: string[];
  };
  slides: string[];
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
}

function DesktopView({ hero, slides, currentSlide, setCurrentSlide }: ViewProps) {
  return (
    <div className="hidden md:flex min-h-screen w-full items-center justify-center relative z-0">
      {/* BACKGROUND LAYER (z-0): Full-screen sliding image wallpaper */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
            style={{
              transform: 'skewY(-6deg) rotate(-3deg) scale(1.25)',
              transformOrigin: 'center center',
              willChange: 'transform, opacity',
            }}
          >
            <Image
              src={slides[currentSlide]}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              aria-hidden="true"
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradient: darkens/lightens the image for text readability */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(135deg, var(--bg-page) 0%, rgba(var(--bg-primary-rgb,253,251,247),0.82) 45%, rgba(var(--bg-primary-rgb,253,251,247),0.35) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Photo tint shield */}
        <div className="absolute inset-0 z-20 bg-page/20 pointer-events-none" aria-hidden="true" />
      </div>

      {/* FOREGROUND LAYER (z-10): Centered glassmorphism text panel */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="w-full text-center backdrop-blur-2xl bg-page/90 text-on-page border border-primary/10 shadow-xl rounded-3xl p-6 md:p-12"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="px-4 py-1.5 text-xs font-semibold rounded-full bg-accent-muted text-bg-accent border border-accent/20 shadow-sm flex items-center gap-1.5">
              <CheckCircle size={13} className="text-bg-accent" />
              {hero.badgeText}
            </span>
          </div>

          {/* Title */}
          <h1
            id="hero-heading"
            className="heading-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-tight text-on-page antialiased"
          >
            {hero.title.split(' glowing 3D lamp')[0]}
            <span
              className="block sm:inline font-extrabold"
              style={{
                background: 'linear-gradient(135deg, var(--bg-accent), var(--accent-hover))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {' glowing 3D lamp'}
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-sm sm:text-base text-on-card leading-relaxed max-w-xl mx-auto">
            {hero.description}
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="btn-accent px-8 py-4 bg-accent hover:opacity-90 border-none shadow-[0_0_28px_var(--accent-glow)] flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.03]"
            >
              <Upload size={16} />
              {hero.ctaPrimary}
            </Link>
            <a
              href="#pricing"
              className="btn-ghost border border-accent/20 text-on-page hover:bg-card/10 flex items-center justify-center gap-1.5 rounded-xl py-4 px-6 transition-all duration-200"
            >
              {hero.ctaSecondary}
              <ChevronRight size={14} />
            </a>
          </div>

          {/* Slide indicator dots */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10" aria-hidden="true">
              {slides.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? 'w-6 h-2 bg-accent'
                      : 'w-2 h-2 bg-accent/30 hover:bg-accent/60'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MobileView({ hero, slides, currentSlide, setCurrentSlide }: ViewProps) {
  return (
    <div className="px-4 pt-4 md:hidden">
      <div className="rounded-3xl overflow-hidden relative w-full h-[400px] bg-black shadow-xl">
        {/* Image Layer */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full"
              style={{ willChange: 'opacity' }}
            >
              <Image
                src={slides[currentSlide] || slides[0]}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Gradient Shield */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10 pointer-events-none" />

        {/* Bottom-Aligned Text & CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 z-20 text-left">
          {/* Status Badge */}
          <span className="px-3 py-1 text-[10px] font-semibold rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-sm flex items-center gap-1.5 w-fit">
            <CheckCircle size={11} className="text-white" />
            {hero.badgeText}
          </span>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white leading-tight font-heading mt-1">
            {hero.title}
          </h1>

          {/* Description */}
          <p className="text-sm text-white/80 leading-snug max-w-sm">
            {hero.description}
          </p>

          {/* CTA Button */}
          <Link
            href="/upload"
            className="bg-accent text-white px-8 py-3 rounded-full flex items-center gap-2 w-fit font-bold text-xs shadow-[0_0_20px_var(--accent-glow)] hover:bg-accent-hover transition-all mt-2"
          >
            <Upload size={14} />
            {hero.ctaPrimary}
          </Link>
        </div>

        {/* Navigation Dots (Column on the far right) */}
        {slides.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2" aria-hidden="true">
            {slides.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'h-5 bg-white' : 'h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
