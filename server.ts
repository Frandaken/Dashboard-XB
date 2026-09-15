import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Upstream Google Calendar feeds (Notice: penugasan calendar link is completely removed as requested)
const CALENDAR_FEEDS: Record<string, string> = {
  pelajaran: "https://calendar.google.com/calendar/ical/a4fd56ccb6ac7cde9478e4d863191dd53cd12c6110fe380d6bf279da0e44dc8e%40group.calendar.google.com/private-f67cd9352a27790460116ba8a612434c/basic.ics",
  birthday: "https://calendar.google.com/calendar/ical/c83e6edc41cc4489ab2a435d067ef46014bfd0fefa8fc964d83ecdc72a5e59d5%40group.calendar.google.com/private-b45f7ec9aad159bf2e0dca6627311f2b/basic.ics"
};

// Upstream Google Sheets published CSV feeds
const SHEET_FEEDS: Record<string, string> = {
  doa: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=0&single=true&output=csv",
  mbg: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=215098819&single=true&output=csv",
  piket: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1149044316&single=true&output=csv"
};

// Simple in-memory cache to prevent hitting Google rate limits
const cache = new Map<string, { data: string; contentType: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

async function fetchWithRetry(url: string, headers: Record<string, string> = {}, timeoutMs = 8000) {
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
  } finally {
    clearTimeout(timeoutId);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom dashboard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
