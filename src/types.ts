export interface DoaSchedule {
  tanggal: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD
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
  tanggal: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD
  hari: string;
  petugas: string[];
}

export interface PiketSchedule {
  hari: string;
  petugas: string[];
}

export interface PeriodItem {
  time: string; // e.g. "07:30"
  endTime?: string;
  name: string; // subject name (e.g. "Ekonomi - JP4")
  cleanName: string; // subject name with tags stripped
  description?: string; // cleaned description
  hasTask: boolean;
  taskText?: string;
}

export interface TaskItem {
  subject: string;
  task: string;
  time?: string;
  periodName?: string;
}

export interface ClassDataStore {
  doaByDate: Record<string, DoaSchedule>; // YYYY-MM-DD -> DoaSchedule
  mbgByDate: Record<string, MbgSchedule>; // YYYY-MM-DD -> MbgSchedule
  piketByDow: Record<string, PiketSchedule>; // Hari ("Senin", "Selasa", etc.) -> PiketSchedule
  pelajaranByDate: Record<string, PeriodItem[]>; // YYYY-MM-DD -> PeriodItem[]
  tasksByDate: Record<string, TaskItem[]>; // YYYY-MM-DD -> TaskItem[] (extracted from pelajaran description!)
  birthdayByMonthDay: Record<string, string[]>; // MM-DD -> [student name]
}
