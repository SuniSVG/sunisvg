'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSharedCoursesInbox, getSharedCoursesOutbox, acceptSharedCourse, rejectSharedCourse, fetchAccounts, revokeSharedCourse } from '@/services/googleSheetService';
import { useToast } from '@/contexts/ToastContext';
import { Inbox, Send, Check, X, Clock, Gift, Users, AlertTriangle } from 'lucide-react';
import { timeAgo } from '@/utils/dateUtils';
import Image from 'next/image';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function SharingCenterPage() {
    const { currentUser, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
    const [inbox, setInbox] = useState<any[]>([]);
    const [outbox, setOutbox] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const [inboxRes, outboxRes, accountsRes] = await Promise.all([
                getSharedCoursesInbox(currentUser.Email),
                getSharedCoursesOutbox(currentUser.Email),
                fetchAccounts()
            ]);

            if (inboxRes.success) setInbox(inboxRes.data || []);
            if (outboxRes.success) setOutbox(outboxRes.data || []);
            setAccounts(accountsRes || []);

        } catch (error) {
            addToast('Lỗi khi tải dữ liệu chia sẻ.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAccept = async (shareId: string) => {
        if (!currentUser) return;
        setProcessingId(shareId);
        const result = await acceptSharedCourse(shareId, currentUser.Email);
        if (result.success) {
            addToast('Đã nhận khóa học!', 'success');
            await refreshCurrentUser(); // Cập nhật owned courses
            fetchData(); // Tải lại danh sách
        } else {
            addToast(result.error || 'Có lỗi xảy ra', 'error');
        }
        setProcessingId(null);
    };

    const handleReject = async (shareId: string) => {
        if (!currentUser) return;
        setProcessingId(shareId);
        const result = await rejectSharedCourse(shareId, currentUser.Email);
        if (result.success) {
            addToast('Đã từ chối lời mời.', 'info');
            fetchData();
        } else {
            addToast(result.error || 'Có lỗi xảy ra', 'error');
        }
        setProcessingId(null);
    };

    const handleRevoke = async (shareId: string) => {
        if (!currentUser) return;
        if (!confirm('Bạn có chắc muốn hủy chia sẻ khóa học này? Người nhận sẽ mất quyền truy cập.')) return;
        
        setProcessingId(shareId);
        const result = await revokeSharedCourse(shareId, currentUser.Email);
        if (result.success) {
            addToast('Đã hủy chia sẻ thành công.', 'success');
            fetchData();
        } else {
            addToast(result.error || 'Có lỗi xảy ra', 'error');
        }
        setProcessingId(null);
    };

    const getAccountInfo = (email: string) => accounts.find(acc => acc.Email.toLowerCase() === email.toLowerCase());

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" />Chờ</span>;
            case 'accepted': return <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full"><Check className="w-3 h-3" />Đã nhận</span>;
            case 'rejected': return <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full"><X className="w-3 h-3" />Từ chối</span>;
            case 'revoked': return <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full"><AlertTriangle className="w-3 h-3" />Đã hủy</span>;
            default: return <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{status}</span>;
        }
    };

    const ShareItem = ({ item, type }: { item: any, type: 'inbox' | 'outbox' }) => {
        const otherUserEmail = type === 'inbox' ? item.ownerEmail : item.sharedWithEmail;
        const otherUser = getAccountInfo(otherUserEmail);

        return (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden relative shrink-0">
                        {otherUser?.AvatarURL ? <Image src={convertGoogleDriveUrl(otherUser.AvatarURL)} alt={otherUser['Tên tài khoản']} fill className="object-cover" referrerPolicy="no-referrer" /> : otherUser?.['Tên tài khoản']?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.courseName}</p>
                        <p className="text-xs text-gray-500">
                            {type === 'inbox' ? `Từ: ${otherUser?.['Tên tài khoản'] || item.ownerEmail}` : `Tới: ${otherUser?.['Tên tài khoản'] || item.sharedWithEmail}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(item.sharedDate)}</p>
                    </div>
                    {renderStatusBadge(item.status)}
                </div>
                {item.message && <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100">“{item.message}”</p>}
                {type === 'inbox' && item.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleAccept(item.id)} disabled={processingId === item.id} className="flex-1 bg-green-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">Nhận</button>
                        <button onClick={() => handleReject(item.id)} disabled={processingId === item.id} className="flex-1 bg-gray-200 text-gray-700 text-sm font-bold py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors">Từ chối</button>
                    </div>
                )}
                {type === 'outbox' && (item.status === 'pending' || item.status === 'accepted') && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button 
                            onClick={() => handleRevoke(item.id)} 
                            disabled={processingId === item.id} 
                            className="flex-1 bg-red-50 text-red-600 text-sm font-bold py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {processingId === item.id ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                            Hủy chia sẻ
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (!currentUser) return <div className="min-h-screen flex items-center justify-center text-gray-500">Vui lòng đăng nhập.</div>;

    const list = activeTab === 'inbox' ? inbox : outbox;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Gift className="w-7 h-7 text-green-600" />
                        Trung tâm chia sẻ
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý các khóa học bạn chia sẻ và được chia sẻ.</p>
                </div>

                <div className="flex gap-2 border-b border-gray-200 pb-1">
                    <button onClick={() => setActiveTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors relative ${activeTab === 'inbox' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <Inbox className="w-4 h-4 inline-block mr-2" /> Hộp thư đến
                        {inbox.filter(i => i.status === 'pending').length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </button>
                    <button onClick={() => setActiveTab('outbox')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'outbox' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <Send className="w-4 h-4 inline-block mr-2" /> Đã gửi
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Đang tải...</div>
                ) : list.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                            {activeTab === 'inbox' ? <Inbox className="w-8 h-8" /> : <Send className="w-8 h-8" />}
                        </div>
                        <p className="text-gray-500 font-medium">Hộp thư của bạn trống.</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {activeTab === 'inbox' ? 'Khi bạn bè chia sẻ khóa học, chúng sẽ xuất hiện ở đây.' : 'Chia sẻ khóa học với bạn bè để giúp họ cùng tiến bộ!'}
                        </p>
                        <Link href="/friends" className="mt-4 inline-block text-sm font-bold text-green-600 hover:underline">
                            Tìm bạn bè <Users className="w-4 h-4 inline-block ml-1" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {list.sort((a, b) => new Date(b.sharedDate).getTime() - new Date(a.sharedDate).getTime()).map(item => (
                            <ShareItem key={item.id} item={item} type={activeTab} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
