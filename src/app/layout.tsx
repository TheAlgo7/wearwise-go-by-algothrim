import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: {
    default: 'WearWise Go',
    template: '%s · WearWise Go',
  },
  description: 'Pack like you already remembered everything.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WearWise Go',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-ink-0 text-fog-100 font-sans antialiased overflow-x-hidden">
        <ServiceWorkerRegister />
        <main className="mx-auto max-w-xl min-h-dvh pb-nav">{children}</main>
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
