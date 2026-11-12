import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileImage,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TaskItem, TaskAttachment } from '../types';
import { parseISODateParts } from '../utils/dateUtils';
import { getUpcomingDeadlines, UpcomingDeadlineItem } from '../utils/taskUtils';
import { getCurrentWIBTimeHHMM } from '../utils/iceBreakingUtils';
import { FormattedText } from './FormattedText';

export type { UpcomingDeadlineItem };

interface UpcomingDeadlinesTabProps {
  tasksByDate: Record<string, TaskItem[]>;
  todayISO: string;
  currentTimeWIB?: string;
  onSelectDate: (iso: string) => void;
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
  onSwitchToSchedule: () => void;
  darkMode?: boolean;
}

export const UpcomingDeadlinesTab: React.FC<UpcomingDeadlinesTabProps> = ({
  tasksByDate,
  todayISO,
  currentTimeWIB,
  onSelectDate,
  onOpenAttachment,
  onSwitchToSchedule,
  darkMode: _darkMode
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (key: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const curTime = currentTimeWIB || getCurrentWIBTimeHHMM();

  // Centralized computation of upcoming deadlines (showing up to 3 cards while tracking totalCount)
  const { displayedUpcoming: upcomingDeadlines, totalCount: totalUpcomingCount } = useMemo(() => {
    return getUpcomingDeadlines(tasksByDate, todayISO, curTime, 3);
  }, [tasksByDate, todayISO, curTime]);

  const getRelativeDueLabel = (daysUntil: number) => {
    if (daysUntil === 0) return { label: 'Hari Ini', color: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800' };
    if (daysUntil === 1) return { label: 'Besok', color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800' };
    if (daysUntil === 2) return { label: 'Lusa (2 hari lagi)', color: 'bg-amber-50 dark:bg-[#1E170A] text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-900/60' };
    return { label: `${daysUntil} hari lagi`, color: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  if (upcomingDeadlines.length === 0) {
    return (
      <div className="bg-white dark:bg-[#18191C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xs transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 flex items-center justify-center mb-3.5 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
          Tidak Ada Tenggat Mendatang
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mt-1 mb-4 leading-relaxed">
          Semua tugas dan sumatif telah selesai atau belum ada penugasan baru yang dicatat dalam jadwal kelas.
        </p>
        <button
          type="button"
          onClick={onSwitchToSchedule}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-100/70 dark:hover:bg-[#183626] transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
        >
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Kembali ke Jadwal Harian</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-[#1C150A] dark:to-[#17130D] rounded-xl p-3.5 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/30 dark:border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight">
                {totalUpcomingCount > 3
                  ? `3 dari ${totalUpcomingCount} Tenggat Terdekat`
                  : totalUpcomingCount === 1
                  ? '1 Tenggat Penugasan Terdekat'
                  : `${totalUpcomingCount} Tenggat Penugasan Terdekat`}
              </h3>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-[#281C06] text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                {totalUpcomingCount > 3 ? `${upcomingDeadlines.length} dari ${totalUpcomingCount}` : 'Prioritas'}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {totalUpcomingCount > 3
                ? `Menampilkan 3 tugas terdekat dari total ${totalUpcomingCount} tenggat di masa mendatang`
                : totalUpcomingCount === 1
                ? 'Terdapat 1 penugasan terdekat di masa mendatang'
                : `Daftar ${totalUpcomingCount} penugasan dan penilaian terdekat di masa mendatang`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToSchedule}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 bg-white/80 dark:bg-[#20180B] hover:bg-white dark:hover:bg-[#281F0E] px-3 py-1.5 rounded-lg border border-amber-300/60 dark:border-amber-800/60 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 group"
        >
          <span>Lihat Jadwal Lengkap</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 3 Deadline Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2.5"
      >
        {upcomingDeadlines.map((item, index) => {
          const itemKey = item.id || `deadline_${item.isoDate}_${index}_${item.subject}`;
          const isExpanded = !!expandedTasks[itemKey];
          const isSumatif = item.taskType === 'sumatif';
          const relativeDue = getRelativeDueLabel(item.daysUntil);

          const title = item.taskTitle || (item.taskText ? item.taskText.split('\n')[0] : '');
          const details = item.taskDetails || (item.taskText && item.taskText.includes('\n')
            ? item.taskText.split('\n').slice(1).join('\n').trim()
            : '');
          const hasDetails = item.hasDetails !== undefined ? item.hasDetails : !!details;

          const isNextImmediate = index === 0;

          return (
            <motion.div
              key={itemKey}
              variants={itemVariants}
              className={`bg-white dark:bg-[#18191C] rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:-translate-y-0.5 hover:shadow-xs group ${
                isNextImmediate
                  ? isSumatif
                    ? 'border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-500/20'
                    : 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-500/20'
                  : 'border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div>
                {/* Top Row: Subject, Badge, Due Date & Relative time */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-100 dark:border-stone-800/70">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Index badge */}
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-700">
                      {index + 1}
                    </span>

                    {/* Subject badge */}
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
                      {item.subject}
                    </span>

                    {/* Task type badge */}
                    {isSumatif ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Sumatif</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/60">
                        PR / Tugas
                      </span>
                    )}

                    {isNextImmediate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/30">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Paling Dekat</span>
                      </span>
                    )}
                  </div>

                  {/* Relative due badge & time */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${relativeDue.color}`}>
                      {relativeDue.label}
                    </span>
                    {item.time && (
                      <span className="flex items-center gap-1 text-xs font-mono font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-[#151619] px-2 py-0.5 rounded border border-stone-200/60 dark:border-stone-800/60 tabular-nums">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {item.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date Announcement */}
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Jatuh tempo: <strong className="text-stone-800 dark:text-stone-200 font-semibold">{item.formattedDate}</strong></span>
                </div>

                {/* Task Title & Details Toggle */}
                <div className="flex items-start justify-between gap-2 mt-1">
                  <div
                    onClick={hasDetails ? () => toggleTask(itemKey) : undefined}
                    className={`text-sm sm:text-base leading-snug flex-1 ${
                      isSumatif
                        ? 'font-bold text-stone-950 dark:text-white'
                        : 'font-semibold text-stone-900 dark:text-stone-100'
                    } ${
                      hasDetails ? 'cursor-pointer hover:text-amber-800 dark:hover:text-amber-300 transition-colors' : ''
                    }`}
                  >
                    <FormattedText content={title} inline />
                  </div>

                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleTask(itemKey)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Tutup rincian tugas' : 'Buka rincian tugas'}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 bg-amber-50 dark:bg-[#251A07] hover:bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800/60 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer select-none flex-shrink-0"
                    >
                      <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Expanded Details Field */}
                {hasDetails && isExpanded && (
                  <div className="mt-2.5 pt-2 text-xs text-stone-800 dark:text-stone-200 leading-relaxed bg-amber-50/40 dark:bg-[#140E05] p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/40 animate-fade-in font-normal shadow-2xs">
                    <FormattedText content={details} />
                  </div>
                )}
              </div>

              {/* Bottom Actions: Jump to Date & Attachment */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  {item.attachment ? (
                    <button
                      type="button"
                      onClick={() => onOpenAttachment?.(item.attachment!, item.subject)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-[#122A1E] dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs"
                    >
                      <FileImage className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Lampiran: {item.attachment.filename || 'Lihat Berkas'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">
                      Tugas #{index + 1}
                    </span>
                  )}
                </div>

                {/* Jump to specific schedule day button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectDate(item.isoDate);
                    onSwitchToSchedule();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200/80 dark:border-stone-700 transition-all duration-150 cursor-pointer active:scale-95 group/btn"
                  title={`Buka agenda hari ${item.dowName}, ${item.formattedDate}`}
                >
                  <span>Buka di Jadwal</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
