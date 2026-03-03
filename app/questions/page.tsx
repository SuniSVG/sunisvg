'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Database, Filter } from 'lucide-react';
import { fetchAllQuestionsFromBank } from '@/services/googleSheetService';
import MathRenderer from '@/components/shared/MathRenderer';
import type { MedicalQuestion } from '@/types';

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState<MedicalQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchAllQuestionsFromBank();
                setQuestions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = questions.filter(q => 
        q.Question_Text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(q.ID).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.Specialty && q.Specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-[#F8FAF8] py-12 px-4 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-600 mb-4 shadow-sm">
                        <Database className="w-4 h-4 text-blue-500" />
                        Ngân hàng dữ liệu
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        Tra cứu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Câu hỏi</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Tìm kiếm và xem chi tiết hàng ngàn câu hỏi trắc nghiệm từ các môn học khác nhau.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-2 mb-8 sticky top-4 z-30 max-w-3xl mx-auto">
                    <div className="flex items-center">
                        <div className="pl-4 text-gray-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Nhập nội dung câu hỏi, ID hoặc môn học..." 
                            className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button className="hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition-colors text-sm mr-1">
                            <Filter className="w-4 h-4" />
                            Bộ lọc
                        </button>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <span className="text-sm font-bold text-gray-500">
                                Tìm thấy {filtered.length} kết quả
                            </span>
                        </div>

                        {paginated.map(q => (
                            <Link 
                                key={q.ID} 
                                href={`/questions/${q.ID}`}
                                className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex items-start gap-5">
                                    <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 flex items-center justify-center font-black text-xs border border-blue-100">
                                            {q.Specialty ? q.Specialty.substring(0, 3).toUpperCase() : 'ALL'}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold font-mono">
                                                ID: {q.ID}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                                {q.Specialty || 'Tổng hợp'}
                                            </span>
                                        </div>
                                        
                                        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
                                            <MathRenderer text={q.Question_Text} />
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Đáp án: {q.Correct_Answer}
                                            </span>
                                            {q.Explanation && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                                    Có lời giải
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="self-center p-2 rounded-full bg-gray-50 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        
                        {paginated.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">Không tìm thấy câu hỏi nào phù hợp.</p>
                            </div>
                        )}
                        
                        {paginated.length < filtered.length && (
                            <div className="text-center pt-8 pb-12">
                                <button 
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                                >
                                    Xem thêm câu hỏi
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
