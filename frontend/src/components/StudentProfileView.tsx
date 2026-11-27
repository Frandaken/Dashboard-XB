import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Wallet,
  Sparkles,
  Copy,
  Check,
  CalendarDays,
  HeartHandshake,
  Utensils,
  BookMarked
} from 'lucide-react';
import { ClassDataStore } from '../types';
import { Student, STUDENTS_DATA, PIKET_SCHEDULE_MAP } from '../constants/studentsData';
import { MONTH_ID } from '../constants/demoData';
import { parseISODateParts } from '../utils/dateUtils';
import { copyTextToClipboard } from '../utils/summaryFormatter';

export interface StudentSummaryData {
  student: Student;
  kas?: {
    totalBayar: number;
    targetWajib: number;
    tunggakan: number;
    lebihBayar: number;
    status: 'lunas' | 'nunggak' | 'lebih';
    payments?: Record<number, number>;
  };
  piket: {
    day: string;
    partners: Student[];
  };
  iceBreaking: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    pelajaranPertama: string;
    petugas: string[];
    isPast: boolean;
  }>;
  mbg: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    petugas: string[];
    isPast: boolean;
  }>;
  doa: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    roles: string[];
    isPast: boolean;
  }>;
  birthday?: string;
}

export function isStudentNameMatch(text: string, student: Student): boolean {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  const nama = student.nama.toLowerCase();
  const panggilan = student.panggilan.toLowerCase();

  if (t === nama || t === panggilan) return true;
  if (t.includes(panggilan)) return true;
  if (nama.includes(t)) return true;

  // Word token match
  const studentWords = nama.split(/\s+/);
  const textWords = t.split(/[\s,;&/]+/);
  return textWords.some(tw => studentWords.includes(tw) || tw === panggilan);
}

export function buildStudentSummary(
  student: Student,
  dataStore: ClassDataStore,
  activeTodayISO: string
): StudentSummaryData {
  // Find Kas Murid entry
  const kasStudent = dataStore.kasData?.students.find(
    s => s.absen === student.absen || isStudentNameMatch(s.nama, student)
  );

  // Piket Day & Partners
  const piketDay = PIKET_SCHEDULE_MAP[student.absen] || 'Belum Dijadwalkan';
  const piketPartners = STUDENTS_DATA.filter(
    s => s.absen !== student.absen && PIKET_SCHEDULE_MAP[s.absen] === piketDay
  );

  // Ice Breaking assignments
  const iceBreakingMatches: StudentSummaryData['iceBreaking'] = [];
  if (dataStore.iceBreakingByDate) {
    Object.keys(dataStore.iceBreakingByDate)
      .sort()
      .forEach(iso => {
        const entry = dataStore.iceBreakingByDate[iso];
        if (!entry || !entry.petugas) return;
        const isMatch = entry.petugas.some(p => isStudentNameMatch(p, student));
        if (isMatch) {
          const dateInfo = parseISODateParts(iso);
          iceBreakingMatches.push({
            isoDate: iso,
            formattedDate: dateInfo.formattedDate,
            hari: entry.hari,
            pelajaranPertama: entry.pelajaranPertama,
            petugas: entry.petugas,
            isPast: iso < activeTodayISO
          });
        }
      });
  }

  // MBG assignments
  const mbgMatches: StudentSummaryData['mbg'] = [];
  if (dataStore.mbgByDate) {
    Object.keys(dataStore.mbgByDate)
      .sort()
      .forEach(iso => {
        const entry = dataStore.mbgByDate[iso];
        if (!entry || !entry.petugas) return;
        const isMatch = entry.petugas.some(p => isStudentNameMatch(p, student));
        if (isMatch) {
          const dateInfo = parseISODateParts(iso);
          mbgMatches.push({
            isoDate: iso,
            formattedDate: dateInfo.formattedDate,
            hari: entry.hari,
            petugas: entry.petugas,
            isPast: iso < activeTodayISO
          });
        }
      });
  }

  // Doa & Renungan assignments
  const doaMatches: StudentSummaryData['doa'] = [];
  if (dataStore.doaByDate) {
    Object.keys(dataStore.doaByDate)
      .sort()
      .forEach(iso => {
        const entry = dataStore.doaByDate[iso];
        if (!entry) return;
        const roles: string[] = [];
        if (entry.doaPagi && isStudentNameMatch(entry.doaPagi, student)) roles.push('Doa Pagi');
        if (entry.renungan && isStudentNameMatch(entry.renungan, student)) roles.push('Renungan');
        if (entry.malaikatTuhan && isStudentNameMatch(entry.malaikatTuhan, student)) {
          roles.push('Malaikat Tuhan');
        }
        if (entry.doaPenutup && isStudentNameMatch(entry.doaPenutup, student)) {
          roles.push('Doa Penutup');
        }
        if (entry.bacaanInjil && isStudentNameMatch(entry.bacaanInjil, student)) {
          roles.push('Bacaan Injil');
        }

        if (roles.length > 0) {
          const dateInfo = parseISODateParts(iso);
          doaMatches.push({
            isoDate: iso,
            formattedDate: dateInfo.formattedDate,
            hari: entry.hari,
            roles,
            isPast: iso < activeTodayISO
          });
        }
      });
  }

  // Birthday lookup
  let birthdayStr: string | undefined;
  if (dataStore.birthdayByMonthDay) {
    for (const mdKey of Object.keys(dataStore.birthdayByMonthDay)) {
      const names = dataStore.birthdayByMonthDay[mdKey] || [];
      if (names.some(n => isStudentNameMatch(n, student))) {
        const [mStr, dStr] = mdKey.split('-');
        const m = parseInt(mStr, 10);
        const d = parseInt(dStr, 10);
        birthdayStr = `${d} ${MONTH_ID[m - 1]}`;
        break;
      }
    }
  }

  return {
    student,
    kas: kasStudent
      ? {
          totalBayar: kasStudent.totalBayar,
          targetWajib: kasStudent.targetWajib,
          tunggakan: kasStudent.tunggakan,
          lebihBayar: kasStudent.lebihBayar,
          status: kasStudent.status,
          payments: kasStudent.payments
        }
      : undefined,
    piket: {
      day: piketDay,
      partners: piketPartners
    },
    iceBreaking: iceBreakingMatches,
    mbg: mbgMatches,
    doa: doaMatches,
    birthday: birthdayStr
  };
}

