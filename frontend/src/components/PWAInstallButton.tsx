import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3F6E52] text-white text-xs font-semibold shadow-xs hover:bg-[#325841] transition-colors cursor-pointer"
        title="Pasang aplikasi di layar utama perangkat Anda"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3F6E52]/10 border border-[#3F6E52]/30 text-[#3F6E52] text-xs font-semibold hover:bg-[#3F6E52]/20 transition-colors cursor-pointer"
          title="Pasang aplikasi di iOS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FAF8F5] border border-[#E4DDCE] p-5 shadow-xl text-stone-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4DDCE]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#3F6E52] text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#2B2A28]">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs text-stone-600 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] font-bold text-[11px] text-[#2B2A28] flex items-center justify-center">1</span>
                  <span>Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah Safari browser.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] font-bold text-[11px] text-[#2B2A28] flex items-center justify-center">2</span>
                  <span>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E4DDCE] font-bold text-[11px] text-[#2B2A28] flex items-center justify-center">3</span>
                  <span>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas untuk menyelesaikan.</span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#3F6E52] py-2 text-xs font-semibold text-white hover:bg-[#325841] transition shadow-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
