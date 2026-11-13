# Dashboard Jadwal Kelas XB – SMA Putra Nirmala

Dashboard interaktif layar penuh dan Progressive Web App (PWA) resmi untuk ruang kelas **XB SMA Putra Nirmala**. Dirancang untuk kebutuhan layar sentuh/display kelas, perangkat mobile siswa, dan komputer guru.

Aplikasi ini menyinkronkan jadwal pelajaran, penugasan berformat rich text, petugas harian kelas (MBG, Piket, Doa & Liturgi, Ice Breaking), pembukuan kas murid, serta utilitas interaktif kelas secara realtime dari **Google Calendar (iCal)** dan **Google Sheets (CSV)**.

**Repository GitHub:** [https://github.com/Frandaken/Dashboard-XB](https://github.com/Frandaken/Dashboard-XB)

---

## ✨ Fitur Utama

### 1. 📅 Jadwal Pelajaran & Kalender Kelas
- **Jadwal Pelajaran Real-Time:** Menampilkan mata pelajaran yang sedang berlangsung, waktu mulai-selesai, serta countdown jam pelajaran.
- **Alert Jam Pelajaran Selanjutnya:** Notifikasi toast otomatis muncul 5 menit sebelum jam pelajaran berikutnya dimulai (lengkap dengan progress bar 5 detik).
- **Kalender Interaktif:** Navigasi tanggal harian dan bulanan dengan detail agenda lengkap, hari ulang tahun siswa, dan riwayat kegiatan.
- **Dukungan Rich Text Formatting:** Mendukung format teks kalender (tebal, miring, garis bawah, list, dan tautan).

### 2. 👥 Petugas Harian Kelas
- **Doa & Liturgi Harian:** Bacaan Injil hari bersangkutan, perikop, bab & ayat, petugas doa pagi, renungan, Malaikat Tuhan, dan doa penutup. Tampilan otomatis menyesuaikan ukuran font besar agar mudah dibaca dari jarak jauh di kelas.
- **Petugas MBG (Makan Bergizi Gratis):** Jadwal petugas pengambil dan pembagi MBG dengan mekanisme adaptif (disembunyikan otomatis jika tanggal tersebut tidak memiliki jadwal MBG).
- **Petugas Piket Kebersihan:** Pembagian regu piket Senin s.d. Jumat sesuai data absensi murid.
- **Petugas Ice Breaking:** Jadwal petugas penyemangat pagi sebelum pelajaran pertama dimulai.

### 3. 💰 Buku Kas & Penunggakan Murid
- **Buku Kas Murid:** Rekapitulasi iuran kas mingguan per siswa (otomatis mendeteksi status *Lunas*, *Nunggak*, atau *Lebih Bayar*).
- **Catatan Pengeluaran & Pendapatan Lain:** Rincian transaksi belanja kelas dengan pratinjau foto kuitansi/bon menggunakan Lightbox viewer.
- **Ringkasan Keuangan:** Perhitungan saldo terkini kas kelas secara otomatis.

### 4. 🛠️ Alat Bantu & Utilitas Kelas
- **🎡 Roda Putar Siswa (Wheel of Names):** Generator acak interaktif untuk memilih siswa (misal: giliran maju kuis) dilengkapi efek suara dan selebrasi konfeti.
- **👥 Pembagian Kelompok (Team Generator):** Generator tim seimbang otomatis dengan opsi pembagian rata gender (Laki-laki & Perempuan) atau acak murni berdasarkan kuota anggota.
- **📋 Ekspor Agenda Mingguan (WhatsApp):** Format rangkuman tugas dan jadwal pelajaran siap salin ke grup WhatsApp dengan live preview.
- **🔍 Pencarian Global (Ctrl+K / ⌘K):** Akses instan pencarian pelajaran, tugas, pengumuman, dan data siswa.
- **🎵 Buku Lirik Lagu Wajib:** Daftar lirik lagu wajib bulanan resmi, Mars Salib Suci (Himne Sekolah), dan Indonesia Raya dengan struktur bait rapi untuk pembiasaan pagi serta tampilan kartu khusus Mars Salib Suci di beranda dashboard.
- **🔔 Push Notifikasi Web:** Pengingat otomatis H-1 pukul 19.00 WIB untuk jadwal esok hari dan tenggat tugas mendatang.

### 5. 🏷️ Pengelolaan Nomor Versi Aplikasi
Nomor versi aplikasi dikontrol langsung melalui file environment variable:
- Cukup atur `VITE_APP_VERSION="v1.0.0"` di file `frontend/.env`.
- Tampil sebagai badge versi elegan dengan status rilis stabil (`v1.0.0 • Stabil`) pada footer modal **Pengaturan** dan **Menu Navigasi**.

---

## 🏗️ Struktur Arsitektur Proyek

Proyek ini menggunakan arsitektur micro-services yang dapat dijalankan secara mandiri atau via Docker:

```
Dashboard-XB/
├── backend/
│   ├── Dockerfile                  # Multi-stage Dockerfile untuk Node.js Express API (Port 3003)
│   ├── package.json                # Dependensi backend
│   └── server.js                   # Entry point server backend mandiri
├── frontend/
│   ├── Dockerfile                  # Multi-stage Dockerfile untuk build React (Vite) & Nginx
│   ├── nginx.conf                  # Konfigurasi reverse proxy Nginx SPA & dynamic proxy ke backend
│   ├── package.json                # Dependensi frontend (React, Tailwind CSS, Lucide, Framer Motion)
│   ├── vite.config.ts              # Konfigurasi build Vite & PWA Service Worker
│   ├── .env                        # Konfigurasi frontend (VITE_APP_VERSION, dll.)
│   └── src/
│       ├── components/             # Komponen UI (Modal, Header, Kalender, Card Jadwal)
│       ├── constants/              # Data fallback & konstanta (demoData, studentsData, songSchedule, kasDemoData)
│       ├── utils/                  # Utilitas (version, csvParser, icalParser, dateUtils, audioEffects)
│       └── App.tsx                 # Root komponen dashboard utama
├── docker-bake.hcl             # Konfigurasi Docker Buildx Bake (build paralel multi-target)
├── docker-compose.yml              # Konfigurasi Docker Compose utama (Git context)
├── docker-compose.local.yml        # Konfigurasi Docker Compose untuk build lokal (Local context)
├── server.ts                       # Server Express full-stack lokal (dev server & production SSR)
├── .env.example                    # Template environment variables
└── package.json                    # Root package configuration
```

---

## 🚀 Panduan Menjalankan Proyek

### Opsi A: Menjalankan Langsung dengan Node.js (Development)

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Dev Server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

### Opsi B: Menjalankan dengan Docker Compose (Produksi)

Tersedia dua opsi konfigurasi Docker Compose:

#### 1. Menggunakan Konfigurasi Lokal (`docker-compose.local.yml`)
Gunakan opsi ini jika Anda ingin melakukan build langsung dari source code di folder lokal:
```bash
docker compose -f docker-compose.local.yml up -d --build
```
- **Frontend Dashboard:** [http://localhost:8202](http://localhost:8202)
- **Backend API & Health Check:** [http://localhost:3003/api/health](http://localhost:3003/api/health)

#### 2. Menggunakan Konfigurasi Remote Git (`docker-compose.yml`)
Gunakan opsi ini untuk deploy server yang mengambil kode langsung dari repository GitHub:
```bash
docker compose up -d --build
```
- **Frontend Dashboard:** [http://localhost:8101](http://localhost:8101)
- **Backend API & Health Check:** [http://localhost:3003/api/health](http://localhost:3003/api/health)

#### Menghentikan atau Me-restart Kontainer:
```bash
docker compose down
docker compose up -d --build --no-cache
```

---

### Opsi C: Build Cepat Paralel dengan Docker Buildx Bake (`docker-bake.hcl`)

Docker Buildx Bake mengorkestrasi kompilasi image frontend dan backend secara simultan (paralel murni) dengan arsitektur `linux/amd64` tanpa mengubah file `docker-compose.yml`.

1. **Build Semua Image Secara Simultan (Paralel):**
   ```bash
   docker buildx bake
   ```

2. **Build dengan Tag Versi Khusus:**
   ```bash
   TAG=v1.0.0 docker buildx bake
   ```

3. **Build Target Tertentu Saja:**
   ```bash
   docker buildx bake frontend   # Hanya build frontend
   docker buildx bake backend    # Hanya build backend
   ```

4. **Jalankan Kontainer Setelah Image Selesai di-Bake:**
   ```bash
   docker compose up -d
   ```

---

## ⚙️ Konfigurasi Environment Variables

Salin `.env.example` ke `.env` untuk mengatur konfigurasi server:

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `PORT` | Port backend server Node.js | `3003` |
| `NODE_ENV` | Mode lingkungan Node.js | `production` |
| `APP_URL` | URL publik dashboard | `https://x-b.abipraya.id/` |
| `ADMIN_API_KEY` | Kunci otorisasi pengiriman push notifikasi manual | `your-secret-token` |
| `CALENDAR_FEED_PELAJARAN` | URL iCal rahasia Google Calendar Jadwal Pelajaran | `https://calendar.google.com/calendar/ical/...` |
| `CALENDAR_FEED_BIRTHDAY` | URL iCal rahasia Google Calendar Ulang Tahun Siswa | `https://calendar.google.com/calendar/ical/...` |
| `VAPID_PUBLIC_KEY` | Public key untuk Web Push Notifications | *(Auto-generated jika kosong)* |
| `VAPID_PRIVATE_KEY` | Private key untuk Web Push Notifications | *(Auto-generated jika kosong)* |
| `VITE_APP_VERSION` | Nomor versi dashboard (diatur di `frontend/.env`) | `v1.0.0` |

---

## 📱 Progressive Web App (PWA) & Offline Mode

- Aplikasi memenuhi standar **PWA installable** di Chrome, Safari (iOS Add to Home Screen), Firefox, Edge, dan Android.
- Dilengkapi **Service Worker Workbox** yang menyimpan cache antarmuka dan aset font secara offline.
- Indikator status jaringan otomatis muncul di pojok kiri bawah saat perangkat offline.
