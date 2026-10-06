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
      className="bg-[#FEF3C7] dark:bg-[#140D04] border border-[#FCD34D] dark:border-[#3D2808] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col gap-2.5 transition-colors flex-shrink-0"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-[#FCD34D]/80 dark:border-[#332206]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] dark:bg-[#FBBF24] flex-shrink-0 ring-2 ring-[#D97706]/30 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#78350F] dark:text-[#FDE68A] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Penugasan / Penilaian ({tasks.length})</span>
          </h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#261B06] text-[#78350F] dark:text-[#FDE68A] border border-[#FCD34D] dark:border-[#523A0F]">
          Penting
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
              className={`bg-white dark:bg-[#0A0A0A] border border-[#FCD34D]/80 dark:border-[#2C1F08] rounded-xl p-3 flex flex-col justify-between shadow-2xs transition ${
                hasDetails ? 'hover:border-[#D97706]' : ''
              }`}
            >
              <div>
                {/* Header row: Subject & Time */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#261B06] text-[#78350F] dark:text-[#FDE68A] font-bold text-xs border border-[#FCD34D] dark:border-[#523A0F]">
                    {task.subject}
                  </span>
                  {task.time && (
                    <span className="flex items-center gap-1 text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 bg-[#FAF7F2] dark:bg-[#141414] px-2 py-0.5 rounded-md border border-[#D8D2C5] dark:border-[#262626]">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {task.time}
                    </span>
                  )}
                </div>

                {/* Task Title (Line paling atas) */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={hasDetails ? () => toggleTask(taskKey) : undefined}
                    className={`text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-bold leading-snug flex-1 ${
                      hasDetails ? 'cursor-pointer hover:text-[#D97706] dark:hover:text-[#FBBF24] transition-colors' : ''
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
