/* Service worker mínimo: app abre offline; dados financeiros NUNCA são cacheados. */
const CACHE = "gastos-shell-v1";
const SHELL = ["/Gastos/", "/Gastos/manifest.webmanifest", "/Gastos/favicon-32.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Só mesma origem e GET: chamadas à API (Supabase) passam direto, sem cache.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/Gastos/")));
    return;
  }
  // Assets com hash no nome são imutáveis: cache-first.
  if (url.pathname.startsWith("/Gastos/assets/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); void caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })));
  }
});
