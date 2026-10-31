import React, { useEffect } from 'react';
import {
  X,
  Settings,
  ClipboardList,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  RotateCw,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Share2
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWeeklyExport: () => void;
  onOpenNotifications: () => void;
  onBackToMenu?: () => void;
  hasNotificationActive?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenWeeklyExport,
  onOpenNotifications,
  onBackToMenu,
  hasNotificationActive,
  darkMode,
  onToggleDarkMode,
  onRefreshData,
  isRefreshing
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
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F8F9FA] dark:bg-[#111215] text-[#191B1F] dark:text-[#F1F3F5] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex-shrink-0">
          <div className="flex items-center gap-3">
            {onBackToMenu && (
              <button
                type="button"
                onClick={onBackToMenu}
                aria-label="Kembali ke Menu Utama"
                title="Kembali ke Menu Navigasi"
                className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#202227] hover:bg-stone-100 dark:hover:bg-[#282B32] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-[#202227] text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-editorial font-medium text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight"
              >
                Pengaturan &amp; Ekspor
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                Setelan notifikasi, ekspor agenda, &amp; preferensi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Tutup Pengaturan"
              className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
          {/* Section 1: Ekspor Agenda */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-1">
              Ekspor &amp; Berbagi Agenda
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWeeklyExport();
              }}
              className="w-full text-left p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5 text-emerald-700 dark:text-[#34D399]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Ekspor Agenda Mingguan
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded border border-emerald-600/20 dark:border-emerald-500/30">
                      WhatsApp Live Preview
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-1 leading-relaxed">
                    Kustomisasi rentang tanggal, minggu ke berapa, mata pelajaran, serta tugas untuk disalin ke format WhatsApp rapi.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-[#34D399] transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          </div>

          {/* Section 2: Notifikasi & Pengingat */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-1">
              Notifikasi &amp; Pengingat
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNotifications();
              }}
              className="w-full text-left p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-[#22180A] text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Setelan Push Notifikasi
                    </span>
                    {hasNotificationActive ? (
                      <span className="text-[10px] font-semibold text-emerald-800 dark:text-[#34D399] bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded border border-emerald-600/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-[#202227] px-2 py-0.5 rounded border border-stone-200/60 dark:border-stone-800/60">
                        Belum Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-1 leading-relaxed">
                    Pengingat rutin H-1 pukul 19.00 WIB untuk jadwal esok hari, tugas &amp; sumatif, serta alert 5 menit sebelum jam pelajaran.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          </div>

          {/* Section 3: Tampilan Antarmuka */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-1">
              Preferensi Tampilan
            </h3>
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-[#202227] text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-center flex-shrink-0">
                  {darkMode ? <Moon className="w-5 h-5 text-amber-300" /> : <Sun className="w-5 h-5 text-stone-700" />}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">
                    Mode Tema Tampilan
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                    {darkMode ? 'Mode Gelap (OLED Deep Charcoal) aktif' : 'Mode Terang (Clean Light) aktif'}
                  </p>
                </div>
              </div>

              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#222429] hover:bg-stone-100 dark:hover:bg-[#2A2D33] text-stone-800 dark:text-stone-200 transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{darkMode ? 'Ganti ke Terang' : 'Ganti ke Gelap'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Data & Sinkronisasi */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-1">
              Data &amp; Sinkronisasi
            </h3>
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-[#34D399]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">
                    Data Google Sheets &amp; iCal
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                    Disinkronkan otomatis dari kalender dan database resmi kelas XB SMA Putra Nirmala.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onRefreshData) {
                    onRefreshData();
                  } else {
                    window.location.reload();
                  }
                }}
                disabled={isRefreshing}
                aria-label="Refresh Data Sekarang"
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-600/20 dark:border-emerald-500/30 bg-emerald-50 dark:bg-[#13281E] hover:bg-emerald-100 dark:hover:bg-[#1C3A2C] text-emerald-800 dark:text-emerald-300 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
          <span>SMA Putra Nirmala • Kelas XB</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-[#202227] hover:bg-stone-200 dark:hover:bg-[#282B32] text-stone-700 dark:text-stone-300 text-xs font-medium transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
