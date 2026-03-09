'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, BookOpen, CheckCircle2, Flag, Copy, Check, Share2,
    Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { fetchAllQuestionsFromBank } from '@/services/googleSheetService';
import MathRenderer from '@/components/shared/MathRenderer';
import { Icon } from '@/components/shared/Icon';
import type { MedicalQuestion } from '@/types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Tách URL ra khỏi văn bản và trả về văn bản sạch + danh sách URLs
 */
const extractUrlsFromText = (text: string): { cleanText: string; urls: string[] } => {
    if (!text) return { cleanText: '', urls: [] };

    // Regex để match URLs (Google Drive và các URL khác)
    const urlRegex = /https?:\/\/[^\s,;)]+/g;
    
    // Tìm tất cả URLs trong text
    const foundUrls = text.match(urlRegex) || [];
    
    // Loại bỏ URLs khỏi text
    let cleanText = text;
    foundUrls.forEach(url => {
        cleanText = cleanText.replace(url, '');
    });
    
    // Dọn dẹp text: xóa khoảng trắng thừa, dấu phẩy/chấm phẩy thừa
    cleanText = cleanText
        .replace(/\s*[,;]\s*[,;]\s*/g, ', ')  // Gộp dấu phẩy/chấm phẩy liên tiếp
        .replace(/\s+/g, ' ')                  // Gộp khoảng trắng
        .replace(/^[,;]\s*/, '')               // Xóa dấu phẩy/chấm phẩy đầu
        .replace(/\s*[,;]\s*$/, '')            // Xóa dấu phẩy/chấm phẩy cuối
        .replace(/\s{2,}/g, ' ')               // Xóa khoảng trắng kép
        .trim();
    
    return { cleanText, urls: foundUrls };
};

const parseImageUrls = (urlString: string | undefined): string[] => {
    if (!urlString) return [];
    return urlString.split(/[,;]/).map(url => url.trim())
        .filter(url => url.length > 0 && url.startsWith('http'));
};

/**
 * Parse tất cả URLs từ nhiều nguồn
 */
const parseAllImageUrls = (imageUrlField: string | undefined, questionText: string | undefined): string[] => {
    const urls: string[] = [];
    if (imageUrlField) urls.push(...parseImageUrls(imageUrlField));
    if (questionText) {
        const { urls: extractedUrls } = extractUrlsFromText(questionText);
        urls.push(...extractedUrls);
    }
    return [...new Set(urls)].filter(url => url.includes('drive.google.com') || url.includes('http'));
};

/**
 * Converts a Google Drive sharing URL to multiple direct image URL formats
 * Returns array of URLs to try in order
 */
const getGoogleDriveImageUrls = (url: string): string[] => {
    if (!url) return [];
    
    // Extract file ID from standard sharing URL
    const match = url.match(/\/file\/d\/([^\/\?]+)/);
    if (!match || !match[1]) {
        // Try to extract from other formats
        const idMatch = url.match(/[?&]id=([^&]+)/);
        if (idMatch && idMatch[1]) {
            const fileId = idMatch[1];
            return [
                `https://drive.google.com/uc?export=view&id=${fileId}`,
                `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
                `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
            ];
        }
        return [url];
    }
    
    const fileId = match[1];
    
    // Return multiple URL formats to try (in order of preference)
    return [
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
        `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
        `https://drive.google.com/uc?id=${fileId}`,
    ];
};

/**
 * Get the primary direct link (first option)
 */
const getGoogleDriveDirectLink = (url: string): string => {
    const urls = getGoogleDriveImageUrls(url);
    return urls[0] || url;
};

// ============================================================================
// IMAGE COMPONENT WITH FALLBACK
// ============================================================================

