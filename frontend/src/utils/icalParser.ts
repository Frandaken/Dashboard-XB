import ICAL from 'ical.js';
import { PeriodItem, TaskItem, TaskType, TaskAttachment, CalendarEventNotice } from '../types';

export interface ParsedTask {
  title: string;
  details?: string;
  hasDetails: boolean;
}

export interface InclusiveEventRange {
  isAllDay: boolean;
  isMultiDay: boolean;
  totalDays: number;
  dates: string[];
  startDateStr: string;
  endDateStr: string;
}

/**
 * Checks if an iCal event is an all-day (full-day) or multi-day event.
 * If so, returns the inclusive list of ISO dates and metadata.
 * RFC 5545 specifies that DTEND for DATE values (all-day events) is non-inclusive.
 */
export function extractInclusiveDateRange(ev: ICAL.Event): InclusiveEventRange | null {
  const st = ev.startDate;
  if (!st) return null;

  const isAllDay = Boolean(st.isDate);
  const et = ev.endDate;
  const startDateStr = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
  const dates: string[] = [];

  if (isAllDay) {
    if (et && et.isDate) {
      // RFC 5545: DTEND with VALUE=DATE is non-inclusive (the day following the event's end)
      const startUtc = Date.UTC(st.year, st.month - 1, st.day, 12, 0, 0);
      const endUtc = Date.UTC(et.year, et.month - 1, et.day, 12, 0, 0);
      const diffDays = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));

      if (diffDays > 1) {
        for (let i = 0; i < diffDays; i++) {
          const cur = new Date(startUtc + i * 24 * 60 * 60 * 1000);
          const y = cur.getUTCFullYear();
          const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
          const d = String(cur.getUTCDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
        }
        return {
          isAllDay: true,
          isMultiDay: true,
          totalDays: dates.length,
          dates,
          startDateStr,
          endDateStr: dates[dates.length - 1]
        };
      } else {
        // 1-day all-day event
        dates.push(startDateStr);
        return {
          isAllDay: true,
          isMultiDay: false,
          totalDays: 1,
          dates,
          startDateStr,
          endDateStr: startDateStr
        };
      }
    } else {
      // All-day event without DTEND
      dates.push(startDateStr);
      return {
        isAllDay: true,
        isMultiDay: false,
        totalDays: 1,
        dates,
        startDateStr,
        endDateStr: startDateStr
      };
    }
  }

  // Check timed event spanning across multiple days or duration >= 24h
  if (et) {
    const startUtc = Date.UTC(st.year, st.month - 1, st.day, st.hour || 0, st.minute || 0, 0);
    const endUtc = Date.UTC(et.year, et.month - 1, et.day, et.hour || 0, et.minute || 0, 0);
    const durSec = (endUtc - startUtc) / 1000;

    const endsAtMidnight = et.hour === 0 && et.minute === 0 && et.second === 0;
    const effectiveEndUtc = endsAtMidnight ? endUtc - 1000 : endUtc;
    const effEndDate = new Date(effectiveEndUtc);
    const effEndDKey = `${effEndDate.getUTCFullYear()}-${String(effEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(effEndDate.getUTCDate()).padStart(2, '0')}`;

    if (durSec >= 86400 || startDateStr !== effEndDKey) {
      let curUtc = Date.UTC(st.year, st.month - 1, st.day, 12, 0, 0);
      const limitUtc = Date.UTC(effEndDate.getUTCFullYear(), effEndDate.getUTCMonth(), effEndDate.getUTCDate(), 12, 0, 0);

      while (curUtc <= limitUtc && dates.length < 365) {
        const curDate = new Date(curUtc);
        const y = curDate.getUTCFullYear();
        const m = String(curDate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(curDate.getUTCDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curUtc += 24 * 60 * 60 * 1000;
      }

      return {
        isAllDay: false,
        isMultiDay: dates.length > 1,
        totalDays: dates.length,
        dates,
        startDateStr,
        endDateStr: dates[dates.length - 1]
      };
    }
  }

  return null;
}

/**
 * Classifies task text into 3 types:
 * 1. sumatif: Keyword sumatif, ulangan, asesmen, uh, ph (highest priority)
 * 2. pr: Keyword PR, pekerjaan rumah, tugas
 * 3. agenda: No keyword (e.g. Melanjutkan Miniatur)
 */
/**
 * Strips HTML tags and entities, converting rich text into clean plain text for clipboard or searches.
 */
export function stripHtmlToPlainText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<\s*br\s*[\/]?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*li\s*>/gi, '• ')
    .replace(/<\s*\/li\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Trims leading and trailing line breaks (<br>, \n) from HTML or text strings.
 */
function trimBreaks(s: string): string {
  return s
    .replace(/^(?:\s*<\s*br\s*[\/]?>|\s*<\s*\/p\s*>|\s*<\s*p[^>]*>|\s*\r?\n)+/gi, '')
    .replace(/(?:\s*<\s*br\s*[\/]?>|\s*\r?\n)+$/gi, '')
    .trim();
}

/**
 * Classifies task text into 3 types:
 * 1. sumatif: Keyword sumatif, ulangan, asesmen, uh, ph (highest priority)
 * 2. pr: Keyword PR, pekerjaan rumah, tugas
 * 3. agenda: No keyword (e.g. Melanjutkan Miniatur)
 */
export function classifyTaskType(text: string): TaskType {
  if (!text) return 'agenda';
  const plainText = stripHtmlToPlainText(text);
  const lower = plainText.toLowerCase();

  // 1. Prioritas tertinggi: jika ada keyword sumatif
  if (
    lower.includes('sumatif') ||
    lower.includes('ulangan') ||
    lower.includes('asesmen') ||
    /\buh\b/i.test(plainText) ||
    /\bph\b/i.test(plainText)
  ) {
    return 'sumatif';
  }

  // 2. Jika ada keyword PR
  if (
    /\bpr\b/i.test(plainText) ||
    lower.includes('pekerjaan rumah') ||
    lower.includes('tugas')
  ) {
    return 'pr';
  }

  // 3. Jika tidak ada keyword apa-apa -> agenda
  return 'agenda';
}

/**
 * Extracts attachment from iCal component (ATTACH property) or fallback URL in description.
 */
export function extractAttachment(comp?: any, desc?: string): TaskAttachment | undefined {
  if (comp) {
    const attachProp = comp.getFirstProperty ? comp.getFirstProperty('attach') : null;
    if (attachProp) {
      const rawUrl = attachProp.getFirstValue();
      if (rawUrl && typeof rawUrl === 'string') {
        const cleanUrl = rawUrl.replace(/\s+/g, '');
        const filename = attachProp.getParameter('filename') || undefined;
        const mimeType = attachProp.getParameter('fmttype') || undefined;
        return {
          filename,
          url: cleanUrl,
          mimeType
        };
      }
    }
  }

  if (desc) {
    const urlMatch = desc.match(/https?:\/\/(?:drive\.google\.com\/[^\s<>"']+|[^\s<>"']+\.(?:png|jpe?g|webp|gif|pdf))/i);
    if (urlMatch) {
      return {
        url: urlMatch[0].trim(),
        filename: 'Lampiran'
      };
    }
  }

  return undefined;
}

/**
 * Parses task description into title (first visual line) and details (subsequent lines/lists).
 * Preserves safe rich formatting tags (b, i, u, s, ol, ul, li, a, br).
 */
export function parseTaskDescription(rawDesc: string): ParsedTask {
  if (!rawDesc || typeof rawDesc !== 'string') return { title: '', hasDetails: false };

  // Normalize folded tags first (e.g. "</ b>" -> "</b>", "<b >" -> "<b>")
  const normalized = rawDesc
    .replace(/<\s*\/\s*([a-zA-Z0-9]+)\s*>/gi, '</$1>')
    .replace(/<\s*([a-zA-Z0-9]+)\s*>/gi, '<$1>')
    .replace(/<\s*([a-zA-Z0-9]+)(\s+[^>]+)>/gi, '<$1$2>')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  // Find the first line break delimiter: <br>, \n, </p>, or </div>
  const match = normalized.match(/(?:<\s*br\s*[\/]?>|\r?\n|<\s*\/p\s*>|<\s*\/div\s*>)/i);

  if (!match || match.index === undefined) {
    // Single line only
    const cleanTitle = trimBreaks(normalized);
    return {
      title: cleanTitle,
      hasDetails: false
    };
  }

  const delimiterIndex = match.index;
  const delimiterLength = match[0].length;

  let rawTitle = normalized.slice(0, delimiterIndex);
  let rawDetails = normalized.slice(delimiterIndex + delimiterLength);

  // If title was wrapped in <p>...</p> or <div>...</div>, unwrap outer container
  rawTitle = rawTitle.replace(/^<\s*(?:p|div)[^>]*>/i, '').replace(/<\s*\/(?:p|div)\s*>$/i, '');
  const title = trimBreaks(rawTitle);

  // Clean details
  const details = trimBreaks(rawDetails);
  const plainDetailsCheck = stripHtmlToPlainText(details);

  const hasDetails = plainDetailsCheck.length > 0;

  return {
    title: title || stripHtmlToPlainText(normalized).split('\n')[0] || normalized,
    details: hasDetails ? details : undefined,
    hasDetails
  };
}

/**
 * Safely converts an ICAL.Time or Date into a WIB (Asia/Jakarta, UTC+7) time string and date key.
 * Properly converts UTC times exported by Google Calendar (ending in Z), floating times, and TZID times.
 */
export function getWIBDateTime(t: any, ev?: ICAL.Event): { dateKey: string; timeStr: string } {
  if (!t) return { dateKey: '2026-01-01', timeStr: '00:00' };

  if (t.isDate) {
    const yStr = String(t.year);
    const mStr = String(t.month).padStart(2, '0');
    const dStr = String(t.day).padStart(2, '0');
    return {
      dateKey: `${yStr}-${mStr}-${dStr}`,
      timeStr: '00:00'
    };
  }

  // If t is an ICAL.Time object with floating timezone (no timezone specified):
  if (t.zone && t.zone.tzid === 'floating') {
    const yStr = String(t.year);
    const mStr = String(t.month).padStart(2, '0');
    const dStr = String(t.day).padStart(2, '0');
    const hStr = String(t.hour).padStart(2, '0');
    const minStr = String(t.minute).padStart(2, '0');
    return {
      dateKey: `${yStr}-${mStr}-${dStr}`,
      timeStr: `${hStr}:${minStr}`
    };
  }

  // For UTC or TZID times, convert to standard JS Date and format explicitly in Asia/Jakarta (WIB)
  try {
    const jsDate = t instanceof Date ? t : t.toJSDate();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(jsDate);
    let y = '2026', m = '01', d = '01', h = '00', min = '00';
    for (const p of parts) {
      if (p.type === 'year') y = p.value;
      else if (p.type === 'month') m = p.value;
      else if (p.type === 'day') d = p.value;
      else if (p.type === 'hour') h = p.value;
      else if (p.type === 'minute') min = p.value;
    }
    return {
      dateKey: `${y}-${m}-${d}`,
      timeStr: `${h}:${min}`
    };
  } catch {
    const yStr = String(t.year || 2026);
    const mStr = String(t.month || 1).padStart(2, '0');
    const dStr = String(t.day || 1).padStart(2, '0');
    const hStr = String(t.hour || 0).padStart(2, '0');
    const minStr = String(t.minute || 0).padStart(2, '0');
    return {
      dateKey: `${yStr}-${mStr}-${dStr}`,
      timeStr: `${hStr}:${minStr}`
    };
  }
}

export function parsePelajaranICS(
  icsText: string,
  rangeStart?: Date,
  rangeEnd?: Date
): {
  pelajaranByDate: Record<string, PeriodItem[]>;
  tasksByDate: Record<string, TaskItem[]>;
  eventNoticesByDate: Record<string, CalendarEventNotice[]>;
} {
  const pelajaranByDate: Record<string, PeriodItem[]> = {};
  const tasksByDate: Record<string, TaskItem[]> = {};
  const eventNoticesByDate: Record<string, CalendarEventNotice[]> = {};

  if (!icsText || typeof icsText !== 'string' || !icsText.trim()) {
    return { pelajaranByDate, tasksByDate, eventNoticesByDate };
  }

  // Guard against HTML error pages or non-iCal payloads (e.g. <!doctype html> from network or proxy fallback)
  const trimmed = icsText.trim();
  if (trimmed.startsWith('<') || !trimmed.includes('BEGIN:VCALENDAR')) {
    console.warn('parsePelajaranICS: Received non-iCal payload (likely HTML or network error), skipping parsing');
    return { pelajaranByDate, tasksByDate, eventNoticesByDate };
  }

  try {
    const jcal = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents('vevent');

    const overrides = new Map<string, ICAL.Event>();
    const baseEvents: ICAL.Event[] = [];

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const recurProp = vevent.getFirstPropertyValue('recurrence-id');
      if (recurProp) {
        const recTime = recurProp as any;
        const wibRec = getWIBDateTime(recTime);
        const dKey = wibRec.dateKey;
        overrides.set(`${event.uid}_${dKey}`, event);
      } else {
        baseEvents.push(event);
      }
    }

    const formatPeriodTime = (ev: ICAL.Event, instanceStart: any): { dateKey: string; timeStr: string } => {
      const startWib = getWIBDateTime(instanceStart, ev);
      const startStr = startWib.timeStr;
      const dateKey = startWib.dateKey;

      let durSec = 0;
      if (ev.duration) {
        try {
          durSec = ev.duration.toSeconds();
        } catch {}
      }
      if (!durSec && ev.endDate && ev.startDate && !ev.endDate.isDate && !ev.startDate.isDate) {
        try {
          durSec = (ev.endDate.toJSDate().getTime() - ev.startDate.toJSDate().getTime()) / 1000;
        } catch {}
      }

      if (durSec > 0 && !instanceStart.isDate) {
        try {
          const startJs = instanceStart.toJSDate();
          const endJs = new Date(startJs.getTime() + durSec * 1000);
          const endWib = getWIBDateTime(endJs, ev);
          return {
            dateKey,
            timeStr: `${startStr} - ${endWib.timeStr}`
          };
        } catch {}
      }

      return {
        dateKey,
        timeStr: startStr
      };
    };

    const addEventNotice = (ev: ICAL.Event, range: InclusiveEventRange) => {
      const summary = (ev.summary || '').trim() || 'Kegiatan';
      const desc = ev.description ? ev.description.trim() : '';
      const parsedDesc = desc ? parseTaskDescription(desc) : undefined;
      const attachment = extractAttachment(ev.component, desc);

      range.dates.forEach((dateKey, idx) => {
        if (!eventNoticesByDate[dateKey]) {
          eventNoticesByDate[dateKey] = [];
        }

        const exists = eventNoticesByDate[dateKey].some(
          n => n.title.toLowerCase() === summary.toLowerCase() && n.startDate === range.startDateStr
        );
        if (!exists) {
          eventNoticesByDate[dateKey].push({
            id: `${ev.uid || 'notice'}_${dateKey}_${idx + 1}`,
            title: summary,
            description: parsedDesc?.details || (parsedDesc?.title && parsedDesc.title !== summary ? parsedDesc.title : desc) || undefined,
            location: ev.location ? ev.location.trim() : undefined,
            startDate: range.startDateStr,
            endDate: range.endDateStr,
            isAllDay: range.isAllDay,
            isMultiDay: range.isMultiDay,
            totalDays: range.totalDays,
            dayIndex: idx + 1,
            attachment
          });
        }
      });
    };

    const addPeriod = (dateKey: string, ev: ICAL.Event, startTime: string) => {
      const desc = ev.description ? ev.description.trim() : '';
      const summary = ev.summary || '';
      // Preserve subject name, also preserve JP session identifier if present
      const cleanName = summary.replace(/\s*-\s*JP\s*\d+/gi, '').trim() || summary || 'Pelajaran';
      
      // Extract JP (Jam Pelajaran) session info if present (e.g. "JP 1", "JP 3-4")
      const jpMatch = summary.match(/JP\s*\d+(?:\s*-\s*\d+)?/i);
      const sessionLabel = jpMatch ? jpMatch[0].toUpperCase() : '';

      const parsedTask = desc ? parseTaskDescription(desc) : null;
      const fullTaskText = parsedTask ? (parsedTask.details ? `${parsedTask.title}\n${parsedTask.details}` : parsedTask.title) : '';
      const taskType = desc ? classifyTaskType(fullTaskText) : undefined;
      const attachment = extractAttachment(ev.component, desc);

      const period: PeriodItem = {
        time: startTime,
        cleanName: cleanName,
        summary: sessionLabel ? `${cleanName} (${sessionLabel})` : summary,
        rawSummary: summary,
        hasTask: !!desc,
        taskType,
        taskText: fullTaskText,
        taskTitle: parsedTask?.title,
        taskDetails: parsedTask?.details,
        hasDetails: parsedTask?.hasDetails || false,
        location: ev.location || '',
        attachment
      };

      if (!pelajaranByDate[dateKey]) {
        pelajaranByDate[dateKey] = [];
      }
      pelajaranByDate[dateKey].push(period);

      if (desc && parsedTask) {
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        // Deduplicate identical tasks for the same subject on the same day (e.g. multiple JPs of the same class)
        const isDuplicate = tasksByDate[dateKey].some(
          t => t.subject === cleanName && t.taskTitle === parsedTask.title && t.taskDetails === parsedTask.details
        );
        if (!isDuplicate) {
          tasksByDate[dateKey].push({
            id: `${ev.uid || 'task'}_${dateKey}_${startTime}`,
            subject: cleanName,
            taskType,
            taskText: fullTaskText,
            taskTitle: parsedTask.title,
            taskDetails: parsedTask.details,
            hasDetails: parsedTask.hasDetails,
            time: startTime,
            attachment
          });
        }
      }
    };

    const rStart = rangeStart
      ? ICAL.Time.fromJSDate(rangeStart)
      : ICAL.Time.fromJSDate(new Date(2025, 0, 1));
    const rEnd = rangeEnd
      ? ICAL.Time.fromJSDate(rangeEnd)
      : ICAL.Time.fromJSDate(new Date(2027, 11, 31));

    const consumedOverrides = new Set<string>();

    for (const event of baseEvents) {
      // Check first if event is a full-day or multi-day event (e.g. Camping PPTA, PJJ, Masuk Sekolah)
      const noticeRange = extractInclusiveDateRange(event);
      if (noticeRange) {
        const evStart = ICAL.Time.fromJSDate(new Date(noticeRange.startDateStr + 'T00:00:00Z'));
        const evEnd = ICAL.Time.fromJSDate(new Date(noticeRange.endDateStr + 'T23:59:59Z'));
        if (evEnd.compare(rStart) >= 0 && evStart.compare(rEnd) <= 0) {
          addEventNotice(event, noticeRange);
        }
        // Do not add full-day or multi-day notices into the daily lesson period schedule
        continue;
      }

      if (event.isRecurring()) {
        try {
          const it = event.iterator();
          let next: any;
          let count = 0;
          while ((next = it.next()) && count < 500) {
            count++;
            if (next.compare(rEnd) > 0) break;
            if (next.compare(rStart) >= 0) {
              const res = formatPeriodTime(event, next);
              const dKey = res.dateKey;
              const overrideKey = `${event.uid}_${dKey}`;
              const overrideEv = overrides.get(overrideKey);

              if (overrideEv) {
                consumedOverrides.add(overrideKey);
                const overRange = extractInclusiveDateRange(overrideEv);
                if (overRange) {
                  addEventNotice(overrideEv, overRange);
                } else {
                  // When an instance has a recurrence override in Google Calendar,
                  // use the override event's modified start time rather than the original recurring start time
                  const timeToUse = overrideEv.startDate || next;
                  const overrideRes = formatPeriodTime(overrideEv, timeToUse);
                  addPeriod(overrideRes.dateKey, overrideEv, overrideRes.timeStr);
                }
              } else {
                addPeriod(dKey, event, res.timeStr);
              }
            }
          }
        } catch (iterErr) {
          console.warn('Error expanding recurrence for event', event.summary, iterErr);
        }
      } else {
        const st = event.startDate;
        if (st && st.compare(rStart) >= 0 && st.compare(rEnd) <= 0) {
          const res = formatPeriodTime(event, st);
          addPeriod(res.dateKey, event, res.timeStr);
        }
      }
    }

    // Include any standalone overrides whose base recurring events were not expanded in the loop
    overrides.forEach((ev, key) => {
      if (!consumedOverrides.has(key)) {
        const overRange = extractInclusiveDateRange(ev);
        if (overRange) {
          addEventNotice(ev, overRange);
          return;
        }
        const parts = key.split('_');
        const fallbackDKey = parts[parts.length - 1];
        const st = ev.startDate;
        if (st && st.compare(rStart) >= 0 && st.compare(rEnd) <= 0) {
          const res = formatPeriodTime(ev, st);
          addPeriod(res.dateKey || fallbackDKey, ev, res.timeStr);
        }
      }
    });

    // Deduplicate any identical entries and sort chronologically by schedule start time
    for (const key of Object.keys(pelajaranByDate)) {
      const seen = new Set<string>();
      pelajaranByDate[key] = pelajaranByDate[key].filter(p => {
        const dedupeId = `${p.rawSummary}_${p.time}`;
        if (seen.has(dedupeId)) return false;
        seen.add(dedupeId);
        return true;
      });

      pelajaranByDate[key].sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
      });

      // Synchronize clean tasks list for this date in chronological order
      if (tasksByDate[key]) {
        tasksByDate[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      }
    }
  } catch (err: any) {
    console.error('Failed to parse pelajaran ICS:', err);
  }

  return { pelajaranByDate, tasksByDate, eventNoticesByDate };
}

export function parseBirthdayICS(
  icsText: string,
  _rangeStart?: Date,
  _rangeEnd?: Date
): Record<string, string[]> {
  const birthdayByMonthDay: Record<string, string[]> = {};

  if (!icsText || typeof icsText !== 'string' || !icsText.trim()) {
    return birthdayByMonthDay;
  }

  // Guard against HTML error pages or non-iCal payloads (e.g. <!doctype html> from network or proxy fallback)
  const trimmed = icsText.trim();
  if (trimmed.startsWith('<') || !trimmed.includes('BEGIN:VCALENDAR')) {
    console.warn('parseBirthdayICS: Received non-iCal payload (likely HTML or network error), skipping parsing');
    return birthdayByMonthDay;
  }

  try {
    const jcal = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const st = event.startDate;
      if (!st) continue;

      const monthDayKey = `${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
      let name = event.summary || '';
      // Clean up "🎂 Name (X-B)"
      name = name.replace(/🎂/g, '').replace(/\(X-B\)/gi, '').trim();

      if (name) {
        if (!birthdayByMonthDay[monthDayKey]) {
          birthdayByMonthDay[monthDayKey] = [];
        }
        if (!birthdayByMonthDay[monthDayKey].includes(name)) {
          birthdayByMonthDay[monthDayKey].push(name);
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to parse birthday ICS:', err);
  }

  return birthdayByMonthDay;
}
