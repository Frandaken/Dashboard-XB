// Service worker for Push Notifications and background sync
importScripts('/push-worker.js');

self.addEventListener('install', function (event) {
  // Graceful install without abrupt client claiming
});

self.addEventListener('activate', function (event) {
  // Graceful activation without interrupting running clients
});
