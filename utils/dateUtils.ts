export function parseVNDateToDate(dateString: string): Date | null {
  if (!dateString) return null;
  const str = dateString.trim();
  
  // 1. Ưu tiên xử lý định dạng ISO (cho các bài viết mới hoặc optimistic update)
  if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Xử lý định dạng "dd/MM/yyyy HH:mm:ss" (Format từ Google Apps Script của bạn)
  // Thêm offset +07:00 để đảm bảo đúng giờ Việt Nam
  const match1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[\s,]+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (match1) {
    const [_, day, month, year, hour, minute, second] = match1;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+07:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Xử lý định dạng "HH:mm:ss dd/MM/yyyy" (Biến thể khác)
  const match2 = str.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})[\s,]+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match2) {
    const [_, hour, minute, second, day, month, year] = match2;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+07:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }
  
  // 4. Fallback cho các định dạng chuẩn khác
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function timeAgo(dateString: string): string {
  if (!dateString) return 'Vừa xong';
  const date = parseVNDateToDate(dateString);
  if (!date) return 'Vừa xong';

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

// Google Apps Script - Server side (Code này chỉ chạy trên Google Apps Script, không chạy trên Next.js)
// Bạn hãy copy hàm này vào file .gs trên script.google.com
// function getNowVN() {
//   return Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
// }
