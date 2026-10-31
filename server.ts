import express from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { RoutineNotificationManager, buildTomorrowNotification } from './serverNotificationService';

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

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(dataDir, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded receipts and files statically
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Explicit fallback handler for upload paths so missing files never fall through to SPA HTML
app.get(['/api/uploads/:filename', '/uploads/:filename'], (req, res) => {
  const filename = path.basename(req.params.filename);
  const candidatePaths = [
    path.join(UPLOADS_DIR, filename),
    path.join(dataDir, 'uploads', filename),
    path.join(process.cwd(), 'data', 'uploads', filename),
    path.join(process.cwd(), 'backend', 'uploads', filename)
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
  }

  return res.status(404).json({
    error: 'File not found',
    filename,
    message: `Bukti kas "${filename}" tidak ditemukan di server.`
  });
});

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
  icebreaking: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1073417057&single=true&output=csv",
  penunggakan: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=2142387216&single=true&output=csv",
  pengeluaran: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=47581979&single=true&output=csv",
  pendapatan_lain: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=775852732&single=true&output=csv",
  rekap: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=172836771&single=true&output=csv"
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

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1' || !!req.query.t;
  const cached = cache.get(`cal:${feed}`);
  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
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

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1' || !!req.query.t;
  const cached = cache.get(`sheet:${key}`);
  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    const upstreamUrl = forceFresh ? `${url}&_cb=${Date.now()}` : url;
    const headers = forceFresh
      ? { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      : {};
    const csvText = await fetchWithRetry(upstreamUrl, headers);
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
// Bukti Nota Mapping & Upload Endpoints (Persisted in data/ volume)
// ==========================================
const BUKTI_MAPPING_FILE = path.join(dataDir, 'bukti-mapping.json');

function getBuktiMapping(): Record<string, string> {
  if (fs.existsSync(BUKTI_MAPPING_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BUKTI_MAPPING_FILE, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse bukti-mapping.json:', e);
    }
  }
  return {};
}

function saveBuktiMapping(mapping: Record<string, string>) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(BUKTI_MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save bukti-mapping.json:', e);
  }
}

app.get('/api/kas/bukti-mapping', (req, res) => {
  res.json({ ok: true, mapping: getBuktiMapping() });
});

app.post('/api/kas/upload-bukti', (req, res) => {
  try {
    const { pengeluaranId, filename, base64Data, contentType, linkUrl } = req.body || {};
    if (!pengeluaranId) {
      return res.status(400).json({ error: 'pengeluaranId is required' });
    }

    let resultUrl = '';
    let savedFilename = '';

    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const ext = path.extname(filename || '').toLowerCase() || (contentType === 'application/pdf' ? '.pdf' : '.jpg');
      const baseClean = path.basename(filename || 'nota', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      savedFilename = `nota_${Date.now()}_${baseClean}${ext}`;

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filePath = path.join(UPLOADS_DIR, savedFilename);
      fs.writeFileSync(filePath, buffer);
      resultUrl = `/api/uploads/${savedFilename}`;
    } else if (linkUrl) {
      resultUrl = linkUrl.trim();
    } else {
      return res.status(400).json({ error: 'Either base64Data or linkUrl is required' });
    }

    const mapping = getBuktiMapping();
    mapping[pengeluaranId] = resultUrl;
    saveBuktiMapping(mapping);

    return res.json({
      ok: true,
      url: resultUrl,
      filename: savedFilename || filename || 'bukti',
      mapping
    });
  } catch (err: any) {
    console.error('Error saving receipt proof:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Web Push Notifications & VAPID Integration
// ==========================================

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
    jadwalHarian?: boolean;
    pelajaran?: boolean;
    sumatif?: boolean;
    tugasPr?: boolean;
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

// 3. Initialize Routine Notification Scheduler (Target: 19:00 WIB daily)
const routineManager = new RoutineNotificationManager(
  dataDir,
  fetchWithRetry,
  CALENDAR_FEEDS,
  SHEET_FEEDS
);
routineManager.startScheduler();

// Push API: Get Public VAPID Key
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Push API: Status & Count
app.get('/api/push/status', (req, res) => {
  const subs = loadSubscriptions();
  const schedulerStatus = routineManager.getStatus();
  res.json({
    enabled: Boolean(vapidKeys.publicKey),
    subscriberCount: subs.length,
    vapidPublicKey: vapidKeys.publicKey,
    scheduler: schedulerStatus
  });
});

// Push API: Preview tomorrow's 19:00 WIB notification (including sumatif and PR details)
app.get('/api/push/routine-preview', async (req, res) => {
  try {
    const targetDate = req.query.date as string | undefined;
    const data = await buildTomorrowNotification(targetDate, fetchWithRetry, CALENDAR_FEEDS, SHEET_FEEDS);
    return res.json({ ok: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Send or test tomorrow's 19:00 WIB routine notification
app.post('/api/push/send-routine', async (req, res) => {
  try {
    const { targetDate, force } = req.body || {};
    const result = await routineManager.sendRoutineNotification(targetDate, force ?? true);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
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
    const defaultPrefs = {
      jadwalHarian: true,
      sumatif: true,
      tugasPr: true,
      piketMbg: true,
      iceBreaking: true
    };
    const record: StoredSubscription = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.keys,
      preferences: { ...defaultPrefs, ...(preferences || {}) },
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
      if ((topic === 'pelajaran' || topic === 'jadwalHarian') && sub.preferences && (sub.preferences.jadwalHarian === false || sub.preferences.pelajaran === false)) continue;
      if (topic === 'sumatif' && sub.preferences && sub.preferences.sumatif === false) continue;
      if (topic === 'tugasPr' && sub.preferences && sub.preferences.tugasPr === false) continue;
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

const DEFAULT_ORIGIN = 'https://ais-pre-y4tabmyurktjc6be5oxpm7-28906603340.asia-southeast1.run.app';

function getRequestBaseUrl(req: express.Request): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string'
    ? forwardedProto.split(',')[0].trim()
    : (req.protocol === 'http' || req.protocol === 'https' ? req.protocol : 'https');
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = typeof forwardedHost === 'string'
    ? forwardedHost.split(',')[0].trim()
    : req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}`;
  }
  return DEFAULT_ORIGIN;
}

function injectAbsoluteMeta(html: string, req: express.Request): string {
  const baseUrl = getRequestBaseUrl(req);
  return html
    .replaceAll(DEFAULT_ORIGIN, baseUrl)
    .replaceAll('content="/og-image.png"', `content="${baseUrl}/og-image.png"`)
    .replaceAll('content="/"', `content="${baseUrl}/"`)
    .replaceAll('href="/og-image.png"', `href="${baseUrl}/og-image.png"`);
}

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

    // Custom HTML handler to inject dynamic OpenGraph absolute URLs for social bots (WhatsApp, FB, etc.)
    app.use(async (req, res, next) => {
      const url = req.originalUrl || req.url;
      const cleanPath = url.split('?')[0];
      if (req.method !== 'GET' || cleanPath.startsWith('/api') || cleanPath.startsWith('/@') || path.extname(cleanPath)) {
        return next();
      }

      const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot/i.test(req.headers['user-agent'] || '');
      const isHtml = req.headers.accept?.includes('text/html') || !path.extname(cleanPath) || isBot;

      if (!isHtml) return next();

      try {
        const indexPath = path.resolve('frontend', 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        template = injectAbsoluteMeta(template, req);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(template);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'frontend', 'dist'))
      ? path.join(process.cwd(), 'frontend', 'dist')
      : path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { index: false }));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = injectAbsoluteMeta(template, req);
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(template);
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
