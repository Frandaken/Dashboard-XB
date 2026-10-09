import React from 'react';
import { Home, Compass, ArrowLeft, Sun, Moon, Sparkles, Menu, Calendar, ShieldAlert } from 'lucide-react';

interface NotFoundUIProps {
  onGoHome: () => void;
  onOpenMenu?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentPath?: string;
}

export const NotFoundUI: React.FC<NotFoundUIProps> = ({
  onGoHome,
  onOpenMenu,
  darkMode = false,
  onToggleDarkMode,
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/404'
}) => {
  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] dark:bg-black text-[#1C1917] dark:text-[#F8FAFC] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="w-full border-b border-[#D8D2C5] dark:border-[#222222] bg-white/80 dark:bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onGoHome}>
          <img
            src="/icon.png"
            alt="Logo Kelas XB"
            className="w-8 h-8 rounded-lg object-cover shadow-2xs border border-[#D8D2C5] dark:border-[#262626]"
          />
          <div>
            <h1 className="font-display font-bold text-sm sm:text-base text-stone-900 dark:text-white leading-tight">
              Dashboard Kelas XB
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              SMA Putra Nirmala • Kelas XB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap (OLED Black)'}
              className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          )}

          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] text-xs font-semibold text-stone-800 dark:text-stone-200 transition cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}
        </div>
      </header>

      {/* Main 404 Content Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-xl bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-2xl p-6 sm:p-10 shadow-lg text-center flex flex-col items-center animate-fade-in">
          {/* Animated 404 Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 dark:bg-[#071F14] border border-emerald-200 dark:border-[#0E492B] flex items-center justify-center text-emerald-700 dark:text-[#34D399] shadow-inner">
              <Compass className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            </div>
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#DC2626] text-white shadow-xs">
              404
            </span>
          </div>

          {/* Big Error Title */}
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 dark:text-white tracking-tight">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 mt-3 max-w-md leading-relaxed">
            Tautan yang Anda akses tidak tersedia atau telah dipindahkan ke alamat lain dalam sistem Dashboard Kelas XB.
          </p>

          {/* Requested Path display */}
          {currentPath && (
            <div className="mt-4 px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-[#121212] border border-stone-200 dark:border-[#222222] text-xs font-mono text-stone-700 dark:text-stone-300 break-all max-w-full">
              <span className="text-stone-400 dark:text-stone-500 mr-1.5">URL:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{currentPath}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onGoHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2C4E3A] hover:bg-[#233F2E] text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>

            {onOpenMenu && (
              <button
                type="button"
                onClick={onOpenMenu}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#D8D2C5] dark:border-[#262626] bg-stone-50 dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] text-stone-800 dark:text-stone-200 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Buka Alat & Fitur</span>
              </button>
            )}
          </div>

          {/* Quick Links Card */}
          <div className="mt-10 pt-6 border-t border-[#D8D2C5]/70 dark:border-[#1E1E1E] w-full text-left">
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              Mungkin Anda Sedang Mencari:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onGoHome}
                className="p-3 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-[#FAF7F2] dark:bg-[#0D0D0D] hover:bg-stone-100 dark:hover:bg-[#161616] text-left transition cursor-pointer flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#082819] text-[#14532D] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Jadwal Pelajaran
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Jadwal harian, JP, & tugas
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGoHome();
                  if (onOpenMenu) setTimeout(onOpenMenu, 150);
                }}
                className="p-3 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-[#FAF7F2] dark:bg-[#0D0D0D] hover:bg-stone-100 dark:hover:bg-[#161616] text-left transition cursor-pointer flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-[#2A1D05] text-amber-900 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Wheel of Names & Kelompok
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Pengacak nama & tim acak
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
