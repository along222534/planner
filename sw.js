self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installed");
});

self.addEventListener("fetch", () => {
  // future caching here
});
