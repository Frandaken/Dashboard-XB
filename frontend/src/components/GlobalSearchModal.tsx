import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  AlertTriangle,
  AlertCircle,
  Megaphone,
  Calendar,
  Clock,
  FileImage,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Filter,
  Users,
  Wallet,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Utensils,
  BookMarked
} from 'lucide-react';
import { ClassDataStore, TaskAttachment, TaskItem } from '../types';
import { Student, STUDENTS_DATA, PIKET_SCHEDULE_MAP } from '../data/studentsData';
import { MONTH_ID, DOW_ID } from '../data/demoData';
import { parseISODateParts, getWIBDateParts } from '../utils/dateUtils';
import { copyTextToClipboard } from '../utils/summaryFormatter';
import { isTaskTimePassed } from '../utils/taskUtils';
import { getCurrentWIBTimeHHMM } from '../utils/iceBreakingUtils';
import { FormattedText } from './FormattedText';

export type SearchCategory = 'all' | 'student' | 'subject' | 'task' | 'event';

export interface SubjectScheduleSlot {
  dayName: string;
  dowIndex: number; // 1 for Senin, 5 for Jumat
  timeStr: string; // e.g. "07.10-08.40"
  jpCount: number; // e.g. 2
  formattedLine: string; // "Senin | 07.10-08.40 | 2 JP"
  location?: string;
}

export interface SubjectDetailData {
  name: string;
  totalJp: number;
  slots: SubjectScheduleSlot[];
  upcomingTasks: Array<{
    isoDate: string;
    formattedDate: string;
    task: TaskItem;
  }>;
}

export interface StudentSummaryData {
  student: Student;
  kas?: {
    totalBayar: number;
    targetWajib: number;
    tunggakan: number;
    lebihBayar: number;
    status: 'lunas' | 'nunggak' | 'lebih';
    payments?: Record<number, number>;
  };
  piket: {
    day: string;
    partners: Student[];
  };
  iceBreaking: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    pelajaranPertama: string;
    petugas: string[];
    isPast: boolean;
  }>;
  mbg: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    petugas: string[];
    isPast: boolean;
  }>;
  doa: Array<{
    isoDate: string;
    formattedDate: string;
    hari: string;
    roles: string[];
    isPast: boolean;
  }>;
  birthday?: string;
}

export interface SearchResultItem {
  id: string;
  category: 'student' | 'subject' | 'task' | 'event';
  title: string;
  subject?: string;
  subtitle?: string;
  badgeText: string;
  badgeColor: 'blue' | 'amber' | 'rose' | 'emerald' | 'purple';
  isoDate: string;
  formattedDate: string;
  details?: string;
  hasAttachment?: boolean;
  attachment?: TaskAttachment;
  time?: string;
  score?: number;
  subjectData?: SubjectDetailData;
  studentData?: StudentSummaryData;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataStore: ClassDataStore;
  onSelectDate: (isoDate: string) => void;
  onOpenAttachment?: (attachment: TaskAttachment, subjectTitle?: string) => void;
  darkMode?: boolean;
  todayISO?: string;
}

// Calculate JP count from time string (e.g. "07.10 - 08.40") or rawSummary
function computeJpCount(timeStr: string, rawSummary?: string): number {
  if (rawSummary) {
    const match = rawSummary.match(/JP\s*(\d+)(?:\s*-\s*(\d+))?/i);
    if (match) {
      const s = parseInt(match[1], 10);
      const e = match[2] ? parseInt(match[2], 10) : s;
      return Math.max(1, e - s + 1);
    }
  }
  const clean = timeStr.replace(/:/g, '.');
  const parts = clean.split(/\s*-\s*/);
  if (parts.length === 2) {
    const [h1, m1] = parts[0].split('.').map(Number);
    const [h2, m2] = parts[1].split('.').map(Number);
    if (!isNaN(h1) && !isNaN(h2)) {
      const diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
      if (diff > 0) {
        return Math.max(1, Math.round(diff / 45));
      }
    }
  }
  return 1;
}

function normalizeTimeSlot(timeStr: string): string {
  return timeStr
    .replace(/:/g, '.')
    .replace(/\s*-\s*/g, '-')
    .trim();
}

