// service-worker.js
self.addEventListener("install", event => {
  self.skipWaiting(); // บังคับให้ใช้เวอร์ชันใหม่ทันที
  console.log("[SW] Installed");
});

self.addEventListener("activate", event => {
  clients.claim(); // ให้ควบคุมทุก tab ทันที
  console.log("[SW] Activated");
});

self.addEventListener("fetch", event => {
  // ไม่ cache อะไรไว้เลย เพื่อลดปัญหาเวอร์ชัน
});
