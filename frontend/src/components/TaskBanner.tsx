import React from 'react';
import { Clock } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskBannerProps {
  tasks: TaskItem[];
}

export const TaskBanner: React.FC<TaskBannerProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div
      id="task-banner"
      className="bg-[#FFF8E7] dark:bg-[#261E10] border border-[#F0D597] dark:border-[#5E4416] rounded-xl p-2.5 sm:p-3 shadow-2xs flex flex-col gap-2 transition-colors flex-shrink-0"
    >
      <div className="flex items-center justify-between pb-1 border-b border-[#F0D597]/70 dark:border-[#5E4416]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] dark:bg-[#FBBF24] flex-shrink-0 animate-pulse" />
          <h3 className="font-medium text-xs uppercase tracking-wider text-[#92400E] dark:text-[#FDE68A]">
            Penugasan Pelajaran ({tasks.length})
          </h3>
        </div>
        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-[#3D2D12] text-[#92400E] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#6B501B]">
          Penting
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tasks.map((task, i) => (
          <div
            key={task.id || i}
            className="bg-white/95 dark:bg-[#1E2228] border border-[#F0D597]/80 dark:border-[#4B3714] rounded-lg p-2.5 flex flex-col justify-between shadow-2xs hover:bg-white dark:hover:bg-[#252B33] transition"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded bg-[#FEF3C7] dark:bg-[#3D2D12] text-[#92400E] dark:text-[#FDE68A] font-semibold text-xs border border-[#FDE68A] dark:border-[#6B501B]">
                {task.subject}
              </span>
              {task.time && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-normal text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-[#2A313C] px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-stone-400" />
                  {task.time}
                </span>
              )}
            </div>

            <div className="text-xs text-stone-800 dark:text-stone-200 font-normal whitespace-pre-line leading-relaxed">
              {task.taskText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
