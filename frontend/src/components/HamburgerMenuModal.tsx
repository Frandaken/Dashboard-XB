import React, { useEffect } from 'react';
import { X, Music, Calendar, Moon, Sun, BookOpen, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSongLyrics: () => void;
  onJumpToToday: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenSongLyrics,
  onJumpToToday,
  darkMode,
  onToggleDarkMode
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-[#161A20] text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#2E3744] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.svg"
              alt="Logo Kelas XB"
              className="w-8 h-8 rounded-lg object-cover shadow-xs border border-[#D8D2C5] dark:border-[#3A4555]"
            />
            <div>
              <h2
                id="menu-modal-title"
                className="font-display font-bold text-base sm:text-lg text-[#1C1917] dark:text-white leading-tight"
              >
                Menu Navigasi
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Dashboard Kelas XB • TP 2026/2027
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Menu Navigasi"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#252C37] hover:bg-stone-100 dark:hover:bg-[#2E3744] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Clean real navigation items only, NO placeholders */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0">
          {/* Action 1: Koleksi Lagu Wajib */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSongLyrics();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] hover:border-[#2C4E3A] dark:hover:border-[#34D399] hover:bg-[#FAF7F2] dark:hover:bg-[#222935] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] dark:bg-[#163825] text-[#14532D] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                    Koleksi Lagu Wajib Nasional
                  </span>
                  <span className="text-[11px] font-semibold text-[#14532D] dark:text-[#34D399] bg-[#DCFCE7] dark:bg-[#163825] px-2 py-0.5 rounded-md border border-[#86EFAC] dark:border-[#265E3E]">
                    Buka Lirik
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Daftar lengkap lirik lagu wajib nasional per minggu semester aktif.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 2: Lompat ke Jadwal Hari Ini */}
          <button
            type="button"
            onClick={() => {
              onJumpToToday();
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] hover:border-[#2C4E3A] dark:hover:border-[#34D399] hover:bg-[#FAF7F2] dark:hover:bg-[#222935] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] dark:bg-[#142A3D] text-[#0369A1] dark:text-[#38BDF8] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50 block">
                  Lompat ke Jadwal Hari Ini
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Tampilkan langsung jadwal pelajaran, doa, MBG, dan piket tanggal hari ini.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 3: Pengaturan Tema (Light / Dark Mode) */}
          <div className="p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-[#342A16] text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center flex-shrink-0">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50 block">
                  Mode Tampilan
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Saat ini: <strong className="font-semibold text-stone-800 dark:text-stone-200">{darkMode ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
              className="px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-[#FAF7F2] dark:bg-[#252C37] hover:bg-stone-200 dark:hover:bg-[#2E3744] text-xs font-semibold text-stone-800 dark:text-stone-200 transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-700" />}
              <span>{darkMode ? 'Ganti ke Terang' : 'Ganti ke Gelap'}</span>
            </button>
          </div>

          {/* Info Card: Status Sinkronisasi Real-Time */}
          <div className="p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#2E3744] bg-[#FAF7F2] dark:bg-[#14181F] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#163825] text-emerald-800 dark:text-[#34D399] flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">
                Sinkronisasi Otomatis
              </span>
              <p className="text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
                Jadwal pelajaran, penugasan, petugas MBG, doa, dan piket diperbarui otomatis dari Google Calendar & Google Sheets resmi kelas XB.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Waktu Standar Indonesia Barat (WIB)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-[#252C37] hover:bg-stone-200 dark:hover:bg-[#2E3744] text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
