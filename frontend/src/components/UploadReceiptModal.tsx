import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  HardDrive
} from 'lucide-react';
import { extractDriveFileId, parseReceiptUrl } from '../utils/receiptUtils';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    title: string;
    currentUrl?: string;
  } | null;
  onSuccess: (id: string, newUrl: string) => void;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  isOpen,
  onClose,
  target,
  onSuccess
}) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [linkInput, setLinkInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !target) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 20MB');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    // Read preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'upload' && !selectedFile) {
      setErrorMessage('Pilih file bukti terlebih dahulu');
      return;
    }

    if (mode === 'link' && !linkInput.trim()) {
      setErrorMessage('Masukkan URL link bukti (Google Drive atau web)');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload: any = {
        pengeluaranId: target.id
      };

      if (mode === 'upload' && selectedFile) {
        payload = {
          ...payload,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          base64Data: previewDataUrl
        };
      } else {
        payload = {
          ...payload,
          linkUrl: linkInput.trim()
        };
      }

      const res = await fetch('/api/kas/upload-bukti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal menyimpan bukti');
      }

      onSuccess(target.id, json.url);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengunggah bukti');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedLinkPreview = mode === 'link' && linkInput.trim() ? parseReceiptUrl(linkInput.trim()) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-stone-900 dark:text-stone-100"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#18191C] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#122A1E] text-emerald-700 dark:text-emerald-400 border border-emerald-600/25 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 id="upload-modal-title" className="text-sm font-bold text-stone-900 dark:text-white">
                Unggah Bukti Pengeluaran
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-[280px]">
                {target.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE TABS */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-[#141518]/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'upload'
                ? 'bg-white dark:bg-[#1F2024] text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Unggah File / Foto
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'link'
                ? 'bg-white dark:bg-[#1F2024] text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Tautan Google Drive
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'upload' ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewDataUrl ? (
                <div className="relative rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-900/50 max-h-56 flex items-center justify-center group">
                  {selectedFile?.type === 'application/pdf' ? (
                    <div className="p-6 text-center text-white">
                      <FileText className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                      <p className="text-xs font-bold truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">Dokumen PDF terpilih</p>
                    </div>
                  ) : (
                    <img
                      src={previewDataUrl}
                      alt="Pratinjau Nota"
                      className="max-h-56 w-auto object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewDataUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg text-xs transition"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-stone-50/50 dark:bg-[#141518]/40"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                    Ambil Foto atau Pilih Gambar
                  </h4>
                  <p className="text-xs text-stone-500 mb-2">
                    Mendukung JPG, PNG, WEBP, atau file PDF (Maks. 20MB)
                  </p>
                  <span className="inline-block px-3 py-1 bg-white dark:bg-[#1E1F23] border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Jelajahi File
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>File tersimpan langsung ke Docker Volume passthrough (<code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-[10px]">/app/data/uploads</code>).</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Link Berbagi Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141518] text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {parsedLinkPreview && (
                <div className="p-3 bg-stone-50 dark:bg-[#141518] border border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Link Google Drive valid terdeteksi</span>
                  </div>
                  {parsedLinkPreview.isDrive && (
                    <div className="flex items-center gap-2">
                      <img
                        src={parsedLinkPreview.previewUrl}
                        alt="Drive thumbnail"
                        className="w-16 h-16 object-cover rounded-lg border border-stone-300 dark:border-stone-700"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="text-[11px] text-stone-500">
                        <p>ID File: <span className="font-mono text-stone-700 dark:text-stone-300">{parsedLinkPreview.driveFileId}</span></p>
                        <p className="mt-0.5 text-stone-400">Pastikan izin akses file di Google Drive diatur ke "Siapa saja yang memiliki link".</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-stone-500 leading-relaxed">
                💡 <span className="font-semibold">Tips:</span> Anda juga bisa langsung menaruh link ini di kolom ke-7 (<span className="font-semibold">Bukti</span>) pada Google Sheets lembar Pengeluaran agar otomatis sinkron saat ditarik.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Bukti
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
