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

export interface PeriodItem {
  time: string;
  cleanName: string;
  summary?: string;
  rawSummary?: string;
  hasTask?: boolean;
  taskText?: string;
  location?: string;
}

export interface TaskItem {
  id?: string;
  subject: string;
  taskText: string;
  time?: string;
  dueDate?: string;
}

export interface ClassDataStore {
  doaByDate: Record<string, DoaSchedule>;
  mbgByDate: Record<string, MbgSchedule>;
  piketByDow: Record<string, PiketSchedule>;
  pelajaranByDate: Record<string, PeriodItem[]>;
  tasksByDate: Record<string, TaskItem[]>;
  birthdayByMonthDay: Record<string, string[]>;
}
