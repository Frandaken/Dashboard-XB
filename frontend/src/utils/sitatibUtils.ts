import { SitatibAnnouncement, SitatibClassActivity } from '../types';
import { stepISODate } from './dateUtils';

const SITATIB_MONTH_MAP: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11
};

function buildWibTimestamp(
  year: number,
  monthIdx: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number | null {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIdx) ||
    !Number.isFinite(day) ||
    monthIdx < 0 ||
    monthIdx > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, '0');
  const mi = String(Math.max(0, Math.min(59, minute))).padStart(2, '0');
  const ss = String(Math.max(0, Math.min(59, second))).padStart(2, '0');
  const ts = Date.parse(`${year}-${mm}-${dd}T${hh}:${mi}:${ss}+07:00`);
  return Number.isNaN(ts) ? null : ts;
}

/**
 * Parses SITATIB announcement date labels (e.g. "17 Nov 2026 14:45", "23 Okt 2026",
 * ISO timestamps, DD/MM/YYYY, or relative Indonesian phrases) into epoch milliseconds.
 */
export function parseSitatibAnnouncementTimestamp(
  publishedAt?: string,
  nowMs: number = Date.now()
): number | null {
  if (!publishedAt) return null;
  const cleaned = publishedAt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  if (/baru\s+saja|just\s+now/.test(lower)) {
    return nowMs;
  }
  const relMin = lower.match(/(\d+)\s*(?:menit|mnt|min(?:ute)?s?)\s*(?:yang\s+)?(?:lalu|ago)/);
  if (relMin) return nowMs - Number(relMin[1]) * 60 * 1000;

  const relHour = lower.match(/(\d+)\s*(?:jam|hours?|hrs?)\s*(?:yang\s+)?(?:lalu|ago)/);
  if (relHour) return nowMs - Number(relHour[1]) * 60 * 60 * 1000;

  const relDay = lower.match(/(\d+)\s*(?:hari|days?)\s*(?:yang\s+)?(?:lalu|ago)/);
  if (relDay) return nowMs - Number(relDay[1]) * 24 * 60 * 60 * 1000;

  if (/\bhari\s+ini\b|\btoday\b/.test(lower)) {
    const timeMatch = lower.match(/(\d{1,2})[:.](\d{2})/);
    const nowWib = new Date(nowMs + 7 * 60 * 60 * 1000);
    return buildWibTimestamp(
      nowWib.getUTCFullYear(),
      nowWib.getUTCMonth(),
      nowWib.getUTCDate(),
      timeMatch ? Number(timeMatch[1]) : nowWib.getUTCHours(),
      timeMatch ? Number(timeMatch[2]) : nowWib.getUTCMinutes()
    );
  }

  if (/\bkemarin\b|\byesterday\b/.test(lower)) {
    const timeMatch = lower.match(/(\d{1,2})[:.](\d{2})/);
    const yestWib = new Date(nowMs + 7 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
    return buildWibTimestamp(
      yestWib.getUTCFullYear(),
      yestWib.getUTCMonth(),
      yestWib.getUTCDate(),
      timeMatch ? Number(timeMatch[1]) : 12,
      timeMatch ? Number(timeMatch[2]) : 0
    );
  }

  // DD Mon YYYY [HH:mm[:ss]]
  const namedMatch = cleaned.match(
    /(\d{1,2})\s+([A-Za-z]{3,12})\s+(\d{4})(?:[\s,]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?/i
  );
  if (namedMatch) {
    const monthIdx = SITATIB_MONTH_MAP[namedMatch[2].toLowerCase()];
    if (monthIdx !== undefined) {
      return buildWibTimestamp(
        Number(namedMatch[3]),
        monthIdx,
        Number(namedMatch[1]),
        namedMatch[4] ? Number(namedMatch[4]) : 0,
        namedMatch[5] ? Number(namedMatch[5]) : 0,
        namedMatch[6] ? Number(namedMatch[6]) : 0
      );
    }
  }

  // ISO YYYY-MM-DD [HH:mm[:ss]]
  const isoMatch = cleaned.match(
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (isoMatch) {
    return buildWibTimestamp(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      isoMatch[4] ? Number(isoMatch[4]) : 0,
      isoMatch[5] ? Number(isoMatch[5]) : 0,
      isoMatch[6] ? Number(isoMatch[6]) : 0
    );
  }

  // DD/MM/YYYY or DD-MM-YYYY [HH:mm[:ss]]
  const dmyMatch = cleaned.match(
    /(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[\s,]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?/
  );
  if (dmyMatch) {
    return buildWibTimestamp(
      Number(dmyMatch[3]),
      Number(dmyMatch[2]) - 1,
      Number(dmyMatch[1]),
      dmyMatch[4] ? Number(dmyMatch[4]) : 0,
      dmyMatch[5] ? Number(dmyMatch[5]) : 0,
      dmyMatch[6] ? Number(dmyMatch[6]) : 0
    );
  }

  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Sorts SITATIB announcements by nearest date to current time (ascending |ts - now|),
 * breaking ties in favor of the newer timestamp and placing items without valid dates last.
 */
export function sortSitatibAnnouncementsByNearestDate(
  items?: SitatibAnnouncement[],
  nowMs: number = Date.now()
): SitatibAnnouncement[] {
  if (!items || items.length <= 1) return items ? [...items] : [];

  return items
    .map((item, idx) => ({
      item,
      idx,
      ts: parseSitatibAnnouncementTimestamp(item.publishedAt, nowMs)
    }))
    .sort((a, b) => {
      if (a.ts === null && b.ts === null) return a.idx - b.idx;
      if (a.ts === null) return 1;
      if (b.ts === null) return -1;

      const distA = Math.abs(a.ts - nowMs);
      const distB = Math.abs(b.ts - nowMs);
      if (distA !== distB) return distA - distB;
      if (b.ts !== a.ts) return b.ts - a.ts;
      return a.idx - b.idx;
    })
    .map(entry => entry.item);
}

/**
 * Indexes SITATIB class activities by ISO date (YYYY-MM-DD), expanding multi-day
 * spans cleanly while staying strictly separate from Google Calendar iCal feeds.
 */
export function buildSitatibActivitiesByDate(
  activities?: SitatibClassActivity[]
): Record<string, SitatibClassActivity[]> {
  const map: Record<string, SitatibClassActivity[]> = {};
  if (!activities || activities.length === 0) return map;

  for (const act of activities) {
    if (!act?.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(act.startDate)) continue;
    const endIso = act.endDate && /^\d{4}-\d{2}-\d{2}$/.test(act.endDate) && act.endDate >= act.startDate
      ? act.endDate
      : act.startDate;

    let current = act.startDate;
    let guard = 0;
    while (current <= endIso && guard < 60) {
      guard++;
      if (!map[current]) {
        map[current] = [];
      }
      if (!map[current].some(existing => existing.id === act.id && existing.title === act.title)) {
        map[current].push(act);
      }
      current = stepISODate(current, 1);
    }
  }

  return map;
}