export function formatStudentSummaryText(summary: StudentSummaryData): string {
  const s = summary.student;
  const lines = [
    `👤 *Ringkasan Siswa: ${s.nama} (${s.panggilan})*`,
    `No. Absen: ${s.absen} • Jenis Kelamin: ${s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`,
    `Kelas XB SMA Putra Nirmala`,
    '',
    `🧹 *Jadwal Piket Kebersihan:* Hari ${summary.piket.day}`,
    `Rekan Piket: ${summary.piket.partners.map(p => `${p.panggilan} (#${p.absen})`).join(', ') || '-'}`,
    ''
  ];

  if (summary.kas) {
    lines.push(`💰 *Buku Kas Murid:*`);
    lines.push(
      `• Status: ${
        summary.kas.status === 'lunas'
          ? 'Lunas ✅'
          : summary.kas.status === 'lebih'
          ? 'Lebih Bayar'
          : 'Menunggak ⚠️'
      }`
    );
    lines.push(`• Total Bayar: Rp ${summary.kas.totalBayar.toLocaleString('id-ID')}`);
    lines.push(`• Target Wajib: Rp ${summary.kas.targetWajib.toLocaleString('id-ID')}`);
    if (summary.kas.tunggakan > 0) {
      lines.push(`• Tunggakan: Rp ${summary.kas.tunggakan.toLocaleString('id-ID')}`);
    }
    lines.push('');
  }

  if (summary.iceBreaking.length > 0) {
    lines.push(`🎲 *Jadwal Petugas Ice Breaking:*`);
    summary.iceBreaking.forEach(ib => {
      lines.push(`• ${ib.formattedDate} (${ib.hari}) - Bersama: ${ib.petugas.join(', ')}`);
    });
    lines.push('');
  }

  if (summary.mbg.length > 0) {
    lines.push(`🍱 *Jadwal Petugas MBG:*`);
    summary.mbg.forEach(m => {
      lines.push(`• ${m.formattedDate} (${m.hari}) - Bersama: ${m.petugas.join(', ')}`);
    });
    lines.push('');
  }

  if (summary.doa.length > 0) {
    lines.push(`🙏 *Jadwal Petugas Doa & Renungan:*`);
    summary.doa.forEach(d => {
      lines.push(`• ${d.formattedDate} (${d.hari}) - Tugas: ${d.roles.join(', ')}`);
    });
    lines.push('');
  }

  if (summary.birthday) {
    lines.push(`🎂 *Hari Ulang Tahun:* ${summary.birthday}`);
  }

  return lines.join('\n');
}

interface StudentProfileViewProps {
  summary: StudentSummaryData;
  dataStore: ClassDataStore;
  onBack: () => void;
  onClose: () => void;
  onSelectDate?: (isoDate: string) => void;
  onSelectStudent?: (student: Student) => void;
  backLabel?: string;
  backTitle?: string;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  summary,
  dataStore,
  onBack,
  onClose,
  onSelectDate,
  onSelectStudent,
  backLabel = 'Kembali ke Pencarian',
  backTitle = 'Kembali ke hasil pencarian'
}) => {
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    setCopiedNotification(null);
  }, [summary.student.absen]);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(formatStudentSummaryText(summary));
    if (ok) {
      setCopiedNotification(`Data ${summary.student.panggilan} tersalin!`);
      setTimeout(() => setCopiedNotification(null), 2000);
    }
  };

  const handleJumpDate = (isoDate: string) => {
    if (onSelectDate) {
      onSelectDate(isoDate);
      onClose();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
      {/* Student Header */}
      <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-[#151619] flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-[#202227] text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title={backTitle}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-[#241738] text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
            {summary.student.absen}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-editorial font-bold text-stone-900 dark:text-stone-100 leading-tight truncate">
                {summary.student.nama}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Panggilan: {summary.student.panggilan}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Absen #{summary.student.absen} •{' '}
              {summary.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Kelas XB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Salin Ringkasan Siswa"
            className="px-2.5 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-xs font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1.5"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 text-xs">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Salin Data</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-600 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Dossier Content */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
        {/* Grid 1: Status Kas & Piket */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Buku Kas Card */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                    Buku Kas Murid
                  </h4>
                </div>
                {summary.kas ? (
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                      summary.kas.status === 'lunas'
                        ? 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : summary.kas.status === 'lebih'
                        ? 'bg-blue-100/90 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        : 'bg-rose-100/90 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {summary.kas.status === 'lunas'
                      ? 'Lunas'
                      : summary.kas.status === 'lebih'
                      ? 'Lebih Bayar'
                      : 'Nunggak'}
                  </span>
                ) : null}
              </div>

              {summary.kas ? (
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">Total Dibayar:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                      Rp {summary.kas.totalBayar.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">Target Wajib:</span>
                    <span className="font-mono text-stone-700 dark:text-stone-300">
                      Rp {summary.kas.targetWajib.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {summary.kas.tunggakan > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 dark:border-stone-800 font-semibold text-rose-600 dark:text-rose-400">
                      <span>Sisa Tunggakan:</span>
                      <span className="font-mono">
                        Rp {summary.kas.tunggakan.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {summary.kas.lebihBayar > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 dark:border-stone-800 font-semibold text-blue-600 dark:text-blue-400">
                      <span>Kelebihan Bayar:</span>
                      <span className="font-mono">
                        Rp {summary.kas.lebihBayar.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {/* Piktogram Riwayat Minggu Siswa */}
                  {dataStore.kasData?.weeks &&
                    dataStore.kasData.weeks.length > 0 &&
                    summary.kas.payments && (
                      <div className="pt-2 mt-1 border-t border-stone-200/60 dark:border-stone-800">
                        <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                          <span>Piktogram Riwayat:</span>
                          <span className="font-mono font-medium">
                            {
                              dataStore.kasData.weeks.filter(
                                w => (summary.kas!.payments![w.colIndex] || 0) >= 3000
                              ).length
                            }
                            /{dataStore.kasData.weeks.filter(w => w.isElapsed).length} lunas
                          </span>
                        </div>
                        <div className="flex items-center gap-[2px] overflow-x-auto no-scrollbar py-0.5">
                          {dataStore.kasData.weeks.map((w, i) => {
                            const amt = summary.kas!.payments![w.colIndex] || 0;
                            const isPaid = amt >= 3000;
                            const isPartial = amt > 0 && amt < 3000;
                            const isUnpaidPast = amt === 0 && w.isElapsed;

                            const prevW = dataStore.kasData!.weeks[i - 1];
                            const isNewMonth = prevW && prevW.monthName !== w.monthName;

                            const barClass = isPaid
                              ? 'bg-emerald-600 dark:bg-emerald-500'
                              : isPartial
                              ? 'bg-amber-500 dark:bg-amber-400'
                              : isUnpaidPast
                              ? 'bg-rose-500 dark:bg-rose-500'
                              : 'bg-stone-200 dark:bg-stone-700';

                            return (
                              <span
                                key={w.colIndex}
                                title={`Minggu ${i + 1} (${w.label}): ${
                                  isPaid
                                    ? `Lunas (Rp ${amt.toLocaleString('id-ID')})`
                                    : isPartial
                                    ? `Kurang (Rp ${amt.toLocaleString('id-ID')})`
                                    : isUnpaidPast
                                    ? 'Menunggak (Rp 0)'
                                    : 'Belum Jatuh Tempo'
                                }`}
                                className={`w-1.5 h-3.5 rounded-2xs flex-shrink-0 transition-transform hover:scale-125 cursor-pointer ${
                                  isNewMonth ? 'ml-0.5' : ''
                                } ${barClass}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic mt-2">
                  Belum ada catatan kas untuk siswa ini.
                </p>
              )}
            </div>
          </div>

          {/* Piket Kebersihan Card */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                    Piket Kebersihan
                  </h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Hari {summary.piket.day}
                </span>
              </div>

              <div className="mt-2 text-xs">
                <p className="text-stone-500 font-medium mb-1">Teman Satu Regu Piket:</p>
                {summary.piket.partners.length === 0 ? (
                  <p className="text-stone-400 italic">Tidak ada rekan regu terdata</p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {summary.piket.partners.map(p =>
                      onSelectStudent ? (
                        <button
                          key={p.absen}
                          type="button"
                          onClick={() => onSelectStudent(p)}
                          title={`Lihat profil ${p.nama}`}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-[#202227] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-purple-400/70 hover:text-purple-800 dark:hover:text-purple-300 transition cursor-pointer"
                        >
                          {p.panggilan} (#{p.absen})
                        </button>
                      ) : (
                        <span
                          key={p.absen}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-[#202227] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                        >
                          {p.panggilan} (#{p.absen})
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid 2: Ice Breaking & MBG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Petugas Ice Breaking */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Tugas Ice Breaking ({summary.iceBreaking.length})
              </h4>
            </div>

            {summary.iceBreaking.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                Belum ada penugasan ice breaking untuk siswa ini.
              </p>
            ) : (
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                {summary.iceBreaking.map((ib, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleJumpDate(ib.isoDate)}
                    className={`p-2 rounded-lg border text-xs transition ${
                      onSelectDate ? 'cursor-pointer' : ''
                    } ${
                      ib.isPast
                        ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                        : 'bg-indigo-50/60 dark:bg-[#151728] border-indigo-200/70 dark:border-indigo-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                      <span>
                        {ib.hari}, {ib.formattedDate}
                      </span>
                      {!ib.isPast && (
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                          Akan Datang
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Petugas: {ib.petugas.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Petugas MBG */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Tugas MBG ({summary.mbg.length})
              </h4>
            </div>

            {summary.mbg.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                Belum ada penugasan MBG (Makan Bergizi Gratis).
              </p>
            ) : (
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                {summary.mbg.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleJumpDate(m.isoDate)}
                    className={`p-2 rounded-lg border text-xs transition ${
                      onSelectDate ? 'cursor-pointer' : ''
                    } ${
                      m.isPast
                        ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                        : 'bg-emerald-50/60 dark:bg-[#0E2018] border-emerald-200/70 dark:border-emerald-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                      <span>
                        {m.hari}, {m.formattedDate}
                      </span>
                      {!m.isPast && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                          Akan Datang
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Petugas: {m.petugas.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid 3: Doa & Renungan & Ulang Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Petugas Doa & Renungan */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Doa &amp; Renungan ({summary.doa.length})
              </h4>
            </div>

            {summary.doa.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                Belum ada jadwal doa atau renungan tercatat.
              </p>
            ) : (
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                {summary.doa.map((d, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleJumpDate(d.isoDate)}
                    className={`p-2 rounded-lg border text-xs transition ${
                      onSelectDate ? 'cursor-pointer' : ''
                    } ${
                      d.isPast
                        ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                        : 'bg-purple-50/60 dark:bg-[#1E1428] border-purple-200/70 dark:border-purple-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                      <span>
                        {d.hari}, {d.formattedDate}
                      </span>
                      {!d.isPast && (
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">
                          Akan Datang
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.roles.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ulang Tahun & Profil Info */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Ulang Tahun &amp; Profil
                </h4>
              </div>

              <div className="space-y-2 mt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Tanggal Ulang Tahun:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {summary.birthday ? `🎂 ${summary.birthday}` : 'Belum tercatat'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Nomor Absen:</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    #{summary.student.absen}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Jenis Kelamin:</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {summary.student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Dossier Footer */}
      <div className="p-3 sm:p-4 bg-stone-50 dark:bg-[#141518] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-700 dark:text-stone-300 font-medium transition cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
