import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  Award,
  Play,
  Shuffle,
  History,
  List,
  Check,
  RotateCw,
  Sun,
  Moon,
  FerrisWheel,
  Maximize2,
  Minimize2,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react';
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

// 4 colors in strict repeating sequence: Biru -> Merah -> Kuning -> Hijau
const WHEEL_COLORS = [
  '#3369e8', // Biru
  '#d50f25', // Merah
  '#eeb211', // Kuning
  '#009925', // Hijau
];

const CANVAS_SIZE = 1000; // Crisp supersampled 1000x1000 resolution for crystal-clear text

export const WheelOfNamesModal: React.FC<WheelOfNamesModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
}) => {
  const [nameMode, setNameMode] = useState<'panggilan' | 'nama'>('panggilan');
  const [activeStudents, setActiveStudents] = useState<Student[]>(() => [...STUDENTS_DATA]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWaitingWinner, setIsWaitingWinner] = useState(false); // 1-second suspense pause state
  const [winner, setWinner] = useState<Student | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRemoveWinner, setAutoRemoveWinner] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Navigation tabs:
  // On desktop: aside tabs between entries & history
  // On mobile: top switcher between 'wheel', 'entries', and 'history'
  const [mobileTab, setMobileTab] = useState<'wheel' | 'entries' | 'history'>('wheel');
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
  const winnerPauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const winningSliceIndexRef = useRef<number | null>(null);
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

  // Helper: get slice color in repeating 4-color cycle (#3369e8 -> #d50f25 -> #eeb211 -> #009925)
  const getSliceColor = (index: number) => {
    return WHEEL_COLORS[index % WHEEL_COLORS.length];
  };

  // Draw wheel on high-res canvas with supreme text legibility and suspense highlight
  const drawWheel = useCallback((angle: number, highlightedIndex: number | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 34;
    const hubRadius = 66;

    ctx.clearRect(0, 0, width, height);

    const isDark = typeof darkMode === 'boolean'
      ? darkMode
      : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);

    const count = activeStudents.length;
    if (count === 0) {
      // Empty wheel placeholder
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#1F2937' : '#E5E7EB';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#374151' : '#9CA3AF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#9CA3AF' : '#4B5563';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tidak ada nama di dalam roda', centerX, centerY);
      ctx.restore();
      return;
    }

    const arcSize = (Math.PI * 2) / count;

    // Outer shadow rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();

    // Outer decorative border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? '#2D3039' : '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Draw slices
    for (let i = 0; i < count; i++) {
      const sliceAngle = angle + i * arcSize;
      const student = activeStudents[i];
      const text = nameMode === 'nama' ? student.nama : student.panggilan;
      const isWinnerSlice = highlightedIndex === i;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceAngle, sliceAngle + arcSize);
      ctx.closePath();

      // Slice background
      ctx.fillStyle = getSliceColor(i);
      ctx.fill();
      ctx.strokeStyle = isWinnerSlice ? '#FBBF24' : '#FFFFFF';
      ctx.lineWidth = isWinnerSlice ? 5 : (count > 24 ? 2 : 3);
      ctx.stroke();

      // Suspense glow on winning slice during 1-second pause
      if (isWinnerSlice) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      }

      // Draw Slice Text with Extreme Legibility
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Substantially boosted bold font size for high legibility
      const baseFontSize = Math.max(28, Math.min(80, Math.floor(1180 / Math.max(count, 8))));
      let fontSize = baseFontSize;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Available radial space from outer rim to center hub margin
      const textX = radius - 18;
      const maxTextWidth = textX - hubRadius - 16;
      let displayText = text;

      // Adjust font size or truncate gracefully if name is unusually long
      let measuredWidth = ctx.measureText(displayText).width;
      if (measuredWidth > maxTextWidth) {
        // Try slightly smaller font size first
        const minFontSize = Math.max(18, Math.floor(baseFontSize * 0.65));
        while (measuredWidth > maxTextWidth && fontSize > minFontSize) {
          fontSize -= 1;
          ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          measuredWidth = ctx.measureText(displayText).width;
        }
        // If still too long, truncate with ellipsis
        if (measuredWidth > maxTextWidth) {
          while (ctx.measureText(displayText + '…').width > maxTextWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '…';
        }
      }

      // Priority 1: High-Contrast Stroke Halo for 100% legibility on any background color
      ctx.lineWidth = Math.max(4.5, fontSize * 0.25);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.96)'; // Deep slate-900 border
      ctx.strokeText(displayText, textX, 0);

      // Priority 2: Crisp Pure White Lettering on top
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(displayText, textX, 0);

      ctx.restore();
      ctx.restore();
    }

    // Outer edge pins / pegs
    ctx.save();
    for (let i = 0; i < count; i++) {
      const pinAngle = angle + i * arcSize;
      const pinX = centerX + (radius + 2) * Math.cos(pinAngle);
      const pinY = centerY + (radius + 2) * Math.sin(pinAngle);
      ctx.beginPath();
      ctx.arc(pinX, pinY, 5, 0, Math.PI * 2);
      ctx.fillStyle = highlightedIndex === i ? '#F59E0B' : '#FBBF24'; // Golden pin
      ctx.fill();
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // Center Hub / Button
    ctx.save();
    // Outer white/dark collar
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#1E2025' : '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Inner green core
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius - 8, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#143823' : '#1E3A2F';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center "SPIN" text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
    ctx.restore();

    // Pointer Ticker at 0 rad (3 o'clock / Right side)
    ctx.save();
    ctx.translate(centerX + radius + 2, centerY);
    ctx.beginPath();
    ctx.moveTo(24, -20);
    ctx.lineTo(-26, 0);
    ctx.lineTo(24, 20);
    ctx.closePath();
    ctx.fillStyle = highlightedIndex !== null ? '#DC2626' : '#EF4444'; // Red-500
    ctx.shadowColor = highlightedIndex !== null ? 'rgba(220,38,38,0.7)' : 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = highlightedIndex !== null ? 14 : 8;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#1E2025' : '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Pointer center pin
    ctx.beginPath();
    ctx.arc(15, 0, 5, 0, Math.PI * 2);
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

  // Redraw when modal opens or state changes
  useEffect(() => {
    if (!isOpen) return;

    drawWheel(currentAngleRef.current, winningSliceIndexRef.current);
    const rafId = requestAnimationFrame(() => {
      drawWheel(currentAngleRef.current, winningSliceIndexRef.current);
    });
    const timerId = setTimeout(() => {
      drawWheel(currentAngleRef.current, winningSliceIndexRef.current);
    }, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [isOpen, drawWheel, darkMode]);

  // Handle spin with dramatic deceleration curve and 1-second suspense pause
  const handleSpin = useCallback(() => {
    if (isSpinning || isWaitingWinner || activeStudents.length === 0) return;

    // Switch to wheel view immediately on mobile if user spins from another tab
    setMobileTab('wheel');

    // Clear any previous pause timer
    if (winnerPauseTimerRef.current) {
      clearTimeout(winnerPauseTimerRef.current);
      winnerPauseTimerRef.current = null;
    }

    setIsSpinning(true);
    setIsWaitingWinner(false);
    winningSliceIndexRef.current = null;
    setWinner(null);
    setShowWinnerDialog(false);

    const count = activeStudents.length;

    // Cryptographically secure spin:
    // Generate high-entropy number of full spins (7-10 full turns) plus random stopping offset
    const fullSpins = 7 + Math.floor(cryptoRandomFloat() * 4);
    const randomOffset = cryptoRandomFloat() * (Math.PI * 2);
    const totalRotation = fullSpins * Math.PI * 2 + randomOffset;

    const startAngle = currentAngleRef.current;
    const finalAngle = startAngle + totalRotation;
    
    // Total duration: 6.5s to 7.3s allowing a thrilling, gradual deceleration at the end
    const spinDuration = 6500 + Math.floor(cryptoRandomFloat() * 800);
    const startTime = performance.now();

    lastTickSliceRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / spinDuration);

      // Dramatic progressive deceleration curve (Power 4.6):
      // Rapid start, and in the final 25% of time, it crawls through slices tick... tick...... tick......... stop!
      const easeOut = 1 - Math.pow(1 - progress, 4.6);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeOut;
      currentAngleRef.current = currentAngle;

      // Tick sound calculation based on actual slice crossing pointer
      const currentSlice = getSliceAtPointer(currentAngle, count);
      if (currentSlice !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSlice;
        playTickSound(soundEnabled);
      }

      drawWheel(currentAngle, null);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Complete wheel rotation and halt exactly at finalAngle
        currentAngleRef.current = finalAngle;

        // Visually and mathematically exact winner at the pointer position
        const winningIndex = getSliceAtPointer(finalAngle, count);
        const selectedWinner = activeStudents[winningIndex];
        
        winningSliceIndexRef.current = winningIndex;
        setWinner(selectedWinner);
        setIsWaitingWinner(true);

        // Draw motionless wheel highlighting the winning slice resting on the pointer
        drawWheel(finalAngle, winningIndex);

        // 1-second (1000ms) suspense pause so students/teachers see the pointer resting on the winning name!
        winnerPauseTimerRef.current = setTimeout(() => {
          setIsSpinning(false);
          setIsWaitingWinner(false);
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
            removed: autoRemoveWinner,
            spinNumber: spinCounterRef.current,
          };

          setHistory(prev => [newHistoryItem, ...prev]);

          // Auto remove winner if option enabled
          if (autoRemoveWinner && selectedWinner) {
            setActiveStudents(prev => prev.filter(s => s.absen !== selectedWinner.absen || s.nama !== selectedWinner.nama));
          }
        }, 1000); // Exact 1-second pause before showing winner dialog
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, isWaitingWinner, activeStudents, getSliceAtPointer, soundEnabled, drawWheel, autoRemoveWinner]);

  // Clean up animation & pause timer on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (winnerPauseTimerRef.current) {
        clearTimeout(winnerPauseTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar to spin, Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          if (!isSpinning && !isWaitingWinner && activeStudents.length > 0) {
            handleSpin();
          }
        }
      } else if (e.key === 'Escape' && !isSpinning && !isWaitingWinner) {
        if (showWinnerDialog) {
          setShowWinnerDialog(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSpinning, isWaitingWinner, activeStudents.length, showWinnerDialog, handleSpin, onClose]);

  // Handle textarea editing
  const handleEntriesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawLines = e.target.value.split('\n');
    const matchedStudents: Student[] = [];

    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

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
    if (isSpinning || isWaitingWinner || activeStudents.length <= 1) return;
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
    winningSliceIndexRef.current = null;
    setShowWinnerDialog(false);
  };

  const handleClearAllEntries = () => {
    if (isSpinning || isWaitingWinner) return;
    setActiveStudents([]);
    setWinner(null);
    winningSliceIndexRef.current = null;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 modal-backdrop-tint transition-colors duration-200 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !isSpinning && !isWaitingWinner) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-[#18191C] text-stone-900 dark:text-stone-100 border-0 sm:border border-stone-200/80 dark:border-stone-800/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-0 sm:inset-2 z-50 rounded-none sm:rounded-2xl'
            : 'w-full h-full sm:h-[94vh] sm:max-h-[94vh] max-w-7xl rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-[#141518] flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex items-center justify-center font-bold shadow-2xs flex-shrink-0">
              <FerrisWheel className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="wheel-title" className="font-editorial font-bold text-sm sm:text-base md:text-lg leading-tight text-stone-900 dark:text-stone-100 truncate">
                  Wheel of Names
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 dark:bg-[#153422] text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 flex-shrink-0">
                  <Users className="w-3 h-3" />
                  <span>{activeStudents.length} Nama</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-normal truncate">
                SMA Putra Nirmala • Kelas XB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-700" />}
              </button>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Roda' : 'Aktifkan Suara Roda'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400" />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSpinning || isWaitingWinner}
              aria-label="Tutup Wheel of Names"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#25272C] flex items-center justify-center text-stone-600 dark:text-stone-300 transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Tabs (Shown on screens < lg) */}
        <div className="flex lg:hidden items-center border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-100/80 dark:bg-[#121316] p-1.5 gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('wheel')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'wheel'
                ? 'bg-white dark:bg-[#222429] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <FerrisWheel className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Roda Putar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('entries');
              setRightTab('entries');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'entries'
                ? 'bg-white dark:bg-[#222429] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Daftar ({activeStudents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('history');
              setRightTab('history');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'history'
                ? 'bg-white dark:bg-[#222429] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Riwayat ({history.length})</span>
          </button>
        </div>

        {/* Main Body: Fit-to-Page Wheel on Left + Controls/Settings Aside on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* LEFT: Wheel Stage (Fit to page, maximized canvas + spin button) */}
          <main
            className={`${
              mobileTab === 'wheel' ? 'flex' : 'hidden'
            } lg:flex flex-1 flex-col items-center justify-between lg:justify-center p-3 sm:p-5 lg:p-6 overflow-hidden min-h-0 relative bg-radial from-stone-50 via-white to-stone-100/70 dark:from-[#1A1C20] dark:via-[#16171A] dark:to-[#121316]`}
          >
            {/* Top helper text */}
            <div className="w-full text-center mb-1 flex-shrink-0">
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">
                {isWaitingWinner ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                    🎉 Jarum berhenti di: {winner ? (nameMode === 'nama' ? winner.nama : winner.panggilan) : ''}!
                  </span>
                ) : isSpinning ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">
                    Sedang memutar... Menentukan pemenang
                  </span>
                ) : (
                  <>
                    Klik roda atau tekan <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[10px] font-semibold">Spasi</kbd> untuk memutar roda
                  </>
                )}
              </span>
            </div>

            {/* Wheel Canvas Container (Fit to available height & width across Mobile & Desktop) */}
            <div className="relative flex items-center justify-center w-full flex-1 min-h-0 max-h-[calc(100%-88px)] py-1">
              <div
                className={`relative aspect-square h-full max-h-[min(58vh,440px)] sm:max-h-[min(72vh,640px)] max-w-full flex items-center justify-center cursor-pointer select-none transition-transform duration-100 ${
                  isSpinning || isWaitingWinner ? 'pointer-events-none' : 'hover:scale-[1.01] active:scale-[0.99]'
                }`}
                onClick={handleSpin}
                title={isSpinning ? 'Sedang memutar...' : isWaitingWinner ? 'Menentukan hasil...' : 'Klik untuk memutar roda!'}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="w-full h-full max-w-full max-h-full object-contain drop-shadow-xl rounded-full"
                />
              </div>
            </div>

            {/* Prominent SPIN Trigger Button & Quick Mobile Actions */}
            <div className="w-full max-w-md mt-2 sm:mt-3 flex-shrink-0 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || isWaitingWinner || activeStudents.length === 0}
                className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-stone-300 dark:disabled:bg-stone-800 text-white font-bold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed"
              >
                <Play className={`w-4 h-4 sm:w-5 sm:h-5 fill-white ${isSpinning ? 'animate-pulse' : ''}`} />
                <span>
                  {isWaitingWinner
                    ? `🎉 Terpilih: ${winner ? (nameMode === 'nama' ? winner.nama : winner.panggilan) : ''}...`
                    : isSpinning
                    ? 'Sedang Memutar Roda...'
                    : 'PUTAR RODA (SPIN)'}
                </span>
              </button>

              {/* Sub-bar with mobile quick actions */}
              <div className="flex items-center justify-between w-full text-[11px] text-stone-500 dark:text-stone-400 px-1 pt-0.5">
                <span className="truncate">
                  Peluang: {(activeStudents.length > 0 ? (100 / activeStudents.length).toFixed(1) : 0)}% • {activeStudents.length} Nama
                </span>

                {/* Mobile Quick Switcher to Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('entries');
                    setRightTab('entries');
                  }}
                  className="lg:hidden text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Atur Nama</span>
                </button>
              </div>
            </div>
          </main>

          {/* RIGHT: Aside Settings, Entries Roster & Spin History */}
          <aside
            className={`${
              mobileTab !== 'wheel' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-96 xl:w-[420px] flex-col border-t lg:border-t-0 lg:border-l border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-[#15161A] overflow-hidden flex-shrink-0 h-full`}
          >
            {/* Desktop Top Tab Switcher */}
            <div className="hidden lg:block p-3 border-b border-stone-200/80 dark:border-stone-800/80 flex-shrink-0 bg-stone-100/70 dark:bg-[#121316]">
              <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-[#1C1E23] rounded-xl border border-stone-300/60 dark:border-stone-800/80">
                <button
                  type="button"
                  onClick={() => setRightTab('entries')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rightTab === 'entries'
                      ? 'bg-white dark:bg-[#252830] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Daftar Siswa</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-[#1A1A1A] text-stone-700 dark:text-stone-300 font-bold">
                    {activeStudents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab('history')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rightTab === 'history'
                      ? 'bg-white dark:bg-[#252830] text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Riwayat</span>
                  {history.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                      {history.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab 1: Entries & Roster Settings */}
            {(mobileTab === 'entries' || (mobileTab === 'wheel' && rightTab === 'entries')) ? (
              <div className="p-3 sm:p-4 flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
                {/* Format Nama Siswa */}
                <div className="p-3 bg-white dark:bg-[#1A1C20] rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2 flex-shrink-0 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                      Format Nama di Roda:
                    </label>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      Legibilitas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNameMode('panggilan')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                        nameMode === 'panggilan'
                          ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-2xs font-bold'
                          : 'bg-stone-50 dark:bg-[#141518] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                      }`}
                    >
                      Panggilan (Pendek)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameMode('nama')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                        nameMode === 'nama'
                          ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-2xs font-bold'
                          : 'bg-stone-50 dark:bg-[#141518] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-[#222429]'
                      }`}
                    >
                      Nama Lengkap
                    </button>
                  </div>
                </div>

                {/* Auto Remove Winner Toggle */}
                <div className="px-3 py-2 bg-white dark:bg-[#1A1C20] rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between flex-shrink-0 shadow-2xs">
                  <div>
                    <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      Hapus Otomatis Pemenang
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      Hilangkan siswa terpilih agar tidak terpilih ulang
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRemoveWinner}
                    onChange={e => setAutoRemoveWinner(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Entries Textarea & Actions */}
                <div className="p-3 bg-white dark:bg-[#1A1C20] rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex-1 flex flex-col min-h-[180px] shadow-2xs">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        Entri Peserta
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
                        disabled={isSpinning || isWaitingWinner || activeStudents.length <= 1}
                        title="Acak urutan nama di roda secara acak"
                        className="text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2.5 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#252830] transition border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#16171A]"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Acak</span>
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSpinning || isWaitingWinner}
                        title="Kembalikan seluruh 33 murid kelas XB"
                        className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#252830] transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>

                      {/* Clear Button */}
                      <button
                        type="button"
                        onClick={handleClearAllEntries}
                        disabled={isSpinning || isWaitingWinner || activeStudents.length === 0}
                        title="Kosongkan seluruh daftar entri"
                        className="text-xs font-medium text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer disabled:opacity-40 px-1 py-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={entriesText}
                    onChange={handleEntriesChange}
                    disabled={isSpinning || isWaitingWinner}
                    placeholder="Masukkan satu nama per baris..."
                    rows={7}
                    className="w-full flex-1 p-2.5 text-xs font-mono rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] text-stone-900 dark:text-stone-100 resize-none focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                  <div className="mt-1 text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                    <span>1 nama per baris</span>
                    <span>Diperbarui langsung</span>
                  </div>
                </div>

                {/* Mobile Action to Go Back & Spin */}
                <div className="lg:hidden flex-shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => setMobileTab('wheel')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Buka Roda & Putar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Spin History */
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0">
                {/* History Filter Chips & Clear Action */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80 dark:border-stone-800/80 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs font-bold'
                          : 'bg-white dark:bg-[#1E1F23] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
                      }`}
                    >
                      Semua ({history.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('removed')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'removed'
                          ? 'bg-rose-700 text-white shadow-2xs font-bold'
                          : 'bg-white dark:bg-[#1E1F23] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
                      }`}
                    >
                      Dihapus ({removedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('kept')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        historyFilter === 'kept'
                          ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                          : 'bg-white dark:bg-[#1E1F23] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100'
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
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 min-h-0">
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
                          : 'Ubah filter di atas untuk melihat data lain.'}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map(item => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1A1C20] flex items-center justify-between gap-2.5 text-xs transition shadow-2xs"
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
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#252830] transition cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Mobile Action to Go Back & Spin */}
                <div className="lg:hidden flex-shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => setMobileTab('wheel')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Buka Roda & Putar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Winner Dialog Modal Overlay */}
        {showWinnerDialog && winner && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-4 modal-backdrop-tint animate-in zoom-in-95 duration-150"
            onClick={e => {
              if (e.target === e.currentTarget) setShowWinnerDialog(false);
            }}
          >
            <div className="bg-white dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
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
                  className="px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWinnerDialog(false)}
                  className="px-3 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition shadow-xs cursor-pointer font-bold"
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
