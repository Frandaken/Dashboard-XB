/**
 * Utility helpers to handle receipts (bukti nota/struk) from:
 * 1. Google Drive share links (view/open/uc)
 * 2. Uploaded files stored in server (/api/uploads/...)
 * 3. Direct image URLs
 */

export interface ParsedReceiptInfo {
  type: 'drive' | 'image' | 'pdf' | 'link';
  previewUrl: string;
  originalUrl: string;
  isDrive: boolean;
  driveFileId?: string;
}

/**
 * Extracts Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/1a2B3c4D5e.../view?usp=sharing
 * - https://drive.google.com/open?id=1a2B3c4D5e...
 * - https://drive.google.com/uc?id=1a2B3c4D5e...
 * - https://docs.google.com/document/d/1a2B3c4D5e...
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Match /d/{id}
  const fileDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Match id={id}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
}

/**
 * Resolves a raw receipt string (URL, path, or Google Drive link)
 * into a renderable preview URL and high-res image source.
 */
export function parseReceiptUrl(rawUrl: string): ParsedReceiptInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Check Google Drive
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    // High-resolution Google Drive thumbnail that bypasses CORS/login in browser <img> tags
    const previewUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
    return {
      type: 'drive',
      previewUrl,
      originalUrl: trimmed,
      isDrive: true,
      driveFileId: driveId
    };
  }

  // Check if it's a PDF
  const cleanPath = trimmed.split('?')[0].toLowerCase();
  if (cleanPath.endsWith('.pdf')) {
    return {
      type: 'pdf',
      previewUrl: trimmed,
      originalUrl: trimmed,
      isDrive: false
    };
  }

  // Check common image extensions or local uploads path
  const isImg =
    /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(cleanPath) ||
    trimmed.startsWith('/api/uploads/') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('data:image/');

  if (isImg) {
    return {
      type: 'image',
      previewUrl: trimmed,
      originalUrl: trimmed,
      isDrive: false
    };
  }

  // Fallback as external link
  return {
    type: 'link',
    previewUrl: trimmed,
    originalUrl: trimmed,
    isDrive: false
  };
}
