# Integrasi Bukti Pengeluaran Kas (Google Drive & Upload Web Langsung)

Rencana arsitektur dan antarmuka untuk mendukung pencatatan, pengunggahan, dan penayangan bukti transaksi/nota pengeluaran kas kelas XB melalui kombinasi tautan Google Drive dan tombol unggah langsung dari web dashboard.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan preferensi yang telah Anda konfirmasi:
> 1. **Metode Input Bukti:** Mendukung kombinasi **link Google Drive** (yang dicatat di kolom `Bukti` Google Spreadsheet) dan **unggah langsung dari web** (upload file foto nota/struk dari ponsel atau laptop).
> 2. **Tampilan di Dashboard:** Tombol **"Lihat Bukti"** pada setiap kartu pengeluaran yang membuka popup modal pratinjau foto/nota beresolusi penuh, dilengkapi fitur zoom, rotasi, unduh, dan tautan ke file asli.

- **Keputusan 1 (Dukungan Link Google Drive Otomatis):** Dashboard secara cerdas mengonversi link Google Drive (`/view`, `/file/d/...`) menjadi tautan gambar langsung (*thumbnail/direct view*) agar dapat di-render tanpa meminta login akun Google pengunjung.
- **Keputusan 2 (Penyimpanan Upload Lokal Server):** File yang diunggah langsung lewat web akan disimpan pada direktori `/backend/uploads/` dengan nama unik terenkripsi dan disajikan via rute `/api/uploads/:filename`, serta dihubungkan ke `id` pengeluaran.
- **Keputusan 3 (Panduan Praktis di UI):** Menyediakan banner panduan singkat bagi bendahara kelas tentang cara menempelkan link Google Drive di spreadsheet agar data selalu tersinkronisasi dua arah.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun:**
  - Komponen **Modal Pratinjau Bukti (Receipt Lightbox Modal)** untuk melihat foto struk/nota/faktur pengeluaran kas kelas XB secara jernih, baik di desktop maupun perangkat mobile.
  - Komponen **Dialog Unggah Bukti (Upload Receipt Dialog)** yang memungkinkan bendahara/siswa memilih file gambar (PNG, JPG, WEBP) atau PDF dari perangkat mereka, atau menempelkan tautan Google Drive / Cloud URL.
  - Endpoint backend Express `/api/kas/upload-bukti` untuk memproses dan menyimpan file bukti ke direktori server secara persisten.
  - Tombol aksi kontekstual pada setiap kartu transaksi di tab **Pengeluaran Kelas** (`KasMuridModal`): tombol **"Lihat Bukti"** (jika bukti sudah ada) dan tombol **"Unggah / Ganti Bukti"**.

- **Target Pengguna:**
  - Bendahara kelas XB, wali kelas, murid, dan orang tua murid yang ingin memverifikasi transparansi pembelanjaan operasional kelas secara nyata dan akuntabel.

- **Nilai Tambah Utama:**
  - Menghilangkan keraguan atas laporan keuangan dengan verifikasi visual nota fisik langsung dari dashboard tanpa harus membuka lembar spreadsheet secara manual.

---

## 2. User Experience & Visual Design

### A. Alur Pengguna (User Flows)
1. **Melihat Bukti Transaksi:**
   - Pengguna membuka **Buku Kas Murid** -> Tab **Pengeluaran Kelas**.
   - Pada kartu pengeluaran yang memiliki bukti (dari spreadsheet kolom `Bukti` atau upload lokal), terdapat tombol badge hijau `Lihat Bukti Nota`.
   - Menekan tombol ini memunculkan **Modal Lightbox Pratinjau Bukti** dengan latar belakang gelap blur, foto nota beresolusi tinggi, rincian transaksi (nama barang, nominal, tanggal), tombol zoom, tombol unduh, dan tombol buka link asli.
2. **Mengunggah Bukti Baru dari Web:**
   - Pada kartu pengeluaran, pengguna mengklik tombol `Unggah Bukti`.
   - Muncul dialog unggah dengan 2 opsi praktis:
     - *Tab 1: Pilih File dari HP/Laptop* (drag-and-drop atau browse gambar struk).
     - *Tab 2: Tempelkan Link Google Drive* (dengan petunjuk singkat setelan izin publik).
   - Setelah konfirmasi, gambar langsung tersimpan dan kartu pengeluaran terbarukan secara instan dengan indikator status bukti terverifikasi.

### B. Visual Identity & Komponen UI
- **Desain Kartu Transaksi:** Menggunakan pola border 1px `border-stone-200/80 dark:border-stone-800/80`, tipografi Fraunces untuk angka nominal Rupiah tabular (`font-editorial font-bold tabular-nums`), dan badge status yang bersih.
- **Receipt Lightbox Modal:** 
  - Backdrop kaca `rgba(0, 0, 0, 0.85)` dengan `backdrop-filter: blur(12px)`.
  - Area gambar responsif dengan kemampuan pinch-to-zoom di ponsel atau scroll-zoom di desktop.
  - Header yang menampilkan judul barang belanjaan, tanggal, dan nominal yang sesuai.
