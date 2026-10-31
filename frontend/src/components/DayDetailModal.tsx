import React, { useEffect, useState, useCallback } from 'react';
import { X, Music, BookOpen, PartyPopper, Clock, ChevronRight, Sun, Moon, Copy, Check } from 'lucide-react';
import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, TaskItem, IceBreakingSchedule, TaskAttachment, CalendarEventNotice } from '../types';
import { DOW_ID, MONTH_ID } from '../data/demoData';
import { parseISODateParts } from '../utils/dateUtils';
import { getSongForDate } from '../data/songSchedule';
import { getFirstLessonSession } from '../utils/iceBreakingUtils';
import { formatDailySummary, copyTextToClipboard } from '../utils/summaryFormatter';
import { TaskBanner } from './TaskBanner';
import { EventNoticeBanner } from './EventNoticeBanner';
import { ScheduleBlocks } from './ScheduleBlocks';
import { SongLyricsModal } from './SongLyricsModal';
import { AllSongsModal } from './AllSongsModal';

interface DayDetailModalProps {
  isoDate: string | null;
  onClose: () => void;
  doa?: DoaSchedule;
  mbg?: MbgSchedule;
  piket?: PiketSchedule;
  iceBreaking?: IceBreakingSchedule;
  pelajaran?: PeriodItem[];
  tasks?: TaskItem[];
  eventNotices?: CalendarEventNotice[];
  birthdays?: string[];
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenAllSongs?: () => void;
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isoDate,
  onClose,
  doa,
  mbg,
  piket,
  iceBreaking,
  pelajaran = [],
  tasks = [],
  eventNotices = [],
  birthdays = [],
  darkMode,
  onToggleDarkMode,
  onOpenAllSongs,
  onOpenAttachment
}) => {
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showAllSongsModal, setShowAllSongsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDailySummary = useCallback(async () => {
    if (!isoDate) return;
    const text = formatDailySummary({
      isoDate,
      doa,
      pelajaran,
      tasks,
      eventNotices,
      piket,
      mbg,
      iceBreaking,
      birthdays
    });
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [isoDate, doa, pelajaran, tasks, eventNotices, piket, mbg, iceBreaking, birthdays]);

  // Real-time tracking of app theme (Light mode / OLED black)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof darkMode === 'boolean') return darkMode;
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof darkMode === 'boolean') {
      setIsDark(darkMode);
      return;
    }
    const checkDark = () => {
      if (typeof document !== 'undefined') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLyricsModal) {
          setShowLyricsModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLyricsModal]);

  if (!isoDate) return null;

  const info = parseISODateParts(isoDate);
  const dow = info.dowName;
  const formattedDate = info.formattedDate;
  const d = new Date(Date.UTC(info.year, info.month, info.day, 12, 0, 0));
  const daySong = getSongForDate(d);
  const hasSong = !!daySong.song && daySong.song !== '-' && daySong.song.toLowerCase() !== 'blank';

  return (
    <div
      id="day-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-500/20" />
            <div>
              <h2
                id="day-detail-title"
                className="font-editorial font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-tight"
              >
                {formattedDate}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                SMA Putra Nirmala • Kelas XB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Salin Ringkasan Hari Ini (Icon Only) */}
            <button
              type="button"
              onClick={handleCopyDailySummary}
              aria-label={copied ? 'Tersalin ke clipboard' : 'Salin Agenda Harian'}
              title={copied ? 'Tersalin ke clipboard!' : 'Salin Agenda Hari Ini ke WhatsApp'}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                copied
                  ? 'bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border-emerald-600/40 shadow-xs'
                  : 'bg-white dark:bg-[#1E1F23] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#25272C]'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
              )}
            </button>

            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            <button
              id="modal-close-btn"
              onClick={onClose}
              aria-label="Tutup Rincian Hari"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content with smooth touch scrolling */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0">
          {/* Event Notice Banner for full-day / multi-day events */}
          {eventNotices && eventNotices.length > 0 && (
            <EventNoticeBanner notices={eventNotices} onOpenAttachment={onOpenAttachment} />
          )}

          {/* Lagu Nasional Minggu Ini */}
          {hasSong ? (
            <div
              onClick={() => setShowLyricsModal(true)}
              role="button"
              tabIndex={0}
              aria-label={`Buka lirik lagu ${daySong.song}`}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowLyricsModal(true);
                }
              }}
              title="Klik untuk melihat lirik lagu"
              className="p-3 rounded-xl border flex items-center justify-between gap-3 transition select-none bg-stone-50/70 dark:bg-[#151619] border-stone-200/80 dark:border-stone-800/80 hover:border-emerald-600/40 dark:hover:border-emerald-500/40 cursor-pointer shadow-xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block leading-tight">
                    Lagu Wajib (Minggu ke-{daySong.week})
                  </span>
                  <span className="text-xs sm:text-sm font-semibold truncate block leading-tight mt-0.5 text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {daySong.song}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-[#122A1E] px-2.5 py-1 rounded-md border border-emerald-600/25 dark:border-emerald-500/35 flex items-center gap-1.5 flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lirik</span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenAllSongs) {
                  onOpenAllSongs();
                } else {
                  setShowAllSongsModal(true);
                }
              }}
              className="w-full text-left p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition group cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/20 group-hover:scale-105 transition-transform">
                  <Music className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors block leading-tight">
                    Koleksi Lagu Wajib Nasional
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 block mt-0.5">
                    Tidak ada lagu wajib di tanggal ini • Buka koleksi lirik lagu
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          )}

          {/* Birthday Alert for this day */}
          {birthdays.length > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-[#20170A] border border-amber-300/80 dark:border-amber-900/60 rounded-xl flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-amber-950 dark:text-amber-200">
                🎂 Ulang tahun hari ini: <span className="font-bold">{birthdays.join(', ')}</span>
              </span>
            </div>
          )}

          {/* Penugasan Banner (if any) */}
          {tasks.length > 0 && (
            <TaskBanner tasks={tasks} onOpenAttachment={onOpenAttachment} />
          )}

          {/* Petugas Ice Breaking Card (if this date has ice breaking scheduled) */}
          {iceBreaking && (
            <div className="p-3 rounded-xl border border-emerald-600/25 dark:border-emerald-500/25 bg-emerald-50/60 dark:bg-[#0E2018] shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-600/15 dark:border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                    Petugas Ice Breaking
                  </h3>
                </div>
                {(() => {
                  const sess = getFirstLessonSession(isoDate, iceBreaking.pelajaranPertama, pelajaran);
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-[#122A1E] px-2 py-0.5 rounded-md border border-emerald-600/25">
                      <Clock className="w-3 h-3" />
                      <span>{iceBreaking.pelajaranPertama} • {sess.timeRange}</span>
                    </span>
                  );
                })()}
              </div>

              {iceBreaking.petugas && iceBreaking.petugas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {iceBreaking.petugas.map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#18191C] text-emerald-950 dark:text-emerald-200 text-xs font-semibold border border-emerald-600/25 dark:border-emerald-500/35 shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[10px] flex items-center justify-center text-emerald-800 dark:text-emerald-100 font-bold">
                        {idx + 1}
                      </span>
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 dark:text-stone-400 italic text-xs py-1">
                  Belum ada petugas yang dicatat untuk tanggal ini di spreadsheet.
                </p>
              )}
            </div>
          )}

          {/* Schedule Blocks (compact mode for calendar popup) */}
          <ScheduleBlocks
            mbg={mbg}
            piket={piket}
            doa={doa}
            pelajaran={pelajaran}
            dowName={dow}
            compact={true}
            onOpenAttachment={onOpenAttachment}
          />
        </div>
      </div>

      {/* Pop Up Lirik Lagu */}
      {hasSong && (
        <SongLyricsModal
          isOpen={showLyricsModal}
          onClose={() => setShowLyricsModal(false)}
          songTitle={daySong.song}
          weekNumber={daySong.week}
          darkMode={isDark}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}

      {/* Pop Up Koleksi Semua Lagu */}
      {!hasSong && showAllSongsModal && (
        <AllSongsModal
          isOpen={showAllSongsModal}
          onClose={() => setShowAllSongsModal(false)}
          darkMode={isDark}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}
    </div>
  );
};
