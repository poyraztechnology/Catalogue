// Poyraz: opens without internet; when online it always checks GitHub for a newer version first.
var CACHE = "poyraz-v2";
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(["./", "poyraz-lock.png", "manifest.webmanifest", "icon-192.png", "icon-512.png"].map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf(new URL("./", self.registration.scope).pathname) !== 0) return;
  if (/sync\.enc$/.test(url.pathname)) return;
  var page = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  var key = page ? new URL("./", self.registration.scope).href : url.origin + url.pathname;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    var net = fetch(key, { cache: "no-cache" }).then(function (r) { if (r && r.ok) cache.put(key, r.clone()); return r; });
    e.waitUntil(net.catch(function () {}));
    if (!page) return cache.match(key).then(function (c) { return c || net; });
    var slow = new Promise(function (res) { setTimeout(function () { res("slow"); }, 4000); });
    return Promise.race([net.catch(function () { return null; }), slow]).then(function (r) {
      if (r && r !== "slow" && r.ok) return r;
      return cache.match(key).then(function (c) { return c || (r && r !== "slow" ? r : net); });
    });
  }));
});
