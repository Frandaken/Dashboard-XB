# Implementation Plan - Pembaruan Teks Kontekstual "Jadwal" ke "Dashboard" (Selesai)

Berdasarkan preferensi dan klarifikasi yang telah disepakati:
1. **Judul Utama & Nama Aplikasi**: Diperbarui menjadi **`Dashboard Kelas XB`** (Header, `<title>`, meta description, OpenGraph, Twitter cards).
2. **Blok Mata Pelajaran**: Tetap mempertahankan istilah **`Jadwal Pelajaran`** agar tetap akurat sebagai jadwal mata pelajaran sekolah harian.
3. **Fitur Ekspor & Salin Harian**: Disesuaikan secara kontekstual menjadi **`Agenda`** (misalnya `Ekspor Agenda Mingguan`, `Salin Agenda Harian`, `Ekspor Agenda`, dsb.).
4. **Navigasi & Pengaturan**: Menyesuaikan teks deskripsi, tombol, dan tooltip terkait agar senada dan alami.

---

## Ringkasan Perubahan yang Diterapkan

### 1. Header & Identitas Aplikasi (Selesai)
- **`frontend/src/components/Header.tsx`**:
  - Judul diperbarui menjadi **`Dashboard Kelas XB`**.
  - Alt teks logo diperbarui menjadi `Logo Dashboard Kelas XB SMA Putra Nirmala`.
- **`frontend/index.html`**:
  - `<title>`, meta description, `og:title`, `og:description`, `og:image:alt`, `twitter:title`, `twitter:description`, `twitter:image:alt`, dan schema.org name disinkronkan menjadi `Dashboard Kelas XB – SMA Putra Nirmala`.

### 2. Dashboard Utama & Stepper Tanggal (Selesai)
- **`frontend/src/App.tsx`**:
  - Badge jadwal/agenda mendatang diubah menjadi `Agenda ${activeInfo.dowName} Depan`.
  - Tooltip/aria-label tombol lompat hari ini diubah menjadi `Lihat Agenda Hari Ini`.
  - Tombol stepper hari sebelumnya & berikutnya disesuaikan menjadi `Agenda Hari Sebelumnya` dan `Agenda Hari Berikutnya`.
  - Salin teks harian diperbarui menjadi `Salin Agenda Harian` / `Salin Agenda Hari Ini ke WhatsApp`.
  - Banner tanggal libur/non-efektif disesuaikan menjadi `Menampilkan agenda hari efektif sekolah terdekat: ...`.
- **`frontend/src/components/ScheduleBlocks.tsx`**:
  - Tetap dipertahankan sebagai **`Jadwal Pelajaran`** sesuai jawaban klarifikasi pengguna.

### 3. Ekspor & Pengaturan (Selesai)
- **`frontend/src/components/WeeklyExportModal.tsx`**:
  - Judul modal diubah menjadi **`Ekspor Agenda Mingguan`**.
  - Badge tanggal chat WhatsApp diubah menjadi `AGENDA KELAS XB`.
  - Tombol salin diperbarui menjadi `Salin ke WhatsApp` dan `Unduh .txt` dengan file `agenda_kelas_xb_...`.
- **`frontend/src/components/SettingsModal.tsx`**:
  - Subtitle diperbarui menjadi `Setelan notifikasi, ekspor agenda, & preferensi`.
  - Bagian ekspor diperbarui menjadi `Ekspor & Berbagi Agenda` dan `Ekspor Agenda Mingguan`.
- **`frontend/src/components/DayDetailModal.tsx`**:
  - Title tombol salin diubah menjadi `Salin Agenda Hari Ini ke WhatsApp`.
- **`frontend/src/components/NotificationModal.tsx`**:
  - Opsi notifikasi harian diperbarui menjadi `Agenda Harian Esok Hari (H-1 Pukul 19.00 WIB)`.

### 4. Verifikasi (Selesai)
- `lint_applet` (`tsc --noEmit`): Lulus tanpa kesalahan.
- `compile_applet` (Vite build): Berhasil dikompilasi dengan sukses.
- Dev server pada port 3000: Menanggapi dengan status HTTP 200 OK.
