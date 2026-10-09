import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from './components/Header';
import { TaskBanner } from './components/TaskBanner';
import { ScheduleBlocks } from './components/ScheduleBlocks';
import { CalendarSection } from './components/CalendarSection';
import { SongScheduleList } from './components/SongScheduleList';
import { HamburgerMenuModal } from './components/HamburgerMenuModal';
import { IceBreakingPanel } from './components/IceBreakingPanel';
import { StatusBanner } from './components/StatusBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { NotFoundUI } from './components/NotFoundUI';

// Code-split heavy modals to minimize main JS bundle
const DayDetailModal = React.lazy(() => import('./components/DayDetailModal').then(m => ({ default: m.DayDetailModal })));
const AllSongsModal = React.lazy(() => import('./components/AllSongsModal').then(m => ({ default: m.AllSongsModal })));
const WheelOfNamesModal = React.lazy(() => import('./components/WheelOfNamesModal').then(m => ({ default: m.WheelOfNamesModal })));
const GroupGeneratorModal = React.lazy(() => import('./components/GroupGeneratorModal').then(m => ({ default: m.GroupGeneratorModal })));
const IceBreakingScheduleModal = React.lazy(() => import('./components/IceBreakingScheduleModal').then(m => ({ default: m.IceBreakingScheduleModal })));
import { NotificationModal } from './components/NotificationModal';
import { NextLessonToast, NextLessonInfo } from './components/NextLessonToast';
import { usePushNotifications } from './hooks/usePushNotifications';
import { ClassDataStore } from './types';
import { parseCSV, parseDoaRows, parseMbgRows, parsePiketRows, parseIceBreakingRows } from './utils/csvParser';
import { parsePelajaranICS, parseBirthdayICS } from './utils/icalParser';
import { DEMO_CSV, DOW_ID, MONTH_ID } from './data/demoData';
import { getWIBDateParts, parseISODateParts, stepISODate } from './utils/dateUtils';
import { isIceBreakingActiveNow, getCurrentWIBTimeHHMM } from './utils/iceBreakingUtils';

