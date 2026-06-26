'use client';

import dynamic from 'next/dynamic';
import UploadZone from '@/components/order-flow/UploadZone';
import PriceSummary from '@/components/order-flow/PriceSummary';
import MaterialSelect from '@/components/order-flow/MaterialSelect';
import DeliveryTiers from '@/components/order-flow/DeliveryTiers';
import { siteContent } from '@/config/siteContent';
import { useOrderStore } from '@/store/useOrderStore';

const ModelViewer = dynamic(() => import('@/components/viewer/ModelViewer'), {
  ssr: false,
});

export default function UploadPage() {
  const previewGenerated = useOrderStore((s) => s.previewGenerated);
  const uploadMode       = useOrderStore((s) => s.uploadMode);

  return (
    <div className="min-h-screen py-8 px-4 relative bg-[var(--bg-page)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="heading-display text-3xl sm:text-4xl text-[var(--text-on-page)]">
            {siteContent.uploadFlow.zoneTitle.split(' ').slice(0, 1).join(' ')}{' '}
            <span className="gradient-text">
              {siteContent.uploadFlow.zoneTitle.split(' ').slice(1).join(' ')}
            </span>
          </h1>
          <p className="text-[var(--text-on-card)] text-sm mt-2">
            {siteContent.hero.badgeText} · no account required
          </p>
        </div>

        {/* ── Conditional Layout ────────────────────────────────────────── */}
        {!previewGenerated ? (
          <div className="max-w-xl mx-auto w-full animate-[fadeIn_0.4s_ease-out_forwards]">
            <UploadZone />
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 items-start animate-[fadeIn_0.5s_ease-out_forwards]">
            {/* Left column (2/5): Upload drop zone + 3D viewer */}
            <div className="lg:col-span-2 flex flex-col gap-6 w-full">
              <UploadZone />
              <ModelViewer />
            </div>

            {/* Right column (3/5): Configure → Quote */}
            <div className="lg:col-span-3 flex flex-col gap-6 w-full">
              {uploadMode === 'project' && <MaterialSelect />}
              <DeliveryTiers />
              <PriceSummary />
            </div>
          </div>
        )}

      </div>
      
      {/* Dynamic inline styles for smooth fadeIn animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

