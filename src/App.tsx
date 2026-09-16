import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { TaskBanner } from './components/TaskBanner';
import { ScheduleBlocks } from './components/ScheduleBlocks';
import { CalendarSection } from './components/CalendarSection';
import { SongScheduleList } from './components/SongScheduleList';
import { DayDetailModal } from './components/DayDetailModal';
import { StatusBanner } from './components/StatusBanner';
import { ClassDataStore } from './types';
import { parseCSV, parseDoaRows, parseMbgRows, parsePiketRows } from './utils/csvParser';
import { parsePelajaranICS, parseBirthdayICS } from './utils/icalParser';
import { DEMO_CSV, DOW_ID, MONTH_ID } from './data/demoData';

export default function App() {
  const [dataStore, setDataStore] = useState<ClassDataStore>({
    doaByDate: {},
    mbgByDate: {},
    piketByDow: {},
    pelajaranByDate: {},
    tasksByDate: {},
    birthdayByMonthDay: {}
  });

  const [status, setStatus] = useState<{ type: 'loading' | 'error' | 'success'; message: string } | null>(null);

  // Default to today's date in local time
  const [currentDate] = useState<Date>(() => new Date());
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  const todayISO = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const [viewYear, setViewYear] = useState<number>(() => currentDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => currentDate.getMonth());

  const fetchData = useCallback(async () => {
    try {
      // Fetch CSVs from proxy endpoints
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

      // Range for calendar expansion: 2 months back to 3 months forward
      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0);

      // Fetch Calendar ICS from proxy endpoints
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

      // Parse pelajaran iCal (which ALSO extracts tasks from event DESCRIPTION)
      const { pelajaranByDate, tasksByDate } = parsePelajaranICS(pelajaranRes.text, rangeStart, rangeEnd);

      // Parse birthday iCal
      const birthdayByMonthDay = parseBirthdayICS(birthdayRes.text, rangeStart, rangeEnd);

      setDataStore({
        doaByDate,
        mbgByDate,
        piketByDow,
        pelajaranByDate,
        tasksByDate,
        birthdayByMonthDay
      });

      const allLive = doaRes.ok && mbgRes.ok && piketRes.ok && pelajaranRes.ok && birthdayRes.ok;

      if (!allLive) {
        setStatus({
          type: 'error',
          message: 'Sebagian data gagal diunduh langsung, menggunakan data cadangan/cache lokal.'
        });
      }
    } catch (err: any) {
      console.error('Error in fetchData:', err);
      setStatus({
        type: 'error',
        message: 'Gagal menghubungkan ke server sinkronisasi. Memakai data cadangan.'
      });
      // Fallback with demo data
      setDataStore(prev => ({
        ...prev,
        doaByDate: parseDoaRows(parseCSV(DEMO_CSV.doa)),
        mbgByDate: parseMbgRows(parseCSV(DEMO_CSV.mbg)),
        piketByDow: parsePiketRows(parseCSV(DEMO_CSV.piket))
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes to keep classroom board fresh
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Information for today
  const todayDow = DOW_ID[currentDate.getDay()];
  const todayMbg = dataStore.mbgByDate[todayISO];
  const todayPiket = dataStore.piketByDow[todayDow];
  const todayDoa = dataStore.doaByDate[todayISO];
  const todayPelajaran = dataStore.pelajaranByDate[todayISO] || [];
  const todayTasks = dataStore.tasksByDate[todayISO] || [];

  const todayMonthDayKey = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const todayBirthdays = dataStore.birthdayByMonthDay[todayMonthDayKey] || [];

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
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedISO(null);
  };

  return (
    <div className="min-h-screen h-auto overflow-y-auto lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#FAF6EE] text-[#2B2A28] p-2.5 sm:p-3.5 lg:p-4 flex flex-col font-sans">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 min-h-fit lg:min-h-0 gap-2 sm:gap-2.5">
        {/* Top Header */}
        <Header />

        {/* Status Notification (Only show on error) */}
        {status && status.type === 'error' && (
          <StatusBanner
            type={status.type}
            message={status.message}
            onDismiss={() => setStatus(null)}
          />
        )}

        {/* Main Grid: Left = Hero Today Schedule, Right = Calendar */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-fit lg:min-h-0 items-start lg:items-stretch">
          {/* LEFT: TODAY DASHBOARD */}
          <section
            id="hero-today-section"
            className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-fit lg:min-h-0 gap-2 w-full"
          >
            {/* Date Title */}
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#E4DDCE] flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2C4E3A]" />
              <h2 className="font-display font-semibold text-lg sm:text-xl lg:text-2xl text-[#2B2A28] tracking-tight">
                {todayDow}, {currentDate.getDate()} {MONTH_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>

            {/* Penugasan Banner (Derived strictly from event DESCRIPTION in ical jadwal pelajaran) */}
            {todayTasks.length > 0 && (
              <TaskBanner tasks={todayTasks} />
            )}

            {/* Schedule Blocks (MBG, Piket, Doa & Bacaan Injil, Jadwal Pelajaran) */}
            <ScheduleBlocks
              mbg={todayMbg}
              piket={todayPiket}
              doa={todayDoa}
              pelajaran={todayPelajaran}
              dowName={todayDow}
            />
          </section>

          {/* RIGHT: CALENDAR, BIRTHDAYS & SONG SCHEDULE */}
          <aside className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-fit lg:min-h-0 w-full pb-6 lg:pb-0">
            <CalendarSection
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleJumpToToday}
              selectedISO={selectedISO}
              todayISO={todayISO}
              onSelectDate={iso => setSelectedISO(iso)}
              hasDataFn={hasDataForISO}
              hasTaskFn={hasTasksForISO}
              hasBirthdayFn={getBirthdaysForISO}
              birthdaysToday={todayBirthdays}
            />

            {/* List lagu mingguan untuk bulan yang sedang dilihat */}
            <SongScheduleList
              viewYear={viewYear}
              viewMonth={viewMonth}
              currentDate={currentDate}
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
    </div>
  );
}
