import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Shuffle,
  Download,
  Copy,
  Check,
  Crown,
  RotateCcw,
  UserCheck,
  Shield,
  FastForward
} from 'lucide-react';
import { Student, STUDENTS_DATA } from '../data/studentsData';
import { cryptoShuffle, cryptoRandomInt } from '../utils/cryptoRandom';

interface GroupGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedGroup {
  id: string;
  name: string;
  members: Student[];
  representativeId?: number; // student absen
}

export const GroupGeneratorModal: React.FC<GroupGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [nameMode, setNameMode] = useState<'panggilan' | 'nama'>('panggilan');
  const [selectedAbsens, setSelectedAbsens] = useState<number[]>(() => STUDENTS_DATA.map(s => s.absen));
  const [splitMode, setSplitMode] = useState<'numGroups' | 'maxPeople'>('numGroups');
  const [numGroups, setNumGroups] = useState<number>(5);
  const [maxPeople, setMaxPeople] = useState<number>(7);
  const [genderBalance, setGenderBalance] = useState<boolean>(true);
  const [pickRepresentative, setPickRepresentative] = useState<boolean>(true);

  const [generatedGroups, setGeneratedGroups] = useState<GeneratedGroup[] | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<string>('');

  // Progressive batch (kloter) reveal state
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [showRepresentatives, setShowRepresentatives] = useState<boolean>(true);
  const [revealedAbsens, setRevealedAbsens] = useState<Set<number>>(new Set());
  const [currentKloter, setCurrentKloter] = useState<number>(0);
  const [totalKloters, setTotalKloters] = useState<number>(0);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const klotersRef = useRef<number[][]>([]);
  const kloterIndexRef = useRef<number>(0);

  const stopRevealTimer = () => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  const startProgressiveReveal = (groups: GeneratedGroup[]) => {
    stopRevealTimer();

    // 1. In each group, randomize the order of slot reveals
    // e.g. Kelompok 1 reveals slot 4 first, Kelompok 2 reveals slot 6 first,
    // Kelompok 3 reveals slot 1 first, Kelompok 4 reveals slot 3 first, Kelompok 5 reveals slot 6 first!
    const groupOrders: number[][] = groups.map(g => {
      const indices = g.members.map((_, i) => i);
      return cryptoShuffle(indices);
    });

    // 2. Build kloter batches:
    // In Kloter 0: 1 member from Kelompok 1, 1 from Kelompok 2, 1 from Kelompok 3, 1 from Kelompok 4, 1 from Kelompok 5
    // ALL appear simultaneously at the exact same moment!
    // In Kloter 1: the next member from each group appears simultaneously!
    const maxGroupSize = Math.max(...groups.map(g => g.members.length));
    const kloters: number[][] = [];
    for (let round = 0; round < maxGroupSize; round++) {
      const batch: number[] = [];
      for (let g = 0; g < groups.length; g++) {
        const order = groupOrders[g];
        if (round < order.length) {
          const memberIdx = order[round];
          const student = groups[g].members[memberIdx];
          batch.push(student.absen);
        }
      }
      if (batch.length > 0) {
        kloters.push(batch);
      }
    }

    klotersRef.current = kloters;
    kloterIndexRef.current = 0;
    setTotalKloters(kloters.length);
    setCurrentKloter(0);
    setIsRevealing(true);
    setShowRepresentatives(false); // Hide Ketua while names are being drawn
    setRevealedAbsens(new Set());

    const stepKloter = () => {
      const idx = kloterIndexRef.current;
      if (idx < kloters.length) {
        const batch = kloters[idx];
        // All names in this kloter batch appear SIMULTANEOUSLY with smooth fade in
        setRevealedAbsens(prev => {
          const next = new Set(prev);
          batch.forEach(a => next.add(a));
          return next;
        });
        setCurrentKloter(idx + 1);
        kloterIndexRef.current = idx + 1;
        // Pause between kloters for audience tension
        revealTimerRef.current = setTimeout(stepKloter, 850);
      } else {
        // All members across all groups are now revealed!
        setIsRevealing(false);
        // Requirement 3: In one single moment, all Ketua badges appear together!
        revealTimerRef.current = setTimeout(() => {
          setShowRepresentatives(true);
          revealTimerRef.current = null;
        }, 500);
      }
    };

    revealTimerRef.current = setTimeout(stepKloter, 300);
  };

  const handleSkipAnimation = () => {
    stopRevealTimer();
    if (generatedGroups) {
      const all = new Set<number>();
      generatedGroups.forEach(g => g.members.forEach(m => all.add(m.absen)));
      setRevealedAbsens(all);
    }
    setIsRevealing(false);
    setShowRepresentatives(true);
  };

  const handleReplayAnimation = () => {
    if (!generatedGroups) return;
    startProgressiveReveal(generatedGroups);
  };

  useEffect(() => {
    return () => {
      stopRevealTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopRevealTimer();
      setIsRevealing(false);
    }
  }, [isOpen]);

  const activeStudents = useMemo(() => {
    return STUDENTS_DATA.filter(s => selectedAbsens.includes(s.absen));
  }, [selectedAbsens]);

  // Handle participant toggling
  const handleToggleStudent = (absen: number) => {
    setSelectedAbsens(prev =>
      prev.includes(absen) ? prev.filter(a => a !== absen) : [...prev, absen].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => setSelectedAbsens(STUDENTS_DATA.map(s => s.absen));
  const handleDeselectAll = () => setSelectedAbsens([]);

  // Generate groups logic
  const handleGenerate = () => {
    if (activeStudents.length === 0) return;

    let targetGroupCount = 2;
    if (splitMode === 'numGroups') {
      targetGroupCount = Math.max(1, Math.min(numGroups, activeStudents.length));
    } else {
      const perGroup = Math.max(1, maxPeople);
      targetGroupCount = Math.max(1, Math.ceil(activeStudents.length / perGroup));
    }

    const totalStudents = activeStudents.length;
    const baseSize = Math.floor(totalStudents / targetGroupCount);
    const remainder = totalStudents % targetGroupCount;

    // Strict capacities: the first `remainder` groups get (baseSize + 1), the rest get baseSize.
    // E.g. for 33 students into 9 groups: Kelompok 1-6 get 4, Kelompok 7-9 get 3.
    const capacities = Array.from({ length: targetGroupCount }, (_, idx) =>
      idx < remainder ? baseSize + 1 : baseSize
    );

    const groups: GeneratedGroup[] = Array.from({ length: targetGroupCount }, (_, idx) => ({
      id: `group_${idx + 1}`,
      name: `Kelompok ${idx + 1}`,
      members: []
    }));

    if (genderBalance) {
      // Separate males and females with cryptoShuffle
      const males = cryptoShuffle<Student>(activeStudents.filter(s => s.gender === 'L'));
      const females = cryptoShuffle<Student>(activeStudents.filter(s => s.gender === 'P'));

      // Distribute males fairly without exceeding group capacities
      for (const male of males) {
        let bestGroup = -1;
        let minMales = Infinity;
        for (let i = 0; i < targetGroupCount; i++) {
          if (groups[i].members.length < capacities[i]) {
            const maleCount = groups[i].members.filter(m => m.gender === 'L').length;
            if (maleCount < minMales) {
              minMales = maleCount;
              bestGroup = i;
            }
          }
        }
        if (bestGroup !== -1) {
          groups[bestGroup].members.push(male);
        }
      }

      // Distribute females to fill remaining capacity
      for (const female of females) {
        let bestGroup = -1;
        let minFemales = Infinity;
        for (let i = 0; i < targetGroupCount; i++) {
          if (groups[i].members.length < capacities[i]) {
            const femaleCount = groups[i].members.filter(m => m.gender === 'P').length;
            if (femaleCount < minFemales) {
              minFemales = femaleCount;
              bestGroup = i;
            }
          }
        }
        if (bestGroup !== -1) {
          groups[bestGroup].members.push(female);
        }
      }
    } else {
      // Pure random shuffle with strict capacity enforcement
      const shuffled = cryptoShuffle<Student>(activeStudents);
      let sIdx = 0;
      for (let g = 0; g < targetGroupCount; g++) {
        const cap = capacities[g];
        for (let c = 0; c < cap; c++) {
          if (sIdx < shuffled.length) {
            groups[g].members.push(shuffled[sIdx++]);
          }
        }
      }
    }

    // Sort members by absen within each group for neatness
    groups.forEach(g => {
      g.members.sort((a, b) => a.absen - b.absen);
      if (pickRepresentative && g.members.length > 0) {
        const randIdx = cryptoRandomInt(0, g.members.length - 1);
        g.representativeId = g.members[randIdx].absen;
      }
    });

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    setGenerationTimestamp(timeStr);
    setGeneratedGroups(groups);
    startProgressiveReveal(groups);
  };

  // Re-pick representatives without changing members
  const handleRepickRepresentatives = () => {
    if (!generatedGroups) return;
    setGeneratedGroups(prev => {
      if (!prev) return null;
      return prev.map(g => {
        if (g.members.length === 0) return g;
        const randIdx = cryptoRandomInt(0, g.members.length - 1);
        return {
          ...g,
          representativeId: g.members[randIdx].absen
        };
      });
    });
    setShowRepresentatives(true);
  };

  // Inline rename group
  const handleRenameGroup = (groupId: string, newName: string) => {
    setGeneratedGroups(prev => {
      if (!prev) return null;
      return prev.map(g => (g.id === groupId ? { ...g, name: newName } : g));
    });
  };

  // Export & Download CSV
  const handleDownloadCSV = () => {
    if (!generatedGroups) return;

    let csvContent = 'Kelompok,No_Absen,Nama_Siswa,Gender,Peran\r\n';

    generatedGroups.forEach(g => {
      g.members.forEach(m => {
        const isRep = g.representativeId === m.absen;
        const role = isRep ? 'Perwakilan' : 'Anggota';
        const nameToUse = nameMode === 'nama' ? m.nama : m.panggilan;
        // Escape commas/quotes in CSV fields
        const safeGroupName = `"${g.name.replace(/"/g, '""')}"`;
        const safeStudentName = `"${nameToUse.replace(/"/g, '""')}"`;
        csvContent += `${safeGroupName},${m.absen},${safeStudentName},${m.gender},${role}\r\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `kelompok_XB_${generationTimestamp || 'terbaru'}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also persist to backend exports volume if running in Docker/server
    fetch('/api/kelompok/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, csvContent })
    }).catch(() => {});
  };

  // Copy WhatsApp Friendly Text
  const handleCopyText = () => {
    if (!generatedGroups) return;

    let text = `📋 *PEMBAGIAN KELOMPOK KELAS XB - SMA PUTRA NIRMALA*\n`;
    text += `Total Peserta: ${activeStudents.length} Siswa | ${generatedGroups.length} Kelompok\n\n`;

    generatedGroups.forEach(g => {
      text += `🌟 *${g.name.toUpperCase()}* (${g.members.length} Siswa)\n`;
      g.members.forEach(m => {
        const isRep = g.representativeId === m.absen;
        const nameToUse = nameMode === 'nama' ? m.nama : m.panggilan;
        const repPrefix = isRep ? '👑 [Perwakilan] ' : '• ';
        text += `${repPrefix}${nameToUse} (Absen ${m.absen})\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-generator-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 id="group-generator-title" className="font-editorial font-bold text-base sm:text-lg leading-tight text-stone-900 dark:text-stone-100">
                Random Group Name Picker (Team Generator)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                SMA Putra Nirmala • Kelas XB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Group Generator"
            className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Name Mode Toggle */}
            <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Format Nama:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setNameMode('panggilan')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    nameMode === 'panggilan'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                      : 'bg-white dark:bg-[#18191C] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                  }`}
                >
                  Nama Panggilan
                </button>
                <button
                  type="button"
                  onClick={() => setNameMode('nama')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    nameMode === 'nama'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                      : 'bg-white dark:bg-[#18191C] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                  }`}
                >
                  Nama Panjang
                </button>
              </div>
            </div>

            {/* 2. Number of Groups vs Max People */}
            <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Metode Pembagian:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSplitMode('numGroups')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      splitMode === 'numGroups'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80'
                    }`}
                  >
                    Jml Kelompok
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('maxPeople')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      splitMode === 'maxPeople'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80'
                    }`}
                  >
                    Maks Orang
                  </button>
                </div>
              </div>

              {splitMode === 'numGroups' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={Math.min(12, Math.max(2, activeStudents.length))}
                    value={numGroups}
                    onChange={e => setNumGroups(Number(e.target.value))}
                    className="flex-1 accent-emerald-700"
                  />
                  <span className="font-mono font-bold text-sm bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 px-2.5 py-1 rounded-md border border-stone-200/80 dark:border-stone-800/80 min-w-[65px] text-center">
                    {numGroups} Grup
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={Math.min(15, Math.max(2, activeStudents.length))}
                    value={maxPeople}
                    onChange={e => setMaxPeople(Number(e.target.value))}
                    className="flex-1 accent-emerald-700"
                  />
                  <span className="font-mono font-bold text-sm bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 px-2.5 py-1 rounded-md border border-stone-200/80 dark:border-stone-800/80 min-w-[75px] text-center">
                    {maxPeople} Org/Grup
                  </span>
                </div>
              )}
            </div>

            {/* 3. Balanced Gender & Representative Options */}
            <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genderBalance}
                  onChange={e => setGenderBalance(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700 accent-emerald-700 w-4 h-4"
                />
                <span>Seimbangkan Gender (L / P Seimbang)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickRepresentative}
                  onChange={e => setPickRepresentative(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700 accent-emerald-700 w-4 h-4"
                />
                <span>Pilih Perwakilan (Ketua Kelompok)</span>
              </label>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/50 dark:bg-[#141518]/60 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Siswa Aktif: <strong className="text-emerald-700 dark:text-emerald-400">{activeStudents.length}</strong> / {STUDENTS_DATA.length}
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429] text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429] text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={activeStudents.length === 0}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-stone-300 text-white font-semibold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <Shuffle className="w-4 h-4" />
                <span>{generatedGroups ? 'ACAK ULANG (REGROUP)' : 'MULAI ACAK KELOMPOK'}</span>
              </button>
            </div>
          </div>

          {/* Participant Selectors (Collapse/Grid) */}
          <details className="bg-stone-50/50 dark:bg-[#141518]/60 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 group">
            <summary className="text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer flex items-center justify-between">
              <span>Atur Siswa yang Masuk Undian ({activeStudents.length} Terpilih)</span>
              <span className="text-[11px] text-stone-500 group-open:hidden">Klik untuk melihat &amp; atur absensi</span>
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
              {STUDENTS_DATA.map(s => {
                const isSelected = selectedAbsens.includes(s.absen);
                return (
                  <label
                    key={s.absen}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                      isSelected
                        ? 'border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-[#122A1E]/50 text-stone-900 dark:text-stone-100 font-semibold'
                        : 'border-stone-200/70 dark:border-stone-800/70 bg-stone-100/40 dark:bg-[#121212] text-stone-400 line-through'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleStudent(s.absen)}
                      className="rounded text-emerald-700 accent-emerald-700 w-3.5 h-3.5"
                    />
                    <span className="font-mono text-[10px] text-stone-500">#{s.absen}</span>
                    <span className="truncate">{s.panggilan}</span>
                  </label>
                );
              })}
            </div>
          </details>

          {/* Generated Groups Board */}
          {generatedGroups && (
            <div className="space-y-3 pt-2">
              {/* Action Toolbar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
                <div>
                  <h3 className="font-editorial font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                    Hasil Pembagian Kelompok ({generatedGroups.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isRevealing ? (
                    <button
                      type="button"
                      onClick={handleSkipAnimation}
                      className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Lewati Animasi</span>
                    </button>
                  ) : (
                    <>
                      {pickRepresentative && (
                        <button
                          type="button"
                          onClick={handleRepickRepresentatives}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-900/60 bg-amber-50 dark:bg-[#20170A] hover:bg-amber-100 text-amber-900 dark:text-amber-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Kocok Ulang Ketua</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyText}
                        className="px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] hover:bg-stone-50 dark:hover:bg-[#222429] text-stone-800 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                        <span>{copied ? 'Tersalin!' : 'Salin WhatsApp'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadCSV}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Unduh hasil pembagian ini sebagai file CSV baru"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh CSV</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Group Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedGroups.map(group => {
                  const groupRevealedMembers = group.members.filter(m => revealedAbsens.has(m.absen));

                  return (
                    <div
                      key={group.id}
                      className="bg-white dark:bg-[#18191C] rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Editable Group Title */}
                        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-200/70 dark:border-stone-800/70">
                          <input
                            type="text"
                            value={group.name}
                            onChange={e => handleRenameGroup(group.id, e.target.value)}
                            className="font-bold text-sm text-stone-900 dark:text-stone-100 bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 focus:border-emerald-700 focus:outline-hidden w-full"
                            title="Klik untuk mengubah nama kelompok"
                          />
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60 flex-shrink-0">
                            {groupRevealedMembers.length}/{group.members.length} Siswa
                          </span>
                        </div>

                        {/* Members List */}
                        <ul className="space-y-1.5">
                          {group.members.map(member => {
                            const isRevealed = revealedAbsens.has(member.absen);
                            const isRep = group.representativeId === member.absen;
                            const displayName = nameMode === 'nama' ? member.nama : member.panggilan;

                            if (!isRevealed) {
                              return (
                                <li
                                  key={member.absen}
                                  className="h-8 rounded-lg border border-dashed border-stone-200/70 dark:border-stone-800/70 bg-stone-50/30 dark:bg-transparent"
                                />
                              );
                            }

                            return (
                              <li
                                key={member.absen}
                                className={`flex items-center justify-between gap-2 p-1.5 rounded-lg text-xs transition ${
                                  isRep && pickRepresentative && showRepresentatives
                                    ? 'bg-amber-50 dark:bg-[#20170A] border border-amber-300/80 dark:border-amber-900/60 font-bold text-stone-900 dark:text-stone-100'
                                    : 'hover:bg-stone-50 dark:hover:bg-[#1E1F23] text-stone-700 dark:text-stone-200'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono text-[10px] font-semibold text-stone-400 min-w-[20px]">
                                    #{member.absen}
                                  </span>
                                  <span className="truncate">{displayName}</span>
                                  <span
                                    className={`text-[9px] px-1 rounded font-bold ${
                                      member.gender === 'L'
                                        ? 'bg-blue-50 dark:bg-[#07182E] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-[#0E3560]'
                                        : 'bg-rose-50 dark:bg-[#260B0F] text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-[#5C141D]'
                                    }`}
                                  >
                                    {member.gender}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isRep && pickRepresentative && showRepresentatives && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-900/60">
                                      <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                      <span>Ketua</span>
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
