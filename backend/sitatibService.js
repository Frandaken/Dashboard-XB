import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const DEFAULT_BASE_URL = 'https://sitatib.sma.putranirmala.sch.id';
const CACHE_TTL_MS = 30 * 1000; // 30 seconds so newly posted announcements appear automatically without stale 5-minute cache

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

const IGNORED_EXTERNAL_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdn.tailwindcss.com',
  'www.w3.org',
  'schema.org'
]);

function extractMainContentHtml(html) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let target = mainMatch ? mainMatch[1] : html;
  target = target
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  return target;
}

function buildSitatibAttachmentProxyUrl(absUrl, kind) {
  return `/api/sitatib/attachment?url=${encodeURIComponent(absUrl)}&kind=${kind}`;
}

function inferFilenameLabel(absUrl, fallback) {
  try {
    const parsed = new URL(absUrl);
    const seg = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '');
    if (seg && seg.includes('.')) {
      return sanitizeText(seg);
    }
  } catch {}
  return fallback;
}

function extractAnnouncementDetailFromHtml(html, pageUrl, baseUrl) {
  const attachments = [];
  const seenUrls = new Set();
  let baseOrigin = '';
  let pagePath = '';
  try {
    baseOrigin = new URL(baseUrl).origin;
    pagePath = new URL(pageUrl).pathname.replace(/\/+$/, '');
  } catch {}

  const mainHtml = extractMainContentHtml(html);

  const pushAttachment = (item) => {
    const dedupeKey = (item.sourceUrl || item.url).trim();
    if (!dedupeKey || seenUrls.has(dedupeKey)) return;
    seenUrls.add(dedupeKey);
    attachments.push({
      ...item,
      id: `att_${attachments.length + 1}`
    });
  };

  // 0. SITATIB preview buttons (<button data-preview-url="..." data-preview-title="...">)
  const previewElRegex = /<(?:button|a|div|span)\b([^>]*\bdata-preview-url=["'][^"']+["'][^>]*)>([\s\S]*?)<\/(?:button|a|div|span)>/gi;
  let previewMatch;
  while ((previewMatch = previewElRegex.exec(mainHtml)) !== null) {
    const attrs = previewMatch[1] || '';
    const innerLabel = sanitizeText(stripTags(previewMatch[2] || '').replace(/\s+/g, ' ').trim());
    const urlAttr = attrs.match(/\bdata-preview-url=["']([^"']+)["']/i);
    const titleAttr = attrs.match(/\bdata-preview-title=["']([^"']+)["']/i);
    const rawPreviewUrl = decodeHtmlEntities((urlAttr?.[1] || '').trim());
    const rawPreviewTitle = sanitizeText(decodeHtmlEntities((titleAttr?.[1] || '').trim()));
    if (!rawPreviewUrl) continue;

    let parsed;
    try {
      parsed = new URL(rawPreviewUrl, pageUrl);
      if (!/^https?:$/i.test(parsed.protocol)) continue;
    } catch {
      continue;
    }

    const absUrl = parsed.toString();
    const combined = `${absUrl} ${rawPreviewTitle} ${innerLabel}`.toLowerCase();
    const isImg = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i.test(combined);
    const isPdf = /\.pdf\b|pdf|dokumen/i.test(combined);
    const kind = isImg ? 'image' : isPdf ? 'pdf' : 'file';
    const isSameOrigin = Boolean(baseOrigin && parsed.origin === baseOrigin);
    const url = isSameOrigin
      ? buildSitatibAttachmentProxyUrl(absUrl, kind)
      : absUrl;
    const label = rawPreviewTitle || innerLabel || inferFilenameLabel(absUrl, 'Lampiran Surat (PDF)');

    pushAttachment({
      label,
      kind,
      url,
      sourceUrl: absUrl
    });
  }

  // 1. Embedded PDF / document viewers (<iframe src>, <embed src>, <object data>)
  const embedRegex = /<(?:iframe|embed|object)\b([^>]*?)(?:\b(?:src|data)=["']([^"']+)["'])([^>]*)>/gi;
  let embedMatch;
  while ((embedMatch = embedRegex.exec(mainHtml)) !== null) {
    const attrs = `${embedMatch[1] || ''} ${embedMatch[3] || ''}`;
    const rawSrc = decodeHtmlEntities((embedMatch[2] || '').trim());
    if (!rawSrc || /^(?:about:|javascript:|data:text\/html)/i.test(rawSrc)) continue;

    let absUrl = '';
    try {
      const parsed = new URL(rawSrc, pageUrl);
      if (!/^https?:$/i.test(parsed.protocol)) continue;
      if (IGNORED_EXTERNAL_HOSTS.has(parsed.hostname.toLowerCase())) continue;
      if (/recaptcha|doubleclick|googletagmanager/i.test(parsed.hostname)) continue;
      absUrl = parsed.toString();
    } catch {
      continue;
    }

    const isImg = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i.test(absUrl);
    const kind = isImg ? 'image' : 'pdf';
    const isSameOrigin = Boolean(baseOrigin && absUrl.startsWith(baseOrigin));
    const url = isSameOrigin ? buildSitatibAttachmentProxyUrl(absUrl, kind) : absUrl;
    const titleAttr = attrs.match(/\btitle=["']([^"']+)["']/i);
    const label = sanitizeText(
      stripTags(titleAttr ? titleAttr[1] : '') ||
      inferFilenameLabel(absUrl, 'Lampiran Surat (PDF)')
    );

    pushAttachment({
      label,
      kind,
      url,
      sourceUrl: absUrl
    });
  }

  // 2. Links inside announcement body (<a href="...">)
  const linkRegex = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(mainHtml)) !== null) {
    const attrs = `${linkMatch[1] || ''} ${linkMatch[3] || ''}`;
    const rawHref = decodeHtmlEntities((linkMatch[2] || '').trim());
    const anchorText = sanitizeText(stripTags(linkMatch[4] || '').replace(/\s+/g, ' ').trim());

    if (!rawHref || /^(?:#|javascript:|mailto:|tel:)/i.test(rawHref)) continue;

    let parsed;
    try {
      parsed = new URL(rawHref, pageUrl);
      if (!/^https?:$/i.test(parsed.protocol)) continue;
    } catch {
      continue;
    }

    const absUrl = parsed.toString();
    const cleanTargetPath = parsed.pathname.replace(/\/+$/, '');
    const isSameOrigin = parsed.origin === baseOrigin;

    if (isSameOrigin) {
      if (cleanTargetPath === pagePath) continue;
      if (
        /^\/(?:dashboard|pengumuman|notifikasi|tata-tertib|jadwal-kegiatan-kelas|pelanggaran|penghargaan|profil|logout|login|auth|ubah-password)(?:\/\d+)?$/i.test(
          cleanTargetPath
        )
      ) {
        continue;
      }
      if (/\/(konfirmasi|tandai|baca)\b/i.test(cleanTargetPath) && !/\.(pdf|jpe?g|png|webp|docx?|xlsx?)$/i.test(cleanTargetPath)) {
        continue;
      }
      if (/^kembali\b/i.test(anchorText)) continue;

      const isPdfTarget =
        /\.pdf(\?|$)/i.test(absUrl) ||
        /\bpdf\b/i.test(anchorText) ||
        /\/(?:pdf|lihat-pdf|download-pdf|view-pdf|surat)\b/i.test(cleanTargetPath);
      const isImgTarget = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i.test(absUrl);
      const isFileTarget =
        /\bdownload\b/i.test(attrs) ||
        /\.(docx?|xlsx?|pptx?|zip|rar|csv|txt)(\?|$)/i.test(absUrl) ||
        /\/(?:uploads?|files?|lampiran|attachment|download|unduh|berkas|dokumen)\b/i.test(cleanTargetPath) ||
        /\b(unduh|download|lampiran|lihat\s+(?:surat|file|lampiran)|buka\s+(?:file|lampiran)|dokumen)\b/i.test(anchorText);

      if (!isPdfTarget && !isImgTarget && !isFileTarget) {
        continue;
      }

      const kind = isImgTarget ? 'image' : isPdfTarget ? 'pdf' : 'file';
      const label = anchorText && anchorText.length > 1
        ? anchorText
        : inferFilenameLabel(absUrl, kind === 'pdf' ? 'Lampiran Surat (PDF)' : 'Lampiran Berkas');

      pushAttachment({
        label,
        kind,
        url: buildSitatibAttachmentProxyUrl(absUrl, kind),
        sourceUrl: absUrl
      });
    } else {
      const hostLower = parsed.hostname.toLowerCase();
      if (IGNORED_EXTERNAL_HOSTS.has(hostLower)) continue;
      if (isLikelyPersonalRecord(`${anchorText} ${absUrl}`)) continue;

      const isPdfTarget = /\.pdf(\?|$)/i.test(absUrl);
      const isImgTarget = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i.test(absUrl);
      const kind = isPdfTarget ? 'pdf' : isImgTarget ? 'image' : 'link';
      const label = anchorText && anchorText.length > 1
        ? anchorText
        : `Tautan: ${parsed.hostname.replace(/^www\./, '')}`;

      pushAttachment({
        label,
        kind,
        url: absUrl,
        sourceUrl: absUrl
      });
    }
  }

  // 3. Content images inside announcement (<img src="...">)
  const imgRegex = /<img\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(mainHtml)) !== null) {
    const attrs = `${imgMatch[1] || ''} ${imgMatch[3] || ''}`;
    const rawSrc = decodeHtmlEntities((imgMatch[2] || '').trim());
    if (!rawSrc || /^data:image\/svg/i.test(rawSrc)) continue;

    let parsed;
    try {
      parsed = new URL(rawSrc, pageUrl);
      if (!/^https?:$/i.test(parsed.protocol)) continue;
    } catch {
      continue;
    }

    const absUrl = parsed.toString();
    if (/logo|favicon|avatar|icon|sprite|spinner|loader/i.test(`${absUrl} ${attrs}`)) continue;

    const altMatch = attrs.match(/\balt=["']([^"']+)["']/i);
    const label = sanitizeText(stripTags(altMatch ? altMatch[1] : '')) || inferFilenameLabel(absUrl, 'Lampiran Gambar');
    const isSameOrigin = parsed.origin === baseOrigin;

    pushAttachment({
      label,
      kind: 'image',
      url: isSameOrigin ? buildSitatibAttachmentProxyUrl(absUrl, 'image') : absUrl,
      sourceUrl: absUrl
    });
  }

  // 4. Also scan bare https:// URLs written directly as plain text in letter body
  const contentContainerMatch =
    mainHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
    mainHtml.match(/<div\b[^>]*class=["'][^"']*(?:prose|card-body|announcement-content|isi-pengumuman|whitespace-pre-line)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const bodyHtml = contentContainerMatch ? contentContainerMatch[1] : mainHtml;

  const plainBodyText = stripTags(bodyHtml);
  const bareUrlRegex = /\bhttps?:\/\/[^\s<>"')\]}]+/gi;
  let bareMatch;
  while ((bareMatch = bareUrlRegex.exec(plainBodyText)) !== null) {
    const rawUrl = bareMatch[0].replace(/[.,;:!?)]+$/, '');
    try {
      const parsed = new URL(rawUrl);
      if (parsed.origin === baseOrigin) continue;
      if (IGNORED_EXTERNAL_HOSTS.has(parsed.hostname.toLowerCase())) continue;
      if (seenUrls.has(parsed.toString())) continue;
      const isPdfTarget = /\.pdf(\?|$)/i.test(parsed.pathname);
      const isImgTarget = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(parsed.pathname);
      pushAttachment({
        label: `Tautan: ${parsed.hostname.replace(/^www\./, '')}`,
        kind: isPdfTarget ? 'pdf' : isImgTarget ? 'image' : 'link',
        url: parsed.toString(),
        sourceUrl: parsed.toString()
      });
    } catch {}
  }

  return {
    attachments: attachments.slice(0, 12)
  };
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

function parseAnnouncementTimestamp(publishedAt) {
  const raw = (publishedAt || '').trim();
  if (!raw) return null;

  // 1. DD Mon YYYY [HH:mm[:ss]] (English or Indonesian month names, WIB +07:00)
  const dmyMatch = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = INDONESIAN_MONTH_MAP[dmyMatch[2].toLowerCase()];
    const year = dmyMatch[3];
    if (month) {
      const hh = (dmyMatch[4] || '12').padStart(2, '0');
      const mm = (dmyMatch[5] || '00').padStart(2, '0');
      const ss = (dmyMatch[6] || '00').padStart(2, '0');
      const ts = Date.parse(`${year}-${month}-${day}T${hh}:${mm}:${ss}+07:00`);
      if (Number.isFinite(ts)) return ts;
    }
  }

  // 2. YYYY-MM-DD [HH:mm[:ss]] or ISO-8601
  const isoDateTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/);
  if (isoDateTimeMatch) {
    const [, y, m, d, hh, mm, ss, tz] = isoDateTimeMatch;
    const hStr = (hh || '12').padStart(2, '0');
    const mStr = (mm || '00').padStart(2, '0');
    const sStr = (ss || '00').padStart(2, '0');
    const ts = Date.parse(`${y}-${m}-${d}T${hStr}:${mStr}:${sStr}${tz || '+07:00'}`);
    if (Number.isFinite(ts)) return ts;
  }

  // 3. DD/MM/YYYY [HH:mm] or DD-MM-YYYY [HH:mm]
  const slashMatch = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[\s,]+(\d{1,2}):(\d{2}))?/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    const hh = (slashMatch[4] || '12').padStart(2, '0');
    const mm = (slashMatch[5] || '00').padStart(2, '0');
    const ts = Date.parse(`${year}-${month}-${day}T${hh}:${mm}:00+07:00`);
    if (Number.isFinite(ts)) return ts;
  }

  // 4. Relative Indonesian timestamps
  const lower = raw.toLowerCase();
  const now = Date.now();
  if (/baru\s+saja|just\s+now/i.test(lower)) return now;
  const minsMatch = lower.match(/(\d+)\s*(?:menit|min)/);
  if (minsMatch) return now - parseInt(minsMatch[1], 10) * 60 * 1000;
  const hrsMatch = lower.match(/(\d+)\s*(?:jam|hour|hr)/);
  if (hrsMatch) return now - parseInt(hrsMatch[1], 10) * 60 * 60 * 1000;
  const daysMatch = lower.match(/(\d+)\s*(?:hari|day)/);
  if (daysMatch) return now - parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000;
  if (/hari\s+ini|today/.test(lower)) return now;
  if (/kemarin|yesterday/.test(lower)) return now - 24 * 60 * 60 * 1000;

  const fallback = Date.parse(raw);
  return Number.isFinite(fallback) ? fallback : null;
}

