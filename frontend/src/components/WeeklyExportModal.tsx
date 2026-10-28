import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Share2,
  Calendar,
  ClipboardList,
  Check,
  Copy,
  Download,
  Filter,
  Eye,
  Sliders,
  ChevronRight,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { ClassDataStore } from '../types';
import {
  formatCustomRangeSummary,
  getDateRangeISOs,
  getSchoolWeekISODates,
  copyTextToClipboard
} from '../utils/summaryFormatter';
import { parseISODateParts, stepISODate, getWIBDateParts } from '../utils/dateUtils';
import { MONTH_ID, DOW_ID } from '../data/demoData';

interface WeeklyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: ClassDataStore;
  baseIso: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

type ExportMode = 'week' | 'range';
type WeekPreset = 'current' | 'next' | 'prev' | 'picker';

export const WeeklyExportModal: React.FC<WeeklyExportModalProps> = ({
  isOpen,
  onClose,
  store,
  baseIso,
  darkMode,
  onToggleDarkMode
}) => {
  const baseParts = useMemo(() => parseISODateParts(baseIso), [baseIso]);

  // Mode: Preset Pekan / Minggu vs Rentang Tanggal Kustom
  const [exportMode, setExportMode] = useState<ExportMode>('week');
  const [weekPreset, setWeekPreset] = useState<WeekPreset>('current');

  // Month & Week selector state
  const [selectedYear, setSelectedYear] = useState<number>(() => baseParts.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => baseParts.month);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(() => {
    const d = baseParts.day;
    return Math.min(5, Math.max(1, Math.ceil(d / 7)));
  });

  // Custom date range state
  const defaultRange = useMemo(() => {
    const schoolDays = getSchoolWeekISODates(baseIso);
    return {
      start: schoolDays[0] || baseIso,
      end: schoolDays[schoolDays.length - 1] || baseIso
    };
  }, [baseIso]);

  const [customStartIso, setCustomStartIso] = useState<string>(() => defaultRange.start);
  const [customEndIso, setCustomEndIso] = useState<string>(() => defaultRange.end);
  const [schoolDaysOnly, setSchoolDaysOnly] = useState<boolean>(true);

  // Content options
  const [includeLessons, setIncludeLessons] = useState<boolean>(true);
  const [includeTasks, setIncludeTasks] = useState<boolean>(true);
  const [includeAgenda, setIncludeAgenda] = useState<boolean>(true);
  const [includePiket, setIncludePiket] = useState<boolean>(true);
  const [includeMbg, setIncludeMbg] = useState<boolean>(true);
  const [includeIceBreaking, setIncludeIceBreaking] = useState<boolean>(true);
  const [includeDoa, setIncludeDoa] = useState<boolean>(true);
  const [includeBirthdays, setIncludeBirthdays] = useState<boolean>(true);
  const [includeSong, setIncludeSong] = useState<boolean>(true);
  const [includeKasNote, setIncludeKasNote] = useState<boolean>(true);

  // UI States
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate target dates
  const targetDateIsos = useMemo(() => {
    if (exportMode === 'week') {
      if (weekPreset === 'current') {
        return getSchoolWeekISODates(baseIso);
      }
      if (weekPreset === 'next') {
        return getSchoolWeekISODates(stepISODate(baseIso, 7));
      }
      if (weekPreset === 'prev') {
        return getSchoolWeekISODates(stepISODate(baseIso, -7));
      }
      if (weekPreset === 'picker') {
        // Approximate day in the selected week of month
        const approxDay = Math.min(28, (selectedWeekNum - 1) * 7 + 3);
        const approxDate = new Date(Date.UTC(selectedYear, selectedMonth, approxDay, 12, 0, 0));
        const approxIso = approxDate.toISOString().slice(0, 10);
        return getSchoolWeekISODates(approxIso);
      }
      return getSchoolWeekISODates(baseIso);
    } else {
      return getDateRangeISOs(customStartIso, customEndIso, schoolDaysOnly);
    }
  }, [
    exportMode,
    weekPreset,
    baseIso,
    selectedYear,
    selectedMonth,
    selectedWeekNum,
    customStartIso,
    customEndIso,
    schoolDaysOnly
  ]);

  // Generate output text
  const generatedText = useMemo(() => {
    return formatCustomRangeSummary(targetDateIsos, store, {
      includeLessons,
      includeTasks,
      includeAgenda,
      includePiket,
      includeMbg,
      includeIceBreaking,
      includeDoa,
      includeBirthdays,
      includeSong,
      includeKasNote
    });
  }, [
    targetDateIsos,
    store,
    includeLessons,
    includeTasks,
    includeAgenda,
    includePiket,
    includeMbg,
    includeIceBreaking,
    includeDoa,
    includeBirthdays,
    includeSong,
    includeKasNote
  ]);

  const handleCopyText = async () => {
    const ok = await copyTextToClipboard(generatedText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const startStr = targetDateIsos[0] || 'jadwal';
    const endStr = targetDateIsos[targetDateIsos.length - 1] || 'jadwal';
    link.href = url;
    link.download = `agenda_kelas_xb_${startStr}_sd_${endStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const firstDateFormatted = targetDateIsos.length > 0 ? parseISODateParts(targetDateIsos[0]).formattedDate : '';
  const lastDateFormatted = targetDateIsos.length > 0 ? parseISODateParts(targetDateIsos[targetDateIsos.length - 1]).formattedDate : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 dark:bg-black/85 backdrop-blur-md animate-fade-in text-stone-900 dark:text-stone-100"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl h-[94vh] max-h-[880px] bg-white dark:bg-[#151619] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-50/90 dark:bg-[#18191C] border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 dark:border-emerald-500/25 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="export-modal-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Ekspor Agenda &amp; Jadwal Mingguan
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal truncate mt-0.5">
                Kustomisasi rentang tanggal, minggu, dan konten untuk dibagikan ke WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-700" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 text-stone-600 dark:text-stone-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SPLIT VIEW: CONTROLS & LIVE PREVIEW) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANEL: CONFIGURATION CONTROLS (Col span 5) */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-stone-200/80 dark:border-stone-800 overflow-y-auto space-y-4 bg-stone-50/40 dark:bg-[#141518]/50">
            {/* 1. Mode Tab Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5 uppercase tracking-wider">
                Metode Pemilihan Periode
              </label>
              <div className="grid grid-cols-2 p-1 bg-stone-200/60 dark:bg-[#1C1E23] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setExportMode('week')}
                  className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    exportMode === 'week'
                      ? 'bg-white dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Pilih Minggu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('range')}
                  className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    exportMode === 'range'
                      ? 'bg-white dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Rentang Tanggal</span>
                </button>
              </div>
            </div>

            {/* 2A. Mode Week: Presets & Week Picker */}
            {exportMode === 'week' ? (
              <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2">
                    Preset Pekan Cepat
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWeekPreset('prev')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        weekPreset === 'prev'
                          ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40'
                          : 'bg-stone-50 dark:bg-[#1F2025] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Pekan Lalu
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekPreset('current')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        weekPreset === 'current'
                          ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40'
                          : 'bg-stone-50 dark:bg-[#1F2025] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Pekan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekPreset('next')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        weekPreset === 'next'
                          ? 'bg-emerald-50 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 border-emerald-600/40'
                          : 'bg-stone-50 dark:bg-[#1F2025] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Pekan Depan
                    </button>
                  </div>
                </div>

                {/* Pilih Bulan & Minggu ke-N */}
                <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Pilih Bulan &amp; Minggu ke-N
                    </span>
                    {weekPreset === 'picker' && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">Bulan</label>
                      <select
                        value={selectedMonth}
                        onChange={e => {
                          setSelectedMonth(Number(e.target.value));
                          setWeekPreset('picker');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1F2025] text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                      >
                        {MONTH_ID.map((m, idx) => (
                          <option key={idx} value={idx}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">Minggu ke</label>
                      <select
                        value={selectedWeekNum}
                        onChange={e => {
                          setSelectedWeekNum(Number(e.target.value));
                          setWeekPreset('picker');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1F2025] text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                      >
                        <option value={1}>Minggu ke-1</option>
                        <option value={2}>Minggu ke-2</option>
                        <option value={3}>Minggu ke-3</option>
                        <option value={4}>Minggu ke-4</option>
                        <option value={5}>Minggu ke-5</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 2B. Mode Range: Custom Dates */
              <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2">
                  Tentukan Rentang Tanggal
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                      Dari Tanggal (Mulai)
                    </label>
                    <input
                      type="date"
                      value={customStartIso}
                      onChange={e => setCustomStartIso(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1F2025] text-xs font-semibold text-stone-800 dark:text-stone-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                      Sampai Tanggal (Selesai)
                    </label>
                    <input
                      type="date"
                      value={customEndIso}
                      onChange={e => setCustomEndIso(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1F2025] text-xs font-semibold text-stone-800 dark:text-stone-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schoolDaysOnly}
                      onChange={e => setSchoolDaysOnly(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Hanya hari efektif sekolah (Senin s.d. Jumat)</span>
                  </label>
                </div>
              </div>
            )}

            {/* 3. Hasil Pemilihan Tanggal Summary Box */}
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-[#11241A] border border-emerald-600/25 dark:border-emerald-500/25 text-xs text-emerald-950 dark:text-emerald-200">
              <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-1">
                Periode yang dipilih:
              </span>
              <p className="font-semibold text-xs leading-snug">
                {firstDateFormatted} – {lastDateFormatted}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Total: <strong>{targetDateIsos.length} hari</strong> {schoolDaysOnly ? 'sekolah aktif' : 'kalender'}
              </p>
            </div>

            {/* 4. Filter Opsi Konten (Accordion) */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className="w-full flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-stone-500" />
                  <span>Kustomisasi Konten Ekspor</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {showFilters ? 'Sembunyikan' : 'Atur Bagian'}
                </span>
              </button>

              {showFilters && (
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLessons}
                      onChange={e => setIncludeLessons(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Jadwal Pelajaran</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTasks}
                      onChange={e => setIncludeTasks(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Tugas &amp; PR</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAgenda}
                      onChange={e => setIncludeAgenda(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Agenda Kegiatan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDoa}
                      onChange={e => setIncludeDoa(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Petugas Doa</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePiket}
                      onChange={e => setIncludePiket(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Petugas Piket</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMbg}
                      onChange={e => setIncludeMbg(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Petugas MBG</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeIceBreaking}
                      onChange={e => setIncludeIceBreaking(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Petugas Ice Breaking</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBirthdays}
                      onChange={e => setIncludeBirthdays(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Ulang Tahun</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSong}
                      onChange={e => setIncludeSong(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Lagu Wajib</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeKasNote}
                      onChange={e => setIncludeKasNote(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Info Iuran Kas</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: LIVE WHATSAPP PREVIEW (Col span 7) */}
          <div className="lg:col-span-7 flex flex-col p-4 sm:p-5 overflow-hidden bg-white dark:bg-[#151619]">
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Pratinjau Teks WhatsApp (Live)
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                {generatedText.split('\n').length} baris • {generatedText.length} karakter
              </span>
            </div>

            {/* Monospace WhatsApp Preview Container */}
            <div className="flex-1 min-h-0 relative rounded-xl border border-stone-200/90 dark:border-stone-800 bg-stone-50/70 dark:bg-[#0D0E11] p-3.5 overflow-auto shadow-inner text-xs font-mono leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap select-text">
              {generatedText}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-4 sm:px-6 py-3 bg-stone-50/90 dark:bg-[#18191C] border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Format otomatis mendukung tebal (*teks*) dan miring (_teks_) untuk WhatsApp</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Unduh sebagai berkas .txt"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer border border-stone-200 dark:border-stone-700"
            >
              <Download className="w-4 h-4" />
              <span>Unduh .txt</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-900/40'
                  : 'bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin ke WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
