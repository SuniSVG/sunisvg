/**
 * Converts a Google Drive sharing URL to a direct image URL.
 * Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing -> https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  
  // Check if it's already a direct link or not a drive link
  if (url.includes('drive.google.com/uc?export=view')) {
    return url;
  }

  // Extract file ID from standard sharing URL
  const match = url.match(/\/file\/d\/([^\/]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Fallback for other formats or return original if no match
  return url;
}
