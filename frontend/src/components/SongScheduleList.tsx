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
}

export const SongScheduleList: React.FC<SongScheduleListProps> = ({
  currentDate
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
      className="bg-white dark:bg-[#181C23] border border-[#D8D2C5] dark:border-[#2E3744] rounded-xl p-3 sm:p-3.5 shadow-xs mt-2 flex flex-col gap-2.5 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D5] dark:border-[#2E3744]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Music className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 dark:text-stone-200">
            Lagu Wajib Minggu Ini
          </h3>
        </div>
        <span className="text-xs font-semibold text-[#14532D] dark:text-[#6EE7B7] bg-[#DCFCE7] dark:bg-[#163825] px-2.5 py-0.5 rounded-full border border-[#86EFAC] dark:border-[#265E3E]">
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
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
          !isBlank
            ? 'bg-[#FAF7F2] dark:bg-[#202630] hover:bg-stone-100 dark:hover:bg-[#28313E] border-[#D8D2C5] dark:border-[#333E4E] hover:border-[#2C4E3A]/60 cursor-pointer shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]'
            : 'bg-[#FAF7F2]/60 dark:bg-[#181C23] border-[#E8E2D5] dark:border-[#2E3744] cursor-default'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold px-2 py-1 rounded-md bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex-shrink-0">
            M{week}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stone-600 dark:text-stone-400 block leading-tight">
              Lagu Wajib Nasional
            </span>
            <span
              className={`text-sm font-bold truncate block leading-snug ${
                !isBlank
                  ? 'text-stone-900 dark:text-white group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] transition-colors'
                  : 'text-stone-500 dark:text-stone-400 italic font-medium'
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
              className="text-xs font-bold text-[#14532D] dark:text-[#34D399] bg-white dark:bg-[#181C23] hover:bg-[#DCFCE7] dark:hover:bg-[#202630] px-3 py-1.5 rounded-lg border border-[#86EFAC] dark:border-[#3E4A5B] flex items-center gap-1.5 transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
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
        />
      )}
    </div>
  );
};
