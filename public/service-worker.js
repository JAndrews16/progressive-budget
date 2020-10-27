const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const staticFilesToPreCache = [
  "/",
  "/index.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.webmanifest",
  "/styles.css",
  "/index.html"
];

// install
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(staticFilesToPreCache);
    })
  );
  evt.waitUntil(
    caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
  );
  self.skipWaiting();
});

// activate
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(evt) {
  if (evt.request.url.includes("/api/")) {
      evt.respondWith(
          caches.open(DATA_CACHE_NAME).then(cache => {
              return fetch(evt.request)
              .then(response => {
                  if (response.status === 200) {
                      cache.put(evt.request.url, response.clone());
                  }

                  return response;
              })
              .catch(error => {
                  return cache.match(evt.request.url);
              });
          }).catch(error => console.log(error))
      )
      return;
  }

  evt.respondWith(
      caches.match(evt.request.url)
      .then(response => {
          return response || fetch(evt.request);
      })
  )
});