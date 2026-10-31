import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Users,
  Copy,
  Check,
  Sun,
  Moon,
  CalendarDays,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Student, STUDENTS_DATA } from '../data/studentsData';
import { copyTextToClipboard } from '../utils/summaryFormatter';

interface SiswaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

// Map each student's absen to their piket day (from official class schedule)
const PIKET_SCHEDULE_MAP: Record<number, string> = {
  1: 'Senin',   // Alecha
  2: 'Jumat',   // Xander
  3: 'Jumat',   // Andre
  4: 'Senin',   // Ashley
  5: 'Selasa',  // Grace
  6: 'Rabu',    // Kekey
  7: 'Senin',   // Bintang
  8: 'Senin',   // Claudya
  9: 'Kamis',   // Devina
  10: 'Rabu',   // Dimas
  11: 'Kamis',  // Joel
  12: 'Selasa', // Evan
  13: 'Selasa', // Frans
  14: 'Jumat',  // Dhimy
  15: 'Senin',  // Hans
  16: 'Kamis',  // Adi
  17: 'Kamis',  // Adriano
  18: 'Kamis',  // Joshua
  19: 'Rabu',   // Lionel
  20: 'Senin',  // Mahalia
  21: 'Selasa', // Sandro
  22: 'Selasa', // Asther
  23: 'Rabu',   // Franda
  24: 'Jumat',  // Fellix
  25: 'Senin',  // Prita
  26: 'Jumat',  // Retna
  27: 'Kamis',  // Steven
  28: 'Selasa', // Tere
  29: 'Jumat',  // Valerie
  30: 'Rabu',   // Vickey
  31: 'Rabu',   // Virgi
  32: 'Jumat',  // Felice / Vivian
  33: 'Selasa'   // Kim
};

