import React, { useState, useEffect, useMemo } from 'react';
import { X, Music, User, Calendar, Search } from 'lucide-react';
import { SONG_LYRICS_DB, ALL_SONGS_LIST, MONTHLY_SONG_SCHEDULE, formatLyricsVerses } from '../data/songSchedule';
import { MONTH_ID } from '../data/demoData';

interface AllSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AllSongsModal: React.FC<AllSongsModalProps> = ({
  isOpen,
  onClose,
  initialSong,
  darkMode,
  onToggleDarkMode
}) => {
  const [activeSongTitle, setActiveSongTitle] = useState<string>(initialSong || ALL_SONGS_LIST[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time tracking of app theme (Light mode / OLED black)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof darkMode === 'boolean') return darkMode;
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof darkMode === 'boolean') {
      setIsDark(darkMode);
      return;
    }
    const checkDark = () => {
      if (typeof document !== 'undefined') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [darkMode]);

  useEffect(() => {
    if (initialSong) {
      setActiveSongTitle(initialSong);
    }
  }, [initialSong]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentSongData = SONG_LYRICS_DB[activeSongTitle] || {
    title: activeSongTitle,
    composer: 'Nasional',
    lyrics: []
  };

  const verses = useMemo(() => {
    return formatLyricsVerses(currentSongData.lyrics);
  }, [currentSongData.lyrics]);

  if (!isOpen) return null;

  // Find when this song is scheduled across the school year
  const scheduledOccurrences: { monthName: string; week: number }[] = [];
  for (const [mStr, weeks] of Object.entries(MONTHLY_SONG_SCHEDULE)) {
    const m = parseInt(mStr, 10);
    for (const [wStr, song] of Object.entries(weeks)) {
      if (song && song.toLowerCase().trim() === activeSongTitle.toLowerCase().trim()) {
        scheduledOccurrences.push({
          monthName: MONTH_ID[m],
          week: parseInt(wStr, 10)
        });
      }
    }
  }

  const filteredSongs = ALL_SONGS_LIST.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-songs-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center justify-center shadow-xs">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="all-songs-title"
                className="font-editorial font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-tight"
              >
                Koleksi Lirik Lagu Wajib Nasional
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                SMA Putra Nirmala • Panduan Apel &amp; Pembiasaan Pagi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              aria-label="Tutup Koleksi Lagu"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left = Song List, Right = Lyrics & Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* LEFT COLUMN: SONG SELECTOR LIST */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-[#141518]/60 flex flex-col p-3 overflow-y-auto max-h-[220px] md:max-h-none flex-shrink-0">
            {/* Search filter */}
            <div className="relative mb-2.5 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lagu wajib..."
                aria-label="Cari judul lagu wajib"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1" role="listbox" aria-label="Daftar lagu wajib">
              {filteredSongs.map(title => {
                const isSelected = title === activeSongTitle;
                return (
                  <button
                    key={title}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setActiveSongTitle(title)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 group ${
                      isSelected
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] text-stone-900 dark:text-stone-100 border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold transition-transform duration-150 group-hover:scale-105 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm truncate">
                        {title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: LYRICS CONTENT & COMPOSER */}
          <div className="md:col-span-8 flex flex-col p-4 sm:p-6 overflow-y-auto bg-white dark:bg-[#18191C] flex-1">
            {/* Song Meta Header */}
            <div className="pb-3 border-b border-stone-200/80 dark:border-stone-800/80 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-editorial font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 leading-tight">
                    {currentSongData.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 dark:text-stone-400 font-normal">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ciptaan: <strong className="font-semibold text-stone-700 dark:text-stone-300">{currentSongData.composer}</strong></span>
                  </div>
                </div>

                {/* Scheduled Occurrences in Semester */}
                {scheduledOccurrences.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      Jadwal Kelas XB:
                    </span>
                    {scheduledOccurrences.map((occ, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{occ.monthName} M{occ.week}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lyrics Body */}
            <div className="py-4 flex-1">
              {verses.length > 0 ? (
                <div className="p-4 sm:p-5 rounded-xl bg-stone-50/50 dark:bg-[#141518]/70 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs font-serif">
                  {verses.map((verse, vIdx) => (
                    <div key={vIdx} className={vIdx > 0 ? "mt-4 pt-1" : ""}>
                      {verse.map((line, lIdx) => (
                        <p
                          key={lIdx}
                          className="text-sm sm:text-base font-normal text-stone-900 dark:text-stone-100 leading-relaxed tracking-wide italic"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-50/50 dark:bg-[#141518]/70 border border-stone-200/80 dark:border-stone-800/80 text-center text-sm text-stone-500 italic">
                  Lirik untuk lagu ini belum tersedia.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-600"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
