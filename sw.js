// Offline-cache service worker for Pocket Permaculture.
//
// NETWORK-FIRST strategy: always try to fetch the latest version from the
// network first, and only fall back to the cached copy when there's no
// connection. This matters a lot right now because the game is still being
// actively iterated on — a cache-first strategy (the previous version of
// this file) would silently keep serving old content forever after the
// first install, since browsers only re-check a service worker's own file
// for byte-for-byte changes, not the assets it caches. Bumping CACHE_NAME
// below forces any previously-cached (stale) content to be thrown out once.
//
// IMPORTANT: bump CACHE_NAME (e.g. v2 -> v3) any time you want to guarantee
// a clean cache reset for people who already have the app installed. It's
// not strictly required with network-first (fresh content loads regardless
// once online), but it's a good habit while the game is changing often.
const CACHE_NAME = 'pocket-permaculture-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
