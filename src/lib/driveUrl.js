/**
 * Converts Google Drive share/view URLs to a directly embeddable URL.
 * All other URLs are returned unchanged.
 *
 * Handles these formats:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=...
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 */
export function normalizeDriveUrl(url) {
  if (!url) return url;
  if (!url.includes('drive.google.com')) return url;

  // Extract file ID
  let fileId = null;

  // /file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) fileId = fileMatch[1];

  // ?id=FILE_ID or &id=FILE_ID
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) fileId = idMatch[1];
  }

  if (!fileId) return url; // Can't parse — return as-is

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}