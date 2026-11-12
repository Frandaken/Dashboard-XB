import fs from 'fs';
import path from 'path';
import ICAL from 'ical.js';
import webpush from 'web-push';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
}

export interface TomorrowScheduleData {
  targetDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Kamis, 29 Oktober 2026"
  dayOfWeekName: string;
  pelajaranList: string[];
  noticeList: { title: string; dayIndex: number; totalDays: number; location?: string }[];
  sumatifList: { subject: string; title: string; details?: string }[];
  prList: { subject: string; title: string; details?: string }[];
  agendaList: { subject: string; title: string; details?: string }[];
  piketList: string[];
  mbgList: string[];
  doaPetugas: {
    doaPagi?: string;
    renungan?: string;
    malaikatTuhan?: string;
    doaPenutup?: string;
  };
  iceBreakingList: string[];
  hasSchedule: boolean;
  notification: NotificationPayload;
}

const DOW_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Returns current date and time in WIB (Asia/Jakarta, UTC+7).
 */
export function getWIBNow(): {
  dateObj: Date;
  iso: string;
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
  dowName: string;
  formattedDate: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  let y = 2026, mo = 10, d = 28, h = 19, mi = 0, s = 0;

  for (const part of parts) {
    if (part.type === 'year') y = parseInt(part.value, 10);
    else if (part.type === 'month') mo = parseInt(part.value, 10);
    else if (part.type === 'day') d = parseInt(part.value, 10);
    else if (part.type === 'hour') h = parseInt(part.value, 10);
    else if (part.type === 'minute') mi = parseInt(part.value, 10);
    else if (part.type === 'second') s = parseInt(part.value, 10);
  }

  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const dayOfWeek = noonUTC.getUTCDay();
  const dowName = DOW_ID[dayOfWeek];
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const formattedDate = `${dowName}, ${d} ${MONTH_ID[mo - 1]} ${y}`;

  return {
    dateObj: noonUTC,
    iso,
    year: y,
    month: mo - 1,
    day: d,
    hour: h,
    minute: mi,
    second: s,
    dayOfWeek,
    dowName,
    formattedDate
  };
}

/**
 * Returns tomorrow's date parts in WIB.
 */
export function getTomorrowWIB(referenceDate?: Date): {
  iso: string;
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  dowName: string;
  formattedDate: string;
} {
  const current = getWIBNow();
  const baseDate = referenceDate || current.dateObj;
  // Step 1 day forward in UTC
  const tomorrowUTC = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);

  const y = tomorrowUTC.getUTCFullYear();
  const mo = tomorrowUTC.getUTCMonth(); // 0-indexed
  const d = tomorrowUTC.getUTCDate();
  const dayOfWeek = tomorrowUTC.getUTCDay();
  const dowName = DOW_ID[dayOfWeek];
  const iso = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const formattedDate = `${dowName}, ${d} ${MONTH_ID[mo]} ${y}`;

  return { iso, year: y, month: mo, day: d, dayOfWeek, dowName, formattedDate };
}

/**
 * Helper to parse CSV into rows of record objects
 */
function parseSimpleCSV(text: string): Record<string, string>[] {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQ = false;
        } else {
          cur += c;
        }
      } else {
        if (c === '"') {
          inQ = true;
        } else if (c === ',') {
          res.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
    }
    res.push(cur.trim());
    return res;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] || '').trim();
    });
    return obj;
  });
}

function cleanDescriptionText(desc: string): { title: string; details?: string } {
  if (!desc) return { title: '' };
  const clean = desc
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return { title: desc.trim() };
  return {
    title: lines[0],
    details: lines.slice(1).join(' ').trim() || undefined
  };
}

/**
 * Compiles tomorrow's schedule and creates the 19:00 WIB push notification
 */
