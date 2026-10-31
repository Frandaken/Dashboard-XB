import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data kelas..."
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-visible lg:overflow-hidden pb-4 lg:pb-0 animate-pulse"
    >
      {/* LEFT: HERO TODAY SCHEDULE SKELETON (Col Span 7-8) */}
      <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-auto lg:h-full min-h-0 gap-2.5 w-full overflow-visible lg:overflow-hidden">
        {/* Date Title & Stepper Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-200/80 dark:border-stone-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Title Skeleton */}
            <div className="h-8 sm:h-9 w-60 sm:w-80 bg-stone-200/90 dark:bg-stone-800 rounded-lg" />
            {/* "Hari Ini" Badge Skeleton */}
            <div className="h-7 w-20 bg-emerald-100/70 dark:bg-[#122A1E] rounded-md border border-emerald-600/20 dark:border-emerald-500/30" />
          </div>

          {/* Steppers & Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Salin Agenda (Icon-only square button) */}
            <div className="w-9 h-9 rounded-lg bg-stone-200/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80" />
            {/* Tombol Sebelumnya */}
            <div className="h-9 w-28 rounded-lg bg-stone-200/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80" />
            {/* Tombol Berikutnya */}
            <div className="h-9 w-28 rounded-lg bg-stone-200/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80" />
          </div>
        </div>

        {/* Schedule Blocks Skeleton Grid */}
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* ROW 1: MBG & PIKET KEBERSIHAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
            {/* MBG Skeleton Card */}
            <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="h-5 w-44 bg-stone-200/90 dark:bg-stone-800 rounded" />
                <div className="h-4 w-24 bg-stone-100 dark:bg-stone-800 rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <div className="h-9 w-24 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
                <div className="h-9 w-28 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
                <div className="h-9 w-24 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
              </div>
            </div>

            {/* Piket Skeleton Card */}
            <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="h-5 w-36 bg-stone-200/90 dark:bg-stone-800 rounded" />
                <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200/60 dark:border-stone-700/50" />
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <div className="h-9 w-22 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
                <div className="h-9 w-26 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
                <div className="h-9 w-24 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60" />
              </div>
            </div>
          </div>

          {/* ROW 2: PETUGAS DOA & BACAAN INJIL */}
          <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex-shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800/60 flex-wrap">
              <div className="h-5 w-48 bg-stone-200/90 dark:bg-stone-800 rounded" />
              <div className="h-7 sm:h-8 w-40 bg-emerald-50/80 dark:bg-[#13281E] rounded-lg border border-emerald-600/25 dark:border-emerald-500/25" />
            </div>
            {/* 4 Mini-Boxes Liturgi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
              {[1, 2, 3, 4].map(idx => (
                <div
                  key={idx}
                  className="rounded-xl p-3 bg-stone-50/80 dark:bg-[#141518] border border-stone-200/70 dark:border-stone-800/70 flex flex-col justify-between gap-2"
                >
                  <div className="h-3.5 w-18 bg-stone-200 dark:bg-stone-800 rounded-xs" />
                  <div className="h-6 w-28 bg-stone-300 dark:bg-stone-700 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* ROW 3: JADWAL PELAJARAN (NEW RESPONSIVE MULTI-COLUMN GRID) */}
          <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-stone-100 dark:border-stone-800/60 flex-shrink-0">
              <div className="h-5 w-36 bg-stone-200/90 dark:bg-stone-800 rounded" />
              <div className="h-5 w-28 bg-stone-100 dark:bg-stone-800/70 rounded-md border border-stone-200/60 dark:border-stone-700/50" />
            </div>

            {/* Grid of session cards matching ScheduleBlocks.tsx */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 overflow-hidden flex-1 pt-1 pr-1">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-[#141518] flex flex-col justify-between gap-2.5 h-[108px]"
                >
                  {/* Sesi badge + Time */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-md bg-stone-200/90 dark:bg-stone-800" />
                      <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
                    </div>
                  </div>
                  {/* Subject Name & Detail */}
                  <div className="space-y-1.5">
                    <div className="h-5 w-4/5 bg-stone-200/90 dark:bg-stone-700/80 rounded" />
                    <div className="h-3.5 w-1/2 bg-stone-200/70 dark:bg-stone-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: ASIDE SKELETON (Col Span 4-5) */}
      <aside className="lg:col-span-5 xl:col-span-4 flex flex-col h-auto lg:h-full min-h-0 w-full justify-between gap-2.5 overflow-visible lg:overflow-hidden">
        {/* Calendar Section Skeleton */}
        <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            {/* Calendar header with Prev, Month, Next, Hari Ini */}
            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
              <div className="hidden sm:block h-5 w-24 bg-stone-200/90 dark:bg-stone-800 rounded" />
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="w-8 h-8 rounded-lg bg-stone-200/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80" />
                <div className="h-5 w-28 bg-stone-200/90 dark:bg-stone-800 rounded px-1" />
                <div className="w-8 h-8 rounded-lg bg-stone-200/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80" />
                <div className="h-8 w-18 rounded-lg bg-emerald-50/80 dark:bg-[#13281E] border border-emerald-600/20 dark:border-emerald-500/30 ml-1" />
              </div>
            </div>

            {/* Day names row (Min, Sen, Sel, Rab, Kam, Jum, Sab) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} className="h-4 bg-stone-100 dark:bg-stone-800 rounded-xs mx-auto w-7" />
              ))}
            </div>

            {/* Calendar days grid (5 rows x 7 cols) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 content-start">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg sm:rounded-xl bg-stone-50 dark:bg-[#141518] border border-stone-200/40 dark:border-stone-800/40"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Song of the Week Skeleton Card */}
        <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-3 sm:p-3.5 mt-2 flex flex-col gap-2.5 transition-colors shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800/60">
            <div className="h-5 w-44 bg-stone-200/90 dark:bg-stone-800 rounded" />
            <div className="h-5 w-36 bg-stone-100 dark:bg-stone-800/70 rounded-md border border-stone-200/60 dark:border-stone-700/50" />
          </div>
          {/* Song Card Body */}
          <div className="rounded-xl p-3 sm:p-3.5 bg-stone-50/80 dark:bg-[#141518] border border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-stone-200 dark:bg-stone-800 flex-shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-4 w-36 sm:w-48 bg-stone-300 dark:bg-stone-700 rounded-xs" />
                <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded-xs" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-stone-200/90 dark:bg-stone-800 flex-shrink-0 border border-stone-200/80 dark:border-stone-800/80" />
          </div>
        </div>
      </aside>
    </div>
  );
};
