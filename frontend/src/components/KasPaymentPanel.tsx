import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode,
  Download,
  Maximize2,
  Copy,
  Check,
  FileSpreadsheet,
  MessageCircle,
  User,
  Info,
  Building2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { KasPaymentConfig, KasStudentEntry } from '../types';
import {
  buildKasConfirmationText,
  buildWhatsappConfirmUrl,
  formatRupiahId
} from '../config/kasPaymentConfig';
import { copyTextToClipboard } from '../utils/summaryFormatter';
import { triggerHaptic } from '../utils/haptics';

interface KasPaymentPanelProps {
  config: KasPaymentConfig;
  isLoadingConfig?: boolean;
  students: KasStudentEntry[];
  preselectedStudentAbsen?: number | null;
  onZoomQris?: (imageUrl: string, title: string, subtitle?: string) => void;
}

export const KasPaymentPanel: React.FC<KasPaymentPanelProps> = ({
  config,
  isLoadingConfig = false,
  students,
  preselectedStudentAbsen = null,
  onZoomQris
}) => {
  const weeklyRate = config.weeklyRate || 3000;

  const [selectedAbsen, setSelectedAbsen] = useState<string>(() =>
    preselectedStudentAbsen ? String(preselectedStudentAbsen) : ''
  );
  const [amount, setAmount] = useState<number>(weeklyRate);
  const [customAmountInput, setCustomAmountInput] = useState<string>(String(weeklyRate));
  const [studentNote, setStudentNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const selectedStudent = useMemo(() => {
    if (!selectedAbsen) return null;
    const absenNum = Number(selectedAbsen);
    return students.find(s => s.absen === absenNum) || null;
  }, [selectedAbsen, students]);

  // Sync preselected student when opened from a student detail modal
  useEffect(() => {
    if (preselectedStudentAbsen) {
      setSelectedAbsen(String(preselectedStudentAbsen));
    }
  }, [preselectedStudentAbsen]);

  // Automatically suggest arrears amount when a student with tunggakan is picked
  useEffect(() => {
    if (selectedStudent && selectedStudent.tunggakan > 0) {
      setAmount(selectedStudent.tunggakan);
      setCustomAmountInput(String(selectedStudent.tunggakan));
    } else if (selectedStudent && selectedStudent.tunggakan === 0) {
      setAmount(weeklyRate);
      setCustomAmountInput(String(weeklyRate));
    }
  }, [selectedStudent, weeklyRate]);

  // Reset image error state if QRIS URL changes
  useEffect(() => {
    setImageLoadError(false);
  }, [config.qrisImageUrl]);

  const weeksEquivalent = useMemo(() => {
    if (amount <= 0 || weeklyRate <= 0) return 0;
    return Math.round((amount / weeklyRate) * 10) / 10;
  }, [amount, weeklyRate]);

  const quickPresets = useMemo(() => {
    const presets: Array<{ label: string; value: number; highlight?: boolean }> = [];
    if (selectedStudent && selectedStudent.tunggakan > 0) {
      presets.push({
        label: `Lunasi Tunggakan (${formatRupiahId(selectedStudent.tunggakan)})`,
        value: selectedStudent.tunggakan,
        highlight: true
      });
    }
    presets.push(
      { label: `1 Minggu (${formatRupiahId(weeklyRate)})`, value: weeklyRate },
      { label: `2 Minggu (${formatRupiahId(weeklyRate * 2)})`, value: weeklyRate * 2 },
      { label: `4 Minggu (${formatRupiahId(weeklyRate * 4)})`, value: weeklyRate * 4 }
    );
    return presets;
  }, [selectedStudent, weeklyRate]);

  const confirmationText = useMemo(
    () =>
      buildKasConfirmationText({
        student: selectedStudent,
        amount,
        weeksEquivalent: Number.isInteger(weeksEquivalent) ? weeksEquivalent : undefined,
        bankName: config.bankName,
        note: studentNote
      }),
    [selectedStudent, amount, weeksEquivalent, config.bankName, studentNote]
  );

  const whatsappUrl = useMemo(
    () => buildWhatsappConfirmUrl(config.treasurerWhatsapp, confirmationText),
    [config.treasurerWhatsapp, confirmationText]
  );

  const handleSelectPreset = (val: number) => {
    triggerHaptic('light');
    setAmount(val);
    setCustomAmountInput(String(val));
  };

  const handleCustomAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setCustomAmountInput(digits);
    const parsed = parseInt(digits, 10);
    setAmount(Number.isFinite(parsed) ? parsed : 0);
  };

  const handleCopyConfirmation = async () => {
    const ok = await copyTextToClipboard(confirmationText);
    if (ok) {
      triggerHaptic('light');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const showLiveQris = Boolean(config.hasQrisImage && config.qrisImageUrl && !imageLoadError);

  return (
    <div className="space-y-4">
      {/* Manual Spreadsheet Verification Banner */}
      <div className="rounded-xl border border-amber-300/70 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/25 px-3.5 py-2.5 flex items-start gap-2.5">
        <FileSpreadsheet className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
          <span className="font-bold">Verifikasi &amp; Pencatatan Manual di Google Spreadsheet: </span>
          <span>{config.verificationNotice}</span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: QRIS Image (Left) + Reference & Steps (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: QRIS IMAGE DISPLAY */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#141518] p-4 sm:p-5 flex flex-col items-center text-center shadow-2xs">
          <div className="w-full flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-stone-800/70 text-left">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#122A1E] border border-emerald-600/20 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                  {config.merchantName}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{config.bankName}</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 flex-shrink-0">
              QRIS
            </span>
          </div>

          {/* Scannable White QRIS Frame (always white background so scanners read reliably in dark mode) */}
          <div className="w-full max-w-[300px] aspect-square rounded-xl bg-white border border-stone-200 p-3 flex items-center justify-center shadow-xs overflow-hidden">
            {isLoadingConfig ? (
              <div className="flex flex-col items-center gap-2 text-stone-400">
                <div className="w-10 h-10 rounded-lg bg-stone-100 animate-pulse" />
                <span className="text-xs">Memuat QRIS...</span>
              </div>
            ) : showLiveQris && config.qrisImageUrl ? (
              <img
                src={config.qrisImageUrl}
                alt={`QRIS ${config.merchantName}`}
                onError={() => setImageLoadError(true)}
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-3 py-4 text-stone-500 gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-700">
                    Gambar QRIS Belum Dipasang
                  </p>
                  <p className="text-[11px] leading-relaxed text-stone-500">
                    Letakkan file <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px]">qris.png</code> di folder data server atau atur env <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px]">KAS_QRIS_IMAGE_URL</code>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional Merchant Metadata */}
          {(config.accountHolder || config.nmid) && (
            <div className="mt-3 w-full max-w-[300px] rounded-lg bg-stone-50 dark:bg-[#1A1B1F] border border-stone-200/70 dark:border-stone-800/80 px-3 py-2 text-[11px] text-stone-600 dark:text-stone-300 space-y-0.5">
              {config.accountHolder && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-400 dark:text-stone-500">Penerima</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {config.accountHolder}
                  </span>
                </div>
              )}
              {config.nmid && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-400 dark:text-stone-500">NMID</span>
                  <span className="font-mono font-medium text-stone-700 dark:text-stone-300 truncate">
                    {config.nmid}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* QRIS Action Buttons (Zoom & Download) */}
          {showLiveQris && config.qrisImageUrl && (
            <div className="mt-3 w-full max-w-[300px] grid grid-cols-2 gap-2">
              {onZoomQris && (
                <button
                  type="button"
                  onClick={() =>
                    onZoomQris(
                      config.qrisImageUrl!,
                      `QRIS ${config.merchantName}`,
                      `${config.bankName}${config.accountHolder ? ` • ${config.accountHolder}` : ''}`
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-[#1E1F23] hover:bg-stone-100 dark:hover:bg-[#26282E] text-xs font-semibold text-stone-800 dark:text-stone-200 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perbesar</span>
                </button>
              )}
              <a
                href={config.qrisImageUrl}
                download="qris-kas-kelas-xb.png"
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E3A2F] dark:bg-emerald-700 hover:opacity-95 text-white text-xs font-semibold transition cursor-pointer ${
                  onZoomQris ? '' : 'col-span-2'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan QRIS</span>
              </a>
            </div>
          )}

          <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed max-w-[300px]">
            Mendukung semua Bank Digital &amp; E-Wallet berlogo QRIS (SeaBank, Bank Jago, blu, BCA, BRI, Mandiri, GoPay, OVO, DANA, ShopeePay).
          </p>
        </div>

        {/* RIGHT COLUMN: NOMINAL HELPER & SPREADSHEET VERIFICATION GUIDE */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Optional Nominal Calculator & Student Selector */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#141518] p-4 space-y-3.5 shadow-2xs">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                Bantu Hitung Nominal &amp; Format Konfirmasi
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Hanya sebagai referensi nominal saat transfer QRIS dan mempermudah Bendahara mencatat ke spreadsheet.
              </p>
            </div>

            {/* Student Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="kas-payment-student"
                className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Pilih Nama Siswa (Opsional)</span>
              </label>
              <select
                id="kas-payment-student"
                value={selectedAbsen}
                onChange={e => setSelectedAbsen(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-stone-50/70 dark:bg-[#1B1D22] text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">-- Pilih siswa untuk melihat tunggakan --</option>
                {students.map(s => (
                  <option key={s.absen} value={String(s.absen)}>
                    {String(s.absen).padStart(2, '0')} — {s.nama}
                    {s.tunggakan > 0 ? ` (Tunggakan ${formatRupiahId(s.tunggakan)})` : ' (Lunas)'}
                  </option>
                ))}
              </select>

              {selectedStudent && (
                <div
                  className={`mt-1.5 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                    selectedStudent.tunggakan > 0
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/70 dark:bg-[#122A1E]/70 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {selectedStudent.tunggakan > 0 ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span>Tunggakan saat ini</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>Status kas saat ini sudah Lunas</span>
                      </>
                    )}
                  </span>
                  <span className="font-editorial font-bold tabular-nums">
                    {selectedStudent.tunggakan > 0
                      ? formatRupiahId(selectedStudent.tunggakan)
                      : formatRupiahId(selectedStudent.totalBayar)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Nominal Presets + Custom Input */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Referensi Nominal Transfer
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map(preset => {
                  const isActive = amount === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        isActive
                          ? 'bg-[#1E3A2F] dark:bg-emerald-700 text-white border-[#1E3A2F] dark:border-emerald-600 shadow-2xs'
                          : preset.highlight
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                          : 'bg-stone-50 dark:bg-[#1B1D22] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-[#24272E]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmountInput}
                    onChange={e => handleCustomAmountChange(e.target.value)}
                    placeholder="3000"
                    aria-label="Nominal transfer dalam Rupiah"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-stone-50/70 dark:bg-[#1B1D22] text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <input
                  type="text"
                  value={studentNote}
                  onChange={e => setStudentNote(e.target.value)}
                  placeholder="Catatan opsional (mis. minggu 5-6)"
                  maxLength={120}
                  aria-label="Catatan opsional konfirmasi"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-stone-50/70 dark:bg-[#1B1D22] text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {amount > 0 && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Nominal diketik di aplikasi bank: <strong className="text-stone-800 dark:text-stone-200 font-mono">{formatRupiahId(amount)}</strong>
                  {weeksEquivalent > 0 && (
                    <span> ({Number.isInteger(weeksEquivalent) ? weeksEquivalent : weeksEquivalent.toFixed(1)} minggu iuran)</span>
                  )}
                </p>
              )}
            </div>

            {/* Confirmation Helper Buttons */}
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyConfirmation}
                className={`flex-1 min-w-[180px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-[#122A1E] text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-stone-100 dark:bg-[#1E1F23] hover:bg-stone-200/70 dark:hover:bg-[#282A30] text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Format Konfirmasi Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Format Konfirmasi</span>
                  </>
                )}
              </button>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A2F] dark:bg-emerald-700 hover:opacity-95 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim Bukti ke Bendahara</span>
                </a>
              )}
            </div>
          </div>

          {/* 3-Step Payment Flow Card */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#141518] p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Alur Pembayaran Kas
            </h4>
            <ol className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Buka aplikasi Bank Digital / E-Wallet, lalu <strong>scan atau impor gambar QRIS</strong> di samping.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Masukkan nominal iuran secara manual (mis. <strong>{formatRupiahId(amount || weeklyRate)}</strong>) dan simpan screenshot bukti transaksi.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-[#122A1E] text-emerald-900 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Kirim bukti transaksi ke Bendahara kelas. Bendahara akan memverifikasi mutasi dan <strong>menginput data secara manual ke Google Spreadsheet</strong>.
                </span>
              </li>
            </ol>

            {config.customNote && (
              <div className="mt-2 pt-2.5 border-t border-stone-200/70 dark:border-stone-800/70 flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{config.customNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
