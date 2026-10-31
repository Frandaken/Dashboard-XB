import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon, Bell, Wallet, Users, Sparkles, ChevronDown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getWIBDateParts, WIBDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
  onOpenKasMurid?: () => void;
  onOpenRandomPicker?: () => void;
  onOpenGroupGenerator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
  onOpenNotifications,
  hasNotificationActive,
  onOpenKasMurid,
  onOpenRandomPicker,
  onOpenGroupGenerator
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
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
          className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-800 dark:text-stone-200 transition cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          <Menu className="w-4 h-4 text-stone-700 dark:text-stone-200 group-hover:scale-105 transition-transform" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="Logo SMA Putra Nirmala Kelas XB"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover flex-shrink-0 border border-stone-200/80 dark:border-stone-800/80"
          />
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h1 className="font-editorial text-xl sm:text-2xl lg:text-3xl text-stone-900 dark:text-stone-100 font-bold tracking-tight leading-none">
                Dashboard Kelas XB
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-none">
              <span className="font-medium text-stone-600 dark:text-stone-300">
                SMA Putra Nirmala
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Shortcut Dropdown: Pembagian Kelompok & Spin Wheel */}
        {(onOpenRandomPicker || onOpenGroupGenerator) && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Menu Pembagian Kelompok & Roda Putar Siswa"
              title="Shortcut Pembagian Kelompok & Spin Wheel"
              className={`h-9 px-2.5 sm:px-3 rounded-lg border flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                isDropdownOpen
                  ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40 dark:border-emerald-500/40'
                  : 'bg-white dark:bg-[#191A1E] text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-[#222429]'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
              <span className="hidden min-[480px]:inline whitespace-nowrap">
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
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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

        {/* Kas Murid Quick-Access Button (Icon Only) */}
        {onOpenKasMurid && (
          <button
            onClick={onOpenKasMurid}
            aria-label="Buka Buku Kas Murid"
            title="Buku Kas & Penunggakan Murid Kelas XB"
            className="w-9 h-9 rounded-lg border border-emerald-600/25 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-[#13281E] hover:bg-emerald-100/70 dark:hover:bg-[#1A382B] flex items-center justify-center text-emerald-800 dark:text-emerald-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>
        )}

        {/* Push Notification Button (shown in header only if not yet active) */}
        {!hasNotificationActive && onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            aria-label="Pengaturan Push Notifikasi"
            title="Pengaturan Push Notifikasi & Pengingat"
            className="relative w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Bell className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          </button>
        )}

        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#191A1E] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-stone-700" />
          )}
        </button>

        <PWAInstallButton />

        {/* Live Clock strictly synchronized to WIB with Date above it */}
        <div className="text-right pl-1 flex flex-col items-end justify-center">
          <span className="text-[10px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 leading-tight block mb-0.5 whitespace-nowrap">
            {wibInfo.formattedDate}
          </span>
          <div className="font-mono text-base sm:text-2xl lg:text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums leading-none tracking-tight">
            {wibInfo.timeStr} <span className="text-[10px] sm:text-xs md:text-sm font-sans font-medium text-stone-500 dark:text-stone-400">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
