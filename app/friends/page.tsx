'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAccounts, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } from '@/services/googleSheetService';
import { Account } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { Icon } from '@/components/shared/Icon';
import { useToast } from '@/contexts/ToastContext';
import { UserPlus, School, Search, Users, UserCheck, Clock, X, Check, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FriendsPage() {
    const { currentUser, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingEmail, setProcessingEmail] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'community' | 'friends' | 'requests' | 'sent'>('community');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchAccounts();
                setAccounts(data);
            } catch (error) {
                console.error("Failed to fetch accounts", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // Parse friend status from currentUser data
    const friendStatus = React.useMemo(() => {
        const raw = (currentUser as any)?.['Bạn bè'] || '';
        const accepted: string[] = [];
        const pending: string[] = [];  // Lời mời mình đã gửi (P)
        const incoming: string[] = []; // Lời mời nhận được (?)

        console.log('🔍 Raw Bạn bè data:', raw);

        if (raw) {
            String(raw).split(',').forEach((item: string) => {
                const s = item.trim();
                
                if (s.startsWith('(Y)')) {
                    const email = s.substring(3).trim().toLowerCase();
                    accepted.push(email);
                    console.log('✅ Accepted friend:', email);
                } 
                else if (s.startsWith('(P)')) {
                    const email = s.substring(3).trim().toLowerCase();
                    pending.push(email);
                    console.log('⏳ Pending (sent by me):', email);
                } 
                else if (s.startsWith('(?)')) {
                    const email = s.substring(3).trim().toLowerCase();
                    incoming.push(email);
                    console.log('📨 Incoming request:', email);
                } 
                else if (s) {
                    const email = s.toLowerCase();
                    accepted.push(email);
                    console.log('📌 Legacy friend:', email);
                }
            });
        }

        console.log('📊 Friend Status Summary:', {
            accepted: accepted.length,
            pending: pending.length,
            incoming: incoming.length
        });

        return { accepted, pending, incoming };
    }, [currentUser]);

    // Debug useEffect
    useEffect(() => {
        if (currentUser) {
 console.log('=== FRIEND STATUS DEBUG ===');
        console.log('Current User Email:', currentUser.Email);
        console.log('🔍 ALL FIELDS IN CURRENT USER:', Object.keys(currentUser));
        console.log('🔍 FULL CURRENT USER OBJECT:', currentUser);
        console.log('Raw Field Bạn bè:', (currentUser as any)?.['Bạn bè']);
        console.log('Raw Field Môn học:', (currentUser as any)?.['Môn học']);
        console.log('Parsed:', friendStatus);
        console.log('==========================');
        }
    }, [currentUser, friendStatus]);

    const handleAction = async (action: 'send' | 'accept' | 'reject' | 'remove', friendEmail: string) => {
        if (!currentUser) return;
        setProcessingEmail(friendEmail);
        
        console.log(`🔄 Action: ${action} for ${friendEmail}`);
        
        try {
            let result: { success: boolean; error?: string } | undefined;
            
            if (action === 'send') {
                result = await sendFriendRequest(currentUser.Email, friendEmail);
            } else if (action === 'accept') {
                result = await acceptFriendRequest(currentUser.Email, friendEmail);
            } else if (action === 'reject') {
                result = await rejectFriendRequest(currentUser.Email, friendEmail);
            } else if (action === 'remove') {
                result = await removeFriend(currentUser.Email, friendEmail);
            }

            if (result?.success) {
                addToast('Thao tác thành công!', 'success');
                await refreshCurrentUser();
                // Reload accounts to update the list
                const data = await fetchAccounts();
                setAccounts(data);
            } else {
                addToast(result?.error || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('❌ Action error:', error);
            addToast('Lỗi kết nối', 'error');
        } finally {
            setProcessingEmail(null);
        }
    };

    // Filter lists
    const filteredAccounts = accounts.filter(acc => 
        acc.Email !== currentUser?.Email &&
        (acc['Tên tài khoản'].toLowerCase().includes(searchTerm.toLowerCase()) || 
         (acc as any)['Trường']?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const communityUsers = filteredAccounts.filter(acc => {
        const email = acc.Email.toLowerCase();
        return !friendStatus.accepted.includes(email) &&
               !friendStatus.pending.includes(email) &&
               !friendStatus.incoming.includes(email);
    });

    const friendUsers = accounts.filter(acc => 
        friendStatus.accepted.includes(acc.Email.toLowerCase())
    );
    
    const requestUsers = accounts.filter(acc => 
        friendStatus.incoming.includes(acc.Email.toLowerCase())
    );

    const sentUsers = accounts.filter(acc => 
        friendStatus.pending.includes(acc.Email.toLowerCase())
    );

    const currentList = activeTab === 'community' ? communityUsers 
                      : activeTab === 'friends' ? friendUsers 
                      : activeTab === 'sent' ? sentUsers
                      : requestUsers;
                      
    const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
    const paginatedUsers = currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const UserCard = ({ user, type }: { user: Account, type: 'community' | 'friend' | 'request' | 'sent' }) => {
        const isPending = friendStatus.pending.includes(user.Email.toLowerCase());
        const isProcessing = processingEmail === user.Email;

        return (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <Link href={`/profile/${user.Email}`} className="shrink-0 relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100">
                        {user.AvatarURL ? (
                            <Image 
                                src={convertGoogleDriveUrl(user.AvatarURL)} 
                                alt={user['Tên tài khoản']} 
                                fill 
                                className="object-cover" 
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl">
                                {user['Tên tài khoản'].charAt(0)}
                            </div>
                        )}
                    </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.Email}`} className="font-bold text-gray-900 truncate block hover:text-green-600 transition-colors">
                        {user['Tên tài khoản']}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">
                        {(user as any)['Trường'] || 'Chưa cập nhật trường'}
                    </p>
                </div>

                <div className="flex gap-2">
                    {type === 'community' && (
                        isPending ? (
                            <button disabled className="p-2.5 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed flex items-center gap-2 text-xs font-bold">
                                <Clock className="w-4 h-4" /> Đã gửi
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('send', user.Email)}
                                disabled={isProcessing}
                                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Kết bạn"
                            >
                                {isProcessing ? <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            </button>
                        )
                    )}

                    {type === 'request' && (
                        <>
                            <button 
                                onClick={() => handleAction('accept', user.Email)} 
                                disabled={isProcessing} 
                                className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50" 
                                title="Chấp nhận"
                            >
                                {isProcessing ? <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                            </button>
                            <button 
                                onClick={() => handleAction('reject', user.Email)} 
                                disabled={isProcessing} 
                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50" 
                                title="Từ chối"
                            >
                                {isProcessing ? <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /> : <X className="w-5 h-5" />}
                            </button>
                        </>
                    )}

                    {type === 'sent' && (
                        <button 
                            onClick={() => { 
                                if(confirm('Bạn có chắc muốn hủy lời mời?')) 
                                    handleAction('reject', user.Email) 
                            }} 
                            disabled={isProcessing} 
                            className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50" 
                            title="Hủy lời mời"
                        >
                            {isProcessing ? <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /> : <X className="w-5 h-5" />}
                        </button>
                    )}

                    {type === 'friend' && (
                        <button 
                            onClick={() => { 
                                if(confirm('Bạn có chắc muốn hủy kết bạn?')) 
                                    handleAction('remove', user.Email) 
                            }} 
                            disabled={isProcessing} 
                            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50" 
                            title="Hủy kết bạn"
                        >
                            {isProcessing ? <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /> : <UserX className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Vui lòng đăng nhập để tìm bạn bè.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Users className="w-7 h-7 text-green-600" />
                            Kết nối bạn bè
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Mở rộng mạng lưới học tập của bạn.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('community')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'community' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Cộng đồng
                    </button>
                    <button 
                        onClick={() => setActiveTab('friends')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'friends' ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Bạn bè ({friendUsers.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Lời mời nhận {requestUsers.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requestUsers.length}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('sent')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'sent' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Lời mời đã gửi ({sentUsers.length})
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Đang tải danh sách...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedUsers.map(user => (
                                <UserCard 
                                    key={user.Email} 
                                    user={user} 
                                    type={activeTab === 'community' ? 'community' 
                                        : activeTab === 'friends' ? 'friend' 
                                        : activeTab === 'sent' ? 'sent'
                                        : 'request'} 
                                />
                            ))}
                            
                            {currentList.length === 0 && (
                                <p className="col-span-full text-center py-12 text-gray-400 italic">
                                    {activeTab === 'requests' ? 'Không có lời mời nào.' 
                                    : activeTab === 'sent' ? 'Bạn chưa gửi lời mời nào.'
                                    : activeTab === 'friends' ? 'Bạn chưa có bạn bè nào.'
                                    : 'Không tìm thấy người dùng nào.'}
                                </p>
                            )}

                            {totalPages > 1 && (
                                <div className="col-span-full flex justify-center items-center gap-4 mt-6">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                        disabled={currentPage === 1} 
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <span className="text-sm font-medium text-gray-600">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                        disabled={currentPage === totalPages} 
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}