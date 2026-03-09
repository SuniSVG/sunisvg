'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Search, 
    History, 
    TrendingUp, 
    ShoppingBag, 
    Bookmark, 
    Filter, 
    Clock, 
    HelpCircle, 
    Users, 
    ArrowRight, 
    Trophy,
    CheckCircle2,
    ChevronRight,
    Star,
    RotateCcw,
    Flame,
    BookOpen,
    Target,
    BarChart2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllQuizzes, fetchAccounts } from '@/services/googleSheetService';
import type { UserQuiz, Account } from '@/types';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip as RechartsTooltip 
} from 'recharts';
import MathRenderer from '@/components/shared/MathRenderer';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SUBJECT_EXAMS: UserQuiz[] = [];

// ─── ExamCard ───────────────────────────────────────────────────────────────

const ExamCard = ({ quiz, isExpanded, onToggleExpand }: { quiz: UserQuiz; isExpanded: boolean; onToggleExpand: () => void }) => {
    const isFree = quiz.isFree;
    const questionCount = quiz.questions.length;
    const timeLimit = quiz.timeLimit || 0;

    // Tính toán số liệu thực tế từ mảng results
    const results = Array.isArray(quiz.results) ? quiz.results : [];
    const realAttempts = results.length;
    
    const totalScore = results.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const avgScore = realAttempts > 0 ? (totalScore / realAttempts).toFixed(1) : null;

    const topResults = useMemo(() => {
        const res = Array.isArray(quiz.results) ? quiz.results : [];
        return [...res].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, 7);
    }, [quiz.results]);

    const formatTime = (minutes: number): string => {
        if (!minutes) return 'Không giới hạn';
        if (minutes >= 60) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return m > 0 ? `${h} tiếng ${m} phút` : `${h} tiếng`;
        }
        return `${minutes} phút`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full shadow-sm"
        >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${isFree ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`} />

            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${isFree ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        <Target className="w-5 h-5" />
                    </div>
                    {!isFree && (
                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider">
                            PREMIUM
                        </span>
                    )}
                    {isFree && (
                        <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-green-100">
                            MIỄN PHÍ
                        </span>
                    )}
                </div>

                <h3 className={`font-bold text-base text-gray-900 mb-2 line-clamp-2 transition-colors ${isFree ? 'group-hover:text-green-600' : 'group-hover:text-orange-600'}`}>
                    <MathRenderer text={quiz.title} />
                </h3>

                <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                    <MathRenderer text={quiz.description || 'Chưa có mô tả cho bộ đề này.'} />
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-600">{formatTime(timeLimit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-600">{questionCount} câu</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-600">{realAttempts.toLocaleString()} lượt</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        {avgScore !== null ? (
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                        )}
                        <span className="text-xs font-medium text-gray-600">
                            {avgScore !== null ? `TB: ${avgScore}đ` : (quiz.difficulty || 'TB')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 space-y-2">
                {isFree ? (
                    <>
                        <Link
                            href={`/exams/take/${quiz.quizId}`}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-100 text-sm"
                        >
                            Vào thi ngay
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={onToggleExpand}
                            disabled={topResults.length === 0}
                            className="w-full bg-gray-50 text-gray-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <BarChart2 className="w-4 h-4" />
                            {isExpanded ? 'Ẩn xếp hạng' : 'Xem xếp hạng'}
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <span className="text-[10px] text-gray-300 line-through block">{(quiz.price! * 1.5).toLocaleString()}đ</span>
                            <span className="text-base font-black text-orange-600">{(quiz.price || 0).toLocaleString()}đ</span>
                        </div>
                        <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-2.5 px-5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-100 text-sm">
                            Mua đề
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                    >
                        <div className="p-4">
                            <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Top kết quả cao nhất
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold">#</th>
                                            <th className="px-4 py-3 text-left font-bold">Tên</th>
                                            <th className="px-4 py-3 text-center font-bold">Điểm</th>
                                            <th className="px-4 py-3 text-right font-bold">Ngày</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topResults.map((res, index) => {
                                            const rankColor = index === 0 ? 'text-yellow-700 bg-yellow-100 ring-2 ring-yellow-50' : 
                                                            index === 1 ? 'text-slate-700 bg-slate-100 ring-2 ring-slate-50' : 
                                                            index === 2 ? 'text-orange-700 bg-orange-100 ring-2 ring-orange-50' : 'text-gray-500 bg-gray-50';
                                            return (
                                                <tr key={index} className={`transition-colors ${index < 3 ? 'bg-opacity-30 ' + (index === 0 ? 'bg-yellow-50/30' : index === 1 ? 'bg-slate-50/30' : 'bg-orange-50/30') : 'hover:bg-gray-50'}`}>
                                                    <td className="px-4 py-3 font-bold">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${rankColor}`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[100px]">
                                                        {(res as any).name && (res as any).name !== 'Ẩn danh' ? (res as any).name : (res.participantEmail?.split('@')[0] || 'Ẩn danh')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-bold text-green-600">{res.score}</span>
                                                        <span className="text-gray-400">/{res.totalQuestions || quiz.questions.length}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-500">
                                                        {res.timestamp ? new Date(res.timestamp).toLocaleDateString('vi-VN') : '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Sidebar helpers ─────────────────────────────────────────────────────────

const SidebarLink = ({ icon: IconComp, label, active = false, count, onClick }: {
    icon: any; label: string; active?: boolean; count?: number; onClick?: () => void;
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
            active
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-100'
                : 'text-gray-600 hover:bg-gray-50'
        }`}
    >
        <div className="flex items-center gap-3">
            <IconComp className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
            <span className="font-semibold text-sm">{label}</span>
        </div>
        {count !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
            </span>
        )}
    </button>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ExamsDashboard() {
    const { currentUser } = useAuth();
    const [quizzes, setQuizzes] = useState<UserQuiz[]>([]);
    const [leaderboard, setLeaderboard] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'grade10' | 'grade11' | 'grade12' | 'mock' | 'premium' | 'tsa' | 'hsa' | 'ielts' | 'sunisvg'>('all');
    const [activeView, setActiveView] = useState<'dashboard' | 'history'>('dashboard');
    const [selectedGrade, setSelectedGrade] = useState('Tất cả khối');
    const [selectedSubject, setSelectedSubject] = useState('Tất cả môn');
    const [selectedDifficulty, setSelectedDifficulty] = useState('Tất cả');
    const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

    const toggleResults = (quizId: string) => {
        setExpandedQuizId(prev => prev === quizId ? null : quizId);
    };

    useEffect(() => {
        document.title = "Luyện đề thi Online - Ngân hàng đề thi THPT, HSA, TSA | SuniSVG";
        
        const metaDesc = document.querySelector("meta[name='description']") || document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        metaDesc.setAttribute('content', 'Hệ thống luyện đề thi online miễn phí và premium. Luyện tập với hàng ngàn câu hỏi trắc nghiệm các môn Toán, Lý, Hóa, Anh, Sinh, bám sát cấu trúc đề thi THPT Quốc Gia, HSA, TSA.');
        document.head.appendChild(metaDesc);

        const metaKeywords = document.querySelector("meta[name='keywords']") || document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', 'luyện đề online, thi thử online, đề thi thpt quốc gia, đề thi hsa, đề thi tsa, ngân hàng câu hỏi, trắc nghiệm online');
        document.head.appendChild(metaKeywords);


        const loadData = async () => {
            setIsLoading(true);
            try {
                const [allQuizzes, allAccounts] = await Promise.all([
                    fetchAllQuizzes().catch(() => []), // Nếu lỗi tải sheet, vẫn trả về mảng rỗng để hiện đề có sẵn
                    fetchAccounts().catch(() => [])
                ]);

                const uniqueFetchedMap = new Map();
                allQuizzes.forEach(q => {
                    if (q.quizId) uniqueFetchedMap.set(String(q.quizId).trim(), q);
                });
                MOCK_SUBJECT_EXAMS.forEach(m => uniqueFetchedMap.delete(String(m.quizId).trim()));
                setQuizzes([...MOCK_SUBJECT_EXAMS, ...Array.from(uniqueFetchedMap.values()) as UserQuiz[]]);
                const sortedAccounts = [...allAccounts]
                    .sort((a, b) => (b['Tổng số câu hỏi đã làm đúng'] || 0) - (a['Tổng số câu hỏi đã làm đúng'] || 0))
                    .slice(0, 5);
                setLeaderboard(sortedAccounts);
            } catch (error) {
                console.error('Failed to load exams data:', error);
                // Nếu lỗi toàn bộ, vẫn hiện đề có sẵn
                setQuizzes(MOCK_SUBJECT_EXAMS);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredQuizzes = useMemo(() => {
        let result = quizzes;
        if (searchQuery) {
            result = result.filter(q =>
                q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedGrade !== 'Tất cả khối') {
            result = result.filter(q =>
                q.category?.toLowerCase().includes(selectedGrade.toLowerCase()) ||
                q.title.toLowerCase().includes(selectedGrade.toLowerCase())
            );
        }
        if (selectedSubject !== 'Tất cả môn') {
            result = result.filter(q =>
                q.category?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
                q.title.toLowerCase().includes(selectedSubject.toLowerCase())
            );
        }
        if (selectedDifficulty !== 'Tất cả') {
            result = result.filter(q => {
                const qCount = q.questions.length;
                if (selectedDifficulty === 'Dễ') return qCount < 10;
                if (selectedDifficulty === 'Trung bình') return qCount >= 10 && qCount <= 40;
                if (selectedDifficulty === 'Khó') return qCount > 40;
                return true;
            });
        }
        switch (activeTab) {
            case 'grade10': result = result.filter(q => q.category?.toLowerCase().includes('lớp 10') || q.category?.toLowerCase().includes('khối 10')); break;
            case 'grade11': result = result.filter(q => q.category?.toLowerCase().includes('lớp 11') || q.category?.toLowerCase().includes('khối 11')); break;
            case 'grade12': result = result.filter(q => q.category?.toLowerCase().includes('lớp 12') || q.category?.toLowerCase().includes('khối 12')); break;
            case 'mock': result = result.filter(q => q.category?.toLowerCase().includes('thi thử') || q.title.toLowerCase().includes('thi thử')); break;
            case 'premium': result = result.filter(q => !q.isFree); break;
            case 'tsa': result = result.filter(q => q.title.toLowerCase().includes('tsa') || q.category?.toLowerCase().includes('tsa')); break;
            case 'hsa': result = result.filter(q => q.title.toLowerCase().includes('hsa') || q.category?.toLowerCase().includes('hsa')); break;
            case 'ielts': result = result.filter(q => q.title.toLowerCase().includes('ielts') || q.category?.toLowerCase().includes('ielts')); break;
            case 'sunisvg': result = result.filter(q => q.title.toLowerCase().includes('sunisvg') || q.category?.toLowerCase().includes('sunisvg')); break;
        }
        return result;
    }, [quizzes, searchQuery, activeTab, selectedGrade, selectedSubject, selectedDifficulty]);

    const userHistory = useMemo(() => {
        if (!currentUser) return [];
        const history: { quiz: UserQuiz; result: any }[] = [];
        quizzes.forEach(q => {
            if (q.results && Array.isArray(q.results)) {
                const userResults = q.results.filter(r => r.participantEmail?.toLowerCase() === currentUser.Email.toLowerCase());
                userResults.forEach(result => history.push({ quiz: q, result }));
            }
        });
        return history.sort((a, b) => {
            const tA = a.result.timestamp ? new Date(a.result.timestamp).getTime() : 0;
            const tB = b.result.timestamp ? new Date(b.result.timestamp).getTime() : 0;
            return tB - tA;
        });
    }, [quizzes, currentUser]);

    const statsData = useMemo(() => {
        if (!currentUser) return [];
        const correct = currentUser['Tổng số câu hỏi đã làm đúng'] || 0;
        const total = currentUser['Tổng số câu hỏi đã làm'] || 0;
        return [
            { name: 'Đúng', value: correct, color: '#22c55e' },
            { name: 'Sai', value: Math.max(total - correct, 0), color: '#f97316' },
        ];
    }, [currentUser]);

    const TABS = [
        { id: 'all', label: 'Tất cả' },
        { id: 'grade10', label: 'Khối 10' },
        { id: 'grade11', label: 'Khối 11' },
        { id: 'grade12', label: 'Khối 12' },
        { id: 'mock', label: 'Thi thử' },
        { id: 'tsa', label: 'TSA' },
        { id: 'hsa', label: 'HSA' },
        { id: 'ielts', label: 'IELTS' },
        { id: 'sunisvg', label: 'Sunisvg' },
        { id: 'premium', label: '⭐ Premium' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-800 to-green-900 pt-14 pb-8 px-4">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                {/* dot grid */}
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-white/15">
                            <Flame className="w-3.5 h-3.5 text-orange-300" />
                            KỲ THI THỬ TOÀN QUỐC 2026
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                            Chinh Phục Mọi{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-400">
                                Kỳ Thi
                            </span>
                        </h1>
                        <p className="text-emerald-100/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Hệ thống luyện đề thông minh với hơn 10,000+ câu hỏi bám sát cấu trúc đề thi chính thức của Bộ Giáo dục.
                        </p>
                    </motion.div>

                    {/* Search bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-2xl p-1.5 flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-3 px-4">
                                <Search className="text-gray-400 w-5 h-5 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Tìm đề thi, môn học..."
                                    className="w-full py-2.5 text-base focus:outline-none text-gray-800 placeholder-gray-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-200 text-sm whitespace-nowrap">
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Left Sidebar ── */}
                    <aside className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">

                            {/* Nav */}
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> Cá nhân
                            </p>
                            <div className="space-y-1 mb-6">
                                <SidebarLink icon={TrendingUp} label="Bảng điều khiển" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                                <SidebarLink icon={History} label="Lịch sử thi" active={activeView === 'history'} onClick={() => setActiveView('history')} />
                                <SidebarLink icon={ShoppingBag} label="Đề thi đã mua" count={0} />
                                <SidebarLink icon={Bookmark} label="Đề đang lưu" count={0} />
                            </div>

                            <div className="border-t border-gray-100 pt-5">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5" /> Bộ lọc
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Khối lớp</label>
                                        <select
                                            value={selectedGrade}
                                            onChange={(e) => setSelectedGrade(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        >
                                            <option>Tất cả khối</option>
                                            <option>Lớp 12</option>
                                            <option>Lớp 11</option>
                                            <option>Lớp 10</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Môn học</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        >
                                            <option>Tất cả môn</option>
                                            <option>Toán học</option>
                                            <option>Vật lý</option>
                                            <option>Hóa học</option>
                                            <option>Tiếng Anh</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Độ khó</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['Tất cả', 'Dễ', 'Trung bình', 'Khó'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setSelectedDifficulty(d)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                        selectedDifficulty === d
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="lg:col-span-6 space-y-5">

                        {/* Quick Stats */}
                        {currentUser ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Bài thi</p>
                                        <p className="text-xl font-black text-gray-900">{userHistory.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">TB điểm</p>
                                        <p className="text-xl font-black text-gray-900">
                                            {userHistory.length > 0
                                                ? Math.round(userHistory.reduce((acc, curr) => acc + (curr.result.score || 0), 0) / userHistory.length)
                                                : 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Thứ hạng</p>
                                        <p className="text-xl font-black text-gray-900">
                                            #{leaderboard.findIndex(u => u.Email === currentUser.Email) + 1 || '--'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Đăng nhập để theo dõi tiến độ</p>
                                        <p className="text-xs text-gray-500">Lưu lịch sử thi, xếp hạng và thống kê cá nhân.</p>
                                    </div>
                                </div>
                                <Link href="/login" className="shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm">
                                    Đăng nhập
                                </Link>
                            </div>
                        )}

                        {activeView === 'dashboard' ? (
                            <>
                                {/* Tabs */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
                                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                                        {TABS.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                                    activeTab === tab.id
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-100'
                                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Exam Grid */}
                                {isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <AnimatePresence mode="popLayout">
                                            {filteredQuizzes.map(quiz => (
                                                <ExamCard 
                                                    key={quiz.quizId} 
                                                    quiz={quiz} 
                                                    isExpanded={expandedQuizId === quiz.quizId}
                                                    onToggleExpand={() => toggleResults(quiz.quizId)}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        {filteredQuizzes.length === 0 && (
                                            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Search className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <h3 className="text-base font-bold text-gray-800">Không tìm thấy đề thi</h3>
                                                <p className="text-sm text-gray-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* History view */
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <h2 className="text-lg font-black text-gray-900 mb-1">Lịch sử làm bài</h2>
                                    <p className="text-gray-400 text-sm">Theo dõi tiến trình và kết quả các bài thi đã thực hiện.</p>
                                </div>

                                {userHistory.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                        <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <h3 className="text-base font-bold text-gray-800">Chưa có lịch sử thi</h3>
                                        <p className="text-sm text-gray-400 mb-5 mt-1">Bạn chưa thực hiện bài thi nào trong hệ thống.</p>
                                        <button
                                            onClick={() => setActiveView('dashboard')}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-sm shadow-md shadow-green-100"
                                        >
                                            Khám phá đề thi
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {userHistory.map(({ quiz, result }, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                                            >
                                                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                                                    result.score >= 80 ? 'bg-green-50 text-green-600' :
                                                    result.score >= 50 ? 'bg-orange-50 text-orange-600' :
                                                    'bg-red-50 text-red-500'
                                                }`}>
                                                    <span className="text-xl font-black leading-none">{result.score}</span>
                                                    <span className="text-[8px] font-bold uppercase mt-0.5">Điểm</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate text-sm">{quiz.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(result.timestamp).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className={`text-xs font-bold flex items-center gap-1 ${result.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {result.score >= 50 ? 'Đạt' : 'Chưa đạt'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/exams/take/${quiz.quizId}`}
                                                    className="p-2.5 bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all shrink-0"
                                                    aria-label={`Làm lại bài thi ${quiz.title}`}
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>

                    {/* ── Right Sidebar ── */}
                    <aside className="lg:col-span-3 space-y-5">

                        {/* Leaderboard */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Bảng xếp hạng tuần
                            </h4>
                            <div className="space-y-3">
                                {leaderboard.map((user, idx) => (
                                    <div key={user.Email} className="flex items-center gap-3 group cursor-pointer">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center font-bold text-green-700 text-sm border border-green-100 shrink-0">
                                            {user['Tên tài khoản'].charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-green-600 transition-colors">
                                                {user['Tên tài khoản']}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {(user['Tổng số câu hỏi đã làm đúng'] || 0).toLocaleString()} câu đúng
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 py-2.5 text-xs font-bold text-green-600 hover:bg-green-50 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* My Progress */}
                        {currentUser && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    Tiến độ của tôi
                                </h4>
                                <div className="h-44 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statsData} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={4} dataKey="value">
                                                {statsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-gray-800">
                                            {(currentUser['Tổng số câu hỏi đã làm'] || 0) > 0
                                                ? Math.round(((currentUser['Tổng số câu hỏi đã làm đúng'] || 0) / (currentUser['Tổng số câu hỏi đã làm'] || 1)) * 100)
                                                : 0}%
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Chính xác</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <span className="text-[9px] font-bold text-green-600 uppercase block mb-1">Đúng</span>
                                        <span className="text-lg font-black text-green-700">{currentUser['Tổng số câu hỏi đã làm đúng'] || 0}</span>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                        <span className="text-[9px] font-bold text-orange-600 uppercase block mb-1">Tổng</span>
                                        <span className="text-lg font-black text-orange-700">{currentUser['Tổng số câu hỏi đã làm'] || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4 text-orange-500" />
                                Hoạt động gần đây
                            </h4>
                            <div className="space-y-3">
                                {userHistory.slice(0, 3).map(({ quiz, result }, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-green-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{quiz.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {result.score} điểm · {new Date(result.timestamp).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {userHistory.length === 0 && (
                                    <p className="text-xs text-gray-300 italic">Chưa có hoạt động nào.</p>
                                )}
                            </div>
                        </div>

                        {/* Study Tips */}
                        <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-800 rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 relative">
                                <BookOpen className="w-4 h-4 text-orange-300" />
                                Mẹo học tập
                            </h4>
                            <ul className="space-y-3 relative">
                                {[
                                    'Luyện đề thử định kỳ để quen với áp lực thời gian.',
                                    'Xem lại câu sai để hiểu rõ lỗ hổng kiến thức.',
                                    'Dùng MathRenderer để đọc công thức toán rõ hơn.',
                                ].map((tip, i) => (
                                    <li key={i} className="text-xs text-emerald-100 flex gap-2">
                                        <span className="font-black text-orange-300 shrink-0">0{i + 1}.</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full mt-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all border border-white/10 relative">
                                Xem thêm bí kíp
                            </button>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
}