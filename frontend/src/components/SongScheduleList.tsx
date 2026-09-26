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

  // Read fixed song data - JANGAN UBAH DATA LAGU; JIKA BLANK, BIARKAN BLANK
  const rawSong = MONTHLY_SONG_SCHEDULE[month]?.[week];
  const songTitle = typeof rawSong === 'string' ? rawSong.trim() : '';
  const isBlank = !songTitle || songTitle === '-' || songTitle.toLowerCase() === 'blank';

  return (
    <div
      id="song-schedule-card"
      className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 shadow-2xs mt-2 flex flex-col gap-2 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4DDCE]/70 dark:border-[#2D333B]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center flex-shrink-0">
            <Music className="w-3 h-3" />
          </div>
          <h3 className="font-medium text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Lagu Wajib Minggu Ini
          </h3>
        </div>
        <span className="text-[10px] font-normal text-[#2C4E3A] dark:text-[#6EE7B7] bg-[#EBF3EE] dark:bg-[#1B3626] px-2 py-0.5 rounded-full border border-[#C6DEC0] dark:border-[#2B5E3C]">
          Minggu ke-{week} • {MONTH_ID[month]} {year}
        </span>
      </div>

      {/* Main Single Song Item (Hanya Minggu Ini Saja) */}
      <div
        onClick={() => {
          if (!isBlank) setShowLyrics(true);
        }}
        role={!isBlank ? 'button' : undefined}
        tabIndex={!isBlank ? 0 : undefined}
        onKeyDown={e => {
          if (!isBlank && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setShowLyrics(true);
          }
        }}
        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 transition ${
          !isBlank
            ? 'bg-[#FAF6EE]/80 dark:bg-[#252B33] hover:bg-[#FAF6EE] dark:hover:bg-[#2C3440] border-[#E4DDCE] dark:border-[#353E4C] hover:border-[#2C4E3A]/40 cursor-pointer shadow-2xs group'
            : 'bg-[#FAF6EE]/40 dark:bg-[#1A1D23] border-[#E4DDCE]/50 dark:border-[#2D333B] cursor-default'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] border border-[#2C4E3A] dark:border-[#34D399] flex-shrink-0">
            M{week}
          </span>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-normal tracking-wider text-stone-400 dark:text-stone-500 block leading-tight">
              Lagu Wajib Nasional
            </span>
            <span
              className={`text-xs sm:text-sm font-semibold truncate block leading-snug ${
                !isBlank
                  ? 'text-stone-800 dark:text-stone-100 group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] transition-colors'
                  : 'text-stone-400 dark:text-stone-500 italic font-normal'
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
              className="text-xs font-medium text-[#2C4E3A] dark:text-[#34D399] bg-white dark:bg-[#1E2228] hover:bg-[#EBF3EE] dark:hover:bg-[#28323F] px-2.5 py-1 rounded-md border border-[#C6DEC0] dark:border-[#3E4A5B] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
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