export async function buildTomorrowNotification(
  targetISODate?: string,
  fetchFn?: (url: string) => Promise<string>,
  calendarFeeds?: Record<string, string>,
  sheetFeeds?: Record<string, string>
): Promise<TomorrowScheduleData> {
  const tomorrow = targetISODate
    ? (() => {
        const parts = targetISODate.split('-').map(Number);
        const y = parts[0] || 2026;
        const mo = (parts[1] || 10) - 1;
        const d = parts[2] || 29;
        const noon = new Date(Date.UTC(y, mo, d, 12, 0, 0));
        const dow = noon.getUTCDay();
        return {
          iso: targetISODate,
          year: y,
          month: mo,
          day: d,
          dayOfWeek: dow,
          dowName: DOW_ID[dow],
          formattedDate: `${DOW_ID[dow]}, ${d} ${MONTH_ID[mo]} ${y}`
        };
      })()
    : getTomorrowWIB();

  const targetDateKey = tomorrow.iso;
  const targetDDMMYYYY = `${String(tomorrow.day).padStart(2, '0')}/${String(tomorrow.month + 1).padStart(2, '0')}/${tomorrow.year}`;

  const defaultFetch = async (url: string) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'KelasXB-PushService/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  };
  const doFetch = fetchFn || defaultFetch;

  // 1. Fetch Pelajaran Calendar
  const calUrl = calendarFeeds?.pelajaran || "https://calendar.google.com/calendar/ical/a4fd56ccb6ac7cde9478e4d863191dd53cd12c6110fe380d6bf279da0e44dc8e%40group.calendar.google.com/private-f67cd9352a27790460116ba8a612434c/basic.ics";
  
  const pelajaranList: string[] = [];
  const noticeList: { title: string; dayIndex: number; totalDays: number; location?: string }[] = [];
  const sumatifList: { subject: string; title: string; details?: string }[] = [];
  const prList: { subject: string; title: string; details?: string }[] = [];
  const agendaList: { subject: string; title: string; details?: string }[] = [];

  try {
    const icsText = await doFetch(calUrl);
    if (icsText && icsText.includes('BEGIN:VCALENDAR')) {
      const jcal = ICAL.parse(icsText);
      const comp = new ICAL.Component(jcal);
      const vevents = comp.getAllSubcomponents('vevent');

      const targetParts = targetDateKey.split('-').map(Number);
      const targetStart = ICAL.Time.fromJSDate(new Date(Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2], 0, 0, 0)));
      const targetEnd = ICAL.Time.fromJSDate(new Date(Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2], 23, 59, 59)));

      for (const vevent of vevents) {
        const ev = new ICAL.Event(vevent);
        const summary = (ev.summary || '').trim();
        const desc = (ev.description || '').trim();
        const cleanName = summary.replace(/\s*-\s*JP\s*\d+/gi, '').trim() || summary || 'Pelajaran';

        // Check if event is all-day or multi-day
        const st = ev.startDate;
        const et = ev.endDate;
        if (st) {
          const isAllDay = Boolean(st.isDate);
          let isMultiDayOrAllDay = false;
          const eventDates: string[] = [];
          const startDKey = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;

          if (isAllDay) {
            isMultiDayOrAllDay = true;
            if (et && et.isDate) {
              const startUtc = Date.UTC(st.year, st.month - 1, st.day, 12, 0, 0);
              const endUtc = Date.UTC(et.year, et.month - 1, et.day, 12, 0, 0);
              const diffDays = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));
              for (let i = 0; i < Math.max(1, diffDays); i++) {
                const cur = new Date(startUtc + i * 24 * 60 * 60 * 1000);
                const y = cur.getUTCFullYear();
                const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
                const d = String(cur.getUTCDate()).padStart(2, '0');
                eventDates.push(`${y}-${m}-${d}`);
              }
            } else {
              eventDates.push(startDKey);
            }
          } else if (et) {
            const startUtc = Date.UTC(st.year, st.month - 1, st.day, st.hour || 0, st.minute || 0, 0);
            const endUtc = Date.UTC(et.year, et.month - 1, et.day, et.hour || 0, et.minute || 0, 0);
            const durSec = (endUtc - startUtc) / 1000;
            const endsAtMidnight = et.hour === 0 && et.minute === 0 && et.second === 0;
            const effectiveEndUtc = endsAtMidnight ? endUtc - 1000 : endUtc;
            const effEndDate = new Date(effectiveEndUtc);
            const effEndDKey = `${effEndDate.getUTCFullYear()}-${String(effEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(effEndDate.getUTCDate()).padStart(2, '0')}`;
            if (durSec >= 86400 || startDKey !== effEndDKey) {
              isMultiDayOrAllDay = true;
              let curUtc = Date.UTC(st.year, st.month - 1, st.day, 12, 0, 0);
              const limitUtc = Date.UTC(effEndDate.getUTCFullYear(), effEndDate.getUTCMonth(), effEndDate.getUTCDate(), 12, 0, 0);
              while (curUtc <= limitUtc && eventDates.length < 365) {
                const curDate = new Date(curUtc);
                const y = curDate.getUTCFullYear();
                const m = String(curDate.getUTCMonth() + 1).padStart(2, '0');
                const d = String(curDate.getUTCDate()).padStart(2, '0');
                eventDates.push(`${y}-${m}-${d}`);
                curUtc += 24 * 60 * 60 * 1000;
              }
            }
          }

          if (isMultiDayOrAllDay) {
            const dateIdx = eventDates.indexOf(targetDateKey);
            if (dateIdx !== -1) {
              if (!noticeList.some(n => n.title.toLowerCase() === summary.toLowerCase())) {
                noticeList.push({
                  title: summary,
                  dayIndex: dateIdx + 1,
                  totalDays: eventDates.length,
                  location: ev.location ? ev.location.trim() : undefined
                });
              }
            }
            // Do not add all-day or multi-day events as lesson periods
            continue;
          }
        }

        let matchesDate = false;

        if (ev.isRecurring()) {
          try {
            const it = ev.iterator();
            let next: any;
            let count = 0;
            while ((next = it.next()) && count < 250) {
              count++;
              if (next.compare(targetEnd) > 0) break;
              if (next.compare(targetStart) >= 0) {
                matchesDate = true;
                break;
              }
            }
          } catch {}
        } else if (ev.startDate) {
          const st = ev.startDate;
          const dKey = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
          if (dKey === targetDateKey) {
            matchesDate = true;
          }
        }

        if (matchesDate) {
          if (!pelajaranList.includes(cleanName)) {
            pelajaranList.push(cleanName);
          }

          if (desc) {
            const parsed = cleanDescriptionText(desc);
            const lowerDesc = desc.toLowerCase();

            // 1. Keyword sumatif / ulangan / asesmen
            if (
              lowerDesc.includes('sumatif') ||
              lowerDesc.includes('ulangan') ||
              lowerDesc.includes('asesmen') ||
              /\buh\b/i.test(desc) ||
              /\bph\b/i.test(desc)
            ) {
              if (!sumatifList.some(s => s.subject === cleanName && s.title === parsed.title)) {
                sumatifList.push({ subject: cleanName, title: parsed.title, details: parsed.details });
              }
            }
            // 2. Keyword PR / tugas
            else if (
              /\bpr\b/i.test(desc) ||
              lowerDesc.includes('pekerjaan rumah') ||
              lowerDesc.includes('tugas')
            ) {
              if (!prList.some(p => p.subject === cleanName && p.title === parsed.title)) {
                prList.push({ subject: cleanName, title: parsed.title, details: parsed.details });
              }
            }
            // 3. Agenda lain (seperti "Melanjutkan Miniatur")
            else {
              if (!agendaList.some(a => a.subject === cleanName && a.title === parsed.title)) {
                agendaList.push({ subject: cleanName, title: parsed.title, details: parsed.details });
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('buildTomorrowNotification: Could not parse calendar:', err.message);
  }

  // 2. Fetch Piket from Sheets
  const piketList: string[] = [];
  try {
    const piketUrl = sheetFeeds?.piket || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1149044316&single=true&output=csv";
    const piketCsv = await doFetch(piketUrl);
    const piketRows = parseSimpleCSV(piketCsv);
    const dayRow = piketRows.find(r => (r['Hari'] || '').toLowerCase() === tomorrow.dowName.toLowerCase());
    if (dayRow) {
      for (let i = 1; i <= 7; i++) {
        const val = dayRow[`Petugas ${i}`];
        if (val && val.trim() && val !== '-') {
          piketList.push(val.trim());
        }
      }
    }
  } catch (e: any) {
    console.warn('Piket fetch notice:', e.message);
  }

  // 3. Fetch MBG from Sheets
  const mbgList: string[] = [];
  try {
    const mbgUrl = sheetFeeds?.mbg || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=215098819&single=true&output=csv";
    const mbgCsv = await doFetch(mbgUrl);
    const mbgRows = parseSimpleCSV(mbgCsv);
    const dateRow = mbgRows.find(r => (r['Tanggal'] || '').trim() === targetDDMMYYYY);
    if (dateRow) {
      for (let i = 1; i <= 4; i++) {
        const val = dateRow[`Petugas ${i}`];
        if (val && val.trim() && val !== '-') {
          mbgList.push(val.trim());
        }
      }
    }
  } catch (e: any) {
    console.warn('MBG fetch notice:', e.message);
  }

  // 4. Fetch Doa from Sheets
  const doaPetugas: TomorrowScheduleData['doaPetugas'] = {};
  try {
    const doaUrl = sheetFeeds?.doa || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=0&single=true&output=csv";
    const doaCsv = await doFetch(doaUrl);
    const doaRows = parseSimpleCSV(doaCsv);
    const dateRow = doaRows.find(r => (r['Tanggal'] || '').trim() === targetDDMMYYYY);
    if (dateRow) {
      doaPetugas.doaPagi = dateRow['Doa Pagi'] || undefined;
      doaPetugas.renungan = dateRow['Renungan'] || undefined;
      doaPetugas.malaikatTuhan = dateRow['Malaikat Tuhan'] || undefined;
      doaPetugas.doaPenutup = dateRow['Doa Penutup'] || undefined;
    }
  } catch (e: any) {
    console.warn('Doa fetch notice:', e.message);
  }

  // 5. Fetch Ice Breaking from Sheets
  const iceBreakingList: string[] = [];
  try {
    const ibUrl = sheetFeeds?.icebreaking || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU3A29DVHfQZkjsDcUPnAojvTldw2tpSxSGwaG1O8m4pXD8I8NVPeaF0U1TLYtqUzZjDJujYRu1OHp/pub?gid=1073417057&single=true&output=csv";
    const ibCsv = await doFetch(ibUrl);
    const ibRows = parseSimpleCSV(ibCsv);
    const dateRow = ibRows.find(r => (r['Tanggal'] || '').trim() === targetDDMMYYYY);
    if (dateRow) {
      for (let i = 1; i <= 3; i++) {
        const val = dateRow[`Petugas ${i}`];
        if (val && val.trim() && val !== '-') {
          iceBreakingList.push(val.trim());
        }
      }
    }
  } catch (e: any) {
    console.warn('Ice Breaking fetch notice:', e.message);
  }

  const hasSchedule =
    pelajaranList.length > 0 ||
    noticeList.length > 0 ||
    sumatifList.length > 0 ||
    prList.length > 0 ||
    piketList.length > 0 ||
    mbgList.length > 0;

  // Build Title
  let title = `🔔 Persiapan Jadwal Besok (${tomorrow.formattedDate})`;
  if (sumatifList.length > 0) {
    title = `🚨 ADA SUMATIF BESOK! Jadwal Kelas XB (${tomorrow.formattedDate})`;
  } else if (prList.length > 0) {
    title = `📝 ADA PR BESOK! Jadwal Kelas XB (${tomorrow.formattedDate})`;
  } else if (noticeList.length > 0) {
    title = `📢 ${noticeList[0].title}: Jadwal Kelas XB (${tomorrow.formattedDate})`;
  }

  // Build Body
  const bodySections: string[] = [];

  if (noticeList.length > 0) {
    const noticeTexts = noticeList.map(n => {
      const dayInfo = n.totalDays > 1 ? ` (Hari ke-${n.dayIndex}/${n.totalDays})` : '';
      const locInfo = n.location ? ` @ ${n.location}` : '';
      return `📢 KEGIATAN: ${n.title}${dayInfo}${locInfo}`;
    });
    bodySections.push(noticeTexts.join('\n'));
  }

  if (sumatifList.length > 0) {
    const sumatifTexts = sumatifList.map(s => `🚨 SUMATIF: ${s.subject} (${s.title})`);
    bodySections.push(sumatifTexts.join('\n'));
  }

  if (prList.length > 0) {
    const prTexts = prList.map(p => `📝 PR: ${p.subject} (${p.title})`);
    bodySections.push(prTexts.join('\n'));
  }

  if (pelajaranList.length > 0) {
    bodySections.push(`📚 Pelajaran: ${pelajaranList.join(', ')}`);
  }

  const duties: string[] = [];
  if (piketList.length > 0) {
    duties.push(`🧹 Piket: ${piketList.slice(0, 4).join(', ')}${piketList.length > 4 ? ' dll.' : ''}`);
  }
  if (mbgList.length > 0) {
    duties.push(`🍱 MBG: ${mbgList.join(', ')}`);
  }
  if (doaPetugas.doaPagi) {
    duties.push(`🙏 Doa: ${doaPetugas.doaPagi}`);
  }
  if (iceBreakingList.length > 0) {
    duties.push(`🎯 Ice Breaking: ${iceBreakingList.join(', ')}`);
  }

  if (duties.length > 0) {
    bodySections.push(duties.join(' | '));
  }

  if (bodySections.length === 0) {
    bodySections.push(`Tidak ada agenda sekolah terjadwal untuk ${tomorrow.formattedDate}.`);
  }

  const body = bodySections.join('\n');

  const notification: NotificationPayload = {
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: `kelas-xb-h1-${tomorrow.iso}`,
    url: `/?date=${tomorrow.iso}`,
    vibrate: sumatifList.length > 0 ? [300, 150, 300, 150, 300] : [200, 100, 200],
    requireInteraction: sumatifList.length > 0 || prList.length > 0 || noticeList.length > 0
  };

  return {
    targetDate: tomorrow.iso,
    formattedDate: tomorrow.formattedDate,
    dayOfWeekName: tomorrow.dowName,
    pelajaranList,
    noticeList,
    sumatifList,
    prList,
    agendaList,
    piketList,
    mbgList,
    doaPetugas,
    iceBreakingList,
    hasSchedule,
    notification
  };
}

/**
 * State file manager for daily routine notification
 */
export class RoutineNotificationManager {
  private dataDir: string;
  private stateFile: string;
  private subsFile: string;
  private fetchFn: (url: string) => Promise<string>;
  private calendarFeeds: Record<string, string>;
  private sheetFeeds: Record<string, string>;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    dataDir: string,
    fetchFn: (url: string) => Promise<string>,
    calendarFeeds: Record<string, string>,
    sheetFeeds: Record<string, string>
  ) {
    this.dataDir = dataDir;
    this.stateFile = path.join(dataDir, 'routine-notification-state.json');
    this.subsFile = path.join(dataDir, 'push-subscriptions.json');
    this.fetchFn = fetchFn;
    this.calendarFeeds = calendarFeeds;
    this.sheetFeeds = sheetFeeds;
  }

  private getState(): { lastRoutineSentDate?: string; lastCheckTimestamp?: number } {
    if (fs.existsSync(this.stateFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } catch {}
    }
    return {};
  }

  private saveState(state: { lastRoutineSentDate?: string; lastCheckTimestamp?: number }) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (e: any) {
      console.error('Failed to save routine notification state:', e.message);
    }
  }

  private loadSubscriptions(): any[] {
    if (fs.existsSync(this.subsFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.subsFile, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  private saveSubscriptions(subs: any[]) {
    try {
      fs.writeFileSync(this.subsFile, JSON.stringify(subs, null, 2), 'utf8');
    } catch (e: any) {
      console.error('Failed to save subscriptions:', e.message);
    }
  }

  /**
   * Dispatches tomorrow's H-1 notification (at 19:00 WIB or manually triggered)
   */
  public async sendRoutineNotification(targetDate?: string, force = false): Promise<{
    ok: boolean;
    sent: number;
    total: number;
    targetDate: string;
    hasSumatif: boolean;
    hasPr: boolean;
    notification: NotificationPayload;
    message?: string;
  }> {
    const data = await buildTomorrowNotification(
      targetDate,
      this.fetchFn,
      this.calendarFeeds,
      this.sheetFeeds
    );

    // If day has no schedule/school and not forced, skip
    if (!data.hasSchedule && !force) {
      return {
        ok: true,
        sent: 0,
        total: 0,
        targetDate: data.targetDate,
        hasSumatif: false,
        hasPr: false,
        notification: data.notification,
        message: `Tidak ada jadwal atau aktivitas sekolah untuk ${data.formattedDate}. Notifikasi tidak dikirim.`
      };
    }

    const subs = this.loadSubscriptions();
    if (subs.length === 0) {
      return {
        ok: true,
        sent: 0,
        total: 0,
        targetDate: data.targetDate,
        hasSumatif: data.sumatifList.length > 0,
        hasPr: data.prList.length > 0,
        notification: data.notification,
        message: 'Tidak ada subscriber yang terdaftar.'
      };
    }

    let sent = 0;
    const expiredEndpoints: string[] = [];
    const payloadStr = JSON.stringify(data.notification);

    for (const sub of subs) {
      // Respect subscriber preferences
      const prefs = sub.preferences || {};
      // If user explicitly turned off daily schedule and there is no sumatif/PR, skip
      if (prefs.jadwalHarian === false && !data.sumatifList.length && !data.prList.length) {
        continue;
      }
      // If sumatif occurred but user explicitly disabled sumatif alerts
      if (data.sumatifList.length > 0 && prefs.sumatif === false && !prefs.jadwalHarian) {
        continue;
      }
      // If PR occurred but user explicitly disabled task/PR alerts
      if (data.prList.length > 0 && prefs.tugasPr === false && !prefs.jadwalHarian) {
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payloadStr
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.warn('Failed push to endpoint:', err.message);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      this.saveSubscriptions(subs.filter(s => !expiredEndpoints.includes(s.endpoint)));
    }

    return {
      ok: true,
      sent,
      total: subs.length,
      targetDate: data.targetDate,
      hasSumatif: data.sumatifList.length > 0,
      hasPr: data.prList.length > 0,
      notification: data.notification,
      message: `Berhasil mengirim pengingat ke ${sent} subscriber.`
    };
  }

  /**
   * Starts the background scheduler checking WIB time every 30 seconds
   */
  public startScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log('Classroom routine notification scheduler started (Target: 19:00 WIB daily)');

    const checkRoutine = async () => {
      try {
        const now = getWIBNow();
        // Check if current time in WIB is 19:00 (allowing 19:00 to 19:02 window)
        const is1900WIB = now.hour === 19 && (now.minute >= 0 && now.minute <= 2);

        if (is1900WIB) {
          const state = this.getState();
          // Check if already sent today
          if (state.lastRoutineSentDate !== now.iso) {
            console.log(`[19:00 WIB] Triggering routine H-1 notification for tomorrow (${now.iso})...`);
            const res = await this.sendRoutineNotification();
            console.log(`[19:00 WIB] Result: Sent to ${res.sent}/${res.total} subscribers. Sumatif: ${res.hasSumatif}, PR: ${res.hasPr}`);
            
            // Mark as sent today
            this.saveState({
              lastRoutineSentDate: now.iso,
              lastCheckTimestamp: Date.now()
            });
          }
        }
      } catch (e: any) {
        console.error('Routine notification check error:', e.message);
      }
    };

    // Run check every 30 seconds
    this.timer = setInterval(checkRoutine, 30 * 1000);
    // Initial immediate check in case server boots at 19:00
    checkRoutine().catch(() => {});
  }

  public stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getStatus() {
    const now = getWIBNow();
    const state = this.getState();
    const subs = this.loadSubscriptions();
    return {
      active: Boolean(this.timer),
      targetTime: '19:00 WIB (H-1 sebelum hari sekolah)',
      currentWIBTime: `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}:${String(now.second).padStart(2, '0')} WIB`,
      currentWIBDate: now.formattedDate,
      lastRoutineSentDate: state.lastRoutineSentDate || null,
      alreadySentToday: state.lastRoutineSentDate === now.iso,
      subscriberCount: subs.length
    };
  }
}
