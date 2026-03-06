// e:\NEW\components\AvatarUploader.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2, Eye, Upload, X } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
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
    setShowMenu(false);
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

  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (loading) return;

      if (isEditable) {
          setShowMenu(!showMenu);
      } else if (preview) {
          setShowLightbox(true);
      }
  };

  return (
    <div className="relative group shrink-0 z-50">
      <div 
        onClick={handleClick}
        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-md ring-4 ring-white/30 shadow-2xl flex items-center justify-center overflow-hidden relative cursor-pointer`}
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

      {/* Menu Options */}
      {showMenu && (
        <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-40 min-w-[160px] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                {preview && (
                    <button 
                        onClick={() => { setShowLightbox(true); setShowMenu(false); }} 
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors w-full text-left"
                    >
                        <Eye className="w-4 h-4" /> Xem ảnh
                    </button>
                )}
                <button 
                    onClick={() => { inputRef.current?.click(); setShowMenu(false); }} 
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors w-full text-left"
                >
                    <Upload className="w-4 h-4" /> Tải ảnh lên
                </button>
            </div>
        </>
      )}

      {/* Lightbox */}
      {showLightbox && preview && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
                src={preview} 
                alt="Avatar Full" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

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
