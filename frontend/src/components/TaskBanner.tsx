import React, { useState, useMemo } from 'react';
import { Clock, AlertCircle, AlertTriangle, ChevronDown, FileImage } from 'lucide-react';
import { TaskItem, TaskSubEntry, TaskAttachment, TaskType } from '../types';
import { FormattedText } from './FormattedText';

interface TaskBannerProps {
  tasks: TaskItem[];
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
}

const getTypePriority = (t?: TaskType) => (t === 'sumatif' ? 3 : t === 'pr' ? 2 : 1);

export const TaskBanner: React.FC<TaskBannerProps> = ({ tasks, onOpenAttachment }) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Filter out agenda tasks - strictly only show sumatif & PR in Penugasan & Penilaian panel
  // Also defensively merge tasks sharing the same subject name at different times
  const displayTasks = useMemo(() => {
    const filtered = (tasks || []).filter(t => t.taskType !== 'agenda');
    const grouped = new Map<string, TaskItem[]>();
    const order: string[] = [];

    for (const t of filtered) {
      const key = (t.subject || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!grouped.has(key)) {
        grouped.set(key, []);
        order.push(key);
      }
      grouped.get(key)!.push(t);
    }

    return order.map(key => {
      const items = grouped.get(key)!;
      if (items.length === 1) return items[0];

      const subEntries: TaskSubEntry[] = [];
      for (const item of items) {
        if (item.entries && item.entries.length > 0) {
          subEntries.push(...item.entries);
        } else {
          subEntries.push({
            id: item.id,
            time: item.time,
            taskType: item.taskType,
            taskText: item.taskText,
            taskTitle: item.taskTitle,
            taskDetails: item.taskDetails,
            hasDetails: item.hasDetails,
            attachment: item.attachment
          });
        }
      }

      const mergedTimes = Array.from(
        new Set(items.map(i => (i.time || '').trim()).filter(Boolean))
      ).join(', ');
      const highestType = items.reduce<TaskType | undefined>(
        (best, cur) => (getTypePriority(cur.taskType) > getTypePriority(best) ? cur.taskType : best),
        items[0].taskType
      );

      return {
        ...items[0],
        id: items.map(i => i.id).filter(Boolean).join('__') || items[0].id,
        taskType: highestType,
        time: mergedTimes || items[0].time,
        entries: subEntries.length > 1 ? subEntries : undefined
      };
    });
  }, [tasks]);

  if (displayTasks.length === 0) return null;

  const toggleTask = (key: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div
      id="task-banner"
      className="bg-amber-50/70 dark:bg-[#1A1409] border border-amber-300/60 dark:border-amber-900/50 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 transition-colors flex-shrink-0"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 dark:border-amber-900/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <h3 className="font-semibold text-xs sm:text-[13px] text-amber-950 dark:text-amber-200 tracking-tight">
            Penugasan &amp; Penilaian ({displayTasks.length})
          </h3>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/90 dark:bg-[#261B06] text-amber-900 dark:text-amber-300 border border-amber-300/50 dark:border-amber-800/50">
          Perlu Diperhatikan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {displayTasks.map((task, i) => {
          const taskKey = task.id || `task_${i}_${task.subject}`;
          const isSumatif = task.taskType === 'sumatif';
          const hasMultipleEntries = Boolean(task.entries && task.entries.length > 1);

          const renderEntryBlock = (
            entry: {
              taskType?: TaskType;
              taskText: string;
              taskTitle?: string;
              taskDetails?: string;
              hasDetails?: boolean;
              time?: string;
              attachment?: TaskAttachment;
            },
            entryKey: string,
            showSubHeader: boolean
          ) => {
            const isExpanded = !!expandedTasks[entryKey];
            const entryIsSumatif = (entry.taskType || task.taskType) === 'sumatif';
            const title = entry.taskTitle || (entry.taskText ? entry.taskText.split('\n')[0] : '');
            const details = entry.taskDetails || (entry.taskText && entry.taskText.includes('\n')
              ? entry.taskText.split('\n').slice(1).join('\n').trim()
              : '');
            const hasDetails = entry.hasDetails !== undefined ? entry.hasDetails : !!details;

            return (
              <div
                key={entryKey}
                className={showSubHeader ? 'pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/70 first:pt-0 first:mt-0 first:border-t-0' : ''}
              >
                {showSubHeader && (entry.time || entry.taskType) && (
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {entry.time && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-[#1A1C20] px-1.5 py-0.5 rounded border border-stone-200/70 dark:border-stone-800/70 tabular-nums">
                        <Clock className="w-2.5 h-2.5 text-stone-400" />
                        {entry.time}
                      </span>
                    )}
                    {entry.taskType && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          entryIsSumatif
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/60'
                        }`}
                      >
                        {entryIsSumatif ? 'Sumatif' : 'PR'}
                      </span>
                    )}
                  </div>
                )}

                {/* Task Title */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={hasDetails ? () => toggleTask(entryKey) : undefined}
                    className={`text-xs sm:text-sm font-medium leading-snug flex-1 ${
                      entryIsSumatif
                        ? 'font-bold text-stone-950 dark:text-white'
                        : 'text-stone-900 dark:text-stone-100'
                    } ${
                      hasDetails ? 'cursor-pointer hover:text-amber-800 dark:hover:text-amber-200 transition-colors' : ''
                    }`}
                  >
                    <FormattedText content={title} inline />
                  </div>

                  {/* Expand button only if multiple lines */}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleTask(entryKey)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Tutup detail penugasan' : 'Lihat detail penugasan'}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#B45309] dark:text-[#FBBF24] hover:text-[#78350F] dark:hover:text-[#FDE68A] bg-[#FEF3C7]/60 dark:bg-[#261B06] hover:bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FCD34D]/60 dark:border-[#523A0F] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer select-none flex-shrink-0"
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
                  <div className="mt-2.5 pt-2 border-t border-[#FCD34D]/60 dark:border-[#382606] text-xs text-stone-800 dark:text-stone-200 leading-relaxed bg-[#FFFBEB] dark:bg-[#140D04] p-2.5 rounded-lg border border-[#FDE68A] dark:border-[#382606] animate-fade-in font-normal shadow-2xs">
                    <FormattedText content={details} />
                  </div>
                )}

                {/* Attachment Button */}
                {entry.attachment && (
                  <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenAttachment?.(entry.attachment!, task.subject)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-[#122A1E] dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs"
                    >
                      <FileImage className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Lampiran: {entry.attachment.filename || 'Lihat Gambar'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div
              key={taskKey}
              className={`bg-white dark:bg-[#141518] rounded-lg p-3 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 border group ${
                isSumatif
                  ? 'border-rose-300 dark:border-rose-900/80 shadow-xs hover:border-rose-400'
                  : 'border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400/80'
              }`}
            >
              <div>
                {/* Header row: Subject, Task Type & Time */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 group-hover:border-stone-300 dark:group-hover:border-stone-600 transition-colors">
                      {task.subject}
                    </span>

                    {/* Task type badge */}
                    {isSumatif ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1 group-hover:scale-105 transition-transform duration-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Sumatif</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/60 group-hover:scale-105 transition-transform duration-200">
                        PR
                      </span>
                    )}

                    {hasMultipleEntries && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80">
                        {task.entries!.length} Tugas
                      </span>
                    )}
                  </div>

                  {task.time && (
                    <span className="flex items-center gap-1 text-xs font-mono font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-[#1A1C20] px-2 py-0.5 rounded border border-stone-200/70 dark:border-stone-800/70 tabular-nums">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {task.time}
                    </span>
                  )}
                </div>

                {hasMultipleEntries ? (
                  <div>
                    {task.entries!.map((entry, subIdx) =>
                      renderEntryBlock(entry, `${taskKey}_sub_${subIdx}`, true)
                    )}
                  </div>
                ) : (
                  renderEntryBlock(task, taskKey, false)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
