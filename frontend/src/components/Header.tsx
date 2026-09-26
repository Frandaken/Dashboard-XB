import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
  const [timeStr, setTimeStr] = useState<string>(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="classroom-header"
      className="flex items-center justify-between border-b border-[#E4DDCE] dark:border-[#2D333B] pb-2 flex-shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka Menu Fitur"
          title="Buka Menu & Modul Fitur"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#1E2228] hover:bg-[#FAF6EE] dark:hover:bg-[#2A313C] text-stone-700 dark:text-stone-200 transition cursor-pointer shadow-2xs group"
        >
          <Menu className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399] group-hover:scale-105 transition-transform" />
          <span className="hidden sm:inline text-xs font-medium">
            Menu
          </span>
        </button>

        <div>
          <h1 className="font-display font-semibold text-lg sm:text-xl lg:text-2xl text-[#2B2A28] dark:text-white tracking-tight leading-none">
            Jadwal Kelas XB
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
          className="w-8 h-8 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#1E2228] hover:bg-stone-50 dark:hover:bg-[#2A313C] flex items-center justify-center text-stone-600 dark:text-amber-300 transition cursor-pointer shadow-2xs"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600" />
          )}
        </button>

        <PWAInstallButton />

        {/* Live Clock with balanced typographic weight */}
        <div className="text-right pl-1">
          <div className="font-display text-lg sm:text-xl lg:text-2xl font-semibold text-[#2B2A28] dark:text-white tabular-nums leading-none tracking-tight">
            {timeStr} <span className="text-xs font-sans font-normal text-stone-500 dark:text-stone-400">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
