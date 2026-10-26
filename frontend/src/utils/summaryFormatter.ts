import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, TaskItem, IceBreakingSchedule, ClassDataStore } from '../types';
import { MONTH_ID } from '../data/demoData';
import { parseISODateParts, stepISODate } from './dateUtils';
import { getSongForDate, SONG_LYRICS_DB } from '../data/songSchedule';

export const DEFAULT_SERVER_URL = 'x-b.abipraya.id';

/**
 * Sanitizes server URL to ensure no http:// or https:// and no trailing slash.
 */
export function sanitizeServerUrl(url?: string): string {
  if (!url) return DEFAULT_SERVER_URL;
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || DEFAULT_SERVER_URL;
}

export interface DailySummaryParams {
  isoDate: string;
  doa?: DoaSchedule;
  pelajaran?: PeriodItem[];
  tasks?: TaskItem[];
  piket?: PiketSchedule;
  mbg?: MbgSchedule;
  iceBreaking?: IceBreakingSchedule;
  birthdays?: string[];
  websiteUrl?: string;
}

export interface WeeklySummaryParams {
  baseIso: string;
  store: ClassDataStore;
  websiteUrl?: string;
}

/**
 * Returns Monday to Friday ISO dates for the school week around baseIso.
 * If baseIso is Sunday or Saturday, returns Monday-Friday of the upcoming week.
 */
export function getSchoolWeekISODates(baseIso: string): string[] {
  const parts = parseISODateParts(baseIso);
  const dow = parts.dayOfWeek; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

  let mondayOffset = 0;
  if (dow === 0) {
    mondayOffset = 1;
  } else if (dow === 6) {
    mondayOffset = 2;
  } else {
    mondayOffset = 1 - dow;
  }

  const mondayIso = stepISODate(baseIso, mondayOffset);
  const result: string[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(stepISODate(mondayIso, i));
  }
  return result;
}

/**
 * Formats a clean, structured daily schedule summary using text formatting rules.
 * Strictly adheres to single asterisk *bold* and _italic_ on single lines.
 */
