import { URL } from 'url';

const DEFAULT_BASE_URL = 'https://sitatib.sma.putranirmala.sch.id';
const CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeEnv = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

function decodeHtmlEntities(input) {
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

function isLoginPageHtml(html, finalUrl = '') {
  const lowerUrl = finalUrl.toLowerCase();
  if (lowerUrl.includes('/login') || lowerUrl.includes('/auth')) {
    return true;
  }
  return /name=["']identity["']|action=["'][^"']*\/login["']|Masuk ke SITATIB/i.test(html);
}

function sanitizeText(text) {
  return (text || '')
    .replace(/\b\d{8,14}\b/g, (m) => (m.length >= 10 ? '[NIS]' : m))
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .trim();
}

function isLikelyPersonalRecord(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes('riwayat pelanggaran saya') ||
    lower.includes('catatan pribadi') ||
    lower.includes('nisn') ||
    lower.includes('ubah password')
  );
}

function parseTableRows(tableHtml) {
  const rows = [];
  const trMatches = tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const cells = [];
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

function extractRulesFromHtml(html) {
  const rules = [];
  const seen = new Set();

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
      const pointType =
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

function isIgnoredAnnouncementTitle(title) {
  const normalized = (title || '').trim().toLowerCase();
  return (
    normalized === 'materi baru di ruang kelas' ||
    normalized === 'tugas baru di ruang kelas'
  );
}

function extractAnnouncementsFromHtml(html, sourceUrl) {
  const announcements = [];
  const seen = new Set();
  const isNotifPage = Boolean(sourceUrl && /notifikasi|notif/i.test(sourceUrl));

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

    const tags = [];
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

  const notifLinks = html.match(/<a\b[^>]*href=["'][^"']*\/notifikasi\/buka\/\d+[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const block of notifLinks) {
    const hrefMatch = block.match(/href=["']([^"']+)["']/i);
    const itemUrl = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : sourceUrl;
    const fullText = stripTags(block);

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

const INDONESIAN_MONTH_MAP = {
  januari: '01', jan: '01', january: '01',
  februari: '02', feb: '02', pebruari: '02', february: '02',
  maret: '03', mar: '03', march: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06', june: '06',
  juli: '07', jul: '07', july: '07',
  agustus: '08', agu: '08', agt: '08', aug: '08', august: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', okt: '10', oct: '10', october: '10',
  november: '11', nov: '11', nopember: '11', nop: '11',
  desember: '12', des: '12', dec: '12', december: '12'
};

function getTodayWIBISO() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {}
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function parseIndonesianDateToISO(dateStr) {
  const clean = (dateStr || '').trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dmyMatch = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!dmyMatch) return null;

  const day = dmyMatch[1].padStart(2, '0');
  const monthKey = dmyMatch[2].toLowerCase();
  const month = INDONESIAN_MONTH_MAP[monthKey];
  const year = dmyMatch[3];
  if (!month) return null;

  return `${year}-${month}-${day}`;
}

function extractClassActivitiesFromHtml(html, baseUrl, sourceUrl) {
  const activities = [];
  const seen = new Set();
  const todayISO = getTodayWIBISO();

  const articleRegex = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const attrs = match[1] || '';
    const innerHtml = match[2] || '';
    const fullText = stripTags(innerHtml);

    if (!fullText || isLikelyPersonalRecord(fullText)) continue;

    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const articleId = idMatch ? idMatch[1].trim() : '';

    const hMatch = innerHtml.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = sanitizeText(stripTags(hMatch ? hMatch[1] : ''));
    if (!title || title.length < 2) continue;

    const paragraphs = [];
    const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(innerHtml)) !== null) {
      const pText = sanitizeText(stripTags(pMatch[1]));
      if (pText) paragraphs.push(pText);
    }

    const dateParagraph = paragraphs.find(p => /\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}/.test(p)) || '';
    let dateLabel = '';
    let timeLabel;

    if (dateParagraph) {
      const dotParts = dateParagraph.split(/\s*[·•]\s*/);
      dateLabel = dotParts[0]?.trim() || dateParagraph;
      if (dotParts.length > 1) {
        timeLabel = dotParts.slice(1).join(' · ').trim() || undefined;
      }
    }

    const foundDates = [];
    const dateTokenRegex = /(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/g;
    let dMatch;
    const dateSearchTarget = dateParagraph || fullText;
    while ((dMatch = dateTokenRegex.exec(dateSearchTarget)) !== null) {
      const parsedIso = parseIndonesianDateToISO(dMatch[1]);
      if (parsedIso) foundDates.push(parsedIso);
    }

    if (foundDates.length === 0) continue;

    const startDate = foundDates[0];
    const endDate = foundDates.length > 1 && foundDates[foundDates.length - 1] >= startDate
      ? foundDates[foundDates.length - 1]
      : startDate;

    let className;
    let organizer;
    let description;

    const remainingParagraphs = paragraphs.filter(p => p !== dateParagraph);
    if (remainingParagraphs.length > 0) {
      const metaCandidate = remainingParagraphs[0];
      if (!metaCandidate.includes('\n') && metaCandidate.length <= 120 && metaCandidate.includes('·')) {
        const metaParts = metaCandidate.split(/\s*[·•]\s*/).map(s => s.trim()).filter(Boolean);
        className = metaParts[0] || undefined;
        organizer = metaParts.slice(1).join(' · ') || undefined;
        if (remainingParagraphs.length > 1) {
          description = remainingParagraphs.slice(1).join('\n').trim() || undefined;
        }
      } else {
        description = remainingParagraphs.join('\n').trim() || undefined;
      }
    }

    const hasPastBadge = /\b(?:sudah berlalu|selesai|berakhir)\b/i.test(innerHtml);
    const isPast = hasPastBadge || endDate < todayISO;
    const itemSourceUrl = articleId
      ? `${sourceUrl.split('#')[0]}#${articleId}`
      : `${baseUrl}/jadwal-kegiatan-kelas`;

    const dedupeKey = articleId || `${startDate}::${endDate}::${title.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    activities.push({
      id: articleId || `sitatib_act_${activities.length + 1}`,
      title,
      startDate,
      endDate,
      dateLabel: dateLabel || startDate,
      timeLabel,
      className,
      organizer,
      description,
      isPast,
      sourceUrl: itemSourceUrl
    });
  }

  return activities.slice(0, 150);
}

function discoverInternalLinks(html, baseUrl) {
  const sections = [];
  const seen = new Set();
  const linkRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

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
      /(pengumuman|notifikasi|notif|berita|informasi|tata.?tertib|peraturan|pasal|aturan|kategori|poin|dashboard|beranda|jadwal|kegiatan|agenda|kalender)/i.test(
        `${resolvedPath} ${label}`
      )
    ) {
      if (!seen.has(resolvedPath)) {
        seen.add(resolvedPath);
        sections.push({ label, path: resolvedPath });
      }
    }
  }

  return sections.slice(0, 25);
}

export class SitatibService {
  constructor() {
    this.cookies = new Map();
    this.cachedOverview = null;
    this.lastSessionAt = null;
    this.lastError = null;
  }

  getConfig() {
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

  isConfigured() {
    return this.getConfig().configured;
  }

  clearCache() {
    this.cachedOverview = null;
  }

  getHealthStatus() {
    const cfg = this.getConfig();
    return {
      configured: cfg.configured,
      hasSession: this.cookies.size > 0,
      lastSessionAt: this.lastSessionAt,
      lastSyncedAt: this.cachedOverview?.data.syncedAt || null,
      lastError: this.lastError
    };
  }

  absorbCookies(headers) {
    const rawCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);

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

  buildCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async requestWithCookies(url, init = {}, maxRedirects = 5) {
    let currentUrl = url;
    let currentMethod = (init.method || 'GET').toUpperCase();
    let currentBody = init.body;
    let extraHeaders = init.headers || {};

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

  async authenticate() {
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

  async fetchAuthenticatedPage(targetUrl) {
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

  async getOverview(forceFresh = false) {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      return {
        configured: false,
        authenticated: false,
        syncedAt: new Date().toISOString(),
        announcements: [],
        rules: [],
        activities: [],
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
          activities: [],
          error: this.lastError
        };
      }

      const discoveredSections = discoverInternalLinks(auth.dashboardHtml, cfg.baseUrl).filter(
        sec => !/\/pelanggaran\/\d+/i.test(sec.path)
      );
      const allAnnouncements = [];
      const allRules = [];
      const allActivities = [];

      const announcementUrls = new Set([
        `${cfg.baseUrl}/pengumuman`,
        `${cfg.baseUrl}/notifikasi`
      ]);
      const rulesUrls = new Set([
        `${cfg.baseUrl}/tata-tertib`
      ]);
      const activityUrls = new Set([
        `${cfg.baseUrl}/jadwal-kegiatan-kelas`
      ]);

      if (cfg.announcementsUrl) {
        announcementUrls.add(new URL(cfg.announcementsUrl, cfg.baseUrl).toString());
      }
      if (cfg.rulesUrl) {
        rulesUrls.add(new URL(cfg.rulesUrl, cfg.baseUrl).toString());
      }

      for (const sec of discoveredSections) {
        const lowerPath = sec.path.toLowerCase();
        if (/\/(pelanggaran|penghargaan|dashboard|profil)/i.test(lowerPath)) continue;

        const fullSecUrl = new URL(sec.path, cfg.baseUrl).toString();
        if (/(jadwal.?kegiatan|kegiatan.?kelas|kalender.?kegiatan)/i.test(`${sec.label} ${sec.path}`)) {
          activityUrls.add(fullSecUrl);
        } else if (/(pengumuman|notifikasi|notif|surat|berita|informasi)/i.test(`${sec.label} ${sec.path}`)) {
          announcementUrls.add(fullSecUrl);
        } else if (/(tata.?tertib|peraturan|pasal|aturan)/i.test(`${sec.label} ${sec.path}`)) {
          rulesUrls.add(fullSecUrl);
        }
      }

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
        } catch (pageErr) {
          console.warn(`[SITATIB] Skip announcement page ${url}:`, pageErr?.message || pageErr);
        }
      }

      const visitedRulesUrls = new Set();
      const rulesQueue = Array.from(rulesUrls).slice(0, 4);

      while (rulesQueue.length > 0 && visitedRulesUrls.size < 12) {
        const url = rulesQueue.shift();
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

            const pageLinkRegex = /<a\b[^>]*href=["']([^"']*(?:tata-tertib[^"']*[?&](?:page|hal)=|page=\d+)[^"']*)["'][^>]*>/gi;
            let pMatch;
            while ((pMatch = pageLinkRegex.exec(page.html)) !== null) {
              try {
                const nextUrl = new URL(decodeHtmlEntities(pMatch[1]), page.finalUrl).toString();
                if (nextUrl.startsWith(cfg.baseUrl) && nextUrl.includes('tata-tertib') && !visitedRulesUrls.has(nextUrl)) {
                  rulesQueue.push(nextUrl);
                }
              } catch {}
            }
          }
        } catch (pageErr) {
          console.warn(`[SITATIB] Skip rules page ${url}:`, pageErr?.message || pageErr);
        }
      }

      const visitedActivityUrls = new Set();
      const activityQueue = Array.from(activityUrls).slice(0, 4);

      while (activityQueue.length > 0 && visitedActivityUrls.size < 8) {
        const url = activityQueue.shift();
        if (visitedActivityUrls.has(url)) continue;
        visitedActivityUrls.add(url);

        try {
          const page = await this.fetchAuthenticatedPage(url);
          if (page.contentType.includes('application/json')) {
            const parsedJson = JSON.parse(page.html);
            if (Array.isArray(parsedJson?.activities)) {
              for (const act of parsedJson.activities) {
                const start = parseIndonesianDateToISO(String(act.startDate || act.tanggal || ''));
                if (!start) continue;
                allActivities.push({
                  id: String(act.id || `sitatib_act_${allActivities.length + 1}`),
                  title: sanitizeText(String(act.title || act.judul || 'Kegiatan SITATIB')),
                  startDate: start,
                  endDate: parseIndonesianDateToISO(String(act.endDate || '')) || start,
                  dateLabel: String(act.dateLabel || start),
                  timeLabel: act.timeLabel ? sanitizeText(String(act.timeLabel)) : undefined,
                  className: act.className ? sanitizeText(String(act.className)) : undefined,
                  organizer: act.organizer ? sanitizeText(String(act.organizer)) : undefined,
                  description: act.description ? sanitizeText(String(act.description)) : undefined,
                  isPast: Boolean(act.isPast),
                  sourceUrl: url
                });
              }
            }
          } else {
            allActivities.push(...extractClassActivitiesFromHtml(page.html, cfg.baseUrl, page.finalUrl));

            const pageLinkRegex = /<a\b[^>]*href=["']([^"']*jadwal-kegiatan[^"']*[?&](?:page|hal)=[^"']*)["'][^>]*>/gi;
            let pMatch;
            while ((pMatch = pageLinkRegex.exec(page.html)) !== null) {
              try {
                const nextUrl = new URL(decodeHtmlEntities(pMatch[1]), page.finalUrl).toString();
                if (nextUrl.startsWith(cfg.baseUrl) && nextUrl.includes('jadwal-kegiatan') && !visitedActivityUrls.has(nextUrl)) {
                  activityQueue.push(nextUrl);
                }
              } catch {}
            }
          }
        } catch (pageErr) {
          console.warn(`[SITATIB] Skip activity page ${url}:`, pageErr?.message || pageErr);
        }
      }

      const uniqueAnnouncements = [];
      const seenAnn = new Set();
      for (const item of allAnnouncements) {
        if (isIgnoredAnnouncementTitle(item.title)) continue;
        const key = `${item.title.toLowerCase()}::${item.content.slice(0, 60).toLowerCase()}`;
        if (!seenAnn.has(key) && item.content) {
          seenAnn.add(key);
          uniqueAnnouncements.push({ ...item, id: `ann_${uniqueAnnouncements.length + 1}` });
        }
      }

      const uniqueRules = [];
      const seenRules = new Set();
      for (const rule of allRules) {
        const key = `${rule.codeOrNumber.toLowerCase()}::${rule.title.toLowerCase()}`;
        if (!seenRules.has(key) && rule.title) {
          seenRules.add(key);
          uniqueRules.push({ ...rule, id: `rule_${uniqueRules.length + 1}` });
        }
      }

      const uniqueActivities = [];
      const seenActivities = new Set();
      for (const act of allActivities) {
        const key = `${act.id}::${act.startDate}::${act.title.toLowerCase()}`;
        if (!seenActivities.has(key) && act.title && act.startDate) {
          seenActivities.add(key);
          uniqueActivities.push(act);
        }
      }

      uniqueActivities.sort((a, b) => {
        const aPast = Boolean(a.isPast);
        const bPast = Boolean(b.isPast);
        if (aPast !== bPast) return aPast ? 1 : -1;
        if (!aPast) return a.startDate.localeCompare(b.startDate);
        return b.startDate.localeCompare(a.startDate);
      });

      this.lastError = null;
      const payload = {
        configured: true,
        authenticated: true,
        syncedAt: new Date().toISOString(),
        academicYearLabel: auth.academicYearLabel,
        announcements: uniqueAnnouncements,
        rules: uniqueRules,
        activities: uniqueActivities,
        discoveredSections
      };
      this.cachedOverview = { data: payload, timestamp: Date.now() };
      return payload;
    } catch (err) {
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
        activities: [],
        error: msg
      };
    }
  }
}

export const sitatibService = new SitatibService();
