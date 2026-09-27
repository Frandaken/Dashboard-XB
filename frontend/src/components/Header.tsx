import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getWIBDateParts, WIBDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenMenu
}) => {
  const [wibInfo, setWibInfo] = useState<WIBDateInfo>(() => getWIBDateParts());

  useEffect(() => {
    const updateTime = () => {
      setWibInfo(getWIBDateParts());
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="classroom-header"
      className="flex items-center justify-between border-b border-[#D8D2C5] dark:border-[#2E3744] pb-2.5 flex-shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#181C23] hover:bg-[#FAF7F2] dark:hover:bg-[#222935] text-stone-800 dark:text-stone-100 transition cursor-pointer shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
        >
          <Menu className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-xs font-bold">
            Menu
          </span>
        </button>

        <div>
          <h1 className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-stone-900 dark:text-white tracking-tight leading-none">
            Jadwal Kelas XB
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-stone-600 dark:text-stone-400 mt-1 leading-none">
            {wibInfo.formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#181C23] hover:bg-stone-100 dark:hover:bg-[#222935] flex items-center justify-center text-stone-700 dark:text-amber-300 transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-700" />
          )}
        </button>

        <PWAInstallButton />

        {/* Live Clock strictly synchronized to WIB */}
        <div className="text-right pl-1">
          <div className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-stone-900 dark:text-white tabular-nums leading-none tracking-tight">
            {wibInfo.timeStr} <span className="text-xs font-sans font-semibold text-stone-600 dark:text-stone-400">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
