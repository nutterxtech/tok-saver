const CACHE = "toksaver-v2";

self.addEventListener("install", (e) => {
  // Skip waiting immediately so the SW activates as fast as possible
  self.skipWaiting();
  // Pre-cache the shell page — use individual try/catch so a 404 doesn't abort install
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const urls = ["/", "/login", "/register"];
      await Promise.allSettled(urls.map((url) => cache.add(url).catch(() => {})));
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Never intercept API calls
  if (url.pathname.startsWith("/api/")) return;
  // Network-first: always try the network, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful HTML/JS/CSS responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
