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

export function parseDoaRows(rows: Record<string, string>[]): Record<string, DoaSchedule> {
  const map: Record<string, DoaSchedule> = {};
  for (const r of rows) {
    const iso = ddmmyyyyToISO(r['Tanggal']);
    if (!iso) continue;
    map[iso] = {
      tanggal: r['Tanggal'] || '',
      isoDate: iso,
      hari: r['Hari'] || '',
      bacaanInjil: r['Bacaan Injil'] || '',
      bab: r['Bab'] || '',
      ayat: r['Ayat'] || '',
      doaPagi: r['Doa Pagi'] || '',
      renungan: r['Renungan'] || '',
      malaikatTuhan: r['Malaikat Tuhan'] || '',
      doaPenutup: r['Doa Penutup'] || ''
    };
  }
  return map;
}

export function parseMbgRows(rows: Record<string, string>[]): Record<string, MbgSchedule> {
  const map: Record<string, MbgSchedule> = {};
  for (const r of rows) {
    const iso = ddmmyyyyToISO(r['Tanggal']);
    if (!iso) continue;
    const petugas: string[] = [];
    Object.keys(r).forEach(k => {
      if (k.toLowerCase().startsWith('petugas')) {
        const val = r[k]?.trim();
        if (val) petugas.push(val);
      }
    });
    map[iso] = {
      tanggal: r['Tanggal'] || '',
      isoDate: iso,
      hari: r['Hari'] || '',
      petugas
    };
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
