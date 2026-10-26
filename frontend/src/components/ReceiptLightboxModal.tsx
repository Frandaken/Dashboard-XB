import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Download,
  Receipt,
  FileText,
  AlertCircle
} from 'lucide-react';
import { parseReceiptUrl } from '../utils/receiptUtils';

export interface ReceiptLightboxData {
  title: string;
  subtitle?: string;
  url: string;
  originalLink?: string;
}

interface ReceiptLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptLightboxData | null;
}

export const ReceiptLightboxModal: React.FC<ReceiptLightboxModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setImgError(false);
    }
  }, [isOpen, data?.url]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const parsed = parseReceiptUrl(data.url);
  const targetUrl = parsed?.previewUrl || data.url;
  const directLink = data.originalLink || parsed?.originalUrl || data.url;
  const isPdf = parsed?.type === 'pdf';
  const isLinkOnly = parsed?.type === 'link';

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#141518] border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div className="px-4 py-3 bg-[#18191C] border-b border-stone-800 flex items-center justify-between gap-3 flex-shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="receipt-modal-title" className="text-sm font-bold text-white truncate">
                {data.title}
              </h3>
              {data.subtitle && (
                <p className="text-xs text-stone-400 truncate">{data.subtitle}</p>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isPdf && !isLinkOnly && !imgError && (
              <>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Perkecil (-)"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Perbesar (+)"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Putar 90°"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {(scale !== 1 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 hover:text-white transition"
                  >
                    Reset
                  </button>
                )}
                <div className="h-4 w-px bg-stone-800 mx-1 hidden sm:block" />
              </>
            )}

            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di Tab Baru"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition flex items-center gap-1 text-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Buka</span>
            </a>

            {!isLinkOnly && (
              <a
                href={targetUrl}
                download={`bukti_${data.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                title="Unduh File"
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWER AREA */}
        <div className="flex-1 relative overflow-auto bg-[#0d0e10] flex items-center justify-center p-3 sm:p-6 select-none">
          {isPdf ? (
            <iframe
              src={targetUrl}
              title={data.title}
              className="w-full h-full rounded-lg border border-stone-800 bg-white"
            />
          ) : isLinkOnly ? (
            <div className="text-center p-8 max-w-md bg-stone-900/80 rounded-2xl border border-stone-800">
              <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base mb-1">Tautan Bukti Eksternal</h4>
              <p className="text-xs text-stone-400 mb-4">
                Bukti transaksi ini tersimpan dalam bentuk tautan luar (Google Drive atau dokumen cloud).
              </p>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Bukti di Google Drive
              </a>
            </div>
          ) : imgError ? (
            <div className="text-center p-8 max-w-md bg-stone-900/80 rounded-2xl border border-stone-800">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base mb-1">Gagal Memuat Pratinjau Foto</h4>
              <p className="text-xs text-stone-400 mb-4">
                Gambar bukti mungkin memiliki izin akses pribadi di Google Drive atau format tidak didukung browser.
              </p>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-semibold transition"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Tautan Asli
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={targetUrl}
                alt={data.title}
                onError={() => setImgError(true)}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-full max-w-full object-contain rounded shadow-2xl origin-center"
              />
            </div>
          )}
        </div>

        {/* BOTTOM CAPTION */}
        <div className="px-4 py-2.5 bg-[#18191C] border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 flex-shrink-0">
          <div className="flex items-center gap-2 truncate">
            {parsed?.isDrive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
                Google Drive
              </span>
            )}
            {targetUrl.startsWith('/api/uploads') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                Docker Volume
              </span>
            )}
            <span className="truncate">{targetUrl}</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-stone-500">
            Esc untuk menutup
          </span>
        </div>
      </div>
    </div>
  );
};
