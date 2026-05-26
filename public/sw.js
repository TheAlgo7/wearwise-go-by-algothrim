// WearWise Go — Service Worker
// network-first for pages, stale-while-revalidate for assets, network-only for APIs.
// Bump SW_VERSION to force all clients to pick up changes.

const SW_VERSION = 'v3';
const RUNTIME_CACHE = `wearwise-go-runtime-${SW_VERSION}`;
const PRECACHE     = `wearwise-go-precache-${SW_VERSION}`;

const APP_SHELL = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![RUNTIME_CACHE, PRECACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isNav   = (req) => req.mode === 'navigate';
const isAsset = (url) => /\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?|ttf)$/.test(url.pathname);
const isApi   = (url) => url.pathname.startsWith('/api/');
const isSupa  = (url) => /\.supabase\.(co|in)$/.test(url.hostname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  // Navigations → network-first, fall back to cache, then /offline
  if (isNav(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // Static assets + Supabase storage → stale-while-revalidate
  if (isAsset(url) || isSupa(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networked = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => cached);
        return cached || networked;
      })
    );
    return;
  }

  // APIs → network-only, offline fallback
  if (isApi(url)) {
    event.respondWith(
      fetch(req).catch(
        () => new Response(
          JSON.stringify({ error: 'offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }
});
