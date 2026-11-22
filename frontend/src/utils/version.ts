/**
 * Konfigurasi Nomor Versi Aplikasi Dashboard Kelas XB
 *
 * Prioritas pembacaan versi:
 * 1. Runtime env (`VITE_APP_VERSION` dari `.env` Docker Compose / server via `/env-config.js`)
 * 2. Build-time env (`VITE_APP_VERSION` dari `frontend/.env` atau build-arg)
 * 3. Fallback default `'v1.0.0'`
 */

declare global {
  interface Window {
    __APP_ENV__?: {
      VITE_APP_VERSION?: string;
    };
  }
}

const normalizeVersion = (raw?: string): string => {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
};

const runtimeVersion =
  typeof window !== 'undefined' ? normalizeVersion(window.__APP_ENV__?.VITE_APP_VERSION) : '';
const buildTimeVersion = normalizeVersion(import.meta.env?.VITE_APP_VERSION as string | undefined);

export const APP_VERSION: string = runtimeVersion || buildTimeVersion || 'v1.0.0';

export const APP_RELEASE_STATUS: string = 'Stabil';