export default function App() {
  // 1. Default to light mode (false unless explicitly saved as 'dark' in localStorage)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return false; // Default to light mode as requested
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

  // Hamburger modal state (Menu navigasi)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // All songs lyrics modal
  const [isAllSongsOpen, setIsAllSongsOpen] = useState<boolean>(false);
  // Ice Breaking schedule modal
  const [isIceBreakingModalOpen, setIsIceBreakingModalOpen] = useState<boolean>(false);
  // Push Notification settings modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const { permission: notificationPermission } = usePushNotifications();
  // 5-minute pre-lesson in-app toast popup
  const [nextLessonNotice, setNextLessonNotice] = useState<NextLessonInfo | null>(null);

  const [dataStore, setDataStore] = useState<ClassDataStore>(() => {
    try {
      const doaRows = parseCSV(DEMO_CSV.doa);
      const doaByDate = parseDoaRows(doaRows);
      const mbgRows = parseCSV(DEMO_CSV.mbg);
      const mbgByDate = parseMbgRows(mbgRows);
      const piketRows = parseCSV(DEMO_CSV.piket);
      const piketByDow = parsePiketRows(piketRows);
      const iceBreakingRows = parseCSV(DEMO_CSV.icebreaking);
      const iceBreakingByDate = parseIceBreakingRows(iceBreakingRows);

      return {
        doaByDate,
        mbgByDate,
        piketByDow,
        iceBreakingByDate,
        pelajaranByDate: {},
        tasksByDate: {},
        birthdayByMonthDay: {}
      };
    } catch {
      return {
        doaByDate: {},
        mbgByDate: {},
        piketByDow: {},
        iceBreakingByDate: {},
        pelajaranByDate: {},
        tasksByDate: {},
        birthdayByMonthDay: {}
      };
    }
  });

  // Real-time clock for current time in WIB (updates every 15s to react exactly to period start/end)
  const [currentWIBTime, setCurrentWIBTime] = useState<string>(() => getCurrentWIBTimeHHMM());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWIBTime(getCurrentWIBTimeHHMM());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const [status, setStatus] = useState<{ type: 'loading' | 'error' | 'success'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Compute today's date strictly in Western Indonesia Time (WIB / Asia/Jakarta, UTC+7)
  const todayWIB = useMemo(() => {
    return getWIBDateParts();
  }, []);

  // 5 Menit Sebelum Jam Selanjutnya Dimulai: Pop up kecil di bagian atas auto close setelah 5 detik
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkNextLesson = () => {
      const todaySchedule = dataStore.pelajaranByDate[todayWIB.iso] || [];
      if (todaySchedule.length === 0) return;

      const nowParts = getWIBDateParts();
      const [nowH, nowM] = nowParts.timeStr.split(':').map(Number);
      const nowTotalMin = nowH * 60 + nowM;

      const isFriday = todayWIB.dowName.toLowerCase().includes('jumat');
      let academicCounter = 0;

      for (let idx = 0; idx < todaySchedule.length; idx++) {
        const period = todaySchedule[idx];
        if (!period.time || !period.cleanName) continue;

        const isNonAcademicFriday = isFriday && (
          period.cleanName.toLowerCase().includes('literasi') ||
          period.cleanName.toLowerCase().includes('senam')
        );

        let sessionNumber: number | string = idx + 1;
        if (isFriday) {
          if (isNonAcademicFriday) {
            sessionNumber = 0;
          } else {
            academicCounter += 1;
            sessionNumber = academicCounter;
          }
        }

        const match = period.time.match(/(\d{1,2}):(\d{2})/);
        if (!match) continue;
        const startH = parseInt(match[1], 10);
        const startM = parseInt(match[2], 10);
        const startTotalMin = startH * 60 + startM;
        const diff = startTotalMin - nowTotalMin;

        // Tampilkan tepat saat 5 menit sebelum jam selanjutnya dimulai (diff <= 5 dan diff > 0)
        if (diff <= 5 && diff > 0) {
          const storageKey = `next_lesson_popup_${todayWIB.iso}_${period.cleanName}_${period.time}`;
          if (!sessionStorage.getItem(storageKey)) {
            sessionStorage.setItem(storageKey, 'true');
            setNextLessonNotice({
              lessonName: period.cleanName,
              sessionNumber,
              timeStr: period.time,
              minutesRemaining: diff
            });
            break;
          }
        }
      }
    };

    checkNextLesson();
    const interval = setInterval(checkNextLesson, 10000); // periksa setiap 10 detik
    return () => clearInterval(interval);
  }, [dataStore.pelajaranByDate, todayWIB.iso, todayWIB.dowName]);

  // Compute default active school date:
  // On weekend:
  // - If today is Sunday (dayOfWeek === 0), jump to upcoming Monday (+1 day, e.g. 27 -> 28).
  // - If today is Saturday (dayOfWeek === 6), jump to upcoming Monday (+2 days, e.g. 26 -> 28).
  // On weekdays: default to today.
  const defaultSchoolISO = useMemo(() => {
    if (todayWIB.dayOfWeek === 0) {
      return stepISODate(todayWIB.iso, 1);
    }
    if (todayWIB.dayOfWeek === 6) {
      return stepISODate(todayWIB.iso, 2);
    }
    return todayWIB.iso;
  }, [todayWIB.dayOfWeek, todayWIB.iso]);

  // Active date displayed in the hero section (default to next active school day on weekend)
  const [activeISO, setActiveISO] = useState<string>(() => defaultSchoolISO);
  const [isManualDate, setIsManualDate] = useState<boolean>(false);
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState<boolean>(false);
  const [isGroupGeneratorOpen, setIsGroupGeneratorOpen] = useState<boolean>(false);

  // 404 Route state & browser pathname listener
  const [is404, setIs404] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p !== '' && p !== '/' && p !== '/index.html';
    }
    return false;
  });
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const notFound = path !== '' && path !== '/' && path !== '/index.html';
      setIs404(notFound);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleGoHome = () => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
    setIs404(false);
    setCurrentPath('/');
  };

  const [viewYear, setViewYear] = useState<number>(() => todayWIB.year);
  const [viewMonth, setViewMonth] = useState<number>(() => todayWIB.month);

  // Check if a specific date has any academic/school activity
  const hasSchoolData = useCallback((iso: string, store: ClassDataStore) => {
    return !!(
      store.doaByDate[iso] ||
      store.mbgByDate[iso] ||
      store.iceBreakingByDate[iso] ||
      (store.pelajaranByDate[iso] && store.pelajaranByDate[iso].length > 0)
    );
  }, []);

  // Helper to find the most relevant active date in the semester dataset
  const findBestActiveDate = useCallback((targetIso: string, store: ClassDataStore): string => {
    if (hasSchoolData(targetIso, store)) return targetIso;

    const availableDates = new Set<string>();
    Object.keys(store.doaByDate).forEach(d => availableDates.add(d));
    Object.keys(store.mbgByDate).forEach(d => availableDates.add(d));
    Object.keys(store.iceBreakingByDate || {}).forEach(d => availableDates.add(d));
    Object.keys(store.pelajaranByDate).forEach(d => {
      if (store.pelajaranByDate[d]?.length) availableDates.add(d);
    });

    const sortedDates = Array.from(availableDates).sort();
    if (sortedDates.length === 0) return targetIso;

    // Check same MMDD
    const targetMMDD = targetIso.slice(5);
    const matchInSemester = sortedDates.find(d => d.slice(5) === targetMMDD);
    if (matchInSemester && hasSchoolData(matchInSemester, store)) return matchInSemester;

    // Find closest date with school data
    const pastDates = sortedDates.filter(d => d <= targetIso);
    const futureDates = sortedDates.filter(d => d >= targetIso);

    if (pastDates.length > 0 && futureDates.length > 0) {
      const lastPast = pastDates[pastDates.length - 1];
      const firstFuture = futureDates[0];
      // On weekends, always prefer the upcoming future school day (Monday) rather than previous Friday
      const targetDow = parseISODateParts(targetIso).dayOfWeek;
      if (targetDow === 0 || targetDow === 6) {
        return firstFuture;
      }
      const targetTime = new Date(targetIso + 'T12:00:00Z').getTime();
      const pastDiff = Math.abs(targetTime - new Date(lastPast + 'T12:00:00Z').getTime());
      const futureDiff = Math.abs(new Date(firstFuture + 'T12:00:00Z').getTime() - targetTime);
      return futureDiff < pastDiff ? firstFuture : lastPast;
    }

    if (futureDates.length > 0) return futureDates[0];
    return sortedDates[sortedDates.length - 1];
  }, [hasSchoolData]);

  // Fetch real data with fallback
  const fetchData = useCallback(async () => {
    setStatus({ type: 'loading', message: 'Memperbarui data kelas...' });

    const fetchEndpoint = async (path: string, fallbackKey?: keyof typeof DEMO_CSV) => {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return { text, isFallback: false };
      } catch (err) {
        console.warn(`Fetch ${path} gagal, menggunakan data lokal:`, err);
        return {
          text: fallbackKey ? DEMO_CSV[fallbackKey] : '',
          isFallback: true
        };
      }
    };

    try {
      const curYear = new Date().getFullYear();
      const rangeStart = new Date(curYear - 1, 0, 1);
      const rangeEnd = new Date(curYear + 1, 11, 31);

      const [doaRes, mbgRes, piketRes, iceBreakingRes, pelajaranRes, birthdayRes] = await Promise.all([
        fetchEndpoint('/api/sheets/doa', 'doa'),
        fetchEndpoint('/api/sheets/mbg', 'mbg'),
        fetchEndpoint('/api/sheets/piket', 'piket'),
        fetchEndpoint('/api/sheets/icebreaking', 'icebreaking'),
        fetchEndpoint('/api/calendar/pelajaran'),
        fetchEndpoint('/api/calendar/birthday')
      ]);

      const doaRows = parseCSV(doaRes.text);
      const doaByDate = parseDoaRows(doaRows);

      const mbgRows = parseCSV(mbgRes.text);
      const mbgByDate = parseMbgRows(mbgRows);

      const piketRows = parseCSV(piketRes.text);
      const piketByDow = parsePiketRows(piketRows);

      const iceBreakingRows = parseCSV(iceBreakingRes.text);
      const iceBreakingByDate = parseIceBreakingRows(iceBreakingRows);

      // Parse pelajaran iCal (keeping subjects on different schedules strictly separated)
      const { pelajaranByDate, tasksByDate } = parsePelajaranICS(pelajaranRes.text, rangeStart, rangeEnd);

      // Parse birthday iCal
      const birthdayByMonthDay = parseBirthdayICS(birthdayRes.text, rangeStart, rangeEnd);

      const newStore: ClassDataStore = {
        doaByDate,
        mbgByDate,
        piketByDow,
        iceBreakingByDate,
        pelajaranByDate,
        tasksByDate,
        birthdayByMonthDay
      };

      setDataStore(newStore);

      setActiveISO(prev => {
        if (!isManualDate) {
          if (hasSchoolData(prev, newStore)) {
            return prev;
          }
          if (hasSchoolData(defaultSchoolISO, newStore)) {
            return defaultSchoolISO;
          }
          return findBestActiveDate(defaultSchoolISO, newStore);
        }
        return prev;
      });

      setStatus(null);
      setIsLoading(false);
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
        iceBreakingByDate: parseIceBreakingRows(parseCSV(DEMO_CSV.icebreaking)),
        pelajaranByDate: {},
        tasksByDate: {},
        birthdayByMonthDay: {}
      };
      setDataStore(fallbackStore);
      setActiveISO(prev => {
        if (isManualDate) return prev;
        if (hasSchoolData(prev, fallbackStore)) return prev;
        if (hasSchoolData(defaultSchoolISO, fallbackStore)) return defaultSchoolISO;
        return findBestActiveDate(defaultSchoolISO, fallbackStore);
      });
      setIsLoading(false);
    }
  }, [defaultSchoolISO, findBestActiveDate, hasSchoolData, isManualDate]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Information for the currently displayed active date
  const activeInfo = useMemo(() => parseISODateParts(activeISO), [activeISO]);
  const activeDow = activeInfo.dowName;
  const activeMbg = dataStore.mbgByDate[activeISO];
  const activePiket = dataStore.piketByDow[activeDow];
  const activeDoa = dataStore.doaByDate[activeISO];
  const activeIceBreaking = dataStore.iceBreakingByDate[activeISO];
  const activePelajaran = dataStore.pelajaranByDate[activeISO] || [];
  const activeTasks = dataStore.tasksByDate[activeISO] || [];

  const activeMonthDayKey = `${String(activeInfo.month + 1).padStart(2, '0')}-${String(activeInfo.day).padStart(2, '0')}`;
  const activeBirthdays = dataStore.birthdayByMonthDay[activeMonthDayKey] || [];

  // Check real-time if Ice Breaking panel should appear below the calendar right now
  const iceBreakingActiveStatus = useMemo(() => {
    return isIceBreakingActiveNow(
      todayWIB.iso,
      dataStore.iceBreakingByDate[todayWIB.iso],
      dataStore.pelajaranByDate[todayWIB.iso]
    );
  }, [todayWIB.iso, dataStore.iceBreakingByDate, dataStore.pelajaranByDate, currentWIBTime]);

  // Helper check for calendar dots
  const hasDataForISO = (iso: string): boolean => {
    const info = parseISODateParts(iso);
    const md = `${String(info.month + 1).padStart(2, '0')}-${String(info.day).padStart(2, '0')}`;
    return (
      !!dataStore.doaByDate[iso] ||
      !!dataStore.mbgByDate[iso] ||
      !!dataStore.iceBreakingByDate[iso] ||
      !!dataStore.piketByDow[info.dowName] ||
      (dataStore.pelajaranByDate[iso] && dataStore.pelajaranByDate[iso].length > 0) ||
      (dataStore.tasksByDate[iso] && dataStore.tasksByDate[iso].length > 0) ||
      (dataStore.birthdayByMonthDay[md] && dataStore.birthdayByMonthDay[md].length > 0)
    );
  };

  const hasTasksForISO = (iso: string): boolean => {
    return !!dataStore.tasksByDate[iso] && dataStore.tasksByDate[iso].length > 0;
  };

  const getBirthdaysForISO = (iso: string): string[] => {
    const info = parseISODateParts(iso);
    const md = `${String(info.month + 1).padStart(2, '0')}-${String(info.day).padStart(2, '0')}`;
    return dataStore.birthdayByMonthDay[md] || [];
  };

  // Selected date details for modal
  const selectedDetails = useMemo(() => {
    if (!selectedISO) return null;
    const info = parseISODateParts(selectedISO);
    const md = `${String(info.month + 1).padStart(2, '0')}-${String(info.day).padStart(2, '0')}`;

    return {
      isoDate: selectedISO,
      dow: info.dowName,
      mbg: dataStore.mbgByDate[selectedISO],
      piket: dataStore.piketByDow[info.dowName],
      doa: dataStore.doaByDate[selectedISO],
      iceBreaking: dataStore.iceBreakingByDate[selectedISO],
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
    const curWIB = getWIBDateParts();
    setViewYear(curWIB.year);
    setViewMonth(curWIB.month);
    setActiveISO(curWIB.iso);
    setIsManualDate(true);
    setSelectedISO(null);
  };

  const handleStepDay = (delta: number) => {
    setActiveISO(prev => stepISODate(prev, delta));
    setIsManualDate(true);
  };

  // Safe Date object for components expecting a Date instance
  const safeActiveDate = useMemo(() => {
    return new Date(Date.UTC(activeInfo.year, activeInfo.month, activeInfo.day, 12, 0, 0));
  }, [activeInfo.year, activeInfo.month, activeInfo.day]);

  if (is404) {
    return (
      <>
        {/* 5-minute pre-lesson in-app toast popup (auto closes after 5 seconds) */}
        <NextLessonToast
          info={nextLessonNotice}
          onClose={() => setNextLessonNotice(null)}
        />

        <NotFoundUI
          onGoHome={handleGoHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          currentPath={currentPath}
        />

        {/* Keep Hamburger Menu & Modals accessible from 404 page */}
        <HamburgerMenuModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onOpenSongLyrics={() => setIsAllSongsOpen(true)}
          onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
          onOpenGroupGenerator={() => setIsGroupGeneratorOpen(true)}
          onOpenIceBreaking={() => setIsIceBreakingModalOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onJumpToToday={() => {
            handleGoHome();
            handleJumpToToday();
          }}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <WheelOfNamesModal
          isOpen={isRandomPickerOpen}
          onClose={() => setIsRandomPickerOpen(false)}
        />

        <GroupGeneratorModal
          isOpen={isGroupGeneratorOpen}
          onClose={() => setIsGroupGeneratorOpen(false)}
        />

        <AllSongsModal
          isOpen={isAllSongsOpen}
          onClose={() => setIsAllSongsOpen(false)}
        />

        <IceBreakingScheduleModal
          isOpen={isIceBreakingModalOpen}
          onClose={() => setIsIceBreakingModalOpen(false)}
          schedules={dataStore.iceBreakingByDate}
          pelajaranByDate={dataStore.pelajaranByDate}
          todayISO={todayWIB.iso}
        />
      </>
    );
  }

  return (
    // 5. Overflow scrolling on mobile enabled (min-h-screen overflow-y-auto on mobile, desktop keeps clean full viewport)
    <div className="min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden bg-[#FAF7F2] dark:bg-black text-[#1C1917] dark:text-[#F8FAFC] p-2.5 sm:p-3 lg:p-3.5 flex flex-col font-sans transition-colors duration-200">
      {/* 5-minute pre-lesson in-app toast popup (auto closes after 5 seconds) */}
      <NextLessonToast
        info={nextLessonNotice}
        onClose={() => setNextLessonNotice(null)}
      />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 min-h-0 gap-2.5">
        {/* Top Header with Dark Mode Toggle & Hamburger Button */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          hasNotificationActive={notificationPermission === 'granted'}
        />

        {/* Status Notification (Only show on error) */}
        {status && status.type === 'error' && (
          <StatusBanner
            type={status.type}
            message={status.message}
            onDismiss={() => setStatus(null)}
          />
        )}

        {/* Main Grid: Skeleton Loader during data loading, or actual Dashboard */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-visible lg:overflow-hidden pb-4 lg:pb-0 animate-fade-in">
            {/* LEFT: TODAY DASHBOARD (Col Span 7-8) */}
            <section
              id="hero-today-section"
              className="lg:col-span-7 xl:col-span-8 flex flex-col h-auto lg:h-full min-h-0 gap-2.5 w-full overflow-visible lg:overflow-hidden"
            >
              {/* Date Title with Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D8D2C5] dark:border-[#222222] flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-3 h-3 rounded-full bg-[#2C4E3A] dark:bg-[#34D399] ring-2 ring-[#2C4E3A]/20" />
                  <h2
                    key={activeISO}
                    className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-white tracking-tight leading-tight animate-fade-in"
                  >
                    {activeInfo.formattedDate}
                  </h2>
                  {activeISO === todayWIB.iso ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B]">
                      Hari Ini
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-[#261B06] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-[#523A0F]">
                        {(todayWIB.dayOfWeek === 0 || todayWIB.dayOfWeek === 6) && activeISO === defaultSchoolISO
                          ? `Jadwal ${activeInfo.dowName} Depan`
                          : 'Sedang Ditampilkan'}
                      </span>
                      <button
                        onClick={() => {
                          setActiveISO(todayWIB.iso);
                          setIsManualDate(true);
                        }}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B] hover:bg-[#BBF7D0] transition cursor-pointer"
                        title={`Lihat Jadwal Hari Ini (${todayWIB.dowName}, ${todayWIB.day} ${MONTH_ID[todayWIB.month]})`}
                        aria-label="Kembali ke jadwal hari ini"
                      >
                        Lihat Hari Ini ({todayWIB.dowName})
                      </button>
                    </div>
                  )}
                </div>

                {/* Prev / Next Day Steppers with accessible touch targets */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStepDay(-1)}
                    aria-label="Jadwal Hari Sebelumnya"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-[#FAF7F2] dark:hover:bg-[#1C1C1C] text-xs font-bold text-stone-800 dark:text-stone-200 transition cursor-pointer shadow-2xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
                    title="Hari Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="inline">Sebelumnya</span>
                  </button>
                  <button
                    onClick={() => handleStepDay(1)}
                    aria-label="Jadwal Hari Berikutnya"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-[#FAF7F2] dark:hover:bg-[#1C1C1C] text-xs font-bold text-stone-800 dark:text-stone-200 transition cursor-pointer shadow-2xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
                    title="Hari Berikutnya"
                  >
                    <span className="inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Day Content with smooth fade-in */}
              <div
                key={activeISO}
                className="flex-1 flex flex-col gap-2.5 min-h-0 animate-fade-in"
              >
                {/* Smart Notice if displayed date differs from WIB date */}
                {activeISO !== todayWIB.iso && !isManualDate && (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#071F14] border border-emerald-300 dark:border-[#0E492B] text-emerald-950 dark:text-[#A7F3D0] text-xs flex items-center gap-2 flex-shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-emerald-700 dark:text-[#34D399] flex-shrink-0" />
                      <span className="font-medium">
                        {todayWIB.dayOfWeek === 0 || todayWIB.dayOfWeek === 6
                          ? `Hari ini hari libur sekolah (${todayWIB.formattedDate}). Menampilkan jadwal hari efektif sekolah terdekat: ${activeInfo.formattedDate}`
                          : `Menampilkan jadwal hari efektif sekolah terdekat: ${activeInfo.formattedDate}`}
                      </span>
                    </div>
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
                  iceBreaking={activeIceBreaking}
                />
              </div>
            </section>

            {/* RIGHT: CALENDAR, BIRTHDAYS & SONG SCHEDULE (Col Span 4-5) */}
            <aside className="lg:col-span-5 xl:col-span-4 flex flex-col h-auto lg:h-full min-h-0 w-full justify-between gap-2.5 overflow-visible lg:overflow-hidden">
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

              {/* Panel Petugas Ice Breaking: Hanya muncul saat jam pelajaran pertama yang ada di spreadsheet pada hari yang telah ditentukan (pada setiap awal jam Sosiologi dan Geografi) */}
              {iceBreakingActiveStatus.isActive && iceBreakingActiveStatus.session && dataStore.iceBreakingByDate[todayWIB.iso] && (
                <IceBreakingPanel
                  schedule={dataStore.iceBreakingByDate[todayWIB.iso]}
                  session={iceBreakingActiveStatus.session}
                  currentTime={iceBreakingActiveStatus.currentTime}
                  onOpenFullSchedule={() => setIsIceBreakingModalOpen(true)}
                />
              )}

              {/* Song Schedule Card */}
              <SongScheduleList
                currentDate={safeActiveDate}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </aside>
          </main>
        )}
      </div>

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Hamburger Navigation Modal (No placeholders) */}
      <HamburgerMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSongLyrics={() => setIsAllSongsOpen(true)}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
        onOpenGroupGenerator={() => setIsGroupGeneratorOpen(true)}
        onOpenIceBreaking={() => setIsIceBreakingModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onJumpToToday={handleJumpToToday}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Lazy-Loaded Modals wrapped in Suspense for optimal bundle splitting */}
      <React.Suspense fallback={null}>
        {/* Random Name Picker (Wheel of Names) Modal */}
        {isRandomPickerOpen && (
          <WheelOfNamesModal
            isOpen={isRandomPickerOpen}
            onClose={() => setIsRandomPickerOpen(false)}
          />
        )}

        {/* Random Group Name Picker (Team Generator) Modal */}
        {isGroupGeneratorOpen && (
          <GroupGeneratorModal
            isOpen={isGroupGeneratorOpen}
            onClose={() => setIsGroupGeneratorOpen(false)}
          />
        )}

        {/* All Songs Lyrics Modal */}
        {isAllSongsOpen && (
          <AllSongsModal
            isOpen={isAllSongsOpen}
            onClose={() => setIsAllSongsOpen(false)}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Jadwal Petugas Ice Breaking Modal */}
        {isIceBreakingModalOpen && (
          <IceBreakingScheduleModal
            isOpen={isIceBreakingModalOpen}
            onClose={() => setIsIceBreakingModalOpen(false)}
            schedules={dataStore.iceBreakingByDate}
            pelajaranByDate={dataStore.pelajaranByDate}
            todayISO={todayWIB.iso}
            onSelectDate={iso => {
              setSelectedISO(iso);
              setActiveISO(iso);
              setIsManualDate(true);
            }}
          />
        )}

        {/* Day Detail Modal (When user clicks on a calendar date) */}
        {selectedDetails && (
          <DayDetailModal
            isoDate={selectedDetails.isoDate}
            onClose={() => setSelectedISO(null)}
            doa={selectedDetails.doa}
            mbg={selectedDetails.mbg}
            piket={selectedDetails.piket}
            iceBreaking={selectedDetails.iceBreaking}
            pelajaran={selectedDetails.pelajaran}
            tasks={selectedDetails.tasks}
            birthdays={selectedDetails.birthdays}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Push Notification Settings Modal */}
        {isNotificationModalOpen && (
          <NotificationModal
            isOpen={isNotificationModalOpen}
            onClose={() => setIsNotificationModalOpen(false)}
            darkMode={darkMode}
          />
        )}
      </React.Suspense>
    </div>
  );
}
