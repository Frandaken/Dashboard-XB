import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { MONTH_ID } from '../data/demoData';
import { getWeekOfMonth, getSongForWeek } from '../data/songSchedule';

interface CalendarSectionProps {
  viewYear: number;
  viewMonth: number; // 0 - 11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  previewISO: string; // The active date currently being previewed
  todayISO: string;   // Today's real date in WIB
  selectedISO: string | null;
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
  previewISO,
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

  return (
    <div
      id="calendar-panel"
      className="bg-white dark:bg-[#1E2228] border border-[#E4DDCE] dark:border-[#2D333B] rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs transition-colors"
    >
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#E4DDCE]/70 dark:border-[#2D333B]">
          <div className="flex items-center gap-1.5">
            <CalIcon className="w-3.5 h-3.5 text-[#2C4E3A] dark:text-[#34D399]" />
            <h2 className="font-display font-semibold text-sm sm:text-base text-[#2B2A28] dark:text-white">
              Kalender
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="cal-btn-prev"
              onClick={onPrevMonth}
              aria-label="Bulan Sebelumnya"
              className="w-7 h-7 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-50 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-medium text-xs sm:text-sm text-stone-800 dark:text-stone-100 px-1.5 min-w-[95px] text-center font-display">
              {MONTH_ID[viewMonth]} {viewYear}
            </span>

            <button
              id="cal-btn-next"
              onClick={onNextMonth}
              aria-label="Bulan Berikutnya"
              className="w-7 h-7 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#252B33] hover:bg-stone-50 dark:hover:bg-[#2D343F] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="cal-btn-today"
              onClick={onToday}
              className="text-[11px] font-medium px-2 py-1 rounded-md border border-[#C6DEC0] dark:border-[#2C573A] bg-[#EBF3EE] dark:bg-[#1E3A29] text-[#2C4E3A] dark:text-[#6EE7B7] hover:bg-[#DCECE1] dark:hover:bg-[#264A35] transition ml-0.5 cursor-pointer active:scale-95"
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
              className={`text-[10px] sm:text-[11px] font-normal uppercase py-0.5 ${
                i === 0 ? 'text-[#C84B22] dark:text-[#FB7185]' : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid with compact responsive height */}
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="aspect-square h-6 sm:h-7 lg:h-7.5" />
          ))}

          {days.map(day => {
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = iso === todayISO;
            const isPreview = iso === previewISO;
            const hasData = hasDataFn(iso);
            const hasTask = hasTaskFn(iso);
            const birthdays = hasBirthdayFn(iso);
            const hasBday = birthdays.length > 0;

            let cellClass = 'relative aspect-square h-6 sm:h-7 lg:h-7.5 rounded-md flex flex-col items-center justify-center text-xs transition cursor-pointer select-none ';

            // Condition 1: BOTH Today AND Preview
            if (isToday && isPreview) {
              cellClass += 'bg-[#2C4E3A] dark:bg-[#245E3B] text-white font-semibold shadow-xs ring-2 ring-[#34D399] dark:ring-[#6EE7B7] z-10';
            }
            // Condition 2: TODAY (Real date, but user previewing another date)
            else if (isToday) {
              cellClass += 'bg-[#EBF3EE] dark:bg-[#163523] text-[#143425] dark:text-[#A7F3D0] border border-[#2C4E3A] dark:border-[#34D399] font-semibold';
            }
            // Condition 3: PREVIEW DATE (Sedang ditampilkan di dashboard)
            else if (isPreview) {
              cellClass += 'bg-[#FBE6DA] dark:bg-[#3D2218] text-[#8C3411] dark:text-[#FDBA74] border border-[#E0602F] dark:border-[#FB923C] font-semibold ring-1 ring-[#E0602F]/30 z-10';
            }
            // Condition 4: Has data (school schedule, doa, mbg, piket)
            else if (hasData) {
              cellClass += 'bg-[#FAF6EE]/80 dark:bg-[#252B33] text-stone-700 dark:text-stone-200 border border-[#E4DDCE]/70 dark:border-[#343D49] hover:bg-[#FAF6EE] dark:hover:bg-[#2F3642] font-normal';
            }
            // Condition 5: Normal empty day
            else {
              cellClass += 'text-stone-400 dark:text-stone-600 hover:bg-stone-50 dark:hover:bg-[#252B33]/50 border border-transparent font-normal';
            }

            const weekOfDate = getWeekOfMonth(viewYear, viewMonth, day);
            const songForDate = getSongForWeek(viewMonth, weekOfDate);

            let statusLabel = '';
            if (isToday && isPreview) statusLabel = ' (Hari Ini & Sedang Dipreview)';
            else if (isToday) statusLabel = ' (Hari Ini - Real Time)';
            else if (isPreview) statusLabel = ' (Sedang Dipreview di Dashboard)';

            return (
              <button
                key={iso}
                id={`cal-day-${iso}`}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={cellClass}
                title={`${day} ${MONTH_ID[viewMonth]} ${viewYear}${statusLabel} • Lagu: ${songForDate ? songForDate : 'Tidak ada'}${hasTask ? ' (Ada Tugas)' : ''}${hasBday ? ` (Ulang Tahun: ${birthdays.join(', ')})` : ''}`}
              >
                <span className="leading-none text-[11px] sm:text-xs">{day}</span>

                {/* Status indicator dots */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1">
                  {/* Task indicator dot */}
                  {hasTask && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday && isPreview ? 'bg-amber-300' : 'bg-[#C99A3C] dark:bg-[#FBBF24]'
                      }`}
                      title="Ada Tugas"
                    />
                  )}
                  {/* Birthday indicator dot */}
                  {hasBday && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday && isPreview ? 'bg-rose-300' : 'bg-[#E0602F] dark:bg-[#F87171]'
                      }`}
                      title="Ulang Tahun"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* CALENDAR LEGEND BAR */}
        <div className="mt-2 pt-1.5 border-t border-[#E4DDCE]/70 dark:border-[#2D333B] flex items-center justify-between flex-wrap gap-2 text-[10px] font-normal text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2C4E3A] dark:bg-[#34D399]" />
            <span>Hari Ini</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C99A3C] dark:bg-[#FBBF24]" />
            <span>Tugas</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0602F] dark:bg-[#F87171]" />
            <span>Ulang Tahun</span>
          </div>
        </div>
      </div>

      {/* Birthday Banner - ONLY DISPLAYED IF SOMEONE HAS BIRTHDAY TODAY */}
      {birthdaysToday && birthdaysToday.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-[#E4DDCE]/70 dark:border-[#2D333B]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#E0602F] dark:bg-[#FB923C]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C3411] dark:text-[#FDBA74]">
              Ulang Tahun Hari Ini
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {birthdaysToday.map((name, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-[#FBE6DA] dark:bg-[#3D2218] text-[#8C3411] dark:text-[#FDBA74] font-medium text-xs border border-[#F4CCA8]/70 dark:border-[#5C3322] flex items-center gap-1"
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
