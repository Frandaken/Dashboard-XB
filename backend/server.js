import "dotenv/config";
import dns from "dns";
import http from "http";
import https from "https";
import zlib from "zlib";
import express from "express";
import fs from "fs";
import path from "path";
import webpush from "web-push";
import { RoutineNotificationManager, buildTomorrowNotification } from "./serverNotificationService.js";
import { sitatibService } from "./sitatibService.js";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

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

const normalizeEnvUrl = (val) => (val || '').replace(/\r/g, '').trim().replace(/^["']|["']$/g, '').trim();

const resolveAppVersion = () =>
  normalizeEnvUrl(process.env.VITE_APP_VERSION || process.env.APP_VERSION);

// Runtime frontend environment config (juga tersedia di backend sebagai fallback)
app.get('/env-config.js', (_req, res) => {
  const version = resolveAppVersion();
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.send(
    `window.__APP_ENV__ = ${JSON.stringify({ VITE_APP_VERSION: version, APP_VERSION: version })};\n`
  );
});

app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.json({
    ok: true,
    version: resolveAppVersion()
  });
});

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
const inFlightFetches = new Map();
const CACHE_TTL_MS = 60 * 1000;
const FEED_CACHE_FILE = path.join(dataDir, 'feed-cache.json');
let persistCacheTimer = null;

function hydrateFeedCacheFromDisk() {
  try {
    if (!fs.existsSync(FEED_CACHE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(FEED_CACHE_FILE, 'utf-8'));
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v.data === 'string' && typeof v.contentType === 'string') {
          cache.set(k, { data: v.data, contentType: v.contentType, timestamp: 0 });
        }
      }
    }
  } catch (err) {
    console.warn('[Cache] Failed to hydrate feed-cache.json:', err?.message || err);
  }
}

function schedulePersistFeedCache() {
  if (persistCacheTimer) return;
  persistCacheTimer = setTimeout(() => {
    persistCacheTimer = null;
    try {
      const serialized = {};
      for (const [k, v] of cache.entries()) {
        serialized[k] = v;
      }
      fs.writeFileSync(FEED_CACHE_FILE, JSON.stringify(serialized), 'utf-8');
    } catch (err) {
      console.warn('[Cache] Failed to persist feed-cache.json:', err?.message || err);
    }
  }, 1500);
}

hydrateFeedCacheFromDisk();

function fetchTextViaNodeHttp(targetUrl, headers = {}, timeoutMs = 20000, family = 4, redirectsLeft = 6) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      return reject(err);
    }

    const mod = parsed.protocol === 'http:' ? http : https;
    const req = mod.request(
      parsed,
      {
        method: 'GET',
        ...(family ? { family } : {}),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,text/calendar,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          ...headers
        }
      },
      res => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirectsLeft > 0) {
          res.resume();
          try {
            const nextUrl = new URL(res.headers.location, targetUrl).toString();
            return resolve(fetchTextViaNodeHttp(nextUrl, headers, timeoutMs, family, redirectsLeft - 1));
          } catch (redirectErr) {
            return reject(redirectErr);
          }
        }

        if (status < 200 || status >= 300) {
          res.resume();
          const err = new Error(`Upstream returned HTTP ${status} ${res.statusMessage || ''}`.trim());
          err.status = status;
          return reject(err);
        }

        const encoding = String(res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip());
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate());
        } else if (encoding === 'br') {
          stream = res.pipe(zlib.createBrotliDecompress());
        }

        const chunks = [];
        stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        stream.on('error', reject);
      }
    );

    const timer = setTimeout(() => {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutErr.code = 'ETIMEDOUT';
      req.destroy(timeoutErr);
    }, timeoutMs);

    req.on('close', () => clearTimeout(timer));
    req.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
    req.end();
  });
}

