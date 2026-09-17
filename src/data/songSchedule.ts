// Jadwal Lagu Wajib / Nasional Kelas XB
// 1 lagu berlaku selama 1 minggu penuh

export interface WeeklySongItem {
  week: number; // 1 to 5
  title: string;
  isAvailable: boolean;
}

export interface SongDetail {
  title: string;
  composer?: string;
  stanzas: string[];
}

// Data lirik lagu wajib nasional
export const SONG_LYRICS: Record<string, SongDetail> = {
  'Garuda Pancasila': {
    title: 'Garuda Pancasila',
    composer: 'Sudharnoto',
    stanzas: [
      'Garuda Pancasila\nAkulah pendukungmu\nPatriot proklamasi\nSedia berkorban untukmu',
      'Pancasila dasar negara\nRakyat adil makmur sentosa\nPribadi bangsaku\nAyo maju maju\nAyo maju maju\nAyo maju maju'
    ]
  },
  'Satu Nusa Satu Bangsa': {
    title: 'Satu Nusa Satu Bangsa',
    composer: 'L. Manik',
    stanzas: [
      'Satu nusa\nSatu bangsa\nSatu bahasa kita',
      'Tanah air\nPasti jaya\nUntuk selama-lamanya',
      'Indonesia pusaka\nIndonesia tercinta\nNusa bangsa\nDan bahasa\nKita bela bersama'
    ]
  },
  'Dari Sabang Sampai Merauke': {
    title: 'Dari Sabang Sampai Merauke',
    composer: 'R. Suharjo',
    stanzas: [
      'Dari Sabang sampai Merauke\nBerjajar pulau-pulau\nSambung-menyambung menjadi satu\nItulah Indonesia',
      'Indonesia tanah airku\nAku berjanji padamu\nMenjunjung tanah airku\nTanah airku Indonesia'
    ]
  },
  'Bagimu Negeri': {
    title: 'Bagimu Negeri',
    composer: 'Kusbini',
    stanzas: [
      'Padamu negeri kami berjanji\nPadamu negeri kami berbakti\nPadamu negeri kami mengabdi\nBagimu negeri jiwa raga kami'
    ]
  },
  'Hari Merdeka': {
    title: 'Hari Merdeka',
    composer: 'H. Mutahar',
    stanzas: [
      'Tujuh belas Agustus tahun empat lima\nItulah hari kemerdekaan kita\nHari merdeka nusa dan bangsa\nHari lahirnya bangsa Indonesia\nMerdeka!',
      'Sekali merdeka tetap merdeka\nSelama hayat masih dikandung badan\nKita tetap setia tetap sedia\nMempertahankan Indonesia\nKita tetap setia tetap sedia\nMembela negara kita'
    ]
  },
  'Maju Tak Gentar': {
    title: 'Maju Tak Gentar',
    composer: 'Cornel Simanjuntak',
    stanzas: [
      'Maju tak gentar\nMembela yang benar\nMaju tak gentar\nHak kita diserang',
      'Maju serentak\nMengusir penyerang\nMaju serentak\nTentu kita menang',
      'Bergerak bergerak\nSerentak serentak\nMenerkam menerjang terkam',
      'Tak gentar tak gentar\nMenyerang menyerang\nMajulah majulah menang'
    ]
  }
};

/**
 * Mengambil informasi detail lirik lagu berdasarkan judul
 */
export function getSongLyrics(title: string): SongDetail | null {
  if (!title || title === '-') return null;
  const key = title.trim();
  return SONG_LYRICS[key] || null;
}

// Data sesuai ketetapan jadwal semester 1 & 2
export const SONG_SCHEDULE: Record<number, Record<number, string>> = {
  // Bulan: 0 = Januari, 1 = Februari, dst.
  0: { // Januari
    1: 'Garuda Pancasila',
    2: 'Maju Tak Gentar',
    3: 'Bagimu Negeri',
    4: 'Dari Sabang Sampai Merauke',
    5: '-'
  },
  1: { // Februari
    1: 'Satu Nusa Satu Bangsa',
    2: 'Garuda Pancasila',
    3: 'Maju Tak Gentar',
    4: 'Bagimu Negeri',
    5: '-'
  },
  2: { // Maret
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: 'Bagimu Negeri'
  },
  3: { // April
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: '-'
  },
  4: { // Mei
    1: 'Bagimu Negeri',
    2: 'Dari Sabang Sampai Merauke',
    3: 'Satu Nusa Satu Bangsa',
    4: 'Garuda Pancasila',
    5: 'Maju Tak Gentar'
  },
  5: { // Juni (Libur Akhir Tahun Pelajaran)
    1: '-',
    2: '-',
    3: '-',
    4: '-',
    5: '-'
  },
  6: { // Juli
    1: '-',
    2: 'Bagimu Negeri',
    3: 'Dari Sabang Sampai Merauke',
    4: 'Satu Nusa Satu Bangsa',
    5: '-'
  },
  7: { // Agustus
    1: 'Garuda Pancasila',
    2: 'Hari Merdeka',
    3: 'Bagimu Negeri',
    4: 'Dari Sabang Sampai Merauke',
    5: '-'
  },
  8: { // September
    1: 'Satu Nusa Satu Bangsa',
    2: 'Garuda Pancasila',
    3: 'Maju Tak Gentar',
    4: 'Bagimu Negeri',
    5: '-'
  },
  9: { // Oktober
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: '-'
  },
  10: { // November
    1: 'Bagimu Negeri',
    2: 'Dari Sabang Sampai Merauke',
    3: 'Satu Nusa Satu Bangsa',
    4: 'Garuda Pancasila',
    5: 'Maju Tak Gentar'
  },
  11: { // Desember (Libur Akhir Semester Ganjil)
    1: '-',
    2: '-',
    3: '-',
    4: '-',
    5: '-'
  }
};

/**
 * Menghitung nomor minggu (1 - 5) dari suatu tanggal dalam bulan yang bersangkutan
 * Berdasarkan baris kalender mingguan
 */
export function getWeekOfMonth(year: number, month: number, day: number): number {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Minggu, 1 = Senin, ...
  const weekNumber = Math.floor((firstDow + day - 1) / 7) + 1;
  return Math.min(5, Math.max(1, weekNumber));
}

/**
 * Mengambil judul lagu untuk bulan dan minggu tertentu
 */
export function getSongForWeek(month: number, week: number): string {
  const monthSchedule = SONG_SCHEDULE[month];
  if (!monthSchedule) return '-';
  return monthSchedule[week] || '-';
}

/**
 * Mengambil judul lagu untuk tanggal spesifik
 */
export function getSongForDate(date: Date): { week: number; song: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const week = getWeekOfMonth(year, month, day);
  const song = getSongForWeek(month, week);
  return { week, song };
}

/**
 * Mengambil list lagu lengkap 5 minggu untuk bulan yang dipilih
 */
export function getSongsForMonth(month: number): WeeklySongItem[] {
  const list: WeeklySongItem[] = [];
  for (let w = 1; w <= 5; w++) {
    const title = getSongForWeek(month, w);
    list.push({
      week: w,
      title,
      isAvailable: title !== '-'
    });
  }
  return list;
}
