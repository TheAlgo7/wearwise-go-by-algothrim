'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const positions: Record<string, number> = {};

export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    const saved = positions[pathname];
    if (saved !== undefined) {
      window.scrollTo({ top: saved, behavior: 'instant' });
    }

    return () => {
      positions[pathname] = window.scrollY;
    };
  }, [pathname]);
}
