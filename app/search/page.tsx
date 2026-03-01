'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    fetchCourses, 
    fetchArticles, 
    fetchPremiumArticles, 
    fetchAllQuestionsFromBank 
} from '@/services/googleSheetService';
import type { Course, ScientificArticle, MedicalQuestion } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { BookOpen, FileText, HelpCircle, Search, ArrowRight, Loader2 } from 'lucide-react';

// Separate component to use useSearchParams
function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [articles, setArticles] = useState<ScientificArticle[]>([]);
    const [questions, setQuestions] = useState<MedicalQuestion[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'articles' | 'questions'>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!query) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch in parallel
                const [coursesData, articlesData, premiumArticlesData, questionsData] = await Promise.all([
                    fetchCourses().catch(() => []),
                    fetchArticles().catch(() => []),
                    fetchPremiumArticles().catch(() => []),
                    fetchAllQuestionsFromBank().catch(() => [])
                ]);

                // Combine articles
                const allArticles = [...articlesData, ...premiumArticlesData];

                // Filter Courses
                const filteredCourses = coursesData.filter(c => 
                    c.ID.includes(query) || 
                    c.Title.toLowerCase().includes(query.toLowerCase()) ||
                    c.Category.toLowerCase().includes(query.toLowerCase())
                );

                // Filter Articles
                const filteredArticles = allArticles.filter(a => 
                    a.ID.includes(query) || 
                    a.Title.toLowerCase().includes(query.toLowerCase()) ||
                    a.Category.toLowerCase().includes(query.toLowerCase()) ||
                    a.Authors.toLowerCase().includes(query.toLowerCase())
                );

                // Filter Questions (Simple filter on Question Text or ID)
                const filteredQuestions = questionsData.filter(q => 
                    q.ID.includes(query) || 
                    q.Question_Text.toLowerCase().includes(query.toLowerCase())
                );

                setCourses(filteredCourses);
                setArticles(filteredArticles);
                setQuestions(filteredQuestions);

            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [query]);

    const ResultSection = ({ title, icon, count, children }: { title: string, icon: string, count: number, children: React.ReactNode }) => {
        if (count === 0) return null;
        return (
            <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Icon name={icon} className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{title} ({count})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children}
                </div>
            </div>
        );
    };

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Nhập từ khóa để tìm kiếm</h2>
                <p className="text-gray-500">Tìm kiếm khoá học, tài liệu, câu hỏi và nhiều hơn nữa...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Kết quả tìm kiếm</h1>
                <p className="text-gray-600">
                    Hiển thị kết quả cho &quot;<span className="font-bold text-blue-600">{query}</span>&quot;
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'courses', label: `Khoá học (${courses.length})` },
                    { id: 'articles', label: `Tài liệu (${articles.length})` },
                    { id: 'questions', label: `Câu hỏi (${questions.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="h-40 bg-gray-100 rounded-xl"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {courses.length === 0 && articles.length === 0 && questions.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy kết quả nào</h3>
                            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác hoặc ID cụ thể</p>
                        </div>
                    )}

                    {(activeTab === 'all' || activeTab === 'courses') && (
                        <ResultSection title="Khoá học" icon="book" count={courses.length}>
                            {courses.map(course => (
                                <Link 
                                    key={course.ID} 
                                    href={`/courses/${course.ID}`}
                                    className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                                            {course.Category}
                                        </span>
                                        <span className="text-xs font-mono text-gray-400">#{course.ID}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {course.Title}
                                    </h3>
                                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-sm font-bold text-blue-600">
                                            {course.Price === 0 ? 'Miễn phí' : `${course.Price.toLocaleString()}đ`}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </ResultSection>
                    )}

                    {(activeTab === 'all' || activeTab === 'articles') && (
                        <ResultSection title="Tài liệu & Sách ID" icon="file-text" count={articles.length}>
                            {articles.map(article => (
                                <Link 
                                    key={article.ID} 
                                    href={`/article/${article.ID}`}
                                    className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                                            article.ID.startsWith('9') 
                                            ? 'bg-amber-50 text-amber-700' 
                                            : 'bg-green-50 text-green-700'
                                        }`}>
                                            {article.ID.startsWith('9') ? 'Premium' : 'Tài liệu'}
                                        </span>
                                        <span className="text-xs font-mono text-gray-400">#{article.ID}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {article.Title}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                        {article.Authors}
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Icon name="eye" className="w-3 h-3" />
                                            Xem chi tiết
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </ResultSection>
                    )}

                    {(activeTab === 'all' || activeTab === 'questions') && (
                        <ResultSection title="Câu hỏi ôn tập" icon="help-circle" count={questions.length}>
                            {questions.map(question => (
                                <div 
                                    key={question.ID} 
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-md">
                                            Câu hỏi
                                        </span>
                                        <span className="text-xs font-mono text-gray-400">#{question.ID}</span>
                                    </div>
                                    <p className="font-medium text-gray-800 mb-4 line-clamp-3">
                                        {question.Question_Text}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div className="truncate">A. {question.Option_A}</div>
                                        <div className="truncate">B. {question.Option_B}</div>
                                        <div className="truncate">C. {question.Option_C}</div>
                                        <div className="truncate">D. {question.Option_D}</div>
                                    </div>
                                </div>
                            ))}
                        </ResultSection>
                    )}
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}} />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
