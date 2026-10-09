import React, { useEffect, useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  PartyPopper,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  darkMode
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    sendTestNotification,
    updatePreferences
  } = usePushNotifications();

  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSubscribe = async () => {
    if (permission === 'granted' && isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleSendTest = async () => {
    const ok = await sendTestNotification();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-black text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#222222] shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Bell className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399]" />
            </div>
            <div>
              <h2
                id="push-modal-title"
                className="font-display font-bold text-base sm:text-lg text-[#1C1917] dark:text-white leading-tight"
              >
                Push Notifikasi Kelas XB
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                SMA Putra Nirmala • Pengingat piket, MBG, & ice breaking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Pengaturan Notifikasi"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] flex items-start justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                  Status Izin
                </span>
                {isGranted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aktif
                  </span>
                ) : isDenied ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-[#250808] text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-[#521313]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Diblokir Browser
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-[#261B06] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-[#523A0F]">
                    <BellOff className="w-3.5 h-3.5" />
                    Belum Diaktifkan
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isGranted
                  ? 'Perangkat ini siap menerima pengingat otomatis dari dashboard Kelas XB SMA Putra Nirmala.'
                  : isDenied
                  ? 'Izin notifikasi diblokir oleh browser. Buka setelan izin situs browser untuk mengizinkan.'
                  : 'Aktifkan untuk menerima pemberitahuan tepat waktu saat giliran tugas piket dan ice breaking.'}
              </p>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#1E0B0B] border border-rose-200 dark:border-[#4B1414] text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isGranted ? (
              <button
                type="button"
                onClick={handleToggleSubscribe}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2C4E3A] hover:bg-[#233F2E] active:scale-[0.99] text-white text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Meminta Izin Browser...
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    Aktifkan Push Notifikasi Sekarang
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#DCFCE7] dark:bg-[#071F14] hover:bg-[#BBF7D0] dark:hover:bg-[#0D3823] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B] text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {testSent ? 'Notifikasi Terkirim! ✨' : 'Uji Coba Notifikasi'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-rose-50 dark:hover:bg-[#1F0A0A] hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-300 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  Nonaktifkan Notifikasi
                </button>
              </div>
            )}
          </div>

          {/* Preferences Checklist */}
          <div className="p-4 rounded-xl border border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0D0D0D] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Pilihan Pengingat
            </h3>

            <div className="space-y-2.5">
              {/* Option 1: Piket & MBG */}
              <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#161616] cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={preferences.piketMbg}
                  onChange={e => updatePreferences({ piketMbg: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#2C4E3A] border-stone-300 focus:ring-[#2C4E3A]"
                />
                <div className="text-xs min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Petugas Piket & MBG Hari Ini
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                    Pemberitahuan giliran piket kebersihan kelas dan pembagian Makan Bergizi Gratis harian.
                  </p>
                </div>
              </label>

              {/* Option 2: Ice Breaking */}
              <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#161616] cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={preferences.iceBreaking}
                  onChange={e => updatePreferences({ iceBreaking: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#2C4E3A] border-stone-300 focus:ring-[#2C4E3A]"
                />
                <div className="text-xs min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                    <PartyPopper className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Petugas Ice Breaking
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                    Notifikasi saat giliran tugas ice breaking pada jam pertama mata pelajaran Sosiologi & Geografi.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Guide for iOS & Mobile */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#1F1707] border border-amber-200 dark:border-[#4B3710] text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Smartphone className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              Petunjuk di Perangkat Mobile
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <li>
                <strong>Android / Chrome / Windows / Mac:</strong> Notifikasi langsung tampil setelah tombol di atas diklik & diizinkan.
              </li>
              <li>
                <strong>iPhone & iPad (iOS 16.4+):</strong> Buka di Safari, ketuk tombol <strong>Bagikan (Share)</strong> lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>. Buka aplikasi dari layar utama untuk mengaktifkan notifikasi.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Web Push Notification Standar
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-[#161616] hover:bg-stone-200 dark:hover:bg-[#222222] text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
