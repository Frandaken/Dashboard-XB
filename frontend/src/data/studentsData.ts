export interface Student {
  absen: number;
  nama: string;
  gender: 'L' | 'P';
  panggilan: string;
}

export const STUDENTS_DATA: Student[] = [
  { absen: 1, nama: "Alecha Elektra Miracle", gender: "P", panggilan: "Alecha" },
  { absen: 2, nama: "Alexander Michael Timothy", gender: "L", panggilan: "Xander" },
  { absen: 3, nama: "Andreas Avellino Tresnadi", gender: "L", panggilan: "Andre" },
  { absen: 4, nama: "Ashley Stephany Nayotamma Davies Karubaba", gender: "P", panggilan: "Ashley" },
  { absen: 5, nama: "Beatrice Graceana Velinka Analoklo", gender: "P", panggilan: "Grace" },
  { absen: 6, nama: "Benedicta Keira Putri", gender: "P", panggilan: "Kekey" },
  { absen: 7, nama: "Bintang Silalahi", gender: "L", panggilan: "Bintang" },
  { absen: 8, nama: "Claudya Fiorenza Paula Awi", gender: "P", panggilan: "Claudya" },
  { absen: 9, nama: "Devina Adiya Wijaya", gender: "P", panggilan: "Devina" },
  { absen: 10, nama: "Dimas Maulana Firmansyah", gender: "L", panggilan: "Dimas" },
  { absen: 11, nama: "Edward Joel", gender: "L", panggilan: "Joel" },
  { absen: 12, nama: "Evander Adwinson Nathanael Wijata", gender: "L", panggilan: "Evan" },
  { absen: 13, nama: "Frans Imanuel Fabianto", gender: "L", panggilan: "Frans" },
  { absen: 14, nama: "Gerardus Dhimy Yudwykha", gender: "L", panggilan: "Dhimy" },
  { absen: 15, nama: "Hans Felix", gender: "L", panggilan: "Hans" },
  { absen: 16, nama: "Ignatius Oniel Setiadi", gender: "L", panggilan: "Adi" },
  { absen: 17, nama: "Jesus Adriano Wurangian", gender: "L", panggilan: "Adriano" },
  { absen: 18, nama: "Joshua Edward Riyadi", gender: "L", panggilan: "Joshua" },
  { absen: 19, nama: "Lionel Yehezkiel Halim", gender: "L", panggilan: "Lionel" },
  { absen: 20, nama: "Mahalia Faradba Alwani", gender: "P", panggilan: "Mahalia" },
  { absen: 21, nama: "Maleakhi Sandro Simanjuntak", gender: "L", panggilan: "Sandro" },
  { absen: 22, nama: "Maria Astheritha Meiliany", gender: "P", panggilan: "Asther" },
  { absen: 23, nama: "Michael Franda Ken Julian Putra", gender: "L", panggilan: "Franda" },
  { absen: 24, nama: "Nicolaus Fellix Ananta", gender: "L", panggilan: "Fellix" },
  { absen: 25, nama: "Prita Akwila Situmorang", gender: "P", panggilan: "Prita" },
  { absen: 26, nama: "Retna Puja Monica", gender: "P", panggilan: "Retna" },
  { absen: 27, nama: "Steven Valentino Setiawan", gender: "L", panggilan: "Steven" },
  { absen: 28, nama: "Teresa Clarissa Setiawan", gender: "P", panggilan: "Tere" },
  { absen: 29, nama: "Valerie Isabelle", gender: "P", panggilan: "Valerie" },
  { absen: 30, nama: "Vickey Immanuel", gender: "L", panggilan: "Vickey" },
  { absen: 31, nama: "Virginia Bintang Putri Saragih", gender: "P", panggilan: "Virgi" },
  { absen: 32, nama: "Vivian Felicia Susanto", gender: "P", panggilan: "Felice" },
  { absen: 33, nama: "Wenceslaus Kim Ivander", gender: "L", panggilan: "Kim" }
];

export const PIKET_SCHEDULE_MAP: Record<number, string> = {
  1: 'Senin',   // Alecha
  2: 'Jumat',   // Xander
  3: 'Jumat',   // Andre
  4: 'Senin',   // Ashley
  5: 'Selasa',  // Grace
  6: 'Rabu',    // Kekey
  7: 'Senin',   // Bintang
  8: 'Senin',   // Claudya
  9: 'Kamis',   // Devina
  10: 'Rabu',   // Dimas
  11: 'Kamis',  // Joel
  12: 'Selasa', // Evan
  13: 'Selasa', // Frans
  14: 'Jumat',  // Dhimy
  15: 'Senin',  // Hans
  16: 'Kamis',  // Adi
  17: 'Kamis',  // Adriano
  18: 'Kamis',  // Joshua
  19: 'Rabu',   // Lionel
  20: 'Senin',  // Mahalia
  21: 'Selasa', // Sandro
  22: 'Selasa', // Asther
  23: 'Rabu',   // Franda
  24: 'Jumat',  // Fellix
  25: 'Senin',  // Prita
  26: 'Jumat',  // Retna
  27: 'Kamis',  // Steven
  28: 'Selasa', // Tere
  29: 'Jumat',  // Valerie
  30: 'Rabu',   // Vickey
  31: 'Rabu',   // Virgi
  32: 'Jumat',  // Felice / Vivian
  33: 'Selasa'   // Kim
};
