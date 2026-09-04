// ============================================================
// NOA DIGIT TRADE - SERVICE WORKER
// Permet l'installation de l'application (PWA) et met en
// cache les fichiers statiques pour un chargement plus rapide.
// ============================================================

const CACHE_NAME = 'noa-digit-trade-v1';

const STATIC_ASSETS = [
  './index.html',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];


self.addEventListener('install', (event) => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );

  self.skipWaiting();
});


self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );

  self.clients.claim();
});


// Stratégie : réseau d'abord, cache en secours (utile hors-ligne).
// Les appels vers Supabase (API) ne sont jamais mis en cache.

self.addEventListener('fetch', (event) => {

  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.origin.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {

        const clone = response.clone();

        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clone))
          .catch(() => {});

        return response;
      })
      .catch(() =>
        caches.match(event.request)
      )
  );
});