function sortAnnouncementsByNearestDate(items, nowMs = Date.now()) {
  return [...items]
    .map((item, idx) => ({
      item,
      idx,
      ts: parseAnnouncementTimestamp(item.publishedAt)
    }))
    .sort((a, b) => {
      if (a.ts === null && b.ts === null) return a.idx - b.idx;
      if (a.ts === null) return 1;
      if (b.ts === null) return -1;
      const distA = Math.abs(a.ts - nowMs);
      const distB = Math.abs(b.ts - nowMs);
      if (distA !== distB) return distA - distB;
      if (a.ts !== b.ts) return b.ts - a.ts;
      return a.idx - b.idx;
    })
    .map(entry => entry.item);
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
    this.inFlightOverview = null;
    this.inFlightAuth = null;
    this.sessionLoaded = false;
    this.academicYearLabel = undefined;
    this.lastSessionAt = null;
    this.loginCount = 0;
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

  getSessionFilePath() {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    return path.join(dataDir, 'sitatib-session.json');
  }

  loadPersistedSession(cfg) {
    if (this.sessionLoaded) return;
    this.sessionLoaded = true;
    try {
      const filePath = this.getSessionFilePath();
      if (!fs.existsSync(filePath)) return;
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (
        !raw ||
        raw.baseUrl !== cfg.baseUrl ||
        raw.username !== cfg.username ||
        raw.academicYearId !== cfg.academicYearId ||
        !raw.cookies ||
        typeof raw.cookies !== 'object'
      ) {
        return;
      }
      for (const [k, v] of Object.entries(raw.cookies)) {
        if (k && typeof v === 'string' && v.length > 0) {
          this.cookies.set(k, v);
        }
      }
      if (typeof raw.academicYearLabel === 'string' && raw.academicYearLabel) {
        this.academicYearLabel = raw.academicYearLabel;
      }
      if (typeof raw.lastSessionAt === 'string' && raw.lastSessionAt) {
        this.lastSessionAt = raw.lastSessionAt;
      }
    } catch {
      // Ignore corrupt/unreadable session cache; will re-authenticate cleanly
    }
  }

  persistSession(cfg) {
    try {
      const filePath = this.getSessionFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = {
        baseUrl: cfg.baseUrl,
        username: cfg.username,
        academicYearId: cfg.academicYearId,
        academicYearLabel: this.academicYearLabel || null,
        lastSessionAt: this.lastSessionAt,
        updatedAt: new Date().toISOString(),
        cookies: Object.fromEntries(this.cookies.entries())
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch {
      // Non-fatal if filesystem is read-only
    }
  }

  clearPersistedSession() {
    try {
      const filePath = this.getSessionFilePath();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }

  isConfigured() {
    return this.getConfig().configured;
  }

  clearCache() {
    if (this.cachedOverview) {
      this.cachedOverview.timestamp = 0;
    }
  }

  getHealthStatus() {
    const cfg = this.getConfig();
    this.loadPersistedSession(cfg);
    return {
      configured: cfg.configured,
      hasSession: this.cookies.size > 0,
      rememberDevice: true,
      cookieCount: this.cookies.size,
      loginCount: this.loginCount,
      lastSessionAt: this.lastSessionAt,
      lastSyncedAt: this.cachedOverview?.data.syncedAt || null,
      lastError: this.lastError
    };
  }

  absorbCookies(headers) {
    const rawCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);

    let changed = false;
    for (const entry of rawCookies) {
      const parts = entry.split(';');
      const pair = parts[0];
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        const isDeleted =
          !value ||
          value.toLowerCase() === 'deleted' ||
          parts.slice(1).some(attr => /^max-age\s*=\s*0$/i.test(attr.trim()));
        if (name) {
          if (isDeleted) {
            if (this.cookies.delete(name)) changed = true;
          } else if (this.cookies.get(name) !== value) {
            this.cookies.set(name, value);
            changed = true;
          }
        }
      }
    }

    if (changed && this.lastSessionAt) {
      const cfg = this.getConfig();
      if (cfg.configured) {
        this.persistSession(cfg);
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
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
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
    if (this.inFlightAuth) {
      return this.inFlightAuth;
    }

    const run = this.performAuthenticate().finally(() => {
      if (this.inFlightAuth === run) {
        this.inFlightAuth = null;
      }
    });
    this.inFlightAuth = run;
    return run;
  }

  async performAuthenticate() {
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

    // Detect "Ingat perangkat ini" checkbox (<input type="checkbox" name="remember_device" value="1">)
    const rememberInputMatch = loginPage.html.match(/<input\b[^>]*type=["']checkbox["'][^>]*name=["']([^"']*remember[^"']*)["'][^>]*>/i)
      || loginPage.html.match(/<input\b[^>]*name=["']([^"']*remember[^"']*)["'][^>]*type=["']checkbox["'][^>]*>/i);
    const rememberFieldName = rememberInputMatch ? rememberInputMatch[1] : 'remember_device';
    const rememberValueMatch = rememberInputMatch ? rememberInputMatch[0].match(/value=["']([^"']+)["']/i) : null;
    const rememberFieldValue = rememberValueMatch ? rememberValueMatch[1] : '1';

    const form = new URLSearchParams();
    if (csrfValue) {
      form.set(csrfName, csrfValue);
    }
    form.set('identity', cfg.username);
    form.set('password', cfg.password);
    form.set('academic_year_id', cfg.academicYearId);
    form.set(rememberFieldName, rememberFieldValue);

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
      this.clearPersistedSession();
      return {
        ok: false,
        dashboardHtml: '',
        dashboardUrl: postRes.finalUrl,
        academicYearLabel,
        error: 'Autentikasi SITATIB ditolak. Periksa kembali SITATIB_USERNAME, SITATIB_PASSWORD, dan tahun ajaran di env server.'
      };
    }

    this.loginCount += 1;
    this.academicYearLabel = academicYearLabel || this.academicYearLabel;
    this.lastSessionAt = new Date().toISOString();
    this.persistSession(cfg);
    return {
      ok: true,
      dashboardHtml: postRes.html,
      dashboardUrl: postRes.finalUrl,
      academicYearLabel: this.academicYearLabel
    };
  }

  async ensureAuthenticatedSession(cfg) {
    this.loadPersistedSession(cfg);

    if (this.cookies.size > 0) {
      try {
        const probe = await this.requestWithCookies(`${cfg.baseUrl}/dashboard`);
        if (!isLoginPageHtml(probe.html, probe.finalUrl) && probe.status < 400) {
          this.persistSession(cfg);
          return {
            ok: true,
            dashboardHtml: probe.html,
            dashboardUrl: probe.finalUrl,
            academicYearLabel: this.academicYearLabel
          };
        }
      } catch {
        // Fall back to fresh authentication below
      }
    }

    return this.authenticate();
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

  async fetchBinaryWithCookies(targetUrl, maxRedirects = 5) {
    const cfg = this.getConfig();
    const baseOrigin = new URL(cfg.baseUrl).origin;
    let currentUrl = targetUrl;

    for (let hop = 0; hop <= maxRedirects; hop++) {
      const parsed = new URL(currentUrl);
      if (parsed.origin !== baseOrigin) {
        throw new Error('Forbidden external asset origin');
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const cookieHeader = this.buildCookieHeader();
        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'DashboardXB-SITATIB-Proxy/1.0',
            Accept: 'application/pdf,image/*,application/octet-stream,*/*;q=0.8',
            ...(cookieHeader ? { Cookie: cookieHeader } : {})
          }
        });

        this.absorbCookies(res.headers);

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (location) {
            currentUrl = new URL(location, currentUrl).toString();
            continue;
          }
        }

        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        let contentType = res.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = res.headers.get('content-disposition') || '';

        if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
          contentType = 'application/pdf';
        }

        return {
          status: res.status,
          finalUrl: currentUrl,
          contentType,
          contentDisposition,
          buffer
        };
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('Too many redirects while fetching SITATIB attachment');
  }

  async proxyAuthenticatedAsset(rawUrl) {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      throw new Error('Kredensial SITATIB belum diatur di environment server.');
    }

    let parsed;
    try {
      parsed = new URL(rawUrl, cfg.baseUrl);
    } catch {
      throw new Error('URL lampiran tidak valid.');
    }

    const baseOrigin = new URL(cfg.baseUrl).origin;
    if (parsed.origin !== baseOrigin || !/^https?:$/i.test(parsed.protocol)) {
      throw new Error('Origin lampiran tidak diizinkan.');
    }

    if (/^\/(?:login|logout|auth)\b/i.test(parsed.pathname)) {
      throw new Error('Path lampiran tidak diizinkan.');
    }

    this.loadPersistedSession(cfg);
    if (this.cookies.size === 0) {
      const auth = await this.authenticate();
      if (!auth.ok) {
        throw new Error(auth.error || 'Autentikasi SITATIB gagal.');
      }
    }

    let result = await this.fetchBinaryWithCookies(parsed.toString());
    const looksLikeLoginHtml =
      result.finalUrl.toLowerCase().includes('/login') ||
      (result.contentType.includes('text/html') &&
        isLoginPageHtml(result.buffer.subarray(0, 4096).toString('utf8'), result.finalUrl));

    if (looksLikeLoginHtml || result.status === 401 || result.status === 403) {
      const auth = await this.authenticate();
      if (!auth.ok) {
        throw new Error(auth.error || 'Sesi SITATIB gagal diperbarui.');
      }
      result = await this.fetchBinaryWithCookies(parsed.toString());
    }

    let filename = 'lampiran-sitatib';
    const dispMatch = result.contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (dispMatch && dispMatch[1]) {
      try {
        filename = decodeURIComponent(dispMatch[1]).replace(/[/\\?%*:|"<>]/g, '_');
      } catch {
        filename = dispMatch[1].replace(/[/\\?%*:|"<>]/g, '_');
      }
    } else {
      const urlSeg = parsed.pathname.split('/').filter(Boolean).pop();
      if (urlSeg) {
        filename = urlSeg.replace(/[/\\?%*:|"<>]/g, '_');
      }
    }

    if (result.contentType.includes('application/pdf') && !filename.toLowerCase().endsWith('.pdf')) {
      filename = `${filename}.pdf`;
    }

    return {
      status: result.status,
      contentType: result.contentType,
      filename,
      buffer: result.buffer
    };
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

    if (!forceFresh && this.cachedOverview && this.cachedOverview.timestamp > 0 && Date.now() - this.cachedOverview.timestamp < CACHE_TTL_MS) {
      return {
        ...this.cachedOverview.data,
        announcements: sortAnnouncementsByNearestDate(this.cachedOverview.data.announcements)
      };
    }

    if (this.inFlightOverview) {
      return this.inFlightOverview;
    }

    const run = this.syncOverview(cfg).finally(() => {
      if (this.inFlightOverview === run) {
        this.inFlightOverview = null;
      }
    });
    this.inFlightOverview = run;
    return run;
  }

  async syncOverview(cfg) {
    try {
      const auth = await this.ensureAuthenticatedSession(cfg);
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

      const dedupedAnnouncements = [];
      const seenAnn = new Set();
      for (const item of allAnnouncements) {
        if (isIgnoredAnnouncementTitle(item.title)) continue;
        const key = `${item.title.toLowerCase()}::${item.content.slice(0, 60).toLowerCase()}`;
        if (!seenAnn.has(key) && item.content) {
          seenAnn.add(key);
          dedupedAnnouncements.push(item);
        }
      }

      const uniqueAnnouncements = sortAnnouncementsByNearestDate(dedupedAnnouncements).map((item, idx) => ({
        ...item,
        id: `ann_${idx + 1}`
      }));

      const detailTargets = uniqueAnnouncements
        .filter(a => a.sourceUrl && /\/pengumuman\/\d+/i.test(a.sourceUrl))
        .slice(0, 15);

      await Promise.all(
        detailTargets.map(async ann => {
          if (!ann.sourceUrl) return;
          try {
            const detailPage = await this.fetchAuthenticatedPage(ann.sourceUrl);
            if (!detailPage.contentType.includes('application/json')) {
              const detail = extractAnnouncementDetailFromHtml(
                detailPage.html,
                detailPage.finalUrl,
                cfg.baseUrl
              );
              if (detail.attachments.length > 0) {
                ann.attachments = detail.attachments;
              }
            }
          } catch (detailErr) {
            console.warn(`[SITATIB] Skip announcement detail ${ann.sourceUrl}:`, detailErr?.message || detailErr);
          }
        })
      );

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
