'use client';

import { useEffect, useState } from 'react';

/**
 * Today's date as the phone sees it, e.g. "Saturday, 26 September".
 *
 * Never format the date during render. The server renders in UTC (and a static
 * page is rendered once, at build time), and `suppressHydrationWarning` keeps the
 * server's text, so React never replaces it: the home screen showed the day of
 * the last deploy until the next one. This returns '' on the server and fills in
 * after mount, and again whenever the app comes back to the foreground, so an
 * installed app left open overnight shows the new day.
 */
export function useToday(options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) {
  const [today, setToday] = useState('');
  const key = JSON.stringify(options);

  useEffect(() => {
    const opts = JSON.parse(key) as Intl.DateTimeFormatOptions;
    const update = () => setToday(new Date().toLocaleDateString('en-IN', opts));
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    update();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [key]);

  return today;
}
