'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Luggage, Package } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/',      label: 'Trips',  Icon: Luggage },
  { href: '/items', label: 'Items',  Icon: Package },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex bg-ink-50/95 backdrop-blur-md border-t border-ink-200 pb-safe"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              active ? 'text-teal-400' : 'text-fog-600 hover:text-fog-300',
            )}
          >
            <Icon size={22} aria-hidden="true" strokeWidth={active ? 2.5 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
