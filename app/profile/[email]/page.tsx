'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAccounts, fetchArticles, updateUsername as updateUsernameService, updatePassword as updatePasswordService } from '@/services/googleSheetService';
import type { Account, ScientificArticle } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { parseVNDateToDate } from '@/utils/dateUtils';
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
    Star,
    Wallet,
    FileText,
    Calendar,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ArrowLeft,
    ArrowRight,
    Edit2
} from 'lucide-react';

const ProfilePage = () => {
    const params = useParams();
    const email = decodeURIComponent(params.email as string);
    const router = useRouter();
    const { currentUser, updateUsername, updatePassword, logout } = useAuth();
    const [profileUser, setProfileUser] = useState<Account | null>(null);
    const [userArticles, setUserArticles] = useState<ScientificArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [articlePage, setArticlePage] = useState(1);
    
    const { addToast } = useToast();
    const [newName, setNewName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false, uppercase: false, lowercase: false, number: false, specialChar: false,
    });

    const ARTICLES_PER_PAGE = 10;

    useEffect(() => {
        const loadProfileData = async () => {
            if (!email) {
                setError("Email người dùng không hợp lệ.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const isMyProfile = currentUser?.Email?.toLowerCase() === email.toLowerCase();

                if (isMyProfile) {
                    setProfileUser(currentUser);
                    setNewName(currentUser['Tên tài khoản']);
                    const allArticles = await fetchArticles();
                    const foundArticles = allArticles
                        .filter(art => art.SubmitterEmail.toLowerCase() === email.toLowerCase())
                        .sort((a, b) => {
                            const timeA = parseVNDateToDate(a.SubmissionDate)?.getTime() || 0;
                            const timeB = parseVNDateToDate(b.SubmissionDate)?.getTime() || 0;
                            return timeB - timeA;
                        });
                    setUserArticles(foundArticles);
                } else {
                    const [accounts, allArticles] = await Promise.all([
                        fetchAccounts(),
                        fetchArticles()
                    ]);
                    const foundUser = accounts.find(acc => acc.Email.toLowerCase() === email.toLowerCase());
                    if (foundUser) {
                        setProfileUser(foundUser);
                        setNewName(foundUser['Tên tài khoản']);
                        const foundArticles = allArticles
                            .filter(art => art.SubmitterEmail.toLowerCase() === email.toLowerCase())
                            .sort((a, b) => {
                                const timeA = parseVNDateToDate(a.SubmissionDate)?.getTime() || 0;
                                const timeB = parseVNDateToDate(b.SubmissionDate)?.getTime() || 0;
                                return timeB - timeA;
                            });
                        setUserArticles(foundArticles);
                    } else {
                        setError("Không tìm thấy người dùng.");
                    }
                }
            } catch (err) {
                setError("Không thể tải dữ liệu hồ sơ.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfileData();
    }, [email, currentUser]);

    const isMyProfile = currentUser?.Email.toLowerCase() === email?.toLowerCase();
    
    const handleNameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMyProfile || !currentUser) return;
        if (newName.trim().length < 3 || newName.trim() === currentUser['Tên tài khoản']) {
            addToast('Tên mới phải có ít nhất 3 ký tự và khác tên cũ.', 'error');
            return;
        }

        setIsUpdatingName(true);
        const result = await updateUsername(newName.trim());
        setIsUpdatingName(false);
        
        if(result.success) {
             document.getElementById('edit-profile-modal')?.classList.add('hidden');
        }
    };
  
    const validatePassword = (pass: string) => {
        const length = pass.length >= 8;
        const uppercase = /[A-Z]/.test(pass);
        const lowercase = /[a-z]/.test(pass);
        const number = /[0-9]/.test(pass);
        const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        setPasswordCriteria({ length, uppercase, lowercase, number, specialChar });
        return length && uppercase && lowercase && number && specialChar;
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pass = e.target.value;
        setNewPassword(pass);
        validatePassword(pass);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMyProfile) return;
        if (newPassword !== confirmNewPassword) {
            addToast('Mật khẩu mới không khớp.', 'error');
            return;
        }
        if (!validatePassword(newPassword)) {
            addToast('Mật khẩu mới không đủ mạnh.', 'error');
            return;
        }

        setIsUpdatingPassword(true);
        const result = await updatePassword(currentPassword, newPassword);
        setIsUpdatingPassword(false);
        
        if (result.success) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordCriteria({ length: false, uppercase: false, lowercase: false, number: false, specialChar: false });
            document.getElementById('password-modal')?.classList.add('hidden');
        } else {
            setCurrentPassword('');
        }
    };

    const PasswordCriterion: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
        <li className={`flex items-center text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-500'}`}>
            {met ? <CheckCircle2 className="w-3 h-3 mr-1.5 text-green-500" /> : <XCircle className="w-3 h-3 mr-1.5 text-gray-400" />}
            {text}
        </li>
    );

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const totalArticlePages = Math.ceil(userArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = userArticles.slice(
        (articlePage - 1) * ARTICLES_PER_PAGE,
        articlePage * ARTICLES_PER_PAGE
    );

    const getStatusPill = (status: string) => {
        switch (status) {
            case 'Approved': return <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">Đã duyệt</span>;
            case 'Pending': return <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Chờ duyệt</span>;
            case 'Rejected': return <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded-full">Từ chối</span>;
            default: return <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{status}</span>;
        }
    };

    const renderPaginationControls = () => {
        if (totalArticlePages <= 1) return null;
        return (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
                <button
                    onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                    disabled={articlePage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                    Trang {articlePage} / {totalArticlePages}
                </span>
                <button
                    onClick={() => setArticlePage(p => Math.min(totalArticlePages, p + 1))}
                    disabled={articlePage === totalArticlePages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error || !profileUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
                    <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
                    <p className="text-gray-500 mb-6">{error || "Người dùng không tồn tại hoặc đã bị xóa."}</p>
                    <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-600 hover:bg-orange-700">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    // --- Moon.vn Style Dashboard for Logged-in User ---
    if (isMyProfile) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
                    {/* Header */}
                    <div className="p-6 pb-8 bg-white">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-orange-100 overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-3xl font-bold">
                                        {profileUser['Tên tài khoản'].charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <button onClick={() => document.getElementById('edit-profile-modal')?.classList.remove('hidden')} className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm hover:bg-blue-700 transition-colors">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{profileUser['Tên tài khoản']}</h1>
                                <p className="text-sm text-gray-500 mb-2">THPT Chuyên Sư Phạm</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm shadow-orange-200">
                                    Level {profileUser['Đặc biệt']?.split(' - ')[0] || 1}
                                </div>
                            </div>
                            <Link href="/settings" className="ml-auto text-gray-400 hover:text-gray-600">
                                <ChevronRight className="w-6 h-6" />
                            </Link>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-gray-500 text-sm">Số dư tài khoản</span>
                            <span className="text-lg font-bold text-gray-900">{(profileUser.Money || 0).toLocaleString()}đ</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-2xl font-black text-gray-900 mb-1">{profileUser.Tokens || 0}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">SP</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-2xl font-black text-gray-900 mb-1">{profileUser['Tổng số câu hỏi đã làm'] || 0}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bài tập đã làm</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button className="flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors">
                                <Key className="w-5 h-5" />
                                Kích hoạt Sách ID
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-colors">
                                <CreditCard className="w-5 h-5" />
                                Nộp học phí
                            </button>
                        </div>

                        {/* Menu List */}
                        <div className="space-y-1">
                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Download className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Tải về phiên bản Windows</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-md uppercase">Mới</span>
                            </Link>
                            
                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Quản lý đơn hàng</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Quản lý Voucher</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Cập nhật môn học quan tâm</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <div className="h-px bg-gray-100 my-2 mx-4"></div>

                            <button onClick={() => document.getElementById('password-modal')?.classList.remove('hidden')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Đổi mật khẩu</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>

                            <Link href="/settings" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Cài đặt</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Type className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Thay đổi cỡ chữ</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>

                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Chat hỗ trợ</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <Link href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Chính sách & điều khoản sử dụng</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>

                            <div className="h-px bg-gray-100 my-2 mx-4"></div>

                            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors group text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700 flex-1">Đăng xuất</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>

                        {/* My Articles Section */}
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 px-2 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Tài liệu của bạn
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{userArticles.length}</span>
                            </h3>
                            {userArticles.length > 0 ? (
                                <div className="space-y-3">
                                    {paginatedArticles.map(article => (
                                        <Link key={article.ID} href={`/article/${article.ID}`} className="block bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-800 line-clamp-1 flex-1 mr-2">{article.Title}</h4>
                                                {getStatusPill(article.Status)}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-1 rounded-md">{article.Category}</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {article.SubmissionDate.split(' ')[0]}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                    {renderPaginationControls()}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-500">Bạn chưa đăng tải tài liệu nào.</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Buttons */}
                        <div className="grid grid-cols-2 gap-4 mt-8 pb-8">
                            <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors">
                                <Smartphone className="w-5 h-5" />
                                Tải App
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-blue-100 transition-colors">
                                <Facebook className="w-5 h-5" />
                                Fanpage
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Modal */}
                <div id="edit-profile-modal" className="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Đổi tên hiển thị</h3>
                            <button onClick={() => document.getElementById('edit-profile-modal')?.classList.add('hidden')} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleNameChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị mới</label>
                                <input 
                                    type="text" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên mới"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isUpdatingName}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isUpdatingName ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Password Change Modal */}
                <div id="password-modal" className="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
                            <button onClick={() => document.getElementById('password-modal')?.classList.add('hidden')} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                                <input 
                                    type="password" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                                <ul className="mt-2 space-y-1">
                                    <PasswordCriterion met={passwordCriteria.length} text="Ít nhất 8 ký tự" />
                                    <PasswordCriterion met={passwordCriteria.uppercase} text="Chữ hoa" />
                                    <PasswordCriterion met={passwordCriteria.lowercase} text="Chữ thường" />
                                    <PasswordCriterion met={passwordCriteria.number} text="Số" />
                                    <PasswordCriterion met={passwordCriteria.specialChar} text="Ký tự đặc biệt" />
                                </ul>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isUpdatingPassword}
                                className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                                {isUpdatingPassword ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- Public Profile View ---
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Profile Card */}
            <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8 rounded-3xl shadow-2xl overflow-hidden mb-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/50 shadow-xl overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-4xl font-bold">
                                {profileUser['Tên tài khoản'].charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl ring-4 ring-white">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{profileUser['Tên tài khoản']}</h1>
                        <p className="text-lg text-white/90 font-medium mb-3">{profileUser['Vai trò']}</p>
                        <p className="text-white/80 text-sm">{profileUser.Email}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center flex-shrink-0 shadow-xl">
                            <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">Tổng tài liệu</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-3xl text-white">{userArticles.length}</p>
                                    <p className="text-sm text-white/80">Bài viết</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    Tài liệu đã đăng
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                        {userArticles.length}
                    </span>
                </h2>
                {userArticles.length > 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {paginatedArticles.map(article => (
                                <li key={article.ID} className="p-5 hover:bg-gray-50 transition-colors group">
                                    <Link href={`/article/${article.ID}`} className="block">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-bold text-lg text-gray-900 group-hover:text-blue-600 truncate pr-4 transition-colors">{article.Title}</p>
                                            {getStatusPill(article.Status)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                    {article.Category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {article.SubmissionDate.split(' ')[0]}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {renderPaginationControls()}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Chưa có tài liệu nào</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Người dùng này chưa đăng tải tài liệu nào.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProfilePage;
