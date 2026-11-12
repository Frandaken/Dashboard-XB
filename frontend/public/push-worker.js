// Service Worker Push Notification Handler for Jadwal Kelas XB
/* eslint-env serviceworker */

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Jadwal Kelas XB 🔔',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Jadwal Kelas XB 🔔';
  const options = {
    body: data.body || 'Pengingat jadwal kelas baru telah tiba.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.ico',
    image: data.image || undefined,
    tag: data.tag || 'kelas-xb-' + Date.now(),
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Buka Jadwal' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', function (event) {
  // Optional telemetry or cleanup when notification is dismissed
});
