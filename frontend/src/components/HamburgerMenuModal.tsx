import React, { useState, useEffect } from 'react';
import { X, Plus, Music, Sparkles, FolderPlus, Layers, ExternalLink, Trash2 } from 'lucide-react';

interface FeatureSlot {
  id: string;
  title: string;
  description: string;
  isBuiltIn?: boolean;
}

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSongLyrics: () => void;
}

const DEFAULT_SLOTS: FeatureSlot[] = [
  {
    id: 'songs',
    title: 'Koleksi Lagu Wajib Nasional',
    description: 'Daftar dan lirik lagu wajib nasional yang diputar saat apel pagi kelas.',
    isBuiltIn: true
  },
  {
    id: 'announcements',
    title: 'Pengumuman & Mading Kelas',
    description: 'Slot kosong untuk mempublikasikan pengumuman penting wali kelas atau ketua kelas.'
  },
  {
    id: 'exams',
    title: 'Jadwal Penilaian & Ujian',
    description: 'Slot kosong untuk agenda Penilaian Harian, STS, dan SAS semester aktif.'
  },
  {
    id: 'structure',
    title: 'Struktur Organisasi & Denah Duduk',
    description: 'Slot kosong untuk bagan kepengurusan kelas XB dan denah posisi tempat duduk.'
  },
  {
    id: 'finance',
    title: 'Kas & Perlengkapan Kelas',
    description: 'Slot kosong untuk rekapitulasi uang kas kelas dan daftar inventaris barang.'
  }
];

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenSongLyrics
}) => {
  const [slots, setSlots] = useState<FeatureSlot[]>(() => {
    try {
      const saved = localStorage.getItem('class_feature_slots');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Gagal membaca custom slots:', e);
    }
    return DEFAULT_SLOTS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<FeatureSlot | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('class_feature_slots', JSON.stringify(slots));
    } catch (e) {
      console.warn('Gagal menyimpan slots:', e);
    }
  }, [slots]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSlot) {
          setSelectedSlot(null);
        } else if (isAdding) {
          setIsAdding(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedSlot, isAdding]);

  if (!isOpen) return null;

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newSlot: FeatureSlot = {
      id: `slot_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Slot kosong siap diintegrasikan dengan fitur atau data baru.'
    };
    setSlots(prev => [...prev, newSlot]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleDeleteSlot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots(prev => prev.filter(s => s.id !== id));
    if (selectedSlot?.id === id) setSelectedSlot(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF6EE] dark:bg-[#181B20] text-[#2B2A28] dark:text-[#E6EDF3] rounded-2xl border border-[#E4DDCE] dark:border-[#2D333B] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base sm:text-lg text-[#2B2A28] dark:text-white leading-tight">
                Menu & Modul Fitur
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                Pusat navigasi dan slot modul penambahan fitur baru kelas XB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Menu"
            className="w-8 h-8 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-100 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-500 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0">
          {/* Action to trigger add new slot */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Daftar Opsi Fitur ({slots.length})
            </span>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] text-xs font-medium hover:bg-[#203a2a] dark:hover:bg-[#2EB882] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Opsi Fitur</span>
            </button>
          </div>

          {/* Form to add new slot */}
          {isAdding && (
            <form onSubmit={handleAddSlot} className="bg-white dark:bg-[#1E2228] p-4 rounded-xl border border-[#C6DEC0] dark:border-[#2D5A3C] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2C4E3A] dark:text-[#6EE7B7] flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  Tambah Opsi Kosong Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-normal"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                  Nama Fitur / Modul:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Denah Tempat Duduk, Buku Kas..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4DDCE] dark:border-[#2D333B] bg-[#FAF6EE] dark:bg-[#14161A] text-xs font-normal text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2C4E3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                  Keterangan / Rencana Fitur:
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang apa yang akan diisi pada fitur ini..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4DDCE] dark:border-[#2D333B] bg-[#FAF6EE] dark:bg-[#14161A] text-xs font-normal text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2C4E3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg border border-[#E4DDCE] dark:border-[#2D333B] text-xs font-normal text-stone-600 dark:text-stone-300 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A] text-xs font-medium hover:bg-[#203a2a]"
                >
                  Simpan Opsi
                </button>
              </div>
            </form>
          )}

          {/* List of slots */}
          <div className="space-y-2">
            {slots.map(slot => {
              const isSongSlot = slot.id === 'songs';

              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    if (isSongSlot) {
                      onClose();
                      onOpenSongLyrics();
                    } else {
                      setSelectedSlot(slot);
                    }
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSongSlot
                      ? 'bg-white dark:bg-[#1E2228] border-[#C6DEC0] dark:border-[#2B5E3C] hover:border-[#2C4E3A] shadow-2xs'
                      : 'bg-white dark:bg-[#1E2228] border-[#E4DDCE] dark:border-[#2D333B] hover:border-stone-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSongSlot
                          ? 'bg-[#EBF3EE] dark:bg-[#1A3324] text-[#2C4E3A] dark:text-[#34D399]'
                          : 'bg-stone-100 dark:bg-[#252B33] text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {isSongSlot ? <Music className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {slot.title}
                        </span>
                        {isSongSlot ? (
                          <span className="text-[10px] font-medium text-[#2C4E3A] dark:text-[#6EE7B7] bg-[#EBF3EE] dark:bg-[#1B3626] px-2 py-0.5 rounded-full border border-[#C6DEC0] dark:border-[#2D5A3C]">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-[#252B33] px-2 py-0.5 rounded border border-[#E4DDCE]/60 dark:border-[#38414D]">
                            Slot Kosong
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal line-clamp-1 mt-0.5">
                        {slot.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSongSlot ? (
                      <span className="text-xs font-medium text-[#2C4E3A] dark:text-[#34D399] flex items-center gap-1">
                        <span>Buka</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <>
                        {!slot.isBuiltIn && (
                          <button
                            type="button"
                            onClick={e => handleDeleteSlot(slot.id, e)}
                            title="Hapus slot ini"
                            className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-xs font-medium text-stone-400 hover:text-stone-600">
                          Detail
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Dialog if an empty slot is clicked */}
        {selectedSlot && (
          <div className="px-5 py-3 border-t border-[#E4DDCE] dark:border-[#2D333B] bg-[#FAF6EE] dark:bg-[#16181D] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Detail Modul: {selectedSlot.title}
              </span>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-stone-400 hover:text-stone-600 text-xs font-normal"
              >
                Tutup Detail
              </button>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
              {selectedSlot.description}
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-[#163523] border border-emerald-200 dark:border-[#2D6643] text-emerald-900 dark:text-[#A7F3D0] text-[11px] font-normal">
              💡 Slot ini disiapkan sebagai wadah kosong. Anda dapat meminta penambahan fungsionalitas (misalnya integrasi spreadsheet, form data, atau tampilan khusus) kapan saja untuk modul ini.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
            Gunakan tombol menu ini untuk mengakses dan memperluas modul kelas.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-100 dark:bg-[#252B33] hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-medium transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
