import type { Metadata } from 'next';
import { siteContent } from '@/config/siteContent';

export const metadata: Metadata = {
  title: `${siteContent.navbar.logoText} — ${siteContent.uploadFlow.zoneTitle}`,
  description: siteContent.hero.description,
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
