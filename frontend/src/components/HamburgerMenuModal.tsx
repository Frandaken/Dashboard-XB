import React, { useEffect, useState } from 'react';
import { X, Music, ShieldCheck, ChevronRight, RotateCw, Sparkles, Users, PartyPopper, Bell, Wallet, Sun, Moon, ClipboardList, Check, Settings } from 'lucide-react';

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSongLyrics: () => void;
  onOpenRandomPicker: () => void;
  onOpenGroupGenerator: () => void;
  onOpenIceBreaking?: () => void;
  onOpenNotifications?: () => void;
  hasNotificationActive?: boolean;
  onOpenKasMurid?: () => void;
  onJumpToToday?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenWeeklyExport?: () => void;
  onOpenSiswa?: () => void;
  onOpenSettings?: () => void;
}

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenSongLyrics,
  onOpenRandomPicker,
  onOpenGroupGenerator,
  onOpenIceBreaking,
  onOpenNotifications,
  hasNotificationActive,
  onOpenKasMurid,
  darkMode,
  onToggleDarkMode,
  onOpenWeeklyExport,
  onOpenSiswa,
  onOpenSettings
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
      <div className="bg-[#F8F9FA] dark:bg-[#111215] text-[#191B1F] dark:text-[#F1F3F5] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt="Logo Kelas XB"
              className="w-8 h-8 rounded-lg object-cover border border-stone-200/80 dark:border-stone-800/80"
            />
            <div>
              <h2
                id="menu-modal-title"
                className="font-editorial font-medium text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight"
              >
                Menu Navigasi &amp; Alat
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                SMA Putra Nirmala • Kelas XB
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
                className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                aria-label="Pengaturan Aplikasi"
                title="Buka Pengaturan & Ekspor"
                className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                <Settings className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              </button>
            )}

            {/* Tombol kecil notifikasi di atas jika notifikasi sudah aktif */}
            {hasNotificationActive && (onOpenSettings || onOpenNotifications) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSettings) onOpenSettings();
                  else if (onOpenNotifications) onOpenNotifications();
                }}
                aria-label="Pengaturan Push Notifikasi (Aktif)"
                title="Pengaturan Push Notifikasi (Aktif)"
                className="relative w-9 h-9 rounded-lg border border-emerald-600/20 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-[#13281E] hover:bg-emerald-100/70 dark:hover:bg-[#1A382B] flex items-center justify-center text-emerald-800 dark:text-emerald-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                <Bell className="w-4 h-4 text-emerald-700 dark:text-[#34D399]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Tutup Menu Navigasi"
              className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0">
          {/* Action: Buku Kas & Penunggakan Murid */}
          {onOpenKasMurid && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenKasMurid();
              }}
              className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Buku Kas Murid
                    </span>
                    <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded-md border border-emerald-600/20 dark:border-emerald-500/20">
                      Iuran &amp; Saldo
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                    Data penunggakan iuran Rp 3.000/minggu, pengeluaran, saldo kas, &amp; rekap siswa.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          )}

          {/* Action: Daftar Siswa Kelas XB */}
          {onOpenSiswa && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSiswa();
              }}
              className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-teal-600/40 dark:hover:border-teal-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-[#0D2420] text-teal-800 dark:text-teal-300 border border-teal-600/20 dark:border-teal-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Daftar Siswa (Siswa)
                    </span>
                    <span className="text-[11px] font-semibold text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-[#0D2420] px-2 py-0.5 rounded-md border border-teal-600/20 dark:border-teal-500/20">
                      33 Siswa
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                    Daftar lengkap 33 siswa Kelas XB, nomor absen, panggilan, dan jadwal piket.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          )}

          {/* Action 1: Random Name Picker (Wheel of Names) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRandomPicker();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-amber-400/50 dark:hover:border-amber-600/50 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#20170A] text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Random Name Picker
                  </span>
                  <span className="text-[11px] font-medium text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-[#20170A] px-2 py-0.5 rounded-md border border-amber-300/40 dark:border-amber-800/40">
                    Wheel of Names
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                  Putar roda acak untuk memilih satu siswa untuk tanya jawab, kuis, atau giliran tugas.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </button>

          {/* Action 2: Random Group Name Picker (Team Generator) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGroupGenerator();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-blue-400/50 dark:hover:border-blue-600/50 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#0D1D2E] text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Random Group Picker
                  </span>
                  <span className="text-[11px] font-medium text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-[#0D1D2E] px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/60">
                    Team Generator
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                  Bagi siswa ke kelompok seimbang dengan opsi gender rata, perwakilan, dan ekspor CSV.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </button>

          {/* Action 3: Koleksi Lagu Wajib */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSongLyrics();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Koleksi Lagu Wajib Nasional
                  </span>
                  <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded-md border border-emerald-600/20 dark:border-emerald-500/20">
                    Buka Lirik
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                  Daftar lengkap lirik lagu wajib nasional per minggu semester aktif.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </button>

          {/* Action 4: Petugas Ice Breaking */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenIceBreaking) onOpenIceBreaking();
            }}
            className="w-full text-left p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PartyPopper className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Petugas Ice Breaking
                  </span>
                  <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded-md border border-emerald-600/20 dark:border-emerald-500/20">
                    Jadwal Lengkap
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5">
                  Lihat jadwal giliran ice breaking kelas pada jam pertama Sosiologi &amp; Geografi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </button>

          {/* Action 6: Sinkronisasi Otomatis (Klik untuk Refresh Halaman & Data) */}
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
            className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] hover:bg-stone-100 dark:hover:bg-[#1C1E23] transition-colors cursor-pointer group flex items-start justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-100/70 dark:bg-[#122A1E] text-emerald-800 dark:text-[#34D399] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                    Sinkronisasi Otomatis
                  </span>
                  <span className="text-[10px] font-medium text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded border border-emerald-600/20 dark:border-emerald-500/30">
                    Klik untuk Refresh
                  </span>
                </div>
                <p className="text-stone-500 dark:text-stone-400 font-normal leading-relaxed">
                  Jadwal pelajaran, penugasan, petugas MBG, doa, dan piket diperbarui otomatis dari Google Calendar &amp; Google Sheets resmi kelas XB SMA Putra Nirmala.
                </p>
              </div>
            </div>
            <RotateCw className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">
            SMA Putra Nirmala • Kelas XB
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-[#141518] hover:bg-stone-200 dark:hover:bg-[#202227] text-stone-700 dark:text-stone-300 text-xs font-medium transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
