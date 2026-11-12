import { PeriodItem, IceBreakingSchedule } from '../types';

export interface LessonSessionInfo {
  startTime: string; // e.g. "13:00"
  endTime: string;   // e.g. "13:45"
  timeRange: string; // e.g. "13:00 - 13:45"
  sessionLabel: string; // e.g. "Sosiologi (JP 8)"
}

/**
 * Finds the first lesson period for the given subject (e.g. Sosiologi or Geografi) on a date.
 */
export function getFirstLessonSession(
  isoDate: string,
  pelajaranPertama: string,
  pelajaranList?: PeriodItem[]
): LessonSessionInfo {
  const normSubject = (pelajaranPertama || '').toLowerCase().trim();

  if (pelajaranList && pelajaranList.length > 0) {
    const matched = pelajaranList.find(p => {
      const text = `${p.cleanName} ${p.rawSummary || ''} ${p.summary || ''}`.toLowerCase();
      return text.includes(normSubject);
    });

    if (matched && matched.time) {
      const parts = matched.time.split('-').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return {
          startTime: parts[0],
          endTime: parts[1],
          timeRange: `${parts[0]} - ${parts[1]}`,
          sessionLabel: matched.summary || matched.cleanName || pelajaranPertama
        };
      }
    }
  }

  // Standard fallback timetable based on day of week
  const dow = new Date(isoDate + 'T12:00:00Z').getUTCDay();
  if (dow === 1) { // Senin
    return {
      startTime: '13:00',
      endTime: '13:45',
      timeRange: '13:00 - 13:45',
      sessionLabel: 'Sosiologi (JP 8)'
    };
  } else if (dow === 2) { // Selasa
    return {
      startTime: '08:40',
      endTime: '09:25',
      timeRange: '08:40 - 09:25',
      sessionLabel: 'Geografi (JP 3)'
    };
  } else if (dow === 3) { // Rabu
    return {
      startTime: '10:30',
      endTime: '11:15',
      timeRange: '10:30 - 11:15',
      sessionLabel: 'Sosiologi (JP 5)'
    };
  }

  return {
    startTime: '13:00',
    endTime: '13:45',
    timeRange: '13:00 - 13:45',
    sessionLabel: pelajaranPertama || 'Pelajaran Pertama'
  };
}

/**
 * Gets current time in Asia/Jakarta (WIB) formatted as "HH:mm".
 */
export function getCurrentWIBTimeHHMM(): string {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(d);
  } catch {
    const d = new Date();
    // Fallback: UTC + 7
    const utcHours = d.getUTCHours() + 7;
    const hours = (utcHours % 24).toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Determines if Ice Breaking panel should be actively displayed right now based on:
 * - Current day matching the scheduled Ice Breaking date
 * - Current real-time clock strictly inside the first lesson session (startTime <= now <= endTime)
 */
export function isIceBreakingActiveNow(
  todayISO: string,
  schedule: IceBreakingSchedule | undefined,
  pelajaranList?: PeriodItem[]
): {
  isActive: boolean;
  session: LessonSessionInfo | null;
  currentTime: string;
} {
  const currentTime = getCurrentWIBTimeHHMM();

  if (!schedule || schedule.isoDate !== todayISO) {
    return { isActive: false, session: null, currentTime };
  }

  // Only active if there are officers assigned (or schedule defined)
  const session = getFirstLessonSession(schedule.isoDate, schedule.pelajaranPertama, pelajaranList);

  const isActive = currentTime >= session.startTime && currentTime <= session.endTime;

  return {
    isActive,
    session,
    currentTime
  };
}
