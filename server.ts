import express from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000;

// Enable CORS for API routes so frontend containers or direct API callers on port 3003 work seamlessly
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Upstream Google Calendar feeds (Notice: penugasan calendar link is completely removed as requested)
const CALENDAR_FEEDS: Record<string, string> = {
  pelajaran: "https://calendar.google.com/calendar/ical/a4fd56ccb6ac7cde9478e4d863191dd53cd12c6110fe380d6bf279da0e44dc8e%40group.calendar.google.com/private-f67cd9352a27790460116ba8a612434c/basic.ics",
  birthday: "https://calendar.google.com/calendar/ical/c83e6edc41cc4489ab2a435d067ef46014bfd0fefa8fc964d83ecdc72a5e59d5%40group.calendar.google.com/private-b45f7ec9aad159bf2e0dca6627311f2b/basic.ics"
};

// Upstream Google Sheets published CSV feeds
const SHEET_FEEDS: Record<string, string> = {
  doa: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=0&single=true&output=csv",
  mbg: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=215098819&single=true&output=csv",
  piket: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1149044316&single=true&output=csv",
  icebreaking: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1073417057&single=true&output=csv"
};

// Simple in-memory cache to prevent hitting Google rate limits
const cache = new Map<string, { data: string; contentType: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

async function fetchWithRetry(url: string, headers: Record<string, string> = {}, timeoutMs = 12000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...headers
        }
      });
      if (!res.ok) {
        throw new Error(`Upstream returned HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err: any) {
      if (attempt === 1) throw err;
      await new Promise(r => setTimeout(r, 400));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error('Failed to fetch after retry');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Explicit SEO, Bot & Crawler discovery endpoints
const publicDir = path.join(process.cwd(), 'frontend', 'public');

app.get('/robots.txt', (req, res) => {
  const filePath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(filePath)) {
    res.type('text/plain; charset=utf-8').sendFile(filePath);
  } else {
    res.type('text/plain; charset=utf-8').send('User-agent: *\nAllow: /\n');
  }
});

app.get('/sitemap.xml', (req, res) => {
  const filePath = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(filePath)) {
    res.type('application/xml; charset=utf-8').sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

app.get('/llms.txt', (req, res) => {
  const filePath = path.join(publicDir, 'llms.txt');
  if (fs.existsSync(filePath)) {
    res.type('text/plain; charset=utf-8').sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

app.get('/llms-full.txt', (req, res) => {
  const filePath = path.join(publicDir, 'llms-full.txt');
  if (fs.existsSync(filePath)) {
    res.type('text/plain; charset=utf-8').sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Proxy route for Google Calendar feeds (solves HTTP 401 & browser CORS issues)
app.get('/api/calendar/:feed', async (req, res) => {
  const feed = req.params.feed;
  const url = CALENDAR_FEEDS[feed];
  if (!url) {
    return res.status(404).json({ error: `Unknown calendar feed: ${feed}` });
  }

  const cached = cache.get(`cal:${feed}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    const icsText = await fetchWithRetry(url);
    const contentType = 'text/calendar; charset=utf-8';
    cache.set(`cal:${feed}`, { data: icsText, contentType, timestamp: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    return res.send(icsText);
  } catch (err: any) {
    console.error(`Error fetching calendar feed "${feed}":`, err.message);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.data);
    }
    return res.status(502).json({ error: `Failed to fetch calendar ${feed}: ${err.message}` });
  }
});