export function formatDailySummary(params: DailySummaryParams): string {
  const {
    isoDate,
    doa,
    pelajaran = [],
    tasks = [],
    piket,
    mbg,
    iceBreaking,
    birthdays = [],
    websiteUrl = DEFAULT_SERVER_URL
  } = params;

  const serverUrl = sanitizeServerUrl(websiteUrl);
  const parts = parseISODateParts(isoDate);
  const d = new Date(Date.UTC(parts.year, parts.month, parts.day, 12, 0, 0));
  const songData = getSongForDate(d);
  const songComposer = SONG_LYRICS_DB[songData.song]?.composer;

  const lines: string[] = [];

  // Title & Date
  lines.push('*JADWAL KELAS XB — SMA PUTRA NIRMALA*');
  lines.push(`📅 *${parts.formattedDate}*`);
  lines.push('_Semangat belajar dan bertugas untuk hari ini!_');
  lines.push('');

  // Song of the week (if available)
  if (songData.song && songData.song !== '-' && songData.song.toLowerCase() !== 'blank') {
    lines.push('> 🎵 *Lagu Wajib Pekan Ini:*');
    lines.push(`> ${songData.song}${songComposer ? ` (${songComposer})` : ''}`);
    lines.push('');
  }

  // Daily Prayer & Gospel reading
  if (doa && (doa.bacaanInjil || doa.doaPagi || doa.renungan || doa.malaikatTuhan || doa.doaPenutup)) {
    lines.push('📖 *BACAAN & DOA HARIAN*');
    if (doa.bacaanInjil) {
      lines.push(`• Bacaan: Injil ${doa.bacaanInjil} ${doa.bab}:${doa.ayat}`);
    }
    lines.push(`• Doa Pagi: ${doa.doaPagi || '-'}`);
    lines.push(`• Renungan: ${doa.renungan || '-'}`);
    const isTugasMalaikat = Boolean(doa.tugasMalaikatTuhan);
    const hasTugasText = (doa.malaikatTuhan || '').toLowerCase().includes('tugas');
    const malaikatSuffix = isTugasMalaikat && !hasTugasText ? ' (Tugas)' : '';
    const rawMalaikat = doa.malaikatTuhan ? `${doa.malaikatTuhan}${malaikatSuffix}` : (isTugasMalaikat ? '- (Tugas)' : '-');
    const malaikatDisplay = isTugasMalaikat ? `*${rawMalaikat}*` : rawMalaikat;
    lines.push(`• Malaikat Tuhan: ${malaikatDisplay}`);
    lines.push(`• Doa Penutup: ${doa.doaPenutup || '-'}`);
    lines.push('');
  }

  // School Lessons
  if (pelajaran && pelajaran.length > 0) {
    lines.push('📚 *JADWAL PELAJARAN*');
    pelajaran.forEach((p, idx) => {
      const timePart = p.time ? `${p.time} | ` : '';
      lines.push(`${idx + 1}. ${timePart}${p.cleanName}`);
    });
    lines.push('');
  }

  // Tasks & Homework: Tampilkan tepat di bawah jadwal pelajaran jika ada tugas, kalau tidak ada tidak usah tampilkan
  const validTasks = (tasks || []).filter(t => (t.taskTitle || t.taskText || '').trim().length > 0);
  if (validTasks.length > 0) {
    lines.push('📝 *TUGAS & PENUGASAN*');
    validTasks.forEach(t => {
      const title = (t.taskTitle || t.taskText || '').trim();
      const details = t.taskDetails ? ` (${t.taskDetails.trim()})` : '';
      lines.push(`- ${t.subject}: ${title}${details}`);
    });
    lines.push('');
  }

  // Daily Duty Officers (Piket, MBG, Ice Breaking)
  const hasPiket = piket && piket.petugas && piket.petugas.length > 0;
  const hasMbg = mbg && mbg.petugas && mbg.petugas.length > 0;
  const hasIce = iceBreaking && iceBreaking.petugas && iceBreaking.petugas.length > 0;

  if (hasPiket || hasMbg || hasIce) {
    lines.push('👥 *PETUGAS KELAS HARI INI*');
    if (hasPiket) {
      lines.push('• *Petugas Piket:*');
      lines.push(`  ${piket.petugas.join(', ')}`);
    }
    if (hasMbg) {
      lines.push('• *Petugas MBG (Makan Bergizi):*');
      lines.push(`  ${mbg.petugas.join(', ')}`);
    }
    if (hasIce) {
      const subjectNote = iceBreaking.pelajaranPertama ? ` (${iceBreaking.pelajaranPertama})` : '';
      lines.push(`• *Petugas Ice Breaking${subjectNote}:*`);
      lines.push(`  ${iceBreaking.petugas.join(', ')}`);
    }
    lines.push('');
  }

  // Birthdays
  if (birthdays && birthdays.length > 0) {
    lines.push('🎂 *ULANG TAHUN HARI INI*');
    birthdays.forEach(b => {
      lines.push(`- ${b}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`_Dashboard Kelas: ${serverUrl}_`);

  return lines.join('\n');
}

/**
 * Formats a clean, structured weekly schedule summary (Monday to Friday) using text formatting rules.
 */
export function formatWeeklySummary(params: WeeklySummaryParams): string {
  const {
    baseIso,
    store,
    websiteUrl = DEFAULT_SERVER_URL
  } = params;

  const serverUrl = sanitizeServerUrl(websiteUrl);
  const schoolDays = getSchoolWeekISODates(baseIso);
  const mondayParts = parseISODateParts(schoolDays[0]);
  const fridayParts = parseISODateParts(schoolDays[4]);

  const midDate = new Date(Date.UTC(mondayParts.year, mondayParts.month, mondayParts.day, 12, 0, 0));
  const songData = getSongForDate(midDate);
  const songComposer = SONG_LYRICS_DB[songData.song]?.composer;

  const lines: string[] = [];

  // Header
  lines.push('*AGENDA MINGGUAN KELAS XB — SMA PUTRA NIRMALA*');
  lines.push(`🗓️ *Periode: ${mondayParts.day} ${MONTH_ID[mondayParts.month]} – ${fridayParts.day} ${MONTH_ID[fridayParts.month]} ${fridayParts.year}*`);
  lines.push('');

  // Song of the week
  if (songData.song && songData.song !== '-' && songData.song.toLowerCase() !== 'blank') {
    lines.push('> 🎵 *Lagu Wajib Pekan Ini:*');
    lines.push(`> ${songData.song}${songComposer ? ` (${songComposer})` : ''}`);
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Weekly birthdays accumulator
  const weeklyBirthdays: { dateStr: string; name: string }[] = [];

  // Each school day (Monday to Friday)
  schoolDays.forEach(dayIso => {
    const dayParts = parseISODateParts(dayIso);
    const dayNameUpper = dayParts.dowName.toUpperCase();
    const monthUpper = MONTH_ID[dayParts.month].toUpperCase();

    lines.push(`*${dayNameUpper}, ${dayParts.day} ${monthUpper} ${dayParts.year}*`);

    // Lessons
    const lessons = store.pelajaranByDate[dayIso] || [];
    if (lessons.length > 0) {
      const subjectList = Array.from(new Set(lessons.map(l => l.cleanName))).join(', ');
      lines.push(`• *Pelajaran:* ${subjectList}`);
    } else {
      lines.push('• *Pelajaran:* -');
    }

    // Tasks: jika ada tugas, tampilkan di bawah bagian jadwal/pelajaran, kalau tidak ada tidak usah tampilkan
    const validTasks = (store.tasksByDate[dayIso] || []).filter(t => (t.taskTitle || t.taskText || '').trim().length > 0);
    if (validTasks.length > 0) {
      const taskStr = validTasks.map(t => {
        const title = (t.taskTitle || t.taskText || '').trim();
        return `${t.subject} (${title})`;
      }).join('; ');
      lines.push(`• *Tugas:* ${taskStr}`);
    }

    // Piket (lookup by day name)
    const piket = store.piketByDow[dayParts.dowName];
    if (piket && piket.petugas && piket.petugas.length > 0) {
      lines.push(`• *Petugas Piket:* ${piket.petugas.join(', ')}`);
    }

    // MBG
    const mbg = store.mbgByDate[dayIso];
    if (mbg && mbg.petugas && mbg.petugas.length > 0) {
      lines.push(`• *Petugas MBG:* ${mbg.petugas.join(', ')}`);
    }

    // Ice Breaking
    const ice = store.iceBreakingByDate[dayIso];
    if (ice && ice.petugas && ice.petugas.length > 0) {
      const subj = ice.pelajaranPertama ? ` (${ice.pelajaranPertama})` : '';
      lines.push(`• *Ice Breaking:* ${ice.petugas.join(', ')}${subj}`);
    }

    // Doa (Tampilkan seluruh petugas doa: Doa Pagi, Renungan, Malaikat Tuhan, Doa Penutup)
    const doa = store.doaByDate[dayIso];
    if (doa && (doa.doaPagi || doa.renungan || doa.malaikatTuhan || doa.doaPenutup)) {
      const doaParts: string[] = [];
      if (doa.doaPagi) doaParts.push(`${doa.doaPagi} (Pagi)`);
      if (doa.renungan) doaParts.push(`${doa.renungan} (Renungan)`);
      if (doa.malaikatTuhan) {
        const isTugas = Boolean(doa.tugasMalaikatTuhan);
        const hasTugasText = doa.malaikatTuhan.toLowerCase().includes('tugas');
        const malaikatLabel = isTugas && !hasTugasText
          ? `*${doa.malaikatTuhan} (Malaikat - Tugas)*`
          : `${doa.malaikatTuhan} (Malaikat)`;
        doaParts.push(malaikatLabel);
      } else if (doa.tugasMalaikatTuhan) {
        doaParts.push('*(Malaikat - Tugas)*');
      }
      if (doa.doaPenutup) doaParts.push(`${doa.doaPenutup} (Penutup)`);
      if (doaParts.length > 0) {
        lines.push(`• *Petugas Doa:* ${doaParts.join(', ')}`);
      }
    }

    // Check birthdays for this day
    const mStr = String(dayParts.month + 1).padStart(2, '0');
    const dStr = String(dayParts.day).padStart(2, '0');
    const bdays = store.birthdayByMonthDay[`${mStr}-${dStr}`] || [];
    bdays.forEach(name => {
      weeklyBirthdays.push({
        dateStr: `${dayParts.day} ${MONTH_ID[dayParts.month].slice(0, 3)}`,
        name
      });
    });

    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━');

  // Birthdays in this week
  if (weeklyBirthdays.length > 0) {
    lines.push('🎂 *Ulang Tahun Pekan Ini:*');
    weeklyBirthdays.forEach(b => {
      lines.push(`- ${b.dateStr}: ${b.name}`);
    });
    lines.push('');
  }

  // Kas note
  lines.push('💰 *Pengingat Kas Murid:*');
  lines.push('Iuran kas rutin Rp 3.000/minggu dapat diserahkan ke bendahara kelas.');
  lines.push('');

  // Footer
  lines.push(`_Info lengkap: ${serverUrl}_`);

  return lines.join('\n');
}

/**
 * Copies plain text to clipboard safely with fallback for older browsers or if navigator.clipboard is unavailable.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
