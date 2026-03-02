'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
    ArrowLeft, 
    Target, 
    Clock, 
    HelpCircle, 
    Users, 
    Star, 
    ArrowRight,
    Search,
    TrendingUp
} from 'lucide-react';
import { fetchAllQuizzes } from '@/services/googleSheetService';
import type { UserQuiz } from '@/types';
import MathRenderer from '@/components/shared/MathRenderer';

// --- Reusing ExamCard Component (Local version for independence) ---
const ExamCard = ({ quiz }: { quiz: UserQuiz }) => {
    const isFree = quiz.isFree;
    const questionCount = quiz.questions.length;
    const timeLimit = quiz.timeLimit || 0;
    
    // Tính toán số liệu thực tế từ mảng results
    const results = Array.isArray(quiz.results) ? quiz.results : [];
    const realAttempts = results.length;
    
    // Tính điểm trung bình (nếu có lượt thi)
    const totalScore = results.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const avgScore = realAttempts > 0 ? (totalScore / realAttempts).toFixed(1) : null;

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
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full shadow-sm"
        >
            <div className={`h-1 w-full ${isFree ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`} />
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${isFree ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        <Target className="w-5 h-5" />
                    </div>
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

            <div className="px-5 pb-5">
                <Link
                    href={`/exams/take/${quiz.quizId}`}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-100 text-sm"
                >
                    Vào thi ngay
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
};

function SubjectExamsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const prefix = searchParams.get('prefix');
    const title = searchParams.get('title') || 'Danh sách đề thi';

    const [quizzes, setQuizzes] = useState<UserQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!prefix) {
            router.push('/exams');
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const allQuizzes = await fetchAllQuizzes();
                // Lọc các quiz có ID bắt đầu bằng prefix (ví dụ '99999991')
                const filtered = allQuizzes.filter(q => 
                    q.quizId && String(q.quizId).trim().startsWith(prefix)
                );
                setQuizzes(filtered);
            } catch (error) {
                console.error('Failed to load quizzes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [prefix, router]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Đề thi môn {title}</h1>
                        <p className="text-xs text-gray-500">
                            {loading ? 'Đang tải...' : `Tìm thấy ${quizzes.length} đề thi phù hợp`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map(quiz => (
                            <ExamCard key={quiz.quizId} quiz={quiz} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đề thi nào</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Hiện tại chưa có đề thi nào cho môn {title} với mã định danh bắt đầu bằng {prefix}.
                        </p>
                        <Link 
                            href="/exams"
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                        >
                            Khám phá tất cả đề thi
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SubjectExamsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SubjectExamsContent />
        </Suspense>
    );
}