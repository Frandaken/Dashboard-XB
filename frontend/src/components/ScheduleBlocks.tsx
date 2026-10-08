import React, { useState } from 'react';
import { ChevronDown, PartyPopper } from 'lucide-react';
import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, IceBreakingSchedule } from '../types';

interface ScheduleBlocksProps {
  mbg?: MbgSchedule;
  piket?: PiketSchedule;
  doa?: DoaSchedule;
  pelajaran?: PeriodItem[];
  dowName: string;
  iceBreaking?: IceBreakingSchedule;
}

export const ScheduleBlocks: React.FC<ScheduleBlocksProps> = ({
  mbg,
  piket,
  doa,
  pelajaran = [],
  dowName,
  iceBreaking
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTaskExpand = (key: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const bacaanText = doa
    ? [doa.bacaanInjil, doa.bab && doa.ayat ? `${doa.bab}:${doa.ayat}` : ''].filter(Boolean).join(' ')
    : '';

  const isFriday = dowName.toLowerCase() === 'jumat' || dowName.toLowerCase() === 'jum\'at';

  // Helper function to determine if a period is Friday's Literasi / Senam activity
  const isLiterasiOrSenam = (p: PeriodItem) => {
    const textToCheck = `${p.cleanName} ${p.rawSummary || ''} ${p.summary || ''}`.toLowerCase();
    return textToCheck.includes('literasi') || textToCheck.includes('senam');
  };

  // Calculate actual Jam Pelajaran (On Friday, Literasi & Senam are excluded from academic Jam Pelajaran count)
  const totalJamPelajaran = isFriday
    ? pelajaran.filter(p => !isLiterasiOrSenam(p)).length
    : pelajaran.length;

  // Track sequence for academic Jam Pelajaran on Friday
  let academicCounter = 0;

  return (
    <div id="schedule-blocks-grid" className="flex flex-col gap-2.5 flex-1 min-h-0">
      {/* ROW 1: MBG & PIKET KEBERSIHAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-shrink-0">
        {/* 1. MAKAN BERGIZI GRATIS (MBG) */}
        <div
          id="card-mbg"
          className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 flex flex-col justify-start shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0602F] dark:bg-[#FB923C] flex-shrink-0 ring-2 ring-[#E0602F]/20" />
            <h3 className="text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              Makan Bergizi Gratis (MBG)
            </h3>
          </div>

          {mbg?.petugas && mbg.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {mbg.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#FFEDD5] dark:bg-[#241208] text-[#9A3412] dark:text-[#FDBA74] font-semibold text-xs border border-[#FDBA74] dark:border-[#4A200E]"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 italic text-xs py-1 font-normal">
              Tidak ada petugas MBG hari ini.
            </p>
          )}
        </div>

        {/* 2. PIKET KEBERSIHAN */}
        <div
          id="card-piket"
          className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 flex flex-col justify-start shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] dark:bg-[#FBBF24] flex-shrink-0 ring-2 ring-[#D97706]/20" />
              <h3 className="text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
                Piket Kebersihan
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FEF9C3] dark:bg-[#211B05] text-[#854D0E] dark:text-[#FDE68A] border border-[#FACC15] dark:border-[#47360A]">
              Hari {dowName}
            </span>
          </div>

          {piket?.petugas && piket.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {piket.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#FEF9C3] dark:bg-[#211B05] text-[#854D0E] dark:text-[#FDE68A] font-semibold text-xs border border-[#FACC15] dark:border-[#47360A]"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 italic text-xs py-1 font-normal">
              Tidak ada jadwal piket kebersihan hari {dowName}.
            </p>
          )}
        </div>
      </div>

      {/* OPTIONAL: PETUGAS ICE BREAKING (If scheduled for this day) */}
      {iceBreaking && (
        <div
          id="card-ice-breaking"
          className="bg-emerald-50/60 dark:bg-[#072416]/50 border border-emerald-300 dark:border-[#105432] rounded-xl p-3 sm:p-3.5 flex flex-col justify-start shadow-xs transition-colors flex-shrink-0"
        >
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-200 dark:border-[#13442A]">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
              <h3 className="text-emerald-950 dark:text-emerald-200 font-bold text-xs uppercase tracking-wider">
                Petugas Ice Breaking
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white dark:bg-[#0A0A0A] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-[#105432]">
              Jam Pertama: {iceBreaking.pelajaranPertama}
            </span>
          </div>

          {iceBreaking.petugas && iceBreaking.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {iceBreaking.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-[#0A0A0A] text-emerald-950 dark:text-emerald-200 font-bold text-xs border border-emerald-300 dark:border-[#105432] shadow-2xs"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 italic text-xs py-1 font-normal">
              Belum ada nama petugas yang dicatat untuk hari ini.
            </p>
          )}
        </div>
      )}

      {/* ROW 2: PETUGAS DOA & BACAAN INJIL */}
      <div
        id="card-doa"
        className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs transition-colors flex-shrink-0"
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] dark:bg-[#34D399] flex-shrink-0 ring-2 ring-[#16A34A]/20" />
            <h3 className="text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              Doa & Bacaan Injil
            </h3>
          </div>
          {bacaanText && (
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Bacaan Injil:
              </span>
              <span className="font-black text-base sm:text-lg lg:text-xl text-[#14532D] dark:text-[#34D399] bg-[#DCFCE7] dark:bg-[#082216] px-4 py-1.5 rounded-xl border border-[#86EFAC] dark:border-[#0E492B] shadow-xs tracking-normal">
                {bacaanText}
              </span>
            </div>
          )}
        </div>

        {/* MINI-BOXES: DOA PAGI, RENUNGAN, MALAIKAT TUHAN, DOA PENUTUP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Doa Pagi', name: doa?.doaPagi },
            { label: 'Renungan', name: doa?.renungan },
            { label: 'Malaikat Tuhan', name: doa?.malaikatTuhan },
            { label: 'Doa Penutup', name: doa?.doaPenutup }
          ].map((role, idx) => (
            <div
              key={idx}
              className="bg-[#FAF7F2] dark:bg-[#121212] border border-[#D8D2C5] dark:border-[#222222] rounded-lg p-2.5 flex flex-col justify-between"
            >
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wide">
                {role.label}
              </span>
              <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-50 truncate mt-1">
                {role.name || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: JADWAL PELAJARAN (KEEP EACH SUBJECT / SCHEDULE SEPARATE FOR MAXIMUM CLARITY) */}
      <div
        id="card-pelajaran"
        className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex-1 min-h-0 flex flex-col transition-colors overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] dark:bg-[#A78BFA] flex-shrink-0 ring-2 ring-[#7C3AED]/20" />
            <h3 className="text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              Jadwal Pelajaran
            </h3>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#581C87] dark:text-[#E9D5FF] bg-[#F3E8FF] dark:bg-[#1C0D2E] px-3 py-1 rounded-md border border-[#D8B4FE] dark:border-[#3D1A63]">
            {totalJamPelajaran} Jam Pelajaran
          </span>
        </div>

        {pelajaran && pelajaran.length > 0 ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 overflow-y-auto flex-1 pr-1">
            {pelajaran.map((p, idx) => {
              const isNonAcademicFriday = isFriday && isLiterasiOrSenam(p);
              let sessionNumber: number | string = idx + 1;
              if (isFriday) {
                if (isNonAcademicFriday) {
                  sessionNumber = 0;
                } else {
                  academicCounter += 1;
                  sessionNumber = academicCounter;
                }
              }

              return (
                <div
                  key={`${p.cleanName}-${p.time}-${idx}`}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-shadow shadow-2xs ${
                    p.hasTask
                      ? 'bg-[#FEF9EE] dark:bg-[#1C1508] border-[#FCD34D] dark:border-[#4D380E]'
                      : isNonAcademicFriday
                      ? 'bg-[#F0FDF4] dark:bg-[#061C12] border-[#BBF7D0] dark:border-[#0E492B]'
                      : 'bg-[#FAF7F2] dark:bg-[#121212] border-[#D8D2C5] dark:border-[#222222] hover:border-[#2C4E3A]/50 dark:hover:border-[#34D399]/50'
                  }`}
                >
                  {/* Header: Sesi index badge & Time Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                          isNonAcademicFriday
                            ? 'bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] ring-1 ring-[#34D399]/40'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                        }`}
                        title={isNonAcademicFriday ? 'Kegiatan Pembiasaan (Jam ke-0)' : `Jam Pelajaran ke-${sessionNumber}`}
                      >
                        {sessionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#161616] text-stone-800 dark:text-stone-200 font-mono font-semibold text-xs border border-[#D8D2C5] dark:border-[#262626] tracking-tight">
                        {p.time}
                      </span>
                    </div>

                    {p.hasTask && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#261B06] text-[#78350F] dark:text-[#FDE68A] font-bold text-[10px] uppercase border border-[#FCD34D] dark:border-[#523A0F]">
                        Tugas
                      </span>
                    )}

                    {isNonAcademicFriday && !p.hasTask && (
                      <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] font-bold text-[10px] uppercase border border-[#86EFAC] dark:border-[#0E492B]">
                        Pembiasaan
                      </span>
                    )}
                  </div>

                  {/* Subject Title */}
                  <div
                    className="font-bold text-sm text-stone-900 dark:text-white leading-snug line-clamp-2"
                    title={p.summary || p.cleanName}
                  >
                    {p.cleanName}
                  </div>

                  {/* Task Notice if present */}
                  {p.hasTask && (p.taskTitle || p.taskText) ? (() => {
                    const taskKey = `${p.cleanName}_${p.time}_${idx}`;
                    const isExpanded = !!expandedTasks[taskKey];
                    const title = p.taskTitle || (p.taskText ? p.taskText.split('\n')[0] : '');
                    const details = p.taskDetails || (p.taskText && p.taskText.includes('\n')
                      ? p.taskText.split('\n').slice(1).join('\n').trim()
                      : '');
                    const hasDetails = p.hasDetails !== undefined ? p.hasDetails : !!details;

                    return (
                      <div className="mt-2 bg-[#FEF3C7]/90 dark:bg-[#1A1205] p-2 sm:p-2.5 rounded-lg border border-[#FCD34D]/80 dark:border-[#422C05] text-xs">
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            onClick={hasDetails ? () => toggleTaskExpand(taskKey) : undefined}
                            className={`font-medium text-[#78350F] dark:text-[#FDE68A] leading-snug break-words flex-1 ${
                              hasDetails ? 'cursor-pointer hover:text-[#B45309] dark:hover:text-[#FBBF24] transition-colors' : ''
                            }`}
                          >
                            <strong className="font-bold text-[#92400E] dark:text-[#FBBF24]">Tugas:</strong> {title}
                          </div>
                          {hasDetails && (
                            <button
                              type="button"
                              onClick={() => toggleTaskExpand(taskKey)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Tutup detail penugasan' : 'Lihat detail penugasan'}
                              className="flex items-center gap-0.5 text-[10px] font-bold text-[#92400E] dark:text-[#FBBF24] hover:text-[#78350F] dark:hover:text-[#FDE68A] px-1.5 py-0.5 rounded bg-white/70 dark:bg-[#261B06] border border-[#FCD34D] dark:border-[#523A0F] transition cursor-pointer flex-shrink-0"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {hasDetails && isExpanded && (
                          <div className="mt-2 pt-1.5 border-t border-[#FCD34D]/60 dark:border-[#382606] text-[11px] text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed bg-white/80 dark:bg-[#140D04] p-2 rounded border border-[#FCD34D]/40 dark:border-[#2E1E05] animate-fade-in">
                            {details}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="h-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 italic text-xs py-3 font-medium">
            Tidak ada jadwal mata pelajaran untuk hari ini.
          </p>
        )}
      </div>
    </div>
  );
};
