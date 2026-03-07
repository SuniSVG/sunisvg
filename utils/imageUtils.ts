/**
 * Converts a Google Drive sharing URL to a direct image URL.
 * Uses lh3.googleusercontent.com which bypasses CORS/403 issues.
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';

  // Already converted to lh3 format — return as-is
  if (url.includes('lh3.googleusercontent.com')) {
    return url;
  }

  // Format: /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([^\/\?]+)/);
  if (fileMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Format: uc?export=view&id=FILE_ID  hoặc  uc?id=FILE_ID
  const ucMatch = url.match(/[?&]id=([^&]+)/);
  if (ucMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }

  // Format: /open?id=FILE_ID
  const openMatch = url.match(/\/open\?id=([^&]+)/);
  if (openMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }

  return url;
}