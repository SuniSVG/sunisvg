'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';

export default function PracticeIndexPage() {
    const [courseId, setCourseId] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (courseId.trim()) {
            router.push(`/practice/${courseId.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center border border-gray-100">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="file-text" className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Vào phòng Luyện tập</h1>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    Nhập mã bài giảng (ID) do giáo viên cung cấp để bắt đầu ôn luyện các câu hỏi trắc nghiệm và tự luận.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="text"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            placeholder="VD: 876060"
                            className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-center text-xl font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!courseId.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <span>Bắt đầu làm bài</span>
                    </button>
                </form>
            </div>
        </div>
    );
}