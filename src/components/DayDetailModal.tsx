import React, { useEffect } from 'react';
import { X, Music } from 'lucide-react';
import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, TaskItem } from '../types';
import { DOW_ID, MONTH_ID } from '../data/demoData';
import { getSongForDate } from '../data/songSchedule';
import { TaskBanner } from './TaskBanner';
import { ScheduleBlocks } from './ScheduleBlocks';

interface DayDetailModalProps {
  isoDate: string | null;
  onClose: () => void;
  doa?: DoaSchedule;
  mbg?: MbgSchedule;
  piket?: PiketSchedule;
  pelajaran?: PeriodItem[];
  tasks?: TaskItem[];
  birthdays?: string[];
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isoDate,
  onClose,
  doa,
  mbg,
  piket,
  pelajaran = [],
  tasks = [],
  birthdays = []
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isoDate) return null;

  const d = new Date(isoDate + 'T00:00:00');
  const dow = DOW_ID[d.getDay()];
  const formattedDate = `${dow}, ${d.getDate()} ${MONTH_ID[d.getMonth()]} ${d.getFullYear()}`;
  const daySong = getSongForDate(d);

  return (
    <div
      id="day-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/50 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF6EE] rounded-xl border border-[#E4DDCE] shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4DDCE] bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2C4E3A]" />
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#2B2A28] leading-tight">
                {formattedDate}
              </h2>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup Detail"
            className="w-7 h-7 rounded-lg border border-[#E4DDCE] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-3">
          {/* Lagu Nasional Minggu Ini */}
          <div className="p-2.5 bg-[#FAF6EE] border border-[#E4DDCE] rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#EBF3EE] text-[#2C4E3A] flex items-center justify-center flex-shrink-0">
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block leading-tight">
                  Lagu Wajib (Minggu ke-{daySong.week})
                </span>
                <span className="text-xs font-bold text-stone-900 truncate block leading-tight">
                  {daySong.song !== '-' ? daySong.song : '— (Tidak ada lagu wajib)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-medium text-stone-600 bg-white px-2 py-0.5 rounded border border-[#E4DDCE] flex-shrink-0">
              1 Pekan
            </span>
          </div>

          {/* Birthday Alert for this day (only if birthday exists) */}
          {birthdays.length > 0 && (
            <div className="p-2.5 bg-[#FBE6DA] border border-[#F4CCA8] rounded-xl flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C3411]">
                🎂 Ulang tahun hari ini: <span className="font-bold">{birthdays.join(', ')}</span>
              </span>
            </div>
          )}

          {/* Penugasan Banner (if any) */}
          {tasks.length > 0 && (
            <TaskBanner tasks={tasks} />
          )}

          {/* Schedule Blocks */}
          <ScheduleBlocks
            mbg={mbg}
            piket={piket}
            doa={doa}
            pelajaran={pelajaran}
            dowName={dow}
          />
        </div>
      </div>
    </div>
  );
};
