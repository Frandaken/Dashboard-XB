import React from 'react';
import { Sparkles, Clock, PartyPopper } from 'lucide-react';
import { IceBreakingSchedule } from '../types';
import { LessonSessionInfo } from '../utils/iceBreakingUtils';

interface IceBreakingPanelProps {
  schedule: IceBreakingSchedule;
  session: LessonSessionInfo;
  currentTime?: string;
  onOpenFullSchedule?: () => void;
}

export const IceBreakingPanel: React.FC<IceBreakingPanelProps> = ({
  schedule,
  session,
  currentTime,
  onOpenFullSchedule
}) => {
  const hasOfficers = schedule.petugas && schedule.petugas.length > 0;

  return (
    <div
      id="panel-ice-breaking"
      className="bg-white dark:bg-[#0A0A0A] border-2 border-emerald-500/70 dark:border-emerald-500/60 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 relative overflow-hidden"
    >
      {/* Background soft decorative ambient glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

      <div>
        {/* Header with live pulsing badge */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-100 dark:border-[#1E3025]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 dark:bg-emerald-400" />
            </span>
            <div className="flex items-center gap-1.5">
              <PartyPopper className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display font-bold text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                Petugas Ice Breaking
              </h3>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 dark:bg-[#072416] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-[#0E492B]">
            <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{session.timeRange}</span>
          </span>
        </div>

        {/* Lesson context badge */}
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 mb-2.5">
          <span className="font-semibold text-stone-700 dark:text-stone-200">
            Jam Pelajaran Pertama: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{schedule.pelajaranPertama}</span>
          </span>
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {session.sessionLabel}
          </span>
        </div>

        {/* Petugas List */}
        {hasOfficers ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2">
              {schedule.petugas.map((name, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#082317] dark:to-[#071F19] text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-[#105432] shadow-2xs text-xs sm:text-sm font-bold"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 text-[10px] font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span>Memandu kegiatan ice breaking di awal jam pelajaran!</span>
            </p>
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 italic text-xs py-1">
            Belum ada nama petugas yang dicatat untuk hari ini.
          </p>
        )}
      </div>

      {/* Footer info & shortcut */}
      {onOpenFullSchedule && (
        <div className="mt-2.5 pt-2 border-t border-emerald-100/70 dark:border-[#1E3025] flex items-center justify-between text-[11px]">
          <span className="text-stone-500 dark:text-stone-400">
            {currentTime ? `Waktu sekarang: ${currentTime} WIB` : 'Sedang berlangsung'}
          </span>
          <button
            type="button"
            onClick={onOpenFullSchedule}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Lihat Jadwal Lengkap &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
