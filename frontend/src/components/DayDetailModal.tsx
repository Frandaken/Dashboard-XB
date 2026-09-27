import React, { useEffect, useState } from 'react';
import { X, Music, BookOpen } from 'lucide-react';
import { DoaSchedule, MbgSchedule, PiketSchedule, PeriodItem, TaskItem } from '../types';
import { DOW_ID, MONTH_ID } from '../data/demoData';
import { getSongForDate } from '../data/songSchedule';
import { TaskBanner } from './TaskBanner';
import { ScheduleBlocks } from './ScheduleBlocks';
import { SongLyricsModal } from './SongLyricsModal';

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
  const [showLyricsModal, setShowLyricsModal] = useState(false);

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

  const d = new Date(isoDate + 'T00:00:00');
  const dow = DOW_ID[d.getDay()];
  const formattedDate = `${dow}, ${d.getDate()} ${MONTH_ID[d.getMonth()]} ${d.getFullYear()}`;
  const daySong = getSongForDate(d);
  const hasSong = !!daySong.song && daySong.song !== '-' && daySong.song.toLowerCase() !== 'blank';

  return (
    <div
      id="day-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] dark:bg-[#161A20] text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#2E3744] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D2C5] dark:border-[#2E3744] bg-white dark:bg-[#1C212A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#2C4E3A] dark:bg-[#34D399] ring-2 ring-[#2C4E3A]/20" />
            <div>
              <h2
                id="day-detail-title"
                className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-white leading-tight"
              >
                {formattedDate}
              </h2>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup Rincian Hari"
            className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#252C37] hover:bg-stone-100 dark:hover:bg-[#2E3744] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content with smooth touch scrolling */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 min-h-0">
          {/* Lagu Nasional Minggu Ini */}
          <div
            onClick={() => {
              if (hasSong) setShowLyricsModal(true);
            }}
            role={hasSong ? 'button' : undefined}
            tabIndex={hasSong ? 0 : undefined}
            aria-label={hasSong ? `Buka lirik lagu ${daySong.song}` : undefined}
            onKeyDown={e => {
              if (hasSong && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setShowLyricsModal(true);
              }
            }}
            title={hasSong ? 'Klik untuk melihat lirik lagu' : undefined}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition select-none ${
              hasSong
                ? 'bg-white dark:bg-[#1C212A] border-[#D8D2C5] dark:border-[#2E3744] hover:border-[#2C4E3A] dark:hover:border-[#34D399] cursor-pointer shadow-xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]'
                : 'bg-white/60 dark:bg-[#1C212A]/60 border-[#D8D2C5]/60 dark:border-[#2E3744]/60 cursor-default'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                  hasSong
                    ? 'bg-[#DCFCE7] dark:bg-[#163825] text-[#14532D] dark:text-[#34D399]'
                    : 'bg-stone-200 dark:bg-[#2A313C] text-stone-400 dark:text-stone-500'
                }`}
              >
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block leading-tight">
                  Lagu Wajib (Minggu ke-{daySong.week})
                </span>
                <span
                  className={`text-sm font-bold truncate block leading-tight mt-0.5 ${
                    hasSong
                      ? 'text-stone-900 dark:text-white group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399]'
                      : 'text-stone-500 dark:text-stone-400 italic font-medium'
                  }`}
                >
                  {hasSong ? daySong.song : '— (Tidak ada lagu wajib / Kosong)'}
                </span>
              </div>
            </div>
            {hasSong && (
              <span className="text-xs font-bold text-[#14532D] dark:text-[#34D399] bg-[#DCFCE7] dark:bg-[#163825] px-3 py-1.5 rounded-lg border border-[#86EFAC] dark:border-[#2D5A3C] flex items-center gap-1.5 flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lirik</span>
              </span>
            )}
          </div>

          {/* Birthday Alert for this day */}
          {birthdays.length > 0 && (
            <div className="p-3 bg-[#FFEDD5] dark:bg-[#3D2218] border border-[#FDBA74] dark:border-[#6B3722] rounded-xl flex items-center gap-2.5">
              <span className="text-sm font-bold text-[#9A3412] dark:text-[#FDBA74]">
                🎂 Ulang tahun hari ini: <span className="font-extrabold">{birthdays.join(', ')}</span>
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

      {/* Pop Up Lirik Lagu */}
      {hasSong && (
        <SongLyricsModal
          isOpen={showLyricsModal}
          onClose={() => setShowLyricsModal(false)}
          songTitle={daySong.song}
          weekNumber={daySong.week}
        />
      )}
    </div>
  );
};
