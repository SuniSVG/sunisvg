// e:\NEW\components\AvatarUploader.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar } from '@/services/googleSheetService';
import { compressImage } from '@/utils/imageCompression';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { useToast } from '@/contexts/ToastContext';

interface AvatarUploaderProps {
  email: string;
  currentAvatarUrl?: string;
  fallbackLetter: string;
  isEditable: boolean;
  onSuccess?: (newUrl: string) => void;
}

export default function AvatarUploader({
  email,
  currentAvatarUrl,
  fallbackLetter,
  isEditable,
  onSuccess,
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (currentAvatarUrl) {
      setPreview(convertGoogleDriveUrl(currentAvatarUrl));
    } else {
      setPreview(null);
    }
  }, [currentAvatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      const compressed = await compressImage(file, 400, 0.8);
      const base64 = compressed.split(',')[1];
      
      const result = await uploadAvatar(email, base64, 'image/jpeg', `${email}_avatar.jpg`);
      
      if (result.success && result.avatarUrl) {
        addToast('Cập nhật ảnh đại diện thành công', 'success');
        onSuccess?.(result.avatarUrl);
      } else {
        throw new Error(result.error || 'Lỗi không xác định');
      }
    } catch (err: any) {
      addToast('Upload thất bại: ' + err.message, 'error');
      // Revert to original if failed
      setPreview(currentAvatarUrl ? convertGoogleDriveUrl(currentAvatarUrl) : null);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
      if (isEditable && !loading) {
          inputRef.current?.click();
      }
  };

  return (
    <div className="relative group shrink-0">
      <div 
        onClick={handleClick}
        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-md ring-4 ring-white/30 shadow-2xl flex items-center justify-center overflow-hidden relative ${isEditable ? 'cursor-pointer' : ''}`}
      >
        {preview ? (
          <Image 
            src={preview} 
            alt="Avatar" 
            fill 
            className="object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-5xl font-black text-white leading-none select-none">{fallbackLetter}</span>
        )}
        
        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )}

        {/* Hover Overlay for Edit */}
        {isEditable && !loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <Camera className="w-8 h-8 text-white/90" />
            </div>
        )}
      </div>

      {isEditable && (
        <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
        />
      )}
    </div>
  );
}
