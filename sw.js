/* Anatomy 3D service worker.
   Bump VERSION whenever the app shell changes. */
const VERSION = 'v3';
const CACHE = 'arm-anatomy-' + VERSION;

const THREE_BASE = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './anatomy.json',
  './arm.glb',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];
// Third-party modules the app imports, precached so the app also works offline right after install.
const CDN = [
  THREE_BASE + 'build/three.module.js',
  THREE_BASE + 'examples/jsm/loaders/GLTFLoader.js',
  THREE_BASE + 'examples/jsm/loaders/DRACOLoader.js',
  THREE_BASE + 'examples/jsm/controls/OrbitControls.js',
  THREE_BASE + 'examples/jsm/utils/BufferGeometryUtils.js',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_decoder.js',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_decoder.wasm',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Add individually so one missing file (e.g. an icon) never blocks installation.
      await Promise.all(
        SHELL.map((u) => cache.add(u).catch(() => {}))
      );
      await Promise.all(
        CDN.map((u) => cache.add(new Request(u, { mode: 'cors' })).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('arm-anatomy-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  if (hit) {
    event.waitUntil(network);
    return hit;
  }
  const res = await network;
  return res || new Response('Offline', { status: 503, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Third-party (three.js modules + Draco decoder): cache-first.
  if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  // Heavy static model: cache-first.
  if (path.endsWith('/arm.glb')) {
    event.respondWith(cacheFirst(req));
    return;
  }
  // App shell + data: stale-while-revalidate.
  const isPage = req.mode === 'navigate' || path.endsWith('/') || path.endsWith('/index.html');
  if (isPage) {
    const shellReq = new Request(new URL('./index.html', self.registration.scope).href);
    event.respondWith(staleWhileRevalidate(shellReq, event));
    return;
  }
  if (path.endsWith('/anatomy.json')) {
    event.respondWith(staleWhileRevalidate(req, event));
    return;
  }
  // Icons, manifest and anything else same-origin: cache-first with network fallback.
  event.respondWith(
    cacheFirst(req).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }))
  );
});
