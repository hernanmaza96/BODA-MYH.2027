// ============================================================
// Service Worker · María & Hernán
// Estrategia: precache de assets críticos + stale-while-revalidate
// ============================================================

const CACHE = 'myh-v7';
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './manifest.json',
  './img/WhatsApp.png',
  './img/flores-izquierda.webp',
  './img/flores-derecha.webp',
  './img/galeria-01.jpg',
  './img/galeria-02.jpg',
  './img/galeria-03.jpg',
  './img/galeria-04.jpg',
  './img/galeria-05.jpg',
  './img/galeria-06.jpg',
  './img/galeria-07.jpg',
  './img/galeria-08.jpg',
  './img/galeria-09.jpg',
  './img/cerrado.jpeg'
];

// Al instalar: precachear todos los assets críticos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .catch(err => console.warn('[SW] precache parcial:', err))
  );
  self.skipWaiting();
});

// Al activar: borrar cachés viejas y tomar control
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // No interceptar peticiones cross-origin (ej: Google Apps Script)
  if (url.origin !== self.location.origin) return;

  // El audio NO se intercepta (Safari/iOS pide por Range)
  if (e.request.headers.has('range') || e.request.destination === 'audio' || url.pathname.endsWith('.mp3')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request)
          .then(res => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(e.request, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});