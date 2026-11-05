# Analisis Peran Google Sheets vs Firebase & Rencana Integrasi Notifikasi

Dokumen revisi untuk menjawab pertanyaan: *"Apakah setelah implementasi Firebase, Google Sheets tidak ada gunanya lagi?"* serta menjelaskan arsitektur hibrida terbaik (**Google Sheets + Firebase**) untuk Dashboard Kelas XB.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Jawaban Singkat:** **TIDAK, Google Sheets tetap SANGAT BERGUNA dan TIDAK PERLU DIHAPUS.**
> 
> Google Sheets dan Firebase memiliki tugas yang sama sekali berbeda dan bekerja secara **saling melengkapi (hibrida)**:
> - **Google Sheets**: Tetap menjadi **sumber input konten harian (CMS)** bagi guru, bendahara, dan murid (piket, MBG, doa, jadwal pelajaran, ice breaking).
> - **Firebase**: Menjadi **mesin infrastruktur cloud & notifikasi** untuk hal-hal teknis yang tidak bisa ditangani oleh Google Sheets (seperti token perangkat push notification, enkripsi VAPID/FCM, dan sinkronisasi realtime).

- **Keputusan Terkonfirmasi 1**: Mempertahankan Google Sheets 100% sebagai antarmuka input data harian pengurus kelas yang fleksibel dan mudah diedit via HP/Google Drive.
- **Keputusan Terkonfirmasi 2**: Menggunakan Firebase secara terarah hanya untuk menangani sistem Push Notifikasi terpusat (token perangkat & FCM) serta cadangan cache cepat agar aplikasi tidak membebani kuota API Google Sheets.

---

## 1. Overview & Core Concept

### Mengapa Google Sheets Tetap Jauh Lebih Baik untuk Input Konten?

Jika seluruh data dipaksa pindah ke Firebase tanpa Google Sheets, pengurus kelas justru akan kesulitan:

| Aspek | Google Sheets | Jika Dipaksa Full Firebase Saja |
| :--- | :--- | :--- |
| **Kemudahan Input** | Sangat mudah: tinggal buka aplikasi Google Sheets di HP/PC, ketik tabel, copy-paste baris, beri warna. | Rumit: harus dibuatkan antarmuka admin form khusus di web, input satu per satu. |
| **Kolaborasi** | Guru, wali kelas, ketua kelas, dan bendahara bisa mengedit bersamaan via Google Drive tanpa izin teknis. | Memerlukan registrasi akun, sistem login, dan manajemen hak akses rumit di database. |
| **Perhitungan Otomatis** | Rumus Excel/Sheets (`SUM`, `VLOOKUP`, pivot kas) berjalan otomatis. | Logika rumus kalkulasi kas harus ditulis ulang secara manual di kode backend. |
| **Kelemahannya** | Tidak bisa mengirim push notifikasi dan tidak bisa menyimpan token perangkat pengguna. | Mampu mengirim notifikasi dan menyimpan token cloud secara persisten. |

---

## 2. User Experience & Pembagian Tugas (Arsitektur Hibrida)

Dengan menggabungkan Google Sheets dan Firebase, Anda mendapatkan keunggulan dari kedua platform:

### 1. Tugas Google Sheets (Tetap Berjalan Normal)
- **Jadwal Pelajaran & Kalender Acara**: Dibaca dari Google Calendar & Sheets.
- **Petugas Doa Harian & Renungan**: Diedit pengurus kelas di Google Sheets.
- **Petugas MBG & Piket Kelas**: Diedit di Google Sheets.
- **Pencatatan Rekap Kas Murid**: Bendahara tetap merekap di spreadsheet seperti biasa.

### 2. Tugas Firebase (Fitur Tambahan Baru)
- **Penyimpanan Token Push Notifikasi**: Menyimpan endpoint dan subscription browser setiap murid secara aman di Cloud Firestore.
- **Pengiriman Pesan Cepat (FCM)**: Mengirimkan pengingat jam 19:00 WIB langsung ke HP murid melalui jaringan Google FCM.
- **Cache Anti-Limit**: Menyimpan salinan data Sheets terakhir di Firestore agar ketika ada puluhan murid membuka web secara bersamaan, aplikasi tidak terkena batas kuota (*rate limit*) Google Sheets.

---

## 3. Key Product Decisions & Trade-Offs

- **Model Sinergi Sheets + Firestore (Bukan Penggantian)**:
  - *Keputusan*: Mempertahankan Google Sheets sebagai *Single Source of Truth* konten, dan menggunakan Firestore untuk token notifikasi.
  - *Keuntungan*: Pengurus kelas tidak perlu belajar cara menggunakan database baru; mereka tetap bekerja di Google Sheets seperti biasa, dan aplikasi web otomatis mengambil data dari Sheets lalu mengirim notifikasi via Firebase.
- **Opsi Sinkronisasi Otomatis**:
  - Backend membaca Google Sheets -> menyusun jadwal besok -> mengirim notifikasi ke subscriber yang tersimpan di Firestore.

---

## 4. Technical Architecture & Data Strategy

### Diagram Alur Sinergi: Google Sheets + Firebase

```
┌────────────────────────────────────────────────────────────────────────┐
│                   INPUT KONTEN (PENGURUS KELAS)                        │
│                                                                        │
│   Google Sheets (Piket, MBG, Doa, Kas) & Google Calendar (Mapel)      │
│   [Tetap digunakan seperti biasa via aplikasi Google Sheets di HP]     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       Baca Data CSV│ (Tiap ada perubahan)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICE                                 │
│                                                                        │
│  - Membaca jadwal harian dari Google Sheets                            │
│  - Mengambil daftar penerima notifikasi dari Cloud Firestore           │
│  - Memproses pengingat otomatis jam 19:00 WIB                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    Simpan/Baca     │                                │ Trigger Notifikasi
    Token Notifikasi│                                │
                    ▼                                ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│       CLOUD FIRESTORE        │  │   FIREBASE CLOUD MESSAGING (FCM)     │
│                              │  │                                      │
│ Koleksi: `push_subscriptions`│  │ Mengirim pengingat jadwal ke         │
│ (Menampung token HP murid)   │  │ layar HP / browser murid             │
└──────────────────────────────┘  └──────────────────────────────────────┘
```

---

### Kesimpulan

Implementasi Firebase **bukan untuk membuang Google Sheets**, melainkan untuk **melengkapi Google Sheets dengan infrastruktur notifikasi cloud profesional**. Anda tetap menggunakan Google Sheets untuk mengelola jadwal kelas sehari-hari tanpa perubahan cara kerja.
