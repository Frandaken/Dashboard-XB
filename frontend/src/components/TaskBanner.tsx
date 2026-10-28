import React, { useState } from 'react';
import { Clock, AlertCircle, AlertTriangle, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { TaskItem, TaskAttachment } from '../types';

interface TaskBannerProps {
  tasks: TaskItem[];
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
}

export const TaskBanner: React.FC<TaskBannerProps> = ({ tasks, onOpenAttachment }) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Filter out agenda tasks - strictly only show sumatif & PR in Penugasan & Penilaian panel
  const displayTasks = (tasks || []).filter(t => t.taskType !== 'agenda');
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
          const isExpanded = !!expandedTasks[taskKey];
          const isSumatif = task.taskType === 'sumatif';

          // Compute title & details
          const title = task.taskTitle || (task.taskText ? task.taskText.split('\n')[0] : '');
          const details = task.taskDetails || (task.taskText && task.taskText.includes('\n')
            ? task.taskText.split('\n').slice(1).join('\n').trim()
            : '');
          const hasDetails = task.hasDetails !== undefined ? task.hasDetails : !!details;

          return (
            <div
              key={taskKey}
              className={`bg-white dark:bg-[#141518] rounded-lg p-3 flex flex-col justify-between transition border ${
                isSumatif
                  ? 'border-rose-300 dark:border-rose-900/80 shadow-xs'
                  : 'border-amber-200/80 dark:border-amber-900/40'
              } ${hasDetails ? 'hover:border-amber-400/80 dark:hover:border-amber-700/80' : ''}`}
            >
              <div>
                {/* Header row: Subject, Task Type & Time */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
                      {task.subject}
                    </span>

                    {/* Task type badge */}
                    {isSumatif ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Sumatif</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/60">
                        PR
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

                {/* Task Title */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={hasDetails ? () => toggleTask(taskKey) : undefined}
                    className={`text-xs sm:text-sm font-medium leading-snug flex-1 ${
                      isSumatif
                        ? 'font-bold text-stone-950 dark:text-white'
                        : 'text-stone-900 dark:text-stone-100'
                    } ${
                      hasDetails ? 'cursor-pointer hover:text-amber-800 dark:hover:text-amber-200 transition-colors' : ''
                    }`}
                  >
                    {title}
                  </div>

                  {/* Expand button only if multiple lines */}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleTask(taskKey)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Tutup detail penugasan' : 'Lihat detail penugasan'}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#B45309] dark:text-[#FBBF24] hover:text-[#78350F] dark:hover:text-[#FDE68A] bg-[#FEF3C7]/60 dark:bg-[#261B06] px-2 py-0.5 rounded-md border border-[#FCD34D]/60 dark:border-[#523A0F] transition cursor-pointer select-none flex-shrink-0"
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
                  <div className="mt-2.5 pt-2 border-t border-[#FCD34D]/60 dark:border-[#382606] text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed bg-[#FFFBEB] dark:bg-[#140D04] p-2.5 rounded-lg border border-[#FDE68A] dark:border-[#382606] animate-fade-in font-normal">
                    {details}
                  </div>
                )}

                {/* Attachment Button */}
                {task.attachment && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenAttachment?.(task.attachment!, task.subject)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-[#122A1E] dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Lampiran: {task.attachment.filename || 'Lihat Gambar'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
