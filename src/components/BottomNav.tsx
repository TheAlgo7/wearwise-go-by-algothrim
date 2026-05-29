'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { Luggage, Package } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/',      label: 'Trips', Icon: Luggage },
  { href: '/items', label: 'Items', Icon: Package },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

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
        <div
          className="flex h-[58px] items-center gap-1 rounded-full border border-white/[0.07] bg-ink-200/90 px-2"
          style={{
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
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
                  'relative flex items-center justify-center h-11 rounded-full px-3.5 min-w-[48px]',
                  'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  active ? 'text-blue-50' : 'text-white/40 hover:text-white/70',
                )}
                style={active ? {
                  background: 'rgba(107,159,237,0.22)',
                } : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.1 : 1.7} aria-hidden className="flex-shrink-0" />
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
            'relative flex h-[58px] w-[58px] items-center justify-center rounded-full border transition-all duration-200 active:scale-[0.96]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
            newTripActive
              ? 'border-white/[0.08] bg-ink-200/95 text-blue-100 ring-1 ring-blue-300/25'
              : 'border-white/[0.07] bg-ink-200/90 text-fog-500 hover:text-blue-200',
          )}
          style={{
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <AddTripGlyph active={newTripActive} />
        </Link>
      </div>
    </nav>
  );
}

function AddTripGlyph({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center" aria-hidden="true">
      <span
        className={cn(
          'absolute inset-0 rounded-full transition-colors duration-200',
          active ? 'bg-blue-400/18' : 'bg-ink-300/45',
        )}
      />
      <Luggage className="relative" size={21} strokeWidth={2.35} />
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[12px] font-bold leading-none shadow-[0_0_0_2px_rgba(23,26,34,0.95)]',
          active ? 'bg-blue-400 text-ink-0' : 'bg-ink-500 text-fog-300',
        )}
      >
        +
      </span>
    </span>
  );
}
