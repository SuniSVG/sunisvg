'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
// import { uploadAvatar } from '@/lib/uploadAvatar';

// TODO: Implement uploadAvatar function in @/lib/uploadAvatar
const uploadAvatar = async (email: string, file: File): Promise<string> => {
  throw new Error('uploadAvatar not implemented');
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AvatarUploaderProps {
  /** Email dùng để upload lên đúng dòng trong Sheet */
  email: string;
  /**
   * URL avatar hiện tại — nên truyền vào URL đã được convert
   * (ví dụ qua convertGoogleDriveUrl) để tránh convert 2 lần.
   */
  currentAvatarUrl?: string;
  /** Chữ cái fallback khi không có ảnh (ví dụ: 'A') */
  fallbackLetter: string;
  /** Chỉ hiện nút chỉnh sửa khi là profile của chính mình */
  isEditable?: boolean;
  /** Callback trả về URL mới sau khi upload thành công */
  onSuccess?: (newUrl: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AvatarUploader({
  email,
  currentAvatarUrl,
  fallbackLetter,
  isEditable = false,
  onSuccess,
}: AvatarUploaderProps) {
  const [preview, setPreview]   = useState<string | null>(currentAvatarUrl ?? null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview khi prop thay đổi từ bên ngoài (ví dụ sau refreshCurrentUser)
  useEffect(() => {
    setPreview(currentAvatarUrl ?? null);
    setImgError(false);
  }, [currentAvatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Hiển thị preview local ngay lập tức
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setImgError(false);
    setError(null);
    setLoading(true);

    try {
      const newUrl = await uploadAvatar(email, file);
      // Trả URL gốc (chưa convert) về onSuccess để lưu vào state/context
      onSuccess?.(newUrl);
      // Preview giữ nguyên blob URL cho đến khi parent re-render với URL mới
    } catch (err) {
      setError('Upload thất bại: ' + (err as Error).message);
      // Rollback về ảnh cũ
      setPreview(currentAvatarUrl ?? null);
    } finally {
      setLoading(false);
      // Reset input để có thể chọn lại cùng file
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative shrink-0">
      {/* ── Avatar circle ── */}
      <div
        className={`
          relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden
          ring-4 ring-white/30 shadow-2xl
          bg-gradient-to-br from-emerald-400 to-green-600
          flex items-center justify-center
          ${isEditable ? 'cursor-pointer group' : ''}
        `}
        onClick={() => isEditable && inputRef.current?.click()}
      >
        {/* Ảnh avatar */}
        {preview && !imgError ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            unoptimized={preview.startsWith('blob:')} // blob URL không cần optimize
          />
        ) : (
          <span className="text-3xl sm:text-4xl font-black text-white select-none">
            {fallbackLetter}
          </span>
        )}

        {/* Overlay hover — chỉ hiện khi isEditable */}
        {isEditable && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white text-[10px] font-bold">Đổi ảnh</span>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Nút camera nhỏ góc dưới phải — chỉ hiện khi isEditable ── */}
      {isEditable && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="
            absolute bottom-0 right-0
            w-8 h-8 rounded-full
            bg-white shadow-lg border-2 border-white/80
            flex items-center justify-center
            hover:bg-emerald-50 hover:scale-110
            active:scale-95
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="Thay đổi avatar"
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Error tooltip ── */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
          bg-red-500 text-white text-[10px] font-bold
          px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap
          after:content-[''] after:absolute after:bottom-full after:left-1/2
          after:-translate-x-1/2 after:border-4 after:border-transparent
          after:border-b-red-500"
        >
          {error}
        </div>
      )}
    </div>
  );
}