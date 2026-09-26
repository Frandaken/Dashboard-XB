import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from './components/Header';
import { TaskBanner } from './components/TaskBanner';
import { ScheduleBlocks } from './components/ScheduleBlocks';
import { CalendarSection } from './components/CalendarSection';
import { SongScheduleList } from './components/SongScheduleList';
import { DayDetailModal } from './components/DayDetailModal';
import { HamburgerMenuModal } from './components/HamburgerMenuModal';
import { AllSongsModal } from './components/AllSongsModal';
import { StatusBanner } from './components/StatusBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ClassDataStore } from './types';
import { parseCSV, parseDoaRows, parseMbgRows, parsePiketRows } from './utils/csvParser';
import { parsePelajaranICS, parseBirthdayICS } from './utils/icalParser';
import { DEMO_CSV, DOW_ID, MONTH_ID } from './data/demoData';

export default function App() {
  // Dark mode state with persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Hamburger modal state (Menu modul & slot kosong fitur)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // All songs lyrics modal
  const [isAllSongsOpen, setIsAllSongsOpen] = useState<boolean>(false);

  const [dataStore, setDataStore] = useState<ClassDataStore>({
    doaByDate: {},
    mbgByDate: {},
    piketByDow: {},
    pelajaranByDate: {},
    tasksByDate: {},
    birthdayByMonthDay: {}
  });

  const [status, setStatus] = useState<{ type: 'loading' | 'error' | 'success'; message: string } | null>(null);

  // Compute today's date in Western Indonesia Time (WIB / Asia/Jakarta, UTC+7)
  const todayWIB = useMemo(() => {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibDate = new Date(utcMs + (7 * 3600000));
    const y = wibDate.getFullYear();
    const m = String(wibDate.getMonth() + 1).padStart(2, '0');
    const d = String(wibDate.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    return { date: wibDate, iso };
  }, []);

  // Active date displayed in the hero section (default to WIB today)
  const [activeISO, setActiveISO] = useState<string>(() => todayWIB.iso);
  const [isManualDate, setIsManualDate] = useState<boolean>(false);
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  const [viewYear, setViewYear] = useState<number>(() => todayWIB.date.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => todayWIB.date.getMonth());

  // Check if a specific date has any academic/school activity
  const hasSchoolData = useCallback((iso: string, store: ClassDataStore) => {
    return !!(
      store.doaByDate[iso] ||
      store.mbgByDate[iso] ||
      (store.pelajaranByDate[iso] && store.pelajaranByDate[iso].length > 0)
    );
  }, []);

  // Helper to find the most relevant active date in the semester dataset
  const findBestActiveDate = useCallback((targetIso: string, store: ClassDataStore): string => {
    if (hasSchoolData(targetIso, store)) return targetIso;

    const availableDates = new Set<string>();
    Object.keys(store.doaByDate).forEach(d => availableDates.add(d));
    Object.keys(store.mbgByDate).forEach(d => availableDates.add(d));
    Object.keys(store.pelajaranByDate).forEach(d => {
      if (store.pelajaranByDate[d]?.length) availableDates.add(d);
    });

    const sortedDates = Array.from(availableDates).sort();
    if (sortedDates.length === 0) return targetIso;

    const targetMMDD = targetIso.slice(5);
    const matchInSemester = sortedDates.find(d => d.slice(5) === targetMMDD);
    if (matchInSemester) return matchInSemester;

    if (targetIso > sortedDates[sortedDates.length - 1]) {
      return sortedDates[sortedDates.length - 1];
    }

    const preceding = sortedDates.filter(d => d <= targetIso);
    if (preceding.length > 0) {
      return preceding[preceding.length - 1];
    }

    return sortedDates[0];
  }, [hasSchoolData]);

  const fetchData = useCallback(async () => {
    try {
      const fetchSheet = async (key: 'doa' | 'mbg' | 'piket') => {
        try {
          const res = await fetch(`/api/sheets/${key}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          return { text, ok: true };
        } catch (err: any) {
          console.warn(`Gagal memuat sheet ${key}:`, err.message);
          return { text: DEMO_CSV[key], ok: false };
        }
      };

      const rangeStart = new Date(2025, 0, 1);
      const rangeEnd = new Date(2027, 11, 31);

      const fetchICS = async (feed: 'pelajaran' | 'birthday') => {
        try {
          const res = await fetch(`/api/calendar/${feed}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          return { text, ok: true };
        } catch (err: any) {
          console.warn(`Gagal memuat kalender ${feed}:`, err.message);
          return { text: '', ok: false };
        }
      };

      const [doaRes, mbgRes, piketRes, pelajaranRes, birthdayRes] = await Promise.all([
        fetchSheet('doa'),
        fetchSheet('mbg'),
        fetchSheet('piket'),
        fetchICS('pelajaran'),
        fetchICS('birthday')
      ]);

      const doaRows = parseCSV(doaRes.text);
      const doaByDate = parseDoaRows(doaRows);

      const mbgRows = parseCSV(mbgRes.text);
      const mbgByDate = parseMbgRows(mbgRows);

      const piketRows = parseCSV(piketRes.text);
      const piketByDow = parsePiketRows(piketRows);

      // Parse pelajaran iCal with automatic merge for adjacent periods with same subject & topic
      const { pelajaranByDate, tasksByDate } = parsePelajaranICS(pelajaranRes.text, rangeStart, rangeEnd);

      // Parse birthday iCal
      const birthdayByMonthDay = parseBirthdayICS(birthdayRes.text, rangeStart, rangeEnd);

      const newStore: ClassDataStore = {
        doaByDate,
        mbgByDate,
        piketByDow,
        pelajaranByDate,
        tasksByDate,
        birthdayByMonthDay
      };

      setDataStore(newStore);

      setActiveISO(prev => {
        if (!isManualDate && !hasSchoolData(prev, newStore)) {
          return findBestActiveDate(todayWIB.iso, newStore);
        }
        return prev;
      });

      setStatus(null);
    } catch (err: any) {
      console.error('Error in fetchData:', err);
      setStatus({
        type: 'error',
        message: 'Gagal memuat sebagian data. Silakan muat ulang halaman.'
      });
      const fallbackStore: ClassDataStore = {
        doaByDate: parseDoaRows(parseCSV(DEMO_CSV.doa)),
        mbgByDate: parseMbgRows(parseCSV(DEMO_CSV.mbg)),
        piketByDow: parsePiketRows(parseCSV(DEMO_CSV.piket)),
        pelajaranByDate: {},
        tasksByDate: {},
        birthdayByMonthDay: {}
      };
      setDataStore(fallbackStore);
      setActiveISO(prev => findBestActiveDate(prev, fallbackStore));
    }
  }, [findBestActiveDate, hasSchoolData, isManualDate, todayWIB.iso]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Information for the currently displayed active date
  const activeDate = useMemo(() => new Date(activeISO + 'T00:00:00'), [activeISO]);
  const activeDow = DOW_ID[activeDate.getDay()];
  const activeMbg = dataStore.mbgByDate[activeISO];
  const activePiket = dataStore.piketByDow[activeDow];
  const activeDoa = dataStore.doaByDate[activeISO];
  const activePelajaran = dataStore.pelajaranByDate[activeISO] || [];
  const activeTasks = dataStore.tasksByDate[activeISO] || [];

  const activeMonthDayKey = `${String(activeDate.getMonth() + 1).padStart(2, '0')}-${String(activeDate.getDate()).padStart(2, '0')}`;
  const activeBirthdays = dataStore.birthdayByMonthDay[activeMonthDayKey] || [];

  // Helper check for calendar dots
  const hasDataForISO = (iso: string): boolean => {
    const d = new Date(iso + 'T00:00:00');
    const dow = DOW_ID[d.getDay()];
    const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return (
      !!dataStore.doaByDate[iso] ||
      !!dataStore.mbgByDate[iso] ||
      !!dataStore.piketByDow[dow] ||
      (dataStore.pelajaranByDate[iso] && dataStore.pelajaranByDate[iso].length > 0) ||
      (dataStore.tasksByDate[iso] && dataStore.tasksByDate[iso].length > 0) ||
      (dataStore.birthdayByMonthDay[md] && dataStore.birthdayByMonthDay[md].length > 0)
    );
  };

  const hasTasksForISO = (iso: string): boolean => {
    return !!dataStore.tasksByDate[iso] && dataStore.tasksByDate[iso].length > 0;
  };

  const getBirthdaysForISO = (iso: string): string[] => {
    const d = new Date(iso + 'T00:00:00');
    const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dataStore.birthdayByMonthDay[md] || [];
  };

  // Selected date details for modal
  const selectedDetails = useMemo(() => {
    if (!selectedISO) return null;
    const d = new Date(selectedISO + 'T00:00:00');
    const dow = DOW_ID[d.getDay()];
    const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return {
      isoDate: selectedISO,
      dow,
      mbg: dataStore.mbgByDate[selectedISO],
      piket: dataStore.piketByDow[dow],
      doa: dataStore.doaByDate[selectedISO],
      pelajaran: dataStore.pelajaranByDate[selectedISO] || [],
      tasks: dataStore.tasksByDate[selectedISO] || [],
      birthdays: dataStore.birthdayByMonthDay[md] || []
    };
  }, [selectedISO, dataStore]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(todayWIB.date.getFullYear());
    setViewMonth(todayWIB.date.getMonth());
    setActiveISO(todayWIB.iso);
    setIsManualDate(true);
    setSelectedISO(null);
  };

  const handleStepDay = (delta: number) => {
    const cur = new Date(activeISO + 'T00:00:00');
    cur.setDate(cur.getDate() + delta);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const nextIso = `${y}-${m}-${d}`;
    setActiveISO(nextIso);
    setIsManualDate(true);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#FAF6EE] dark:bg-[#121417] text-[#2B2A28] dark:text-[#E6EDF3] p-2 sm:p-2.5 lg:p-3 flex flex-col font-sans transition-colors duration-200">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 h-full min-h-0 gap-2">
        {/* Top Header with Dark Mode Toggle & Hamburger Button */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenMenu={() => setIsMenuOpen(true)}
        />

        {/* Status Notification (Only show on error) */}
        {status && status.type === 'error' && (
          <StatusBanner
            type={status.type}
            message={status.message}
            onDismiss={() => setStatus(null)}
          />
        )}

        {/* Main Grid: Left = Hero Today Schedule, Right = Calendar & Song (Fits 100% in Viewport) */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 items-stretch overflow-hidden">
          {/* LEFT: TODAY DASHBOARD (Col Span 7-8) */}
          <section
            id="hero-today-section"
            className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 gap-2 w-full overflow-hidden"
          >
            {/* Date Title with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b border-[#E4DDCE] dark:border-[#2D333B] flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2C4E3A] dark:bg-[#34D399]" />
                <h2 className="font-display font-semibold text-lg sm:text-xl text-[#2B2A28] dark:text-white tracking-tight leading-tight">
                  {activeDow}, {activeDate.getDate()} {MONTH_ID[activeDate.getMonth()]} {activeDate.getFullYear()}
                </h2>
                {activeISO === todayWIB.iso ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF3EE] dark:bg-[#1B3626] text-[#2C4E3A] dark:text-[#6EE7B7] border border-[#C6DEC0] dark:border-[#2D5A3C]">
                    Hari Ini (WIB)
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-[#3D2C15] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                      Sedang Dipreview
                    </span>
                    <button
                      onClick={() => {
                        setActiveISO(todayWIB.iso);
                        setIsManualDate(true);
                      }}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF3EE] dark:bg-[#1B3626] text-[#2C4E3A] dark:text-[#6EE7B7] border border-[#C6DEC0] dark:border-[#2D5A3C] hover:bg-[#DCECE1] transition cursor-pointer"
                      title="Kembali ke Hari Ini"
                    >
                      Kembali ke Hari Ini
                    </button>
                  </div>
                )}
              </div>

              {/* Prev / Next Day Steppers */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleStepDay(-1)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#1E2228] hover:bg-[#FAF6EE] dark:hover:bg-[#2A313C] text-xs font-medium text-stone-700 dark:text-stone-200 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                <button
                  onClick={() => handleStepDay(1)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E4DDCE] dark:border-[#38414D] bg-white dark:bg-[#1E2228] hover:bg-[#FAF6EE] dark:hover:bg-[#2A313C] text-xs font-medium text-stone-700 dark:text-stone-200 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Hari Berikutnya"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Smart Notice if displayed date differs from WIB date */}
            {activeISO !== todayWIB.iso && !isManualDate && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#163523] border border-emerald-200 dark:border-[#2D6643] text-emerald-950 dark:text-[#A7F3D0] text-xs flex items-center justify-between gap-2 flex-shrink-0 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-[#34D399] flex-shrink-0" />
                  <span className="font-normal">
                    {todayWIB.date.getDay() === 0 || todayWIB.date.getDay() === 6
                      ? `Hari ini akhir pekan (${DOW_ID[todayWIB.date.getDay()]}). Menampilkan jadwal hari sekolah aktif terdekat.`
                      : `Menampilkan jadwal semester aktif (${activeDow}, ${activeDate.getDate()} ${MONTH_ID[activeDate.getMonth()]}).`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveISO(todayWIB.iso);
                    setIsManualDate(true);
                  }}
                  className="text-emerald-800 dark:text-[#34D399] hover:underline font-semibold cursor-pointer text-xs flex-shrink-0"
                >
                  Lihat Hari Ini
                </button>
              </div>
            )}

            {/* Penugasan Banner (Derived strictly from event DESCRIPTION in ical jadwal pelajaran) */}
            {activeTasks.length > 0 && (
              <TaskBanner tasks={activeTasks} />
            )}

            {/* Schedule Blocks (MBG, Piket, Doa & Bacaan Injil, Jadwal Pelajaran) */}
            <ScheduleBlocks
              mbg={activeMbg}
              piket={activePiket}
              doa={activeDoa}
              pelajaran={activePelajaran}
              dowName={activeDow}
            />
          </section>

          {/* RIGHT: CALENDAR, BIRTHDAYS & SONG SCHEDULE (Col Span 4-5) */}
          <aside className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 w-full justify-between gap-2 overflow-hidden">
            <CalendarSection
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleJumpToToday}
              previewISO={activeISO}
              todayISO={todayWIB.iso}
              selectedISO={selectedISO}
              onSelectDate={iso => {
                setSelectedISO(iso);
                setActiveISO(iso);
                setIsManualDate(true);
              }}
              hasDataFn={hasDataForISO}
              hasTaskFn={hasTasksForISO}
              hasBirthdayFn={getBirthdaysForISO}
              birthdaysToday={activeBirthdays}
            />

            {/* Lagu Wajib Minggu Ini (Hanya Minggu Ini Saja) */}
            <SongScheduleList
              viewYear={viewYear}
              viewMonth={viewMonth}
              currentDate={activeDate}
              selectedISO={selectedISO}
            />
          </aside>
        </main>
      </div>

      {/* Selected Day Detail Modal */}
      {selectedDetails && (
        <DayDetailModal
          isoDate={selectedDetails.isoDate}
          onClose={() => setSelectedISO(null)}
          doa={selectedDetails.doa}
          mbg={selectedDetails.mbg}
          piket={selectedDetails.piket}
          pelajaran={selectedDetails.pelajaran}
          tasks={selectedDetails.tasks}
          birthdays={selectedDetails.birthdays}
        />
      )}

      {/* Hamburger Tab: Menu Modul & Slot Kosong Fitur */}
      <HamburgerMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSongLyrics={() => setIsAllSongsOpen(true)}
      />

      {/* Pop Up Koleksi Semua Lirik Lagu Wajib Nasional */}
      <AllSongsModal
        isOpen={isAllSongsOpen}
        onClose={() => setIsAllSongsOpen(false)}
      />

      {/* Offline Indicator Toast */}
      <OfflineIndicator />
    </div>
  );
}
