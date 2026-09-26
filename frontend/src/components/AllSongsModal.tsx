import React, { useState, useEffect } from 'react';
import { X, Music, BookOpen, User, Calendar, Check, Search } from 'lucide-react';
import { SONG_LYRICS_DB, ALL_SONGS_LIST, MONTHLY_SONG_SCHEDULE } from '../data/songSchedule';
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

  if (!isOpen) return null;

  const currentSongData = SONG_LYRICS_DB[activeSongTitle] || {
    title: activeSongTitle,
    composer: 'Nasional',
    lyrics: []
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF6EE] dark:bg-[#181B20] text-[#2B2A28] dark:text-[#E6EDF3] rounded-2xl border border-[#E4DDCE] dark:border-[#2D333B] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center shadow-xs">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#2B2A28] dark:text-white leading-tight">
                Koleksi Lirik Lagu Wajib Nasional
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pilih lagu untuk melihat lirik lengkap dan jadwal pemutarannya
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-100 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-500 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left = Song List, Right = Lyrics & Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* LEFT COLUMN: SONG SELECTOR LIST */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#E4DDCE] dark:border-[#2D333B] bg-[#F5EFE3]/50 dark:bg-[#14161A] flex flex-col p-3 overflow-y-auto">
            {/* Search filter */}
            <div className="relative mb-2.5 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lagu wajib..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] text-xs font-semibold text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2C4E3A] dark:focus:ring-[#34D399]"
              />
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {filteredSongs.map(title => {
                const isSelected = title === activeSongTitle;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setActiveSongTitle(title)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C4E3A] text-white border-[#2C4E3A] shadow-xs'
                        : 'bg-white dark:bg-[#1E2228] hover:bg-stone-50 dark:hover:bg-[#252B33] text-stone-800 dark:text-stone-200 border-[#E4DDCE] dark:border-[#2D333B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-[#2A303A] text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm truncate">
                        {title}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: FULL LYRICS DISPLAY */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-[#FAF6EE] dark:bg-[#181B20] p-4 sm:p-6 overflow-y-auto">
            {/* Song Meta Header */}
            <div className="pb-3 border-b border-[#E4DDCE] dark:border-[#2D333B] mb-4">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-stone-900 dark:text-white leading-tight">
                {currentSongData.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                <span>Ciptaan: <strong className="text-stone-700 dark:text-stone-300">{currentSongData.composer}</strong></span>
              </div>

              {/* Schedule Occurrences Tags */}
              {scheduledOccurrences.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#2C4E3A] dark:text-[#34D399] mr-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Jadwal Kelas:</span>
                  </div>
                  {scheduledOccurrences.map((occ, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-[#EBF3EE] dark:bg-[#1E3326] text-[#2C4E3A] dark:text-[#6EE7B7] border border-[#C6DEC0] dark:border-[#285A3C]"
                    >
                      {occ.monthName} M{occ.week}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lyrics Card */}
            <div className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-5 sm:p-7 shadow-xs">
              <div className="space-y-3 font-serif text-sm sm:text-base md:text-lg text-stone-900 dark:text-stone-100 leading-relaxed tracking-wide text-center">
                {currentSongData.lyrics.map((line, idx) =>
                  line === '' ? (
                    <div key={idx} className="h-3" />
                  ) : (
                    <p key={idx} className="font-medium italic">
                      {line}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Total: {ALL_SONGS_LIST.length} Lagu Wajib Nasional</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] hover:bg-[#203a2a] dark:hover:bg-[#2EB882] text-white dark:text-[#0F172A] text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
