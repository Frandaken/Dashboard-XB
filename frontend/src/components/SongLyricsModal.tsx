import React, { useEffect, useMemo } from 'react';
import { X, Music, User } from 'lucide-react';
import { SONG_LYRICS_DB, formatLyricsVerses } from '../data/songSchedule';

interface SongLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  weekNumber?: number;
}

export const SongLyricsModal: React.FC<SongLyricsModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  weekNumber
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const songData = SONG_LYRICS_DB[songTitle] || {
    title: songTitle,
    composer: 'Nasional',
    lyrics: ['(Lirik lengkap dapat dinyanyikan bersama saat apel/pagi hari)']
  };

  const verses = useMemo(() => {
    return formatLyricsVerses(songData.lyrics);
  }, [songData.lyrics]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-lyrics-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-[#161A20] text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#2E3744] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center shadow-xs">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="song-lyrics-title"
                className="font-display font-bold text-base sm:text-lg text-stone-900 dark:text-white leading-tight"
              >
                {songData.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 mt-0.5 font-medium">
                <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                <span>Ciptaan: <strong>{songData.composer}</strong></span>
                {weekNumber && (
                  <span className="text-stone-500 dark:text-stone-400">• Minggu ke-{weekNumber}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Lirik Lagu"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#252C37] hover:bg-stone-100 dark:hover:bg-[#2E3744] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lyrics body with touch scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto text-center flex-1">
          <div className="bg-white dark:bg-[#1C212A] border border-[#D8D2C5] dark:border-[#2E3744] rounded-xl p-5 sm:p-6 shadow-2xs">
            {verses.map((verse, vIdx) => (
              <div key={vIdx} className={`font-serif text-sm sm:text-base text-stone-900 dark:text-stone-100 ${vIdx > 0 ? "mt-3.5 pt-0.5" : ""}`}>
                {verse.map((line, lIdx) =>
                  line === '' ? (
                    <div key={lIdx} className="h-2" />
                  ) : (
                    <p key={lIdx} className="italic font-medium tracking-wide leading-snug">
                      {line}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#D8D2C5] dark:border-[#2E3744] bg-[#FAF7F2] dark:bg-[#1C212A] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] hover:bg-[#203a2a] dark:hover:bg-[#2EB882] text-white dark:text-[#0F172A] text-xs font-bold transition cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            Selesai Membaca
          </button>
        </div>
      </div>
    </div>
  );
};
