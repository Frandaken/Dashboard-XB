import React, { useEffect } from 'react';
import { X, Music, User } from 'lucide-react';
import { SONG_LYRICS_DB } from '../data/songSchedule';

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

  if (!isOpen) return null;

  const songData = SONG_LYRICS_DB[songTitle] || {
    title: songTitle,
    composer: 'Nasional',
    lyrics: ['(Lirik lengkap dapat dinyanyikan bersama saat apel/pagi hari)']
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF6EE] dark:bg-[#181B20] rounded-2xl border border-[#E4DDCE] dark:border-[#2D333B] shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center shadow-xs">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base sm:text-lg text-[#2B2A28] dark:text-white leading-tight">
                {songData.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-normal">
                <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                <span>Ciptaan: {songData.composer}</span>
                {weekNumber && (
                  <span className="text-stone-400 dark:text-stone-500">• Minggu ke-{weekNumber}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Lirik"
            className="w-8 h-8 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-100 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-500 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lyrics body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          <div className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="space-y-2 font-serif text-sm sm:text-base text-stone-800 dark:text-stone-100 leading-relaxed">
              {songData.lyrics.map((line, idx) =>
                line === '' ? (
                  <div key={idx} className="h-3" />
                ) : (
                  <p key={idx} className="italic tracking-wide font-normal">
                    {line}
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] hover:bg-[#203a2a] dark:hover:bg-[#2EB882] text-white dark:text-[#0F172A] text-xs font-medium transition cursor-pointer shadow-xs"
          >
            Selesai Membaca
          </button>
        </div>
      </div>
    </div>
  );
};
