# Rencana Pembersihan Applet, Eliminasi Dead Code, dan Optimasi Bundle JavaScript

Rencana komprehensif untuk membersihkan file dan dependensi yang tidak terpakai, menghapus cache build usang pada direktori `dist`, serta memperkecil ukuran bundle JavaScript utama melalui code-splitting dan *vendor chunking*.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi yang Anda pilih:
> 1. **Cakupan Pembersihan**: Seluruhnya mencakup penghapusan dead code file komponen, pencabutan dependensi `package.json` yang tidak terpakai, dan pembersihan tumpukan file `dist` lama.
> 2. **Strategi Code-Splitting**: Memindahkan seluruh modal yang masih diimpor statis (`GlobalSearchModal`, `NotificationModal`, `ReceiptLightboxModal`, `HamburgerMenuModal`) ke dalam `React.lazy` dinamis, serta menyelaraskan pembagian *vendor chunks* di Vite.

- **Keputusan Terkonfirmasi 1**: Menghapus file komponen usang `IceBreakingPanel.tsx` dan mencabut pustaka `motion` dari `package.json`.
- **Keputusan Terkonfirmasi 2**: Menjadikan seluruh modal berbasis *on-demand lazy loading* sehingga initial bundle (`index.js`) lebih ringan dan cepat dimuat.
- **Keputusan Terkonfirmasi 3**: Menambahkan `emptyOutDir: true` pada `frontend/vite.config.ts` untuk membersihkan penumpukan file hash lama di `dist/assets` (yang saat ini mencapai ~5.0 MB).

---

## 1. Overview & Core Concept

- **Tujuan Utama**: Meningkatkan efisiensi penyimpanan, kecepatan muat awal (*First Contentful Paint* & *Time to Interactive*), dan kebersihan arsitektur kode kelas XB.
- **Kondisi Saat Ini**:
  - Terdapat file komponen yatim piatu (`frontend/src/components/IceBreakingPanel.tsx`) yang sudah tidak lagi diimpor karena digantikan oleh modal jadwal ice breaking.
  - Terdapat dependensi tak terpakai di `package.json` yaitu `"motion": "^12.23.24"`.
  - Konfigurasi `manualChunks` di Vite masih menyisakan referensi library yang sudah tidak diinstal (`canvas-confetti`, `papaparse`).
  - Folder `dist/assets` menumpuk 40+ berkas build usang dari kompilasi sebelumnya karena `emptyOutDir` tidak aktif saat output mengarah ke `../dist`.
  - Beberapa modal (`GlobalSearchModal`, `NotificationModal`, `ReceiptLightboxModal`, `HamburgerMenuModal`) masih diimpor secara statis ke dalam bundle utama (`index.js` ~243 KB).
- **Target Hasil**:
  - Ukuran initial JS bundle menyusut signifikan (~30-40% lebih ramping).
  - Folder `dist` bersih dari sampah hash lama tanpa merusak fungsionalitas apa pun.
  - Nol error TypeScript (`tsc --noEmit`) dan build terverifikasi 100%.

---

## 2. User Experience & Visual Design

Pembersihan kode dan optimasi bundle ini berfokus pada performa teknis di balik layar (*under-the-hood optimization*) dengan prinsip zero visual regression:

- **Key User Flows**:
  - **Buka Aplikasi Awal**: Pengguna memuat halaman dashboard secara instan karena kode modal tidak dimuat di bundle awal.
  - **Membuka Modal (Global Search, Notifikasi, Bukti Kas, Menu)**: Saat pengguna menekan shortcut pencarian (`Ctrl+K` atau bar pencarian), tombol lonceng notifikasi, atau menu, browser memuat chunk modal terkait secara instan dengan transisi halus tanpa flicker.
  - **Perilaku UI & Interaksi**: Semua fungsionalitas yang ada (pencarian siswa/tugas/mapel, jadwal kas murid, roda putar, pembagian kelompok, filter horizontal, dan dark mode) tetap berjalan 100% normal dan responsif.
- **Keamanan & Kompatibilitas**: PWA service worker dan caching tetap terintegrasi secara utuh.

---

## 3. Key Product Decisions & Trade-Offs

