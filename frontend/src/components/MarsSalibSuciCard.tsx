import React, { useState } from 'react';
import { Music, BookOpen, Sparkles } from 'lucide-react';
import { SongLyricsModal } from './SongLyricsModal';

interface MarsSalibSuciCardProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const MarsSalibSuciCard: React.FC<MarsSalibSuciCardProps> = ({
  darkMode,
  onToggleDarkMode
}) => {
  const [showLyrics, setShowLyrics] = useState(false);

  return (
    <>
      <div
        id="mars-salib-suci-card"
        className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3 sm:p-3.5 mt-2 flex flex-col gap-2.5 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight">
              Mars Salib Suci
            </h3>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2.5 py-0.5 rounded-md border border-emerald-600/20 dark:border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Himne Sekolah</span>
          </span>
        </div>

        {/* Content Box */}
        <div
          onClick={() => setShowLyrics(true)}
          role="button"
          tabIndex={0}
          aria-label="Buka lirik lagu Mars Salib Suci"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowLyrics(true);
            }
          }}
          className="p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 bg-stone-50/80 dark:bg-[#141518] hover:bg-stone-100 dark:hover:bg-[#1E2025] hover:-translate-y-0.5 hover:shadow-xs border-stone-200/80 dark:border-stone-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Music className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold truncate block leading-snug text-stone-900 dark:text-stone-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 transition-colors">
                Mars Salib Suci
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 block leading-tight font-medium mt-0.5 truncate">
                Cipt. Pst. Eka Wahyu Djoko S., OSC • <em>In Cruce Salus</em>
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
              aria-label="Lihat lirik Mars Salib Suci"
              className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-[#13281E] hover:bg-emerald-100/90 dark:hover:bg-[#1A382B] hover:scale-105 active:scale-95 px-2.5 py-1 rounded-md border border-emerald-600/20 dark:border-emerald-500/30 flex items-center gap-1.5 transition-all duration-150 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lirik</span>
            </button>
          </div>
        </div>
      </div>

      {showLyrics && (
        <SongLyricsModal
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          songTitle="Mars Salib Suci"
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}
    </>
  );
};
