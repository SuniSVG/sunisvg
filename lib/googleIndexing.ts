import { google } from "googleapis";

/**
 * Gửi yêu cầu Index URL lên Google ngay lập tức.
 * Yêu cầu: Bạn cần tạo Service Account trong Google Cloud Console,
 * tải file JSON về và lưu tên là `service-account.json` ở thư mục gốc của dự án.
 * 
 * Nhớ cấp quyền Owner cho Service Account Email trong Google Search Console!
 */
export async function notifyGoogleIndex(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "service-account.json", // File này phải ở thư mục ngoài cùng (root)
      scopes: ["https://www.googleapis.com/auth/indexing"]
    });

    const client = await auth.getClient();

    const indexing = google.indexing({
      version: "v3",
      auth: client as any
    });

    const res = await indexing.urlNotifications.publish({
      requestBody: { url, type }
    });

    console.log(`[Google Indexing] Đã submit thành công URL: ${url}`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("[Google Indexing] Lỗi khi submit URL:", error);
    return { success: false, error };
  }
}