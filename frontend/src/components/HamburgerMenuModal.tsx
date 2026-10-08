import React, { useEffect } from 'react';
import { X, Music, ShieldCheck, ChevronRight, RotateCw, Sparkles, Users, PartyPopper } from 'lucide-react';

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSongLyrics: () => void;
  onOpenRandomPicker: () => void;
  onOpenGroupGenerator: () => void;
  onOpenIceBreaking?: () => void;
  onJumpToToday?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenSongLyrics,
  onOpenRandomPicker,
  onOpenGroupGenerator,
  onOpenIceBreaking
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-black text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#222222] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt="Logo Kelas XB"
              className="w-8 h-8 rounded-lg object-cover shadow-xs border border-[#D8D2C5] dark:border-[#262626]"
            />
            <div>
              <h2
                id="menu-modal-title"
                className="font-display font-bold text-base sm:text-lg text-[#1C1917] dark:text-white leading-tight"
              >
                Menu Navigasi & Alat
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Dashboard Kelas XB • TP 2026/2027
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Menu Navigasi"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0">
          {/* Action 1: Random Name Picker (Wheel of Names) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRandomPicker();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] hover:border-[#2C4E3A] dark:hover:border-[#34D399] hover:bg-[#FAF7F2] dark:hover:bg-[#161616] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-[#261B06] text-amber-800 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                    Random Name Picker
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-[#261B06] px-2 py-0.5 rounded-md border border-amber-300 dark:border-[#523A0F]">
                    Wheel of Names
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Putar roda acak untuk memilih satu siswa (tanya jawab, kuis, atau undian).
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 2: Random Group Name Picker (Team Generator) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGroupGenerator();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] hover:border-[#2C4E3A] dark:hover:border-[#34D399] hover:bg-[#FAF7F2] dark:hover:bg-[#161616] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-[#05182E] text-blue-800 dark:text-blue-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                    Random Group Picker
                  </span>
                  <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-[#05182E] px-2 py-0.5 rounded-md border border-blue-300 dark:border-[#0E3560]">
                    Team Generator
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Bagi siswa ke kelompok seimbang dengan opsi gender rata, perwakilan, dan unduh CSV.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 3: Koleksi Lagu Wajib */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSongLyrics();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] hover:border-[#2C4E3A] dark:hover:border-[#34D399] hover:bg-[#FAF7F2] dark:hover:bg-[#161616] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                    Koleksi Lagu Wajib Nasional
                  </span>
                  <span className="text-[10px] font-semibold text-[#14532D] dark:text-[#34D399] bg-[#DCFCE7] dark:bg-[#071F14] px-2 py-0.5 rounded-md border border-[#86EFAC] dark:border-[#0E492B]">
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

          {/* Action 4: Petugas Ice Breaking */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenIceBreaking) onOpenIceBreaking();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] hover:border-emerald-600 dark:hover:border-emerald-400 hover:bg-[#FAF7F2] dark:hover:bg-[#161616] shadow-xs transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-[#072416] text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                    Petugas Ice Breaking
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-[#072416] px-2 py-0.5 rounded-md border border-emerald-300 dark:border-[#0E492B]">
                    Jadwal Lengkap
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                  Lihat jadwal giliran ice breaking kelas pada jam pertama Sosiologi & Geografi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 4: Sinkronisasi Otomatis (Klik untuk Refresh Halaman & Data) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              window.location.reload();
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.reload();
              }
            }}
            aria-label="Sinkronisasi Otomatis. Klik untuk merefresh halaman."
            title="Klik untuk merefresh halaman dan memuat data terbaru"
            className="p-3.5 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-[#FAF7F2] dark:bg-[#0D0D0D] hover:bg-[#F2ECE1] dark:hover:bg-[#161616] hover:border-[#2C4E3A]/50 dark:hover:border-[#34D399]/50 shadow-2xs transition-all duration-150 cursor-pointer group flex items-start justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-[#071F14] text-emerald-800 dark:text-[#34D399] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-800 dark:text-stone-100 block">
                    Sinkronisasi Otomatis
                  </span>
                  <span className="text-[10px] font-semibold text-[#14532D] dark:text-[#34D399] bg-[#DCFCE7] dark:bg-[#071F14] px-2 py-0.5 rounded-md border border-[#86EFAC] dark:border-[#0E492B]">
                    Klik untuk Refresh
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
                  Jadwal pelajaran, penugasan, petugas MBG, doa, dan piket diperbarui otomatis dari Google Calendar & Google Sheets resmi kelas XB.
                </p>
              </div>
            </div>
            <RotateCw className="w-4 h-4 text-stone-400 group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399] group-hover:rotate-180 transition-transform duration-300 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-[#161616] hover:bg-stone-200 dark:hover:bg-[#222222] text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
