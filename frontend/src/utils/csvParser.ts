import { DoaSchedule, MbgSchedule, PiketSchedule } from '../types';

export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') i++;
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());

  return rows
    .slice(1)
    .filter(r => r.some(cell => cell.trim() !== ''))
    .map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] || '').trim();
      });
      return obj;
    });
}

export function ddmmyyyyToISO(s: string): string | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Normalizes date strings and intelligently detects common clerical typos
 * (e.g. typing 25/06/2026 instead of 25/09/2026 when surrounded by September dates).
 */
export function resolveRowISODate(
  currentRaw: string,
  prevRaw?: string,
  nextRaw?: string
): { primaryIso: string; originalIso: string | null; formattedTanggal: string } {
  const origIso = ddmmyyyyToISO(currentRaw);
  if (!origIso) return { primaryIso: '', originalIso: null, formattedTanggal: currentRaw };

  const m = currentRaw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { primaryIso: origIso, originalIso: origIso, formattedTanggal: currentRaw };

  const [, dStr, moStr, yStr] = m;
  const dayNum = parseInt(dStr, 10);
  const moNum = parseInt(moStr, 10);
  const yNum = parseInt(yStr, 10);

  const prevMatch = prevRaw ? prevRaw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) : null;
  const nextMatch = nextRaw ? nextRaw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) : null;

  let correctedMonth: number | null = null;

  // Case 1: Sandwiched between two dates of the same month (e.g. 24/09 and 28/09 with 25/06 in between)
  if (prevMatch && nextMatch) {
    const prevMo = parseInt(prevMatch[2], 10);
    const nextMo = parseInt(nextMatch[2], 10);
    const prevYr = parseInt(prevMatch[3], 10);
    const nextYr = parseInt(nextMatch[3], 10);

    if (prevMo === nextMo && prevYr === yNum && nextYr === yNum && moNum !== prevMo) {
      correctedMonth = prevMo;
    }
  }

  // Case 2: Preceded by a date in a consecutive sequence (e.g. 24/09/2026 -> 25/06/2026)
  if (correctedMonth === null && prevMatch) {
    const prevDay = parseInt(prevMatch[1], 10);
    const prevMo = parseInt(prevMatch[2], 10);
    const prevYr = parseInt(prevMatch[3], 10);

    if (prevYr === yNum && moNum !== prevMo && dayNum > prevDay && dayNum <= prevDay + 4) {
      correctedMonth = prevMo;
    }
  }

  if (correctedMonth !== null) {
    const correctedIso = `${yNum}-${String(correctedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const formattedTanggal = `${String(dayNum).padStart(2, '0')}/${String(correctedMonth).padStart(2, '0')}/${yNum}`;
    return { primaryIso: correctedIso, originalIso: origIso, formattedTanggal };
  }

  return { primaryIso: origIso, originalIso: origIso, formattedTanggal: currentRaw };
}

export function parseDoaRows(rows: Record<string, string>[]): Record<string, DoaSchedule> {
  const map: Record<string, DoaSchedule> = {};
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prevRaw = i > 0 ? rows[i - 1]['Tanggal'] : undefined;
    const nextRaw = i < rows.length - 1 ? rows[i + 1]['Tanggal'] : undefined;

    const { primaryIso, originalIso, formattedTanggal } = resolveRowISODate(r['Tanggal'] || '', prevRaw, nextRaw);
    if (!primaryIso && !originalIso) continue;

    const schedule: DoaSchedule = {
      tanggal: formattedTanggal || r['Tanggal'] || '',
      isoDate: primaryIso || originalIso || '',
      hari: r['Hari'] || '',
      bacaanInjil: r['Bacaan Injil'] || '',
      bab: r['Bab'] || '',
      ayat: r['Ayat'] || '',
      doaPagi: r['Doa Pagi'] || '',
      renungan: r['Renungan'] || '',
      malaikatTuhan: r['Malaikat Tuhan'] || '',
      doaPenutup: r['Doa Penutup'] || ''
    };

    if (primaryIso) {
      map[primaryIso] = schedule;
    }
    if (originalIso && originalIso !== primaryIso) {
      map[originalIso] = schedule;
    }
  }
  return map;
}

export function parseMbgRows(rows: Record<string, string>[]): Record<string, MbgSchedule> {
  const map: Record<string, MbgSchedule> = {};
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prevRaw = i > 0 ? rows[i - 1]['Tanggal'] : undefined;
    const nextRaw = i < rows.length - 1 ? rows[i + 1]['Tanggal'] : undefined;

    const { primaryIso, originalIso, formattedTanggal } = resolveRowISODate(r['Tanggal'] || '', prevRaw, nextRaw);
    if (!primaryIso && !originalIso) continue;

    const petugas: string[] = [];
    Object.keys(r).forEach(k => {
      if (k.toLowerCase().startsWith('petugas')) {
        const val = r[k]?.trim();
        if (val) petugas.push(val);
      }
    });
    const schedule: MbgSchedule = {
      tanggal: formattedTanggal || r['Tanggal'] || '',
      isoDate: primaryIso || originalIso || '',
      hari: r['Hari'] || '',
      petugas
    };

    if (primaryIso) {
      map[primaryIso] = schedule;
    }
    if (originalIso && originalIso !== primaryIso) {
      map[originalIso] = schedule;
    }
  }
  return map;
}

export function parsePiketRows(rows: Record<string, string>[]): Record<string, PiketSchedule> {
  const map: Record<string, PiketSchedule> = {};
  for (const r of rows) {
    const hari = (r['Hari'] || '').trim();
    if (!hari) continue;
    const petugas: string[] = [];
    Object.keys(r).forEach(k => {
      if (k.toLowerCase().startsWith('petugas')) {
        const val = r[k]?.trim();
        if (val) petugas.push(val);
      }
    });
    map[hari] = {
      hari,
      petugas
    };
  }
  return map;
}
