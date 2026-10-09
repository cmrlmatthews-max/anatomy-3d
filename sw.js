/* Anatomy 3D service worker (full body).
   Bump VERSION whenever the app shell changes. Models are cache-first and keyed by their full URL
   (including any ?v=… in data/parts.json files[].url), so change that query (or bump VERSION) when a GLB changes. */
const VERSION = 'v4';
const PREFIX = 'anatomy3d-';
const CACHE = PREFIX + VERSION;

const THREE_BASE = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&display=swap';
const SHELL = [
  './', './index.html', './manifest.json',
  './data/parts.json', './data/cards.json',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
];
const CDN = [
  THREE_BASE + 'build/three.module.js',
  THREE_BASE + 'examples/jsm/loaders/GLTFLoader.js',
  THREE_BASE + 'examples/jsm/loaders/DRACOLoader.js',
  THREE_BASE + 'examples/jsm/controls/OrbitControls.js',
  THREE_BASE + 'examples/jsm/utils/BufferGeometryUtils.js',
  THREE_BASE + 'examples/jsm/environments/RoomEnvironment.js',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_decoder.js',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_decoder.wasm',
  THREE_BASE + 'examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js',
];
const isFontHost = (h) => h === 'fonts.googleapis.com' || h === 'fonts.gstatic.com';
const cacheable = (res) => res && res.ok && res.type !== 'opaque' && res.type !== 'error';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Add individually so one missing file never blocks installation.
    await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})));
    await Promise.all(CDN.map((u) => cache.add(new Request(u, { mode: 'cors' })).catch(() => {})));
    // Every model listed in parts.json (read from the cache we just filled, falling back to the network).
    try {
      const res = (await cache.match('./data/parts.json')) || (await fetch('./data/parts.json'));
      const data = await res.clone().json();
      await Promise.all((data.files || []).map((f) => cache.add(f.url).catch(() => {})));
    } catch (e) { /* models are cached on first use instead */ }
    // Fonts: stylesheet + the latin subset files it references.
    try {
      const cssRes = await fetch(new Request(FONT_CSS, { mode: 'cors' }));
      if (cacheable(cssRes)) {
        await cache.put(new Request(FONT_CSS, { mode: 'cors' }), cssRes.clone());
        const css = await cssRes.text();
        const urls = [];
        css.replace(/\/\*\s*latin\s*\*\/\s*@font-face\s*\{[^}]*?url\((https:[^)]+)\)/g, (_, u) => { urls.push(u); return ''; });
        await Promise.all(urls.map((u) => cache.add(new Request(u, { mode: 'cors' })).catch(() => {})));
      }
    } catch (e) { /* fonts fall back to system faces */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => (k.startsWith(PREFIX) || k.startsWith('arm-anatomy-')) && k !== CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request, ignoreSearch) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: !!ignoreSearch });
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) cache.put(request, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((res) => { if (cacheable(res)) cache.put(request, res.clone()).catch(() => {}); return res; })
    .catch(() => null);
  if (hit) { event.waitUntil(network); return hit; }
  const res = await network;
  return res || new Response('Offline', { status: 503, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Third-party: three.js modules, Draco decoder, Google Fonts css + files. Cache-first.
  if (url.hostname === 'cdn.jsdelivr.net' || isFontHost(url.hostname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  if (path.endsWith('.glb')) { event.respondWith(cacheFirst(req, false)); return; }          // heavy models
  const isPage = req.mode === 'navigate' || path.endsWith('/') || path.endsWith('/index.html');
  if (isPage) {
    const shellReq = new Request(new URL('./index.html', self.registration.scope).href);
    event.respondWith(staleWhileRevalidate(shellReq, event));
    return;
  }
  if (/\/data\/[^/]+\.json$/.test(path)) { event.respondWith(staleWhileRevalidate(req, event)); return; }
  event.respondWith(cacheFirst(req, true).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' })));
});
