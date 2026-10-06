import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data kelas..."
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-visible lg:overflow-hidden pb-4 lg:pb-0 animate-pulse"
    >
      {/* LEFT: HERO TODAY SCHEDULE SKELETON (Col Span 7-8) */}
      <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-auto lg:h-full min-h-0 gap-2.5 w-full">
        {/* Date Title & Stepper skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D8D2C5] dark:border-[#222222] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-[#262626]" />
            <div className="h-6 w-48 sm:w-60 bg-stone-200 dark:bg-[#1A1A1A] rounded-lg" />
            <div className="h-5 w-16 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-24 bg-stone-200 dark:bg-[#1A1A1A] rounded-lg" />
            <div className="h-8 w-24 bg-stone-200 dark:bg-[#1A1A1A] rounded-lg" />
          </div>
        </div>

        {/* Notice banner skeleton */}
        <div className="h-10 w-full bg-stone-200/80 dark:bg-[#121212] rounded-xl border border-[#D8D2C5]/60 dark:border-[#222222] flex items-center px-3.5 gap-2.5 flex-shrink-0">
          <div className="w-4 h-4 rounded-full bg-stone-300 dark:bg-[#262626]" />
          <div className="h-3.5 w-3/4 bg-stone-300/80 dark:bg-[#1A1A1A] rounded-md" />
        </div>

        {/* Schedule Blocks Skeleton Grid */}
        <div className="flex flex-col gap-2.5 flex-1 min-h-0">
          {/* Row 1: MBG & Piket */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-shrink-0">
            {/* MBG Skeleton Card */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-start">
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222]">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-[#262626]" />
                <div className="h-3.5 w-36 bg-stone-200 dark:bg-[#1A1A1A] rounded-sm" />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="h-6 w-20 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
                <div className="h-6 w-24 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
                <div className="h-6 w-16 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
              </div>
            </div>

            {/* Piket Skeleton Card */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-start">
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E8E2D5] dark:border-[#222222]">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-[#262626]" />
                <div className="h-3.5 w-32 bg-stone-200 dark:bg-[#1A1A1A] rounded-sm" />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="h-6 w-20 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
                <div className="h-6 w-22 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
                <div className="h-6 w-18 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
              </div>
            </div>
          </div>

          {/* Row 2: Doa & Bacaan Injil */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex-shrink-0">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E8E2D5] dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-[#262626]" />
                <div className="h-3.5 w-40 bg-stone-200 dark:bg-[#1A1A1A] rounded-sm" />
              </div>
              <div className="h-4 w-28 bg-stone-200 dark:bg-[#1A1A1A] rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="h-10 bg-stone-100 dark:bg-[#141414] rounded-lg border border-transparent dark:border-[#222222]" />
              <div className="h-10 bg-stone-100 dark:bg-[#141414] rounded-lg border border-transparent dark:border-[#222222]" />
            </div>
          </div>

          {/* Row 3: Jadwal Pelajaran */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8E2D5] dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-[#262626]" />
                <div className="h-3.5 w-36 bg-stone-200 dark:bg-[#1A1A1A] rounded-sm" />
              </div>
              <div className="h-5 w-24 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
            </div>
            <div className="space-y-2 flex-1 pt-1 overflow-hidden">
              {[1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className="h-11 bg-stone-50 dark:bg-[#121212] rounded-lg border border-[#E8E2D5]/50 dark:border-[#222222] flex items-center justify-between px-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-[#1E1E1E]" />
                    <div className="h-3.5 w-32 sm:w-44 bg-stone-200 dark:bg-[#1E1E1E] rounded-sm" />
                  </div>
                  <div className="h-3 w-20 bg-stone-200 dark:bg-[#1E1E1E] rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: ASIDE SKELETON (Col Span 4-5) */}
      <aside className="lg:col-span-5 xl:col-span-4 flex flex-col h-auto lg:h-full min-h-0 w-full justify-between gap-2.5">
        {/* Calendar Section Skeleton */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col flex-1">
          {/* Calendar header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E2D5] dark:border-[#222222] mb-3">
            <div className="h-5 w-32 bg-stone-200 dark:bg-[#1A1A1A] rounded-md" />
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-[#1A1A1A]" />
              <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-[#1A1A1A]" />
            </div>
          </div>
          {/* Day names row */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <div key={d} className="h-4 bg-stone-200 dark:bg-[#1A1A1A] rounded-xs mx-auto w-6" />
            ))}
          </div>
          {/* Calendar days grid (5 rows x 7 cols) */}
          <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-stone-100 dark:bg-[#121212] border border-[#E8E2D5]/40 dark:border-[#222222]"
              />
            ))}
          </div>
        </div>

        {/* Song of the Week Skeleton Card */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#D8D2C5] dark:border-[#222222] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D5] dark:border-[#222222]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-[#1A1A1A]" />
              <div className="h-3.5 w-32 bg-stone-200 dark:bg-[#1A1A1A] rounded-sm" />
            </div>
            <div className="h-5 w-24 bg-stone-200 dark:bg-[#1A1A1A] rounded-full" />
          </div>
          <div className="h-12 bg-stone-50 dark:bg-[#121212] rounded-xl border border-[#D8D2C5]/50 dark:border-[#222222] flex items-center justify-between px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-6 rounded-md bg-stone-200 dark:bg-[#1A1A1A]" />
              <div className="space-y-1">
                <div className="h-2.5 w-20 bg-stone-200 dark:bg-[#1A1A1A] rounded-xs" />
                <div className="h-3.5 w-32 bg-stone-300 dark:bg-[#262626] rounded-xs" />
              </div>
            </div>
            <div className="h-7 w-16 bg-stone-200 dark:bg-[#1A1A1A] rounded-lg" />
          </div>
        </div>
      </aside>
    </div>
  );
};
