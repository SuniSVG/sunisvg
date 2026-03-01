export function parseVNDateToDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try standard Date parsing first (handles ISO, etc.)
  const standardDate = new Date(dateString);
  if (!isNaN(standardDate.getTime())) return standardDate;

  // Handle formats like "19:07:31 9/9/2025" or "9/9/2025 19:07:31"
  const parts = dateString.trim().split(/\s+/);
  let datePart = '';
  let timePart = '00:00:00';

  parts.forEach(part => {
    if (part.includes('/')) datePart = part;
    if (part.includes(':')) timePart = part;
  });

  if (datePart) {
    const segments = datePart.split('/');
    if (segments.length === 3) {
      const [s1, s2, s3] = segments;
      // Try DD/MM/YYYY
      const d1 = new Date(`${s3}-${s2.padStart(2, '0')}-${s1.padStart(2, '0')}T${timePart}`);
      if (!isNaN(d1.getTime())) return d1;
      
      // Try MM/DD/YYYY
      const d2 = new Date(`${s3}-${s1.padStart(2, '0')}-${s2.padStart(2, '0')}T${timePart}`);
      if (!isNaN(d2.getTime())) return d2;
    }
  }
  
  return null;
}

export function timeAgo(dateString: string): string {
  const date = parseVNDateToDate(dateString);
  if (!date) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
}
