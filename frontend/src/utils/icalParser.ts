import ICAL from 'ical.js';
import { PeriodItem, TaskItem } from '../types';

export function parsePelajaranICS(
  icsText: string,
  rangeStart?: Date,
  rangeEnd?: Date
): {
  pelajaranByDate: Record<string, PeriodItem[]>;
  tasksByDate: Record<string, TaskItem[]>;
} {
  const pelajaranByDate: Record<string, PeriodItem[]> = {};
  const tasksByDate: Record<string, TaskItem[]> = {};

  if (!icsText || typeof icsText !== 'string' || !icsText.trim()) {
    return { pelajaranByDate, tasksByDate };
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

    const addPeriod = (dateKey: string, ev: ICAL.Event, startTime: string) => {
      const desc = ev.description ? ev.description.trim() : '';
      const summary = ev.summary || '';
      // Preserve subject name, also preserve JP session identifier if present
      const cleanName = summary.replace(/\s*-\s*JP\s*\d+/gi, '').trim() || summary || 'Pelajaran';
      
      // Extract JP (Jam Pelajaran) session info if present (e.g. "JP 1", "JP 3-4")
      const jpMatch = summary.match(/JP\s*\d+(?:\s*-\s*\d+)?/i);
      const sessionLabel = jpMatch ? jpMatch[0].toUpperCase() : '';

      const period: PeriodItem = {
        time: startTime,
        cleanName: cleanName,
        summary: sessionLabel ? `${cleanName} (${sessionLabel})` : summary,
        rawSummary: summary,
        hasTask: !!desc,
        taskText: desc,
        location: ev.location || ''
      };

      if (!pelajaranByDate[dateKey]) {
        pelajaranByDate[dateKey] = [];
      }
      pelajaranByDate[dateKey].push(period);

      if (desc) {
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push({
          id: `${ev.uid || 'task'}_${dateKey}_${startTime}`,
          subject: cleanName,
          taskText: desc,
          time: startTime
        });
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
                // When an instance has a recurrence override in Google Calendar,
                // use the override event's modified start time rather than the original recurring start time
                const timeToUse = overrideEv.startDate || next;
                const timeStr = formatPeriodTime(overrideEv, timeToUse);
                addPeriod(dKey, overrideEv, timeStr);
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

  return { pelajaranByDate, tasksByDate };
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
