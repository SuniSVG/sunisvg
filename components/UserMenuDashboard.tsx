'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { 
    User, 
    Settings, 
    LogOut, 
    Key, 
    CreditCard, 
    ShoppingBag, 
    Ticket, 
    FileUp,
    GraduationCap,
    MessageCircle, 
    ShieldCheck, 
    Facebook, 
    Smartphone, 
    ChevronRight, 
    Camera,
    XCircle
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { DepositModal } from './DepositModal';
import { fetchArticles } from '@/services/googleSheetService';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function UserMenuDashboard({ onClose }: { onClose?: () => void }) {
    const { currentUser, logout, updatePassword, refreshCurrentUser } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    // State for stats
    const [uploadedDocsCount, setUploadedDocsCount] = useState(0);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Deposit Modal State
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    useEffect(() => {
        if (currentUser?.Email) {
            // Fetch articles submitted by the user to count them.
            // This is cached by the service, so it's not too expensive.
            fetchArticles().then(articles => {
                const userArticles = articles.filter(art => art.SubmitterEmail?.toLowerCase() === currentUser.Email.toLowerCase());
                setUploadedDocsCount(userArticles.length);
            }).catch(err => {
                console.error("Failed to fetch user articles for dashboard", err);
            });
        }
    }, [currentUser]);

    if (!currentUser) return null;

    const handleLogout = () => {
        logout();
        router.push('/login');
        if (onClose) onClose();
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            addToast('Mật khẩu mới không khớp.', 'error');
            return;
        }
        if (newPassword.length < 6) {
             addToast('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
             return;
        }

        setIsUpdatingPassword(true);
        const result = await updatePassword(currentPassword, newPassword);
        setIsUpdatingPassword(false);
        
        if (result.success) {
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
    };

    const handleDepositSuccess = async () => {
        setIsDepositModalOpen(false);
        await refreshCurrentUser();
        addToast('Nạp tiền thành công! Số dư của bạn đã được cập nhật.', 'success');
    };

    // Calculate purchased courses count (placeholder)
    const purchasedCoursesCount = 0;

    if (showPasswordModal) {
        return (
            <div className="p-4 bg-white rounded-xl w-full max-w-sm mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
                    <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isUpdatingPassword ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white w-full max-w-sm mx-auto overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="p-5">
                {/* Header Profile Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl border-2 border-green-100 overflow-hidden relative shadow-sm">
                            {currentUser.AvatarURL ? (
                                <Image
                                    src={convertGoogleDriveUrl(currentUser.AvatarURL)}
                                    alt={currentUser['Tên tài khoản']}
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {currentUser['Tên tài khoản'].charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button className="absolute -bottom-1 -right-1 bg-white text-green-600 p-1 rounded-full border border-green-100 shadow-sm hover:bg-green-50 transition-colors">
                            <Camera className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{currentUser['Tên tài khoản']}</h1>
                        <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">
                            {currentUser['Danh hiệu'] || 'Chưa cập nhật trường'}
                        </p>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
                            Level {1}
                        </div>
                    </div>
                    <Link href={`/profile/${currentUser.Email}`} onClick={onClose} className="text-gray-300 hover:text-green-600 transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </Link>
                </div>

                {/* Balance Card - New Look */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white mb-5 shadow-lg shadow-green-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-green-100 text-xs font-medium mb-1">Số dư khả dụng</p>
                            <p className="text-2xl font-black tracking-tight">{(currentUser.Money || 0).toLocaleString()}đ</p>
                        </div>
                        <button 
                            onClick={() => setIsDepositModalOpen(true)}
                            className="bg-white text-green-700 p-2 rounded-xl shadow-sm hover:bg-green-50 transition-colors"
                        >
                            <CreditCard className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50/50 rounded-2xl border border-green-100 hover:border-green-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                            <FileUp className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-black text-gray-900 leading-none mb-1">{uploadedDocsCount}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Tài liệu</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50/50 rounded-2xl border border-green-100 hover:border-green-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                            <GraduationCap className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-black text-gray-900 leading-none mb-1">{purchasedCoursesCount}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Khoá học</p>
                    </div>
                </div>

                {/* Action Buttons - Simplified since Deposit is moved up */}
                <div className="mb-5">
                    <Link href="/activate" className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors text-sm">
                        <Key className="w-4 h-4 text-green-400" />
                        Kích hoạt Sách ID
                    </Link>
                </div>

                {/* Menu List - Updated styling */}
                <div className="space-y-1">
                    {[
                        { href: '/orders', icon: ShoppingBag, label: 'Quản lý đơn hàng' },
                        { href: '/vouchers', icon: Ticket, label: 'Kho Voucher' },
                        { href: '/settings', icon: Settings, label: 'Cài đặt tài khoản' },
                        { href: '/support', icon: MessageCircle, label: 'Trung tâm hỗ trợ' },
                        { href: '/policy', icon: ShieldCheck, label: 'Chính sách & Điều khoản' },
                    ].map((item, idx) => (
                        <Link key={idx} href={item.href} className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-xl transition-colors group">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:text-green-600 group-hover:shadow-sm transition-all">
                                <item.icon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-gray-700 text-sm flex-1 group-hover:text-green-700 transition-colors">{item.label}</span>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-400" />
                        </Link>
                    ))}

                    <div className="h-px bg-gray-100 my-2 mx-4"></div>

                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors group text-left">
                        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:text-red-500 group-hover:shadow-sm transition-all">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-gray-700 text-sm flex-1 group-hover:text-red-600 transition-colors">Đăng xuất</span>
                    </button>
                </div>

                {/* Bottom Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                    <Link href="/mobile-app" className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 font-bold py-3 px-3 rounded-xl hover:bg-gray-100 transition-colors text-xs border border-gray-100">
                        <Smartphone className="w-4 h-4" />
                        Tải App
                    </Link>
                    <Link href="/fanpage" className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 px-3 rounded-xl hover:bg-blue-100 transition-colors text-xs border border-blue-100">
                        <Facebook className="w-4 h-4" />
                        Fanpage
                    </Link>
                </div>
            </div>

            {/* Deposit Modal */}
            <DepositModal 
                isOpen={isDepositModalOpen} 
                onClose={() => setIsDepositModalOpen(false)} 
                currentUser={currentUser} 
                onSuccess={handleDepositSuccess}
            />
        </div>
    );
}
