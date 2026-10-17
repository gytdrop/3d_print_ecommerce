import type { Metadata } from 'next';
import LampConfigurator from '@/components/lamp/LampConfigurator';

export const metadata: Metadata = {
  title: 'Photo Lamp Frame — Your Photo as a Glowing 3D-Printed Lithophane | TechAZsure',
  description:
    'Turn any photo into a 3D-printed lithophane lamp. Cuboidal frame with a warm-white USB-C LED, swappable photo panel, and same-day delivery across Bangalore. From ₹499.',
};

// Schema.org Product structured data (photo-lamp-spec.md P0-1).
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Photo Lamp Frame',
  description:
    'Custom 3D-printed lithophane photo lamp: your photo printed as a 2.5D relief panel, seated in a cuboidal LED lamp box with slide-in rails and a warm-white USB-C light engine.',
  brand: { '@type': 'Brand', name: 'TechAZsure 3D Print' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: '499',
    highPrice: '1299',
    offerCount: '3',
    availability: 'https://schema.org/InStock',
  },
};

export default async function LampPage({
  searchParams,
}: {
  searchParams: Promise<{ size?: string; frame?: string }>;
}) {
  const { size, frame } = await searchParams;

  return (
    <div className="min-h-screen py-8 px-4 bg-[var(--bg-page)] transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="heading-display text-3xl sm:text-4xl text-[var(--text-on-page)]">
            Photo <span className="gradient-text">Lamp Frame</span>
          </h1>
          <p className="text-[var(--text-on-card)] text-sm mt-2 max-w-2xl md:mx-0 mx-auto">
            Your photo, 3D-printed as a glowing lithophane panel inside a warm LED lamp box.
            Swappable panel, braided USB-C power, delivered across Bangalore. From ₹499.
          </p>
        </div>

        <LampConfigurator initialSize={size} initialFrame={frame} />
      </div>
    </div>
  );
}
