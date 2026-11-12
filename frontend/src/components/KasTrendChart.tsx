import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Scale
} from 'lucide-react';
import {
  KasWeekColumn,
  KasStudentEntry,
  KasPengeluaranItem,
  KasPendapatanLainItem,
  KasRekapSummary
} from '../types';

interface KasTrendChartProps {
  weeks: KasWeekColumn[];
  students: KasStudentEntry[];
  pengeluaranList: KasPengeluaranItem[];
  pendapatanLainList: KasPendapatanLainItem[];
  rekapSummary?: KasRekapSummary;
  darkMode?: boolean;
}

interface MonthlyOption {
  key: string;       // e.g. "Okt 26"
  label: string;     // e.g. "Oktober 2026"
  shortLabel: string;// e.g. "Okt"
  monthNum: number;  // 1 - 12
  year: number;      // e.g. 2026
}

const MONTH_CATALOG: MonthlyOption[] = [
  { key: 'Jul 26', label: 'Juli 2026', shortLabel: 'Juli', monthNum: 7, year: 2026 },
  { key: 'Agu 26', label: 'Agustus 2026', shortLabel: 'Agustus', monthNum: 8, year: 2026 },
  { key: 'Sep 26', label: 'September 2026', shortLabel: 'September', monthNum: 9, year: 2026 },
  { key: 'Okt 26', label: 'Oktober 2026', shortLabel: 'Oktober', monthNum: 10, year: 2026 },
  { key: 'Nov 26', label: 'November 2026', shortLabel: 'November', monthNum: 11, year: 2026 },
  { key: 'Des 26', label: 'Desember 2026', shortLabel: 'Desember', monthNum: 12, year: 2026 },
];

function parseFlexibleDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    return {
      day: parseInt(dmy[1], 10),
      month: parseInt(dmy[2], 10),
      year: parseInt(dmy[3], 10)
    };
  }
  // Format YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    return {
      year: parseInt(ymd[1], 10),
      month: parseInt(ymd[2], 10),
      day: parseInt(ymd[3], 10)
    };
  }
  return null;
}

function formatRupiah(val: number): string {
  return `Rp ${val.toLocaleString('id-ID')}`;
}