export const SiswaListModal: React.FC<SiswaListModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [sortBy, setSortBy] = useState<'absen' | 'nama'>('absen');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input with small delay for mount
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose]);

  // Reset copied status after 2 seconds
  useEffect(() => {
    if (copiedId !== null) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  // Count gender stats
  const totalStudents = STUDENTS_DATA.length;
  const countL = useMemo(() => STUDENTS_DATA.filter(s => s.gender === 'L').length, []);
  const countP = useMemo(() => STUDENTS_DATA.filter(s => s.gender === 'P').length, []);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return STUDENTS_DATA.filter(student => {
      // Gender filter
      if (genderFilter !== 'ALL' && student.gender !== genderFilter) {
        return false;
      }

      // Query filter
      if (!query) return true;

      // Check number match (e.g., '1', '01', '#1')
      const numQuery = query.replace(/^#/, '');
      if (numQuery && !isNaN(Number(numQuery)) && student.absen === Number(numQuery)) {
        return true;
      }

      // Match full name
      if (student.nama.toLowerCase().includes(query)) return true;

      // Match nickname
      if (student.panggilan.toLowerCase().includes(query)) return true;

      // Match piket day
      const piketDay = PIKET_SCHEDULE_MAP[student.absen]?.toLowerCase() || '';
      if (piketDay.includes(query)) return true;

      return false;
    }).sort((a, b) => {
      if (sortBy === 'nama') {
        return a.nama.localeCompare(b.nama);
      }
      return a.absen - b.absen;
    });
  }, [searchQuery, genderFilter, sortBy]);

  const handleCopyStudent = async (student: Student) => {
    const text = `No. Absen ${student.absen}: ${student.nama} (${student.panggilan}) - Kelas XB`;
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(student.absen);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="siswa-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F8F9FA] dark:bg-[#111215] text-[#191B1F] dark:text-[#F1F3F5] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="siswa-modal-title"
                  className="font-editorial font-medium text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight"
                >
                  Daftar Siswa Kelas XB
                </h2>
                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-[#13281E] px-2 py-0.5 rounded-md border border-emerald-600/20 dark:border-emerald-500/20">
                  {totalStudents} Siswa
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                SMA Putra Nirmala • Tahun Ajaran 2026/2027
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
              aria-label="Tutup Daftar Siswa"
              className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 sm:p-4 bg-stone-50/60 dark:bg-[#151619] border-b border-stone-200/80 dark:border-stone-800/80 space-y-2.5 flex-shrink-0">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama lengkap, panggilan, nomor absen (mis: 15), atau hari piket..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#25282F] transition cursor-pointer"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Badges and Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setGenderFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer border ${
                  genderFilter === 'ALL'
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-transparent shadow-xs'
                    : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                }`}
              >
                Semua ({totalStudents})
              </button>

              <button
                type="button"
                onClick={() => setGenderFilter('L')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer border flex items-center gap-1 ${
                  genderFilter === 'L'
                    ? 'bg-blue-700 text-white border-transparent shadow-xs'
                    : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                }`}
              >
                <span>Laki-laki</span>
                <span className="opacity-80">({countL})</span>
              </button>

              <button
                type="button"
                onClick={() => setGenderFilter('P')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer border flex items-center gap-1 ${
                  genderFilter === 'P'
                    ? 'bg-rose-700 text-white border-transparent shadow-xs'
                    : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                }`}
              >
                <span>Perempuan</span>
                <span className="opacity-80">({countP})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Urutkan:
              </span>
              <button
                type="button"
                onClick={() => setSortBy(prev => (prev === 'absen' ? 'nama' : 'absen'))}
                className="px-2.5 py-1 rounded-lg font-medium bg-white dark:bg-[#18191C] text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429] transition cursor-pointer flex items-center gap-1.5"
                title="Ganti urutan"
              >
                <ArrowUpDown className="w-3 h-3 text-stone-500" />
                <span>{sortBy === 'absen' ? 'No. Absen' : 'Nama A-Z'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student List Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-[#1D1F24] flex items-center justify-center text-stone-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Tidak ada siswa yang cocok
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
                Coba cari dengan kata kunci lain seperti panggilan atau nomor absen.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGenderFilter('ALL');
                }}
                className="mt-3.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-[#13281E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-[#1C3A2C] transition cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredStudents.map(student => {
                const isCopied = copiedId === student.absen;
                const piketDay = PIKET_SCHEDULE_MAP[student.absen] || '-';
                const isMale = student.gender === 'L';

                return (
                  <div
                    key={student.absen}
                    className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:border-emerald-600/30 dark:hover:border-emerald-500/30 hover:shadow-xs transition flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with Absen Number badge */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            isMale
                              ? 'bg-blue-50 dark:bg-[#0E1C2B] text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40'
                              : 'bg-rose-50 dark:bg-[#2B0E17] text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                          }`}
                        >
                          {getInitials(student.nama)}
                        </div>
                        <span
                          className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 ring-2 ring-white dark:ring-[#18191C]"
                          title={`Absen #${student.absen}`}
                        >
                          {student.absen}
                        </span>
                      </div>

                      {/* Name & Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate leading-tight">
                            {student.nama}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px]">
                          <span className="font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-[#24272D] px-1.5 py-0.5 rounded">
                            {student.panggilan}
                          </span>
                          <span
                            className={`font-medium px-1.5 py-0.5 rounded ${
                              isMale
                                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40'
                                : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40'
                            }`}
                          >
                            {isMale ? 'L' : 'P'}
                          </span>
                          <span className="text-stone-500 dark:text-stone-400 flex items-center gap-0.5">
                            <CalendarDays className="w-3 h-3 text-stone-400" />
                            Piket: {piketDay}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Copy action button */}
                    <button
                      type="button"
                      onClick={() => handleCopyStudent(student)}
                      aria-label={`Salin data ${student.nama}`}
                      title={isCopied ? 'Tersalin!' : 'Salin Nama & Absen'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 cursor-pointer border ${
                        isCopied
                          ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-700 dark:text-emerald-400 border-emerald-600/30'
                          : 'bg-stone-50 dark:bg-[#202226] text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 border-stone-200/60 dark:border-stone-800/60 hover:bg-stone-100 dark:hover:bg-[#282B32]'
                      }`}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
          <span>
            Menampilkan <strong className="text-stone-800 dark:text-stone-200">{filteredStudents.length}</strong> dari {totalStudents} siswa
          </span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            Tekan ESC untuk menutup
          </span>
        </div>
      </div>
    </div>
  );
};
