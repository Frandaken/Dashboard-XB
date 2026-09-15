# Dashboard Jadwal Kelas XB

Dashboard visual layar penuh berbasis web untuk ruang kelas XB. Menampilkan jadwal pelajaran, penugasan otomatis dari deskripsi Google Calendar (iCal), petugas MBG, petugas piket kebersihan, petugas doa dan bacaan Injil (Google Sheets CSV), serta kalender interaktif.

Repository GitHub: [https://github.com/Frandaken/Dashboard-XB](https://github.com/Frandaken/Dashboard-XB)

---

## 🐳 Menjalankan dengan Docker & Nginx

Aplikasi ini telah dilengkapi konfigurasi **Multi-stage Docker** dan **Nginx** mandiri yang menyajikan frontend SPA sekaligus bertindak sebagai reverse-proxy aman untuk API Google Sheets dan Calendar (menghindari error CORS dan HTTP 401).

### 1. Build Langsung dari GitHub Repo

Anda dapat langsung melakukan build tanpa perlu meng-clone repo terlebih dahulu:

```bash
docker build -t dashboard-xb https://github.com/Frandaken/Dashboard-XB.git
```

Jalankan kontainer:
```bash
docker run -d --name dashboard-xb -p 80:80 --restart unless-stopped dashboard-xb
```

Akses dashboard di browser melalui `http://localhost`.

---

### 2. Menggunakan Docker Compose

Jika telah meng-clone repository ini secara lokal:

```bash
git clone https://github.com/Frandaken/Dashboard-XB.git
cd Dashboard-XB
docker compose up -d --build
```

Aplikasi akan berjalan di port `8080` (dapat disesuaikan di `docker-compose.yml`).

---

### 3. Struktur Konfigurasi Nginx (`nginx.conf`)

- **SPA Routing**: Mengalihkan seluruh rute ke `/index.html`.
- **Gzip & Caching**: Kompresi otomatis dan cache 1 tahun untuk asset `/assets/`.
- **Proxy Endpoints**:
  - `/api/health`: Healthcheck status kontainer.
  - `/api/calendar/pelajaran`: Reverse-proxy feed iCal jadwal pelajaran.
  - `/api/calendar/birthday`: Reverse-proxy feed iCal ulang tahun.
  - `/api/sheets/doa`: Reverse-proxy CSV Google Sheets petugas doa.
  - `/api/sheets/mbg`: Reverse-proxy CSV Google Sheets menu MBG.
  - `/api/sheets/piket`: Reverse-proxy CSV Google Sheets piket kebersihan.
