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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF6EE] dark:bg-[#181B20] text-[#2B2A28] dark:text-[#E6EDF3] rounded-2xl border border-[#E4DDCE] dark:border-[#2D333B] shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4DDCE] dark:border-[#2D333B] bg-white dark:bg-[#1E2228]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2C4E3A] dark:bg-[#34D399]" />
            <div>
              <h2 className="font-display font-semibold text-lg sm:text-xl text-[#2B2A28] dark:text-white leading-tight">
                {formattedDate}
              </h2>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup Detail"
            className="w-8 h-8 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-100 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-500 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* Lagu Nasional Minggu Ini */}
          <div
            onClick={() => {
              if (hasSong) setShowLyricsModal(true);
            }}
            role={hasSong ? 'button' : undefined}
            tabIndex={hasSong ? 0 : undefined}
            onKeyDown={e => {
              if (hasSong && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setShowLyricsModal(true);
              }
            }}
            title={hasSong ? 'Klik untuk melihat lirik lagu' : undefined}
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition select-none ${
              hasSong
                ? 'bg-white dark:bg-[#1E2228] border-[#E4DDCE] dark:border-[#2D333B] hover:border-[#2C4E3A]/40 dark:hover:border-[#34D399]/40 cursor-pointer shadow-2xs group'
                : 'bg-white/60 dark:bg-[#1E2228]/60 border-[#E4DDCE]/60 dark:border-[#2D333B]/60 cursor-default'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                  hasSong
                    ? 'bg-[#2C4E3A] dark:bg-[#34D399] text-white dark:text-[#0F172A]'
                    : 'bg-stone-200 dark:bg-[#2A313C] text-stone-400 dark:text-stone-500'
                }`}
              >
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-normal uppercase tracking-wider text-stone-500 dark:text-stone-400 block leading-tight">
                  Lagu Wajib (Minggu ke-{daySong.week})
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold truncate block leading-tight ${
                    hasSong
                      ? 'text-stone-900 dark:text-white group-hover:text-[#2C4E3A] dark:group-hover:text-[#34D399]'
                      : 'text-stone-400 dark:text-stone-500 italic font-normal'
                  }`}
                >
                  {hasSong ? daySong.song : '— (Tidak ada lagu wajib / Kosong)'}
                </span>
              </div>
            </div>
            {hasSong && (
              <span className="text-xs font-medium text-[#2C4E3A] dark:text-[#34D399] bg-[#EBF3EE] dark:bg-[#1A3324] px-2.5 py-1 rounded-lg border border-[#C6DEC0] dark:border-[#2D5A3C] flex items-center gap-1.5 flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lirik</span>
              </span>
            )}
          </div>

          {/* Birthday Alert for this day (only if birthday exists) */}
          {birthdays.length > 0 && (
            <div className="p-2.5 bg-[#FBE6DA] dark:bg-[#3D2218] border border-[#F4CCA8] dark:border-[#5E3622] rounded-xl flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-[#8C3411] dark:text-[#FDBA74]">
                🎂 Ulang tahun hari ini: <span className="font-semibold">{birthdays.join(', ')}</span>
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
