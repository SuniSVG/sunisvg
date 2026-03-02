import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    User, 
    Settings, 
    LogOut, 
    Key, 
    CreditCard, 
    Download, 
    ShoppingBag, 
    Ticket, 
    BookOpen, 
    Lock, 
    Type, 
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

export default function UserMenuDashboard({ onClose }: { onClose?: () => void }) {
    const { currentUser, logout, updatePassword, refreshCurrentUser } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Deposit Modal State
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="w-full py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isUpdatingPassword ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white w-full max-w-sm mx-auto overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="p-4">
                {/* Header Profile Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-orange-100 overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
                                {currentUser['Tên tài khoản'].charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border border-white shadow-sm">
                            <Camera className="w-2.5 h-2.5" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold text-gray-900 truncate">{currentUser['Tên tài khoản']}</h1>
                        <p className="text-xs text-gray-500 mb-1 truncate">THPT Chuyên Sư Phạm</p>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-sm shadow-orange-200">
                            Level {1}
                        </div>
                    </div>
                    <Link href={`/profile/${currentUser.Email}`} onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-xs">Số dư tài khoản</span>
                    <span className="text-base font-bold text-gray-900">{(currentUser.Money || 0).toLocaleString()}đ</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-lg font-black text-gray-900 mb-0.5">{currentUser.Tokens || 0}</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">SP</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-lg font-black text-gray-900 mb-0.5">{currentUser['Tổng số câu hỏi đã làm'] || 0}</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Bài tập đã làm</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Link href="/activate" className="flex items-center justify-center gap-1.5 bg-orange-500 text-white font-bold py-2.5 px-3 rounded-xl shadow-md shadow-orange-100 hover:bg-orange-600 transition-colors text-xs">
                        <Key className="w-4 h-4" />
                        Kích hoạt Sách ID
                    </Link>
                    <button 
                        onClick={() => setIsDepositModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 bg-green-600 text-white font-bold py-2.5 px-3 rounded-xl shadow-md shadow-green-100 hover:bg-green-700 transition-colors text-xs"
                    >
                        <CreditCard className="w-4 h-4" />
                        Nộp học phí
                    </button>
                </div>

                {/* Menu List */}
                <div className="space-y-0.5">

                    
                    <Link href="/orders" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Quản lý đơn hàng</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>

                    <Link href="/vouchers" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Ticket className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Quản lý Voucher</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>

                    <div className="h-px bg-gray-100 my-1 mx-3"></div>

                    <Link href="/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Cài đặt</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>

                    <Link href="/support" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Trung tâm hỗ trợ</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>

                    <Link href="/policy" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Chính sách & điều khoản sử dụng</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>

                    <div className="h-px bg-gray-100 my-1 mx-3"></div>

                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors group text-left">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm flex-1">Đăng xuất</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                </div>

                {/* Bottom Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Link href="/mobile-app" className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 font-bold py-2.5 px-3 rounded-xl hover:bg-gray-200 transition-colors text-xs">
                        <Smartphone className="w-4 h-4" />
                        Tải App
                    </Link>
                    <Link href="/fanpage" className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 font-bold py-2.5 px-3 rounded-xl hover:bg-blue-100 transition-colors text-xs">
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
