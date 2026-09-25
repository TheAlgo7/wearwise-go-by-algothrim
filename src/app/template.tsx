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
      // `backwards`, not `both`: a filled transform makes this div the
      // containing block for every `position: fixed` child, which pinned
      // sheets and bars to the document instead of the viewport (the same
      // trap the Wardrobe hit with its add button).
      style={{ animation: 'page-enter 320ms cubic-bezier(0.22, 1, 0.36, 1) backwards' }}
    >
      {children}
    </div>
  );
}
