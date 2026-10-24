import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, Volume2, VolumeX, Sparkles, Trash2, Award, Play, Shuffle, History, List, Check, RotateCw, Sun, Moon } from 'lucide-react';
import { Student, STUDENTS_DATA } from '../data/studentsData';
import { cryptoRandomFloat } from '../utils/cryptoRandom';
import { playTickSound, playFanfareSound } from '../utils/audioEffects';

interface WheelOfNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export interface SpinHistoryItem {
  id: string;
  student: Student;
  timestamp: string;
  removed: boolean;
  spinNumber: number;
}

const WHEEL_COLORS = [
  '#2C4E3A', // Forest green (theme)
  '#0284C7', // Sky blue
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#BE185D', // Pink
  '#B45309', // Bronze
  '#2563EB', // Blue
];

export const WheelOfNamesModal: React.FC<WheelOfNamesModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode
}) => {
  const [nameMode, setNameMode] = useState<'panggilan' | 'nama'>('panggilan');
  const [activeStudents, setActiveStudents] = useState<Student[]>(() => [...STUDENTS_DATA]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rightTab, setRightTab] = useState<'entries' | 'history'>('entries');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'removed' | 'kept'>('all');
  const [history, setHistory] = useState<SpinHistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('wheel_spin_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef(-1);
  const currentHistoryIdRef = useRef<string | null>(null);
  const spinCounterRef = useRef<number>(history.length);

  // Sync history to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('wheel_spin_history', JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history]);

  // Sync entries to student list
  const entriesText = activeStudents
    .map(s => (nameMode === 'nama' ? s.nama : s.panggilan))
    .join('\n');

  // Draw wheel on canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 16;

    ctx.clearRect(0, 0, width, height);

    const count = activeStudents.length;
    if (count === 0) {
      // Empty wheel placeholder
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#E5E7EB';
      ctx.fill();
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tidak ada nama di roda', centerX, centerY);
      ctx.restore();
      return;
    }

    const arcSize = (Math.PI * 2) / count;

    // Outer shadow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Draw slices
    for (let i = 0; i < count; i++) {
      const sliceAngle = angle + i * arcSize;
      const student = activeStudents[i];
      const text = nameMode === 'nama' ? student.nama : student.panggilan;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceAngle, sliceAngle + arcSize);
      ctx.closePath();

      // Slice background
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slice text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';

      // Dynamic font size based on slice count & text length
      const fontSize = Math.max(10, Math.min(16, Math.floor(360 / Math.max(count, 12))));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      // Truncate long names to fit inside slice
      let displayText = text;
      const maxTextWidth = radius - 45;
      if (ctx.measureText(displayText).width > maxTextWidth) {
        while (ctx.measureText(displayText + '…').width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '…';
      }

      ctx.fillText(displayText, radius - 15, fontSize / 3);
      ctx.restore();

      ctx.restore();
    }

    const isDark = typeof darkMode === 'boolean'
      ? darkMode
      : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);

    // Outer wheel border
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? '#2D3039' : '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Center Hub / Button
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#1E2025' : '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#143823' : '#2C4E3A';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
    ctx.restore();

    // Pointer Ticker at 0 rad (right side / 3 o'clock)
    ctx.save();
    ctx.translate(centerX + radius + 2, centerY);
    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.lineTo(-14, 0);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#1E2025' : '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pointer peg pin
    ctx.beginPath();
    ctx.arc(10, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }, [activeStudents, nameMode, darkMode]);

  // Helper to determine exactly which slice is currently under the pointer at 0 rad (3 o'clock)
  const getSliceAtPointer = useCallback((angle: number, totalSlices: number): number => {
    if (totalSlices <= 0) return 0;
    const arcSize = (Math.PI * 2) / totalSlices;
    const normalized = ((0 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(normalized / arcSize);
    return Math.min(totalSlices - 1, Math.max(0, index));
  }, []);

  // Redraw when modal opens or state changes (guaranteed render with RAF & backup timeout)
  useEffect(() => {
    if (!isOpen) return;

    drawWheel(currentAngleRef.current);
    const rafId = requestAnimationFrame(() => {
      drawWheel(currentAngleRef.current);
    });
    const timerId = setTimeout(() => {
      drawWheel(currentAngleRef.current);
    }, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [isOpen, drawWheel, darkMode]);

  // Handle spin
  const handleSpin = () => {
    if (isSpinning || activeStudents.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setShowWinnerDialog(false);

    const count = activeStudents.length;

    // Cryptographically secure spin:
    // Generate high-entropy number of full spins (6-9 full turns) plus random stopping offset
    const fullSpins = 6 + Math.floor(cryptoRandomFloat() * 4);
    const randomOffset = cryptoRandomFloat() * (Math.PI * 2);
    const totalRotation = fullSpins * Math.PI * 2 + randomOffset;

    const startAngle = currentAngleRef.current;
    const finalAngle = startAngle + totalRotation;
    const spinDuration = 5500 + Math.floor(cryptoRandomFloat() * 800); // 5.5 to 6.3 seconds
    const startTime = performance.now();

    lastTickSliceRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / spinDuration);

      // Smooth cubic ease-out deceleration curve
      const easeOut = 1 - Math.pow(1 - progress, 3.2);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeOut;
      currentAngleRef.current = currentAngle;

      // Tick sound calculation based on actual slice crossing pointer
      const currentSlice = getSliceAtPointer(currentAngle, count);
      if (currentSlice !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSlice;
        playTickSound(soundEnabled);
      }

      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        currentAngleRef.current = finalAngle;
        drawWheel(finalAngle);

        // Visually and mathematically exact winner at the pointer position
        const winningIndex = getSliceAtPointer(finalAngle, count);
        const selectedWinner = activeStudents[winningIndex];
        setWinner(selectedWinner);
        setShowWinnerDialog(true);
        playFanfareSound(soundEnabled);

        // Record to session history
        spinCounterRef.current += 1;
        const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        currentHistoryIdRef.current = historyId;

        const newHistoryItem: SpinHistoryItem = {
          id: historyId,
          student: selectedWinner,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          removed: false,
          spinNumber: spinCounterRef.current,
        };

        setHistory(prev => [newHistoryItem, ...prev]);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle textarea editing
  const handleEntriesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawLines = e.target.value.split('\n');
    const matchedStudents: Student[] = [];

    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Try matching by exact name/panggilan or create placeholder
      const found = STUDENTS_DATA.find(
        s => s.nama.toLowerCase() === trimmed.toLowerCase() || s.panggilan.toLowerCase() === trimmed.toLowerCase()
      );

      if (found) {
        matchedStudents.push(found);
      } else {
        matchedStudents.push({
          absen: idx + 1,
          nama: trimmed,
          gender: 'L',
          panggilan: trimmed.split(' ')[0]
        });
      }
    });

    setActiveStudents(matchedStudents);
  };

  // Shuffle names in wheel
  const handleShuffle = () => {
    if (isSpinning || activeStudents.length <= 1) return;
    const shuffled = [...activeStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(cryptoRandomFloat() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setActiveStudents(shuffled);
    playTickSound(soundEnabled);
  };

  const handleReset = () => {
    setActiveStudents([...STUDENTS_DATA]);
    setWinner(null);
    setShowWinnerDialog(false);
  };

  const handleRemoveWinner = () => {
    if (!winner) return;
    setActiveStudents(prev => prev.filter(s => s.absen !== winner.absen || s.nama !== winner.nama));
    if (currentHistoryIdRef.current) {
      setHistory(prev =>
        prev.map(item =>
          item.id === currentHistoryIdRef.current ? { ...item, removed: true } : item
        )
      );
    }
    setShowWinnerDialog(false);
  };

  // Toggle removed status of an item from history
  const handleToggleHistoryRemoved = (historyItem: SpinHistoryItem) => {
    if (historyItem.removed) {
      // Restore back to wheel if not present
      setActiveStudents(prev => {
        const exists = prev.some(s => s.absen === historyItem.student.absen || s.nama === historyItem.student.nama);
        if (exists) return prev;
        return [...prev, historyItem.student].sort((a, b) => a.absen - b.absen);
      });
      setHistory(prev =>
        prev.map(item =>
          item.id === historyItem.id ? { ...item, removed: false } : item
        )
      );
    } else {
      // Remove from wheel
      setActiveStudents(prev =>
        prev.filter(s => s.absen !== historyItem.student.absen && s.nama !== historyItem.student.nama)
      );
      setHistory(prev =>
        prev.map(item =>
          item.id === historyItem.id ? { ...item, removed: true } : item
        )
      );
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Filter history items
  const filteredHistory = history.filter(item => {
    if (historyFilter === 'removed') return item.removed;
    if (historyFilter === 'kept') return !item.removed;
    return true;
  });

  const removedCount = history.filter(item => item.removed).length;
  const keptCount = history.filter(item => !item.removed).length;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !isSpinning) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="wheel-title" className="font-editorial font-bold text-base sm:text-lg leading-tight text-stone-900 dark:text-stone-100">
                Random Name Picker (Wheel of Names)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                SMA Putra Nirmala • Kelas XB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A2F]"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>

            <button
              onClick={onClose}
              disabled={isSpinning}
              aria-label="Tutup Wheel of Names"
              className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Grid: Wheel (Left) & Controls/Entries (Right) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Wheel Canvas Section */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div
              className={`relative cursor-pointer transition-transform ${isSpinning ? 'pointer-events-none' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
              onClick={handleSpin}
              title={isSpinning ? 'Sedang memutar...' : 'Klik untuk memutar roda!'}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[380px] md:h-[380px] drop-shadow-md rounded-full bg-stone-50/50 dark:bg-stone-900/40"
              />
            </div>

            {/* Spin Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || activeStudents.length === 0}
              className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-stone-300 dark:disabled:bg-stone-800 text-white font-semibold text-sm shadow-sm transition cursor-pointer flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSpinning ? 'Sedang Memutar Roda...' : 'PUTAR RODA (SPIN)'}</span>
            </button>
          </div>

          {/* Controls & Entries / History Section */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full justify-between min-h-[360px]">
            {/* Top Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-[#121316] rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex-shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('entries')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightTab === 'entries'
                    ? 'bg-white dark:bg-[#222429] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Daftar Siswa</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-[#1A1A1A] text-stone-600 dark:text-stone-300 font-semibold">
                  {activeStudents.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('history')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightTab === 'history'
                    ? 'bg-white dark:bg-[#222429] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Putaran</span>
                {history.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {rightTab === 'entries' ? (
              <>
                {/* Name Mode Toggle */}
                <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2 flex-shrink-0">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Format Nama Siswa:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNameMode('panggilan')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        nameMode === 'panggilan'
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                          : 'bg-white dark:bg-[#18191C] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                      }`}
                    >
                      Nama Pendek / Panggilan
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameMode('nama')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        nameMode === 'nama'
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                          : 'bg-white dark:bg-[#18191C] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                      }`}
                    >
                      Nama Panjang Lengkap
                    </button>
                  </div>
                </div>

                {/* Entries List Textarea */}
                <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex-1 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        Daftar Entri Roda
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25">
                        {activeStudents.length} Nama
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Shuffle Button */}
                      <button
                        type="button"
                        onClick={handleShuffle}
                        disabled={isSpinning || activeStudents.length <= 1}
                        title="Acak urutan nama di roda secara acak"
                        className="text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#1C1C1C] transition border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C]"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Shuffle</span>
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSpinning}
                        title="Kembalikan seluruh 33 murid kelas XB"
                        className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#1C1C1C] transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={entriesText}
                    onChange={handleEntriesChange}
                    disabled={isSpinning}
                    placeholder="Masukkan satu nama per baris..."
                    rows={8}
                    className="w-full flex-1 p-2.5 text-xs font-mono rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 resize-none focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </>
            ) : (
              /* Riwayat Putaran Sesi (Session History Tab) */
              <div className="p-3 bg-stone-50/50 dark:bg-[#141518]/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex-1 flex flex-col min-h-[300px]">
                {/* History Filter Chips & Clear Action */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80 dark:border-stone-800/80 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                          : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
                      }`}
                    >
                      Semua ({history.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('removed')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'removed'
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
                      }`}
                    >
                      Dihapus ({removedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('kept')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'kept'
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white dark:bg-[#18191C] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
                      }`}
                    >
                      Disimpan ({keptCount})
                    </button>
                  </div>

                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      title="Bersihkan riwayat sesi ini"
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 max-h-[320px]">
                  {filteredHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 dark:text-stone-500">
                      <History className="w-8 h-8 stroke-1 mb-2 opacity-50" />
                      <p className="text-xs font-semibold">
                        {history.length === 0
                          ? 'Belum ada putaran pada sesi ini'
                          : 'Tidak ada data dengan filter terpilih'}
                      </p>
                      <p className="text-[11px] mt-0.5 text-stone-500 dark:text-stone-400">
                        {history.length === 0
                          ? 'Putar roda untuk mencatat hasil pengundian siswa.'
                          : 'Coba ubah filter di atas untuk melihat data lain.'}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map(item => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18191C] flex items-center justify-between gap-2.5 text-xs transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 font-mono text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center flex-shrink-0">
                            #{item.spinNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {nameMode === 'nama' ? item.student.nama : item.student.panggilan}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                              <span>Absen #{item.student.absen}</span>
                              <span>•</span>
                              <span>{item.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.removed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              <span>Dihapus</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Disimpan</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleHistoryRemoved(item)}
                            title={item.removed ? 'Kembalikan siswa ke dalam roda' : 'Hapus siswa dari roda'}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#222429] transition cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Winner Dialog Modal Overlay */}
        {showWinnerDialog && winner && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4 modal-backdrop-tint animate-in zoom-in-95 duration-150"
            onClick={e => {
              if (e.target === e.currentTarget) setShowWinnerDialog(false);
            }}
          >
            <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-[#20170A] text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-900/60 flex items-center justify-center mx-auto shadow-2xs">
                <Award className="w-7 h-7" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  🎉 Siswa Terpilih! 🎉
                </p>
                <h3 className="font-editorial text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {nameMode === 'nama' ? winner.nama : winner.panggilan}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-normal">
                  Absen #{winner.absen} • {winner.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800/80">
                <button
                  type="button"
                  onClick={handleRemoveWinner}
                  className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWinnerDialog(false)}
                  className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  Lanjut / Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
