import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getWIBDateParts, WIBDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
  onOpenNotifications,
  hasNotificationActive
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
      className="flex items-center justify-between border-b border-[#D8D2C5] dark:border-[#222222] pb-2.5 flex-shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
          className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#0E0E0E] hover:bg-[#FAF7F2] dark:hover:bg-[#1A1A1A] flex items-center justify-center text-stone-800 dark:text-stone-100 transition cursor-pointer shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
        >
          <Menu className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399] group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/icon.png"
            alt="Logo SMA Putra Nirmala Kelas XB"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shadow-xs object-cover flex-shrink-0 border border-[#D8D2C5] dark:border-[#262626]"
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
              <h1 className="font-display font-bold text-base sm:text-xl lg:text-2xl text-stone-900 dark:text-white tracking-tight leading-none">
                Jadwal Kelas XB
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 leading-none flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                SMA Putra Nirmala
              </span>
              <span className="text-stone-400 dark:text-stone-600 hidden xs:inline">•</span>
              <span className="font-medium text-stone-600 dark:text-stone-400 hidden xs:inline">{wibInfo.formattedDate}</span>
              <span className="font-medium text-stone-500 dark:text-stone-400 xs:hidden block w-full text-[10px] mt-0.5">{wibInfo.formattedDate}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Push Notification Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            aria-label="Pengaturan Push Notifikasi"
            title="Pengaturan Push Notifikasi & Pengingat"
            className="relative w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#0E0E0E] hover:bg-stone-100 dark:hover:bg-[#1A1A1A] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <Bell className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399]" />
            {hasNotificationActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
            )}
          </button>
        )}

        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap (OLED Black)'}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap (OLED Black)'}
          className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#0E0E0E] hover:bg-stone-100 dark:hover:bg-[#1A1A1A] flex items-center justify-center text-stone-700 dark:text-amber-300 transition cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
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
