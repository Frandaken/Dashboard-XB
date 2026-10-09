import { useState, useEffect, useCallback } from 'react';

export interface NotificationPreferences {
  piketMbg: boolean;
  iceBreaking: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  piketMbg: true,
  iceBreaking: true
};

const PREFS_STORAGE_KEY = 'kelas_xb_push_preferences';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Check support and current permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setIsSupported(supported);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if (supported) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(Boolean(sub));
        }).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      // If already subscribed, sync preferences to backend
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) {
              fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub, preferences: updated })
              }).catch(() => {});
            }
          });
        });
      }
      return updated;
    });
  }, []);

  // Subscribe to Push Notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Browser Anda tidak mendukung Web Push Notifications.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Request Browser Permission
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== 'granted') {
        setError(
          requestedPermission === 'denied'
            ? 'Izin notifikasi diblokir oleh browser. Harap aktifkan di setelan situs browser Anda.'
            : 'Izin notifikasi tidak diberikan.'
        );
        setLoading(false);
        return false;
      }

      // 2. Ensure Service Worker Registration is active
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/push-worker.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;

      // 3. Fetch VAPID Public Key from server
      let applicationServerKey: Uint8Array | null = null;
      try {
        const vapidRes = await fetch('/api/push/vapid-public-key');
        if (vapidRes.ok) {
          const { publicKey } = await vapidRes.json();
          if (publicKey) {
            applicationServerKey = urlBase64ToUint8Array(publicKey);
          }
        }
      } catch (e) {
        console.warn('Could not fetch server VAPID key:', e);
      }

      // 4. Subscribe to Push Manager
      let sub = await registration.pushManager.getSubscription();
      if (!sub && applicationServerKey) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource
        });
      }

      // 5. Send subscription to server if available
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub, preferences })
        }).catch(() => {});
      }

      setIsSubscribed(true);

      // 6. Show Welcome Notification immediately
      try {
        await registration.showNotification('Notifikasi Kelas XB Aktif! 🔔', {
          body: 'Anda akan menerima pengingat jadwal pelajaran, piket, MBG, & ice breaking tepat waktu.',
          icon: '/pwa-192x192.png',
          badge: '/favicon.ico',
          tag: 'welcome-' + Date.now(),
          data: { url: '/' }
        });
      } catch (err) {
        // Fallback standard notification
        new Notification('Notifikasi Kelas XB Aktif! 🔔', {
          body: 'Anda akan menerima pengingat jadwal pelajaran, piket, MBG, & ice breaking tepat waktu.',
          icon: '/pwa-192x192.png'
        });
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Push notification subscription failed:', err);
      setError(err.message || 'Gagal mengaktifkan push notifikasi.');
      setLoading(false);
      return false;
    }
  }, [isSupported, preferences]);

  // Unsubscribe from Push Notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();

          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint })
          }).catch(() => {});
        }
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Failed to unsubscribe push notifications:', err);
      setError(err.message || 'Gagal menonaktifkan notifikasi.');
      setLoading(false);
      return false;
    }
  }, []);

  // Send Immediate Test Notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Try sending via backend Web Push
      let sentViaServer = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();

        const res = await fetch('/api/push/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub || undefined,
            payload: {
              title: 'Uji Coba Notifikasi Kelas XB 🔔',
              body: 'Push notifikasi berhasil! Sistem pengingat jadwal kelas berfungsi dengan sempurna.',
              icon: '/pwa-192x192.png',
              url: '/'
            }
          })
        });

        if (res.ok) {
          sentViaServer = true;
        }
      } catch (e) {
        // Continue to client-side fallback
      }

      // 2. Client-side fallback if server push failed or offline
      if (!sentViaServer) {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Uji Coba Notifikasi Kelas XB 🔔', {
            body: 'Push notifikasi berhasil! Sistem pengingat jadwal kelas berfungsi dengan sempurna.',
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            tag: 'test-' + Date.now(),
            data: { url: '/' }
          });
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Uji Coba Notifikasi Kelas XB 🔔', {
            body: 'Push notifikasi berhasil! Sistem pengingat jadwal kelas berfungsi dengan sempurna.',
            icon: '/pwa-192x192.png'
          });
        }
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Failed to trigger test notification:', err);
      setError(err.message || 'Gagal mengirim notifikasi uji coba.');
      setLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    sendTestNotification,
    updatePreferences
  };
}
