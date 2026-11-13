import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import webpush from "web-push";
import { RoutineNotificationManager, buildTomorrowNotification } from "./serverNotificationService.js";

const app = express();
const PORT = process.env.PORT || 3003;

app.disable('x-powered-by');

// Security & CORS headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
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

// Explicit fallback handler for upload paths so missing files return JSON 404
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

const normalizeEnvUrl = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

// Upstream Google Calendar feeds (diambil murni dari environment variable, tanpa hardcode)
const CALENDAR_FEEDS = {
  pelajaran: normalizeEnvUrl(process.env.CALENDAR_FEED_PELAJARAN),
  birthday: normalizeEnvUrl(process.env.CALENDAR_FEED_BIRTHDAY)
};

// Upstream Google Sheets published CSV feeds (opsional override via env)
const SHEET_FEEDS = {
  doa: normalizeEnvUrl(process.env.SHEET_FEED_DOA) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=0&single=true&output=csv",
  mbg: normalizeEnvUrl(process.env.SHEET_FEED_MBG) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=215098819&single=true&output=csv",
  piket: normalizeEnvUrl(process.env.SHEET_FEED_PIKET) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1149044316&single=true&output=csv",
  icebreaking: normalizeEnvUrl(process.env.SHEET_FEED_ICEBREAKING) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1073417057&single=true&output=csv",
  penunggakan: normalizeEnvUrl(process.env.SHEET_FEED_PENUNGGAKAN) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=2142387216&single=true&output=csv",
  pengeluaran: normalizeEnvUrl(process.env.SHEET_FEED_PENGELUARAN) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=47581979&single=true&output=csv",
  pendapatan_lain: normalizeEnvUrl(process.env.SHEET_FEED_PENDAPATAN_LAIN) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=775852732&single=true&output=csv",
  rekap: normalizeEnvUrl(process.env.SHEET_FEED_REKAP) || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTU3Nzsaf2hBANcxE-7r9JKoKCpR5XYj30PqAu9Vp6ufPdizt7GMLtDOTxuk7ERV24lu5EEtFOqlC/pub?gid=172836771&single=true&output=csv"
};

const cache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function fetchWithRetry(url, headers = {}, timeoutMs = 12000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...headers
        }
      });
      if (!res.ok) {
        const err = new Error(`Upstream returned HTTP ${res.status} ${res.statusText}`);
        err.status = res.status;
        throw err;
      }
      return await res.text();
    } catch (err) {
      const causeCode = err?.cause?.code || err?.code || '';
      if (attempt === 1) {
        if (causeCode && !err.message.includes(causeCode)) {
          err.message = `${err.message} (${causeCode})`;
        }
        throw err;
      }
      await new Promise(r => setTimeout(r, 400));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error('Failed to fetch after retry');
}

// Health check endpoint (tanpa membocorkan URL private kalender)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dashboard-xb-backend',
    time: new Date().toISOString(),
    env: {
      pelajaranConfigured: Boolean(CALENDAR_FEEDS.pelajaran),
      birthdayConfigured: Boolean(CALENDAR_FEEDS.birthday)
    },
    sheetsConfigured: Object.keys(SHEET_FEEDS)
  });
});

// Proxy route for Google Calendar feeds
app.get('/api/calendar/:feed', async (req, res) => {
  const feed = req.params.feed;
  if (!(feed in CALENDAR_FEEDS)) {
    return res.status(404).json({ error: `Unknown calendar feed: ${feed}`, feed });
  }

  const url = CALENDAR_FEEDS[feed];
  if (!url) {
    const envName = `CALENDAR_FEED_${feed.toUpperCase()}`;
    console.warn(`[Calendar] ${envName} belum diatur di environment server.`);
    return res.status(503).json({
      error: `Environment variable ${envName} belum diatur atau kosong di server.`,
      feed,
      missingEnv: envName
    });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1' || !!req.query.t;
  const cached = cache.get(`cal:${feed}`);
  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    const sep = url.includes('?') ? '&' : '?';
    const upstreamUrl = `${url}${sep}_cb=${Date.now()}`;
    const icsText = await fetchWithRetry(upstreamUrl, {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache'
    });
    if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
      const preview = (icsText || '').trim().slice(0, 120).replace(/\s+/g, ' ');
      throw new Error(`Invalid iCal payload from Google Calendar (preview: "${preview}")`);
    }
    const contentType = 'text/calendar; charset=utf-8';
    cache.set(`cal:${feed}`, { data: icsText, contentType, timestamp: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    return res.send(icsText);
  } catch (err) {
    console.error(`[Calendar] Error fetching feed "${feed}":`, err.message, err.cause || '');
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.data);
    }
    return res.status(502).json({
      error: `Failed to fetch calendar ${feed}: ${err.message}`,
      feed,
      upstreamStatus: err.status || null,
      code: err.cause?.code || err.code || 'UPSTREAM_ERROR'
    });
  }
});

// Proxy route for Google Sheets CSV feeds
app.get('/api/sheets/:key', async (req, res) => {
  const key = req.params.key;
  const url = SHEET_FEEDS[key];
  if (!url) {
    return res.status(404).json({ error: `Unknown sheet key: ${key}`, key });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1' || !!req.query.t;
  const cached = cache.get(`sheet:${key}`);
  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    const sep = url.includes('?') ? '&' : '?';
    const upstreamUrl = `${url}${sep}_cb=${Date.now()}`;
    const csvText = await fetchWithRetry(upstreamUrl, {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache'
    });
    const trimmed = (csvText || '').trim();
    if (!trimmed || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
      const preview = trimmed.slice(0, 120).replace(/\s+/g, ' ');
      throw new Error(`Google Sheets returned HTML instead of CSV (preview: "${preview}")`);
    }
    const contentType = 'text/plain; charset=utf-8';
    cache.set(`sheet:${key}`, { data: csvText, contentType, timestamp: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    return res.send(csvText);
  } catch (err) {
    console.error(`[Sheets] Error fetching "${key}":`, err.message, err.cause || '');
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.data);
    }
    return res.status(502).json({
      error: `Failed to fetch sheet ${key}: ${err.message}`,
      key,
      upstreamStatus: err.status || null,
      code: err.cause?.code || err.code || 'UPSTREAM_ERROR'
    });
  }
});