- **Pembersihan Dead Code File**:
  - *Keputusan*: Menghapus `frontend/src/components/IceBreakingPanel.tsx`.
  - *Alasan*: Komponen ini telah digantikan oleh `IceBreakingScheduleModal.tsx` dan tidak lagi memiliki referensi import di file mana pun.
- **Pembersihan Dependensi `motion`**:
  - *Keputusan*: Menghapus package `motion` dari `package.json`.
  - *Alasan*: Seluruh animasi di dashboard menggunakan utilitas bawaan Tailwind CSS dan CSS keyframes ringan, sehingga package `motion` (~200KB di node_modules) hanya membebani instalasi tanpa pernah dipanggil.
- **Lazy Loading Seluruh Modal (`React.lazy` + `Suspense`)**:
  - *Keputusan*: Mengubah impor `GlobalSearchModal`, `NotificationModal`, `ReceiptLightboxModal`, dan `HamburgerMenuModal` menjadi lazy loading dinamis.
  - *Alasan*: Komponen modal hanya dibutuhkan saat dipicu aksi pengguna, sehingga tidak perlu diikutsertakan dalam initial payload halaman depan.
- **Konfigurasi `emptyOutDir` & Pembersihan `dist/assets`**:
  - *Keputusan*: Menyetel `emptyOutDir: true` di konfigurasi build Vite dan membersihkan `dist` sebelum kompilasi baru.
  - *Alasan*: Mencegah akumulasi berkas hash masa lampau yang membengkak hingga puluhan megabyte.

---

## 4. Technical Architecture & Data Strategy

### Diagram Arsitektur Pemisahan Bundle (Code-Splitting)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INITIAL LOAD BUNDLE                             │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │   vendor-react.js    │  │ vendor-lucide.js│  │   index-[hash].js │  │
│  │ (React, ReactDOM)    │  │ (Icons umum)    │  │ (Header, Blocks,  │  │
│  │                      │  │                 │  │  Store, DateUtils)│  │
│  └──────────────────────┘  └─────────────────┘  └───────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ On-Demand Lazy Import (User Trigger)
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ GlobalSearch.js  │      │ KasMuridModal.js │      │ WheelOfNames.js  │
│ (Cari siswa/mapel│      │ (Buku kas kelas &│      │ (Roda putar nama │
│  & keyboard nav) │      │  riwayat bukti)  │      │  & sound fx)     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Notification.js  │      │ DayDetailModal.js│      │ GroupGenerator.js│
│ (Push web alert) │      │ (Detail jadwal)  │      │ (Bagi kelompok)  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Rincian Rencana Eksekusi:

1. **Langkah 1: Penghapusan File Komponen Tak Terpakai**
   - Hapus `frontend/src/components/IceBreakingPanel.tsx` menggunakan tool `delete_file`.

2. **Langkah 2: Pembersihan `package.json` dan Dependensi**
   - Hapus baris `"motion": "^12.23.24"` dari `package.json`.
   - Perbarui konfigurasi `frontend/vite.config.ts`:
     - Hapus referensi manual chunk untuk pustaka yang tidak ada (`canvas-confetti`, `papaparse`).
     - Tambahkan properti `build.emptyOutDir = true`.
     - Rapikan pembagian *vendor chunks* (`vendor-react`, `vendor-ical`, `vendor-lucide`, `vendor-common`).

3. **Langkah 3: Code-Splitting Modal di `frontend/src/App.tsx`**
   - Ubah impor modal yang sebelumnya statis menjadi `React.lazy`:
     - `GlobalSearchModal`
     - `NotificationModal`
     - `ReceiptLightboxModal`
     - `HamburgerMenuModal`
   - Pastikan seluruh modal lazy tetap terbungkus `<React.Suspense fallback={null}>` yang rapi dan bebas dari error runtime.

4. **Langkah 4: Pembersihan `dist` dan Verifikasi Kompilasi**
   - Bersihkan aset usang di direktori `dist`.
   - Jalankan `npm run lint` (`tsc --noEmit`) untuk memastikan nol type errors.
   - Jalankan `compile_applet` untuk menghasilkan bundle baru yang bersih, ramping, dan terverifikasi.
