import ICAL from 'ical.js';
import { PeriodItem, TaskItem } from '../types';

/**
 * Strips HTML tags (like <span>, <br>, <p>, etc.) and decodes common entities
 */
export function cleanHtmlText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .trim();
}

/**
 * Removes '(WAKTU SENAM)' tag from any string case-insensitively,
 * and collapses multiple spaces.
 */
export function stripWaktuSenamTag(text: string): string {
  if (!text) return '';
  return text
    .replace(/\(?\s*WAKTU\s+SENAM\s*\)?/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Extracts pure subject name from summary like "SOSIOLOGI - JP9" -> "SOSIOLOGI"
 */
export function extractSubjectName(summary: string): string {
  if (!summary) return '';
  const clean = stripWaktuSenamTag(summary);
  const parts = clean.split(/\s*-\s*JP\d+/i);
  if (parts.length > 0 && parts[0].trim()) {
    return parts[0].trim();
  }
  return clean;
}

/**
 * Extracts JP number if any, e.g. "SOSIOLOGI - JP9" -> "JP9"
 */
export function extractJpTag(summary: string): string {
  const match = summary.match(/JP\d+/i);
  return match ? match[0].toUpperCase() : '';
}

export interface ParsedPelajaranResult {
  pelajaranByDate: Record<string, PeriodItem[]>;
  tasksByDate: Record<string, TaskItem[]>;
}

export function parsePelajaranICS(icsText: string, rangeStart: Date, rangeEnd: Date): ParsedPelajaranResult {
  const pelajaranByDate: Record<string, PeriodItem[]> = {};
  const rawTasksByDate: Record<string, TaskItem[]> = {};

  if (!icsText) return { pelajaranByDate, tasksByDate: {} };

  try {
    const jcalData = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const masters: Record<string, any> = {};
    const exceptionsByUid: Record<string, any[]> = {};

    vevents.forEach(ve => {
      const uidProp = ve.getFirstPropertyValue('uid');
      const uid = uidProp ? String(uidProp) : `uid_${Math.random()}`;
      const recurId = ve.getFirstPropertyValue('recurrence-id');
      if (recurId) {
        if (!exceptionsByUid[uid]) exceptionsByUid[uid] = [];
        exceptionsByUid[uid].push(ve);
      } else {
        masters[uid] = ve;
      }
    });

    Object.keys(exceptionsByUid).forEach(uid => {
      if (!masters[uid]) {
        exceptionsByUid[uid].forEach(ve => {
          masters[`${uid}__orphan__${Math.random()}`] = ve;
        });
        delete exceptionsByUid[uid];
      }
    });

    const rStart = ICAL.Time.fromJSDate(rangeStart);
    const rEnd = ICAL.Time.fromJSDate(rangeEnd);

    const occurrences: Array<{
      isoDate: string;
      time: string;
      summary: string;
      description: string;
    }> = [];

    Object.entries(masters).forEach(([uid, ve]) => {
      try {
        const event = new ICAL.Event(ve);
        (exceptionsByUid[uid] || []).forEach(exVe => event.relateException(exVe));

        if (event.isRecurring()) {
          const iterator = event.iterator();
          let next;
          let guard = 0;
          while ((next = iterator.next()) && guard < 3500) {
            guard++;
            if (next.compare(rStart) < 0) continue;
            if (next.compare(rEnd) > 0) break;

            const details = event.getOccurrenceDetails(next);
            const item = details.item;
            const summary = (item && item.summary) || event.summary || '';
            const description = (item && item.description) || event.description || '';

            const st = details.startDate;
            const isoDate = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
            const time = `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}`;

            occurrences.push({ isoDate, time, summary, description });
          }
        } else {
          const st = event.startDate;
          if (st.compare(rStart) >= 0 && st.compare(rEnd) <= 0) {
            const isoDate = `${st.year}-${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
            const time = `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}`;
            const summary = event.summary || '';
            const description = event.description || '';

            occurrences.push({ isoDate, time, summary, description });
          }
        }
      } catch (innerErr) {
        console.warn('Error expanding single event in pelajaran ICS:', innerErr);
      }
    });

    // Process all occurrences into periods & tasks
    occurrences.forEach(({ isoDate, time, summary, description }) => {
      // 1. Clean the summary and strip '(WAKTU SENAM)' so it displays like the tag is not there
      const cleanSummary = stripWaktuSenamTag(cleanHtmlText(summary));
      if (!cleanSummary) return;

      // 2. Clean the description:
      // Requirement: "Seluruh isi DESCRIPTION dianggap tugas kalau tidak kosong. NAMUN, ignore description '(WAKTU SENAM)' dan tampilkan seperti tag itu tidak ada"
      const rawDescCleaned = cleanHtmlText(description);
      const descWithoutWaktuSenam = stripWaktuSenamTag(rawDescCleaned);

      const hasTask = descWithoutWaktuSenam.length > 0;
      const taskText = hasTask ? descWithoutWaktuSenam : undefined;

      if (!pelajaranByDate[isoDate]) {
        pelajaranByDate[isoDate] = [];
      }

      pelajaranByDate[isoDate].push({
        time,
        name: summary,
        cleanName: cleanSummary,
        description: descWithoutWaktuSenam || undefined,
        hasTask,
        taskText
      });

      if (hasTask) {
        if (!rawTasksByDate[isoDate]) {
          rawTasksByDate[isoDate] = [];
        }
        const subject = extractSubjectName(cleanSummary);
        const jp = extractJpTag(cleanSummary);
        rawTasksByDate[isoDate].push({
          subject,
          periodName: jp ? `${subject} (${jp})` : subject,
          task: descWithoutWaktuSenam,
          time
        });
      }
    });

    // Sort periods by time
    Object.values(pelajaranByDate).forEach(list => {
      list.sort((a, b) => a.time.localeCompare(b.time));
    });

    // Deduplicate / format tasks cleanly for each date
    const tasksByDate: Record<string, TaskItem[]> = {};
    Object.entries(rawTasksByDate).forEach(([isoDate, items]) => {
      // Group tasks by subject and identical task text
      const grouped: Record<string, { subject: string; jps: string[]; task: string; time?: string }> = {};

      items.forEach(item => {
        const key = `${item.subject}:::${item.task}`;
        const jp = extractJpTag(item.periodName || '');
        if (!grouped[key]) {
          grouped[key] = {
            subject: item.subject,
            jps: jp ? [jp] : [],
            task: item.task,
            time: item.time
          };
        } else {
          if (jp && !grouped[key].jps.includes(jp)) {
            grouped[key].jps.push(jp);
          }
        }
      });

      tasksByDate[isoDate] = Object.values(grouped).map(g => {
        const jpString = g.jps.length ? ` (${g.jps.join(', ')})` : '';
        return {
          subject: `${g.subject}${jpString}`,
          task: g.task,
          time: g.time,
          periodName: g.subject
        };
      });
    });

    return { pelajaranByDate, tasksByDate };
  } catch (err) {
    console.error('Failed to parse pelajaran ICS:', err);
    return { pelajaranByDate: {}, tasksByDate: {} };
  }
}

export function parseBirthdayICS(icsText: string, rangeStart: Date, rangeEnd: Date): Record<string, string[]> {
  const byMonthDay: Record<string, string[]> = {};
  if (!icsText) return byMonthDay;

  try {
    const jcalData = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const rStart = ICAL.Time.fromJSDate(rangeStart);
    const rEnd = ICAL.Time.fromJSDate(rangeEnd);

    vevents.forEach(ve => {
      try {
        const event = new ICAL.Event(ve);
        const rawSummary = event.summary || '';
        // Strip emoji and (X-B) tag
        const cleanName = rawSummary
          .replace(/^[🎂🎉\s]+/, '')
          .replace(/\s*\([Xx]-[Bb]\)\s*$/, '')
          .replace(/\s*\(Kelas[^)]*\)\s*$/i, '')
          .trim();

        if (!cleanName) return;

        if (event.isRecurring()) {
          const iter = event.iterator();
          let next;
          let guard = 0;
          while ((next = iter.next()) && guard < 1000) {
            guard++;
            if (next.compare(rStart) < 0) continue;
            if (next.compare(rEnd) > 0) break;
            const details = event.getOccurrenceDetails(next);
            const st = details.startDate;
            const key = `${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
            if (!byMonthDay[key]) byMonthDay[key] = [];
            if (!byMonthDay[key].includes(cleanName)) byMonthDay[key].push(cleanName);
          }
        } else {
          const st = event.startDate;
          const key = `${String(st.month).padStart(2, '0')}-${String(st.day).padStart(2, '0')}`;
          if (!byMonthDay[key]) byMonthDay[key] = [];
          if (!byMonthDay[key].includes(cleanName)) byMonthDay[key].push(cleanName);
        }
      } catch (err) {
        console.warn('Error parsing birthday event:', err);
      }
    });
  } catch (err) {
    console.error('Failed to parse birthday ICS:', err);
  }

  return byMonthDay;
}
