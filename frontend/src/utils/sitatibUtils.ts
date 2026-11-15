import { SitatibClassActivity } from '../types';
import { stepISODate } from './dateUtils';

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
