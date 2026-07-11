// Service worker for Bnt Baghdad — caches the app shell for offline/install.
const CACHE = 'bnt-v1';
const PRECACHE = [
  './', 'index.html', 'manifest.json', 'favicon.svg',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;          // never cache writes

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((resp) => {
        if (resp.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then((c) => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
