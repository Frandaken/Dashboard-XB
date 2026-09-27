import React, { useState, useEffect, useMemo } from 'react';
import { X, Music, User, Calendar, Search } from 'lucide-react';
import { SONG_LYRICS_DB, ALL_SONGS_LIST, MONTHLY_SONG_SCHEDULE, formatLyricsVerses } from '../data/songSchedule';
import { MONTH_ID } from '../data/demoData';

interface AllSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: string;
}

export const AllSongsModal: React.FC<AllSongsModalProps> = ({
  isOpen,
  onClose,
  initialSong
}) => {
  const [activeSongTitle, setActiveSongTitle] = useState<string>(initialSong || ALL_SONGS_LIST[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-[#161A20] text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#2E3744] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center shadow-xs">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="all-songs-title"
                className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-white leading-tight"
              >
                Koleksi Lirik Lagu Wajib Nasional
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Koleksi Lagu"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#252C37] hover:bg-stone-100 dark:hover:bg-[#2E3744] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left = Song List, Right = Lyrics & Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* LEFT COLUMN: SONG SELECTOR LIST */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#D8D2C5] dark:border-[#2E3744] bg-[#FAF7F2] dark:bg-[#14181F] flex flex-col p-3 overflow-y-auto max-h-[220px] md:max-h-none flex-shrink-0">
            {/* Search filter */}
            <div className="relative mb-2.5 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lagu wajib..."
                aria-label="Cari judul lagu wajib"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#2C4E3A] dark:focus:ring-[#34D399]"
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
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A] group ${
                      isSelected
                        ? 'bg-[#2C4E3A] text-white border-[#2C4E3A] shadow-xs translate-x-0.5'
                        : 'bg-white dark:bg-[#1C212A] hover:bg-[#F3EFE6] dark:hover:bg-[#252C37] text-stone-900 dark:text-stone-100 border-[#D8D2C5] dark:border-[#2E3744] hover:border-[#2C4E3A]/40 dark:hover:border-[#34D399]/40 hover:translate-x-1 hover:shadow-xs active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold transition-transform duration-200 group-hover:scale-110 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-[#2A313C] text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm truncate">
                        {title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: LYRICS CONTENT & COMPOSER */}
          <div className="md:col-span-8 flex flex-col p-4 sm:p-6 overflow-y-auto bg-white dark:bg-[#161A20] flex-1">
            {/* Song Meta Header */}
            <div className="pb-3 border-b border-[#D8D2C5] dark:border-[#2E3744] flex-shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-stone-900 dark:text-white leading-tight">
                    {currentSongData.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-600 dark:text-stone-300 font-medium">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ciptaan: <strong>{currentSongData.composer}</strong></span>
                  </div>
                </div>

                {/* Scheduled Occurrences in Semester */}
                {scheduledOccurrences.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                      Jadwal Kelas XB:
                    </span>
                    {scheduledOccurrences.map((occ, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] dark:bg-[#163825] text-[#14532D] dark:text-[#A7F3D0] border border-[#86EFAC] dark:border-[#2D5A3C] flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{occ.monthName} M{occ.week}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lyrics Body: Single container div, verses separated by newline, compact lines */}
            <div className="py-4 flex-1">
              {verses.length > 0 ? (
                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C212A] border border-[#D8D2C5] dark:border-[#2E3744] shadow-2xs">
                  {verses.map((verse, vIdx) => (
                    <div key={vIdx} className={vIdx > 0 ? "mt-3.5 pt-0.5" : ""}>
                      {verse.map((line, lIdx) => (
                        <p
                          key={lIdx}
                          className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug tracking-wide"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#1C212A] border border-[#D8D2C5] dark:border-[#2E3744] text-center text-sm text-stone-500 italic">
                  Lirik untuk lagu ini belum tersedia.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#D8D2C5] dark:border-[#2E3744] bg-[#FAF7F2] dark:bg-[#1C212A] flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-[#252C37] hover:bg-stone-300 dark:hover:bg-[#2E3744] text-stone-800 dark:text-stone-200 text-xs font-bold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
