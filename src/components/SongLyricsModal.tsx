import React, { useEffect } from 'react';
import { X, Music } from 'lucide-react';
import { getSongLyrics } from '../data/songSchedule';

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
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !songTitle || songTitle === '-') return null;

  const songDetail = getSongLyrics(songTitle);

  return (
    <div
      id="song-lyrics-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="song-lyrics-modal"
        className="bg-white border border-[#E4DDCE] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4DDCE] bg-[#FAF6EE] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2C4E3A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#2C4E3A] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#C6DEC0]/60">
                  Lagu Wajib Nasional
                </span>
                {weekNumber !== undefined && (
                  <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    Minggu ke-{weekNumber}
                  </span>
                )}
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#2B2A28] leading-tight truncate">
                {songDetail?.title || songTitle}
              </h2>
              {songDetail?.composer && (
                <p className="text-xs text-stone-500 mt-0.5">
                  Ciptaan: <span className="font-semibold text-stone-700">{songDetail.composer}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Lirik Lagu"
            className="w-8 h-8 rounded-lg border border-[#E4DDCE] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Lirik Lagu */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {songDetail && songDetail.stanzas.length > 0 ? (
            <p className="text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
              {songDetail.stanzas.join('\n\n')}
            </p>
          ) : (
            <div className="p-4 text-center text-stone-500 text-sm italic">
              Lirik untuk lagu ini belum tersedia.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E4DDCE] bg-[#FAF6EE]/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2C4E3A] hover:bg-[#233F2E] text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
