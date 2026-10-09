// Fallback service worker for direct registration and Push Notifications
importScripts('/push-worker.js');

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
