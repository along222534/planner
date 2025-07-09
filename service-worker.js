const CACHE_NAME = "intern-cache-v1";
const urlsToCache = [
  "index.html",
  "form.html",
  "script.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600&display=swap"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});