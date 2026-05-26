import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata: Metadata = {
  metadataBase: new URL('https://wearwise-go-by-algothrim.vercel.app'),
  title: {
    default: 'WearWise Go',
    template: '%s · WearWise Go',
  },
  description: 'Pack like you already remembered everything.',
  applicationName: 'WearWise Go',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WearWise Go',
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',      sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png',      sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico',       type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'WearWise Go',
    description: 'Pack like you already remembered everything.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WearWise Go',
    description: 'Pack like you already remembered everything.',
    images: ['/og-image.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
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
