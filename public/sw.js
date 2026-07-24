/* Bhakti Challenge service worker — offline shell + static caching */
const CACHE_VERSION = "bhakti-v1";
const PRECACHE = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Strategy:
 * - Navigations: network-first, fall back to cache (offline shell)
 * - Static assets (same-origin): cache-first
 * - API / auth: network-only (never cache credentials)
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  // HTML navigations — network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback =
            (await caches.match("/dashboard")) ||
            (await caches.match("/login")) ||
            (await caches.match("/"));
          return (
            fallback ||
            new Response("You are offline. Reconnect to continue your sadhana.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        })
    );
    return;
  }

  // Static assets — cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?|mp3|mp4|ico)$/i
    )
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {
    title: "Bhakti Challenge",
    body: "Hare Krishna PR, please complete your challenge",
    icon: "/icons/icon-192.png",
    url: "/challenges",
  };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data.text();
  }
  const icon = data.icon || "/icons/icon-192.png";
  event.waitUntil(
    self.registration.showNotification(data.title || "Bhakti Challenge", {
      body:
        data.body ||
        "Hare Krishna PR, please complete your challenge",
      icon,
      badge: icon,
      image: data.image || undefined,
      data: { url: data.url || "/challenges" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      })
  );
});
