const CACHE_NAME = "day-trophies-static-v6";
const APP_SHELL_KEY = "/";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/app-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/assets/achievements/achievements.webp",
  "/assets/achievements/collection.webp",
  "/assets/achievements/journey.webp",
  "/assets/items/creativity.webp",
  "/assets/items/creativity-extended.webp",
  "/assets/items/health.webp",
  "/assets/items/health-extended.webp",
  "/assets/items/home.webp",
  "/assets/items/home-extended.webp",
  "/assets/items/other.webp",
  "/assets/items/other-extended.webp",
  "/assets/items/relationships.webp",
  "/assets/items/relationships-extended.webp",
  "/assets/items/study.webp",
  "/assets/items/study-extended.webp",
  "/assets/items/work.webp",
  "/assets/items/work-extended.webp",
  "/assets/garden/garden-background.webp",
  "/assets/garden/garden-background-v2.webp",
  "/assets/garden/garden-gallery.webp",
  "/assets/garden/plants/simple/sprout.png",
  "/assets/garden/plants/simple/young.png",
  "/assets/garden/plants/simple/mature.png",
  "/assets/garden/plants/simple/bloom.png",
  "/assets/garden/plants/simple/dead/sprout.png",
  "/assets/garden/plants/simple/dead/young.png",
  "/assets/garden/plants/simple/dead/mature.png",
  "/assets/garden/plants/simple/dead/bloom.png",
  "/assets/garden/plants/moonfern/seed.webp",
  "/assets/garden/plants/moonfern/sprout.webp",
  "/assets/garden/plants/moonfern/young.webp",
  "/assets/garden/plants/moonfern/mature.webp",
  "/assets/garden/plants/moonfern/bloom.webp",
  "/assets/garden/plants/moonfern/dead.webp",
  "/assets/garden/plants/starlavender/seed.webp",
  "/assets/garden/plants/starlavender/sprout.webp",
  "/assets/garden/plants/starlavender/young.webp",
  "/assets/garden/plants/starlavender/mature.webp",
  "/assets/garden/plants/starlavender/bloom.webp",
  "/assets/garden/plants/starlavender/dead.webp",
  "/assets/garden/plants/sunbonsai/seed.webp",
  "/assets/garden/plants/sunbonsai/sprout.webp",
  "/assets/garden/plants/sunbonsai/young.webp",
  "/assets/garden/plants/sunbonsai/mature.webp",
  "/assets/garden/plants/sunbonsai/bloom.webp",
  "/assets/garden/plants/sunbonsai/dead.webp",
  "/assets/garden/plants/moonfern/wilted/seed.webp",
  "/assets/garden/plants/moonfern/wilted/sprout.webp",
  "/assets/garden/plants/moonfern/wilted/young.webp",
  "/assets/garden/plants/moonfern/wilted/mature.webp",
  "/assets/garden/plants/moonfern/wilted/bloom.webp",
  "/assets/garden/plants/moonfern/dead/seed.webp",
  "/assets/garden/plants/moonfern/dead/sprout.webp",
  "/assets/garden/plants/moonfern/dead/young.webp",
  "/assets/garden/plants/moonfern/dead/mature.webp",
  "/assets/garden/plants/moonfern/dead/bloom.webp",
  "/assets/garden/plants/starlavender/wilted/seed.webp",
  "/assets/garden/plants/starlavender/wilted/sprout.webp",
  "/assets/garden/plants/starlavender/wilted/young.webp",
  "/assets/garden/plants/starlavender/wilted/mature.webp",
  "/assets/garden/plants/starlavender/wilted/bloom.webp",
  "/assets/garden/plants/starlavender/dead/seed.webp",
  "/assets/garden/plants/starlavender/dead/sprout.webp",
  "/assets/garden/plants/starlavender/dead/young.webp",
  "/assets/garden/plants/starlavender/dead/mature.webp",
  "/assets/garden/plants/starlavender/dead/bloom.webp",
  "/assets/garden/plants/sunbonsai/wilted/seed.webp",
  "/assets/garden/plants/sunbonsai/wilted/sprout.webp",
  "/assets/garden/plants/sunbonsai/wilted/young.webp",
  "/assets/garden/plants/sunbonsai/wilted/mature.webp",
  "/assets/garden/plants/sunbonsai/wilted/bloom.webp",
  "/assets/garden/plants/sunbonsai/dead/seed.webp",
  "/assets/garden/plants/sunbonsai/dead/sprout.webp",
  "/assets/garden/plants/sunbonsai/dead/young.webp",
  "/assets/garden/plants/sunbonsai/dead/mature.webp",
  "/assets/garden/plants/sunbonsai/dead/bloom.webp",
];

async function cacheShellDependencies(cache) {
  const response = await fetch(APP_SHELL_KEY);
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(APP_SHELL_KEY, response);
  const paths = new Set();
  for (const match of html.matchAll(/(?:src|href)=["'](\/[^"'#]+)["']/g)) {
    const path = match[1];
    if (!path.startsWith("/api/")) paths.add(path);
  }
  await Promise.allSettled(
    [...paths].map((path) => cache.add(path)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(CORE_ASSETS);
        await cacheShellDependencies(cache);
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("day-trophies-static-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => cacheShellDependencies(cache))
      .catch(() => undefined),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  // Open the last working shell immediately. Refresh it in the background so
  // a blocked or slow host never delays an installed application.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(APP_SHELL_KEY).then((cached) => {
        const refresh = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_KEY, copy));
            }
            return response;
          });
        if (cached) {
          event.waitUntil(refresh.catch(() => undefined));
          return cached;
        }
        return refresh.catch(() =>
          new Response("Приложение ещё не было подготовлено для офлайн-работы.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
        );
      }),
    );
    return;
  }

  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/app-icon.svg" ||
    ["script", "style", "font", "image"].includes(request.destination);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (!response.ok || response.type !== "basic") return;
              return caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, response));
            })
            .catch(() => undefined),
        );
        return cached;
      }
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }),
  );
});
