import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon, Bell, Wallet, Users, FerrisWheel, ChevronDown, Search } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getWIBDateParts, WIBDateInfo } from '../utils/dateUtils';
import { MONTH_ID } from '../data/demoData';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
  onOpenKasMurid?: () => void;
  onOpenRandomPicker?: () => void;
  onOpenGroupGenerator?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
  onOpenNotifications,
  hasNotificationActive,
  onOpenKasMurid,
  onOpenRandomPicker,
  onOpenGroupGenerator,
  onOpenSearch
}) => {
  const [wibInfo, setWibInfo] = useState<WIBDateInfo>(() => getWIBDateParts());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setWibInfo(getWIBDateParts());
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header
      id="classroom-header"
      className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80 pb-3 flex-shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
          className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-800 dark:text-stone-200 transition cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F] flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-stone-700 dark:text-stone-200 group-hover:scale-105 transition-transform" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/icon.png"
            alt="Logo SMA Putra Nirmala Kelas XB"
            className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl object-cover flex-shrink-0 border border-stone-200/80 dark:border-stone-800/80"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 leading-tight sm:leading-none">
              <h1 className="font-editorial text-xs xs:text-sm sm:text-lg md:text-base lg:text-xl xl:text-2xl text-stone-900 dark:text-stone-100 font-bold tracking-tight whitespace-normal sm:whitespace-nowrap leading-tight sm:leading-none break-words">
                Dashboard Kelas XB
              </h1>
            </div>
            <p className="mt-0.5 sm:mt-1 leading-none text-stone-500 dark:text-stone-400">
              <span className="font-medium text-stone-600 dark:text-stone-300 text-[10px] sm:text-xs md:text-[11px] lg:text-xs whitespace-nowrap block">
                SMA Putra Nirmala
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Center Global Search Bar (Desktop / Tablet) */}
      {onOpenSearch && (
        <div className="hidden md:flex flex-1 min-w-0 max-w-[200px] lg:max-w-sm xl:max-w-md mx-2 lg:mx-3">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Cari mata pelajaran, tugas, atau acara"
            title="Cari mata pelajaran, tugas, atau acara (Tekan ⌘K / Ctrl+K)"
            className="w-full h-9 flex items-center justify-between px-3 rounded-lg border border-stone-200/90 dark:border-stone-800 bg-stone-50/90 dark:bg-[#18191C] hover:bg-white dark:hover:bg-[#202227] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 text-stone-500 dark:text-stone-400 text-xs sm:text-[13px] transition cursor-pointer shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              <span className="truncate text-stone-500 dark:text-stone-400 font-normal">
                Cari pelajaran, tugas, acara...
              </span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-500 dark:text-stone-400 bg-white dark:bg-[#222429] border border-stone-200/80 dark:border-stone-700/80 rounded shadow-2xs flex-shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Shortcut Dropdown: Pembagian Kelompok & Spin Wheel */}
        {(onOpenRandomPicker || onOpenGroupGenerator) && (
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Menu Pembagian Kelompok & Roda Putar Siswa"
              title="Shortcut Pembagian Kelompok & Spin Wheel"
              className={`h-9 px-2 sm:px-2.5 lg:px-3 rounded-lg border flex items-center gap-1 sm:gap-1.5 lg:gap-2 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                isDropdownOpen
                  ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40 dark:border-emerald-500/40'
                  : 'bg-white dark:bg-[#191A1E] text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-[#222429]'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">
                Pembagian Kelompok
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Option 1: Spin Wheel (Wheel of Names) */}
                {onOpenRandomPicker && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenRandomPicker();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-amber-50/70 dark:hover:bg-[#20180B] transition flex items-center gap-2.5 group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-[#20170A] text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FerrisWheel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                          Roda Putar Siswa
                        </span>
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-[#2D1F08] px-1.5 py-0.2 rounded">
                          Spin Wheel
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        Pilih 1 siswa acak untuk kuis/tugas
                      </p>
                    </div>
                  </button>
                )}

                {/* Option 2: Group Generator (Team Picker) */}
                {onOpenGroupGenerator && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenGroupGenerator();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50/70 dark:hover:bg-[#0E1A29] transition flex items-center gap-2.5 group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0D1D2E] text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                          Pembagian Kelompok
                        </span>
                        <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-[#0F2338] px-1.5 py-0.2 rounded">
                          Generator
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        Bagi tim seimbang &amp; rata gender
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Search Button (sm to md only; on < sm accessible via Hamburger Menu) */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Cari mata pelajaran, tugas, atau acara"
            title="Cari mata pelajaran, tugas, atau acara"
            className="hidden sm:flex md:hidden w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Search className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          </button>
        )}

        {/* Kas Murid Quick-Access Button (Icon Only - hidden on narrow screens, accessible via Menu) */}
        {onOpenKasMurid && (
          <button
            onClick={onOpenKasMurid}
            aria-label="Buka Buku Kas Murid"
            title="Buku Kas & Penunggakan Murid Kelas XB"
            className="hidden sm:flex w-9 h-9 rounded-lg border border-emerald-600/25 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-[#13281E] hover:bg-emerald-100/70 dark:hover:bg-[#1A382B] items-center justify-center text-emerald-800 dark:text-emerald-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>
        )}

        {/* Push Notification Button (hidden on narrow screens, accessible via Menu) */}
        {!hasNotificationActive && onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            aria-label="Pengaturan Push Notifikasi"
            title="Pengaturan Push Notifikasi & Pengingat"
            className="hidden sm:flex relative w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Bell className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          </button>
        )}

        {/* Dark Mode Toggle Button (hidden on narrow screens, accessible via Menu) */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="hidden sm:flex w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-stone-700" />
          )}
        </button>

        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>

        {/* Live Clock strictly synchronized to WIB with Date above it */}
        <div className="text-right pl-1 flex flex-col items-end justify-center flex-shrink-0 min-w-0">
          <span className="text-[10px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 leading-tight block mb-0.5 whitespace-nowrap">
            <span className="xl:hidden inline">
              {wibInfo.dowName}, {wibInfo.day} {MONTH_ID[wibInfo.month]?.slice(0, 3)} {wibInfo.year}
            </span>
            <span className="hidden xl:inline">
              {wibInfo.formattedDate}
            </span>
          </span>
          <div
            className="font-mono text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums leading-none tracking-tight whitespace-nowrap"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {wibInfo.timeStr} <span className="text-[9px] xs:text-[10px] sm:text-xs font-sans font-medium text-stone-500 dark:text-stone-400">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
