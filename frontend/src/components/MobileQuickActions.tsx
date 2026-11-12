import React, { useState, useEffect, useRef } from 'react';
import { Users, FerrisWheel, Search, Wallet, Bell, Sun, Moon, Download, Smartphone, X, ChevronDown, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileQuickActionsProps {
  onOpenSearch?: () => void;
  onOpenKasMurid?: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
  onOpenRandomPicker?: () => void;
  onOpenGroupGenerator?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  className?: string;
}

export const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onOpenSearch,
  onOpenKasMurid,
  onOpenNotifications,
  hasNotificationActive,
  onOpenRandomPicker,
  onOpenGroupGenerator,
  darkMode,
  onToggleDarkMode,
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className={`sm:hidden w-full ${className}`}>
      <div className="grid grid-cols-3 xs:grid-cols-6 gap-1.5 p-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-[#16171A] shadow-2xs">
        {/* 1. Dropdown Pembagian Kelompok & Spin Wheel */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            aria-expanded={isDropdownOpen}
            aria-label="Menu Pembagian Kelompok & Roda Putar Siswa"
            title="Kelompok & Spin Wheel"
            className={`w-full h-10 px-1.5 py-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer group ${
              isDropdownOpen
                ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40 shadow-xs'
                : 'bg-white dark:bg-[#1D1E22] text-stone-700 dark:text-stone-200 border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-50 dark:hover:bg-[#25272D] hover:border-emerald-600/30'
            }`}
          >
            <div className="flex items-center gap-0.5 leading-none">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
            </div>
            <span className="truncate leading-none text-[10px] group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">Kelompok</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#18191C] shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95"
            >
              {onOpenRandomPicker && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenRandomPicker();
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-amber-50/80 dark:hover:bg-[#20180B] hover:translate-x-1 flex items-center gap-2 transition-all duration-150 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-[#20170A] text-amber-700 dark:text-amber-400 border border-amber-300/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200">
                    <FerrisWheel className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">Roda Putar Siswa</div>
                    <div className="text-[10px] text-stone-500">Pilih siswa acak</div>
                  </div>
                </button>
              )}
              {onOpenGroupGenerator && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenGroupGenerator();
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-blue-50/80 dark:hover:bg-[#0E1A29] hover:translate-x-1 flex items-center gap-2 transition-all duration-150 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#0D1D2E] text-blue-700 dark:text-blue-400 border border-blue-200/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">Bagi Kelompok</div>
                    <div className="text-[10px] text-stone-500">Rata gender & seimbang</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Tombol Pencarian Cepat */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Cari mata pelajaran, tugas, atau acara"
          title="Pencarian Cepat"
          className="h-10 px-1.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-[#1D1E22] hover:bg-stone-50 dark:hover:bg-[#25272D] hover:border-emerald-600/30 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 text-stone-700 dark:text-stone-200 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
          <span className="truncate leading-none text-[10px] group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">Cari</span>
        </button>

        {/* 3. Tombol Kas Murid */}
        <button
          type="button"
          onClick={onOpenKasMurid}
          aria-label="Buka Buku Kas Murid"
          title="Buku Kas Murid"
          className="h-10 px-1.5 py-1 rounded-lg border border-emerald-600/25 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-[#13281E]/70 hover:bg-emerald-100/90 dark:hover:bg-[#1A382B] hover:-translate-y-0.5 hover:shadow-xs active:scale-95 text-emerald-900 dark:text-emerald-300 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer group"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
          <span className="truncate leading-none text-[10px] font-bold">Kas Murid</span>
        </button>

        {/* 4. Tombol Pengaturan Notifikasi */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Pengaturan Push Notifikasi"
          title="Pengaturan Notifikasi"
          className={`h-10 px-1.5 py-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer group ${
            hasNotificationActive
              ? 'border-emerald-600/30 dark:border-emerald-500/35 bg-emerald-50/70 dark:bg-[#13281E]/70 text-emerald-900 dark:text-emerald-300'
              : 'border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-[#1D1E22] hover:bg-stone-50 dark:hover:bg-[#25272D] text-stone-700 dark:text-stone-200 hover:border-emerald-600/30'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200 ${hasNotificationActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`} />
          <span className="truncate leading-none text-[10px] group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">Notifikasi</span>
        </button>

        {/* 5. Tombol Ganti Mode Gelap/Terang */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
          className="h-10 px-1.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-[#1D1E22] hover:bg-stone-50 dark:hover:bg-[#25272D] hover:border-stone-300 dark:hover:border-stone-600 hover:-translate-y-0.5 hover:shadow-xs active:scale-90 text-stone-700 dark:text-stone-200 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer group"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="truncate leading-none text-[10px]">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300 group-hover:-rotate-45 transition-transform duration-300" />
              <span className="truncate leading-none text-[10px]">Gelap</span>
            </>
          )}
        </button>

        {/* 6. Tombol Install PWA */}
        {isInstalled ? (
          <div
            title="Aplikasi PWA sudah terpasang"
            className="h-10 px-1.5 py-1 rounded-lg border border-emerald-600/25 dark:border-emerald-500/25 bg-emerald-50/50 dark:bg-[#13281E]/50 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium hover:scale-[1.02] transition-transform duration-150 cursor-default"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate leading-none text-[10px]">Terpasang</span>
          </div>
        ) : isInstallable ? (
          <button
            type="button"
            onClick={install}
            aria-label="Install Aplikasi PWA"
            title="Install Aplikasi ke Layar Utama"
            className="h-10 px-1.5 py-1 rounded-lg border border-[#3F6E52]/40 bg-[#3F6E52] text-white hover:bg-[#325841] hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer shadow-2xs group"
          >
            <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            <span className="truncate leading-none text-[10px]">Install</span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            aria-label="Panduan Install PWA di iOS"
            title="Install di iOS"
            className="h-10 px-1.5 py-1 rounded-lg border border-[#3F6E52]/30 bg-[#3F6E52]/10 text-[#3F6E52] dark:text-[#34D399] hover:bg-[#3F6E52]/20 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer group"
          >
            <Smartphone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
            <span className="truncate leading-none text-[10px]">Install iOS</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
            }}
            aria-label="Aplikasi Kelas XB"
            title="Aplikasi Siap Digunakan"
            className="h-10 px-1.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-[#1D1E22] hover:bg-stone-50 dark:hover:bg-[#25272D] hover:-translate-y-0.5 hover:shadow-xs active:scale-95 text-stone-700 dark:text-stone-200 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer group"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 group-hover:scale-110 transition-transform duration-200" />
            <span className="truncate leading-none text-[10px]">Aplikasi</span>
          </button>
        )}
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop-tint transition-colors duration-200 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#FAF8F5] dark:bg-[#0A0A0A] border border-[#E4DDCE] dark:border-[#222222] p-5 shadow-xl text-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DDCE] dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#3F6E52] dark:bg-[#34D399] text-white dark:text-[#0A0A0A] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#2B2A28] dark:text-white">Pasang di iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] dark:bg-[#222222] font-bold text-[11px] text-[#2B2A28] dark:text-stone-200 flex items-center justify-center">1</span>
                <span>Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah Safari browser.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] dark:bg-[#222222] font-bold text-[11px] text-[#2B2A28] dark:text-stone-200 flex items-center justify-center">2</span>
                <span>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] dark:bg-[#222222] font-bold text-[11px] text-[#2B2A28] dark:text-stone-200 flex items-center justify-center">3</span>
                <span>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas untuk menyelesaikan.</span>
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#3F6E52] dark:bg-[#34D399] py-2 text-xs font-semibold text-white dark:text-[#0A0A0A] hover:bg-[#325841] dark:hover:bg-[#2EB882] transition shadow-xs cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
