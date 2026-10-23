import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAC ISPSO ScholarLink | St. Anthony’s College San Jose, Antique',
  description:
    'Institutional Scholarship Program and Services Office Portal for St. Anthony’s College. Centralized updates, payout releasing schedules, and online scholarship applications.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SAC ScholarLink',
  },
};

export const viewport: Viewport = {
  themeColor: '#1b365d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
