'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useSyncExternalStore } from 'react';
import { Backpack, Luggage, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';

/**
 * Two places and one action.
 *
 * The tabs were "Trips" and "Items", and the action was a suitcase with a
 * small plus badge, which read as a third tab rather than "new trip". The
 * second tab is now "Gear" (what he travels with; clothes come from the
 * Wardrobe), and the action is an unmistakable blue plus, the only solid blue
 * on the bar.
 */
const NAV_ITEMS = [
  { href: '/',      label: 'Trips', Icon: Luggage },
  { href: '/items', label: 'Gear',  Icon: Backpack },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const glassRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(glassRef, 'go-nav-glass');

  const currentPath = mounted ? pathname : '';
  const newTripActive = currentPath === '/trips/new';

  return (
    <nav
      aria-label="Main navigation"
      className="fixed z-50"
      style={{
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'max-content',
        maxWidth: 'calc(100vw - 12px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div ref={glassRef} className="nav-glass flex h-[60px] items-center gap-1 rounded-full px-1.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = href === '/'
              ? currentPath === '/' || (currentPath.startsWith('/trips') && currentPath !== '/trips/new')
              : currentPath.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-12 min-w-[48px] items-center justify-center rounded-full px-3.5',
                  'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  active ? 'bg-white/[0.12] text-fog-100' : 'text-fog-400 hover:text-fog-100',
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.1 : 1.8} aria-hidden className="flex-shrink-0" />
                <span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-semibold leading-none"
                  style={{
                    maxWidth: active ? '64px' : '0px',
                    marginLeft: active ? '7px' : '0px',
                    opacity: active ? 1 : 0,
                    transition: 'max-width 220ms cubic-bezier(0.22,1,0.36,1) 45ms, margin-left 220ms cubic-bezier(0.22,1,0.36,1) 45ms, opacity 150ms ease 60ms',
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/trips/new"
          aria-label="New trip"
          aria-current={newTripActive ? 'page' : undefined}
          className={cn(
            'press flex h-[60px] w-[60px] items-center justify-center rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0',
            newTripActive ? 'bg-ink-500 text-fog-300' : 'bg-blue-400 text-ink-0 hover:bg-blue-300',
          )}
          style={{ boxShadow: newTripActive ? undefined : '0 8px 26px rgb(48 96 184 / 0.45)' }}
        >
          <Plus size={26} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
