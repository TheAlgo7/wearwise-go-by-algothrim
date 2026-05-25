'use client';

import { ReactNode } from 'react';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

export default function Template({ children }: { children: ReactNode }) {
  useScrollRestoration();
  return <>{children}</>;
}
