'use client';

import { ReactNode } from 'react';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

export default function Template({ children }: { children: ReactNode }) {
  useScrollRestoration();
  return (
    <div style={{ animation: 'page-enter var(--duration-base) var(--ease-spring) both' }}>
      {children}
    </div>
  );
}
