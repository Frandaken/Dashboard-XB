import { WebsiteAgendaItem } from '../types';
import { stepISODate } from './dateUtils';

/**
 * Indexes SMA Putra Nirmala Website agenda items by ISO date (YYYY-MM-DD),
 * expanding multi-day spans (startDate..endDate inclusive) cleanly.
 */
export function buildWebsiteAgendaByDate(
  items?: WebsiteAgendaItem[]
): Record<string, WebsiteAgendaItem[]> {
  const map: Record<string, WebsiteAgendaItem[]> = {};
  if (!items || items.length === 0) return map;

  for (const item of items) {
    const startIso = item?.startDate || item?.isoDate;
    if (!startIso || !/^\d{4}-\d{2}-\d{2}$/.test(startIso)) continue;
    const endIso =
      item.endDate && /^\d{4}-\d{2}-\d{2}$/.test(item.endDate) && item.endDate >= startIso
        ? item.endDate
        : startIso;

    let current = startIso;
    let guard = 0;
    while (current <= endIso && guard < 60) {
      guard++;
      if (!map[current]) {
        map[current] = [];
      }
      if (!map[current].some(existing => existing.id === item.id && existing.title === item.title)) {
        map[current].push(item);
      }
      current = stepISODate(current, 1);
    }
  }

  return map;
}

/**
 * Merges newly fetched Website agenda items (e.g. from browsing another calendar month)
 * into an existing date-indexed map without duplicates.
 */
export function mergeWebsiteAgendaByDate(
  existing: Record<string, WebsiteAgendaItem[]> | undefined,
  incomingItems: WebsiteAgendaItem[]
): Record<string, WebsiteAgendaItem[]> {
  const incomingMap = buildWebsiteAgendaByDate(incomingItems);
  if (!existing || Object.keys(existing).length === 0) {
    return incomingMap;
  }

  const merged: Record<string, WebsiteAgendaItem[]> = { ...existing };
  for (const [iso, list] of Object.entries(incomingMap)) {
    const prevList = merged[iso] || [];
    const nextList = [...prevList];
    for (const item of list) {
      const idx = nextList.findIndex(e => e.id === item.id);
      if (idx >= 0) {
        nextList[idx] = item;
      } else {
        nextList.push(item);
      }
    }
    merged[iso] = nextList;
  }

  return merged;
}
