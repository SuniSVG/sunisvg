'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchPracticeQuestions, PracticeQuestion } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';
import Link from 'next/link';
import HLSVideoPlayer from '@/components/shared/HLSVideoPlayer';

const ContentRenderer = ({ content }: { content: string }) => {
    if (!content) return null;
    // Phân tách chuỗi để bóc tách thẻ [IMG:url] ra thành các element ảnh
    const parts = content.split(/\[IMG:(.*?)\]/);
    
    return (
        <div className="inline-block space-y-2 text-gray-800 leading-relaxed">
            {parts.map((part, index) => {
                if (index % 2 === 1) { // Là link ảnh URL
                    return (
                        <img 
                            key={index} 
                            src={part} 
                            alt="Minh họa câu hỏi" 
                            className="inline-block max-w-full h-auto rounded-md shadow-sm align-middle my-1" 
                        />
                    );
                }
                // Đoạn text thường, xử lý xuống dòng
                if (!part) return null;
                return (
                    <span key={index}>
                        {part.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i !== part.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                );
            })}
        </div>
    );
};

export default function PracticePage() {
    const params = useParams();
    const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [showExplanation, setShowExplanation] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            if (params.id) {
                const data = await fetchPracticeQuestions(params.id as string);
                setQuestions(data);
            }
            setLoading(false);
        };
        loadData();
    }, [params.id]);

    const handleAnswerChange = (questionId: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const toggleExplanation = (questionId: string) => {
        setShowExplanation(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) next.delete(questionId);
            else next.add(questionId);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <Icon name="file-text" className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Không tìm thấy câu hỏi nào cho bài giảng này.</h2>
                <Link href="/" className="mt-4 text-blue-600 hover:underline">Quay về trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium mb-4">
                        <Icon name="arrowLeft" className="w-4 h-4" />
                        Quay lại
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Bài tập Luyện tập</h1>
                    <p className="text-gray-500 mt-2">Mã bài giảng: <span className="font-semibold text-blue-600">{params.id}</span></p>
                </div>

                <div className="space-y-8">
                    {questions.map((q, index) => {
                        const isRevealed = showExplanation.has(q.questionId);
                        const isMCQ = q.type === 'MCQ';
                        const isCorrect = isMCQ 
                            ? userAnswers[q.questionId] === q.key 
                            : userAnswers[q.questionId]?.trim().toLowerCase() === q.key.trim().toLowerCase();

                        return (
                            <div key={q.questionId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {q.section && (
                                                <div className="text-sm font-semibold text-orange-600 mb-3 bg-orange-50 inline-block px-3 py-1 rounded-md">
                                                    {q.section}
                                                </div>
                                            )}
                                            
                                            <div className="text-lg font-medium text-gray-900 mb-6">
                                                <ContentRenderer content={q.questionText} />
                                            </div>

                                            {isMCQ ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                                        const optText = q[opt as keyof PracticeQuestion] as string;
                                                        if (!optText) return null;
                                                        const isSelected = userAnswers[q.questionId] === opt;
                                                        const isCorrectOption = isRevealed && q.key === opt;
                                                        const isWrongOption = isRevealed && isSelected && q.key !== opt;

                                                        let btnClass = "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                                                        if (isCorrectOption) btnClass = "border-green-500 bg-green-50 text-green-800 font-bold";
                                                        else if (isWrongOption) btnClass = "border-red-500 bg-red-50 text-red-800";
                                                        else if (isSelected) btnClass = "border-blue-500 bg-blue-50 text-blue-800 font-bold";

                                                        return (
                                                            <button
                                                                key={opt}
                                                                onClick={() => !isRevealed && handleAnswerChange(q.questionId, opt)}
                                                                disabled={isRevealed}
                                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}
                                                            >
                                                                <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-current flex items-center justify-center text-sm font-bold mt-0.5">
                                                                    {opt}
                                                                </span>
                                                                <div className="flex-1 mt-0.5 overflow-hidden">
                                                                    <ContentRenderer content={optText} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="mb-6">
                                                    <input
                                                        type="text"
                                                        value={userAnswers[q.questionId] || ''}
                                                        onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                                                        disabled={isRevealed}
                                                        placeholder="Nhập câu trả lời của bạn..."
                                                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                                                            isRevealed 
                                                                ? isCorrect 
                                                                    ? "border-green-500 bg-green-50 text-green-800" 
                                                                    : "border-red-500 bg-red-50 text-red-800"
                                                                : "border-gray-200 focus:border-blue-500"
                                                        }`}
                                                    />
                                                </div>
                                            )}

                                            <button
                                                onClick={() => toggleExplanation(q.questionId)}
                                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4"
                                            >
                                                {isRevealed ? 'Ẩn lời giải' : 'Xem lời giải chi tiết'}
                                            </button>

                                            {isRevealed && (
                                                <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
                                                    <div className="mb-4">
                                                        <span className="font-bold text-gray-900 mr-2">Đáp án đúng:</span>
                                                        <span className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded-md">
                                                            {q.key}
                                                        </span>
                                                    </div>
                                                    {q.answer && (
                                                        <div className="prose max-w-none text-gray-700">
                                                            <strong className="block mb-2 text-gray-900">Lời giải:</strong>
                                                            <ContentRenderer content={q.answer} />
                                                        </div>
                                                    )}
                                                    {q.videoUrl && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                <Icon name="play-circle" className="w-4 h-4 text-red-500" />
                                                                Video chữa bài
                                                            </p>
                                                            {q.videoUrl.includes('.m3u8') ? (
                                                                // HLS streaming (Moon.vn dùng định dạng này)
                                                                <HLSVideoPlayer url={q.videoUrl} />
                                                            ) : (
                                                                // Fallback: link thông thường
                                                                <a 
                                                                    href={q.videoUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                                                                >
                                                                    <Icon name="play-circle" className="w-5 h-5" />
                                                                    Xem Video Chữa Bài
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}