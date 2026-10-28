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
  AlertCircle,
  Upload,
  RefreshCw
} from 'lucide-react';
import { parseReceiptUrl } from '../utils/receiptUtils';

export interface ReceiptLightboxData {
  id?: string;
  title: string;
  subtitle?: string;
  url: string;
  originalLink?: string;
}

interface ReceiptLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptLightboxData | null;
  onReupload?: (data: ReceiptLightboxData) => void;
  darkMode?: boolean;
}

export const ReceiptLightboxModal: React.FC<ReceiptLightboxModalProps> = ({
  isOpen,
  onClose,
  data,
  onReupload,
  darkMode
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imgError, setImgError] = useState<boolean>(false);
  const [notFoundError, setNotFoundError] = useState<boolean>(false);
  const [isCheckingFile, setIsCheckingFile] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && data?.url) {
      setScale(1);
      setRotation(0);
      setImgError(false);
      setNotFoundError(false);

      const isLocalUpload = data.url.startsWith('/api/uploads/') || data.url.startsWith('/uploads/');
      if (isLocalUpload) {
        setIsCheckingFile(true);
        fetch(data.url, { method: 'HEAD' })
          .then(res => {
            if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
              setNotFoundError(true);
            }
          })
          .catch(() => {
            setNotFoundError(true);
          })
          .finally(() => {
            setIsCheckingFile(false);
          });
      }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 dark:bg-black/85 backdrop-blur-md animate-fade-in text-stone-900 dark:text-white"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-white dark:bg-[#141518] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div className="px-4 py-3 bg-stone-50/90 dark:bg-[#18191C] border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 flex-shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-600/25 dark:border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="receipt-modal-title" className="text-sm font-bold text-stone-900 dark:text-white truncate">
                {data.title}
              </h3>
              {data.subtitle && (
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{data.subtitle}</p>
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
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Perbesar (+)"
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Putar 90°"
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {(scale !== 1 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[11px] font-semibold text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 hidden sm:block" />
              </>
            )}

            {onReupload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReupload(data);
                }}
                title="Unggah Ulang Bukti"
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition flex items-center gap-1 text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Ganti</span>
              </button>
            )}

            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di Tab Baru"
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition flex items-center gap-1 text-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Buka</span>
            </a>

            {!isLinkOnly && !notFoundError && (
              <a
                href={targetUrl}
                download={`lampiran_${data.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                title="Unduh File"
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-stone-800 dark:hover:bg-rose-950/60 text-stone-600 dark:text-stone-300 dark:hover:text-rose-200 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWER AREA */}
        <div className="flex-1 relative overflow-auto bg-stone-100/70 dark:bg-[#0d0e10] flex items-center justify-center p-3 sm:p-6 select-none">
          {notFoundError ? (
            <div className="text-center p-6 sm:p-8 max-w-md bg-white dark:bg-stone-900/90 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-2xl animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-stone-900 dark:text-white text-base mb-1.5">Berkas Tidak Ditemukan (404)</h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                Berkas fisik belum ada di server atau telah terhapus saat refresh sistem. Silakan periksa kembali tautan berkas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                {onReupload && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReupload(data);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Unggah Ulang Bukti
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : isCheckingFile ? (
            <div className="text-center p-8 text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium">Memeriksa ketersediaan berkas...</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={targetUrl}
              title={data.title}
              onError={() => setNotFoundError(true)}
              className="w-full h-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white"
            />
          ) : isLinkOnly ? (
            <div className="text-center p-8 max-w-md bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl">
              <FileText className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-stone-900 dark:text-white text-base mb-1">Tautan Berkas Eksternal</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Berkas ini tersimpan dalam bentuk tautan luar (Google Drive atau dokumen cloud).
              </p>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Berkas di Google Drive
              </a>
            </div>
          ) : imgError ? (
            <div className="text-center p-8 max-w-md bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h4 className="font-bold text-stone-900 dark:text-white text-base mb-1">Gagal Memuat Pratinjau Foto</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Gambar mungkin memiliki izin akses pribadi di Google Drive atau format tidak didukung browser langsung.
              </p>
              <div className="flex items-center justify-center gap-2">
                {onReupload && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReupload(data);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Unggah Ulang
                  </button>
                )}
                <a
                  href={directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Tautan Asli
                </a>
              </div>
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
                className="max-h-full max-w-full object-contain rounded shadow-lg origin-center"
              />
            </div>
          )}
        </div>

        {/* BOTTOM CAPTION */}
        <div className="px-4 py-2.5 bg-stone-50/90 dark:bg-[#18191C] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-end text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
            Esc untuk menutup
          </span>
        </div>
      </div>
    </div>
  );
};