interface ImageWithFallbackProps {
    url: string;
    alt: string;
    index: number;
    total: number;
    onLoad: () => void;
    onError: () => void;
    onRetry: () => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
    url, alt, index, total, onLoad, onError, onRetry 
}) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const possibleUrls = getGoogleDriveImageUrls(url);

    const handleImageError = () => {
        // Try next URL format
        if (currentUrlIndex < possibleUrls.length - 1) {
            setCurrentUrlIndex(prev => prev + 1);
            setIsLoading(true);
        } else {
            // All URLs failed
            setHasError(true);
            setIsLoading(false);
            onError();
        }
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
        onLoad();
    };

    const handleRetry = () => {
        setCurrentUrlIndex(0);
        setHasError(false);
        setIsLoading(true);
        onRetry();
    };

    const currentImageUrl = possibleUrls[currentUrlIndex] || url;

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            <div className="relative min-h-[200px]">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 z-10">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-gray-600 font-medium">
                            Đang tải hình ảnh {index + 1}/{total}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Phương pháp {currentUrlIndex + 1}/{possibleUrls.length}
                        </p>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-red-50 to-orange-50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ Không thể tải ảnh</h3>
                        <p className="text-sm text-gray-600 mb-1 text-center max-w-md">
                            Đã thử {possibleUrls.length} phương pháp khác nhau
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                            Kiểm tra quyền: Anyone with the link → Viewer
                        </p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                        >
                            🔄 Thử lại tất cả
                        </button>
                        <details className="mt-4 w-full max-w-md">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 text-center">
                                🔍 Chi tiết kỹ thuật
                            </summary>
                            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">URL gốc:</p>
                                    <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">
                                        {url}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Đã thử các URL:</p>
                                    {possibleUrls.map((u, i) => (
                                        <p key={i} className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded mb-1">
                                            {i + 1}. {u}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </details>
                    </div>
                )}

                {/* Actual Image */}
                <div className={`p-2 ${hasError ? 'hidden' : ''}`}>
                    <img 
                        key={currentImageUrl}
                        src={currentImageUrl}
                        alt={alt}
                        className="w-full h-auto object-contain max-h-[600px] rounded-xl shadow-sm"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        loading="lazy"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                </div>

                {/* Image Counter Badge */}
                {total > 1 && !hasError && !isLoading && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                        <ImageIcon className="w-4 h-4" />
                        <span>{index + 1} / {total}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuestionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [question, setQuestion] = useState<MedicalQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [imageStates, setImageStates] = useState<Map<number, { loading: boolean; error: boolean }>>(new Map());

    useEffect(() => {
        const loadQuestion = async () => {
            setLoading(true);
            try {
                const all = await fetchAllQuestionsFromBank();
                const found = all.find(q => String(q.ID).trim() === String(id).trim());
                if (found) {
                    setQuestion(found);
                    // Initialize image states
                    const imageCount = parseAllImageUrls(found.Image_URL, found.Question_Text).length;
                    const explanationImageCount = found.Explanation ? extractUrlsFromText(found.Explanation).urls.length : 0;
                    const totalImages = imageCount + explanationImageCount;
                    
                    const initialStates = new Map();
                    for (let i = 0; i < totalImages; i++) {
                        initialStates.set(i, { loading: true, error: false });
                    }
                    setImageStates(initialStates);
                } else {
                    setError('Không tìm thấy câu hỏi này trong ngân hàng dữ liệu.');
                }
            } catch (err) {
                console.error(err);
                setError('Có lỗi xảy ra khi tải dữ liệu câu hỏi.');
            } finally {
                setLoading(false);
            }
        };
        if (id) loadQuestion();
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleImageLoad = (index: number) => {
        setImageStates(prev => {
            const newMap = new Map(prev);
            newMap.set(index, { loading: false, error: false });
            return newMap;
        });
    };

    const handleImageError = (index: number) => {
        setImageStates(prev => {
            const newMap = new Map(prev);
            newMap.set(index, { loading: false, error: true });
            return newMap;
        });
    };

    const handleImageRetry = (index: number) => {
        setImageStates(prev => {
            const newMap = new Map(prev);
            newMap.set(index, { loading: true, error: false });
            return newMap;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Đang tải dữ liệu câu hỏi...</p>
                </div>
            </div>
        );
    }

    if (error || !question) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-gray-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="alert-circle" className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy câu hỏi</h1>
                    <p className="text-gray-500 mb-6">{error || 'Câu hỏi bạn tìm kiếm không tồn tại hoặc đã bị xóa.'}</p>
                    <Link href="/questions" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại ngân hàng câu hỏi
                    </Link>
                </div>
            </div>
        );
    }

    const options = [
        { key: 'A', text: question.Option_A },
        { key: 'B', text: question.Option_B },
        { key: 'C', text: question.Option_C },
        { key: 'D', text: question.Option_D },
    ];

    // Parse URLs từ Question_Text và Image_URL
    const questionImageUrls = parseAllImageUrls(question.Image_URL, question.Question_Text);
    const { cleanText: cleanQuestionText } = extractUrlsFromText(question.Question_Text);

    // Parse URLs từ Explanation
    const { cleanText: cleanExplanation, urls: explanationImageUrls } = question.Explanation 
        ? extractUrlsFromText(question.Explanation)
        : { cleanText: '', urls: [] };

    return (
        <div className="min-h-screen bg-[#F8FAF8] py-8 px-4 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link href="/questions" className="flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-2 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Ngân hàng câu hỏi
                    </Link>
                    <div className="flex gap-2">
                        <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Đã sao chép' : 'Sao chép link'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Question Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">
                                        {question.Specialty || 'Tổng hợp'}
                                    </span>
                                    <span className="text-gray-400 text-xs font-bold font-mono">#{question.ID}</span>
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-3 h-3 rounded-full bg-red-400/20"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-400/20"></span>
                                    <span className="w-3 h-3 rounded-full bg-green-400/20"></span>
                                </div>
                            </div>

                            <div className="p-8">
                                <h1 className="text-2xl font-bold text-gray-900 leading-relaxed mb-8">
                                    <MathRenderer text={cleanQuestionText} />
                                </h1>

                                {/* Question Images */}
                                {questionImageUrls.length > 0 && (
                                    <div className="mb-8 space-y-4">
                                        {questionImageUrls.map((url, idx) => (
                                            <ImageWithFallback
                                                key={`q-${idx}`}
                                                url={url}
                                                alt={`Hình minh họa câu hỏi ${idx + 1}`}
                                                index={idx}
                                                total={questionImageUrls.length}
                                                onLoad={() => handleImageLoad(idx)}
                                                onError={() => handleImageError(idx)}
                                                onRetry={() => handleImageRetry(idx)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {options.map((opt) => {
                                        const isCorrect = opt.key === question.Correct_Answer;
                                        return (
                                            <div key={opt.key} className={`p-5 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                                                isCorrect ? 'border-green-500 bg-green-50/30 ring-1 ring-green-500/20' : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                                                    isCorrect ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                                                }`}>{opt.key}</div>
                                                <div className={`flex-1 font-medium pt-1 text-lg ${isCorrect ? 'text-green-900' : 'text-gray-700'}`}>
                                                    <MathRenderer text={opt.text} />
                                                </div>
                                                {isCorrect && (
                                                    <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                                                        <CheckCircle2 className="w-4 h-4" /><span>Đúng</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Explanation Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">Lời giải chi tiết</h3>
                            </div>
                            <div className="p-8">
                                {question.Explanation ? (
                                    <div className="space-y-6">
                                        {/* Explanation Text */}
                                        {cleanExplanation && (
                                            <div className="text-gray-700 leading-relaxed space-y-4 text-lg">
                                                <MathRenderer text={cleanExplanation} />
                                            </div>
                                        )}
                                        
                                        {/* Explanation Images */}
                                        {explanationImageUrls.length > 0 && (
                                            <div className="space-y-4 pt-4">
                                                {explanationImageUrls.map((url, idx) => {
                                                    const globalIndex = questionImageUrls.length + idx;
                                                    return (
                                                        <ImageWithFallback
                                                            key={`e-${idx}`}
                                                            url={url}
                                                            alt={`Hình minh họa lời giải ${idx + 1}`}
                                                            index={idx}
                                                            total={explanationImageUrls.length}
                                                            onLoad={() => handleImageLoad(globalIndex)}
                                                            onError={() => handleImageError(globalIndex)}
                                                            onRetry={() => handleImageRetry(globalIndex)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 italic">Chưa có lời giải chi tiết.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wide flex items-center gap-2">
                                <Icon name="information-circle" className="w-4 h-4 text-gray-400" />
                                Thông tin câu hỏi
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-500 font-medium">Môn học</span>
                                    <span className="font-bold text-gray-900">{question.Specialty || '---'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-500 font-medium">Dạng bài</span>
                                    <span className="font-bold text-gray-900">Trắc nghiệm</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-500 font-medium">Đáp án đúng</span>
                                    <span className="font-black text-green-600 bg-green-100 w-8 h-8 flex items-center justify-center rounded-lg">
                                        {question.Correct_Answer}
                                    </span>
                                </div>
                                {(questionImageUrls.length > 0 || explanationImageUrls.length > 0) && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <span className="text-sm text-blue-700 font-medium">Số hình ảnh</span>
                                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4" />
                                            {questionImageUrls.length + explanationImageUrls.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl text-xs transition-colors">
                                    <Flag className="w-4 h-4" />
                                    Báo lỗi
                                </button>
                                <button className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs transition-colors">
                                    <Share2 className="w-4 h-4" />
                                    Chia sẻ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}