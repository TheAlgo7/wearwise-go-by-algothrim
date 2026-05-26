'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Luggage, Package } from 'lucide-react';
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
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div className="mx-auto max-w-xl px-5 pointer-events-auto">
        <div className="bg-ink-200 border border-white/[0.07] rounded-full px-2 py-2 flex items-center justify-between shadow-card">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex-1 h-14 rounded-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors active:scale-[0.97]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  active ? 'text-blue-50' : 'text-white/40 hover:text-white/70',
                )}
              >
                {active && <span aria-hidden className="absolute inset-0 rounded-full bg-blue-400/30 animate-scale-in" />}
                <Icon size={20} className="relative" aria-hidden="true" strokeWidth={active ? 2.4 : 1.8} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
