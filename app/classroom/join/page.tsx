'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { joinClass } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';

function JoinClassContent() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setJoinCode(code);
        }
    }, [searchParams]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để tham gia lớp học.', 'info');
            router.push('/login');
            return;
        }
        if (!joinCode.trim()) {
            addToast('Vui lòng nhập mã tham gia.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await joinClass(joinCode.trim(), currentUser.Email);
            if (result.success) {
                addToast(result.message || 'Tham gia lớp học thành công!', 'success');
                if (result.details?.ClassID) {
                    router.push(`/classroom/${result.details.ClassID}`);
                } else {
                    router.push('/classroom');
                }
            } else {
                addToast(result.error || 'Tham gia lớp học thất bại. Vui lòng kiểm tra lại mã.', 'error');
            }
        } catch (error: any) {
            addToast(`Lỗi hệ thống: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-20">
            <Link href="/classroom" className="text-blue-600 hover:underline flex items-center gap-2 text-sm mb-6">
                <Icon name="arrowLeft" className="w-4 h-4" />
                Quay lại
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="users" className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Tham gia lớp học</h1>
                    <p className="text-gray-600 mt-2">Nhập mã tham gia do giáo viên cung cấp để bắt đầu học tập.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="joinCode" className="block text-sm font-semibold text-gray-700 mb-2">Mã tham gia</label>
                        <input
                            id="joinCode"
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Ví dụ: ABCXYZ"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:border-blue-500 focus:ring-0 transition-colors uppercase font-mono"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            <>
                                <Icon name="login" className="w-5 h-5" />
                                <span>Tham gia ngay</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        Bạn là giáo viên? <Link href="/classroom/create" className="text-blue-600 font-semibold hover:underline">Tạo lớp học mới</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function JoinClassPage() {
    return (
        <Suspense fallback={<div className="text-center p-20">Đang tải...</div>}>
            <JoinClassContent />
        </Suspense>
    );
}
