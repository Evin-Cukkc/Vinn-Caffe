// Service worker Vinn Caffe (PWA)
// - Precache: semua file aplikasi + foto menu (bisa dibuka offline)
// - Halaman & aset sendiri: network-first, cadangan dari cache
// - Font Google: stale-while-revalidate
// - Permintaan ke Apps Script TIDAK pernah di-cache (data selalu langsung dari server)
const CACHE = "vinn-caffe-v3";
const FONTS = "vinn-caffe-fonts-v1";
const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "config.js",
  "menu.js",
  "db.js",
  "app.js",
  "manifest.json",
  "assets/logo.svg",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-512.png",
  "assets/apple-touch-icon.png",
  "assets/favicon-32.png",
  "images/americano.jpg",
  "images/beef-burger.jpg",
  "images/cappuccino.jpg",
  "images/caramel-latte.jpg",
  "images/caramel-macchiato.jpg",
  "images/chicken-burger.jpg",
  "images/chicken-katsu.jpg",
  "images/chicken-nugget.jpg",
  "images/chicken-wings.jpg",
  "images/choco-toast.jpg",
  "images/club-sandwich.jpg",
  "images/cold-brew.jpg",
  "images/croissant.jpg",
  "images/espresso.jpg",
  "images/french-fries.jpg",
  "images/hazelnut-latte.jpg",
  "images/latte.jpg",
  "images/mocha.jpg",
  "images/spaghetti-bolognese.jpg",
  "images/vanilla-latte.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE && x !== FONTS).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
