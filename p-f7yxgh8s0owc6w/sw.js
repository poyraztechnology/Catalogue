// Poyraz: opens without internet; when online it always checks GitHub for a newer version first.
var CACHE = "poyraz-v1";
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(["./", "poyraz-lock.png"]); }).catch(function () {}));
});
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf(new URL("./", self.registration.scope).pathname) !== 0) return;
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
