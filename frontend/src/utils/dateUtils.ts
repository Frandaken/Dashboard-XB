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
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const formatted = formatter.format(date);
  const [datePart, timePart] = formatted.split(', ');
  const [yStr, mStr, dStr] = datePart.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1; // 0-indexed
  const day = parseInt(dStr, 10);
  const iso = `${yStr}-${mStr}-${dStr}`;

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
    timeStr: timePart || '00:00:00',
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
