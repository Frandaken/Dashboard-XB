# Dashboard Jadwal Kelas XB

Dashboard visual layar penuh berbasis web untuk ruang kelas XB. Menampilkan jadwal pelajaran, penugasan otomatis dari deskripsi Google Calendar (iCal), petugas MBG, petugas piket kebersihan, petugas doa dan bacaan Injil (Google Sheets CSV), serta kalender interaktif.

Repository GitHub: [https://github.com/Frandaken/Dashboard-XB](https://github.com/Frandaken/Dashboard-XB)

---

## 🐳 Struktur Multi-Kontainer Docker (Frontend & Backend)

Proyek ini telah dikonfigurasi dengan arsitektur micro-services terpisah:
- **`frontend/Dockerfile`**: Kontainer Nginx yang menyajikan SPA (Vite/React) dan me-reverse-proxy rute `/api/` ke service backend secara dinamis.
- **`backend/Dockerfile`**: Kontainer Node.js Express mandiri yang menangani fetching Google Calendar iCal & Google Sheets CSV serta caching server-side pada port 3003.

### Struktur File:
```
Dashboard-XB/
├── backend/
│   ├── Dockerfile             # Multi-stage Dockerfile untuk Node.js Express API (Port 3003)
│   └── server.js              # Entry point server backend
├── frontend/
│   ├── Dockerfile             # Multi-stage Dockerfile untuk build SPA & Nginx
│   └── nginx.conf             # Konfigurasi Nginx SPA & dynamic proxy ke http://backend:3003
├── docker-compose.yml         # Konfigurasi Docker Compose utama (Local build context)
├── .env                       # Environment variables untuk backend
├── server.ts                  # Server Express terpadu (mendukung dev server & production)
├── src/                       # Komponen & utilitas React Frontend
└── package.json
```

---

## 🚀 Menjalankan dengan Docker Compose

Jalankan perintah berikut di folder proyek:

```bash
docker compose up -d --build
```

Akses aplikasi di browser:
- **Frontend Dashboard**: [http://localhost:8202](http://localhost:8202)
- **Backend API & Health**: [http://localhost:3003/api/health](http://localhost:3003/api/health)

Jika sebelumnya mengalami error `host not found in upstream "backend"`, pastikan container lama dimatikan terlebih dahulu:
```bash
docker compose down
docker compose up -d --build
```
