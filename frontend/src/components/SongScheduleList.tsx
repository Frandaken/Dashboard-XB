import React, { useState } from 'react';
import { Music, BookOpen } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getWeekOfMonth, MONTHLY_SONG_SCHEDULE } from '../data/songSchedule';
import { SongLyricsModal } from './SongLyricsModal';

interface SongScheduleListProps {
  viewYear?: number;
  viewMonth?: number;
  currentDate?: Date;
  selectedISO?: string | null;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SongScheduleList: React.FC<SongScheduleListProps> = ({
  currentDate,
  darkMode,
  onToggleDarkMode
}) => {
  const [showLyrics, setShowLyrics] = useState(false);

  // Compute active week for this week's song based on current active/today date
  const dateToUse = currentDate || new Date();
  const year = dateToUse.getFullYear();
  const month = dateToUse.getMonth();
  const day = dateToUse.getDate();
  const week = getWeekOfMonth(year, month, day);

  // Read fixed song data
  const rawSong = MONTHLY_SONG_SCHEDULE[month]?.[week];
  const songTitle = typeof rawSong === 'string' ? rawSong.trim() : '';
  const isBlank = !songTitle || songTitle === '-' || songTitle.toLowerCase() === 'blank';

  return (
    <div
      id="song-schedule-card"
      className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3 sm:p-3.5 mt-2 flex flex-col gap-2.5 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
        <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight">
          Lagu Wajib Minggu Ini
        </h3>
        <span className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/70 px-2.5 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-700/50">
          Minggu ke-{week} • {MONTH_ID[month]} {year}
        </span>
      </div>

      {/* Main Single Song Item */}
      <div
        onClick={() => {
          if (!isBlank) setShowLyrics(true);
        }}
        role={!isBlank ? 'button' : undefined}
        tabIndex={!isBlank ? 0 : undefined}
        aria-label={!isBlank ? `Buka lirik lagu ${songTitle}` : undefined}
        onKeyDown={e => {
          if (!isBlank && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setShowLyrics(true);
          }
        }}
        className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
          !isBlank
            ? 'bg-stone-50/80 dark:bg-[#141518] hover:bg-stone-100 dark:hover:bg-[#1E2025] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-400 dark:hover:border-stone-600 cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]'
            : 'bg-stone-50/40 dark:bg-[#141518]/50 border-stone-200/40 dark:border-stone-800/40 cursor-default'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-stone-200/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex-shrink-0">
            M{week}
          </span>
          <div className="min-w-0">
            <span className="text-xs text-stone-500 dark:text-stone-400 block leading-tight font-medium">
              Lagu Wajib Nasional
            </span>
            <span
              className={`text-sm sm:text-base font-bold truncate block leading-snug mt-0.5 ${
                !isBlank
                  ? 'text-stone-900 dark:text-stone-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 transition-colors'
                  : 'text-stone-400 dark:text-stone-500 italic'
              }`}
            >
              {!isBlank ? songTitle : '—'}
            </span>
          </div>
        </div>

        {!isBlank && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setShowLyrics(true);
              }}
              aria-label={`Lihat teks lirik lagu ${songTitle}`}
              className="text-xs font-medium text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-[#13281E] hover:bg-emerald-100/80 dark:hover:bg-[#1A382B] px-2.5 py-1 rounded-md border border-emerald-600/20 dark:border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lirik</span>
            </button>
          </div>
        )}
      </div>

      {/* Lyrics Modal */}
      {!isBlank && showLyrics && (
        <SongLyricsModal
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          songTitle={songTitle}
          weekNumber={week}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
