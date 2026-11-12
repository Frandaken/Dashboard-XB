import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Share2,
  Calendar,
  ClipboardList,
  Check,
  CheckCheck,
  MessageCircle,
  Copy,
  Download,
  Filter,
  Eye,
  Sliders,
  ChevronRight,
  Sun,
  Moon
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
type PreviewTab = 'visual' | 'raw';

/**
 * Parses inline WhatsApp formatting tokens (*bold*, _italic_, ~strike~, `code`)
 * into styled React nodes for live visual preview.
 */
function parseWhatsAppInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match WhatsApp inline tokens: *bold*, _italic_, ~strike~, `code`
  const tokenRegex = /(\*[^*\n\r]+\*|_[^_\n\r]+_|~[^~\n\r]+~|`[^`\n\r]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const content = part.slice(1, -1);
      return (
        <strong key={index} className="font-bold text-[#111b21] dark:text-white">
          {content}
        </strong>
      );
    }

    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      const content = part.slice(1, -1);
      return (
        <em key={index} className="italic text-[#3b4a54] dark:text-[#c4ccd3]">
          {content}
        </em>
      );
    }

    if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
      const content = part.slice(1, -1);
      return (
        <span key={index} className="line-through text-[#667781] dark:text-[#8696a0]">
          {content}
        </span>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const content = part.slice(1, -1);
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
          {content}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

/**
 * Formats WhatsApp text into multi-line chat message blocks including quotes (>),
 * separators (=== / ---), and bullet points.
 */
function renderWhatsAppBlocks(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let quoteBuffer: string[] = [];

  const flushQuotes = (key: number) => {
    if (quoteBuffer.length > 0) {
      elements.push(
        <div
          key={`quote-${key}`}
          className="border-l-[3.5px] border-[#00a884] bg-[#00000008] dark:bg-[#ffffff12] pl-2.5 py-1 my-1.5 rounded-r-md text-[12px] italic text-[#111b21] dark:text-[#e9edef]"
        >
          {quoteBuffer.map((ql, qIdx) => (
            <div key={qIdx} className={qIdx > 0 ? 'mt-0.5' : ''}>
              {parseWhatsAppInline(ql)}
            </div>
          ))}
        </div>
      );
      quoteBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Blockquote handling (lines starting with >)
    if (line.startsWith('> ') || line.startsWith('>')) {
      quoteBuffer.push(line.startsWith('> ') ? line.slice(2) : line.slice(1));
      return;
    } else {
      flushQuotes(idx);
    }

    // Horizontal separators (e.g. === or ---)
    if (/^[=\-─_]{3,}$/.test(trimmed)) {
      elements.push(
        <div key={`hr-${idx}`} className="my-2 border-t border-black/10 dark:border-white/15" />
      );
      return;
    }

    // Empty lines
    if (trimmed === '') {
      elements.push(<div key={`empty-${idx}`} className="h-2.5" />);
      return;
    }

    // Regular line
    elements.push(
      <div key={`line-${idx}`} className="leading-[1.55]">
        {parseWhatsAppInline(line)}
      </div>
    );
  });

  flushQuotes(lines.length);

  return elements;
}

export const WeeklyExportModal: React.FC<WeeklyExportModalProps> = ({
  isOpen,
  onClose,
  store,
  baseIso,
  darkMode,
  onToggleDarkMode
}) => {
  const initialAnchorParts = useMemo(() => {
    const schoolDays = getSchoolWeekISODates(baseIso);
    const anchorIso = schoolDays[2] || schoolDays[0] || baseIso;
    return parseISODateParts(anchorIso);
  }, [baseIso]);

  // Mode: Preset Pekan / Minggu vs Rentang Tanggal Kustom
  const [exportMode, setExportMode] = useState<ExportMode>('week');
  const [weekPreset, setWeekPreset] = useState<WeekPreset>('current');

  // Month & Week selector state
  const [selectedYear, setSelectedYear] = useState<number>(() => initialAnchorParts.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => initialAnchorParts.month);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(() => {
    return Math.min(5, Math.max(1, Math.ceil(initialAnchorParts.day / 7)));
  });

  // Handler to apply preset and synchronously update Month & Week selector
  const applyWeekPreset = useCallback((preset: 'prev' | 'current' | 'next') => {
    setWeekPreset(preset);

    let targetIso = baseIso;
    if (preset === 'prev') {
      targetIso = stepISODate(baseIso, -7);
    } else if (preset === 'next') {
      targetIso = stepISODate(baseIso, 7);
    }

    const schoolDays = getSchoolWeekISODates(targetIso);
    const anchorIso = schoolDays[2] || schoolDays[0] || targetIso;
    const parts = parseISODateParts(anchorIso);

    setSelectedYear(parts.year);
    setSelectedMonth(parts.month);
    setSelectedWeekNum(Math.min(5, Math.max(1, Math.ceil(parts.day / 7))));
  }, [baseIso]);

  // Synchronize month and week selection with current baseIso when modal opens
  useEffect(() => {
    if (isOpen && weekPreset === 'current') {
      const schoolDays = getSchoolWeekISODates(baseIso);
      const anchorIso = schoolDays[2] || schoolDays[0] || baseIso;
      const parts = parseISODateParts(anchorIso);
      setSelectedYear(parts.year);
      setSelectedMonth(parts.month);
      setSelectedWeekNum(Math.min(5, Math.max(1, Math.ceil(parts.day / 7))));
    }
  }, [isOpen, baseIso]);

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
  const [previewTab, setPreviewTab] = useState<PreviewTab>('visual');
  const currentTimeStr = useMemo(() => getWIBDateParts().timeStr.slice(0, 5), []);

  const handleCopyFromContainer = (e: React.ClipboardEvent) => {
    // Ensure that copying inside the preview container puts authentic raw WhatsApp format into clipboard
    e.clipboardData.setData('text/plain', generatedText);
    e.preventDefault();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
                Ekspor Agenda Mingguan
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
                      onClick={() => applyWeekPreset('prev')}
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
                      onClick={() => applyWeekPreset('current')}
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
                      onClick={() => applyWeekPreset('next')}
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
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-white dark:bg-[#151619] border-t lg:border-t-0">
            {/* WhatsApp Chat Navigation Bar */}
            <div className="px-3.5 sm:px-4 py-2 bg-[#008069] dark:bg-[#1f2c34] text-white flex items-center justify-between gap-2 flex-shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-800 dark:bg-emerald-900/60 border border-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold truncate leading-tight text-white flex items-center gap-1.5">
                    <span>Grup WhatsApp Kelas XB</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <p className="text-[10px] sm:text-[11px] text-emerald-100/90 dark:text-stone-300 truncate font-normal">
                      online • Pratinjau Tampilan WhatsApp Live
                    </p>
                  </div>
                </div>
              </div>

              {/* View Switcher: Live Visual vs Teks Mentah */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center bg-black/20 dark:bg-black/30 rounded-lg p-0.5 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('visual')}
                    className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      previewTab === 'visual'
                        ? 'bg-white text-emerald-950 font-bold shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('raw')}
                    className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      previewTab === 'raw'
                        ? 'bg-white text-emerald-950 font-bold shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span>Mentah</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  title="Salin format WhatsApp mentah ke clipboard"
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold border ${
                    copied
                      ? 'bg-white text-emerald-800 border-white shadow-xs'
                      : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Chat Body Wallpaper Area */}
            <div
              onCopy={handleCopyFromContainer}
              className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 transition-colors relative"
              style={{
                backgroundColor: darkMode ? '#0b141a' : '#efeae2',
                backgroundImage: darkMode
                  ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
                  : 'radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            >
              {previewTab === 'visual' ? (
                <div className="max-w-2xl mx-auto flex flex-col items-center">
                  {/* WhatsApp Center Date Badge */}
                  <div className="mb-2.5 px-3 py-0.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider shadow-2xs border bg-[#ffffffd9] dark:bg-[#182229e6] text-[#54656f] dark:text-[#8696a0] border-black/5 dark:border-white/5 backdrop-blur-xs">
                    {firstDateFormatted ? `${firstDateFormatted} – ${lastDateFormatted}` : 'AGENDA KELAS XB'}
                  </div>

                  {/* WhatsApp Outgoing Message Speech Bubble */}
                  <div
                    className="w-full rounded-2xl rounded-tr-xs p-3.5 sm:p-4 text-[12px] sm:text-[13px] shadow-sm border leading-relaxed select-text transition-colors relative"
                    style={{
                      backgroundColor: darkMode ? '#005c4b' : '#d9fdd3',
                      borderColor: darkMode ? '#006c57' : '#d0f4ca',
                      color: darkMode ? '#e9edef' : '#111b21'
                    }}
                  >
                    {/* Rendered Live WhatsApp Content with bold, italic, quotes, separators */}
                    <div className="space-y-0.5 break-words font-sans">
                      {renderWhatsAppBlocks(generatedText)}
                    </div>

                    {/* WhatsApp Message Metadata Footer: Time & Sky Blue Double Checkmarks */}
                    <div className="mt-2.5 pt-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-end text-[11px]">
                      <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-300 flex-shrink-0">
                        <span className="text-[11px] font-sans opacity-75">
                          {currentTimeStr}
                        </span>
                        <CheckCheck className="w-4 h-4 text-[#53bdeb] flex-shrink-0" title="Dibaca (Read)" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Raw Monospace Text View */
                <div className="rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-[#0D0E11]/95 p-3.5 shadow-inner text-xs font-mono leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap select-text">
                  {generatedText}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-4 sm:px-6 py-3 bg-stone-50/90 dark:bg-[#18191C] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-end flex-shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
