export interface SongDetail {
  title: string;
  composer: string;
  lyrics: string[];
}

// Jadwal resmi lagu wajib bulanan sesuai lampiran data
// 0: Jan, 1: Feb, 2: Mar, 3: Apr, 4: Mei, 5: Jun, 6: Jul, 7: Ags, 8: Sep, 9: Okt, 10: Nov, 11: Des
export const MONTHLY_SONG_SCHEDULE: Record<number, Record<number, string>> = {
  // Januari
  0: {
    1: 'Garuda Pancasila',
    2: 'Maju Tak Gentar',
    3: 'Bagimu Negeri',
    4: 'Dari Sabang Sampai Merauke',
    5: ''
  },
  // Februari
  1: {
    1: 'Satu Nusa Satu Bangsa',
    2: 'Garuda Pancasila',
    3: 'Maju Tak Gentar',
    4: 'Bagimu Negeri',
    5: ''
  },
  // Maret
  2: {
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: 'Bagimu Negeri'
  },
  // April
  3: {
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: ''
  },
  // Mei
  4: {
    1: 'Bagimu Negeri',
    2: 'Dari Sabang Sampai Merauke',
    3: 'Satu Nusa Satu Bangsa',
    4: 'Garuda Pancasila',
    5: 'Maju Tak Gentar'
  },
  // Juni (Kosong / Libur Semester)
  5: {
    1: '',
    2: '',
    3: '',
    4: '',
    5: ''
  },
  // Juli
  6: {
    1: '',
    2: 'Bagimu Negeri',
    3: 'Dari Sabang Sampai Merauke',
    4: 'Satu Nusa Satu Bangsa',
    5: ''
  },
  // Agustus
  7: {
    1: 'Garuda Pancasila',
    2: 'Hari Merdeka',
    3: 'Bagimu Negeri',
    4: 'Dari Sabang Sampai Merauke',
    5: ''
  },
  // September
  8: {
    1: 'Satu Nusa Satu Bangsa',
    2: 'Garuda Pancasila',
    3: 'Maju Tak Gentar',
    4: 'Bagimu Negeri',
    5: ''
  },
  // Oktober
  9: {
    1: 'Dari Sabang Sampai Merauke',
    2: 'Satu Nusa Satu Bangsa',
    3: 'Garuda Pancasila',
    4: 'Maju Tak Gentar',
    5: ''
  },
  // November
  10: {
    1: 'Bagimu Negeri',
    2: 'Dari Sabang Sampai Merauke',
    3: 'Satu Nusa Satu Bangsa',
    4: 'Garuda Pancasila',
    5: 'Maju Tak Gentar'
  },
  // Desember (Kosong / Libur Semester)
  11: {
    1: '',
    2: '',
    3: '',
    4: '',
    5: ''
  }
};

export function getWeekOfMonth(year: number, month: number, day: number): number {
  const firstDow = new Date(year, month, 1).getDay();
  const week = Math.ceil((day + firstDow) / 7);
  return Math.min(5, Math.max(1, week));
}

export function getSongForWeek(month: number, week: number): string {
  const monthMap = MONTHLY_SONG_SCHEDULE[month];
  if (monthMap && monthMap[week] && monthMap[week] !== '-') {
    return monthMap[week];
  }
  return '';
}

export function getSongForDate(date: Date): { song: string; week: number } {
  const month = date.getMonth();
  const week = getWeekOfMonth(date.getFullYear(), month, date.getDate());
  const song = getSongForWeek(month, week);
  return { song, week };
}

// Database lirik lagu wajib nasional resmi sesuai teks lampiran
export const SONG_LYRICS_DB: Record<string, SongDetail> = {
  'Garuda Pancasila': {
    title: 'Garuda Pancasila',
    composer: 'Prohar Sudharnoto',
    lyrics: [
      'Garuda Pancasila',
      'Akulah pendukungmu',
      'Patriot proklamasi',
      'Sedia berkorban untukmu',
      '',
      'Pancasila dasar negara',
      'Rakyat adil makmur sentosa',
      'Pribadi bangsaku',
      'Ayo maju maju',
      'Ayo maju maju',
      'Ayo maju maju'
    ]
  },
  'Satu Nusa Satu Bangsa': {
    title: 'Satu Nusa Satu Bangsa',
    composer: 'Liberty Manik',
    lyrics: [
      'Satu nusa',
      'Satu bangsa',
      'Satu bahasa kita',
      '',
      'Tanah air',
      'Pasti jaya',
      'Untuk selama-lamanya',
      '',
      'Indonesia pusaka',
      'Indonesia tercinta',
      'Nusa bangsa',
      'Dan bahasa',
      'Kita bela bersama'
    ]
  },
  'Dari Sabang Sampai Merauke': {
    title: 'Dari Sabang Sampai Merauke',
    composer: 'R. Soerardjo',
    lyrics: [
      'Dari Sabang sampai Merauke',
      'Berjajar pulau-pulau',
      'Sambung-menyambung menjadi satu',
      'Itulah Indonesia',
      '',
      'Indonesia tanah airku',
      'Aku berjanji padamu',
      'Menjunjung tanah airku',
      'Tanah airku Indonesia'
    ]
  },
  'Bagimu Negeri': {
    title: 'Bagimu Negeri',
    composer: 'Kusbini',
    lyrics: [
      'Padamu negeri kami berjanji',
      'Padamu negeri kami berbakti',
      'Padamu negeri kami mengabdi',
      'Bagimu negeri jiwa raga kami'
    ]
  },
  'Hari Merdeka': {
    title: 'Hari Merdeka',
    composer: 'H. Mutahar',
    lyrics: [
      'Tujuh belas Agustus tahun empat lima',
      'Itulah hari kemerdekaan kita',
      'Hari merdeka nusa dan bangsa',
      'Hari lahirnya bangsa Indonesia',
      'Merdeka!',
      '',
      'Sekali merdeka tetap merdeka',
      'Selama hayat masih dikandung badan',
      'Kita tetap setia tetap sedia',
      'Mempertahankan Indonesia',
      'Kita tetap setia tetap sedia',
      'Membela negara kita'
    ]
  },
  'Maju Tak Gentar': {
    title: 'Maju Tak Gentar',
    composer: 'Cornel Simanjuntak',
    lyrics: [
      'Maju tak gentar',
      'Membela yang benar',
      'Maju tak gentar',
      'Hak kita diserang',
      '',
      'Maju serentak',
      'Mengusir penyerang',
      'Maju serentak',
      'Tentu kita menang',
      '',
      'Bergerak bergerak',
      'Serentak serentak',
      'Menerkam menerjang terkam',
      '',
      'Tak gentar tak gentar',
      'Menyerang menyerang',
      'Majulah majulah menang'
    ]
  }
};

// Daftar seluruh judul lagu wajib nasional
export const ALL_SONGS_LIST: string[] = [
  'Garuda Pancasila',
  'Satu Nusa Satu Bangsa',
  'Dari Sabang Sampai Merauke',
  'Bagimu Negeri',
  'Hari Merdeka',
  'Maju Tak Gentar'
];