// Force refresh endpoint
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
    if (typeof csvContent !== 'string' || csvContent.length > 500 * 1024) {
      return res.status(400).json({ error: 'Invalid or oversized CSV content (max 500KB)' });
    }
    const exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    const baseNameOnly = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `${baseNameOnly || 'kelompok'}.csv`;
    const filePath = path.join(exportDir, safeFilename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    return res.json({ ok: true, filename: safeFilename, path: filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Bukti Nota Mapping & Upload Endpoints (Persisted in data/ volume)
// ==========================================
const BUKTI_MAPPING_FILE = path.join(dataDir, 'bukti-mapping.json');

function getBuktiMapping() {
  if (fs.existsSync(BUKTI_MAPPING_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BUKTI_MAPPING_FILE, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse bukti-mapping.json:', e);
    }
  }
  return {};
}

function saveBuktiMapping(mapping) {
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

const ALLOWED_UPLOAD_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

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

      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran file melebihi batas maksimum 10MB' });
      }

      const rawExt = path.extname(filename || '').toLowerCase();
      const ext = ALLOWED_UPLOAD_EXTS.has(rawExt)
        ? rawExt
        : (contentType === 'application/pdf' ? '.pdf' : '.jpg');

      if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
        return res.status(400).json({ error: 'Format file tidak diizinkan. Hanya file JPG, PNG, WEBP, atau PDF yang didukung.' });
      }

      const baseClean = path.basename(filename || 'nota', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      savedFilename = `nota_${Date.now()}_${baseClean}${ext}`;

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filePath = path.join(UPLOADS_DIR, savedFilename);
      fs.writeFileSync(filePath, buffer);
      resultUrl = `/api/uploads/${savedFilename}`;
    } else if (linkUrl) {
      const trimmed = linkUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return res.status(400).json({ error: 'URL bukti kas harus menggunakan format http:// atau https://' });
      }
      resultUrl = trimmed;
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
      mapping,
      pengeluaranId
    });
  } catch (err) {
    console.error('Error handling upload-bukti:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Explicit route for OpenGraph image (supporting /img/og, /img/og.jpg, /og-image.jpg, /og-image.png)
app.get(['/img/og', '/img/og.jpg', '/og-image', '/og-image.jpg', '/og-image.png'], (_req, res) => {
  const candidatePaths = [
    path.join(process.cwd(), 'frontend', 'public', 'img', 'og.jpg'),
    path.join(process.cwd(), 'frontend', 'public', 'img', 'og'),
    path.join(process.cwd(), 'dist', 'img', 'og.jpg'),
    path.join(process.cwd(), 'dist', 'img', 'og'),
    path.join(process.cwd(), 'frontend', 'public', 'og-image.png'),
    path.join(process.cwd(), 'dist', 'og-image.png'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const isPng = candidate.endsWith('.png');
      res.setHeader('Content-Type', isPng ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, no-transform');
      return res.sendFile(candidate);
    }
  }

  return res.status(404).send('OG Image not found');
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
  } catch (e) {
    console.error('Failed to configure web-push VAPID details:', e.message);
  }
}

// 2. Persistent Push Subscriptions Store
const subsPath = path.join(dataDir, 'push-subscriptions.json');

function loadSubscriptions() {
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

function saveSubscriptions(subs) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
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
    const targetDate = req.query.date;
    const data = await buildTomorrowNotification(targetDate, fetchWithRetry, CALENDAR_FEEDS, SHEET_FEEDS);
    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Send or test tomorrow's 19:00 WIB routine notification
app.post('/api/push/send-routine', async (req, res) => {
  try {
    const { targetDate, force } = req.body || {};
    const result = await routineManager.sendRoutineNotification(targetDate, force ?? true);
    return res.json(result);
  } catch (err) {
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
    const record = {
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
  } catch (err) {
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function checkAdminAuth(req) {
  if (!ADMIN_API_KEY) return true;
  const authHeader = req.headers['authorization'] || req.headers['x-admin-key'];
  if (!authHeader) return false;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  return token === ADMIN_API_KEY;
}

// Push API: Send Immediate Test Push Notification
app.post('/api/push/send-test', async (req, res) => {
  try {
    const { subscription, payload } = req.body || {};
    const subs = loadSubscriptions();
    const targetSubs = [];

    if (subscription && subscription.endpoint) {
      targetSubs.push(subscription);
    } else {
      if (!checkAdminAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin authorization required to broadcast to subscribers' });
      }
      if (subs.length > 0) {
        targetSubs.push(subs[subs.length - 1]);
      }
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
    const expiredEndpoints = [];

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
      } catch (err) {
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Push API: Broadcast Notification to all subscribers
app.post('/api/push/broadcast', async (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authorization required to broadcast' });
  }
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
    const expiredEndpoints = [];

    for (const sub of subs) {
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
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error('Failed broadcast to endpoint:', err.message);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      saveSubscriptions(subs.filter(s => !expiredEndpoints.includes(s.endpoint)));
    }

    return res.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
