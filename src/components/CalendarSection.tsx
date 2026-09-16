import React from 'react';
import { ChevronLeft, ChevronRight, Music } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getWeekOfMonth, getSongForWeek } from '../data/songSchedule';

interface CalendarSectionProps {
  viewYear: number;
  viewMonth: number; // 0 - 11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedISO: string | null;
  todayISO: string;
  onSelectDate: (iso: string) => void;
  hasDataFn: (iso: string) => boolean;
  hasTaskFn: (iso: string) => boolean;
  hasBirthdayFn: (iso: string) => string[];
  birthdaysToday: string[];
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedISO,
  todayISO,
  onSelectDate,
  hasDataFn,
  hasTaskFn,
  hasBirthdayFn,
  birthdaysToday
}) => {
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const blanks = Array.from({ length: firstDow }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Menentukan nomor minggu dan lagu yang aktif di kalender
  let activeWeek = 1;
  if (selectedISO) {
    const [selY, selM, selD] = selectedISO.split('-').map(Number);
    if (selY === viewYear && selM - 1 === viewMonth) {
      activeWeek = getWeekOfMonth(selY, selM - 1, selD);
    }
  } else if (todayISO) {
    const [todY, todM, todD] = todayISO.split('-').map(Number);
    if (todY === viewYear && todM - 1 === viewMonth) {
      activeWeek = getWeekOfMonth(todY, todM - 1, todD);
    }
  }
  const songInView = getSongForWeek(viewMonth, activeWeek);

  return (
    <div
      id="calendar-panel"
      className="bg-white border border-[#E4DDCE] rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-2xs"
    >
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E4DDCE]/70">
          <h2 className="font-display font-semibold text-base sm:text-lg text-[#2B2A28]">
            Kalender
          </h2>

          <div className="flex items-center gap-1">
            <button
              id="cal-btn-prev"
              onClick={onPrevMonth}
              aria-label="Bulan Sebelumnya"
              className="w-8 h-8 rounded border border-[#E4DDCE] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-600 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-xs sm:text-sm text-stone-900 px-1.5 min-w-[105px] text-center font-display">
              {MONTH_ID[viewMonth]} {viewYear}
            </span>

            <button
              id="cal-btn-next"
              onClick={onNextMonth}
              aria-label="Bulan Berikutnya"
              className="w-8 h-8 rounded border border-[#E4DDCE] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-600 transition cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="cal-btn-today"
              onClick={onToday}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded border border-[#C6DEC0] bg-[#EBF3EE] text-[#2C4E3A] hover:bg-[#DCECE1] transition ml-1 cursor-pointer active:scale-95"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <div
              key={d}
              className={`text-[11px] font-bold uppercase py-0.5 ${
                i === 0 ? 'text-[#C84B22]' : 'text-stone-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="aspect-square min-h-[38px] sm:min-h-[42px]" />
          ))}

          {days.map(day => {
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = iso === todayISO;
            const isSelected = iso === selectedISO;
            const hasData = hasDataFn(iso);
            const hasTask = hasTaskFn(iso);
            const birthdays = hasBirthdayFn(iso);
            const hasBday = birthdays.length > 0;

            let cellClass = 'relative aspect-square min-h-[38px] sm:min-h-[42px] rounded-lg flex flex-col items-center justify-center font-semibold text-xs transition ';

            if (isToday) {
              cellClass += 'bg-[#2C4E3A] text-white shadow-xs';
            } else if (isSelected) {
              cellClass += 'bg-[#FBE6DA] text-[#8C3411] border border-[#E0602F] shadow-xs';
            } else if (hasData) {
              cellClass += 'bg-[#FAF6EE]/70 hover:bg-[#FAF6EE] text-stone-800 border border-[#E4DDCE]/60 cursor-pointer hover:border-stone-400';
            } else {
              cellClass += 'text-stone-300 border border-transparent';
            }

            const weekOfDate = getWeekOfMonth(viewYear, viewMonth, day);
            const songForDate = getSongForWeek(viewMonth, weekOfDate);

            return (
              <button
                key={iso}
                id={`cal-day-${iso}`}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={cellClass}
                title={`${day} ${MONTH_ID[viewMonth]} ${viewYear} • Lagu: ${songForDate !== '-' ? songForDate : 'Tidak ada lagu'}${hasTask ? ' (Ada Tugas)' : ''}${hasBday ? ` (Ulang Tahun: ${birthdays.join(', ')})` : ''}`}
              >
                <span>{day}</span>

                {/* Status indicator dots */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1">
                  {hasTask && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday ? 'bg-amber-300' : 'bg-[#C99A3C]'
                      }`}
                      title="Ada Penugasan / PR"
                    />
                  )}
                  {hasBday && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday ? 'bg-rose-300' : 'bg-[#E0602F]'
                      }`}
                      title="Ulang Tahun"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Lagu Nasional Minggu Ini (Di Dalam Kalender) */}
        <div className="mt-3 pt-2 border-t border-[#E4DDCE]/70">
          <div className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-[#FAF6EE] border border-[#E4DDCE]/70">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-[#EBF3EE] text-[#2C4E3A] flex items-center justify-center flex-shrink-0">
                <Music className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block leading-tight">
                  Lagu Minggu ke-{activeWeek}:
                </span>
                <span className="font-bold text-stone-900 text-xs truncate block leading-tight">
                  {songInView !== '-' ? songInView : '— (Tidak ada lagu wajib)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#2C4E3A] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#C6DEC0]/70 flex-shrink-0">
              1 Pekan
            </span>
          </div>
        </div>
      </div>

      {/* Birthday Banner - ONLY DISPLAYED IF SOMEONE HAS BIRTHDAY TODAY */}
      {birthdaysToday && birthdaysToday.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#E4DDCE]/70">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0602F]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C3411]">
              Ulang Tahun Hari Ini
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {birthdaysToday.map((name, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-[#FBE6DA] text-[#8C3411] font-semibold text-xs border border-[#F4CCA8]/70 flex items-center gap-1 shadow-2xs"
              >
                <span>🎂</span>
                <span>{name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
