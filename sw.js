self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installed");
});

self.addEventListener("fetch", () => {
  // สามารถเพิ่ม cache ในอนาคตได้
});
