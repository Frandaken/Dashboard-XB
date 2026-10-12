import { DoaSchedule, MbgSchedule, PiketSchedule, IceBreakingSchedule } from '../types';

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

export function parseIceBreakingRows(rows: Record<string, string>[]): Record<string, IceBreakingSchedule> {
  const map: Record<string, IceBreakingSchedule> = {};
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

    const pelajaranPertama = (r['Pelajaran Pertama'] || r['Pelajaran'] || '').trim();

    const schedule: IceBreakingSchedule = {
      tanggal: formattedTanggal || r['Tanggal'] || '',
      isoDate: primaryIso || originalIso || '',
      hari: r['Hari'] || '',
      pelajaranPertama,
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

/**
 * Parses raw text into a 2D array of string cells preserving position
 */
export function parseRawCSVGrid(text: string): string[][] {
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

  return rows;
}

/**
 * Clean Rupiah string to numeric float value
 * e.g. "Rp 36.000" -> 36000, "-Rp 70.000" -> -70000
 */
export function parseRupiahNumber(val: string): number {
  if (!val) return 0;
  const isNegative = val.includes('-');
  const cleaned = val.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNegative ? -num : num;
}

import {
  KasDataStore,
  KasWeekColumn,
  KasStudentEntry,
  KasPengeluaranItem,
  KasPendapatanLainItem,
  KasRekapSummary,
  KasRekapBulan
} from '../types';

export function parseKasData(
  penunggakanCSV: string,
  pengeluaranCSV?: string,
  pendapatanLainCSV?: string,
  rekapCSV?: string
): KasDataStore {
  const grid = parseRawCSVGrid(penunggakanCSV);

  // Month header indices in penunggakan sheet
  const monthIndices = [2, 5, 10, 15, 21, 26];
  const weeks: KasWeekColumn[] = [];

  if (grid.length > 1) {
    const headerRow = grid[1];
    for (let c = 2; c <= 30; c++) {
      if (monthIndices.includes(c)) continue;
      const dateStr = headerRow[c] || '';
      if (!dateStr) continue;

      let monthName = '';
      for (const mIdx of monthIndices) {
        if (mIdx < c) {
          monthName = headerRow[mIdx] || monthName;
        }
      }

      weeks.push({
        colIndex: c,
        dateStr,
        monthName,
        label: `${dateStr} ${monthName}`.trim()
      });
    }
  }

  // Count active weeks (weeks that have at least one non-zero payment recorded)
  // or default to weeks where students have started paying
  const studentRows = grid.slice(2).filter(r => r[0] && !isNaN(parseInt(r[0], 10)));
  
  let activeWeeksCount = 0;
  weeks.forEach(w => {
    const hasAnyPayment = studentRows.some(r => {
      const cellVal = (r[w.colIndex] || '').replace(',', '.').trim();
      return parseFloat(cellVal) > 0;
    });
    if (hasAnyPayment) {
      activeWeeksCount++;
    }
  });

  if (activeWeeksCount === 0) activeWeeksCount = 1;

  const targetWajibPerStudent = activeWeeksCount * 3000;

  const students: KasStudentEntry[] = [];
  let totalKasTerkumpul = 0;
  let totalTunggakan = 0;

  studentRows.forEach(r => {
    const absen = parseInt(r[0], 10);
    const nama = (r[1] || '').trim();
    const payments: Record<number, number> = {};
    let totalBayar = 0;

    weeks.forEach(w => {
      const rawVal = (r[w.colIndex] || '').replace(',', '.').trim();
      const numVal = parseFloat(rawVal) || 0;
      // Nilai 1 angka di sheet Penunggakan (Rp): Rp 1.000
      const rupiahAmount = numVal * 1000;
      payments[w.colIndex] = rupiahAmount;
      totalBayar += rupiahAmount;
    });

    const rekapRaw = r[31] || '';
    const rekapSheet = parseRupiahNumber(rekapRaw);

    const tunggakan = Math.max(0, targetWajibPerStudent - totalBayar);
    const lebihBayar = Math.max(0, totalBayar - targetWajibPerStudent);

    let status: 'lunas' | 'nunggak' | 'lebih' = 'lunas';
    if (tunggakan > 0) {
      status = 'nunggak';
    } else if (lebihBayar > 0) {
      status = 'lebih';
    }

    totalKasTerkumpul += totalBayar;
    totalTunggakan += tunggakan;

    students.push({
      absen,
      nama,
      payments,
      totalBayar,
      targetWajib: targetWajibPerStudent,
      tunggakan,
      lebihBayar,
      status,
      rekapSheet
    });
  });

  // Sort students by absen ascending
  students.sort((a, b) => a.absen - b.absen);

  // Parse Pengeluaran
  const pengeluaranList: KasPengeluaranItem[] = [];
  if (pengeluaranCSV) {
    const pengRows = parseRawCSVGrid(pengeluaranCSV);
    pengRows.slice(1).forEach((r, idx) => {
      const tgl = (r[0] || '').trim();
      const barang = (r[1] || '').trim();
      const hargaTotal = parseRupiahNumber(r[4] || '');
      if (tgl && barang && hargaTotal > 0) {
        pengeluaranList.push({
          id: `peng_${idx}_${tgl}`,
          tanggal: tgl,
          barang,
          kuantitas: parseInt(r[2] || '1', 10) || 1,
          hargaSatuan: parseRupiahNumber(r[3] || ''),
          hargaTotal,
          saldo: (r[5] || '').trim(),
          bukti: (r[6] || '').trim()
        });
      }
    });
  }

  // Parse Pendapatan Lain
  const pendapatanLainList: KasPendapatanLainItem[] = [];
  if (pendapatanLainCSV) {
    const pendRows = parseRawCSVGrid(pendapatanLainCSV);
    pendRows.slice(1).forEach((r, idx) => {
      const tgl = (r[0] || '').trim();
      const ket = (r[1] || '').trim();
      const jml = parseRupiahNumber(r[2] || '');
      if (tgl && ket && jml > 0) {
        pendapatanLainList.push({
          id: `pend_${idx}_${tgl}`,
          tanggal: tgl,
          keterangan: ket,
          jumlah: jml,
          bukti: (r[3] || '').trim()
        });
      }
    });
  }

  // Parse Rekap Keseluruhan
  let saldoTotal = 0;
  let totalPendapatan = 0;
  let totalPengeluaran = 0;
  let kasSemesterGanjil = totalKasTerkumpul;
  let kasSemesterGenap = 0;
  let pendapatanLain = 0;
  const pengeluaranPerBulan: KasRekapBulan[] = [];

  if (rekapCSV) {
    const rekRows = parseRawCSVGrid(rekapCSV);
    rekRows.forEach(r => {
      const col1 = (r[1] || '').trim();
      const col2 = (r[2] || '').trim();
      const col3 = (r[3] || '').trim();
      const col4 = (r[4] || '').trim();

      // Check for Saldo in row 0/1
      if (col1.toLowerCase() === 'saldo' && rekRows[1] && rekRows[1][1]) {
        saldoTotal = parseRupiahNumber(rekRows[1][1]);
      }
      if (col1.toLowerCase() === 'pendapatan' && col3.toLowerCase() === 'pengeluaran') {
        // next row has numbers
      }
      if (r[1] && r[1].toLowerCase().includes('kas semester ganjil')) {
        kasSemesterGanjil = parseRupiahNumber(col2) || kasSemesterGanjil;
      }
      if (r[1] && r[1].toLowerCase().includes('kas semester genap')) {
        kasSemesterGenap = parseRupiahNumber(col2);
      }
      if (r[1] && r[1].toLowerCase().includes('pendapatan lain')) {
        pendapatanLain = parseRupiahNumber(col2);
      }

      // Monthly expenses in col 3 & 4
      if (col3 && (col3.includes('2026') || col3.includes('2027'))) {
        const nominal = parseRupiahNumber(col4);
        pengeluaranPerBulan.push({
          bulan: col3,
          nominal
        });
      }
    });

    // Check specific summary values
    if (rekRows.length >= 4) {
      const p1 = parseRupiahNumber(rekRows[3][1] || '');
      const p2 = parseRupiahNumber(rekRows[3][3] || '');
      if (p1 > 0) totalPendapatan = p1;
      if (p2 > 0) totalPengeluaran = p2;
    }
  }

  // If summary was not directly parsed from rekap sheet, derive cleanly
  if (totalPengeluaran === 0) {
    totalPengeluaran = pengeluaranList.reduce((acc, p) => acc + p.hargaTotal, 0);
  }
  if (pendapatanLain === 0) {
    pendapatanLain = pendapatanLainList.reduce((acc, p) => acc + p.jumlah, 0);
  }
  if (totalPendapatan === 0) {
    totalPendapatan = kasSemesterGanjil + kasSemesterGenap + pendapatanLain;
  }
  if (saldoTotal === 0) {
    saldoTotal = totalPendapatan - totalPengeluaran;
  }

  const rekapSummary: KasRekapSummary = {
    saldoTotal,
    totalPendapatan,
    totalPengeluaran,
    kasSemesterGanjil,
    kasSemesterGenap,
    pendapatanLain,
    pengeluaranPerBulan
  };

  return {
    weeks,
    students,
    totalKasTerkumpul,
    totalTunggakan,
    ratePerWeek: 3000,
    valuePerUnit: 1000,
    pengeluaranList,
    pendapatanLainList,
    rekapSummary,
    lastUpdated: new Date().toISOString()
  };
}

