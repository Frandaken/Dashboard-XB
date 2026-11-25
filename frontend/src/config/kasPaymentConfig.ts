import { KasPaymentConfig, KasStudentEntry } from '../types';

export const DEFAULT_KAS_PAYMENT_CONFIG: KasPaymentConfig = {
  enabled: true,
  providerType: 'qris',
  bankName: 'Bank Digital (QRIS)',
  merchantName: 'Kas Kelas XB — SMA Putra Nirmala',
  accountHolder: '',
  nmid: '',
  weeklyRate: 3000,
  qrisImageUrl: null,
  hasQrisImage: false,
  imageSource: 'none',
  treasurerWhatsapp: '',
  customNote: '',
  verificationMode: 'manual_spreadsheet',
  verificationNotice:
    'Verifikasi pembayaran dan pencatatan status lunas tetap dilakukan secara manual oleh Bendahara di Google Spreadsheet resmi kelas.'
};

export async function fetchKasPaymentConfig(): Promise<KasPaymentConfig> {
  try {
    const res = await fetch(`/api/kas/payment-config?t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) return DEFAULT_KAS_PAYMENT_CONFIG;
    const json = await res.json();
    if (json?.ok && json.config) {
      return {
        ...DEFAULT_KAS_PAYMENT_CONFIG,
        ...json.config
      };
    }
  } catch {
    // Fallback cleanly to default config when offline or server unavailable
  }
  return DEFAULT_KAS_PAYMENT_CONFIG;
}

export function formatRupiahId(amount: number): string {
  const safe = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export interface KasConfirmationPayload {
  student?: KasStudentEntry | null;
  amount: number;
  weeksEquivalent?: number;
  bankName: string;
  note?: string;
}

export function buildKasConfirmationText({
  student,
  amount,
  weeksEquivalent,
  bankName,
  note
}: KasConfirmationPayload): string {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  const lines = [
    '*Konfirmasi Pembayaran Kas Kelas XB*',
    `Tanggal: ${todayStr}`,
    `Metode: QRIS (${bankName})`
  ];

  if (student) {
    lines.push(`Nama: ${student.nama} (Absen ${student.absen})`);
  } else {
    lines.push('Nama: [Tulis Nama Lengkap & Absen]');
  }

  if (amount > 0) {
    const weeksLabel =
      weeksEquivalent && weeksEquivalent > 0 ? ` (~${weeksEquivalent} minggu)` : '';
    lines.push(`Nominal: ${formatRupiahId(amount)}${weeksLabel}`);
  } else {
    lines.push('Nominal: Rp [Isi Nominal]');
  }

  if (note && note.trim()) {
    lines.push(`Catatan: ${note.trim()}`);
  }

  lines.push('', 'Bukti transfer terlampir. Mohon dibantu verifikasi dan pencatatan di Google Spreadsheet kas kelas. Terima kasih.');
  return lines.join('\n');
}

export function buildWhatsappConfirmUrl(rawPhone: string | undefined, message: string): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
