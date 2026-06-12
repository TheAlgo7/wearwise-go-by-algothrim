// WearWise Go — Service Worker
// network-first for pages, stale-while-revalidate for assets, network-only for APIs.
// Bump SW_VERSION to force all clients to pick up changes.

const SW_VERSION = 'v4';
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
// Storage only (item images). The REST API (/rest/v1/) must NEVER be served
// stale-while-revalidate — it made every read-after-write return the previous
// response (new items and packed states lagged one view behind).
const isSupaStorage = (url) => /\.supabase\.(co|in)$/.test(url.hostname) && url.pathname.startsWith('/storage/');
const isSupaRest    = (url) => /\.supabase\.(co|in)$/.test(url.hostname) && !url.pathname.startsWith('/storage/');

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

  // Static assets + Supabase storage (images) → stale-while-revalidate
  if (isAsset(url) || isSupaStorage(url)) {
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

  // Supabase REST → network-first. Fresh data always wins; the cached copy is
  // only an offline fallback so lists still render without a connection.
  if (isSupaRest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ message: 'offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              })
          )
        )
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