async function fetchWithRetry(url, headers = {}, timeoutMs = 20000, fallbackUrl) {
  let lastError;

  // Attempt 0: Native Node HTTP/HTTPS with explicit IPv4 (avoids Docker/Alpine IPv6 blackholes & undici 10s connectTimeout)
  try {
    return await fetchTextViaNodeHttp(url, headers, timeoutMs, 4);
  } catch (err) {
    lastError = err;
    if (err?.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
      throw err;
    }
    await new Promise(r => setTimeout(r, 350));
  }

  // Attempt 1: Fallback via standard fetch (supports IPv6-only networks) using clean fallbackUrl if provided
  const retryUrl = fallbackUrl || url;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(retryUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
    const causeCode = err?.cause?.code || err?.code || lastError?.code || '';
    if (causeCode && !String(err?.message || '').includes(causeCode)) {
      err.message = `${err.message} (${causeCode})`;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Health check endpoint (tanpa membocorkan URL private kalender)
app.get('/api/health', (req, res) => {
  const appVersion = resolveAppVersion();
  res.json({
    status: 'ok',
    service: 'dashboard-xb-backend',
    version: appVersion || null,
    time: new Date().toISOString(),
    env: {
      pelajaranConfigured: Boolean(CALENDAR_FEEDS.pelajaran),
      birthdayConfigured: Boolean(CALENDAR_FEEDS.birthday),
      sitatibConfigured: sitatibService.isConfigured(),
      appVersionConfigured: Boolean(appVersion)
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

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const cacheKey = `cal:${feed}`;
  const cached = cache.get(cacheKey);
  if (!forceFresh && cached && cached.timestamp > 0 && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    let inflight = !forceFresh ? inFlightFetches.get(cacheKey) : undefined;
    if (!inflight) {
      const sep = url.includes('?') ? '&' : '?';
      const upstreamUrl = forceFresh ? `${url}${sep}_cb=${Date.now()}` : url;
      inflight = (async () => {
        const icsText = await fetchWithRetry(upstreamUrl, {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }, 20000, url);
        if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
          const preview = (icsText || '').trim().slice(0, 120).replace(/\s+/g, ' ');
          throw new Error(`Invalid iCal payload from Google Calendar (preview: "${preview}")`);
        }
        const contentType = 'text/calendar; charset=utf-8';
        cache.set(cacheKey, { data: icsText, contentType, timestamp: Date.now() });
        schedulePersistFeedCache();
        return icsText;
      })();
      inFlightFetches.set(cacheKey, inflight);
      inflight.finally(() => {
        if (inFlightFetches.get(cacheKey) === inflight) {
          inFlightFetches.delete(cacheKey);
        }
      });
    }

    const icsText = await inflight;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
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

  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const cacheKey = `sheet:${key}`;
  const cached = cache.get(cacheKey);
  if (!forceFresh && cached && cached.timestamp > 0 && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  try {
    let inflight = !forceFresh ? inFlightFetches.get(cacheKey) : undefined;
    if (!inflight) {
      const sep = url.includes('?') ? '&' : '?';
      const upstreamUrl = forceFresh ? `${url}${sep}_cb=${Date.now()}` : url;
      inflight = (async () => {
        const csvText = await fetchWithRetry(upstreamUrl, {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }, 20000, url);
        const trimmed = (csvText || '').trim();
        if (!trimmed || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
          const preview = trimmed.slice(0, 120).replace(/\s+/g, ' ');
          throw new Error(`Google Sheets returned HTML instead of CSV (preview: "${preview}")`);
        }
        const contentType = 'text/plain; charset=utf-8';
        cache.set(cacheKey, { data: csvText, contentType, timestamp: Date.now() });
        schedulePersistFeedCache();
        return csvText;
      })();
      inFlightFetches.set(cacheKey, inflight);
      inflight.finally(() => {
        if (inFlightFetches.get(cacheKey) === inflight) {
          inFlightFetches.delete(cacheKey);
        }
      });
    }

    const csvText = await inflight;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
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

// Force refresh endpoint: mark cache stale without deleting fallback payloads
app.post('/api/refresh', (req, res) => {
  for (const entry of cache.values()) {
    entry.timestamp = 0;
  }
  for (const entry of websiteAgendaCache.values()) {
    entry.timestamp = 0;
  }
  sitatibService.clearCache();
  res.json({ ok: true, message: 'Cache marked stale for refresh' });
});

// ==========================================
// SITATIB Integration Proxy Endpoints
// ==========================================
app.get('/api/sitatib/health', (_req, res) => {
  res.json(sitatibService.getHealthStatus());
});

app.get('/api/sitatib/overview', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const overview = await sitatibService.getOverview(forceFresh);
  if (overview.syncedAt) {
    res.setHeader('X-Sitatib-Synced-At', overview.syncedAt);
  }
  return res.json(overview);
});

app.get('/api/sitatib/rules', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const overview = await sitatibService.getOverview(forceFresh);
  if (overview.syncedAt) {
    res.setHeader('X-Sitatib-Synced-At', overview.syncedAt);
  }
  return res.json({
    configured: overview.configured,
    authenticated: overview.authenticated,
    syncedAt: overview.syncedAt,
    academicYearLabel: overview.academicYearLabel,
    rules: overview.rules,
    error: overview.error
  });
});

app.get('/api/sitatib/activities', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const overview = await sitatibService.getOverview(forceFresh);
  if (overview.syncedAt) {
    res.setHeader('X-Sitatib-Synced-At', overview.syncedAt);
  }
  return res.json({
    configured: overview.configured,
    authenticated: overview.authenticated,
    syncedAt: overview.syncedAt,
    academicYearLabel: overview.academicYearLabel,
    activities: overview.activities || [],
    error: overview.error
  });
});

app.get('/api/sitatib/attachment', async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'Parameter url lampiran wajib diisi.' });
  }

  try {
    const asset = await sitatibService.proxyAuthenticatedAsset(rawUrl);
    if (asset.status >= 400) {
      return res.status(asset.status).json({ error: `SITATIB mengembalikan status HTTP ${asset.status}` });
    }
    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';
    res.setHeader('Content-Type', asset.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${asset.filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).send(asset.buffer);
  } catch (err) {
    const msg = err?.message || 'Gagal memuat lampiran SITATIB';
    const status = /tidak diizinkan|origin|forbidden/i.test(msg)
      ? 403
      : /tidak valid/i.test(msg)
      ? 400
      : 502;
    return res.status(status).json({ error: msg });
  }
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

// ==========================================
// Kas Payment Framework (QRIS Bank Digital - Verifikasi Manual Spreadsheet)
// ==========================================
const QRIS_CANDIDATE_FILENAMES = ['qris.png', 'qris.jpg', 'qris.jpeg', 'qris.webp'];

function findLocalQrisImagePath() {
  const dirs = [
    dataDir,
    UPLOADS_DIR,
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'frontend', 'public', 'img'),
    path.join(process.cwd(), 'frontend', 'dist', 'img')
  ];
  for (const dir of dirs) {
    for (const filename of QRIS_CANDIDATE_FILENAMES) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

function sanitizeSafeImageUrl(rawUrl) {
  const trimmed = normalizeEnvUrl(rawUrl);
  if (!trimmed) return null;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || (trimmed.startsWith('/') && !trimmed.startsWith('//'))) {
    return trimmed;
  }
  return null;
}

function sanitizeWhatsappNumber(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function buildKasPaymentConfig() {
  const enabledRaw = normalizeEnvUrl(process.env.KAS_PAYMENT_ENABLED).toLowerCase();
  const enabled = enabledRaw !== 'false' && enabledRaw !== '0';

  const envImageUrl = sanitizeSafeImageUrl(process.env.KAS_QRIS_IMAGE_URL || '');
  const localFile = findLocalQrisImagePath();
  let qrisImageUrl = envImageUrl;
  let imageSource = envImageUrl ? 'env' : 'none';

  if (!qrisImageUrl && localFile) {
    let mtime = 0;
    try {
      mtime = Math.floor(fs.statSync(localFile).mtimeMs);
    } catch {}
    qrisImageUrl = `/api/kas/qris-image${mtime ? `?v=${mtime}` : ''}`;
    imageSource = 'file';
  }

  const parsedRate = parseInt(normalizeEnvUrl(process.env.KAS_PAYMENT_WEEKLY_AMOUNT), 10);
  const weeklyRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 3000;

  return {
    enabled,
    providerType: 'qris',
    bankName: normalizeEnvUrl(process.env.KAS_PAYMENT_BANK_NAME) || 'Bank Digital (QRIS)',
    merchantName: normalizeEnvUrl(process.env.KAS_PAYMENT_MERCHANT_NAME) || 'Kas Kelas XB — SMA Putra Nirmala',
    accountHolder: normalizeEnvUrl(process.env.KAS_PAYMENT_ACCOUNT_HOLDER) || '',
    nmid: normalizeEnvUrl(process.env.KAS_PAYMENT_NMID) || '',
    weeklyRate,
    qrisImageUrl,
    hasQrisImage: Boolean(qrisImageUrl),
    imageSource,
    treasurerWhatsapp: sanitizeWhatsappNumber(process.env.KAS_PAYMENT_TREASURER_WA || ''),
    customNote: normalizeEnvUrl(process.env.KAS_PAYMENT_NOTE) || '',
    verificationMode: 'manual_spreadsheet',
    verificationNotice:
      'Verifikasi pembayaran dan pencatatan status lunas tetap dilakukan secara manual oleh Bendahara di Google Spreadsheet resmi kelas.'
  };
}

app.get('/api/kas/payment-config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return res.json({
    ok: true,
    config: buildKasPaymentConfig()
  });
});

app.get('/api/kas/qris-image', (_req, res) => {
  const filePath = findLocalQrisImagePath();
  if (!filePath) {
    return res.status(404).json({
      ok: false,
      error: 'Gambar QRIS belum tersedia di server. Letakkan file qris.png/jpg/webp di folder data atau atur KAS_QRIS_IMAGE_URL.'
    });
  }
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  return res.sendFile(filePath);
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

// ==========================================
// SMA Putra Nirmala Official Website Agenda Scraper (/api/website-agenda)
// ==========================================
const WEBSITE_AGENDA_BASE_URL = 'https://sma.putranirmala.sch.id/index.php/agenda';
const WEBSITE_AGENDA_CACHE_TTL_MS = 3 * 60 * 1000;
const websiteAgendaCache = new Map();
const websiteAgendaInFlight = new Map();

const WEBSITE_MONTH_MAP = {
  january: 1, jan: 1, januari: 1,
  february: 2, feb: 2, februari: 2,
  march: 3, mar: 3, maret: 3,
  april: 4, apr: 4,
  may: 5, mei: 5,
  june: 6, jun: 6, juni: 6,
  july: 7, jul: 7, juli: 7,
  august: 8, aug: 8, agustus: 8, ags: 8, agu: 8, agt: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12, desember: 12, des: 12
};

function decodeHtmlEntities(input) {
  if (!input) return '';
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function stripTags(html) {
  return decodeHtmlEntities(
    (html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h1|h2|h3|h4|h5|h6)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function parseIndonesianDateToISO(text) {
  const m = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = WEBSITE_MONTH_MAP[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (!month || !Number.isFinite(day) || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseWebsiteAgendaHtml(html, monthKey) {
  const items = [];
  const articleMatches =
    html.match(/<article\b[^>]*class=["'][^"']*agenda-detail[^"']*["'][\s\S]*?<\/article>/gi) || [];

  const fallbackYear =
    (monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? parseInt(monthKey.slice(0, 4), 10) : null) ||
    new Date(Date.now() + 7 * 3600 * 1000).getUTCFullYear();

  for (let i = 0; i < articleMatches.length; i++) {
    const article = articleMatches[i];
    const idAttrMatch = article.match(/\bid=["']([^"']+)["']/i);
    const domId = idAttrMatch ? idAttrMatch[1].trim() : '';

    const dayMatch = article.match(
      /<div\s+class=["']agenda-date["'][^>]*>\s*<strong>([^<]+)<\/strong>\s*<span>([^<]+)<\/span>/i
    );
    const rangeMatch = article.match(/<span\s+class=["']agenda-range[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = article.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    const catMatch = article.match(/<span\s+class=["']agenda-category[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const pMatch = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    const dayStr = dayMatch ? stripTags(dayMatch[1]) : '';
    const monthStr = dayMatch ? stripTags(dayMatch[2]) : '';
    const rangeStr = rangeMatch ? stripTags(rangeMatch[1]) : '';
    const title = titleMatch ? stripTags(titleMatch[1]) : '';
    const category = catMatch ? stripTags(catMatch[1]) : 'Kegiatan Sekolah';
    const rawDesc = pMatch ? stripTags(pMatch[1]) : '';

    if (!title) continue;

    const dateTokens = rangeStr.match(/\d{1,2}\s+[A-Za-z]+\s+20\d{2}/g) || [];
    let startDate = dateTokens[0] ? parseIndonesianDateToISO(dateTokens[0]) : null;
    let endDate = dateTokens[1] ? parseIndonesianDateToISO(dateTokens[1]) : startDate;

    if (!startDate) {
      const monthNum = WEBSITE_MONTH_MAP[monthStr.toLowerCase()] || 1;
      const dayNum = parseInt(dayStr, 10) || 1;
      startDate = `${fallbackYear}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      endDate = startDate;
    }
    if (!endDate || endDate < startDate) {
      endDate = startDate;
    }

    let timeLabel;
    let description = rawDesc;
    if (rawDesc) {
      const lines = rawDesc.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const timeLineMatch = lines[0].match(/^waktu\s*:\s*(.+)$/i);
        if (timeLineMatch) {
          timeLabel = timeLineMatch[1].trim();
          description = lines.slice(1).join('\n').trim();
        }
      }
    }

    const effectiveMonth = startDate.slice(0, 7);
    const stableId = domId || `web-${startDate}-${i + 1}`;
    const sourceUrl = `${WEBSITE_AGENDA_BASE_URL}?month=${effectiveMonth}${domId ? `#${domId}` : ''}`;

    items.push({
      id: stableId,
      isoDate: startDate,
      startDate,
      endDate,
      day: dayStr || startDate.slice(8, 10),
      month: monthStr,
      range: rangeStr || `${dayStr} ${monthStr}`.trim(),
      title,
      category,
      ...(timeLabel ? { timeLabel } : {}),
      description,
      sourceUrl
    });
  }

  return items;
}

function getDefaultWebsiteAgendaMonths() {
  const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
  const baseYear = nowWib.getUTCFullYear();
  const baseMonth = nowWib.getUTCMonth();
  const offsets = [-1, 0, 1, 2];
  return offsets.map(offset => {
    const d = new Date(Date.UTC(baseYear, baseMonth + offset, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

async function fetchWebsiteAgendaForMonths(months) {
  const results = await Promise.all(
    months.map(async m => {
      const url = `${WEBSITE_AGENDA_BASE_URL}?month=${m}`;
      try {
        const html = await fetchWithRetry(
          url,
          {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          15000
        );
        return parseWebsiteAgendaHtml(html, m);
      } catch (err) {
        console.warn(`[WebsiteAgenda] Failed to fetch month ${m}:`, err?.message || err);
        return null;
      }
    })
  );

  const succeeded = results.filter(r => r !== null);
  if (succeeded.length === 0) {
    throw new Error('Gagal mengambil data agenda dari website SMA Putra Nirmala');
  }

  const deduped = new Map();
  for (const list of succeeded) {
    for (const item of list) {
      if (!deduped.has(item.id)) {
        deduped.set(item.id, item);
      }
    }
  }

  const items = Array.from(deduped.values()).sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    return a.title.localeCompare(b.title);
  });

  return { items, months };
}

// Endpoint to fetch and parse SMA Putra Nirmala Website Agenda
app.get('/api/website-agenda', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const rawMonth = typeof req.query.month === 'string' ? req.query.month.trim() : '';
  if (rawMonth && !/^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)) {
    return res.status(400).json({ ok: false, error: 'Parameter month harus berformat YYYY-MM' });
  }

  const targetMonths = rawMonth ? [rawMonth] : getDefaultWebsiteAgendaMonths();
  const cacheKey = rawMonth ? `month:${rawMonth}` : `window:${targetMonths.join(',')}`;
  const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';
  const cached = websiteAgendaCache.get(cacheKey);

  if (!forceFresh && cached && cached.timestamp > 0 && Date.now() - cached.timestamp < WEBSITE_AGENDA_CACHE_TTL_MS) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({
      ok: true,
      source: 'cache',
      months: cached.months,
      items: cached.data,
      syncedAt: new Date(cached.timestamp).toISOString()
    });
  }

  try {
    let inflight = !forceFresh ? websiteAgendaInFlight.get(cacheKey) : undefined;
    if (!inflight) {
      inflight = fetchWebsiteAgendaForMonths(targetMonths);
      websiteAgendaInFlight.set(cacheKey, inflight);
      inflight.finally(() => {
        if (websiteAgendaInFlight.get(cacheKey) === inflight) {
          websiteAgendaInFlight.delete(cacheKey);
        }
      });
    }

    const { items, months } = await inflight;
    const now = Date.now();
    websiteAgendaCache.set(cacheKey, { data: items, months, timestamp: now });
    res.setHeader('X-Cache', 'MISS');
    return res.json({
      ok: true,
      source: 'live',
      months,
      items,
      syncedAt: new Date(now).toISOString()
    });
  } catch (err) {
    console.warn('[WebsiteAgenda] Failed to fetch live agenda:', err?.message || err);
    if (cached && cached.data) {
      res.setHeader('X-Cache', 'STALE');
      return res.json({
        ok: true,
        source: 'stale-cache',
        months: cached.months,
        items: cached.data,
        error: err.message
      });
    }
    return res.status(502).json({
      ok: false,
      source: 'error',
      months: targetMonths,
      items: [],
      error: err.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
