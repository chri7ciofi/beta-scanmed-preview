const CACHE_NAME = 'scanmed-v1';
const PRECACHE_URLS = ['./', './manifest.json', './icons/icon.svg', './icons/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-only: Supabase live data
  if (url.hostname.includes('supabase.co')) return;

  // Cache-first with background update: Google Fonts
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Cache-first: CDN polyfills (barcode-detector, vis-network)
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached ||
        fetch(e.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Cache-first: same-origin (app shell)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
