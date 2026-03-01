'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { createClass } from '@/services/googleSheetService';

type ViewState = 'form' | 'success';

interface SuccessData {
    classId: string;
    joinCode: string;
    className: string;
    subject: string;
}

export default function CreateClassPage() {
    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const router = useRouter();
    
    const [viewState, setViewState] = useState<ViewState>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        className: '',
        subject: '',
        description: ''
    });
    const [successData, setSuccessData] = useState<SuccessData | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            addToast('Bạn cần đăng nhập để tạo lớp học.', 'info');
            router.push('/login');
            return;
        }
        if (!formData.className.trim() || !formData.subject.trim()) {
            addToast('Tên lớp và môn học không được để trống.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createClass(formData, currentUser.Email);
            if (result.success && result.classId && result.joinCode) {
                setSuccessData({
                    classId: result.classId,
                    joinCode: result.joinCode,
                    className: formData.className,
                    subject: formData.subject,
                });
                setViewState('success');
                addToast(`Tạo lớp học "${formData.className}" thành công!`, 'success');
            } else {
                addToast(result.error || 'Tạo lớp học thất bại. Vui lòng thử lại.', 'error');
            }
        } catch (error: any) {
            addToast(`Lỗi hệ thống: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setFormData({ className: '', subject: '', description: '' });
        setSuccessData(null);
        setViewState('form');
    };
    
    const copyJoinCode = () => {
        if (successData?.joinCode) {
            navigator.clipboard.writeText(successData.joinCode);
            addToast('Đã sao chép mã tham gia!', 'info');
        }
    };

    const copyClassLink = () => {
        if (successData?.joinCode) {
            const link = `${window.location.origin}/classroom/join?code=${successData.joinCode}`;
            navigator.clipboard.writeText(link);
            addToast('Đã sao chép link vào clipboard!', 'info');
        }
    };

    if (viewState === 'success' && successData) {
        return (
            <div className="max-w-2xl mx-auto text-center px-4 py-12">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <Icon name="check-circle" className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo Lớp Thành Công!</h1>
                    <p className="text-gray-600 mb-6">Lớp học <strong className="text-gray-800">{successData.className}</strong> đã được tạo.</p>
                    
                    <div className="mb-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-semibold mb-2">Mã tham gia</p>
                            <div className="flex items-center justify-center gap-2 bg-gray-100 p-4 rounded-lg">
                                <span className="text-4xl font-bold tracking-[0.2em] text-gray-800 font-mono">{successData.joinCode}</span>
                                <button onClick={copyJoinCode} className="p-2 rounded-md hover:bg-gray-200 transition" title="Sao chép mã">
                                    <Icon name="document" className="w-6 h-6 text-gray-600"/>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Chia sẻ mã này cho học sinh để tham gia lớp học.</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Link tham gia lớp học (tự động điền mã):</p>
                            <div className="flex items-center gap-2 bg-white p-3 rounded-md border border-blue-200">
                                <span className="text-sm text-blue-600 flex-grow truncate">
                                    {`${window.location.origin}/classroom/join?code=${successData.joinCode}`}
                                </span>
                                <button
                                    onClick={copyClassLink}
                                    className="p-2 rounded-md hover:bg-gray-100 transition flex-shrink-0"
                                    aria-label="Sao chép link"
                                    title="Sao chép link"
                                >
                                    <Icon name="document" className="w-5 h-5 text-blue-600"/>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Chia sẻ link này để học sinh tự động điền mã khi truy cập.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(`/classroom/${successData.classId}`)}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 text-lg font-bold rounded-lg text-white bg-green-600 hover:bg-green-700"
                        >
                            <Icon name="play" className="w-5 h-5" />
                            Đi đến lớp học
                        </button>
                        <button
                            onClick={handleReset}
                            className="w-full flex justify-center py-3 px-4 text-lg font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Tạo lớp học khác
                        </button>
                        <button
                            onClick={() => router.push('/classroom')}
                            className="w-full flex justify-center py-3 px-4 text-lg font-bold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300"
                        >
                            Về Danh sách lớp học
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <Link href="/classroom" className="text-blue-600 hover:underline flex items-center gap-2 text-sm mb-6">
                <Icon name="arrowLeft" className="w-4 h-4" />
                Quay lại
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Icon name="plus" className="w-8 h-8 text-blue-600"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Tạo Lớp học Mới</h1>
                        <p className="text-gray-600 mt-1">Điền thông tin dưới đây để bắt đầu lớp học của bạn.</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="className" className="block text-sm font-semibold text-gray-700 mb-1">Tên lớp học <span className="text-red-500">*</span></label>
                        <input
                            id="className"
                            name="className"
                            type="text"
                            placeholder="Ví dụ: Lớp 12A1 - Ôn thi Toán"
                            required
                            value={formData.className}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1">Môn học <span className="text-red-500">*</span></label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="Ví dụ: Toán học"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Mô tả (tùy chọn)</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Mô tả ngắn về mục tiêu của lớp học..."
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-lg font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            <Icon name="plus" className="w-5 h-5"/>
                            {isLoading ? 'Đang tạo...' : 'Tạo lớp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