// Proxy route for Google Sheets CSV feeds
app.get('/api/sheets/:key', async (req, res) => {
  const key = req.params.key;
  const url = SHEET_FEEDS[key];
  if (!url) {
    return res.status(404).json({ error: `Unknown sheet key: ${key}` });
  }

  const cached = cache.get(`sheet:${key}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    const csvText = await fetchWithRetry(url);
    const contentType = 'text/plain; charset=utf-8';
    cache.set(`sheet:${key}`, { data: csvText, contentType, timestamp: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    return res.send(csvText);
  } catch (err: any) {
    console.error(`Error fetching sheet "${key}":`, err.message);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.data);
    }
    return res.status(502).json({ error: `Failed to fetch sheet ${key}: ${err.message}` });
  }
});

// Force refresh endpoint to bust server cache
app.post('/api/refresh', (req, res) => {
  cache.clear();
  res.json({ ok: true, message: 'Cache cleared' });
});

// Endpoint to persist generated kelompok CSV in exports folder
app.post('/api/kelompok/export', (req, res) => {
  try {
    const { filename, csvContent } = req.body || {};
    if (!filename || !csvContent) {
      return res.status(400).json({ error: 'filename and csvContent are required' });
    }
    const exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'backend', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    const safeFilename = path.basename(filename);
    const filePath = path.join(exportDir, safeFilename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    return res.json({ ok: true, filename: safeFilename, path: filePath });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Web Push Notifications & VAPID Integration
// ==========================================
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

// 1. Initialize VAPID Keys
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

const vapidPath = path.join(dataDir, 'vapid.json');
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  if (fs.existsSync(vapidPath)) {
    try {
      vapidKeys = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
    } catch {
      console.warn('Existing vapid.json invalid, regenerating keypair');
    }
  }
}

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidPath, JSON.stringify(vapidKeys, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write vapid.json:', e);
  }
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:abiprayatujuh@gmail.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (e: any) {
    console.error('Failed to configure web-push VAPID details:', e.message);
  }
}

// 2. Persistent Push Subscriptions Store
interface StoredSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  preferences?: {
    pelajaran?: boolean;
    piketMbg?: boolean;
    iceBreaking?: boolean;
  };
  subscribedAt?: string;
  updatedAt?: string;
}

const subsPath = path.join(dataDir, 'push-subscriptions.json');

function loadSubscriptions(): StoredSubscription[] {
  if (fs.existsSync(subsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

function saveSubscriptions(subs: StoredSubscription[]) {
  try {
    fs.writeFileSync(subsPath, JSON.stringify(subs, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save push subscriptions:', e);
  }
}

// Push API: Get Public VAPID Key
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Push API: Status & Count
app.get('/api/push/status', (req, res) => {
  const subs = loadSubscriptions();
  res.json({
    enabled: Boolean(vapidKeys.publicKey),
    subscriberCount: subs.length,
    vapidPublicKey: vapidKeys.publicKey
  });
});

// Push API: Subscribe client
app.post('/api/push/subscribe', (req, res) => {
  try {
    const { subscription, preferences } = req.body || {};
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Valid subscription object required' });
    }

    const subs = loadSubscriptions();
    const existingIndex = subs.findIndex(s => s.endpoint === subscription.endpoint);
    const record: StoredSubscription = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.keys,
      preferences: preferences || { piketMbg: true, iceBreaking: true },
      subscribedAt: existingIndex >= 0 ? subs[existingIndex].subscribedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      subs[existingIndex] = record;
    } else {
      subs.push(record);
    }

    saveSubscriptions(subs);
    return res.json({ ok: true, message: 'Subscription saved', totalSubscribers: subs.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Unsubscribe client
app.post('/api/push/unsubscribe', (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    let subs = loadSubscriptions();
    subs = subs.filter(s => s.endpoint !== endpoint);
    saveSubscriptions(subs);
    return res.json({ ok: true, message: 'Unsubscribed successfully', totalSubscribers: subs.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Send Immediate Test Push Notification
app.post('/api/push/send-test', async (req, res) => {
  try {
    const { subscription, payload } = req.body || {};
    const subs = loadSubscriptions();
    const targetSubs: StoredSubscription[] = [];

    if (subscription && subscription.endpoint) {
      targetSubs.push(subscription);
    } else if (subs.length > 0) {
      targetSubs.push(subs[subs.length - 1]); // send to latest subscriber
    }

    if (targetSubs.length === 0) {
      return res.status(400).json({
        error: 'No active push subscriptions found. Please enable push notifications in browser first.'
      });
    }

    const notificationPayload = JSON.stringify({
      title: (payload && payload.title) || 'Uji Coba Notifikasi Kelas XB 🔔',
      body: (payload && payload.body) || 'Push Notifikasi aktif! Anda akan menerima pengingat jadwal, piket, MBG, & ice breaking.',
      icon: (payload && payload.icon) || '/pwa-192x192.png',
      badge: (payload && payload.badge) || '/favicon.ico',
      tag: 'test-push-' + Date.now(),
      url: (payload && payload.url) || '/',
      vibrate: [200, 100, 200]
    });

    let successCount = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of targetSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          notificationPayload
        );
        successCount++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error('Failed to send push to endpoint:', err.message);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      const activeSubs = subs.filter(s => !expiredEndpoints.includes(s.endpoint));
      saveSubscriptions(activeSubs);
    }

    return res.json({
      ok: true,
      sent: successCount,
      totalTargets: targetSubs.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Broadcast Notification to all subscribers
app.post('/api/push/broadcast', async (req, res) => {
  try {
    const { title, body, icon, url, tag, topic } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    const subs = loadSubscriptions();
    if (subs.length === 0) {
      return res.json({ ok: true, sent: 0, message: 'No subscribers registered' });
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || '/pwa-192x192.png',
      badge: '/favicon.ico',
      tag: tag || 'broadcast-' + Date.now(),
      url: url || '/',
      vibrate: [200, 100, 200]
    });

    let sent = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subs) {
      // Check topic preference if applicable
      if (topic === 'pelajaran' && sub.preferences && sub.preferences.pelajaran === false) continue;
      if (topic === 'piketMbg' && sub.preferences && sub.preferences.piketMbg === false) continue;
      if (topic === 'iceBreaking' && sub.preferences && sub.preferences.iceBreaking === false) continue;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          notificationPayload
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      saveSubscriptions(subs.filter(s => !expiredEndpoints.includes(s.endpoint)));
    }

    return res.json({ ok: true, sent, total: subs.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  process.env.DISABLE_HMR = 'true';
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.resolve('frontend'),
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'frontend', 'dist'))
      ? path.join(process.cwd(), 'frontend', 'dist')
      : path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Not Found');
        }
      });
    } else {
      app.get('/', (req, res) => {
        res.json({ service: 'backend', status: 'ok', message: 'Backend API is running. Dist not built.' });
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom dashboard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
