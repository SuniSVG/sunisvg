// e:\NEW\app\articles\submit\page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
    ArrowLeft, 
    Send, 
    PenLine, 
    Info, 
    Image as ImageIcon, 
    FileText, 
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

export default function SubmitArticlePage() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        category: 'Chia sẻ kinh nghiệm',
        description: '',
        content: '',
        thumbnailUrl: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            // Optional: Redirect if strict auth is needed immediately
            // router.push('/login');
        }
    }, [currentUser, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để đăng bài viết.', 'info');
            router.push('/login');
            return;
        }

        if (!formData.title.trim() || !formData.content.trim()) {
            addToast('Tiêu đề và nội dung không được để trống.', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In a real app, you would call a service here, e.g.:
            // await createArticle(formData);

            addToast('Bài viết đã được gửi duyệt thành công!', 'success');
            router.push('/articles');
        } catch (error) {
            console.error(error);
            addToast('Có lỗi xảy ra khi đăng bài.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/articles" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại Thư viện
                </Link>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                                <PenLine className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Đăng bài viết mới</h1>
                                <p className="text-green-100 mt-2 text-sm md:text-base font-medium">Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng SuniSVG</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                        {/* Main Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                    Tiêu đề bài viết <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Nhập tiêu đề bài viết..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Danh mục</label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none bg-white appearance-none font-medium"
                                    >
                                        <option value="Chia sẻ kinh nghiệm">Chia sẻ kinh nghiệm</option>
                                        <option value="Tài liệu học tập">Tài liệu học tập</option>
                                        <option value="Góc hỏi đáp">Góc hỏi đáp</option>
                                        <option value="Tin tức giáo dục">Tin tức giáo dục</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Mô tả ngắn</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Giới thiệu ngắn gọn về nội dung bài viết (hiển thị ở danh sách)..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-sm"
                            />
                        </div>

                        {/* Thumbnail */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                                Link ảnh bìa (Thumbnail URL)
                            </label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        name="thumbnailUrl"
                                        value={formData.thumbnailUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-sm font-mono text-gray-600"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5 ml-1">Dán đường dẫn hình ảnh từ Google Drive, Imgur, v.v.</p>
                                </div>
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0 relative group">
                                    {formData.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={formData.thumbnailUrl} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    Nội dung bài viết <span className="text-red-500">*</span>
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline transition-colors"
                                >
                                    {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
                                </button>
                            </div>
                            
                            {previewMode ? (
                                <div className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 min-h-[300px] prose prose-sm max-w-none">
                                    {formData.content ? (
                                        <div className="whitespace-pre-wrap">{formData.content}</div>
                                    ) : (
                                        <p className="text-gray-400 italic">Chưa có nội dung...</p>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={15}
                                    placeholder="Viết nội dung bài viết của bạn ở đây..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none resize-y text-sm leading-relaxed"
                                    required
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex items-center gap-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Đăng bài viết
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Guidelines */}
                <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                    <div className="flex-shrink-0">
                        <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-2">Quy định đăng bài</h4>
                        <ul className="text-sm text-blue-800 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                Nội dung phải phù hợp với thuần phong mỹ tục và pháp luật.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                Không đăng tải thông tin sai lệch, chưa được kiểm chứng.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                Tôn trọng bản quyền tác giả, ghi rõ nguồn nếu trích dẫn.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                Bài viết sẽ được kiểm duyệt trước khi hiển thị công khai.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
