const CACHE = "Daily_Turtle-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.json",
  "./assets/mascot-192.png",
  "./assets/mascot-768.png",
  "./assets/mascot.png",
  "./assets/feather-32.png",
  "./assets/frog4-64.png",
  "./assets/turtle-128.png",
  "./assets/fonts/victor-pixel.ttf",
  "./assets/fonts/Kalam-Regular.ttf"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
