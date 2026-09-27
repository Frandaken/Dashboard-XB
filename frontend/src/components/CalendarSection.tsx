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
  // Use UTC noon to safely calculate first day of week and days in month without client timezone offset
  const firstDow = new Date(Date.UTC(viewYear, viewMonth, 1, 12, 0, 0)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0, 12, 0, 0)).getUTCDate();

  const blanks = Array.from({ length: firstDow }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      id="calendar-panel"
      className="bg-white dark:bg-[#181C23] border border-[#D8D2C5] dark:border-[#2E3744] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs transition-colors"
    >
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E8E2D5] dark:border-[#2E3744]">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-[#2C4E3A] dark:text-[#34D399]" />
            <h2 className="font-display font-bold text-sm sm:text-base text-stone-900 dark:text-white">
              Kalender
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="cal-btn-prev"
              onClick={onPrevMonth}
              aria-label="Bulan Sebelumnya"
              className="w-8 h-8 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#202630] hover:bg-stone-100 dark:hover:bg-[#2D3542] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-50 px-2 min-w-[105px] text-center font-display">
              {MONTH_ID[viewMonth]} {viewYear}
            </span>

            <button
              id="cal-btn-next"
              onClick={onNextMonth}
              aria-label="Bulan Berikutnya"
              className="w-8 h-8 rounded-lg border border-[#D8D2C5] dark:border-[#3A4555] bg-white dark:bg-[#202630] hover:bg-stone-100 dark:hover:bg-[#2D3542] flex items-center justify-center text-stone-700 dark:text-stone-200 transition cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="cal-btn-today"
              onClick={onToday}
              aria-label="Lompat ke tanggal hari ini"
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-[#86EFAC] dark:border-[#2C573A] bg-[#DCFCE7] dark:bg-[#1E3A29] text-[#14532D] dark:text-[#6EE7B7] hover:bg-[#BBF7D0] dark:hover:bg-[#264A35] transition ml-1 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Days of Week - Full width column header perfectly aligned with days grid below */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1" role="row">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <div
              key={d}
              role="columnheader"
              className={`w-full py-1 text-center text-[11px] sm:text-xs font-bold uppercase flex items-center justify-center ${
                i === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid - Each cell is w-full to guarantee 100% strict vertical column alignment */}
        <div className="grid grid-cols-7 gap-1" role="grid">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="w-full h-8 sm:h-9" aria-hidden="true" />
          ))}

          {days.map(day => {
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = iso === todayISO;
            const isPreview = iso === previewISO;
            const hasData = hasDataFn(iso);
            const hasTask = hasTaskFn(iso);
            const birthdays = hasBirthdayFn(iso);
            const hasBday = birthdays.length > 0;

            let cellClass = 'relative w-full h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center text-xs transition cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A] ';

            // Condition 1: BOTH Today AND Preview
            if (isToday && isPreview) {
              cellClass += 'bg-[#2C4E3A] dark:bg-[#20623D] text-white font-bold shadow-xs ring-2 ring-[#34D399] z-10';
            }
            // Condition 2: TODAY (Real date, user previewing another date)
            else if (isToday) {
              cellClass += 'bg-[#DCFCE7] dark:bg-[#163825] text-[#14532D] dark:text-[#A7F3D0] border-2 border-[#16A34A] dark:border-[#34D399] font-bold';
            }
            // Condition 3: PREVIEW DATE (Currently displayed in dashboard)
            else if (isPreview) {
              cellClass += 'bg-[#FFEDD5] dark:bg-[#3E2419] text-[#9A3412] dark:text-[#FDBA74] border-2 border-[#EA580C] dark:border-[#FB923C] font-bold ring-1 ring-[#EA580C]/40 z-10';
            }
            // Condition 4: Has data (school schedule, doa, mbg, piket)
            else if (hasData) {
              cellClass += 'bg-[#FAF7F2] dark:bg-[#202630] text-stone-900 dark:text-stone-100 border border-[#D8D2C5] dark:border-[#343E4E] hover:bg-stone-200 dark:hover:bg-[#2B3442] font-semibold';
            }
            // Condition 5: Normal empty day
            else {
              cellClass += 'text-stone-500 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-[#202630] border border-transparent font-normal';
            }

            const weekOfDate = getWeekOfMonth(viewYear, viewMonth, day);
            const songForDate = getSongForWeek(viewMonth, weekOfDate);

            let statusLabel = '';
            if (isToday && isPreview) statusLabel = ' (Hari Ini & Sedang Ditampilkan)';
            else if (isToday) statusLabel = ' (Hari Ini)';
            else if (isPreview) statusLabel = ' (Sedang Ditampilkan)';

            return (
              <button
                key={iso}
                id={`cal-day-${iso}`}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={cellClass}
                aria-label={`${day} ${MONTH_ID[viewMonth]} ${viewYear}${statusLabel}`}
                title={`${day} ${MONTH_ID[viewMonth]} ${viewYear}${statusLabel} • Lagu: ${songForDate ? songForDate : 'Tidak ada'}${hasTask ? ' (Ada Tugas)' : ''}${hasBday ? ` (Ulang Tahun: ${birthdays.join(', ')})` : ''}`}
              >
                <span className="leading-none text-xs font-semibold">{day}</span>

                {/* Status indicator dots */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {/* Task indicator dot */}
                  {hasTask && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isToday && isPreview ? 'bg-amber-300' : 'bg-[#D97706] dark:bg-[#FBBF24]'
                      }`}
                      title="Ada Tugas"
                    />
                  )}
                  {/* Birthday indicator dot */}
                  {hasBday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isToday && isPreview ? 'bg-rose-300' : 'bg-[#E11D48] dark:bg-[#FB7185]'
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
        <div className="mt-2.5 pt-2 border-t border-[#E8E2D5] dark:border-[#2E3744] flex items-center justify-between flex-wrap gap-2 text-[11px] font-medium text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2C4E3A] dark:bg-[#34D399]" />
            <span>Hari Ini</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] dark:bg-[#FBBF24]" />
            <span>Ada Tugas</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] dark:bg-[#FB7185]" />
            <span>Ulang Tahun</span>
          </div>
        </div>
      </div>

      {/* Birthday Banner - ONLY DISPLAYED IF SOMEONE HAS BIRTHDAY TODAY */}
      {birthdaysToday && birthdaysToday.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#E8E2D5] dark:border-[#2E3744]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] dark:bg-[#FB923C]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A3412] dark:text-[#FDBA74]">
              Ulang Tahun Hari Ini
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {birthdaysToday.map((name, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-[#FFEDD5] dark:bg-[#3D2218] text-[#9A3412] dark:text-[#FDBA74] font-semibold text-xs border border-[#FDBA74] dark:border-[#5C3322] flex items-center gap-1"
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
