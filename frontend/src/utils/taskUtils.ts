import { TaskItem } from '../types';
import { parseISODateParts } from './dateUtils';

/**
 * Extracts target deadline time in minutes (0-1439) from task time string or text.
 * Priority:
 * 1. Explicit deadline pattern in text (e.g. "tenggat 23:59", "pukul 15.00", "jam 13:30", "deadline 17:00")
 * 2. End time of time range in task.time (e.g. "08:40 - 09:25" -> 09:25)
 * 3. Single time in task.time (e.g. "08:40" -> 08:40)
 * 4. Fallback to end of day 23:59 if no time specified
 */
export function getTaskDeadlineMinutes(task: {
  time?: string;
  taskText?: string;
  taskTitle?: string;
  taskDetails?: string;
}): { minutes: number; timeStr: string } {
  const combinedText = `${task.taskTitle || ''} ${task.taskText || ''} ${task.taskDetails || ''}`.toLowerCase();

  // 1. Look for explicit deadline time in description
  const explicitMatch = combinedText.match(
    /(?:tenggat|pukul|jam|deadline|sebelum|maks(?:imal)?)\s*[:=]?\s*(\d{1,2})[:.](\d{2})/i
  );
  if (explicitMatch) {
    const h = parseInt(explicitMatch[1], 10);
    const m = parseInt(explicitMatch[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return {
        minutes: h * 60 + m,
        timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      };
    }
  }

  // 2. Look for time range in task.time: e.g. "08:40 - 09:25"
  if (task.time) {
    const rangeMatch = task.time.match(
      /(\d{1,2})[:.](\d{2})\s*(?:[-–—]|s\/d|\bto\b)\s*(\d{1,2})[:.](\d{2})/i
    );
    if (rangeMatch) {
      const h2 = parseInt(rangeMatch[3], 10);
      const m2 = parseInt(rangeMatch[4], 10);
      if (h2 >= 0 && h2 < 24 && m2 >= 0 && m2 < 60) {
        return {
          minutes: h2 * 60 + m2,
          timeStr: `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`
        };
      }
    }

    // 3. Look for single time in task.time: e.g. "08:40"
    const singleMatch = task.time.match(/(\d{1,2})[:.](\d{2})/);
    if (singleMatch) {
      const h = parseInt(singleMatch[1], 10);
      const m = parseInt(singleMatch[2], 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return {
          minutes: h * 60 + m,
          timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        };
      }
    }
  }

  // 4. Default: end of day
  return {
    minutes: 23 * 60 + 59,
    timeStr: '23:59'
  };
}

/**
 * Checks whether current WIB time has passed the deadline time specified on the task.
 * If current time is strictly greater than the task time, returns true (should be hidden).
 */
export function isTaskTimePassed(
  task: {
    time?: string;
    taskText?: string;
    taskTitle?: string;
    taskDetails?: string;
  },
  taskDateISO: string,
  todayISO: string,
  currentTimeWIB: string
): boolean {
  if (!taskDateISO) return false;

  // Past dates: whole date is earlier than today, so task has passed
  if (taskDateISO < todayISO) {
    return true;
  }

  // Future dates: date has not arrived yet, so task has NOT passed
  if (taskDateISO > todayISO) {
    return false;
  }

  // Task is TODAY: compare current WIB time with the deadline time
  const deadline = getTaskDeadlineMinutes(task);

  const nowParts = currentTimeWIB.match(/(\d{1,2})[:.](\d{2})/);
  if (!nowParts) return false;

  const nowMinutes = parseInt(nowParts[1], 10) * 60 + parseInt(nowParts[2], 10);

  // If current time in minutes is greater than or equal to deadline minutes, task is passed
  return nowMinutes >= deadline.minutes;
}

/**
 * Filters out tasks whose specified time has already passed.
 */
export function filterActiveTasks(
  tasks: TaskItem[],
  taskDateISO: string,
  todayISO: string,
  currentTimeWIB: string
): TaskItem[] {
  if (!tasks || tasks.length === 0) return [];
  return tasks.filter(task => !isTaskTimePassed(task, taskDateISO, todayISO, currentTimeWIB));
}

export interface UpcomingDeadlineItem extends TaskItem {
  isoDate: string;
  formattedDate: string;
  dowName: string;
  daysUntil: number;
}

export interface UpcomingDeadlinesResult {
  allUpcoming: UpcomingDeadlineItem[];
  displayedUpcoming: UpcomingDeadlineItem[];
  totalCount: number;
}

/**
 * Collects, sorts, and filters upcoming assignments (sumatif & PR) across all future dates.
 * Centralized source of truth used across Hero section tabs, banners, and deadline cards.
 */
export function getUpcomingDeadlines(
  tasksByDate: Record<string, TaskItem[]> | undefined,
  todayISO: string,
  currentTimeWIB: string,
  limit = 3
): UpcomingDeadlinesResult {
  const allUpcoming: UpcomingDeadlineItem[] = [];
  if (!tasksByDate) {
    return { allUpcoming: [], displayedUpcoming: [], totalCount: 0 };
  }

  const todayParts = parseISODateParts(todayISO);
  const todayUtc = Date.UTC(todayParts.year, todayParts.month, todayParts.day, 12, 0, 0);

  const sortedFutureDates = Object.keys(tasksByDate)
    .filter(d => d >= todayISO)
    .sort();

  for (const dateKey of sortedFutureDates) {
    const tasksOnDate = tasksByDate[dateKey] || [];
    const parts = parseISODateParts(dateKey);
    const targetUtc = Date.UTC(parts.year, parts.month, parts.day, 12, 0, 0);
    const daysUntil = Math.round((targetUtc - todayUtc) / (24 * 60 * 60 * 1000));

    for (const t of tasksOnDate) {
      if (t.taskType === 'agenda') continue;
      if (isTaskTimePassed(t, dateKey, todayISO, currentTimeWIB)) continue;

      allUpcoming.push({
        ...t,
        isoDate: dateKey,
        formattedDate: parts.formattedDate,
        dowName: parts.dowName,
        daysUntil
      });
    }
  }

  // Sort by date ascending, then time ascending
  allUpcoming.sort((a, b) => {
    if (a.isoDate !== b.isoDate) {
      return a.isoDate.localeCompare(b.isoDate);
    }
    return (a.time || '').localeCompare(b.time || '');
  });

  return {
    allUpcoming,
    displayedUpcoming: limit > 0 ? allUpcoming.slice(0, limit) : allUpcoming,
    totalCount: allUpcoming.length
  };
}

