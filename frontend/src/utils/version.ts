import { useEffect, useState } from 'react';

/**
 * Konfigurasi Nomor Versi Aplikasi Dashboard Kelas XB
 *
 * Prioritas pembacaan versi:
 * 1. Runtime env (`VITE_APP_VERSION` / `APP_VERSION` dari `.env` Docker Compose via `/env-config.js`)
 * 2. Runtime env dari backend (`GET /api/version`, fallback bila env hanya tersedia di container backend)
 * 3. Build-time env (`VITE_APP_VERSION` dari build-arg atau `frontend/.env`)
 * 4. Fallback default `'v1.0.0'`
 */

declare global {
  interface Window {
    __APP_ENV__?: {
      VITE_APP_VERSION?: string;
      APP_VERSION?: string;
    };
  }
}

const normalizeVersion = (raw?: string): string => {
  if (!raw) return '';
  return raw.replace(/\r/g, '').trim().replace(/^["']|["']$/g, '').trim();
};

const readWindowRuntimeVersion = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    normalizeVersion(window.__APP_ENV__?.VITE_APP_VERSION) ||
    normalizeVersion(window.__APP_ENV__?.APP_VERSION)
  );
};

const buildTimeVersion = normalizeVersion(import.meta.env?.VITE_APP_VERSION as string | undefined);

export const getResolvedAppVersion = (): string =>
  readWindowRuntimeVersion() || buildTimeVersion || 'v1.0.0';

export const APP_VERSION: string = getResolvedAppVersion();

export const APP_RELEASE_STATUS: string = 'Stabil';

let backendVersionPromise: Promise<string> | null = null;
let backendResolvedVersion = '';

const fetchBackendVersionOnce = (): Promise<string> => {
  if (backendResolvedVersion) return Promise.resolve(backendResolvedVersion);
  if (backendVersionPromise) return backendVersionPromise;

  backendVersionPromise = fetch('/api/version', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) return '';
      const data = await res.json();
      const ver = normalizeVersion(typeof data?.version === 'string' ? data.version : '');
      if (ver) {
        backendResolvedVersion = ver;
        if (typeof window !== 'undefined') {
          window.__APP_ENV__ = {
            ...(window.__APP_ENV__ || {}),
            VITE_APP_VERSION: ver,
            APP_VERSION: ver,
          };
        }
      }
      return ver;
    })
    .catch(() => '');

  return backendVersionPromise;
};

export const useAppVersion = (): string => {
  const [version, setVersion] = useState<string>(() => getResolvedAppVersion());

  useEffect(() => {
    const windowVer = readWindowRuntimeVersion();
    if (windowVer) {
      if (windowVer !== version) setVersion(windowVer);
      return;
    }

    let cancelled = false;
    fetchBackendVersionOnce().then((backendVer) => {
      if (!cancelled && backendVer) {
        setVersion(backendVer);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [version]);

  return version;
};
