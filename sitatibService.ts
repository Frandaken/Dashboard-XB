import { URL } from 'url';

export interface SitatibAnnouncement {
  id: string;
  title: string;
  content: string;
  publishedAt?: string;
  category?: string;
  isPinned?: boolean;
  sourceUrl?: string;
}

export interface SitatibRuleItem {
  id: string;
  codeOrNumber: string;
  category: string;
  title: string;
  description: string;
  points?: number;
  pointType?: 'pelanggaran' | 'penghargaan' | 'info';
}

export interface SitatibDiscoveredSection {
  label: string;
  path: string;
}

export interface SitatibOverviewPayload {
  configured: boolean;
  authenticated: boolean;
  syncedAt: string;
  academicYearLabel?: string;
  announcements: SitatibAnnouncement[];
  rules: SitatibRuleItem[];
  discoveredSections?: SitatibDiscoveredSection[];
  error?: string;
}

const DEFAULT_BASE_URL = 'https://sitatib.sma.putranirmala.sch.id';
const CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeEnv = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');

function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function stripTags(html: string): string {
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

function isLoginPageHtml(html: string, finalUrl = ''): boolean {
  const lowerUrl = finalUrl.toLowerCase();
  if (lowerUrl.includes('/login') || lowerUrl.includes('/auth')) {
    return true;
  }
  return /name=["']identity["']|action=["'][^"']*\/login["']|Masuk ke SITATIB/i.test(html);
}

function sanitizeText(text: string): string {
  return (text || '')
    .replace(/\b\d{8,14}\b/g, (m) => (m.length >= 10 ? '[NIS]' : m))
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .trim();
}

function isLikelyPersonalRecord(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('riwayat pelanggaran saya') ||
    lower.includes('catatan pribadi') ||
    lower.includes('nisn') ||
    lower.includes('ubah password')
  );
}

function parseTableRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const trMatches = tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const cells: string[] = [];
    const cellMatches = tr.match(/<(?:th|td)\b[^>]*>[\s\S]*?<\/(?:th|td)>/gi) || [];
    for (const cell of cellMatches) {
      cells.push(stripTags(cell));
    }
    if (cells.some(Boolean)) {
      rows.push(cells);
    }
  }
  return rows;
}

