"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, Filter, Box, LayoutGrid, Sparkles, Frame, Star, Home, Gem, KeyRound, Monitor, Building2 } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type CategoryId =
  | 'all'
  | 'frames'
  | 'figurines'
  | 'home-decor'
  | 'jewelry'
  | 'keychains'
  | 'tech'
  | 'architecture';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: Exclude<CategoryId, 'all'>;
  material: string;
  price: string;
  tag?: string;
  tagVariant?: string;
  isNew?: boolean;
}

/* ─── Category Icon Map ───────────────────────────────────────────────────── */
const categoryIcons: Record<Exclude<CategoryId, 'all'>, React.ReactNode> = {
  frames:       <Frame size={13} />,
  figurines:    <Star size={13} />,
  'home-decor': <Home size={13} />,
  jewelry:      <Gem size={13} />,
  keychains:    <KeyRound size={13} />,
  tech:         <Monitor size={13} />,
  architecture: <Building2 size={13} />,
};

const categoryLabels: Record<Exclude<CategoryId, 'all'>, string> = {
  frames:       'Frames',
  figurines:    'Figurines',
  'home-decor': 'Home Decor',
  jewelry:      'Jewelry',
  keychains:    'Keychains',
  tech:         'Tech & Gadgets',
  architecture: 'Architecture',
};

const categoryGradients: Record<Exclude<CategoryId, 'all'>, string> = {
  frames:       'from-orange-500/20 to-amber-500/20',
  figurines:    'from-yellow-500/20 to-orange-600/20',
  'home-decor': 'from-emerald-500/20 to-teal-600/20',
  jewelry:      'from-pink-500/20 to-rose-600/20',
  keychains:    'from-indigo-500/20 to-blue-600/20',
  tech:         'from-cyan-500/20 to-blue-600/20',
  architecture: 'from-slate-400/20 to-gray-600/20',
};

/* ─── All Products ───────────────────────────────────────────────────────── */
const products: Product[] = [
  /* Frames */
  {
    id: 'classic-lithophane',
    name: 'Classic Lithophane Frame',
    description: 'Signature rectangular frame with precision 3D-etched backlight layout.',
    image: '/frames/classic_frame.png',
    category: 'frames',
    material: 'PLA',
    price: '₹299',
    tag: 'Bestseller',
    tagVariant: 'badge-accent',
  },
  {
    id: 'heart-shaped-memory',
    name: 'Heart-Shaped Memory Frame',
    description: 'Romantic heart-profile frame designed for couples and anniversaries.',
    image: '/frames/heart_frame.png',
    category: 'frames',
    material: 'PLA',
    price: '₹349',
    tag: 'Romantic',
    tagVariant: 'badge-cyan',
  },
  {
    id: 'ornate-vintage-border',
    name: 'Ornate Vintage Border Frame',
    description: 'Elegant frame styled with classic historical relief patterns and textured borders.',
    image: '/frames/vintage_frame.png',
    category: 'frames',
    material: 'PLA',
    price: '₹399',
    tag: 'Elegant',
    tagVariant: 'badge-accent',
  },
  {
    id: 'sleek-minimalist-gallery',
    name: 'Sleek Minimalist Gallery Frame',
    description: 'Clean, borderless contemporary display that fits seamlessly into modern decors.',
    image: '/frames/minimal_frame.png',
    category: 'frames',
    material: 'PLA',
    price: '₹249',
    tag: 'Modern',
    tagVariant: 'badge-cyan',
  },
  {
    id: 'embossed-celebration',
    name: 'Embossed Celebration Frame',
    description: 'Perfect for birthday gifts, featuring festive embossed patterns and customizable borders.',
    image: '/frames/celebration_frame.png',
    category: 'frames',
    material: 'PLA',
    price: '₹299',
    tag: 'Trending',
    tagVariant: 'badge-accent',
  },

  /* Figurines */
  {
    id: 'ganesha-figurine',
    name: 'Ganesha Deity Figurine',
    description: 'Intricately detailed 3D printed Ganesha idol in glossy black resin with gold accents. A perfect spiritual gift.',
    image: '/models/figurine_ganesha.png',
    category: 'figurines',
    material: 'Resin',
    price: '₹799',
    tag: 'Popular',
    tagVariant: 'badge-accent',
  },

  /* Home Decor */
  {
    id: 'voronoi-vase',
    name: 'Voronoi Lattice Vase',
    description: 'Geometric open-lattice vase with organic Voronoi patterns, matte white finish with gold interior.',
    image: '/models/homedecor_vase.png',
    category: 'home-decor',
    material: 'PLA',
    price: '₹549',
    tag: 'New',
    tagVariant: 'badge-cyan',
    isNew: true,
  },

  /* Jewelry */
  {
    id: 'floral-filigree-pendant',
    name: 'Floral Filigree Pendant',
    description: 'Rose gold resin pendant with intricate floral patterns on a fine chain. A perfect gift.',
    image: '/models/jewelry_pendant.png',
    category: 'jewelry',
    material: 'Resin',
    price: '₹449',
    tag: 'Gifting',
    tagVariant: 'badge-accent',
    isNew: true,
  },

  /* Keychains */
  {
    id: 'name-keychain',
    name: 'Custom Name Keychain',
    description: 'Bold 3D name keychains with dual-color black and orange finish. Personalize with any name.',
    image: '/models/keychain_custom.png',
    category: 'keychains',
    material: 'PLA',
    price: '₹149',
    tag: 'Trending',
    tagVariant: 'badge-cyan',
  },

  /* Tech */
  {
    id: 'desk-organizer-set',
    name: 'Desk Organizer & Phone Stand',
    description: 'Sleek geometric phone stand and multi-slot desk organizer in matte black, built for any workspace.',
    image: '/models/tech_phonestand.png',
    category: 'tech',
    material: 'PLA',
    price: '₹399',
    tag: 'New',
    tagVariant: 'badge-accent',
    isNew: true,
  },

  /* Architecture */
  {
    id: 'architecture-collectible',
    name: 'Heritage Architecture Model',
    description: 'Museum-quality 1:160 scale architectural collectible in white PLA with premium acrylic display stand.',
    image: '/models/architecture_miniature.png',
    category: 'architecture',
    material: 'PLA',
    price: '₹1,299',
    tag: 'Premium',
    tagVariant: 'badge-accent',
  },
];

