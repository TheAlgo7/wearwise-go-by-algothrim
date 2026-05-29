'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useScrollRestoration();

  return (
    <div
      key={pathname}
      className="min-h-dvh"
      style={{ animation: 'page-enter 320ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
    >
      {children}
    </div>
  );
}
