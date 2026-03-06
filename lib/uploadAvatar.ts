const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL as string;

/**
 * Compress ảnh trước khi upload
 * - Resize về kích thước tối đa maxSize (giữ tỉ lệ)
 * - Giảm chất lượng JPEG xuống quality (0–1)
 */
export function compressImage(
  file: File,
  maxSize: number = 400,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
}

/**
 * Upload avatar lên Google Drive qua GAS, ghi link vào Sheet Accounts
 * @param email      - Email của user (dùng để tìm đúng dòng trong Sheet)
 * @param imageFile  - File ảnh từ input[type="file"]
 * @returns          - URL avatar mới (dạng https://drive.google.com/uc?id=...)
 */
export async function uploadAvatar(
  email: string,
  imageFile: File
): Promise<string> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Thiếu NEXT_PUBLIC_APPS_SCRIPT_URL trong .env.local');
  }

  // 1. Compress ảnh (resize 400px, quality 80%)
  const compressed = await compressImage(imageFile, 400, 0.8);
  const base64 = compressed.split(',')[1];

  // 2. Gửi lên GAS
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action:      'uploadAvatar',
      email,
      imageBase64: base64,
      mimeType:    'image/jpeg',
      fileName:    `${email}_avatar.jpg`,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  const result = await res.json();

  if (result.status !== 'success') {
    throw new Error(result.message ?? 'Upload thất bại');
  }

  return result.avatarUrl as string;
}