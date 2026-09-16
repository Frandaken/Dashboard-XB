import React from 'react';
import { Music, Radio } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getSongsForMonth, getWeekOfMonth } from '../data/songSchedule';

interface SongScheduleListProps {
  viewYear: number;
  viewMonth: number;
  currentDate: Date;
}

export const SongScheduleList: React.FC<SongScheduleListProps> = ({
  viewYear,
  viewMonth,
  currentDate
}) => {
  const songs = getSongsForMonth(viewMonth);
  const isCurrentMonth =
    viewYear === currentDate.getFullYear() && viewMonth === currentDate.getMonth();
  const currentWeek = isCurrentMonth
    ? getWeekOfMonth(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    : null;

  return (
    <div
      id="song-schedule-card"
      className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col gap-2.5 mt-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4DDCE]/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#EBF3EE] text-[#2C4E3A] flex items-center justify-center flex-shrink-0">
            <Music className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-[#2B2A28] leading-tight">
              Lagu Nasional Mingguan
            </h3>
            <p className="text-[10px] text-stone-500 leading-none mt-0.5">
              1 lagu berlaku selama 1 minggu
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
          {MONTH_ID[viewMonth]} {viewYear}
        </span>
      </div>

      {/* Week-by-Week Song Items */}
      <div className="grid grid-cols-1 gap-1.5">
        {songs.map(item => {
          const isActive = isCurrentMonth && currentWeek === item.week;
          const hasSong = item.isAvailable;

          let itemClass =
            'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition border ';

          if (isActive) {
            itemClass +=
              'bg-[#EBF3EE] border-[#B7D8C0] text-[#1B4332] font-semibold shadow-2xs ring-1 ring-[#2C4E3A]/20';
          } else if (hasSong) {
            itemClass += 'bg-[#FAF6EE]/70 border-[#E4DDCE]/60 text-stone-800 hover:bg-[#FAF6EE]';
          } else {
            itemClass += 'bg-stone-50/50 border-stone-100 text-stone-400';
          }

          return (
            <div key={item.week} className={itemClass}>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 font-mono ${
                    isActive
                      ? 'bg-[#2C4E3A] text-white'
                      : hasSong
                      ? 'bg-[#EAE4D7] text-stone-700'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  Mg {item.week}
                </span>

                <span className={`truncate text-xs ${isActive ? 'font-bold text-[#1B4332]' : ''}`}>
                  {hasSong ? item.title : '— (Tidak ada lagu wajib)'}
                </span>
              </div>

              {isActive && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#C6DEC0] text-[#1B4332] flex items-center gap-1 flex-shrink-0">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-[#2C4E3A]" />
                  <span>Minggu Ini</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
