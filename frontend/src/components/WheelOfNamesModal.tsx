import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, Volume2, VolumeX, Sparkles, Trash2, Award, Play, Shuffle, History, List, Check, RotateCw } from 'lucide-react';
import { Student, STUDENTS_DATA } from '../data/studentsData';
import { cryptoRandomFloat } from '../utils/cryptoRandom';
import { playTickSound, playFanfareSound } from '../utils/audioEffects';

interface WheelOfNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const WheelOfNamesModal: React.FC<WheelOfNamesModalProps> = ({ isOpen, onClose }) => {
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

    // Outer wheel border
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Center Hub / Button
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#2C4E3A';
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
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pointer peg pin
    ctx.beginPath();
    ctx.arc(10, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }, [activeStudents, nameMode]);

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
  }, [isOpen, drawWheel]);

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
      <div className="bg-[#FAF7F2] dark:bg-black text-[#1C1917] dark:text-[#F8FAFC] rounded-2xl border border-[#D8D2C5] dark:border-[#222222] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D8D2C5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="wheel-title" className="font-display font-bold text-base sm:text-lg leading-tight">
                Random Name Picker (Wheel of Names)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>

            <button
              onClick={onClose}
              disabled={isSpinning}
              aria-label="Tutup Wheel of Names"
              className="w-9 h-9 rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-white dark:bg-[#121212] hover:bg-stone-100 dark:hover:bg-[#1C1C1C] flex items-center justify-center text-stone-600 dark:text-stone-200 transition cursor-pointer disabled:opacity-50"
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
                className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[380px] md:h-[380px] drop-shadow-md rounded-full bg-white/40 dark:bg-black/20"
              />
            </div>

            {/* Spin Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || activeStudents.length === 0}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#2C4E3A] hover:bg-[#233F2E] disabled:bg-stone-400 dark:disabled:bg-stone-700 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C4E3A]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSpinning ? 'Sedang Memutar Roda...' : 'PUTAR RODA (SPIN)'}</span>
            </button>
          </div>

          {/* Controls & Entries / History Section */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full justify-between min-h-[360px]">
            {/* Top Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 dark:bg-[#161616] rounded-xl border border-[#D8D2C5] dark:border-[#262626] flex-shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('entries')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightTab === 'entries'
                    ? 'bg-white dark:bg-[#222222] text-[#2C4E3A] dark:text-[#34D399] shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Daftar Siswa</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-[#2A2A2A] text-stone-600 dark:text-stone-300 font-bold">
                  {activeStudents.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('history')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightTab === 'history'
                    ? 'bg-white dark:bg-[#222222] text-[#2C4E3A] dark:text-[#34D399] shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Putaran</span>
                {history.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {rightTab === 'entries' ? (
              <>
                {/* Name Mode Toggle */}
                <div className="p-3 bg-white dark:bg-[#0A0A0A] rounded-xl border border-[#D8D2C5] dark:border-[#222222] space-y-2 flex-shrink-0">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    Format Nama Siswa:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNameMode('panggilan')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        nameMode === 'panggilan'
                          ? 'bg-[#2C4E3A] text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#161616] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#222222]'
                      }`}
                    >
                      Nama Pendek / Panggilan
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameMode('nama')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        nameMode === 'nama'
                          ? 'bg-[#2C4E3A] text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#161616] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#222222]'
                      }`}
                    >
                      Nama Panjang Lengkap
                    </button>
                  </div>
                </div>

                {/* Entries List Textarea */}
                <div className="p-3 bg-white dark:bg-[#0A0A0A] rounded-xl border border-[#D8D2C5] dark:border-[#222222] flex-1 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        Daftar Entri Roda
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B]">
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
                        className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-[#2C4E3A] dark:hover:text-[#34D399] flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#1C1C1C] transition border border-stone-200 dark:border-stone-800"
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
                        className="text-xs font-semibold text-[#2C4E3A] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#1C1C1C] transition"
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
                    className="w-full flex-1 p-2.5 text-xs font-mono rounded-lg border border-[#D8D2C5] dark:border-[#262626] bg-[#FAF7F2] dark:bg-[#121212] text-stone-900 dark:text-stone-100 resize-none focus:outline-hidden focus:ring-1 focus:ring-[#2C4E3A] dark:focus:ring-[#34D399]"
                  />
                </div>
              </>
            ) : (
              /* Riwayat Putaran Sesi (Session History Tab) */
              <div className="p-3 bg-white dark:bg-[#0A0A0A] rounded-xl border border-[#D8D2C5] dark:border-[#222222] flex-1 flex flex-col min-h-[300px]">
                {/* History Filter Chips & Clear Action */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#D8D2C5] dark:border-[#222222] flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-[#2C4E3A] text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#1C1C1C] text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                      }`}
                    >
                      Semua ({history.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('removed')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        historyFilter === 'removed'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#1C1C1C] text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                      }`}
                    >
                      Dihapus ({removedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('kept')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        historyFilter === 'kept'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#1C1C1C] text-stone-600 dark:text-stone-400 hover:bg-stone-200'
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
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                        className="p-2.5 rounded-lg border border-[#D8D2C5] dark:border-[#222222] bg-[#FAF7F2] dark:bg-[#141414] flex items-center justify-between gap-2.5 text-xs transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-stone-200 dark:bg-[#262626] font-mono text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center justify-center flex-shrink-0">
                            #{item.spinNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 dark:text-white truncate">
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-[#260B0E] text-red-700 dark:text-red-300 border border-red-200 dark:border-[#4B1419] flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              <span>Dihapus</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] border border-[#86EFAC] dark:border-[#0E492B] flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Disimpan</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleHistoryRemoved(item)}
                            title={item.removed ? 'Kembalikan siswa ke dalam roda' : 'Hapus siswa dari roda'}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-[#262626] transition cursor-pointer"
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
            <div className="bg-white dark:bg-[#0A0A0A] border-2 border-[#2C4E3A] dark:border-[#34D399] rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-[#261B06] text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-[#523A0F] flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  🎉 Siswa Terpilih! 🎉
                </p>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
                  {nameMode === 'nama' ? winner.nama : winner.panggilan}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  Absen #{winner.absen} • {winner.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D8D2C5] dark:border-[#222222]">
                <button
                  type="button"
                  onClick={handleRemoveWinner}
                  className="px-3 py-2 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-[#21090B] hover:bg-red-100 dark:hover:bg-[#2F0D10] text-red-700 dark:text-red-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWinnerDialog(false)}
                  className="px-3 py-2 rounded-xl bg-[#2C4E3A] hover:bg-[#233F2E] text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