/* ─── Category Filters ───────────────────────────────────────────────────── */
const categories: { id: CategoryId; label: string }[] = [
  { id: 'all',          label: 'All Products'   },
  { id: 'frames',       label: 'Frames'          },
  { id: 'figurines',    label: 'Figurines'       },
  { id: 'home-decor',   label: 'Home Decor'      },
  { id: 'jewelry',      label: 'Jewelry'          },
  { id: 'keychains',    label: 'Keychains'        },
  { id: 'tech',         label: 'Tech & Gadgets'   },
  { id: 'architecture', label: 'Architecture'     },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-0 md:min-h-[92vh] py-6 md:py-16 px-4 relative w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14 animate-fade-in-up">
          <span className="badge badge-accent mb-4 inline-flex items-center gap-1.5">
            <Sparkles size={12} />
            Curated Collection
          </span>
          <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-[var(--text-on-page)] mb-5">
            Explore 3D Printed{' '}
            <br />
            <span className="gradient-text text-glow-accent">Gift Ideas</span>
          </h1>
          <p className="text-lg text-[var(--text-on-page)] opacity-75 max-w-2xl mx-auto">
            From iconic lithophane frames to figurines, home decor, jewelry and more — 
            all precision-printed and delivered in under 8 hours.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 md:mb-12 animate-fade-in-up delay-100">
          <Filter size={14} className="text-[var(--text-muted)] mr-1 hidden sm:block" />

          {/* All button */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-lg'
                : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-on-card)] hover:text-[var(--text-on-page)] hover:border-[var(--border-mid)]'
            }`}
          >
            <Box size={13} />
            All Products
          </button>

          {categories
            .filter((c) => c.id !== 'all')
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-lg'
                    : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-on-card)] hover:text-[var(--text-on-page)] hover:border-[var(--border-mid)]'
                }`}
              >
                {categoryIcons[cat.id as Exclude<CategoryId, 'all'>]}
                {cat.label}
              </button>
            ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-sm text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-on-page)]">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'product' : 'products'} found
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Box size={12} />
            <span>All made to order · Printed fresh</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 animate-fade-in-up delay-200">
          {filtered.map((product) => {
            const gradient = categoryGradients[product.category];
            const label = categoryLabels[product.category];
            const icon = categoryIcons[product.category];
            return (
              <div
                key={product.id}
                className="glass-card flex flex-col group overflow-hidden hover:border-[var(--border-mid)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className={`relative h-36 md:h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                  />
                  {/* Category pill */}
                  <div className="absolute top-2 left-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                      {icon}
                      {label}
                    </span>
                  </div>
                  {/* Tag */}
                  {product.tag && (
                    <div className="absolute top-2 right-2">
                      <span className={`badge ${product.tagVariant} text-[10px] py-0.5`}>
                        {product.isNew ? '+ ' : ''}{product.tag}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 md:p-5 flex flex-col flex-1">
                  <h3 className="heading-section text-sm md:text-base text-[var(--text-on-page)] group-hover:text-[var(--bg-accent)] transition-colors mb-1 md:mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  <p className="text-xs md:text-sm text-[var(--text-on-card)] line-clamp-2 mb-4 md:mb-5 flex-1">
                    {product.description}
                  </p>

                  <div className="flex flex-col pt-3 border-t border-[var(--border-subtle)] mt-auto w-full gap-2">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">From</span>
                        <span className="font-semibold text-xs md:text-base text-[var(--text-on-page)]">
                          {product.price}
                        </span>
                      </div>
                      <span className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-card)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded">
                        {product.material}
                      </span>
                    </div>

                    <Link
                      href="/upload"
                      className="w-full text-center btn-ghost text-xs md:text-sm py-1.5 md:py-2 px-2 hover:bg-[var(--bg-accent)] hover:text-[var(--text-on-accent)] hover:border-transparent transition-all block"
                    >
                      Customize &amp; Order
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <LayoutGrid size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No products in this category yet.</p>
            <p className="text-sm mt-1">Check back soon — new designs are added weekly.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 md:mt-24 text-center max-w-2xl mx-auto glass-card p-6 md:p-10 animate-fade-in-up delay-300">
          <h2 className="heading-section text-2xl text-[var(--text-on-page)] mb-4">
            Have Your Own Design?
          </h2>
          <p className="text-[var(--text-on-card)] mb-8">
            Upload any JPG, PNG, or 3D model file and our team will print it fresh for you —
            delivered within 8 hours.
          </p>
          <Link
            href="/upload"
            className="btn-accent px-8 py-3 mx-auto flex items-center justify-center w-fit"
          >
            <Upload size={18} className="mr-2" />
            Upload Your Photo or Model
          </Link>
        </div>

      </div>
    </div>
  );
}