function extractRulesFromHtml(html: string): SitatibRuleItem[] {
  const rules: SitatibRuleItem[] = [];
  const seen = new Set<string>();

  const tables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) || [];
  for (const table of tables) {
    const rows = parseTableRows(table);
    if (rows.length < 2) continue;

    const header = rows[0].map(c => c.toLowerCase());
    const hasRuleColumns = header.some(h =>
      /pasal|aturan|pelanggaran|tata\s*tertib|kategori|poin|bobot|uraian|keterangan|sanksi|prestasi/i.test(h)
    );
    const hasPersonalColumns = header.some(h => /nis|nama siswa|petugas|pelapor|tanggal kejadian/i.test(h));
    if (!hasRuleColumns || hasPersonalColumns) continue;

    const codeIdx = header.findIndex(h => /pasal|kode|no\.?$/i.test(h));
    const catIdx = header.findIndex(h => /kategori|jenis|kelompok|aspek/i.test(h));
    const titleIdx = header.findIndex(h => /judul|nama|pelanggaran|aturan|tata\s*tertib|uraian|peraturan/i.test(h));
    const descIdx = header.findIndex(h => /deskripsi|keterangan|sanksi|tindakan|detail/i.test(h));
    const pointIdx = header.findIndex(h => /poin|bobot|skor|nilai/i.test(h));

    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols.length) continue;

      const rawTitle = cols[titleIdx >= 0 ? titleIdx : Math.min(1, cols.length - 1)] || '';
      const rawDesc = descIdx >= 0 && descIdx !== titleIdx ? (cols[descIdx] || '') : '';
      const rawCat = catIdx >= 0 ? (cols[catIdx] || 'Tata Tertib') : 'Tata Tertib';
      const rawCode = codeIdx >= 0 ? (cols[codeIdx] || `${r}`) : `Aturan ${r}`;
      const rawPointsStr = pointIdx >= 0 ? (cols[pointIdx] || '') : '';
      const pointMatch = rawPointsStr.match(/([+-]?\d+)/);
      const points = pointMatch ? Math.abs(parseInt(pointMatch[1], 10)) : undefined;

      const titleLines = rawTitle.split('\n').map(l => l.trim()).filter(Boolean);
      const cleanFirstLine = sanitizeText(titleLines[0] || '');
      const cleanRestLines = sanitizeText(
        titleLines
          .slice(1)
          .map(l => l.replace(/^[·•\-]\s*/, '').trim())
          .filter(Boolean)
          .join(' · ')
      );
      const title = cleanFirstLine;
      const description = sanitizeText(rawDesc) || (cleanRestLines && cleanRestLines !== title ? cleanRestLines : '');

      if (!title || title.length < 3 || isLikelyPersonalRecord(title)) continue;
      if (/^(belum ada|tidak ada)\s+/i.test(title)) continue;

      const key = `${rawCode.toLowerCase()}::${title.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const lowerCat = `${rawCat} ${rawPointsStr} ${title}`.toLowerCase();
      const pointType: SitatibRuleItem['pointType'] =
        lowerCat.includes('penghargaan') || lowerCat.includes('prestasi') || rawPointsStr.includes('+')
          ? 'penghargaan'
          : points !== undefined
          ? 'pelanggaran'
          : 'info';

      rules.push({
        id: `rule_${rules.length + 1}`,
        codeOrNumber: rawCode || `${rules.length + 1}`,
        category: rawCat || 'Tata Tertib',
        title,
        description,
        points,
        pointType
      });
    }
  }

  // Fallback: ordered/bulleted list or card blocks explicitly marked as Pasal / Tata Tertib
  if (rules.length === 0) {
    const blocks = html.match(/<(?:li|div|article)\b[^>]*>[\s\S]{15,800}?<\/(?:li|div|article)>/gi) || [];
    for (const block of blocks) {
      const text = stripTags(block);
      if (!/pasal\s+\d+|tata\s*tertib|poin\s*[:=]?\s*\d+/i.test(text)) continue;
      if (isLikelyPersonalRecord(text)) continue;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const pasalMatch = lines[0].match(/(Pasal\s+\d+[A-Za-z0-9.-]*)/i);
      const code = pasalMatch ? pasalMatch[1] : `Aturan ${rules.length + 1}`;
      const title = sanitizeText(lines[0]);
      const description = sanitizeText(lines.slice(1).join(' ') || '');
      const pointMatch = text.match(/(\d+)\s*poin/i);
      const points = pointMatch ? parseInt(pointMatch[1], 10) : undefined;

      const key = `${code.toLowerCase()}::${title.toLowerCase()}`;
      if (seen.has(key) || title.length < 5) continue;
      if (/^(belum ada|tidak ada)\s+/i.test(title)) continue;
      seen.add(key);

      rules.push({
        id: `rule_${rules.length + 1}`,
        codeOrNumber: code,
        category: 'Tata Tertib Sekolah',
        title,
        description,
        points,
        pointType: points !== undefined ? 'pelanggaran' : 'info'
      });
    }
  }

  return rules.slice(0, 300);
}

function isIgnoredAnnouncementTitle(title: string): boolean {
  const normalized = (title || '').trim().toLowerCase();
  return (
    normalized === 'materi baru di ruang kelas' ||
    normalized === 'tugas baru di ruang kelas'
  );
}

function extractAnnouncementsFromHtml(html: string, sourceUrl?: string): SitatibAnnouncement[] {
  const announcements: SitatibAnnouncement[] = [];
  const seen = new Set<string>();
  const isNotifPage = Boolean(sourceUrl && /notifikasi|notif/i.test(sourceUrl));

  // 1A. Official SITATIB announcement cards (<a href=".../pengumuman/57" class="card ...">)
  const pengumumanLinks = html.match(/<a\b[^>]*href=["'][^"']*\/pengumuman\/\d+[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const block of pengumumanLinks) {
    const hrefMatch = block.match(/href=["']([^"']+)["']/i);
    const itemUrl = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : sourceUrl;
    const hMatch = block.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const pMatch = block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const fullText = stripTags(block);

    const title = sanitizeText(stripTags(hMatch ? hMatch[1] : ''));
    let content = sanitizeText(stripTags(pMatch ? pMatch[1] : ''));
    if (!content) {
      content = sanitizeText(
        fullText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && l !== title)
          .join(' ')
      );
    }

    if (!title || !content || isLikelyPersonalRecord(fullText)) continue;

    const tags: string[] = [];
    if (/pdf terlampir/i.test(fullText)) tags.push('PDF terlampir');
    if (/perlu konfirmasi/i.test(fullText)) tags.push('Perlu konfirmasi');
    if (tags.length > 0 && !content.toLowerCase().includes(tags[0].toLowerCase())) {
      content = `${content} (${tags.join(' · ')})`;
    }

    const dateMatch = fullText.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4}(?:\s+\d{2}:\d{2})?|\d{4}-\d{2}-\d{2})/);
    const key = `${title.toLowerCase()}::${content.slice(0, 60).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    announcements.push({
      id: `ann_${announcements.length + 1}`,
      title,
      content,
      publishedAt: dateMatch ? dateMatch[1] : undefined,
      category: 'Pengumuman Sekolah',
      isPinned: /perlu konfirmasi|penting/i.test(fullText),
      sourceUrl: itemUrl
    });
  }

  // 1B. SITATIB notification rows (<a href=".../notifikasi/buka/11198" ...>)
  const notifLinks = html.match(/<a\b[^>]*href=["'][^"']*\/notifikasi\/buka\/\d+[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const block of notifLinks) {
    const hrefMatch = block.match(/href=["']([^"']+)["']/i);
    const itemUrl = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : sourceUrl;
    const fullText = stripTags(block);

    // Filter out personal violation/discipline alerts
    if (/pelanggaran|teguran|poin pelanggaran/i.test(fullText) || isLikelyPersonalRecord(fullText)) continue;

    const titleMatch = block.match(/<(?:h[1-6]|div)\b[^>]*class=["'][^"']*font-bold[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[1-6]|div)>/i);
    const pMatch = block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const title = sanitizeText(stripTags(titleMatch ? titleMatch[1] : 'Notifikasi SITATIB'));
    const content = sanitizeText(stripTags(pMatch ? pMatch[1] : ''));

    if (!title || !content || isIgnoredAnnouncementTitle(title)) continue;

    const dateMatch = fullText.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4}(?:\s+\d{2}:\d{2})?|\d{4}-\d{2}-\d{2})/);
    const key = `${title.toLowerCase()}::${content.slice(0, 60).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    announcements.push({
      id: `ann_${announcements.length + 1}`,
      title,
      content,
      publishedAt: dateMatch ? dateMatch[1] : undefined,
      category: 'Notifikasi SITATIB',
      sourceUrl: itemUrl
    });
  }

  // 2. Fallback: generic article/card/alert/list-group containers
  if (announcements.length === 0) {
    const sections = html.match(/<(?:article|div|li)\b[^>]*class=["'][^"']*(?:pengumuman|announcement|notifikasi|notif|notice|berita|list-group-item|alert)[^"']*["'][^>]*>[\s\S]*?<\/(?:article|div|li)>/gi) || [];
    for (const section of sections) {
      if (/href=["'][^"']*\/pelanggaran\/\d+/i.test(section)) continue;

      const headingMatch = section.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)
        || section.match(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/i);
      const title = stripTags(headingMatch ? headingMatch[1] : '');
      const fullText = stripTags(section);

      if (!title || title.length < 4) continue;
      if (/^(belum ada|tidak ada|memuat)\s+/i.test(title) || /^(belum ada|tidak ada)\s+(pengumuman|notifikasi)/i.test(fullText)) continue;
      if (/login|kata sandi|tahun ajaran|dashboard sitatib|menu utama|perkembangan poin|ringkasan kategori|pelanggaran terbaru|penghargaan terbaru|sisa point/i.test(title)) continue;
      if (isLikelyPersonalRecord(fullText)) continue;

      const bodyLines = fullText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && l !== title);
      const content = sanitizeText(bodyLines.join('\n'));
      if (!content || content.length < 6) continue;
      if (/^(belum ada|tidak ada)\s+/i.test(content)) continue;

      const dateMatch = fullText.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4}(?:\s+\d{2}:\d{2})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
      const key = `${title.toLowerCase()}::${content.slice(0, 60).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      announcements.push({
        id: `ann_${announcements.length + 1}`,
        title: sanitizeText(title),
        content,
        publishedAt: dateMatch ? dateMatch[1] : undefined,
        category: isNotifPage || /notif/i.test(section) ? 'Notifikasi SITATIB' : 'Pengumuman SITATIB',
        sourceUrl
      });
    }
  }

  // 2. Check structured announcement tables
  if (announcements.length === 0) {
    const tables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) || [];
    for (const table of tables) {
      const rows = parseTableRows(table);
      if (rows.length < 2) continue;
      const header = rows[0].map(c => c.toLowerCase());
      const isAnnouncementTable = header.some(h => /pengumuman|notifikasi|pesan|judul|isi|berita/i.test(h)) &&
        !header.some(h => /pasal|pelanggaran|poin|nis/i.test(h));
      if (!isAnnouncementTable) continue;

      const titleIdx = header.findIndex(h => /judul|pengumuman|perihal|topik/i.test(h));
      const contentIdx = header.findIndex(h => /isi|pesan|keterangan|notifikasi|deskripsi/i.test(h));
      const dateIdx = header.findIndex(h => /tanggal|waktu|dibuat|date/i.test(h));

      for (let r = 1; r < rows.length; r++) {
        const cols = rows[r];
        const title = sanitizeText(cols[titleIdx >= 0 ? titleIdx : 0] || 'Pengumuman SITATIB');
        const content = sanitizeText(cols[contentIdx >= 0 ? contentIdx : Math.min(1, cols.length - 1)] || '');
        if (!content || isLikelyPersonalRecord(`${title} ${content}`)) continue;
        const key = `${title.toLowerCase()}::${content.slice(0, 40).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        announcements.push({
          id: `ann_${announcements.length + 1}`,
          title,
          content,
          publishedAt: dateIdx >= 0 ? cols[dateIdx] : undefined,
          category: 'Pengumuman SITATIB',
          sourceUrl
        });
      }
    }
  }

  return announcements.slice(0, 50);
}

function discoverInternalLinks(html: string, baseUrl: string): SitatibDiscoveredSection[] {
  const sections: SitatibDiscoveredSection[] = [];
  const seen = new Set<string>();
  const linkRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = (match[1] || '').trim();
    const label = stripTags(match[2] || '').replace(/\s+/g, ' ').trim();
    if (!rawHref || !label) continue;
    if (/logout|keluar|login|auth\/google|lupa-password|javascript:/i.test(rawHref)) continue;

    let resolvedPath = '';
    try {
      const parsed = new URL(rawHref, baseUrl);
      const baseOrigin = new URL(baseUrl).origin;
      if (parsed.origin !== baseOrigin) continue;
      resolvedPath = parsed.pathname + parsed.search;
    } catch {
      continue;
    }

    if (
      /(pengumuman|notifikasi|notif|berita|informasi|tata.?tertib|peraturan|pasal|aturan|kategori|poin|dashboard|beranda)/i.test(
        `${resolvedPath} ${label}`
      )
    ) {
      if (!seen.has(resolvedPath)) {
        seen.add(resolvedPath);
        sections.push({ label, path: resolvedPath });
      }
    }
  }

  return sections.slice(0, 20);
}

export class SitatibService {
  private cookies = new Map<string, string>();
  private cachedOverview: { data: SitatibOverviewPayload; timestamp: number } | null = null;
  private lastSessionAt: string | null = null;
  private lastError: string | null = null;

  private getConfig() {
    const baseUrl = (normalizeEnv(process.env.SITATIB_BASE_URL) || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const username = normalizeEnv(process.env.SITATIB_USERNAME);
    const password = normalizeEnv(process.env.SITATIB_PASSWORD);
    const academicYearId = normalizeEnv(process.env.SITATIB_ACADEMIC_YEAR_ID) || '3';
    const announcementsUrl = normalizeEnv(process.env.SITATIB_ANNOUNCEMENTS_URL);
    const rulesUrl = normalizeEnv(process.env.SITATIB_RULES_URL);

    return {
      baseUrl,
      username,
      password,
      academicYearId,
      announcementsUrl,
      rulesUrl,
      configured: Boolean(username && password)
    };
  }

  public isConfigured(): boolean {
    return this.getConfig().configured;
  }

  public clearCache(): void {
    this.cachedOverview = null;
  }

  public getHealthStatus() {
    const cfg = this.getConfig();
    return {
      configured: cfg.configured,
      hasSession: this.cookies.size > 0,
      lastSessionAt: this.lastSessionAt,
      lastSyncedAt: this.cachedOverview?.data.syncedAt || null,
      lastError: this.lastError
    };
  }

  private absorbCookies(headers: Headers): void {
    const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const rawCookies: string[] = typeof getSetCookie === 'function'
      ? getSetCookie.call(headers)
      : (headers.get('set-cookie') ? [headers.get('set-cookie') as string] : []);

    for (const entry of rawCookies) {
      const pair = entry.split(';')[0];
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        if (name) {
          this.cookies.set(name, value);
        }
      }
    }
  }

  private buildCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private async requestWithCookies(url: string, init: RequestInit = {}, maxRedirects = 5): Promise<{ status: number; finalUrl: string; html: string; contentType: string }> {
    let currentUrl = url;
    let currentMethod = (init.method || 'GET').toUpperCase();
    let currentBody = init.body;
    let extraHeaders = (init.headers || {}) as Record<string, string>;

    for (let hop = 0; hop <= maxRedirects; hop++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const cookieHeader = this.buildCookieHeader();
        const res = await fetch(currentUrl, {
          method: currentMethod,
          body: currentMethod === 'POST' ? currentBody : undefined,
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'DashboardXB-SITATIB-Proxy/1.0',
            Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            ...extraHeaders
          }
        });

        this.absorbCookies(res.headers);

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (location) {
            currentUrl = new URL(location, currentUrl).toString();
            currentMethod = 'GET';
            currentBody = undefined;
            extraHeaders = {};
            continue;
          }
        }

        const contentType = res.headers.get('content-type') || 'text/html';
        const html = await res.text();
        return { status: res.status, finalUrl: currentUrl, html, contentType };
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('Too many redirects while contacting SITATIB');
  }

  private async authenticate(): Promise<{ ok: boolean; dashboardHtml: string; dashboardUrl: string; academicYearLabel?: string; error?: string }> {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      return {
        ok: false,
        dashboardHtml: '',
        dashboardUrl: '',
        error: 'Kredensial SITATIB_USERNAME dan SITATIB_PASSWORD belum diatur pada environment server.'
      };
    }

    this.cookies.clear();
    const loginPageUrl = `${cfg.baseUrl}/index.php/login`;
    const loginPage = await this.requestWithCookies(loginPageUrl);

    const csrfMatch = loginPage.html.match(/name=["'](csrf_[^"']+)["'][^>]*value=["']([^"']+)["']/i)
      || loginPage.html.match(/value=["']([^"']+)["'][^>]*name=["'](csrf_[^"']+)["']/i);
    const csrfName = csrfMatch ? (csrfMatch[1].startsWith('csrf_') ? csrfMatch[1] : csrfMatch[2]) : 'csrf_test_name';
    const csrfValue = csrfMatch ? (csrfMatch[1].startsWith('csrf_') ? csrfMatch[2] : csrfMatch[1]) : (this.cookies.get('csrf_cookie_name') || '');

    const actionMatch = loginPage.html.match(/<form[^>]*action=["']([^"']+)["']/i);
    const postUrl = actionMatch ? new URL(actionMatch[1], cfg.baseUrl).toString() : `${cfg.baseUrl}/login`;

    const yearMatch = loginPage.html.match(new RegExp(`<option[^>]*value=["']${cfg.academicYearId}["'][^>]*>([^<]+)</option>`, 'i'));
    const academicYearLabel = yearMatch ? stripTags(yearMatch[1]).replace(/\s*·\s*Aktif/i, '').trim() : undefined;

    const form = new URLSearchParams();
    if (csrfValue) {
      form.set(csrfName, csrfValue);
    }
    form.set('identity', cfg.username);
    form.set('password', cfg.password);
    form.set('academic_year_id', cfg.academicYearId);

    const postRes = await this.requestWithCookies(postUrl, {
      method: 'POST',
      body: form.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: cfg.baseUrl,
        Referer: loginPageUrl
      }
    });

    if (isLoginPageHtml(postRes.html, postRes.finalUrl)) {
      this.cookies.clear();
      return {
        ok: false,
        dashboardHtml: '',
        dashboardUrl: postRes.finalUrl,
        academicYearLabel,
        error: 'Autentikasi SITATIB ditolak. Periksa kembali SITATIB_USERNAME, SITATIB_PASSWORD, dan tahun ajaran di env server.'
      };
    }

    this.lastSessionAt = new Date().toISOString();
    return {
      ok: true,
      dashboardHtml: postRes.html,
      dashboardUrl: postRes.finalUrl,
      academicYearLabel
    };
  }

  private async fetchAuthenticatedPage(targetUrl: string): Promise<{ html: string; finalUrl: string; contentType: string }> {
    const res = await this.requestWithCookies(targetUrl);
    if (isLoginPageHtml(res.html, res.finalUrl)) {
      const auth = await this.authenticate();
      if (!auth.ok) {
        throw new Error(auth.error || 'Sesi SITATIB gagal diperbarui.');
      }
      return await this.requestWithCookies(targetUrl);
    }
    return { html: res.html, finalUrl: res.finalUrl, contentType: res.contentType };
  }

  public async getOverview(forceFresh = false): Promise<SitatibOverviewPayload> {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      return {
        configured: false,
        authenticated: false,
        syncedAt: new Date().toISOString(),
        announcements: [],
        rules: [],
        error: 'SITATIB_USERNAME dan SITATIB_PASSWORD belum diatur di environment server.'
      };
    }

    if (!forceFresh && this.cachedOverview && Date.now() - this.cachedOverview.timestamp < CACHE_TTL_MS) {
      return this.cachedOverview.data;
    }

    try {
      const auth = await this.authenticate();
      if (!auth.ok) {
        this.lastError = auth.error || 'Login SITATIB gagal';
        return {
          configured: true,
          authenticated: false,
          syncedAt: new Date().toISOString(),
          academicYearLabel: auth.academicYearLabel,
          announcements: [],
          rules: [],
          error: this.lastError
        };
      }

      const discoveredSections = discoverInternalLinks(auth.dashboardHtml, cfg.baseUrl).filter(
        sec => !/\/pelanggaran\/\d+/i.test(sec.path)
      );
      const allAnnouncements: SitatibAnnouncement[] = [];
      const allRules: SitatibRuleItem[] = [];

      const announcementUrls = new Set<string>([
        `${cfg.baseUrl}/pengumuman`,
        `${cfg.baseUrl}/notifikasi`
      ]);
      const rulesUrls = new Set<string>([
        `${cfg.baseUrl}/tata-tertib`
      ]);

      if (cfg.announcementsUrl) {
        announcementUrls.add(new URL(cfg.announcementsUrl, cfg.baseUrl).toString());
      }
      if (cfg.rulesUrl) {
        rulesUrls.add(new URL(cfg.rulesUrl, cfg.baseUrl).toString());
      }

      for (const sec of discoveredSections) {
        const lowerPath = sec.path.toLowerCase();
        // Never scrape personal violation/reward/point pages
        if (/\/(pelanggaran|penghargaan|dashboard|profil)/i.test(lowerPath)) continue;

        const fullSecUrl = new URL(sec.path, cfg.baseUrl).toString();
        if (/(pengumuman|notifikasi|notif|surat|berita|informasi)/i.test(`${sec.label} ${sec.path}`)) {
          announcementUrls.add(fullSecUrl);
        } else if (/(tata.?tertib|peraturan|pasal|aturan)/i.test(`${sec.label} ${sec.path}`)) {
          rulesUrls.add(fullSecUrl);
        }
      }

      // Fetch announcements & notifications pages
      for (const url of Array.from(announcementUrls).slice(0, 5)) {
        try {
          const page = await this.fetchAuthenticatedPage(url);
          if (page.contentType.includes('application/json')) {
            const parsedJson = JSON.parse(page.html);
            if (Array.isArray(parsedJson?.announcements)) {
              for (const a of parsedJson.announcements) {
                allAnnouncements.push({
                  id: String(a.id || `ann_${allAnnouncements.length + 1}`),
                  title: sanitizeText(String(a.title || a.judul || 'Pengumuman SITATIB')),
                  content: sanitizeText(String(a.content || a.isi || a.message || '')),
                  publishedAt: a.publishedAt || a.tanggal || a.created_at,
                  category: a.category || 'Pengumuman SITATIB',
                  sourceUrl: url
                });
              }
            }
          } else {
            allAnnouncements.push(...extractAnnouncementsFromHtml(page.html, page.finalUrl));
          }
        } catch (pageErr: any) {
          console.warn(`[SITATIB] Skip announcement page ${url}:`, pageErr?.message || pageErr);
        }
      }

      // Fetch tata-tertib rules pages (following pagination links like ?page=2..N)
      const visitedRulesUrls = new Set<string>();
      const rulesQueue = Array.from(rulesUrls).slice(0, 4);

      while (rulesQueue.length > 0 && visitedRulesUrls.size < 12) {
        const url = rulesQueue.shift()!;
        if (visitedRulesUrls.has(url)) continue;
        visitedRulesUrls.add(url);

        try {
          const page = await this.fetchAuthenticatedPage(url);
          if (page.contentType.includes('application/json')) {
            const parsedJson = JSON.parse(page.html);
            if (Array.isArray(parsedJson?.rules)) {
              for (const r of parsedJson.rules) {
                allRules.push({
                  id: String(r.id || `rule_${allRules.length + 1}`),
                  codeOrNumber: String(r.codeOrNumber || r.pasal || r.kode || allRules.length + 1),
                  category: sanitizeText(String(r.category || r.kategori || 'Tata Tertib')),
                  title: sanitizeText(String(r.title || r.judul || r.nama || '')),
                  description: sanitizeText(String(r.description || r.deskripsi || r.uraian || '')),
                  points: typeof r.points === 'number' ? r.points : undefined,
                  pointType: r.pointType || 'pelanggaran'
                });
              }
            }
          } else {
            allRules.push(...extractRulesFromHtml(page.html));

            // Discover pagination links within tata-tertib
            const pageLinkRegex = /<a\b[^>]*href=["']([^"']*(?:tata-tertib[^"']*[?&](?:page|hal)=|page=\d+)[^"']*)["'][^>]*>/gi;
            let pMatch: RegExpExecArray | null;
            while ((pMatch = pageLinkRegex.exec(page.html)) !== null) {
              try {
                const nextUrl = new URL(decodeHtmlEntities(pMatch[1]), page.finalUrl).toString();
                if (nextUrl.startsWith(cfg.baseUrl) && nextUrl.includes('tata-tertib') && !visitedRulesUrls.has(nextUrl)) {
                  rulesQueue.push(nextUrl);
                }
              } catch {}
            }
          }
        } catch (pageErr: any) {
          console.warn(`[SITATIB] Skip rules page ${url}:`, pageErr?.message || pageErr);
        }
      }

      // Deduplicate announcements & rules
      const uniqueAnnouncements: SitatibAnnouncement[] = [];
      const seenAnn = new Set<string>();
      for (const item of allAnnouncements) {
        if (isIgnoredAnnouncementTitle(item.title)) continue;
        const key = `${item.title.toLowerCase()}::${item.content.slice(0, 60).toLowerCase()}`;
        if (!seenAnn.has(key) && item.content) {
          seenAnn.add(key);
          uniqueAnnouncements.push({ ...item, id: `ann_${uniqueAnnouncements.length + 1}` });
        }
      }

      const uniqueRules: SitatibRuleItem[] = [];
      const seenRules = new Set<string>();
      for (const rule of allRules) {
        const key = `${rule.codeOrNumber.toLowerCase()}::${rule.title.toLowerCase()}`;
        if (!seenRules.has(key) && rule.title) {
          seenRules.add(key);
          uniqueRules.push({ ...rule, id: `rule_${uniqueRules.length + 1}` });
        }
      }

      this.lastError = null;
      const payload: SitatibOverviewPayload = {
        configured: true,
        authenticated: true,
        syncedAt: new Date().toISOString(),
        academicYearLabel: auth.academicYearLabel,
        announcements: uniqueAnnouncements,
        rules: uniqueRules,
        discoveredSections
      };
      this.cachedOverview = { data: payload, timestamp: Date.now() };
      return payload;
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghubungi portal SITATIB';
      this.lastError = msg;
      console.error('[SITATIB] Sync failed:', msg);
      if (this.cachedOverview) {
        return {
          ...this.cachedOverview.data,
          error: `Menampilkan cache terakhir (${msg})`
        };
      }
      return {
        configured: true,
        authenticated: false,
        syncedAt: new Date().toISOString(),
        announcements: [],
        rules: [],
        error: msg
      };
    }
  }
}

export const sitatibService = new SitatibService();
