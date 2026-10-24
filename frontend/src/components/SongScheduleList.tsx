import React, { useState } from 'react';
import { Music, BookOpen, ChevronRight } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getWeekOfMonth, MONTHLY_SONG_SCHEDULE } from '../data/songSchedule';
import { SongLyricsModal } from './SongLyricsModal';
import { AllSongsModal } from './AllSongsModal';

interface SongScheduleListProps {
  viewYear?: number;
  viewMonth?: number;
  currentDate?: Date;
  selectedISO?: string | null;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenAllSongs?: () => void;
}

export const SongScheduleList: React.FC<SongScheduleListProps> = ({
  currentDate,
  darkMode,
  onToggleDarkMode,
  onOpenAllSongs
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAllSongsLocal, setShowAllSongsLocal] = useState(false);

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

  const handleOpenAllSongs = () => {
    if (onOpenAllSongs) {
      onOpenAllSongs();
    } else {
      setShowAllSongsLocal(true);
    }
  };

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

      {/* Main Single Song Item or Link to Koleksi Lagu when Blank */}
      {isBlank ? (
        <button
          type="button"
          onClick={handleOpenAllSongs}
          className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors block leading-tight">
                Koleksi Lagu Wajib Nasional
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                Minggu ke-{week} kosong • Klik untuk melihat koleksi lengkap lagu
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
        </button>
      ) : (
        <div
          onClick={() => {
            if (!isBlank) setShowLyrics(true);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Buka lirik lagu ${songTitle}`}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowLyrics(true);
            }
          }}
          className="p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition bg-stone-50/80 dark:bg-[#141518] hover:bg-stone-100 dark:hover:bg-[#1E2025] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-400 dark:hover:border-stone-600 cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-stone-200/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex-shrink-0">
              M{week}
            </span>
            <div className="min-w-0">
              <span className="text-xs text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Lagu Wajib Nasional
              </span>
              <span className="text-sm sm:text-base font-bold truncate block leading-snug mt-0.5 text-stone-900 dark:text-stone-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 transition-colors">
                {songTitle}
              </span>
            </div>
          </div>

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
        </div>
      )}

      {/* Lyrics Modal for Specific Song */}
      {!isBlank && showLyrics && (
        <SongLyricsModal
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          songTitle={songTitle}
          weekNumber={week}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}

      {/* Fallback All Songs Modal if opened locally */}
      {isBlank && showAllSongsLocal && (
        <AllSongsModal
          isOpen={showAllSongsLocal}
          onClose={() => setShowAllSongsLocal(false)}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}
    </div>
  );
};
