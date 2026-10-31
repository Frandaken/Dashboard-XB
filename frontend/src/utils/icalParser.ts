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
export function classifyTaskType(text: string): TaskType {
  if (!text) return 'agenda';
  const lower = text.toLowerCase();

  // 1. Prioritas tertinggi: jika ada keyword sumatif
  if (
    lower.includes('sumatif') ||
    lower.includes('ulangan') ||
    lower.includes('asesmen') ||
    /\buh\b/i.test(text) ||
    /\bph\b/i.test(text)
  ) {
    return 'sumatif';
  }

  // 2. Jika ada keyword PR
  if (
    /\bpr\b/i.test(text) ||
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

export function parseTaskDescription(rawDesc: string): ParsedTask {
  if (!rawDesc) return { title: '', hasDetails: false };

  let text = rawDesc
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { title: rawDesc.trim(), hasDetails: false };
  }

  const title = lines[0];
  const details = lines.slice(1).join('\n').trim();

  return {
    title,
    details: details || undefined,
    hasDetails: !!details
  };
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
        const dKey = `${recTime.year}-${String(recTime.month).padStart(2, '0')}-${String(recTime.day).padStart(2, '0')}`;
        overrides.set(`${event.uid}_${dKey}`, event);
      } else {
        baseEvents.push(event);
      }
    }

    const formatTime = (t: any) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;

    const formatPeriodTime = (ev: ICAL.Event, instanceStart: any) => {
      const startStr = formatTime(instanceStart);
      if (ev.duration) {
        try {
          const durSec = ev.duration.toSeconds();
          const startMin = instanceStart.hour * 60 + instanceStart.minute;
          const endMin = startMin + Math.round(durSec / 60);
          const endH = Math.floor(endMin / 60) % 24;
          const endM = endMin % 60;
          return `${startStr} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        } catch {
          return startStr;
        }
      }
      return startStr;
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
              const dKey = `${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`;
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
                  const timeStr = formatPeriodTime(overrideEv, timeToUse);
                  addPeriod(dKey, overrideEv, timeStr);
                }
              } else {
                const timeStr = formatPeriodTime(event, next);
                addPeriod(dKey, event, timeStr);
              }
            }
          }
        } catch (iterErr) {
          console.warn('Error expanding recurrence for event', event.summary, iterErr);
        }
      } else {
        const st = event.startDate;
        if (st && st.compare(rStart) >= 0 && st.compare(rEnd) <= 0) {
          const dKey = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
          const timeStr = formatPeriodTime(event, st);
          addPeriod(dKey, event, timeStr);
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
        const dKey = parts[parts.length - 1];
        const st = ev.startDate;
        if (st && st.compare(rStart) >= 0 && st.compare(rEnd) <= 0) {
          const timeStr = formatPeriodTime(ev, st);
          addPeriod(dKey, ev, timeStr);
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
