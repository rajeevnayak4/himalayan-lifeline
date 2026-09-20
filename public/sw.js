// Himalayan Lifeline Offline Service Worker
const CACHE_NAME = "himalayan-lifeline-v1";
const OFFLINE_URLS = [
  "/",
  "/sos",
  "/alerts",
  "/dashboard",
  "/demo",
  "/manifest.json",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("Service worker precache failed for some routes:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET or API realtime SSE requests
  if (event.request.method !== "GET" || event.request.url.includes("/api/realtime")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and update cache if ok
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Network failed — retrieve from cache
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // Fallback to offline root
        return caches.match("/sos") || caches.match("/");
      })
  );
});

// Listen for background sync messages
self.addEventListener("sync", (event) => {
  if (event.tag === "flush-sos-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_OFFLINE_SOS" });
        });
      })
    );
  }
});
