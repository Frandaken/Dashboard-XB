import React, { useState } from 'react';
import { Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskBannerProps {
  tasks: TaskItem[];
}

export const TaskBanner: React.FC<TaskBannerProps> = ({ tasks }) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  if (!tasks || tasks.length === 0) return null;

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
            Penugasan &amp; Penilaian ({tasks.length})
          </h3>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/90 dark:bg-[#261B06] text-amber-900 dark:text-amber-300 border border-amber-300/50 dark:border-amber-800/50">
          Perlu Diperhatikan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {tasks.map((task, i) => {
          const taskKey = task.id || `task_${i}_${task.subject}`;
          const isExpanded = !!expandedTasks[taskKey];

          // Compute title & details
          const title = task.taskTitle || (task.taskText ? task.taskText.split('\n')[0] : '');
          const details = task.taskDetails || (task.taskText && task.taskText.includes('\n')
            ? task.taskText.split('\n').slice(1).join('\n').trim()
            : '');
          const hasDetails = task.hasDetails !== undefined ? task.hasDetails : !!details;

          return (
            <div
              key={taskKey}
              className={`bg-white dark:bg-[#141518] border border-amber-200/80 dark:border-amber-900/40 rounded-lg p-3 flex flex-col justify-between transition ${
                hasDetails ? 'hover:border-amber-400/80 dark:hover:border-amber-700/80' : ''
              }`}
            >
              <div>
                {/* Header row: Subject & Time */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/40 dark:border-amber-800/40">
                    {task.subject}
                  </span>
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
                    className={`text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-medium leading-snug flex-1 ${
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
                  <div className="mt-2.5 pt-2 border-t border-[#FCD34D]/60 dark:border-[#382606] text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed bg-[#FFFBEB] dark:bg-[#140D04] p-2.5 rounded-lg border border-[#FDE68A] dark:border-[#382606] animate-fade-in">
                    {details}
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
