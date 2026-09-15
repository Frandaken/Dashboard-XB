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
    <div id="schedule-blocks-grid" className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-fit lg:min-h-0">
      {/* ROW 1: MBG & PIKET KEBERSIHAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* 1. MAKAN BERGIZI GRATIS (MBG) */}
        <div
          id="card-mbg"
          className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 flex flex-col justify-start shadow-2xs"
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-[#E4DDCE]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0602F] flex-shrink-0" />
            <h3 className="text-[#2B2A28] font-bold text-xs uppercase tracking-wider">
              Makan Bergizi Gratis
            </h3>
          </div>

          {mbg && mbg.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {mbg.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#FBE6DA] text-[#8C3411] font-semibold text-xs sm:text-sm border border-[#F4CCA8]/60"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 italic text-xs py-1">
              Tidak ada petugas MBG hari ini.
            </p>
          )}
        </div>

        {/* 2. PIKET KEBERSIHAN */}
        <div
          id="card-piket"
          className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 flex flex-col justify-start shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E4DDCE]/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C99A3C] flex-shrink-0" />
              <h3 className="text-[#2B2A28] font-bold text-xs uppercase tracking-wider">
                Piket Kebersihan
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F6ECD4] text-[#6B4F10] border border-[#EDD9A4]/60">
              Hari {dowName}
            </span>
          </div>

          {piket && piket.petugas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {piket.petugas.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#F6ECD4] text-[#6B4F10] font-semibold text-xs sm:text-sm border border-[#EDD9A4]/60"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 italic text-xs py-1">
              Tidak ada jadwal piket kebersihan hari {dowName}.
            </p>
          )}
        </div>
      </div>

      {/* ROW 2: PETUGAS DOA & BACAAN INJIL */}
      <div
        id="card-doa"
        className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 shadow-2xs"
      >
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-[#E4DDCE]/60">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3F6E52] flex-shrink-0" />
          <h3 className="text-[#2B2A28] font-bold text-xs uppercase tracking-wider">
            Petugas Doa & Bacaan Injil
          </h3>
        </div>

        {/* BACAAN INJIL: TEKS BESAR & FONT LEGIBLE */}
        <div className="mb-2.5 px-3 py-2 bg-[#EBF3EE] border border-[#C6DEC0] rounded-lg flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#3F6E52] flex-shrink-0">
            Bacaan Injil:
          </span>
          <span className="font-display font-bold text-lg sm:text-xl md:text-2xl text-[#1B4332] tracking-tight">
            {bacaanText || '—'}
          </span>
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
              className="bg-[#FAF6EE]/90 border border-[#E4DDCE]/80 rounded-lg p-2 flex flex-col justify-between"
            >
              <span className="text-[10px] sm:text-[11px] font-medium text-stone-500">
                {role.label}
              </span>
              <span className="font-semibold text-xs sm:text-sm text-stone-900 truncate mt-0.5">
                {role.name || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: JADWAL PELAJARAN (BOX-BOX RINGKAS) */}
      <div
        id="card-pelajaran"
        className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 shadow-2xs flex-1 min-h-fit lg:min-h-0 flex flex-col"
      >
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E4DDCE]/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B5CA5] flex-shrink-0" />
            <h3 className="text-[#2B2A28] font-bold text-xs uppercase tracking-wider">
              Jadwal Pelajaran
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#544686] bg-[#EDEAF6] px-2 py-0.5 rounded border border-[#D5CFE9]">
            {pelajaran.length} Jam Pelajaran
          </span>
        </div>

        {pelajaran.length > 0 ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 overflow-y-visible lg:overflow-y-auto flex-1 pr-0.5">
            {pelajaran.map((p, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border flex flex-col justify-between transition ${
                  p.hasTask
                    ? 'bg-[#FBF5E5] border-[#E8D4A2]'
                    : 'bg-[#FAF6EE]/80 border-[#E4DDCE]/80 hover:bg-[#FAF6EE]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-white text-stone-700 font-mono font-bold text-[10px] sm:text-[11px] border border-[#E4DDCE]">
                    {p.time}
                  </span>
                  {p.hasTask && (
                    <span className="px-1.5 py-0.2 rounded bg-[#F6ECD4] text-[#6B4F10] font-bold text-[9px] border border-[#EDD9A4]">
                      Tugas
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs sm:text-sm text-stone-900 line-clamp-1" title={p.cleanName}>
                  {p.cleanName}
                </div>

                {p.hasTask && p.taskText ? (
                  <div className="text-[10px] sm:text-[11px] font-medium text-[#6B4F10] break-words leading-tight mt-1 bg-[#F6ECD4]/60 p-1 rounded border border-[#EDD9A4]/60">
                    Tugas: {p.taskText}
                  </div>
                ) : (
                  <div className="h-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic text-xs py-2">
            Tidak ada jadwal mata pelajaran untuk hari ini.
          </p>
        )}
      </div>
    </div>
  );
};
