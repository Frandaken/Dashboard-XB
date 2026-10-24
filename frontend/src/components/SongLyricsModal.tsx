import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, User, Sun, Moon } from 'lucide-react';
import { SONG_LYRICS_DB, formatLyricsVerses } from '../data/songSchedule';

interface SongLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  weekNumber?: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SongLyricsModal: React.FC<SongLyricsModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  weekNumber,
  darkMode,
  onToggleDarkMode
}) => {
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-lyrics-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center justify-center shadow-xs">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="song-lyrics-title"
                className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight"
              >
                {songData.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-normal flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                  <span>Ciptaan: <strong className="font-semibold text-stone-700 dark:text-stone-300">{songData.composer}</strong></span>
                </span>
                {weekNumber && (
                  <span className="text-stone-400 dark:text-stone-500">• Minggu ke-{weekNumber}</span>
                )}
                <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium hidden sm:inline">
                  SMA Putra Nirmala
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Tutup Lirik Lagu"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lyrics body with touch scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto text-center flex-1">
          <div className="bg-stone-50/50 dark:bg-[#141518]/70 border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-5 sm:p-6 shadow-2xs">
            {verses.map((verse, vIdx) => (
              <div key={vIdx} className={`font-serif text-sm sm:text-base text-stone-900 dark:text-stone-100 ${vIdx > 0 ? "mt-4 pt-1" : ""}`}>
                {verse.map((line, lIdx) =>
                  line === '' ? (
                    <div key={lIdx} className="h-2.5" />
                  ) : (
                    <p key={lIdx} className="italic font-normal tracking-wide leading-relaxed">
                      {line}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-600"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
