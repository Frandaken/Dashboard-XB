import React, { useState, useEffect } from 'react';
import { X, Search, PartyPopper, Calendar, Clock, CheckCircle2, Sun, Moon } from 'lucide-react';
import { IceBreakingSchedule, PeriodItem } from '../types';
import { getFirstLessonSession } from '../utils/iceBreakingUtils';

interface IceBreakingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Record<string, IceBreakingSchedule>;
  pelajaranByDate?: Record<string, PeriodItem[]>;
  todayISO: string;
  onSelectDate?: (iso: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const IceBreakingScheduleModal: React.FC<IceBreakingScheduleModalProps> = ({
  isOpen,
  onClose,
  schedules,
  pelajaranByDate = {},
  todayISO,
  onSelectDate,
  darkMode,
  onToggleDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'assigned'>('all');

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

  // Convert map to sorted array by isoDate
  const scheduleList: IceBreakingSchedule[] = (Object.values(schedules || {}) as IceBreakingSchedule[])
    .filter(item => Boolean(item && item.isoDate))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  // Filter based on search & filter tabs
  const filteredList = scheduleList.filter(item => {
    const hasOfficers = item.petugas && item.petugas.length > 0;
    if (filterType === 'assigned' && !hasOfficers) return false;
    if (filterType === 'upcoming' && item.isoDate < todayISO) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const officersStr = (item.petugas || []).join(' ').toLowerCase();
    const subjectStr = item.pelajaranPertama.toLowerCase();
    const dayStr = item.hari.toLowerCase();
    const dateStr = item.tanggal.toLowerCase();
    return (
      officersStr.includes(query) ||
      subjectStr.includes(query) ||
      dayStr.includes(query) ||
      dateStr.includes(query)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ice-breaking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-[#141518]/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center flex-shrink-0">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="ice-breaking-modal-title"
                className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-white leading-tight"
              >
                Jadwal Petugas Ice Breaking
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                SMA Putra Nirmala • Jam Pertama Sosiologi & Geografi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
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
              aria-label="Tutup Jadwal Ice Breaking"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 pb-3 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/30 dark:bg-[#141518]/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between flex-shrink-0">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, mata pelajaran, atau tanggal..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#141518] text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-[#141518] border border-stone-200/80 dark:border-stone-800/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#202126] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Semua ({scheduleList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'upcoming'
                  ? 'bg-white dark:bg-[#202126] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Mendatang
            </button>
            <button
              type="button"
              onClick={() => setFilterType('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'assigned'
                  ? 'bg-white dark:bg-[#202126] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Sudah Ada Petugas
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 min-h-0">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-stone-500 dark:text-stone-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-stone-400 dark:text-stone-600" />
              <p className="text-sm font-medium">Tidak ada jadwal ice breaking yang cocok dengan kriteria pencarian.</p>
            </div>
          ) : (
            filteredList.map(item => {
              const isToday = item.isoDate === todayISO;
              const isPast = item.isoDate < todayISO;
              const hasOfficers = item.petugas && item.petugas.length > 0;
              const session = getFirstLessonSession(item.isoDate, item.pelajaranPertama, pelajaranByDate[item.isoDate]);

              return (
                <div
                  key={item.isoDate}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isToday
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/20'
                      : 'bg-white dark:bg-[#141518] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{item.hari}, {item.tanggal}</span>
                      </div>

                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 animate-pulse">
                          Hari Ini
                        </span>
                      )}

                      {isPast && !isToday && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 dark:bg-[#202126] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80">
                          <CheckCircle2 className="w-3 h-3 text-stone-400" />
                          <span>Lewat</span>
                        </span>
                      )}
                    </div>

                    {/* Lesson session info */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-50 dark:bg-[#1c1d22] text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800/80">
                        <span>Jam Pertama:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">{item.pelajaranPertama}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-[#141518]">
                        <Clock className="w-3 h-3" />
                        <span>{session.timeRange}</span>
                      </span>
                    </div>
                  </div>

                  {/* Officers section */}
                  <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-stone-500 mr-1">
                        Petugas:
                      </span>
                      {hasOfficers ? (
                        item.petugas.map((officer, oIdx) => (
                          <span
                            key={oIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-200 dark:bg-emerald-800 text-[10px] flex items-center justify-center text-emerald-800 dark:text-emerald-100 font-bold">
                              {oIdx + 1}
                            </span>
                            <span>{officer}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs italic text-stone-500">
                          (Belum ditentukan di spreadsheet)
                        </span>
                      )}
                    </div>

                    {onSelectDate && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(item.isoDate);
                          onClose();
                        }}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline self-end sm:self-auto cursor-pointer"
                      >
                        Buka di Kalender &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-[#141518] flex items-center justify-between flex-shrink-0 text-xs">
          <span className="text-stone-500">
            Sumber: Google Sheets resmi kelas XB (Otomatis sinkron)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
