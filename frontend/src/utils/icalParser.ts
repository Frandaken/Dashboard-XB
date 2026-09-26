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
      const cleanName = (ev.summary || '').replace(/\s*-\s*JP\s*\d+/gi, '').trim();
      const period: PeriodItem = {
        time: startTime,
        cleanName: cleanName || ev.summary || 'Pelajaran',
        summary: ev.summary || '',
        rawSummary: ev.summary || '',
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
          id: `${ev.uid}_${dateKey}`,
          subject: cleanName || ev.summary || 'Penugasan',
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
              const ev = overrides.get(`${event.uid}_${dKey}`) || event;
              const timeStr = formatPeriodTime(ev, next);
              addPeriod(dKey, ev, timeStr);
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

    // Also include any standalone overrides that weren't captured in recurring base loops
    overrides.forEach((ev, key) => {
      const parts = key.split('_');
      const dKey = parts[parts.length - 1];
      if (dKey && !pelajaranByDate[dKey]?.some(p => p.summary === ev.summary)) {
        const st = ev.startDate;
        const timeStr = st ? formatPeriodTime(ev, st) : '';
        addPeriod(dKey, ev, timeStr);
      }
    });

    // Helper to convert HH:MM to minutes
    const timeToMinutes = (t: string): number => {
      if (!t) return 0;
      const parts = t.split(':').map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
      return parts[0] * 60 + parts[1];
    };

    // Merge adjacent periods if same subject and same task/topic
    const mergeAdjacentPeriods = (periods: PeriodItem[]): PeriodItem[] => {
      if (!periods || periods.length <= 1) return periods;
      const sorted = [...periods].sort((a, b) => a.time.localeCompare(b.time));
      const result: PeriodItem[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const cur = { ...sorted[i] };
        if (result.length === 0) {
          result.push(cur);
          continue;
        }

        const prev = result[result.length - 1];
        const sameSubject = prev.cleanName.trim().toLowerCase() === cur.cleanName.trim().toLowerCase();
        const prevTask = (prev.taskText || '').trim().toLowerCase();
        const curTask = (cur.taskText || '').trim().toLowerCase();
        const sameTopic = prevTask === curTask;

        const [pStart, pEnd] = prev.time.split(' - ').map(s => s.trim());
        const [cStart, cEnd] = cur.time.split(' - ').map(s => s.trim());

        const isAdjacent = pEnd && cStart && (
          pEnd === cStart ||
          Math.abs(timeToMinutes(cStart) - timeToMinutes(pEnd)) <= 15
        );

        if (sameSubject && sameTopic && isAdjacent) {
          // Merge cur into prev
          prev.time = `${pStart || cStart} - ${cEnd || pEnd || cStart}`;
          if (cur.taskText && !prev.taskText) {
            prev.taskText = cur.taskText;
            prev.hasTask = true;
          }
          if (prev.summary && cur.summary && prev.summary !== cur.summary) {
            prev.summary = `${prev.summary} / ${cur.summary}`;
          }
        } else {
          result.push(cur);
        }
      }
      return result;
    };

    // Sort & merge events, and re-sync tasks for every date
    for (const key of Object.keys(pelajaranByDate)) {
      pelajaranByDate[key] = mergeAdjacentPeriods(pelajaranByDate[key]);

      // Re-populate clean tasks for this date from merged periods
      tasksByDate[key] = [];
      const seenTasks = new Set<string>();
      for (const p of pelajaranByDate[key]) {
        if (p.hasTask && p.taskText) {
          const taskKey = `${p.cleanName}_${p.taskText}`.toLowerCase();
          if (!seenTasks.has(taskKey)) {
            seenTasks.add(taskKey);
            tasksByDate[key].push({
              id: `${key}_${p.cleanName}_${p.time}`,
              subject: p.cleanName,
              taskText: p.taskText,
              time: p.time
            });
          }
        }
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
