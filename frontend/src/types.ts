export interface DoaSchedule {
  tanggal: string;
  isoDate: string;
  hari: string;
  bacaanInjil: string;
  bab: string;
  ayat: string;
  doaPagi: string;
  renungan: string;
  malaikatTuhan: string;
  doaPenutup: string;
}

export interface MbgSchedule {
  tanggal: string;
  isoDate: string;
  hari: string;
  petugas: string[];
}

export interface PiketSchedule {
  hari: string;
  petugas: string[];
}

export interface IceBreakingSchedule {
  tanggal: string;
  isoDate: string;
  hari: string;
  pelajaranPertama: string;
  petugas: string[];
}

export interface PeriodItem {
  time: string;
  cleanName: string;
  summary?: string;
  rawSummary?: string;
  hasTask?: boolean;
  taskText?: string;
  taskTitle?: string;
  taskDetails?: string;
  hasDetails?: boolean;
  location?: string;
}

export interface TaskItem {
  id?: string;
  subject: string;
  taskText: string;
  taskTitle?: string;
  taskDetails?: string;
  hasDetails?: boolean;
  time?: string;
  dueDate?: string;
}

export interface KasWeekColumn {
  colIndex: number;
  dateStr: string;   // e.g. "24"
  monthName: string; // e.g. "Jul 26"
  label: string;     // e.g. "24 Jul 26"
}

export interface KasStudentEntry {
  absen: number;
  nama: string;
  payments: Record<number, number>; // colIndex -> amount in Rupiah (e.g. 3000)
  totalBayar: number;               // in Rupiah
  targetWajib: number;              // in Rupiah (activeWeeksCount * 3000)
  tunggakan: number;                // in Rupiah (Math.max(0, targetWajib - totalBayar))
  lebihBayar: number;               // in Rupiah (Math.max(0, totalBayar - targetWajib))
  status: 'lunas' | 'nunggak' | 'lebih';
  rekapSheet: number;               // in Rupiah from sheet column 31
}

export interface KasPengeluaranItem {
  id: string;
  tanggal: string;
  barang: string;
  kuantitas: number;
  hargaSatuan: number;
  hargaTotal: number;
  saldo: string;
  bukti: string;
}

export interface KasPendapatanLainItem {
  id: string;
  tanggal: string;
  keterangan: string;
  jumlah: number;
  bukti: string;
}

export interface KasRekapBulan {
  bulan: string;
  nominal: number;
}

export interface KasRekapSummary {
  saldoTotal: number;
  totalPendapatan: number;
  totalPengeluaran: number;
  kasSemesterGanjil: number;
  kasSemesterGenap: number;
  pendapatanLain: number;
  pengeluaranPerBulan: KasRekapBulan[];
}

export interface KasDataStore {
  weeks: KasWeekColumn[];
  students: KasStudentEntry[];
  totalKasTerkumpul: number;
  totalTunggakan: number;
  ratePerWeek: number;
  valuePerUnit: number;
  pengeluaranList: KasPengeluaranItem[];
  pendapatanLainList: KasPendapatanLainItem[];
  rekapSummary: KasRekapSummary;
  lastUpdated?: string;
}

export interface ClassDataStore {
  doaByDate: Record<string, DoaSchedule>;
  mbgByDate: Record<string, MbgSchedule>;
  piketByDow: Record<string, PiketSchedule>;
  iceBreakingByDate: Record<string, IceBreakingSchedule>;
  pelajaranByDate: Record<string, PeriodItem[]>;
  tasksByDate: Record<string, TaskItem[]>;
  birthdayByMonthDay: Record<string, string[]>;
  kasData?: KasDataStore;
}

