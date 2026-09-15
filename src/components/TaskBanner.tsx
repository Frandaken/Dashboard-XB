import React from 'react';
import { TaskItem } from '../types';

interface TaskBannerProps {
  tasks: TaskItem[];
}

export const TaskBanner: React.FC<TaskBannerProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div
      id="task-banner-container"
      className="bg-[#FBF5E5] border border-[#E8D4A2] rounded-xl p-2.5 sm:p-3 shadow-2xs flex-shrink-0"
    >
      <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#E8D4A2]/70">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C99A3C] flex-shrink-0" />
        <h3 className="text-[#6B4F10] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          Penugasan & Ulangan Harian
          <span className="bg-[#C99A3C] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="space-y-1.5">
        {tasks.map((t, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 bg-white/95 border border-[#E8D4A2]/70 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs"
          >
            <span className="px-2 py-0.5 rounded bg-[#F6ECD4] text-[#6B4F10] font-bold text-[11px] border border-[#EDD9A4]/60 flex-shrink-0 mt-0.5">
              {t.subject}
            </span>
            {t.time && (
              <span className="text-[11px] text-stone-500 font-mono flex-shrink-0 mt-0.5">
                {t.time}
              </span>
            )}
            <span className="text-stone-900 font-semibold text-xs sm:text-sm leading-snug break-words flex-1 min-w-0">
              {t.task}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