function isStudentNameMatch(text: string, student: Student): boolean {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  const nama = student.nama.toLowerCase();
  const panggilan = student.panggilan.toLowerCase();

  if (t === nama || t === panggilan) return true;
  if (t.includes(panggilan)) return true;
  if (nama.includes(t)) return true;

  // Word token match
  const studentWords = nama.split(/\s+/);
  const textWords = t.split(/[\s,;&/]+/);
  return textWords.some(tw => studentWords.includes(tw) || tw === panggilan);
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  dataStore,
  onSelectDate,
  onOpenAttachment,
  darkMode: _darkMode,
  todayISO
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDetailData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryData | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const activeTodayISO = todayISO || getWIBDateParts().iso;

  // Auto-focus input whenever search modal opens or returns from detail
  useEffect(() => {
    if (isOpen) {
      if (!selectedSubject && !selectedStudent) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      setQuery('');
      setCategory('all');
      setSelectedIndex(0);
      setSelectedSubject(null);
      setSelectedStudent(null);
      setCopiedNotification(null);
    }
  }, [isOpen, selectedSubject, selectedStudent]);

  // Build complete searchable items
  const allItems = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    // ==========================================
    // 1. Index Students (Daftar Siswa Kelas XB)
    // ==========================================
    STUDENTS_DATA.forEach(student => {
      // Find Kas Murid entry
      const kasStudent = dataStore.kasData?.students.find(
        s => s.absen === student.absen || isStudentNameMatch(s.nama, student)
      );

      // Piket Day & Partners
      const piketDay = PIKET_SCHEDULE_MAP[student.absen] || 'Belum Dijadwalkan';
      const piketPartners = STUDENTS_DATA.filter(
        s => s.absen !== student.absen && PIKET_SCHEDULE_MAP[s.absen] === piketDay
      );

      // Ice Breaking assignments
      const iceBreakingMatches: StudentSummaryData['iceBreaking'] = [];
      if (dataStore.iceBreakingByDate) {
        Object.keys(dataStore.iceBreakingByDate).sort().forEach(iso => {
          const entry = dataStore.iceBreakingByDate[iso];
          if (!entry || !entry.petugas) return;
          const isMatch = entry.petugas.some(p => isStudentNameMatch(p, student));
          if (isMatch) {
            const dateInfo = parseISODateParts(iso);
            iceBreakingMatches.push({
              isoDate: iso,
              formattedDate: dateInfo.formattedDate,
              hari: entry.hari,
              pelajaranPertama: entry.pelajaranPertama,
              petugas: entry.petugas,
              isPast: iso < activeTodayISO
            });
          }
        });
      }

      // MBG assignments
      const mbgMatches: StudentSummaryData['mbg'] = [];
      if (dataStore.mbgByDate) {
        Object.keys(dataStore.mbgByDate).sort().forEach(iso => {
          const entry = dataStore.mbgByDate[iso];
          if (!entry || !entry.petugas) return;
          const isMatch = entry.petugas.some(p => isStudentNameMatch(p, student));
          if (isMatch) {
            const dateInfo = parseISODateParts(iso);
            mbgMatches.push({
              isoDate: iso,
              formattedDate: dateInfo.formattedDate,
              hari: entry.hari,
              petugas: entry.petugas,
              isPast: iso < activeTodayISO
            });
          }
        });
      }

      // Doa & Renungan assignments
      const doaMatches: StudentSummaryData['doa'] = [];
      if (dataStore.doaByDate) {
        Object.keys(dataStore.doaByDate).sort().forEach(iso => {
          const entry = dataStore.doaByDate[iso];
          if (!entry) return;
          const roles: string[] = [];
          if (entry.doaPagi && isStudentNameMatch(entry.doaPagi, student)) roles.push('Doa Pagi');
          if (entry.renungan && isStudentNameMatch(entry.renungan, student)) roles.push('Renungan');
          if (entry.malaikatTuhan && isStudentNameMatch(entry.malaikatTuhan, student)) roles.push('Malaikat Tuhan');
          if (entry.doaPenutup && isStudentNameMatch(entry.doaPenutup, student)) roles.push('Doa Penutup');
          if (entry.bacaanInjil && isStudentNameMatch(entry.bacaanInjil, student)) roles.push('Bacaan Injil');

          if (roles.length > 0) {
            const dateInfo = parseISODateParts(iso);
            doaMatches.push({
              isoDate: iso,
              formattedDate: dateInfo.formattedDate,
              hari: entry.hari,
              roles,
              isPast: iso < activeTodayISO
            });
          }
        });
      }

      // Birthday lookup
      let birthdayStr: string | undefined;
      if (dataStore.birthdayByMonthDay) {
        for (const mdKey of Object.keys(dataStore.birthdayByMonthDay)) {
          const names = dataStore.birthdayByMonthDay[mdKey] || [];
          if (names.some(n => isStudentNameMatch(n, student))) {
            const [mStr, dStr] = mdKey.split('-');
            const m = parseInt(mStr, 10);
            const d = parseInt(dStr, 10);
            birthdayStr = `${d} ${MONTH_ID[m - 1]}`;
            break;
          }
        }
      }

      const studentSummary: StudentSummaryData = {
        student,
        kas: kasStudent
          ? {
              totalBayar: kasStudent.totalBayar,
              targetWajib: kasStudent.targetWajib,
              tunggakan: kasStudent.tunggakan,
              lebihBayar: kasStudent.lebihBayar,
              status: kasStudent.status,
              payments: kasStudent.payments
            }
          : undefined,
        piket: {
          day: piketDay,
          partners: piketPartners
        },
        iceBreaking: iceBreakingMatches,
        mbg: mbgMatches,
        doa: doaMatches,
        birthday: birthdayStr
      };

      const kasStatusText = kasStudent
        ? kasStudent.status === 'lunas'
          ? 'Kas: Lunas'
          : kasStudent.status === 'lebih'
          ? `Kas: Lebih Rp ${(kasStudent.lebihBayar).toLocaleString('id-ID')}`
          : `Kas: Nunggak Rp ${(kasStudent.tunggakan).toLocaleString('id-ID')}`
        : 'Kas: Belum ada data';

      list.push({
        id: `student_${student.absen}`,
        category: 'student',
        title: student.nama,
        subtitle: `Panggilan: ${student.panggilan} • No. Absen ${student.absen} (${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'})`,
        badgeText: `Absen #${student.absen}`,
        badgeColor: 'purple',
        isoDate: activeTodayISO,
        formattedDate: `Piket ${piketDay}`,
        details: `${kasStatusText} • Piket ${piketDay}${birthdayStr ? ` • Ultah: ${birthdayStr}` : ''}`,
        studentData: studentSummary
      });
    });

    // ==========================================
    // 2. Index Subjects (Mata Pelajaran)
    // Aggregated per distinct subject name with weekly breakdown
    // ==========================================
    if (dataStore.pelajaranByDate) {
      const subjectMap = new Map<
        string,
        {
          cleanName: string;
          slotsMap: Map<string, SubjectScheduleSlot>;
        }
      >();

      // Scan all dates to discover unique weekly schedule slots
      Object.keys(dataStore.pelajaranByDate).forEach(iso => {
        const periods = dataStore.pelajaranByDate[iso] || [];
        const dateInfo = parseISODateParts(iso);
        // Only consider school weekdays (Senin - Jumat)
        if (dateInfo.dayOfWeek < 1 || dateInfo.dayOfWeek > 5) return;

        const dayName = dateInfo.dowName;
        const dowIndex = dateInfo.dayOfWeek;

        periods.forEach(p => {
          const name = p.cleanName?.trim();
          if (!name || name === 'Pelajaran' || name.toLowerCase().includes('kegiatan')) return;

          if (!subjectMap.has(name)) {
            subjectMap.set(name, {
              cleanName: name,
              slotsMap: new Map()
            });
          }

          const subjObj = subjectMap.get(name)!;
          const cleanTime = normalizeTimeSlot(p.time);
          const slotKey = `${dayName}_${cleanTime}`;

          if (!subjObj.slotsMap.has(slotKey)) {
            const jpCount = computeJpCount(p.time, p.rawSummary);
            subjObj.slotsMap.set(slotKey, {
              dayName,
              dowIndex,
              timeStr: cleanTime,
              jpCount,
              formattedLine: `${dayName} | ${cleanTime} | ${jpCount} JP`,
              location: p.location
            });
          }
        });
      });

      // For each distinct subject, build SubjectDetailData & Search item
      subjectMap.forEach((subjObj, subjectName) => {
        const slots = Array.from(subjObj.slotsMap.values()).sort((a, b) => {
          if (a.dowIndex !== b.dowIndex) return a.dowIndex - b.dowIndex;
          return a.timeStr.localeCompare(b.timeStr);
        });

        const totalJp = slots.reduce((acc, s) => acc + s.jpCount, 0);

        // Find upcoming tasks for this subject
        const upcomingTasks: SubjectDetailData['upcomingTasks'] = [];
        if (dataStore.tasksByDate) {
          const currentWIB = getCurrentWIBTimeHHMM();
          Object.keys(dataStore.tasksByDate).sort().forEach(iso => {
            if (iso < activeTodayISO) return; // Only upcoming tasks
            const tasks = dataStore.tasksByDate[iso] || [];
            tasks.forEach(t => {
              if (t.subject.toLowerCase().trim() === subjectName.toLowerCase().trim()) {
                if (isTaskTimePassed(t, iso, activeTodayISO, currentWIB)) return;
                const dateInfo = parseISODateParts(iso);
                upcomingTasks.push({
                  isoDate: iso,
                  formattedDate: dateInfo.formattedDate,
                  task: t
                });
              }
            });
          });
        }

        const subjectDetail: SubjectDetailData = {
          name: subjectName,
          totalJp,
          slots,
          upcomingTasks
        };

        const daysSummary = Array.from(new Set(slots.map(s => s.dayName))).join(', ');
        const subtitleText = slots.length > 0
          ? `${slots.length} sesi per minggu • ${totalJp} JP (${daysSummary})`
          : 'Jadwal mingguan';

        const scheduleSummary = slots.map(s => s.formattedLine).join(' • ');

        list.push({
          id: `subject_${subjectName}`,
          category: 'subject',
          title: subjectName,
          subject: subjectName,
          subtitle: subtitleText,
          badgeText: `${totalJp} JP`,
          badgeColor: 'blue',
          isoDate: activeTodayISO,
          formattedDate: daysSummary || 'Mingguan',
          details: scheduleSummary || 'Klik untuk melihat jadwal lengkap & tugas mendatang',
          subjectData: subjectDetail
        });
      });
    }

    // ==========================================
    // 3. Index Tasks (Penugasan PR & Ulangan Sumatif)
    // ==========================================
    if (dataStore.tasksByDate) {
      Object.keys(dataStore.tasksByDate).forEach(iso => {
        const tasks = dataStore.tasksByDate[iso] || [];
        const dateInfo = parseISODateParts(iso);
        tasks.forEach((t, idx) => {
          const isSumatif = t.taskType === 'sumatif';
          const isPr = t.taskType === 'pr';
          const title = t.taskTitle || (t.taskText ? t.taskText.split('\n')[0] : '') || t.subject;
          const details = t.taskDetails || (t.taskText && t.taskText.includes('\n') ? t.taskText.split('\n').slice(1).join(' ') : '');

          list.push({
            id: `task_${iso}_${idx}_${t.subject}`,
            category: 'task',
            title,
            subject: t.subject,
            subtitle: `${t.subject}${t.time ? ` • ${t.time}` : ''}`,
            badgeText: isSumatif ? 'Sumatif' : isPr ? 'PR' : 'Tugas',
            badgeColor: isSumatif ? 'rose' : 'amber',
            isoDate: iso,
            formattedDate: dateInfo.formattedDate,
            details,
            hasAttachment: !!t.attachment,
            attachment: t.attachment,
            time: t.time
          });
        });
      });
    }

    // ==========================================
    // 4. Index Event Notices (Pengumuman & Acara)
    // 1. jika acara sudah selesai, tidak usah tampilkan!
    // ==========================================
    if (dataStore.eventNoticesByDate) {
      const seenEventIds = new Set<string>();
      Object.keys(dataStore.eventNoticesByDate).forEach(iso => {
        const notices = dataStore.eventNoticesByDate[iso] || [];
        notices.forEach(e => {
          // Rule 1: Sembunyikan acara yang sudah selesai
          if (e.endDate && e.endDate < activeTodayISO) {
            return;
          }

          const dedupeKey = e.id || `${e.title}_${e.startDate}`;
          if (seenEventIds.has(dedupeKey)) return;
          seenEventIds.add(dedupeKey);

          const dateInfo = parseISODateParts(e.startDate || iso);
          const isMulti = e.startDate && e.endDate && e.startDate !== e.endDate;
          const dateLabel = isMulti ? `${dateInfo.formattedDate} s/d ${e.endDate}` : dateInfo.formattedDate;

          list.push({
            id: `event_${dedupeKey}`,
            category: 'event',
            title: e.title,
            subtitle: e.location ? `Lokasi: ${e.location}` : isMulti ? `Acara (${e.totalDays || 1} Hari)` : 'Pengumuman Acara',
            badgeText: 'Acara & Pengumuman',
            badgeColor: 'emerald',
            isoDate: e.startDate || iso,
            formattedDate: dateLabel,
            details: e.description || e.location || '',
            hasAttachment: !!e.attachment,
            attachment: e.attachment
          });
        });
      });
    }

    return list;
  }, [dataStore, activeTodayISO]);

  // Filter & Rank results based on query and selected category
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // Base filter by category
    const byCategory = allItems.filter(item => {
      if (category === 'all') return true;
      return item.category === category;
    });

    if (!trimmed) {
      return byCategory.slice(0, 40);
    }

    // Score and filter matching items
    const scored = byCategory
      .map(item => {
        const titleLower = item.title.toLowerCase();
        const subjectLower = (item.subject || '').toLowerCase();
        const detailsLower = (item.details || '').toLowerCase();
        const subtitleLower = (item.subtitle || '').toLowerCase();
        const dateLower = item.formattedDate.toLowerCase();

        let score = 0;

        // Exact match
        if (titleLower === trimmed) {
          score += 120;
        } else if (titleLower.startsWith(trimmed)) {
          score += 80;
        } else if (titleLower.includes(trimmed)) {
          score += 50;
        }

        // Student short name (panggilan) exact / prefix boost
        if (item.category === 'student' && item.studentData) {
          const panggilan = item.studentData.student.panggilan.toLowerCase();
          const absenStr = String(item.studentData.student.absen);
          if (panggilan === trimmed) {
            score += 150;
          } else if (panggilan.startsWith(trimmed)) {
            score += 90;
          } else if (panggilan.includes(trimmed)) {
            score += 60;
          }

          // Match absen numbers: e.g. "1", "#1", "absen 1"
          const cleanNum = trimmed.replace(/^(#|absen\s*)/, '').trim();
          if (cleanNum && cleanNum === absenStr) {
            score += 140;
          }
        }

        if (subjectLower.includes(trimmed)) {
          score += 40;
        }

        if (subtitleLower.includes(trimmed)) {
          score += 30;
        }

        if (detailsLower.includes(trimmed)) {
          score += 20;
        }

        if (dateLower.includes(trimmed)) {
          score += 15;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 60);
  }, [allItems, query, category]);

  // Adjust selected index on query/category change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  // Keyboard navigation inside search results
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedSubject || selectedStudent) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedSubject(null);
          setSelectedStudent(null);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
          e.preventDefault();
          handleSelectItem(filteredResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, selectedSubject, selectedStudent, onClose]);

  // Auto-scroll the active keyboard result into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Handle click on item
  const handleSelectItem = (item: SearchResultItem) => {
    if (item.category === 'subject' && item.subjectData) {
      // 2. Tampilkan jadwal pelajaran mingguan & penugasan mendatang
      setSelectedSubject(item.subjectData);
    } else if (item.category === 'student' && item.studentData) {
      // 4. Tampilkan ringkasan lengkap data siswa
      setSelectedStudent(item.studentData);
    } else {
      // Task or Event notice -> jump to date
      onSelectDate(item.isoDate);
      onClose();
    }
  };

  // Helper to highlight matching text in search snippets
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-200 dark:bg-amber-900/60 text-stone-900 dark:text-amber-100 rounded-xs px-0.5 font-bold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: allItems.length,
      student: allItems.filter(i => i.category === 'student').length,
      subject: allItems.filter(i => i.category === 'subject').length,
      task: allItems.filter(i => i.category === 'task').length,
      event: allItems.filter(i => i.category === 'event').length
    };
  }, [allItems]);

  // Copy Subject Schedule to clipboard
  const handleCopySubjectSchedule = async (subject: SubjectDetailData) => {
    const lines = [
      `📚 *Jadwal Mata Pelajaran: ${subject.name}*`,
      `Kelas XB • Total: ${subject.totalJp} JP/minggu`,
      '',
      '*Jadwal Mingguan:*',
      ...subject.slots.map(s => `• ${s.formattedLine}`),
      ''
    ];

    if (subject.upcomingTasks.length > 0) {
      lines.push('*Penugasan / Agenda Mendatang:*');
      subject.upcomingTasks.forEach(t => {
        lines.push(`• [${t.task.taskType?.toUpperCase() || 'TUGAS'}] ${t.formattedDate}: ${t.task.taskTitle || t.task.taskText}`);
      });
    } else {
      lines.push('Tidak ada penugasan atau ulangan mendatang.');
    }

    const ok = await copyTextToClipboard(lines.join('\n'));
    if (ok) {
      setCopiedNotification(`Jadwal ${subject.name} tersalin!`);
      setTimeout(() => setCopiedNotification(null), 2000);
    }
  };

  // Copy Student Dossier to clipboard
  const handleCopyStudentSummary = async (summary: StudentSummaryData) => {
    const s = summary.student;
    const lines = [
      `👤 *Ringkasan Siswa: ${s.nama} (${s.panggilan})*`,
      `No. Absen: ${s.absen} • Jenis Kelamin: ${s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      `Kelas XB SMA Putra Nirmala`,
      '',
      `🧹 *Jadwal Piket Kebersihan:* Hari ${summary.piket.day}`,
      `Rekan Piket: ${summary.piket.partners.map(p => `${p.panggilan} (#${p.absen})`).join(', ') || '-'}`,
      ''
    ];

    if (summary.kas) {
      lines.push(`💰 *Buku Kas Murid:*`);
      lines.push(`• Status: ${summary.kas.status === 'lunas' ? 'Lunas ✅' : summary.kas.status === 'lebih' ? 'Lebih Bayar' : 'Menunggak ⚠️'}`);
      lines.push(`• Total Bayar: Rp ${summary.kas.totalBayar.toLocaleString('id-ID')}`);
      lines.push(`• Target Wajib: Rp ${summary.kas.targetWajib.toLocaleString('id-ID')}`);
      if (summary.kas.tunggakan > 0) {
        lines.push(`• Tunggakan: Rp ${summary.kas.tunggakan.toLocaleString('id-ID')}`);
      }
      lines.push('');
    }

    if (summary.iceBreaking.length > 0) {
      lines.push(`🎲 *Jadwal Petugas Ice Breaking:*`);
      summary.iceBreaking.forEach(ib => {
        lines.push(`• ${ib.formattedDate} (${ib.hari}) - Bersama: ${ib.petugas.join(', ')}`);
      });
      lines.push('');
    }

    if (summary.mbg.length > 0) {
      lines.push(`🍱 *Jadwal Petugas MBG:*`);
      summary.mbg.forEach(m => {
        lines.push(`• ${m.formattedDate} (${m.hari}) - Bersama: ${m.petugas.join(', ')}`);
      });
      lines.push('');
    }

    if (summary.doa.length > 0) {
      lines.push(`🙏 *Jadwal Petugas Doa & Renungan:*`);
      summary.doa.forEach(d => {
        lines.push(`• ${d.formattedDate} (${d.hari}) - Tugas: ${d.roles.join(', ')}`);
      });
      lines.push('');
    }

    if (summary.birthday) {
      lines.push(`🎂 *Hari Ulang Tahun:* ${summary.birthday}`);
    }

    const ok = await copyTextToClipboard(lines.join('\n'));
    if (ok) {
      setCopiedNotification(`Data ${s.panggilan} tersalin!`);
      setTimeout(() => setCopiedNotification(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#18191C] rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden max-h-[88vh] text-stone-900 dark:text-stone-100 transition-all animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* SUB-VIEW 1: DETAIL MATA PELAJARAN (Jadwal Mingguan & Tugas Mendatang)    */}
        {/* ========================================================================= */}
        {selectedSubject ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            {/* Subject Detail Header */}
            <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-[#151619] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-[#202227] text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Kembali ke hasil pencarian"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Kembali</span>
                </button>

                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 dark:bg-[#0E1A29] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-editorial font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {selectedSubject.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Mata Pelajaran • Kelas XB SMA Putra Nirmala
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySubjectSchedule(selectedSubject)}
                  title="Salin Jadwal & Tugas"
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-xs font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden sm:inline">Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-600 dark:text-stone-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subject Detail Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 min-h-0">
              {/* Jadwal Pelajaran Mingguan Card */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Jadwal Pelajaran Mingguan
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/70">
                    Total: {selectedSubject.totalJp} JP/minggu
                  </span>
                </div>

                {selectedSubject.slots.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 bg-stone-50 dark:bg-[#16171A] rounded-xl border border-stone-200/70 dark:border-stone-800">
                    Jadwal pelajaran belum terdaftar dalam kalender rutin.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSubject.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#16171A] flex items-center justify-between gap-3 shadow-2xs hover:border-blue-500/40 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-16 px-2 py-1 rounded-md text-center text-xs font-bold bg-white dark:bg-[#202227] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 shadow-2xs">
                            {slot.dayName}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                              {slot.timeStr}
                            </span>
                            {slot.location && (
                              <p className="text-[11px] text-stone-500 truncate">{slot.location}</p>
                            )}
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                          {slot.jpCount} JP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Penugasan / Agenda Mendatang */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Penugasan &amp; Agenda Mendatang
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {selectedSubject.upcomingTasks.length} Agenda
                  </span>
                </div>

                {selectedSubject.upcomingTasks.length === 0 ? (
                  <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-[#16171A] text-center flex flex-col items-center justify-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mb-1.5" />
                    <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                      Tidak ada penugasan atau ulangan mendatang
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Semua tugas atau PR mata pelajaran ini sudah terselesaikan atau belum diumumkan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSubject.upcomingTasks.map((tItem, tIdx) => {
                      const isSumatif = tItem.task.taskType === 'sumatif';
                      const isPr = tItem.task.taskType === 'pr';

                      return (
                        <div
                          key={tIdx}
                          onClick={() => {
                            onSelectDate(tItem.isoDate);
                            onClose();
                          }}
                          className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] hover:bg-stone-50 dark:hover:bg-[#1E2024] hover:border-emerald-600/40 transition cursor-pointer flex items-start justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isSumatif
                                    ? 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                    : isPr
                                    ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                    : 'bg-blue-100/80 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                }`}
                              >
                                {isSumatif ? 'Sumatif' : isPr ? 'PR' : 'Tugas'}
                              </span>

                              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{tItem.formattedDate}</span>
                              </span>

                              {tItem.task.attachment && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-[#122A1E] px-1.5 py-0.2 rounded border border-emerald-600/25">
                                  <FileImage className="w-3 h-3" />
                                  <span>Lampiran</span>
                                </span>
                              )}
                            </div>

                            <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              <FormattedText content={tItem.task.taskTitle || tItem.task.taskText.split('\n')[0]} inline />
                            </h5>

                            {tItem.task.taskDetails && (
                              <div className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                                <FormattedText content={tItem.task.taskDetails} />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs font-semibold text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition self-center flex-shrink-0">
                            <span>Buka</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Detail Footer */}
            <div className="p-3 sm:p-4 bg-stone-50 dark:bg-[#141518] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Pencarian</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-700 dark:text-stone-300 font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : selectedStudent ? (
          /* ========================================================================= */
          /* SUB-VIEW 2: RINGKASAN SISWA (Kas, Piket, Ice Breaking, Doa, MBG, dll.)  */
          /* ========================================================================= */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            {/* Student Header */}
            <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-[#151619] flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-[#202227] text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Kembali ke hasil pencarian"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Kembali</span>
                </button>

                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-[#241738] text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
                  {selectedStudent.student.absen}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-editorial font-bold text-stone-900 dark:text-stone-100 leading-tight truncate">
                      {selectedStudent.student.nama}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Panggilan: {selectedStudent.student.panggilan}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Absen #{selectedStudent.student.absen} • {selectedStudent.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Kelas XB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyStudentSummary(selectedStudent)}
                  title="Salin Ringkasan Siswa"
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-xs font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden sm:inline">Salin Data</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-600 dark:text-stone-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Dossier Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
              {/* Grid 1: Status Kas & Piket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Buku Kas Card */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                          Buku Kas Murid
                        </h4>
                      </div>
                      {selectedStudent.kas ? (
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                            selectedStudent.kas.status === 'lunas'
                              ? 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : selectedStudent.kas.status === 'lebih'
                              ? 'bg-blue-100/90 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : 'bg-rose-100/90 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {selectedStudent.kas.status === 'lunas'
                            ? 'Lunas'
                            : selectedStudent.kas.status === 'lebih'
                            ? 'Lebih Bayar'
                            : 'Nunggak'}
                        </span>
                      ) : null}
                    </div>

                    {selectedStudent.kas ? (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500">Total Dibayar:</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                            Rp {selectedStudent.kas.totalBayar.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500">Target Wajib:</span>
                          <span className="font-mono text-stone-700 dark:text-stone-300">
                            Rp {selectedStudent.kas.targetWajib.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {selectedStudent.kas.tunggakan > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 dark:border-stone-800 font-semibold text-rose-600 dark:text-rose-400">
                            <span>Sisa Tunggakan:</span>
                            <span className="font-mono">
                              Rp {selectedStudent.kas.tunggakan.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        {selectedStudent.kas.lebihBayar > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 dark:border-stone-800 font-semibold text-blue-600 dark:text-blue-400">
                            <span>Kelebihan Bayar:</span>
                            <span className="font-mono">
                              Rp {selectedStudent.kas.lebihBayar.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}

                        {/* Piktogram Riwayat Minggu Siswa */}
                        {dataStore.kasData?.weeks && dataStore.kasData.weeks.length > 0 && selectedStudent.kas.payments && (
                          <div className="pt-2 mt-1 border-t border-stone-200/60 dark:border-stone-800">
                            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                              <span>Piktogram Riwayat:</span>
                              <span className="font-mono font-medium">
                                {dataStore.kasData.weeks.filter(w => (selectedStudent.kas!.payments![w.colIndex] || 0) >= 3000).length}/{dataStore.kasData.weeks.filter(w => w.isElapsed).length} lunas
                              </span>
                            </div>
                            <div className="flex items-center gap-[2px] overflow-x-auto no-scrollbar py-0.5">
                              {dataStore.kasData.weeks.map((w, i) => {
                                const amt = selectedStudent.kas!.payments![w.colIndex] || 0;
                                const isPaid = amt >= 3000;
                                const isPartial = amt > 0 && amt < 3000;
                                const isUnpaidPast = amt === 0 && w.isElapsed;

                                const prevW = dataStore.kasData!.weeks[i - 1];
                                const isNewMonth = prevW && prevW.monthName !== w.monthName;

                                const barClass = isPaid
                                  ? 'bg-emerald-600 dark:bg-emerald-500'
                                  : isPartial
                                  ? 'bg-amber-500 dark:bg-amber-400'
                                  : isUnpaidPast
                                  ? 'bg-rose-500 dark:bg-rose-500'
                                  : 'bg-stone-200 dark:bg-stone-700';

                                return (
                                  <span
                                    key={w.colIndex}
                                    title={`Minggu ${i + 1} (${w.label}): ${
                                      isPaid
                                        ? `Lunas (Rp ${amt.toLocaleString('id-ID')})`
                                        : isPartial
                                        ? `Kurang (Rp ${amt.toLocaleString('id-ID')})`
                                        : isUnpaidPast
                                        ? 'Menunggak (Rp 0)'
                                        : 'Belum Jatuh Tempo'
                                    }`}
                                    className={`w-1.5 h-3.5 rounded-2xs flex-shrink-0 transition-transform hover:scale-125 cursor-pointer ${
                                      isNewMonth ? 'ml-0.5' : ''
                                    } ${barClass}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic mt-2">
                        Belum ada catatan kas untuk siswa ini.
                      </p>
                    )}
                  </div>
                </div>

                {/* Piket Kebersihan Card */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                          Piket Kebersihan
                        </h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Hari {selectedStudent.piket.day}
                      </span>
                    </div>

                    <div className="mt-2 text-xs">
                      <p className="text-stone-500 font-medium mb-1">Teman Satu Regu Piket:</p>
                      {selectedStudent.piket.partners.length === 0 ? (
                        <p className="text-stone-400 italic">Tidak ada rekan regu terdata</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedStudent.piket.partners.map(p => (
                            <span
                              key={p.absen}
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-[#202227] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                            >
                              {p.panggilan} (#{p.absen})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Ice Breaking & MBG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Petugas Ice Breaking */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      Tugas Ice Breaking ({selectedStudent.iceBreaking.length})
                    </h4>
                  </div>

                  {selectedStudent.iceBreaking.length === 0 ? (
                    <p className="text-xs text-stone-500 italic py-2">
                      Belum ada penugasan ice breaking untuk siswa ini.
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                      {selectedStudent.iceBreaking.map((ib, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onSelectDate(ib.isoDate);
                            onClose();
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                            ib.isPast
                              ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                              : 'bg-indigo-50/60 dark:bg-[#151728] border-indigo-200/70 dark:border-indigo-900/70'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                            <span>{ib.hari}, {ib.formattedDate}</span>
                            {!ib.isPast && (
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                                Akan Datang
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            Petugas: {ib.petugas.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Petugas MBG */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      Tugas MBG ({selectedStudent.mbg.length})
                    </h4>
                  </div>

                  {selectedStudent.mbg.length === 0 ? (
                    <p className="text-xs text-stone-500 italic py-2">
                      Belum ada penugasan MBG (Makan Bergizi Gratis).
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                      {selectedStudent.mbg.map((m, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onSelectDate(m.isoDate);
                            onClose();
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                            m.isPast
                              ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                              : 'bg-emerald-50/60 dark:bg-[#0E2018] border-emerald-200/70 dark:border-emerald-900/70'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                            <span>{m.hari}, {m.formattedDate}</span>
                            {!m.isPast && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                Akan Datang
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            Petugas: {m.petugas.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 3: Doa & Renungan & Ulang Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Petugas Doa & Renungan */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <BookMarked className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      Doa &amp; Renungan ({selectedStudent.doa.length})
                    </h4>
                  </div>

                  {selectedStudent.doa.length === 0 ? (
                    <p className="text-xs text-stone-500 italic py-2">
                      Belum ada jadwal doa atau renungan tercatat.
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                      {selectedStudent.doa.map((d, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onSelectDate(d.isoDate);
                            onClose();
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                            d.isPast
                              ? 'bg-stone-50/70 dark:bg-[#1A1B1F] border-stone-200/60 dark:border-stone-800/60 opacity-75'
                              : 'bg-purple-50/60 dark:bg-[#1E1428] border-purple-200/70 dark:border-purple-900/70'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                            <span>{d.hari}, {d.formattedDate}</span>
                            {!d.isPast && (
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">
                                Akan Datang
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {d.roles.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ulang Tahun & Profil Info */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#16171A] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                        Ulang Tahun &amp; Profil
                      </h4>
                    </div>

                    <div className="space-y-2 mt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Tanggal Ulang Tahun:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {selectedStudent.birthday ? `🎂 ${selectedStudent.birthday}` : 'Belum tercatat'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Nomor Absen:</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                          #{selectedStudent.student.absen}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Jenis Kelamin:</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {selectedStudent.student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Dossier Footer */}
            <div className="p-3 sm:p-4 bg-stone-50 dark:bg-[#141518] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Pencarian</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-700 dark:text-stone-300 font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MAIN SEARCH VIEW (Search Bar, Category Filters, Results List)             */
          /* ========================================================================= */
          <>
            {/* Top Search Input Bar */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center gap-3 bg-stone-50/70 dark:bg-[#151619] flex-shrink-0">
              <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari nama siswa, mata pelajaran, tugas PR, sumatif..."
                aria-label="Cari nama siswa, mata pelajaran, tugas, atau acara"
                className="flex-1 bg-transparent text-sm sm:text-base font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  title="Hapus pencarian"
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup pencarian"
                className="p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] text-stone-600 dark:text-stone-300 transition cursor-pointer"
              >
                <span className="text-xs font-mono px-1">ESC</span>
              </button>
            </div>

            {/* Filter Category Tabs (Horizontally scrollable on mobile with smooth touch pan) */}
            <div
              className="px-3.5 py-2 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-[#131417] flex items-center gap-1.5 overflow-x-auto flex-shrink-0 w-full min-w-0 max-w-full touch-pan-x overscroll-x-contain no-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
            >
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  category === 'all'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-stone-400 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Semua</span>
                <span className="text-[10px] opacity-75">({counts.all})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  category === 'student'
                    ? 'bg-purple-700 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-stone-400 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <Users className="w-3 h-3 text-purple-500" />
                <span>Siswa</span>
                <span className="text-[10px] opacity-75">({counts.student})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('subject')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  category === 'subject'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-stone-400 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <BookOpen className="w-3 h-3 text-blue-500" />
                <span>Mata Pelajaran</span>
                <span className="text-[10px] opacity-75">({counts.subject})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('task')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  category === 'task'
                    ? 'bg-amber-700 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-stone-400 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Tugas &amp; PR</span>
                <span className="text-[10px] opacity-75">({counts.task})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('event')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  category === 'event'
                    ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-stone-400 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <Megaphone className="w-3 h-3 text-emerald-500" />
                <span>Acara</span>
                <span className="text-[10px] opacity-75">({counts.event})</span>
              </button>
            </div>

            {/* Results List */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 min-h-[240px]"
            >
              {filteredResults.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <Search className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-2 stroke-1" />
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Tidak ada hasil ditemukan
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                    Coba cari nama siswa (cth: &quot;Alecha&quot;, &quot;Kim&quot;, &quot;#12&quot;), mapel (&quot;Fisika&quot;, &quot;Matematika&quot;), atau jenis tugas (&quot;Sumatif&quot;, &quot;PR&quot;).
                  </p>

                  {/* Quick Suggestion Pills */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
                    <span className="text-xs text-stone-400 mr-1">Saran:</span>
                    {['Fisika', 'Matematika', 'Alecha', 'Xander', 'Sumatif', 'PR', 'Kim', 'Biologi'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQuery(tag);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                        isSelected
                          ? 'bg-stone-100/90 dark:bg-[#202227] border-emerald-600/40 dark:border-emerald-500/40 shadow-xs'
                          : 'bg-white dark:bg-[#16171A] border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-[#1D1E22]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Category Icon */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            item.category === 'student'
                              ? 'bg-purple-50 text-purple-700 dark:bg-[#1E1428] dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60'
                              : item.category === 'subject'
                              ? 'bg-blue-50 text-blue-700 dark:bg-[#0E1A29] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60'
                              : item.badgeColor === 'rose'
                              ? 'bg-rose-50 text-rose-700 dark:bg-[#230C10] dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60'
                              : item.category === 'task'
                              ? 'bg-amber-50 text-amber-700 dark:bg-[#20170A] dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-[#0E2018] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60'
                          }`}
                        >
                          {item.category === 'student' ? (
                            <Users className="w-4 h-4" />
                          ) : item.category === 'subject' ? (
                            <BookOpen className="w-4 h-4" />
                          ) : item.badgeColor === 'rose' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : item.category === 'task' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Megaphone className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Top Badges & Subject */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.category === 'student'
                                  ? 'bg-purple-100/90 text-purple-900 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                                  : item.badgeColor === 'blue'
                                  ? 'bg-blue-100/80 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                  : item.badgeColor === 'rose'
                                  ? 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                  : item.badgeColor === 'amber'
                                  ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                  : 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              }`}
                            >
                              {item.badgeText}
                            </span>

                            {item.category !== 'subject' && item.subject && (
                              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                {item.subject}
                              </span>
                            )}

                            {item.hasAttachment && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-[#122A1E] px-1.5 py-0.2 rounded border border-emerald-600/25">
                                <FileImage className="w-3 h-3" />
                                <span>Ada Lampiran</span>
                              </span>
                            )}
                          </div>

                          {/* Main Title */}
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                            {highlightMatch(item.title, query)}
                          </h4>

                          {/* Details / Snippet if available */}
                          {item.details && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                              {highlightMatch(item.details, query)}
                            </p>
                          )}

                          {/* Date & Time Footer */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{item.formattedDate}</span>
                            </span>

                            {item.time && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>{item.time}</span>
                              </span>
                            )}

                            {item.subtitle && item.category !== 'task' && (
                              <span className="truncate">{item.subtitle}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Trigger */}
                      <div className="flex items-center gap-2 self-center flex-shrink-0">
                        {item.hasAttachment && item.attachment && onOpenAttachment && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenAttachment(item.attachment!, item.subject || item.title);
                            }}
                            title="Buka lampiran langsung"
                            className="p-1.5 rounded-lg border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                          >
                            <FileImage className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isSelected
                              ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-2xs'
                              : 'bg-stone-100 dark:bg-[#222429] text-stone-700 dark:text-stone-300 group-hover:bg-emerald-800 group-hover:text-white dark:group-hover:bg-emerald-700'
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {item.category === 'subject'
                              ? 'Jadwal'
                              : item.category === 'student'
                              ? 'Ringkasan'
                              : 'Buka'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Shortcut Helper */}
            <div className="px-4 py-2.5 bg-stone-50 dark:bg-[#141518] border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded shadow-2xs">↑</kbd>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded shadow-2xs">↓</kbd>
                  <span>Navigasi</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded shadow-2xs">
                    <CornerDownLeft className="w-2.5 h-2.5 inline" /> Enter
                  </kbd>
                  <span>Pilih</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded shadow-2xs">Esc</kbd>
                  <span>Tutup</span>
                </span>
              </div>

              <div className="text-right flex-1 sm:flex-initial">
                <span>Ditemukan {filteredResults.length} hasil</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
