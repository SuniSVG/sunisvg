'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addForumPost, uploadForumImage } from '@/services/googleSheetService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

const FORUM_CHANNELS = [
    'Thảo luận chung', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 
    'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Hỏi đáp', 
    'Những câu chuyện ngoài lề', 'Phòng tranh luận', 'Phòng thú tội'
];

export default function CreatePostPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [channel, setChannel] = useState(FORUM_CHANNELS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Image upload state
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const tempPostId = useMemo(() => crypto.randomUUID(), []);

    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = 5 - uploadedImages.length;
        const toUpload = files.slice(0, remaining);

        if (files.length > remaining) {
            addToast(`Chỉ upload thêm được ${remaining} ảnh nữa.`, 'info');
        }

        setIsUploading(true);
        try {
            for (const file of toUpload) {
                const url = await uploadForumImage(file, tempPostId);
                setUploadedImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại, vui lòng thử lại.', 'error');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length === 0) return; // Paste text bình thường
        
        e.preventDefault();
        
        const remaining = 5 - uploadedImages.length;
        if (remaining <= 0) {
            addToast('Đã đạt giới hạn ảnh.', 'info');
            return;
        }

        setIsUploading(true);
        try {
            for (const item of imageItems.slice(0, remaining)) {
                const file = item.getAsFile();
                if (!file) continue;
                const url = await uploadForumImage(file, tempPostId);
                setUploadedImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để đăng bài.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const postData = {
                Title: title,
                Content: content,
                Channel: channel,
                AuthorEmail: currentUser.Email,
                AuthorName: currentUser['Tên tài khoản'],
                ImageURLs: uploadedImages.join(','),
            };

            const result = await addForumPost(postData);
            if (result.success) {
                addToast('Đăng bài thành công!', 'success');
                router.push('/forum');
            } else {
                addToast(result.error || 'Đăng bài thất bại.', 'error');
            }
        } catch (error) {
            addToast('Đã xảy ra lỗi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
                    <p className="text-gray-500 mt-2">Bạn cần đăng nhập để tạo bài viết mới.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo bài viết mới</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Nhập tiêu đề bài viết..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chuyên mục</label>
                        <select
                            value={channel}
                            onChange={e => setChannel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            {FORUM_CHANNELS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                            Nội dung
                            <span className="font-normal text-xs text-gray-400 flex items-center gap-1">
                                <Icon name="clipboard" className="w-3 h-3" />
                                Có thể dán ảnh trực tiếp (Ctrl+V)
                            </span>
                        </label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            onPaste={handlePaste}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[200px]"
                            placeholder="Chia sẻ suy nghĩ của bạn..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Đính kèm ảnh
                            <span className="ml-2 font-normal text-gray-400">({uploadedImages.length}/5)</span>
                        </label>

                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                                {uploadedImages.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group bg-gray-50">
                                        <Image src={convertGoogleDriveUrl(url)} alt={`Ảnh ${index + 1}`} fill className="object-cover" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110">
                                            <Icon name="x" className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {isUploading && (
                                    <div className="aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-500" />
                                    </div>
                                )}
                            </div>
                        )}

                        {uploadedImages.length < 5 && (
                            <label className={`relative flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading ? 'border-blue-300 bg-blue-50 pointer-events-none' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleImageSelect} disabled={isUploading} className="hidden" />
                                {isUploading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600" /><span className="text-sm font-medium text-blue-600">Đang tải lên...</span></> : <><Icon name="image" className="w-5 h-5 text-gray-400" /><span className="text-sm font-medium text-gray-500">Nhấn để thêm ảnh</span><span className="text-xs text-gray-400">JPG, PNG, GIF, WEBP · Tối đa 5 ảnh</span></>}
                            </label>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                        <button type="submit" disabled={isSubmitting || isUploading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg shadow-blue-200">{isSubmitting ? 'Đang đăng...' : 'Đăng bài'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}