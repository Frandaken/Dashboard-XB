import { DOW_ID, MONTH_ID } from '../data/demoData';

export interface WIBDateInfo {
  iso: string;
  year: number;
  month: number; // 0-11
  day: number;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ...
  dowName: string;
  timeStr: string;
  formattedDate: string;
}

/**
 * Returns today's date and time strictly in Western Indonesia Time (WIB / Asia/Jakarta, UTC+7).
 * Uses Intl.DateTimeFormat so it is 100% independent of client browser timezone.
 */
export function getWIBDateParts(date: Date = new Date()): WIBDateInfo {
  // Use formatToParts for 100% cross-browser reliability (no split(', ') or separator assumptions)
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

  const parts = formatter.formatToParts(date);
  let yStr = '2026';
  let mStr = '09';
  let dStr = '27';
  let hourStr = '00';
  let minStr = '00';
  let secStr = '00';

  for (const part of parts) {
    if (part.type === 'year') yStr = part.value;
    else if (part.type === 'month') mStr = part.value;
    else if (part.type === 'day') dStr = part.value;
    else if (part.type === 'hour') hourStr = part.value;
    else if (part.type === 'minute') minStr = part.value;
    else if (part.type === 'second') secStr = part.value;
  }

  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1; // 0-indexed
  const day = parseInt(dStr, 10);
  const iso = `${yStr}-${mStr.padStart(2, '0')}-${dStr.padStart(2, '0')}`;

  // Use UTC noon to safely calculate day of week without local browser timezone offset
  const noonDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const dayOfWeek = noonDate.getUTCDay();
  const dowName = DOW_ID[dayOfWeek];

  return {
    iso,
    year,
    month,
    day,
    dayOfWeek,
    dowName,
    timeStr: `${hourStr}:${minStr}:${secStr}`,
    formattedDate: `${dowName}, ${day} ${MONTH_ID[month]} ${year}`
  };
}

/**
 * Safely parses an ISO date string (YYYY-MM-DD) into components without timezone offsets.
 */
export function parseISODateParts(iso: string) {
  const parts = iso.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 1) - 1; // 0-indexed
  const day = parts[2] || 1;

  const noonDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const dayOfWeek = noonDate.getUTCDay();
  const dowName = DOW_ID[dayOfWeek];

  return {
    iso,
    year,
    month,
    day,
    dayOfWeek,
    dowName,
    formattedDate: `${dowName}, ${day} ${MONTH_ID[month]} ${year}`
  };
}

/**
 * Steps an ISO date string (YYYY-MM-DD) by deltaDays safely.
 */
export function stepISODate(iso: string, deltaDays: number): string {
  const { year, month, day } = parseISODateParts(iso);
  const date = new Date(Date.UTC(year, month, day + deltaDays, 12, 0, 0));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
