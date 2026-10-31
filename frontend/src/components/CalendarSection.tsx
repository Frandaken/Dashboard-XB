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
  hasEventNoticeFn?: (iso: string) => boolean;
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
  hasEventNoticeFn,
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
      className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between transition-colors"
    >
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
          <h2 className="hidden sm:block font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight">
            Kalender
          </h2>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              id="cal-btn-prev"
              onClick={onPrevMonth}
              aria-label="Bulan Sebelumnya"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-editorial font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 px-1 sm:px-2 min-w-[76px] sm:min-w-[115px] text-center">
              <span className="inline sm:hidden">{MONTH_ID[viewMonth].slice(0, 3)} {viewYear}</span>
              <span className="hidden sm:inline">{MONTH_ID[viewMonth]} {viewYear}</span>
            </span>

            <button
              id="cal-btn-next"
              onClick={onNextMonth}
              aria-label="Bulan Berikutnya"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-100 dark:hover:bg-[#222429] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="cal-btn-today"
              onClick={onToday}
              aria-label="Lompat ke tanggal hari ini"
              className="text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-600/20 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-[#13281E] text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-[#1A382B] transition ml-1 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5" role="row">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <div
              key={d}
              role="columnheader"
              className={`w-full py-1 text-center text-xs sm:text-sm font-semibold flex items-center justify-center ${
                i === 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
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
            const hasNotice = hasEventNoticeFn ? hasEventNoticeFn(iso) : false;
            const birthdays = hasBirthdayFn(iso);
            const hasBday = birthdays.length > 0;

            let cellClass = 'relative w-full h-8 sm:h-9 rounded-md flex flex-col items-center justify-center text-xs transition cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F] ';

            // Condition 1: BOTH Today AND Preview
            if (isToday && isPreview) {
              cellClass += 'bg-[#1E3A2F] dark:bg-[#1E4A35] text-white font-semibold z-10';
            }
            // Condition 2: TODAY (Real date, user previewing another date)
            else if (isToday) {
              cellClass += 'bg-emerald-50 dark:bg-[#10291D] text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/40 font-semibold';
            }
            // Condition 3: PREVIEW DATE (Currently displayed in dashboard)
            else if (isPreview) {
              cellClass += 'bg-stone-200 dark:bg-stone-700/80 text-stone-900 dark:text-stone-100 font-semibold ring-1 ring-stone-400 dark:ring-stone-500 z-10';
            }
            // Condition 4: Has data (school schedule, notice, doa, mbg, piket)
            else if (hasData || hasNotice) {
              cellClass += 'bg-stone-50/80 dark:bg-[#141518] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1D1E22] font-medium';
            }
            // Condition 5: Normal empty day
            else {
              cellClass += 'text-stone-400 dark:text-stone-600 hover:bg-stone-50 dark:hover:bg-[#15161A] font-normal';
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
                title={`${day} ${MONTH_ID[viewMonth]} ${viewYear}${statusLabel} • Lagu: ${songForDate ? songForDate : 'Tidak ada'}${hasNotice ? ' (Ada Acara/Kegiatan)' : ''}${hasTask ? ' (Ada Tugas)' : ''}${hasBday ? ` (Ulang Tahun: ${birthdays.join(', ')})` : ''}`}
              >
                <span className="leading-none text-xs tabular-nums">{day}</span>

                {/* Status indicator dots */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1">
                  {/* Event Notice dot */}
                  {hasNotice && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday && isPreview ? 'bg-sky-200' : 'bg-sky-500 dark:bg-sky-400'
                      }`}
                      title="Ada Acara/Kegiatan"
                    />
                  )}
                  {/* Task indicator dot */}
                  {hasTask && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday && isPreview ? 'bg-amber-300' : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                      title="Ada Tugas"
                    />
                  )}
                  {/* Birthday indicator dot */}
                  {hasBday && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isToday && isPreview ? 'bg-rose-300' : 'bg-rose-500 dark:bg-rose-400'
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
        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E3A2F] dark:bg-[#34D399]" />
            <span>Hari Ini</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
            <span>Kegiatan</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>Tugas</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
            <span>Ultah</span>
          </div>
        </div>
      </div>

      {/* Birthday Banner */}
      {birthdaysToday && birthdaysToday.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
              Ulang Tahun Hari Ini
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {birthdaysToday.map((name, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-[#251016] text-rose-900 dark:text-rose-300 font-medium text-xs border border-rose-200/60 dark:border-rose-900/40 flex items-center gap-1"
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
