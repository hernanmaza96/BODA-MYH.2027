// ============================================================
// Service Worker · María & Hernán
// Estrategia: network-first. Siempre trae lo más nuevo,
// y solo usa caché como fallback si no hay internet.
// ============================================================

const CACHE = 'myh-v3'; // ← versión nueva para forzar limpieza

// Al instalar: activa inmediatamente sin esperar
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Al activar: borra TODAS las cachés viejas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: primero red, después caché
self.addEventListener('fetch', (e) => {
  // Solo manejamos GET
  if (e.request.method !== 'GET') return;

  // Ignoramos las peticiones a Google Maps y a terceros
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Guardamos una copia en caché para uso offline
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});