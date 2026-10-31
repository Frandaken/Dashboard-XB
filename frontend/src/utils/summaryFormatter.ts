import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, TaskItem, IceBreakingSchedule, ClassDataStore, CalendarEventNotice } from '../types';
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
  eventNotices?: CalendarEventNotice[];
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
    eventNotices = [],
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

  // Notice / All-day or Multi-day events
  if (eventNotices && eventNotices.length > 0) {
    lines.push('📢 *PENGUMUMAN / KEGIATAN KHUSUS*');
    eventNotices.forEach(n => {
      const dayLabel = n.isMultiDay ? ` (Hari ke-${n.dayIndex} dari ${n.totalDays})` : ' (Sepanjang Hari)';
      const loc = n.location ? `\n  📍 Lokasi: ${n.location}` : '';
      const desc = n.description ? `\n  ℹ️ ${n.description}` : '';
      lines.push(`• *${n.title}*${dayLabel}${loc}${desc}`);
    });
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
      let agendaSuffix = '';
      if (p.hasTask && p.taskType === 'agenda') {
        const agTitle = (p.taskTitle || p.taskText || '').trim();
        if (agTitle) {
          agendaSuffix = ` — _(Agenda: ${agTitle})_`;
        }
      }
      lines.push(`${idx + 1}. ${timePart}${p.cleanName}${agendaSuffix}`);
    });
    lines.push('');
  }

  // Collect and separate Tasks (Sumatif/PR) vs Agenda Harian
  const validTasks = (tasks || []).filter(t => (t.taskTitle || t.taskText || '').trim().length > 0);

  // Combine agenda tasks from tasks array and pelajaran items
  const combinedAgenda: { subject: string; title: string; details?: string; attachment?: any }[] = [];
  const seenAgenda = new Set<string>();

  validTasks.filter(t => t.taskType === 'agenda').forEach(t => {
    const title = (t.taskTitle || t.taskText || '').trim();
    const key = `${t.subject}_${title}`.toLowerCase();
    if (!seenAgenda.has(key)) {
      seenAgenda.add(key);
      combinedAgenda.push({
        subject: t.subject,
        title,
        details: t.taskDetails,
        attachment: t.attachment
      });
    }
  });

  pelajaran.filter(p => p.hasTask && p.taskType === 'agenda').forEach(p => {
    const title = (p.taskTitle || (p.taskText ? p.taskText.split('\n')[0] : '')).trim();
    if (title) {
      const key = `${p.cleanName}_${title}`.toLowerCase();
      if (!seenAgenda.has(key)) {
        seenAgenda.add(key);
        combinedAgenda.push({
          subject: p.cleanName,
          title,
          details: p.taskDetails,
          attachment: p.attachment
        });
      }
    }
  });

  const academicTasks = validTasks.filter(t => t.taskType === 'sumatif' || t.taskType === 'pr');

  // Tasks & Homework (Sumatif & PR only)
  if (academicTasks.length > 0) {
    lines.push('📝 *TUGAS & PENUGASAN*');
    academicTasks.forEach(t => {
      const title = (t.taskTitle || t.taskText || '').trim();
      const details = t.taskDetails ? ` (${t.taskDetails.trim()})` : '';
      const attachNote = t.attachment ? ` [📎 Lampiran: ${t.attachment.filename || 'Gambar'}]` : '';
      if (t.taskType === 'sumatif') {
        // Khusus sumatif dibold di WhatsApp
        lines.push(`- *${t.subject}: ${title}${details}${attachNote}*`);
      } else {
        lines.push(`- ${t.subject}: ${title}${details}${attachNote}`);
      }
    });
    lines.push('');
  }

  // Agenda Harian: Tampilkan khusus untuk penugasan/agenda yang beratribut agenda
  if (combinedAgenda.length > 0) {
    lines.push('📌 *AGENDA HARIAN*');
    combinedAgenda.forEach(ag => {
      const details = ag.details ? ` (${ag.details.trim()})` : '';
      const attachNote = ag.attachment ? ` [📎 Lampiran: ${ag.attachment.filename || 'Gambar'}]` : '';
      lines.push(`- ${ag.subject}: ${ag.title}${details}${attachNote}`);
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

export interface FlexibleSummaryOptions {
  includeSong?: boolean;
  includeDoa?: boolean;
  includePiket?: boolean;
  includeMbg?: boolean;
  includeIceBreaking?: boolean;
  includeLessons?: boolean;
  includeTasks?: boolean;
  includeAgenda?: boolean;
  includeBirthdays?: boolean;
  includeKasNote?: boolean;
  titleHeader?: string;
  websiteUrl?: string;
}

/**
 * Generates an array of ISO date strings between startIso and endIso (inclusive).
 */
export function getDateRangeISOs(startIso: string, endIso: string, schoolDaysOnly: boolean = true): string[] {
  const result: string[] = [];
  if (!startIso || !endIso) return result;

  const [minIso, maxIso] = startIso <= endIso ? [startIso, endIso] : [endIso, startIso];
  let current = minIso;

  let count = 0;
  while (current <= maxIso && count < 60) {
    count++;
    const parts = parseISODateParts(current);
    if (!schoolDaysOnly || (parts.dayOfWeek !== 0 && parts.dayOfWeek !== 6)) {
      result.push(current);
    }
    current = stepISODate(current, 1);
  }
  return result;
}

/**
 * Formats a clean, structured schedule summary for any arbitrary list of dates.
 */
export function formatCustomRangeSummary(
  dateIsos: string[],
  store: ClassDataStore,
  options?: FlexibleSummaryOptions
): string {
  const {
    includeSong = true,
    includeDoa = true,
    includePiket = true,
    includeMbg = true,
    includeIceBreaking = true,
    includeLessons = true,
    includeTasks = true,
    includeAgenda = true,
    includeBirthdays = true,
    includeKasNote = true,
    titleHeader,
    websiteUrl = DEFAULT_SERVER_URL
  } = options || {};

  const serverUrl = sanitizeServerUrl(websiteUrl);
  if (!dateIsos || dateIsos.length === 0) {
    return 'Tidak ada tanggal yang dipilih untuk diekspor.';
  }

  const lines: string[] = [];
  const firstParts = parseISODateParts(dateIsos[0]);
  const lastParts = parseISODateParts(dateIsos[dateIsos.length - 1]);

  const defaultTitle = dateIsos.length === 5 && firstParts.dayOfWeek === 1 && lastParts.dayOfWeek === 5
    ? '*AGENDA MINGGUAN KELAS XB — SMA PUTRA NIRMALA*'
    : '*AGENDA KELAS XB — SMA PUTRA NIRMALA*';

  lines.push(titleHeader || defaultTitle);
  lines.push(`🗓️ *Periode: ${firstParts.day} ${MONTH_ID[firstParts.month]} – ${lastParts.day} ${MONTH_ID[lastParts.month]} ${lastParts.year}*`);
  lines.push('');

  // Song of the week (from middle date)
  if (includeSong && dateIsos.length > 0) {
    const midIdx = Math.floor(dateIsos.length / 2);
    const midParts = parseISODateParts(dateIsos[midIdx]);
    const midDate = new Date(Date.UTC(midParts.year, midParts.month, midParts.day, 12, 0, 0));
    const songData = getSongForDate(midDate);
    const songComposer = SONG_LYRICS_DB[songData.song]?.composer;
    if (songData.song && songData.song !== '-' && songData.song.toLowerCase() !== 'blank') {
      lines.push('> 🎵 *Lagu Wajib Pekan Ini:*');
      lines.push(`> ${songData.song}${songComposer ? ` (${songComposer})` : ''}`);
      lines.push('');
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  const rangeBirthdays: { dateStr: string; name: string }[] = [];

  dateIsos.forEach(dayIso => {
    const dayParts = parseISODateParts(dayIso);
    const dayNameUpper = dayParts.dowName.toUpperCase();
    const monthUpper = MONTH_ID[dayParts.month].toUpperCase();

    lines.push(`*${dayNameUpper}, ${dayParts.day} ${monthUpper} ${dayParts.year}*`);

    // Notices / Events for this day
    const dayNotices = store.eventNoticesByDate ? (store.eventNoticesByDate[dayIso] || []) : [];
    if (dayNotices.length > 0) {
      const noticeStr = dayNotices.map(n => {
        const dayLabel = n.isMultiDay ? ` (Hari ke-${n.dayIndex}/${n.totalDays})` : '';
        const loc = n.location ? ` @ ${n.location}` : '';
        return `📢 *${n.title}*${dayLabel}${loc}`;
      }).join('; ');
      lines.push(`• *Kegiatan:* ${noticeStr}`);
    }

    // Lessons
    if (includeLessons) {
      const lessons = store.pelajaranByDate[dayIso] || [];
      if (lessons.length > 0) {
        const subjectList = Array.from(new Set(lessons.map(l => l.cleanName))).join(', ');
        lines.push(`• *Pelajaran:* ${subjectList}`);
      } else {
        lines.push('• *Pelajaran:* -');
      }
    }

    // Tasks & Agenda: Pisahkan tugas akademis (Sumatif & PR) dan agenda kegiatan
    const validTasks = (store.tasksByDate[dayIso] || []).filter(t => (t.taskTitle || t.taskText || '').trim().length > 0);
    const academicTasks = validTasks.filter(t => t.taskType === 'sumatif' || t.taskType === 'pr');
    const agendaTasks = validTasks.filter(t => t.taskType === 'agenda');

    if (includeTasks && academicTasks.length > 0) {
      const taskStr = academicTasks.map(t => {
        const title = (t.taskTitle || t.taskText || '').trim();
        const attachStr = t.attachment ? ` [📎 ${t.attachment.filename || 'Gambar'}]` : '';
        if (t.taskType === 'sumatif') {
          // BOLD khusus untuk sumatif
          return `*${t.subject} (${title}${attachStr})*`;
        }
        return `${t.subject} (${title}${attachStr})`;
      }).join('; ');
      lines.push(`• *Tugas:* ${taskStr}`);
    }

    if (includeAgenda && agendaTasks.length > 0) {
      const agendaStr = agendaTasks.map(t => {
        const title = (t.taskTitle || t.taskText || '').trim();
        const attachStr = t.attachment ? ` [📎 ${t.attachment.filename || 'Gambar'}]` : '';
        return `${t.subject} (${title}${attachStr})`;
      }).join('; ');
      lines.push(`• *Agenda:* ${agendaStr}`);
    }

    // Piket (lookup by day name)
    if (includePiket) {
      const piket = store.piketByDow[dayParts.dowName];
      if (piket && piket.petugas && piket.petugas.length > 0) {
        lines.push(`• *Petugas Piket:* ${piket.petugas.join(', ')}`);
      }
    }

    // MBG
    if (includeMbg) {
      const mbg = store.mbgByDate[dayIso];
      if (mbg && mbg.petugas && mbg.petugas.length > 0) {
        lines.push(`• *Petugas MBG:* ${mbg.petugas.join(', ')}`);
      }
    }

    // Ice Breaking
    if (includeIceBreaking) {
      const ice = store.iceBreakingByDate[dayIso];
      if (ice && ice.petugas && ice.petugas.length > 0) {
        const subj = ice.pelajaranPertama ? ` (${ice.pelajaranPertama})` : '';
        lines.push(`• *Ice Breaking:* ${ice.petugas.join(', ')}${subj}`);
      }
    }

    // Doa (Tampilkan seluruh petugas doa: Doa Pagi, Renungan, Malaikat Tuhan, Doa Penutup)
    if (includeDoa) {
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
    }

    // Check birthdays for this day
    if (includeBirthdays) {
      const mStr = String(dayParts.month + 1).padStart(2, '0');
      const dStr = String(dayParts.day).padStart(2, '0');
      const bdays = store.birthdayByMonthDay[`${mStr}-${dStr}`] || [];
      bdays.forEach(name => {
        rangeBirthdays.push({
          dateStr: `${dayParts.day} ${MONTH_ID[dayParts.month].slice(0, 3)}`,
          name
        });
      });
    }

    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━');

  // Birthdays in this range
  if (includeBirthdays && rangeBirthdays.length > 0) {
    lines.push('🎂 *Ulang Tahun pada Periode Ini:*');
    rangeBirthdays.forEach(b => {
      lines.push(`- ${b.dateStr}: ${b.name}`);
    });
    lines.push('');
  }

  // Kas note
  if (includeKasNote) {
    lines.push('💰 *Pengingat Kas Murid:*');
    lines.push('Iuran kas rutin Rp 3.000/minggu dapat diserahkan ke bendahara kelas.');
    lines.push('');
  }

  // Footer
  lines.push(`_Info lengkap: ${serverUrl}_`);

  return lines.join('\n');
}

/**
 * Formats a clean, structured weekly schedule summary (Monday to Friday) using text formatting rules.
 */
export function formatWeeklySummary(params: WeeklySummaryParams): string {
  const schoolDays = getSchoolWeekISODates(params.baseIso);
  return formatCustomRangeSummary(schoolDays, params.store, {
    websiteUrl: params.websiteUrl
  });
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
