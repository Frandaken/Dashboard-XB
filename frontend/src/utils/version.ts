/**
 * Konfigurasi Nomor Versi Aplikasi Dashboard Kelas XB
 * 
 * Nilai versi ini dapat disesuaikan dengan mudah melalui environment variable:
 * VITE_APP_VERSION di file `.env` (misal: VITE_APP_VERSION=v1.0.1)
 * 
 * Jika environment variable tidak diset, akan menggunakan nilai fallback default di bawah.
 */

export const APP_VERSION: string = (import.meta.env?.VITE_APP_VERSION as string) || 'v1.0.0';

export const APP_RELEASE_STATUS: string = 'Stabil';