- **Aksesibilitas & Kontras:** Tombol aksi dilengkapi label ARIA yang jelas, navigasi keyboard (tombol Escape untuk menutup popup), dan target sentuh minimal 44px di layar sentuh ponsel.

---

## 3. Key Product Decisions & Trade-Offs

- **Penanganan Link Google Drive:**
  - *Keputusan:* Menggunakan parser khusus `getGoogleDriveDirectUrl(url)` yang mendeteksi ID file dari URL standar Google Drive (`drive.google.com/file/d/[ID]/view` atau `id=[ID]`) dan mengubahnya menjadi format URL preview yang dapat dimuat tag `<img>` browser.
  - *Alasan:* Google Drive sering memblokir pemuatan `<iframe>` jika izin file privat, sehingga penyediaan converter preview + tombol fallback "Buka di Google Drive" memastikan bukti tidak pernah gagal dibuka.
- **Penyimpanan Upload di Server Backend:**
  - *Keputusan:* Menggunakan API upload berbasis buffer/base64 atau `express.raw/json` yang aman, disimpan ke direktori `/backend/uploads/` yang dipetakan sebagai aset publik statis `/uploads/*`.
  - *Alasan:* Tidak membutuhkan akun pihak ketiga berbayar dan langsung bekerja secara mandiri di environment aplikasi.

- **Keputusan 4 (Docker Volume Passthrough):** Sesuai permintaan pengguna ("apakah bisa diubah jadi passtrough ke docker container volume?"), direktori penyimpanan file diatur ke volume passthrough `./data:/app/data` (dengan folder `./data/uploads:/app/data/uploads` dan file pemetaan `./data/bukti-mapping.json`), sehingga seluruh file bukti struk yang diunggah tetap tersimpan aman di host machine dan persisten meski container di-restart atau di-rebuild.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Spreadsheet                       │
│  Sheet "Pengeluaran" -> Kolom G: [Bukti / Link Drive URL]    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Fetch CSV via /api/sheets/pengeluaran
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Docker Container / Server (server.ts)            │
│  ├─ GET  /api/sheets/pengeluaran (Proxy Sheet)              │
│  ├─ POST /api/kas/upload-bukti (Simpan nota ke volume)      │
│  ├─ GET  /api/kas/bukti-mapping (Ambil peta bukti)          │
│  └─ GET  /api/uploads/:filename (Sajikan file nota)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Docker Volume Passthrough:
                               │ ./data:/app/data & ./data/uploads:/app/data/uploads
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Frontend React Application                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ KasMuridModal (Tab: Pengeluaran & Pendapatan Kelas)   │  │
│  │ - Kartu Transaksi dengan Tombol [Lihat Bukti]         │  │
│  │ - Tombol [Unggah / Ganti Bukti]                       │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│           ┌──────────────────┴──────────────────┐           │
│           ▼                                     ▼           │
│  ┌────────────────────────┐         ┌────────────────────┐  │
│  │ ReceiptLightboxModal   │         │ UploadReceiptModal │  │
│  │ - Preview Foto Nota    │         │ - File Uploader    │  │
│  │ - Zoom / Putar / Unduh │         │ - Input Link Drive │  │
│  │ - Google Drive Auto-ID │         │ - Docker Volume OK │  │
│  └────────────────────────┘         └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File & Volume Status:
1. `docker-compose.yml` & `docker-compose.local.yml`:
   - Ditambahkan volume passthrough `./data:/app/data`
   - Dikonfigurasi environment `DATA_DIR=/app/data` dan `UPLOADS_DIR=/app/data/uploads`
2. `server.ts` & `backend/server.js`:
   - Endpoint `/api/kas/upload-bukti` & `/api/kas/bukti-mapping`
   - Static route `/api/uploads` & `/uploads`
3. `frontend/src/utils/receiptUtils.ts`:
   - Parser ID Google Drive (`/thumbnail?id=...&sz=w1600`) dan deteksi PDF/gambar
4. `frontend/src/components/ReceiptLightboxModal.tsx`:
   - Lightbox modal resolusi tinggi dengan zoom (+/-), rotasi 90°, unduh, dan buka link
5. `frontend/src/components/UploadReceiptModal.tsx`:
   - Dialog unggah file kamera/galeri dan link Google Drive dengan pratinjau langsung
6. `frontend/src/components/KasMuridModal.tsx`:
   - Integrasi tombol "Lihat Bukti" dan "Unggah Bukti" pada tab Pengeluaran dan Pendapatan

---
*Status: Selesai dan terverifikasi berhasil dikompilasi tanpa error.*
