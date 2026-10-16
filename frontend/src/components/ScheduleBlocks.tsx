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
  compact?: boolean;
}

export const ScheduleBlocks: React.FC<ScheduleBlocksProps> = ({
  mbg,
  piket,
  doa,
  pelajaran = [],
  dowName,
  iceBreaking,
  compact = false
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
    <div id="schedule-blocks-grid" className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'} flex-1 min-h-0`}>
      {/* ROW 1: MBG & PIKET KEBERSIHAN */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${compact ? 'gap-2.5' : 'gap-3'} flex-shrink-0`}>
        {/* 1. MAKAN BERGIZI GRATIS (MBG) */}
        <div
          id="card-mbg"
          className={`bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl ${
            compact ? 'p-3' : 'p-3.5 sm:p-4'
          } flex flex-col justify-start transition-colors`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60">
            <h3
              className={
                compact
                  ? 'text-stone-900 dark:text-stone-100 font-semibold text-xs sm:text-sm tracking-tight'
                  : 'text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base tracking-tight'
              }
            >
              Makan Bergizi Gratis (MBG)
            </h3>
            <span className="text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400">
              Petugas Harian
            </span>
          </div>

          {mbg?.petugas && mbg.petugas.length > 0 ? (
            <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'} pt-0.5`}>
              {mbg.petugas.map((name, i) => (
                <span
                  key={i}
                  className={
                    compact
                      ? 'px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm border border-stone-200/80 dark:border-stone-700/60'
                      : 'px-3.5 py-1.5 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base md:text-lg border border-stone-200/80 dark:border-stone-700/60 shadow-2xs'
                  }
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-xs sm:text-sm py-1 font-normal">
              Tidak ada petugas MBG hari ini.
            </p>
          )}
        </div>

        {/* 2. PIKET KEBERSIHAN */}
        <div
          id="card-piket"
          className={`bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl ${
            compact ? 'p-3' : 'p-3.5 sm:p-4'
          } flex flex-col justify-start transition-colors`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60">
            <h3
              className={
                compact
                  ? 'text-stone-900 dark:text-stone-100 font-semibold text-xs sm:text-sm tracking-tight'
                  : 'text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base tracking-tight'
              }
            >
              Piket Kebersihan
            </h3>
            <span className="text-[11px] sm:text-xs font-medium text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50">
              Hari {dowName}
            </span>
          </div>

          {piket?.petugas && piket.petugas.length > 0 ? (
            <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'} pt-0.5`}>
              {piket.petugas.map((name, i) => (
                <span
                  key={i}
                  className={
                    compact
                      ? 'px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm border border-stone-200/80 dark:border-stone-700/60'
                      : 'px-3.5 py-1.5 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base md:text-lg border border-stone-200/80 dark:border-stone-700/60 shadow-2xs'
                  }
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-xs sm:text-sm py-1 font-normal">
              Tidak ada jadwal piket kebersihan hari {dowName}.
            </p>
          )}
        </div>
      </div>

      {/* OPTIONAL: PETUGAS ICE BREAKING (If scheduled for this day) */}
      {iceBreaking && (
        <div
          id="card-ice-breaking"
          className={`bg-emerald-50/50 dark:bg-[#12241A] border border-emerald-600/20 dark:border-emerald-500/20 rounded-xl ${
            compact ? 'p-3' : 'p-3.5 sm:p-4'
          } flex flex-col justify-start transition-colors flex-shrink-0`}
        >
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-600/10 dark:border-emerald-500/20">
            <div className="flex items-center gap-2">
              <PartyPopper className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-700 dark:text-emerald-400 flex-shrink-0`} />
              <h3
                className={
                  compact
                    ? 'text-emerald-950 dark:text-emerald-200 font-semibold text-xs sm:text-sm tracking-tight'
                    : 'text-emerald-950 dark:text-emerald-200 font-bold text-sm sm:text-base tracking-tight'
                }
              >
                Petugas Ice Breaking
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#18191C] text-emerald-900 dark:text-emerald-300 border border-emerald-600/25 dark:border-emerald-500/35">
              Jam Pertama: {iceBreaking.pelajaranPertama}
            </span>
          </div>

          {iceBreaking.petugas && iceBreaking.petugas.length > 0 ? (
            <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'} pt-0.5`}>
              {iceBreaking.petugas.map((name, i) => (
                <span
                  key={i}
                  className={
                    compact
                      ? 'px-2.5 py-1 rounded-md bg-white dark:bg-[#18191C] text-emerald-950 dark:text-emerald-100 font-medium text-xs sm:text-sm border border-emerald-600/25 dark:border-emerald-500/35'
                      : 'px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#18191C] text-emerald-950 dark:text-emerald-100 font-bold text-sm sm:text-base md:text-lg border border-emerald-600/25 dark:border-emerald-500/35 shadow-2xs'
                  }
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-xs sm:text-sm py-1 font-normal">
              Belum ada nama petugas yang dicatat untuk hari ini.
            </p>
          )}
        </div>
      )}

      {/* ROW 2: PETUGAS DOA & BACAAN INJIL */}
      <div
        id="card-doa"
        className={`bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl ${
          compact ? 'p-3' : 'p-3.5 sm:p-4'
        } transition-colors flex-shrink-0`}
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60 flex-wrap">
          <h3
            className={
              compact
                ? 'text-stone-900 dark:text-stone-100 font-semibold text-xs sm:text-sm tracking-tight'
                : 'text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base tracking-tight'
            }
          >
            Doa &amp; Petugas Liturgi
          </h3>
          {bacaanText && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400">
                Bacaan Injil:
              </span>
              <span
                className={
                  compact
                    ? 'font-editorial text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-[#13281E] px-2 py-0.5 rounded-md border border-emerald-600/25'
                    : 'font-editorial text-base sm:text-lg md:text-xl font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-[#13281E] px-3.5 py-1 rounded-lg border border-emerald-600/25 dark:border-emerald-500/25 shadow-2xs'
                }
              >
                {bacaanText}
              </span>
            </div>
          )}
        </div>

        {/* MINI-BOXES: DOA PAGI, RENUNGAN, MALAIKAT TUHAN, DOA PENUTUP */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 ${compact ? 'gap-2' : 'gap-2.5'}`}>
          {[
            { label: 'Doa Pagi', name: doa?.doaPagi, isTugas: false },
            { label: 'Renungan', name: doa?.renungan, isTugas: false },
            { label: 'Malaikat Tuhan', name: doa?.malaikatTuhan, isTugas: Boolean(doa?.tugasMalaikatTuhan) },
            { label: 'Doa Penutup', name: doa?.doaPenutup, isTugas: false }
          ].map((role, idx) => {
            const isMalaikatWithTugas = role.label === 'Malaikat Tuhan' && Boolean(doa?.tugasMalaikatTuhan);
            return (
              <div
                key={idx}
                className={`${compact ? 'rounded-lg p-2.5' : 'rounded-xl p-3'} flex flex-col justify-between transition-all ${
                  isMalaikatWithTugas
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-2 border-emerald-500 dark:border-emerald-400 outline outline-2 outline-emerald-500/70 dark:outline-emerald-400/70 outline-offset-1 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-stone-50/80 dark:bg-[#141518] border border-stone-200/70 dark:border-stone-800/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-semibold tracking-tight ${
                      isMalaikatWithTugas
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {role.label}
                  </span>
                  {isMalaikatWithTugas && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600"
                      title="Tugas Malaikat Tuhan Aktif (TRUE)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Tugas
                    </span>
                  )}
                </div>
                <span
                  className={`${
                    compact
                      ? 'font-semibold text-xs sm:text-sm text-stone-800 dark:text-stone-200 truncate mt-1'
                      : 'font-bold text-sm sm:text-base md:text-lg truncate mt-2 text-stone-900 dark:text-stone-100'
                  } ${isMalaikatWithTugas ? 'text-emerald-950 dark:text-emerald-100 font-bold' : ''}`}
                >
                  {role.name || '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 3: JADWAL PELAJARAN */}
      <div
        id="card-pelajaran"
        className={`bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl ${
          compact ? 'p-3' : 'p-3.5 sm:p-4'
        } flex-1 min-h-0 flex flex-col transition-colors overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-stone-100 dark:border-stone-800/60 flex-shrink-0">
          <h3
            className={
              compact
                ? 'text-stone-900 dark:text-stone-100 font-semibold text-xs sm:text-sm tracking-tight'
                : 'text-stone-900 dark:text-stone-100 font-bold text-sm sm:text-base tracking-tight'
            }
          >
            Jadwal Pelajaran
          </h3>
          <span className="text-[11px] sm:text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/70 px-2.5 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-700/50">
            {totalJamPelajaran} Sesi Pelajaran
          </span>
        </div>

        {pelajaran && pelajaran.length > 0 ? (
          <div
            className={
              compact
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto flex-1 pr-1'
                : 'grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1'
            }
          >
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
                  className={`${compact ? 'p-2.5 rounded-lg' : 'p-3.5 rounded-xl'} border flex flex-col justify-between transition-colors ${
                    p.hasTask
                      ? 'bg-amber-50/60 dark:bg-[#1A1409] border-amber-300/80 dark:border-amber-900/70'
                      : isNonAcademicFriday
                      ? 'bg-emerald-50/50 dark:bg-[#0E2018] border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-stone-50/80 dark:bg-[#141518] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-400 dark:hover:border-stone-600'
                  }`}
                >
                  {/* Header: Sesi index badge & Time Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`${
                          compact
                            ? 'w-5 h-5 rounded text-[11px] font-mono font-semibold'
                            : 'w-6 h-6 sm:w-7 sm:h-7 rounded-md text-xs sm:text-sm font-mono font-bold'
                        } flex items-center justify-center flex-shrink-0 ${
                          isNonAcademicFriday
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-stone-200/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                        }`}
                        title={isNonAcademicFriday ? 'Kegiatan Pembiasaan (Jam ke-0)' : `Jam Pelajaran ke-${sessionNumber}`}
                      >
                        {sessionNumber}
                      </span>
                      <span
                        className={
                          compact
                            ? 'font-mono text-xs font-semibold text-stone-700 dark:text-stone-300 tabular-nums'
                            : 'font-mono text-xs sm:text-sm md:text-base font-bold text-stone-700 dark:text-stone-300 tabular-nums'
                        }
                      >
                        {p.time}
                      </span>
                    </div>

                    {p.hasTask && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800/70">
                        Tugas
                      </span>
                    )}

                    {isNonAcademicFriday && !p.hasTask && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                        Pembiasaan
                      </span>
                    )}
                  </div>

                  {/* Subject Title */}
                  <div
                    className={
                      compact
                        ? 'font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 my-0.5'
                        : 'font-bold text-base sm:text-lg md:text-xl text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 my-1'
                    }
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
                      <div className="mt-2 bg-amber-100/70 dark:bg-[#20170A] p-2 rounded-md border border-amber-300/70 dark:border-amber-900/60 text-xs">
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            onClick={hasDetails ? () => toggleTaskExpand(taskKey) : undefined}
                            className={`font-medium text-amber-950 dark:text-amber-200 leading-snug break-words flex-1 ${
                              hasDetails ? 'cursor-pointer hover:text-amber-800 dark:hover:text-amber-100 transition-colors' : ''
                            }`}
                          >
                            <strong className="font-bold text-amber-900 dark:text-amber-300">Tugas:</strong> {title}
                          </div>
                          {hasDetails && (
                            <button
                              type="button"
                              onClick={() => toggleTaskExpand(taskKey)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Tutup detail penugasan' : 'Lihat detail penugasan'}
                              className="flex items-center gap-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded bg-white/90 dark:bg-[#150F07] border border-amber-300/70 dark:border-amber-900/70 transition cursor-pointer flex-shrink-0"
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
                          <div className="mt-1.5 pt-1.5 border-t border-amber-300/60 dark:border-amber-900/60 text-xs text-stone-900 dark:text-stone-200 whitespace-pre-line leading-relaxed bg-white/90 dark:bg-[#120C05] p-2 rounded border border-amber-200 dark:border-amber-900/40 animate-fade-in font-normal">
                            {details}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="h-1" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-400 dark:text-stone-500 italic text-xs sm:text-sm py-2 font-normal">
            Tidak ada jadwal mata pelajaran untuk hari ini.
          </p>
        )}
      </div>
    </div>
  );
};
