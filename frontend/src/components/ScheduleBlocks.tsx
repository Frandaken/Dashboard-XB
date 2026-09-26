import React from 'react';
import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem } from '../types';

interface ScheduleBlocksProps {
  mbg?: MbgSchedule;
  piket?: PiketSchedule;
  doa?: DoaSchedule;
  pelajaran?: PeriodItem[];
  dowName: string;
}

export const ScheduleBlocks: React.FC<ScheduleBlocksProps> = ({
  mbg,
  piket,
  doa,
  pelajaran = [],
  dowName
}) => {
  const bacaanText = doa
    ? [doa.bacaanInjil, doa.bab && doa.ayat ? `${doa.bab}:${doa.ayat}` : ''].filter(Boolean).join(' ')
    : '';

  return (
    <div id="schedule-blocks-grid" className="flex flex-col gap-2 flex-1 min-h-0">
      {/* ROW 1: MBG & PIKET KEBERSIHAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-shrink-0">
        {/* 1. MAKAN BERGIZI GRATIS (MBG) */}
        <div
          id="card-mbg"
          className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 flex flex-col justify-start shadow-2xs transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#E4DDCE]/70 dark:border-[#2D333B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0602F] dark:bg-[#FB923C] flex-shrink-0" />
            <h3 className="text-stone-600 dark:text-stone-400 font-medium text-xs uppercase tracking-wider">
              Makan Bergizi Gratis
            </h3>
          </div>

          {mbg?.petugas && mbg.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {mbg.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-[#FBE6DA] dark:bg-[#3D2218] text-[#8C3411] dark:text-[#FDBA74] font-medium text-xs border border-[#F4CCA8]/70 dark:border-[#6B3722]"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-xs py-0.5 font-normal">
              Tidak ada petugas MBG hari ini.
            </p>
          )}
        </div>

        {/* 2. PIKET KEBERSIHAN */}
        <div
          id="card-piket"
          className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 flex flex-col justify-start shadow-2xs transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#E4DDCE]/70 dark:border-[#2D333B]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C99A3C] dark:bg-[#FBBF24] flex-shrink-0" />
              <h3 className="text-stone-600 dark:text-stone-400 font-medium text-xs uppercase tracking-wider">
                Piket Kebersihan
              </h3>
            </div>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-[#F6ECD4] dark:bg-[#332A17] text-[#6B4F10] dark:text-[#FDE68A] border border-[#EDD9A4]/70 dark:border-[#524120]">
              Hari {dowName}
            </span>
          </div>

          {piket?.petugas && piket.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {piket.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-[#F6ECD4] dark:bg-[#332A17] text-[#6B4F10] dark:text-[#FDE68A] font-medium text-xs border border-[#EDD9A4]/70 dark:border-[#524120]"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-xs py-0.5 font-normal">
              Tidak ada jadwal piket kebersihan hari {dowName}.
            </p>
          )}
        </div>
      </div>

      {/* ROW 2: PETUGAS DOA & BACAAN INJIL */}
      <div
        id="card-doa"
        className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 shadow-2xs transition-colors flex-shrink-0"
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-[#E4DDCE]/70 dark:border-[#2D333B]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3F6E52] dark:bg-[#34D399] flex-shrink-0" />
            <h3 className="text-stone-600 dark:text-stone-400 font-medium text-xs uppercase tracking-wider">
              Doa & Bacaan Injil
            </h3>
          </div>
          {bacaanText && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-normal text-stone-500 dark:text-stone-400">Bacaan Injil:</span>
              <span className="font-semibold text-xs sm:text-sm text-[#143425] dark:text-[#A7F3D0] bg-[#EBF3EE] dark:bg-[#163825] px-2 py-0.5 rounded border border-[#C6DEC0] dark:border-[#265E3E]">
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
              className="bg-[#FAF6EE]/80 dark:bg-[#252B33] border border-[#E4DDCE]/70 dark:border-[#353E4C] rounded-lg p-2 flex flex-col justify-between"
            >
              <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                {role.label}
              </span>
              <span className="font-medium text-xs sm:text-sm text-stone-800 dark:text-stone-100 truncate mt-0.5">
                {role.name || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: JADWAL PELAJARAN (FLEX-1 WITH INTERNAL SMOOTH SCROLL) */}
      <div
        id="card-pelajaran"
        className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 shadow-2xs flex-1 min-h-0 flex flex-col transition-colors overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E4DDCE]/70 dark:border-[#2D333B] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B5CA5] dark:bg-[#A78BFA] flex-shrink-0" />
            <h3 className="text-stone-600 dark:text-stone-400 font-medium text-xs uppercase tracking-wider">
              Jadwal Pelajaran
            </h3>
          </div>
          <span className="text-[11px] font-normal text-[#544686] dark:text-[#C4B5FD] bg-[#EDEAF6] dark:bg-[#2D2545] px-2 py-0.5 rounded-md border border-[#D5CFE9] dark:border-[#4B3D72]">
            {pelajaran?.length || 0} Sesi Pelajaran
          </span>
        </div>

        {pelajaran && pelajaran.length > 0 ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 overflow-y-auto flex-1 pr-0.5">
            {pelajaran.map((p, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col justify-between transition ${
                  p.hasTask
                    ? 'bg-[#FBF5E5] dark:bg-[#342A17] border-[#E8D4A2] dark:border-[#6B5324]'
                    : 'bg-[#FAF6EE]/80 dark:bg-[#252B33] border-[#E4DDCE]/80 dark:border-[#353E4C] hover:bg-[#FAF6EE] dark:hover:bg-[#2C3440]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1A1D23] text-stone-700 dark:text-stone-300 font-mono font-medium text-[11px] border border-[#E4DDCE] dark:border-[#3A4554]">
                    {p.time}
                  </span>
                  {p.hasTask && (
                    <span className="px-1.5 py-0.5 rounded bg-[#F6ECD4] dark:bg-[#4E3D19] text-[#6B4F10] dark:text-[#FDE68A] font-semibold text-[10px] uppercase border border-[#EDD9A4] dark:border-[#735A22]">
                      Tugas
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-1" title={p.cleanName}>
                  {p.cleanName}
                </div>

                {p.hasTask && p.taskText ? (
                  <div className="text-[11px] font-normal text-[#6B4F10] dark:text-[#FDE68A] break-words leading-tight mt-1 bg-[#F6ECD4]/60 dark:bg-[#2A210F] p-1.5 rounded border border-[#EDD9A4]/60 dark:border-[#5C4517]">
                    Tugas: {p.taskText}
                  </div>
                ) : (
                  <div className="h-1" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 dark:text-stone-500 italic text-xs py-2 font-normal">
            Tidak ada jadwal mata pelajaran untuk hari ini.
          </p>
        )}
      </div>
    </div>
  );
};
