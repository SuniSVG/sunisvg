// e:\NEW\utils\imageCompression.ts

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
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
            if (width > maxSize) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
}