function formatCompactRupiah(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}jt`;
  }
  if (Math.abs(val) >= 1_000) {
    return `${Math.round(val / 1_000)}rb`;
  }
  return val.toString();
}

export const KasTrendChart: React.FC<KasTrendChartProps> = ({
  weeks,
  students,
  pengeluaranList,
  pendapatanLainList,
  rekapSummary,
  darkMode = false
}) => {
  // Determine current active month in school kas
  const activeMonthKey = useMemo(() => {
    // 1. Look for the latest week that is elapsed
    const elapsedWeeks = weeks.filter(w => w.isElapsed);
    if (elapsedWeeks.length > 0) {
      const lastWeek = elapsedWeeks[elapsedWeeks.length - 1];
      if (lastWeek && lastWeek.monthName) {
        return lastWeek.monthName;
      }
    }
    // 2. Default to November or first month
    return 'Nov 26';
  }, [weeks]);

  // View state: 'current' (Bulan Berjalan), or specific month key, or 'semester' (Semua Bulan)
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonthKey);
  const [viewMode, setViewMode] = useState<'month' | 'semester'>('month');

  // Sync selectedMonth if activeMonthKey resolves later
  useEffect(() => {
    if (activeMonthKey && !selectedMonth) {
      setSelectedMonth(activeMonthKey);
    }
  }, [activeMonthKey, selectedMonth]);

  // Current selected month info
  const currentMonthInfo = useMemo(() => {
    return (
      MONTH_CATALOG.find(m => m.key === selectedMonth) || {
        key: selectedMonth,
        label: selectedMonth,
        shortLabel: selectedMonth,
        monthNum: 11,
        year: 2026
      }
    );
  }, [selectedMonth]);

  // Build weekly chart data for the selected month
  const weeklyChartData = useMemo(() => {
    const targetWeeks = weeks.filter(w => w.monthName === selectedMonth);
    if (targetWeeks.length === 0) return [];

    return targetWeeks.map((w, idx) => {
      // 1. Pemasukan Iuran Siswa pada minggu ini
      const iuranMinggu = students.reduce((sum, s) => {
        return sum + (s.payments[w.colIndex] || 0);
      }, 0);

      // Parse week date range
      const wDate = parseFlexibleDate(w.isoDate);
      const weekDay = wDate ? wDate.day : parseInt(w.dateStr, 10) || 0;
      const weekMonth = wDate ? wDate.month : currentMonthInfo.monthNum;
      const weekYear = wDate ? wDate.year : currentMonthInfo.year;

      // Lower and upper day threshold for transactions in this week slot (approx ±3 days)
      const prevWeek = targetWeeks[idx - 1];
      const nextWeek = targetWeeks[idx + 1];
      const prevDay = prevWeek ? (parseFlexibleDate(prevWeek.isoDate)?.day ?? 0) : 1;
      const nextDay = nextWeek ? (parseFlexibleDate(nextWeek.isoDate)?.day ?? 31) : 31;

      const minDay = idx === 0 ? 1 : Math.floor((prevDay + weekDay) / 2) + 1;
      const maxDay = idx === targetWeeks.length - 1 ? 31 : Math.floor((weekDay + nextDay) / 2);

      // 2. Pendapatan Lain yang jatuh pada minggu ini
      const pendapatanLainMinggu = pendapatanLainList.filter(item => {
        const pDate = parseFlexibleDate(item.tanggal);
        if (!pDate) return false;
        return (
          pDate.year === weekYear &&
          pDate.month === weekMonth &&
          pDate.day >= minDay &&
          pDate.day <= maxDay
        );
      }).reduce((sum, item) => sum + item.jumlah, 0);

      const totalPemasukan = iuranMinggu + pendapatanLainMinggu;

      // 3. Pengeluaran yang jatuh pada minggu ini
      const totalPengeluaran = pengeluaranList.filter(item => {
        const pDate = parseFlexibleDate(item.tanggal);
        if (!pDate) return false;
        return (
          pDate.year === weekYear &&
          pDate.month === weekMonth &&
          pDate.day >= minDay &&
          pDate.day <= maxDay
        );
      }).reduce((sum, item) => sum + item.hargaTotal, 0);

      return {
        name: `Mgg ${idx + 1}`,
        fullName: `Minggu ${idx + 1} (${w.label})`,
        tanggal: w.label,
        pemasukan: totalPemasukan,
        pengeluaran: totalPengeluaran,
        selisih: totalPemasukan - totalPengeluaran,
        iuran: iuranMinggu,
        pendapatanLain: pendapatanLainMinggu
      };
    });
  }, [weeks, students, selectedMonth, pengeluaranList, pendapatanLainList, currentMonthInfo]);

  // Build semester-wide monthly chart data
  const semesterChartData = useMemo(() => {
    return MONTH_CATALOG.map(catalog => {
      // Pemasukan iuran dari seluruh minggu dalam bulan ini
      const monthWeeks = weeks.filter(w => w.monthName === catalog.key);
      const totalIuran = monthWeeks.reduce((acc, w) => {
        const weekSum = students.reduce((sum, s) => sum + (s.payments[w.colIndex] || 0), 0);
        return acc + weekSum;
      }, 0);

      // Pendapatan lain di bulan ini
      const totalPendapatanLain = pendapatanLainList.filter(item => {
        const pDate = parseFlexibleDate(item.tanggal);
        return pDate && pDate.month === catalog.monthNum && pDate.year === catalog.year;
      }).reduce((sum, item) => sum + item.jumlah, 0);

      const totalPemasukan = totalIuran + totalPendapatanLain;

      // Pengeluaran di bulan ini (utamakan dari rekapSummary jika tersedia, fallback ke pengeluaranList)
      const rekapBulan = rekapSummary?.pengeluaranPerBulan?.find(r =>
        r.bulan.toLowerCase().includes(catalog.shortLabel.toLowerCase())
      );

      let totalPengeluaran = 0;
      if (rekapBulan && rekapBulan.nominal > 0) {
        totalPengeluaran = rekapBulan.nominal;
      } else {
        totalPengeluaran = pengeluaranList.filter(item => {
          const pDate = parseFlexibleDate(item.tanggal);
          return pDate && pDate.month === catalog.monthNum && pDate.year === catalog.year;
        }).reduce((sum, item) => sum + item.hargaTotal, 0);
      }

      return {
        name: catalog.shortLabel,
        fullName: catalog.label,
        pemasukan: totalPemasukan,
        pengeluaran: totalPengeluaran,
        selisih: totalPemasukan - totalPengeluaran
      };
    });
  }, [weeks, students, pendapatanLainList, pengeluaranList, rekapSummary]);

  // Active data for chart rendering
  const activeData = viewMode === 'month' ? weeklyChartData : semesterChartData;

  // Month summary aggregates
  const monthTotals = useMemo(() => {
    if (viewMode === 'month') {
      const pemasukan = weeklyChartData.reduce((acc, d) => acc + d.pemasukan, 0);
      const pengeluaran = weeklyChartData.reduce((acc, d) => acc + d.pengeluaran, 0);
      const selisih = pemasukan - pengeluaran;
      return { pemasukan, pengeluaran, selisih };
    } else {
      const pemasukan = semesterChartData.reduce((acc, d) => acc + d.pemasukan, 0);
      const pengeluaran = semesterChartData.reduce((acc, d) => acc + d.pengeluaran, 0);
      const selisih = pemasukan - pengeluaran;
      return { pemasukan, pengeluaran, selisih };
    }
  }, [viewMode, weeklyChartData, semesterChartData]);

  const isCurrentMonthActive = selectedMonth === activeMonthKey && viewMode === 'month';

  return (
    <div className="bg-white dark:bg-[#18191C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-5 shadow-2xs transition-colors">
      {/* Header and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-1.5">
              <span>Tren Pemasukan &amp; Pengeluaran Kas</span>
            </h3>
            {isCurrentMonthActive && (
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/30">
                Bulan Berjalan
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {viewMode === 'month'
              ? `Perbandingan arus kas mingguan periode ${currentMonthInfo.label}`
              : 'Perbandingan arus kas semester ganjil per bulan'}
          </p>
        </div>

        {/* View mode toggle & Month Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Mode Switcher: Bulan Berjalan vs Semester */}
          <div className="inline-flex rounded-lg p-0.5 bg-stone-100 dark:bg-[#141518] border border-stone-200/80 dark:border-stone-800/80 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#1E1F23] text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('semester')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'semester'
                  ? 'bg-white dark:bg-[#1E1F23] text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              1 Semester
            </button>
          </div>

          {/* Month Dropdown (Active when in 'month' view) */}
          {viewMode === 'month' && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                aria-label="Pilih bulan kas kelas"
                className="appearance-none bg-stone-50 dark:bg-[#141518] hover:bg-stone-100 dark:hover:bg-[#1C1D21] border border-stone-200/80 dark:border-stone-800/80 rounded-lg py-1 pl-2.5 pr-7 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              >
                {MONTH_CATALOG.map(cat => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label} {cat.key === activeMonthKey ? '(Berjalan)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Mini KPI Highlights for Selected Period */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        {/* Pemasukan */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-600/20 dark:border-emerald-500/20">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
            <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Pemasukan</span>
          </div>
          <div className="font-editorial font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-300 mt-0.5 tabular-nums">
            {formatRupiah(monthTotals.pemasukan)}
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-500/20">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-800 dark:text-rose-400">
            <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Pengeluaran</span>
          </div>
          <div className="font-editorial font-bold text-sm sm:text-base text-rose-900 dark:text-rose-300 mt-0.5 tabular-nums">
            {formatRupiah(monthTotals.pengeluaran)}
          </div>
        </div>

        {/* Surplus / Netto */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-[#141518] border border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
            <Scale className="w-3 h-3 text-stone-500" />
            <span>Surplus / Sisa</span>
          </div>
          <div
            className={`font-editorial font-bold text-sm sm:text-base mt-0.5 tabular-nums ${
              monthTotals.selisih >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {monthTotals.selisih >= 0 ? `+${formatRupiah(monthTotals.selisih)}` : `-${formatRupiah(Math.abs(monthTotals.selisih))}`}
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Viewport */}
      <div className="w-full h-56 sm:h-64 mt-1">
        {activeData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 text-xs gap-1.5 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
            <Calendar className="w-5 h-5 opacity-60" />
            <span>Belum ada data jadwal kas untuk periode ini</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? '#292524' : '#F5F5F4'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: darkMode ? '#A8A29E' : '#78716C' }}
                axisLine={{ stroke: darkMode ? '#333130' : '#E7E5E4' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: darkMode ? '#A8A29E' : '#78716C' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip
                cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-[#18191C] border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 shadow-xl text-xs min-w-[170px]">
                      <div className="font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-1 mb-1.5">
                        {data.fullName || data.name}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-2xs bg-emerald-600 dark:bg-emerald-500" />
                            Pemasukan:
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatRupiah(data.pemasukan)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-rose-700 dark:text-rose-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-2xs bg-rose-600 dark:bg-rose-500" />
                            Pengeluaran:
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatRupiah(data.pengeluaran)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-100 dark:border-stone-800 font-bold text-stone-800 dark:text-stone-200">
                          <span>Surplus:</span>
                          <span
                            className={`tabular-nums ${
                              data.selisih >= 0
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {data.selisih >= 0 ? `+${formatRupiah(data.selisih)}` : `-${formatRupiah(Math.abs(data.selisih))}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={value => (
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 mr-2">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="pemasukan"
                name="Pemasukan (Iuran & Donasi)"
                fill={darkMode ? '#10B981' : '#059669'}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="pengeluaran"
                name="Pengeluaran Kas"
                fill={darkMode ? '#F43F5E' : '#E11D48'}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
