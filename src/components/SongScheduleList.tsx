import React, { useState } from 'react';
import { Music, Radio, BookOpen } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getSongForWeek, getWeekOfMonth } from '../data/songSchedule';
import { SongLyricsModal } from './SongLyricsModal';

interface SongScheduleListProps {
  viewYear: number;
  viewMonth: number;
  currentDate: Date;
  selectedISO?: string | null;
}

export const SongScheduleList: React.FC<SongScheduleListProps> = ({
  viewYear,
  viewMonth,
  currentDate,
  selectedISO
}) => {
  const [showLyricsModal, setShowLyricsModal] = useState(false);

  // Menentukan minggu aktif: berdasarkan tanggal yang dipilih di kalender atau tanggal hari ini
  let activeWeek = 1;
  const isCurrentMonth =
    viewYear === currentDate.getFullYear() && viewMonth === currentDate.getMonth();

  if (selectedISO) {
    const [selY, selM, selD] = selectedISO.split('-').map(Number);
    if (selY === viewYear && selM - 1 === viewMonth) {
      activeWeek = getWeekOfMonth(selY, selM - 1, selD);
    } else if (isCurrentMonth) {
      activeWeek = getWeekOfMonth(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
    }
  } else if (isCurrentMonth) {
    activeWeek = getWeekOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
  }

  const songTitle = getSongForWeek(viewMonth, activeWeek);
  const hasSong = songTitle && songTitle !== '-';

  const isCurrentWeek =
    isCurrentMonth &&
    activeWeek ===
      getWeekOfMonth(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );

  // Hitung rentang hari untuk minggu yang bersangkutan
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const weekDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (getWeekOfMonth(viewYear, viewMonth, d) === activeWeek) {
      weekDays.push(d);
    }
  }
  const dateRangeStr =
    weekDays.length > 0
      ? `${weekDays[0]} – ${weekDays[weekDays.length - 1]} ${MONTH_ID[viewMonth]}`
      : `${MONTH_ID[viewMonth]} ${viewYear}`;

  return (
    <>
      <div
        id="song-schedule-card"
        className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col gap-2 mt-2.5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E4DDCE]/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#EBF3EE] text-[#2C4E3A] flex items-center justify-center flex-shrink-0">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-[#2B2A28] leading-tight">
                Lagu Wajib Nasional
              </h3>
            </div>
          </div>

          {isCurrentWeek ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C6DEC0] text-[#1B4332] border border-[#A4C99D] flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse text-[#2C4E3A]" />
              <span>Minggu Ini</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              Minggu ke-{activeWeek}
            </span>
          )}
        </div>

        {/* Hanya lagu yang berlaku di minggu itu saja - Dapat diklik untuk memunculkan lirik */}
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
          className={`p-2.5 sm:p-3 rounded-xl border flex flex-col gap-1.5 transition select-none ${
            hasSong
              ? 'bg-[#FAF6EE] border-[#E4DDCE] hover:bg-[#F5EFE3] hover:border-[#2C4E3A]/40 cursor-pointer shadow-2xs group'
              : 'bg-stone-50/70 border-stone-200/60 cursor-default'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Minggu ke-{activeWeek} ({dateRangeStr})
            </span>
            {hasSong && (
              <span className="text-[10px] font-medium text-[#2C4E3A] group-hover:text-[#1B4332] flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Lihat Lirik</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-0.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                hasSong
                  ? 'bg-[#2C4E3A] text-white shadow-2xs group-hover:bg-[#223e2e]'
                  : 'bg-stone-200 text-stone-400'
              }`}
            >
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className={`font-display font-bold text-sm sm:text-base leading-tight truncate ${
                  hasSong
                    ? 'text-stone-900 group-hover:text-[#2C4E3A]'
                    : 'text-stone-400 font-normal italic'
                }`}
              >
                {hasSong ? songTitle : 'Tidak ada lagu wajib'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Pop Up Lirik Lagu */}
      {hasSong && (
        <SongLyricsModal
          isOpen={showLyricsModal}
          onClose={() => setShowLyricsModal(false)}
          songTitle={songTitle}
          weekNumber={activeWeek}
        />
      )}
    </>
  );
};
