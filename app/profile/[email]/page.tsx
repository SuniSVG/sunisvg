'use client';

import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
    Mail, Shield, Wallet, FileText, Settings, Lock,
    Eye, EyeOff, CheckCircle2, XCircle, ChevronRight,
    ChevronLeft, Calendar, Tag, Edit3, Save, AlertCircle,
    Loader2, BookOpen, Star, BarChart3, Clock,
    TrendingUp, UserCircle2, ArrowUpRight,
} from 'lucide-react';
import { fetchAccounts, fetchArticles, getAccountByEmail } from '@/services/googleSheetService';
import type { Account, ScientificArticle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { parseVNDateToDate } from '@/utils/dateUtils';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { useToast } from '@/contexts/ToastContext';
import AvatarUploader from '@/components/AvatarUploader';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ARTICLES_PER_PAGE = 8;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const sortArticles = (arts: ScientificArticle[]): ScientificArticle[] =>
    [...arts].sort((a, b) => {
        const tA = parseVNDateToDate(a.SubmissionDate)?.getTime() ?? 0;
        const tB = parseVNDateToDate(b.SubmissionDate)?.getTime() ?? 0;
        return tB - tA;
    });

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, { label: string; cls: string }> = {
        Approved: { label: '✓ Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        Pending:  { label: '⏳ Chờ duyệt', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
        Rejected: { label: '✗ Từ chối',   cls: 'bg-red-50    text-red-700    border-red-200'    },
    };
    const { label, cls } = cfg[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
    return (
        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
};

const PwRule: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
        {met
            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            : <XCircle      className="w-3.5 h-3.5 shrink-0 text-gray-300"    />}
        {text}
    </li>
);

const PwField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    error?: boolean;
    errorMsg?: string;
}> = ({ id, label, value, onChange, required, error, errorMsg }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required={required}
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl border-2 text-sm bg-gray-50 focus:bg-white transition-all focus:outline-none
                        ${error
                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                            : 'border-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
                        }`}
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {error && errorMsg && (
                <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errorMsg}
                </p>
            )}
        </div>
    );
};

const AvatarImage: React.FC<{
    avatarUrl?: string;
    fallbackLetter: string;
    className?: string;
}> = ({ avatarUrl, fallbackLetter, className = '' }) => {
    const [imgError, setImgError] = useState(false);

    const directUrl = useMemo(
        () => (avatarUrl ? convertGoogleDriveUrl(avatarUrl) : ''),
        [avatarUrl]
    );

    // Reset error state when URL changes
    useEffect(() => { setImgError(false); }, [directUrl]);

    if (directUrl && !imgError) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <Image
                    src={directUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                />
            </div>
        );
    }

    return (
        <span className={`flex items-center justify-center font-black text-white select-none ${className}`}>
            {fallbackLetter}
        </span>
    );
};

// ─── Page Props (Next.js App Router) ──────────────────────────────────────────

interface PageProps {
    params: Promise<{ email: string }>;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: PageProps) {
    const { email: paramEmail } = use(params);
    const email = decodeURIComponent(paramEmail);

    const { currentUser, updateUsername, updatePassword, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();

    // ── Data state ──────────────────────────────────────────────────────────────
    const [profileUser, setProfileUser]     = useState<Account | null>(null);
    const [userArticles, setUserArticles]   = useState<ScientificArticle[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [error, setError]                 = useState<string | null>(null);

    // ── UI state ────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab]         = useState<'articles' | 'settings'>('articles');
    const [articlePage, setArticlePage]     = useState(1);

    // ── Settings form ───────────────────────────────────────────────────────────
    const [newName, setNewName]             = useState('');
    const [currentPw, setCurrentPw]         = useState('');
    const [newPw, setNewPw]                 = useState('');
    const [confirmPw, setConfirmPw]         = useState('');
    const [isUpdatingName, setIsUpdatingName]   = useState(false);
    const [isUpdatingPw, setIsUpdatingPw]       = useState(false);
    const [pwCriteria, setPwCriteria] = useState({
        length: false, uppercase: false, lowercase: false, number: false, specialChar: false,
    });

    const isMyProfile = useMemo(
        () => !!currentUser && currentUser.Email.toLowerCase() === email.toLowerCase(),
        [currentUser, email]
    );

    // ── Load data ───────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                let user: Account;
                let allArticles: ScientificArticle[];

                if (isMyProfile && currentUser) {
                    user = currentUser;
                    allArticles = await fetchArticles();
                } else {
                    const [foundUser, arts] = await Promise.all([
                        getAccountByEmail(email),
                        fetchArticles(),
                    ]);
                    if (!foundUser) {
                        if (!cancelled) setError('Không tìm thấy người dùng.');
                        return;
                    }
                    user = foundUser;
                    allArticles = arts;
                }

                if (cancelled) return;
                setProfileUser(user);
                setNewName(user['Tên tài khoản']);
                setUserArticles(
                    sortArticles(
                        allArticles.filter(
                            (a: ScientificArticle) =>
                                a.SubmitterEmail.toLowerCase() === email.toLowerCase()
                        )
                    )
                );
            } catch {
                if (!cancelled) setError('Không thể tải dữ liệu hồ sơ.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [email, currentUser?.Email]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived stats ───────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total:    userArticles.length,
        approved: userArticles.filter(a => a.Status === 'Approved').length,
        pending:  userArticles.filter(a => a.Status === 'Pending').length,
        rejected: userArticles.filter(a => a.Status === 'Rejected').length,
    }), [userArticles]);

    const totalPages = Math.ceil(stats.total / ARTICLES_PER_PAGE);
    const paginatedArticles = useMemo(
        () => userArticles.slice(
            (articlePage - 1) * ARTICLES_PER_PAGE,
            articlePage * ARTICLES_PER_PAGE
        ),
        [userArticles, articlePage]
    );

    // ── Password helpers ────────────────────────────────────────────────────────
    const validatePw = useCallback((pass: string) => {
        const c = {
            length:      pass.length >= 8,
            uppercase:   /[A-Z]/.test(pass),
            lowercase:   /[a-z]/.test(pass),
            number:      /[0-9]/.test(pass),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
        setPwCriteria(c);
        return Object.values(c).every(Boolean);
    }, []);

    const handleNewPwChange = (v: string) => { setNewPw(v); validatePw(v); };

    // ── Submit handlers ─────────────────────────────────────────────────────────
    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMyProfile || !currentUser) return;
        const trimmed = newName.trim();
        if (trimmed.length < 3) {
            addToast('Tên phải có ít nhất 3 ký tự.', 'error');
            return;
        }
        if (trimmed === currentUser['Tên tài khoản']) {
            addToast('Tên mới phải khác tên cũ.', 'error');
            return;
        }
        setIsUpdatingName(true);
        await updateUsername(trimmed);
        setIsUpdatingName(false);
    };

    const handlePwSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMyProfile) return;
        if (newPw !== confirmPw) { addToast('Mật khẩu xác nhận không khớp.', 'error'); return; }
        if (!validatePw(newPw))  { addToast('Mật khẩu chưa đủ mạnh.', 'error'); return; }
        setIsUpdatingPw(true);
        const res = await updatePassword(currentPw, newPw);
        setIsUpdatingPw(false);
        if (res.success) {
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
            setPwCriteria({ length: false, uppercase: false, lowercase: false, number: false, specialChar: false });
        } else {
            setCurrentPw('');
        }
    };

    const handleAvatarSuccess = async (newUrl: string) => {
        if (profileUser) setProfileUser({ ...profileUser, AvatarURL: newUrl });
        await refreshCurrentUser();
    };

    // ── Loading ─────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="w-11 h-11 rounded-full border-4 border-emerald-100 border-t-emerald-500"
                />
                <p className="text-sm font-semibold text-gray-400">Đang tải hồ sơ…</p>
            </div>
        </div>
    );

    // ── Error ───────────────────────────────────────────────────────────────────
    if (error || !profileUser) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-3xl border-2 border-red-100 shadow-xl p-10 text-center"
            >
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-lg font-black text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
                <p className="text-sm text-gray-400">{error ?? 'Không thể hiển thị hồ sơ người dùng.'}</p>
            </motion.div>
        </div>
    );

    const avatarLetter = profileUser['Tên tài khoản'].charAt(0).toUpperCase();
    const pwStrength   = Object.values(pwCriteria).filter(Boolean).length;
    const pwBarColor   = pwStrength <= 2 ? 'bg-red-400' : pwStrength <= 3 ? 'bg-amber-400' : 'bg-emerald-500';

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">

            {/* ══════════ HERO ══════════ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-800 to-teal-900 pt-12 pb-32 px-4">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }}
                    />
                </div>

                <div className="relative z-40 max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">

                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="relative shrink-0"
                        >
                            {/*
                             * AvatarUploader handles the upload UI (edit button, etc.).
                             * We pass the converted URL so it renders the image correctly.
                             */}
                            <AvatarUploader
                                email={profileUser.Email}
                                currentAvatarUrl={convertGoogleDriveUrl(profileUser.AvatarURL ?? '')}
                                fallbackLetter={avatarLetter}
                                isEditable={isMyProfile}
                                onSuccess={handleAvatarSuccess}
                            />
                        </motion.div>

                        {/* Name / role */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1 text-center sm:text-left"
                        >
                            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                                <Shield className="w-3 h-3" />
                                {profileUser['Vai trò']}
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow mb-1">
                                {profileUser['Tên tài khoản']}
                            </h1>
                            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-white/60 text-sm">
                                <Mail className="w-3.5 h-3.5" />
                                {profileUser.Email}
                            </p>
                        </motion.div>

                        {/* Hero stat cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-3 shrink-0"
                        >
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-md">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">Tài liệu</p>
                                    <p className="text-2xl font-black text-white">{stats.total}</p>
                                </div>
                            </div>
                            {isMyProfile && (
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                                        <Wallet className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">Số dư</p>
                                        <p className="text-2xl font-black text-white">
                                            {(profileUser.Money || 0).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div className="max-w-6xl mx-auto px-4 -mt-20 pb-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ── LEFT SIDEBAR ── */}
                    <aside className="lg:col-span-3 space-y-4">

                        {/* Profile card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
                            <div className="p-5">
                                {/* Mini avatar preview in sidebar */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-green-600 shrink-0 flex items-center justify-center">
                                        <AvatarImage
                                            avatarUrl={profileUser.AvatarURL}
                                            fallbackLetter={avatarLetter}
                                            className="w-10 h-10 rounded-full text-sm"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">{profileUser['Tên tài khoản']}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{profileUser.Email}</p>
                                    </div>
                                </div>
                                <div className="space-y-0 text-xs divide-y divide-gray-50">
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" /> Vai trò
                                        </span>
                                        <span className="font-bold text-gray-700">{profileUser['Vai trò']}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> Đã đăng
                                        </span>
                                        <span className="font-bold text-gray-700">{stats.total} bài</span>
                                    </div>
                                    {isMyProfile && (
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-gray-400 flex items-center gap-1.5">
                                                <Wallet className="w-3.5 h-3.5" /> Số dư
                                            </span>
                                            <span className="font-bold text-emerald-600">
                                                {(profileUser.Money || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                        >
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5" /> Thống kê
                            </h3>
                            <div className="space-y-3">
                                {([
                                    { label: 'Đã duyệt', val: stats.approved, color: 'bg-emerald-500', text: 'text-emerald-600' },
                                    { label: 'Chờ duyệt', val: stats.pending,  color: 'bg-amber-400',   text: 'text-amber-600'  },
                                    { label: 'Từ chối',   val: stats.rejected, color: 'bg-red-400',     text: 'text-red-500'    },
                                ] as const).map(s => (
                                    <div key={s.label}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                                            <span className={`text-xs font-black ${s.text}`}>{s.val}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.total > 0 ? (s.val / stats.total) * 100 : 0}%` }}
                                                transition={{ delay: 0.45, duration: 0.7, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${s.color}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Nav — only own profile */}
                        {isMyProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3"
                            >
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-2">Menu</h3>
                                {([
                                    { id: 'articles', label: 'Tài liệu đã đăng', Icon: BookOpen },
                                    { id: 'settings', label: 'Cài đặt tài khoản', Icon: Settings },
                                ] as const).map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all mb-0.5 ${
                                            activeTab === id
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-green-100'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="w-4 h-4 shrink-0" />
                                            {label}
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-opacity ${activeTab === id ? 'opacity-60' : 'opacity-0'}`} />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <main className="lg:col-span-9 space-y-4">

                        {/* Mini stats strip */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                        >
                            {([
                                { label: 'Tổng bài',  val: stats.total,    Icon: FileText,     cls: 'text-blue-600',    bg: 'bg-blue-50'    },
                                { label: 'Đã duyệt',  val: stats.approved, Icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Chờ duyệt', val: stats.pending,  Icon: Clock,        cls: 'text-amber-600',   bg: 'bg-amber-50'   },
                                { label: 'Từ chối',   val: stats.rejected, Icon: XCircle,      cls: 'text-red-500',     bg: 'bg-red-50'     },
                            ] as const).map(({ label, val, Icon, cls, bg }) => (
                                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4 h-4 ${cls}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                                        <p className={`text-xl font-black ${cls}`}>{val}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Tab content */}
                        <AnimatePresence mode="wait">

                            {/* ── ARTICLES TAB ── */}
                            {(!isMyProfile || activeTab === 'articles') && (
                                <motion.section
                                    key="articles"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
                                            Tài liệu đã đăng
                                            <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black">
                                                {stats.total}
                                            </span>
                                        </h2>
                                        {stats.total > 0 && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                {(articlePage - 1) * ARTICLES_PER_PAGE + 1}–
                                                {Math.min(articlePage * ARTICLES_PER_PAGE, stats.total)} / {stats.total}
                                            </span>
                                        )}
                                    </div>

                                    {stats.total > 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <ul className="divide-y divide-gray-50">
                                                <AnimatePresence initial={false}>
                                                    {paginatedArticles.map((article, i) => (
                                                        <motion.li
                                                            key={article.ID}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ delay: i * 0.03 }}
                                                            className="group"
                                                        >
                                                            <Link
                                                                href={`/article/${article.ID}`}
                                                                className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/30 transition-all duration-150"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center shrink-0">
                                                                    <FileText className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 truncate transition-colors mb-1">
                                                                        {article.Title}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                                                            <Tag className="w-2.5 h-2.5" />
                                                                            {article.Category}
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                                                            <Calendar className="w-2.5 h-2.5" />
                                                                            {article.SubmissionDate.split(' ')[0]}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <StatusBadge status={article.Status} />
                                                                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                                                </div>
                                                            </Link>
                                                        </motion.li>
                                                    ))}
                                                </AnimatePresence>
                                            </ul>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50 bg-gray-50/60">
                                                    <button
                                                        onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                                                        disabled={articlePage === 1}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" /> Trước
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setArticlePage(p)}
                                                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                                                    p === articlePage
                                                                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md'
                                                                        : 'text-gray-400 hover:bg-gray-100'
                                                                }`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setArticlePage(p => Math.min(totalPages, p + 1))}
                                                        disabled={articlePage === totalPages}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                                    >
                                                        Sau <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm py-16 text-center">
                                            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                                <BookOpen className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <h3 className="font-black text-gray-800 mb-1">Chưa có tài liệu nào</h3>
                                            <p className="text-sm text-gray-400">
                                                {isMyProfile
                                                    ? 'Bắt đầu chia sẻ kiến thức của bạn ngay hôm nay!'
                                                    : 'Người dùng này chưa đăng tải tài liệu.'}
                                            </p>
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {/* ── SETTINGS TAB ── */}
                            {isMyProfile && activeTab === 'settings' && (
                                <motion.section
                                    key="settings"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-1">
                                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                                        Cài đặt tài khoản
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Change name */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-green-500" />
                                            <div className="p-6">
                                                <h3 className="font-black text-gray-900 text-sm mb-5 flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-emerald-50">
                                                        <Edit3 className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    Đổi tên hiển thị
                                                </h3>
                                                <form onSubmit={handleNameSubmit} className="space-y-4">
                                                    <div>
                                                        <label htmlFor="displayName" className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                                                            Tên mới
                                                        </label>
                                                        <input
                                                            id="displayName"
                                                            type="text"
                                                            value={newName}
                                                            onChange={e => setNewName(e.target.value)}
                                                            placeholder="Nhập tên mới"
                                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:outline-none transition-all"
                                                        />
                                                    </div>

                                                    {newName.trim() && newName.trim() !== currentUser?.['Tên tài khoản'] && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5"
                                                        >
                                                            <UserCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span className="text-xs text-emerald-700">
                                                                Xem trước: <strong>{newName.trim()}</strong>
                                                            </span>
                                                        </motion.div>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        disabled={isUpdatingName}
                                                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-black rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2"
                                                    >
                                                        {isUpdatingName
                                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu…</>
                                                            : <><Save className="w-4 h-4" /> Lưu thay đổi</>
                                                        }
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Change password */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />
                                            <div className="p-6">
                                                <h3 className="font-black text-gray-900 text-sm mb-5 flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-red-50">
                                                        <Lock className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    Đổi mật khẩu
                                                </h3>
                                                <form onSubmit={handlePwSubmit} className="space-y-4">
                                                    <PwField
                                                        id="currentPw"
                                                        label="Mật khẩu hiện tại"
                                                        value={currentPw}
                                                        onChange={setCurrentPw}
                                                        required
                                                    />
                                                    <PwField
                                                        id="newPw"
                                                        label="Mật khẩu mới"
                                                        value={newPw}
                                                        onChange={handleNewPwChange}
                                                        required
                                                    />

                                                    {/* Strength meter */}
                                                    {newPw && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                                                        >
                                                            <div className="flex gap-1 mb-3">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                                                            i < pwStrength ? pwBarColor : 'bg-gray-200'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <ul className="space-y-1">
                                                                <PwRule met={pwCriteria.length}      text="Ít nhất 8 ký tự" />
                                                                <PwRule met={pwCriteria.lowercase}   text="Chữ thường (a-z)" />
                                                                <PwRule met={pwCriteria.uppercase}   text="Chữ hoa (A-Z)" />
                                                                <PwRule met={pwCriteria.number}      text="Chữ số (0-9)" />
                                                                <PwRule met={pwCriteria.specialChar} text="Ký tự đặc biệt (!@#…)" />
                                                            </ul>
                                                        </motion.div>
                                                    )}

                                                    <PwField
                                                        id="confirmPw"
                                                        label="Xác nhận mật khẩu mới"
                                                        value={confirmPw}
                                                        onChange={setConfirmPw}
                                                        required
                                                        error={!!confirmPw && confirmPw !== newPw}
                                                        errorMsg="Mật khẩu không khớp"
                                                    />

                                                    <button
                                                        type="submit"
                                                        disabled={isUpdatingPw}
                                                        className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-black rounded-xl hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2"
                                                    >
                                                        {isUpdatingPw
                                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang đổi…</>
                                                            : <><Lock className="w-4 h-4" /> Đổi mật khẩu</>
                                                        }
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account info read-only */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-gray-50">
                                                <UserCircle2 className="w-4 h-4 text-gray-500" />
                                            </div>
                                            Thông tin tài khoản
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {([
                                                { label: 'Email',      val: profileUser.Email,       Icon: Mail       },
                                                { label: 'Vai trò',    val: profileUser['Vai trò'],  Icon: Shield     },
                                                { label: 'Trạng thái', val: 'Đang hoạt động',        Icon: TrendingUp },
                                            ] as const).map(({ label, val, Icon }) => (
                                                <div key={label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1.5">
                                                        <Icon className="w-3 h-3" /> {label}
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-800 truncate">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}