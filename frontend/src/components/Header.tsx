import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, Wallet } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getWIBDateParts, WIBDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
  onOpenKasMurid?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
  onOpenNotifications,
  hasNotificationActive,
  onOpenKasMurid
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
                Jadwal Kelas XB
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-none flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                SMA Putra Nirmala
              </span>
              <span className="text-stone-300 dark:text-stone-700 hidden xs:inline">•</span>
              <span className="text-stone-500 dark:text-stone-400 hidden xs:inline">{wibInfo.formattedDate}</span>
              <span className="text-stone-500 dark:text-stone-400 xs:hidden block w-full text-xs mt-0.5">{wibInfo.formattedDate}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Kas Murid Quick-Access Button */}
        {onOpenKasMurid && (
          <button
            onClick={onOpenKasMurid}
            aria-label="Buka Buku Kas Murid"
            title="Buku Kas & Penunggakan Murid Kelas XB"
            className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg border border-emerald-600/20 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-[#13281E] hover:bg-emerald-100/60 dark:hover:bg-[#1A382B] text-emerald-900 dark:text-emerald-300 transition cursor-pointer font-medium text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden md:inline">Kas Murid</span>
          </button>
        )}
        {/* Push Notification Button (shown in header only if not yet active; when active, moved to hamburger menu as small button) */}
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

        {/* Live Clock strictly synchronized to WIB */}
        <div className="text-right pl-1">
          <div className="font-mono text-lg sm:text-2xl lg:text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums leading-none tracking-tight">
            {wibInfo.timeStr} <span className="text-xs sm:text-sm font-sans font-medium text-stone-500 dark:text-stone-400">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
