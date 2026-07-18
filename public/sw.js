// Booktrovert Service Worker — stale-while-revalidate strategy
// Checks for a new version on every app open and applies silently on next launch.

const CACHE_NAME = 'booktrovert-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Take control immediately rather than waiting for old SW to expire
  self.skipWaiting();
});

// Activate: remove old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for navigation and assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and cross-origin requests (API calls, Supabase, etc.)
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // For navigation requests: network-first so users always get fresh HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // For static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return cached || networkFetch;
      })
    )
  );
});
