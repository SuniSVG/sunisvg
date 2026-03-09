'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { fetchArticles, fetchAccounts, fetchPremiumArticles } from '@/services/googleSheetService';
import type { ScientificArticle, Account, Badge } from '@/types';
import { 
    ArrowLeft, 
    Folder, 
    User, 
    Calendar, 
    Hash, 
    Star, 
    FileText, 
    Tag, 
    Download, 
    ArrowRight, 
    Lock, 
    MessageCircle, 
    Clock, 
    AlertCircle, 
    BookOpen, 
    Maximize, 
    Eye, 
    DownloadCloud, 
    ChevronRight,
    Share2,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBadges } from '@/utils/badgeUtils';
import { BadgePill } from '@/components/shared/BadgePill';
import { Icon } from '@/components/shared/Icon';
import { ShareModal } from '@/components/ShareModal';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';

const MathRenderer = React.memo(({ text }: { text: string }) => {
  if (typeof text !== 'string' || !text) {
    return <>{text}</>;
  }
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try {
            return <BlockMath key={index} math={part.slice(2, -2)} />;
          } catch (e) {
            console.error("KaTeX BlockMath Error:", e);
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          try {
            return <InlineMath key={index} math={part.slice(1, -1)} />;
          } catch(e) {
            console.error("KaTeX InlineMath Error:", e);
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
});

MathRenderer.displayName = 'MathRenderer';

export default function ArticleDetail() {
    const params = useParams();
    const id = params.id as string;
    const [article, setArticle] = useState<ScientificArticle | null>(null);
    const [authorBadges, setAuthorBadges] = useState<Badge[]>([]);
    const [relatedArticles, setRelatedArticles] = useState<ScientificArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const { currentUser } = useAuth();
    const pathname = usePathname();
    const isPremium = useMemo(() => pathname.startsWith('/premium') || id.startsWith('9'), [pathname, id]);

    const handleDownload = () => {
        if (article?.DocumentURL) {
            window.open(article.DocumentURL, '_blank');
        } else {
            alert("Tài liệu này không có liên kết tải xuống.");
        }
    };

    useEffect(() => {
        const loadArticle = async () => {
            if (!id) {
                setError("ID tài liệu không hợp lệ.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const fetchFn = isPremium ? fetchPremiumArticles : fetchArticles;
                const [allArticles, allAccounts] = await Promise.all([
                    fetchFn(),
                    fetchAccounts()
                ]);

                const foundArticle = allArticles.find(a => a.ID === id);
                if (foundArticle) {
                    setArticle(foundArticle);

                    // Related articles (same category, excluding current)
                    const related = allArticles
                        .filter(a => a.Category === foundArticle.Category && a.ID !== foundArticle.ID && a.Status === 'Approved')
                        .slice(0, 5);
                    setRelatedArticles(related);

                    const authorAccount = allAccounts.find(acc => acc.Email.toLowerCase() === foundArticle.SubmitterEmail.toLowerCase());
                    if (authorAccount) {
                        const authorArticles = allArticles.filter(art => 
                            art.SubmitterEmail.toLowerCase() === authorAccount.Email.toLowerCase()
                        );
                        const { displayBadges } = getUserBadges(authorAccount, authorArticles);
                        setAuthorBadges(displayBadges);
                    }
                } else {
                    setError("Không tìm thấy tài liệu.");
                }
            } catch (err) {
                setError("Lỗi khi tải dữ liệu tài liệu.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadArticle();
    }, [id, isPremium]);

    // SEO Optimization: Cập nhật Title, Meta Tags & Structured Data
    useEffect(() => {
        if (article) {
            // 1. Update Document Title
            document.title = `${article.Title} - Tài liệu ${article.Category} | SuniSVG`;

            // 2. Update Meta Description (Client-side)
            const description = article.Abstract 
                ? article.Abstract.substring(0, 160).replace(/[\n\r]+/g, ' ') + '...'
                : `Đọc tài liệu ${article.Title} của tác giả ${article.Authors} tại SuniSVG.`;
            
            let metaDesc = document.querySelector("meta[name='description']");
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);
        }
    }, [article]);

    const canViewAdminContent = useMemo(() => 
        currentUser && (currentUser['Danh hiệu'] === 'Admin' || currentUser['Danh hiệu'] === 'Developer'),
        [currentUser]
    );

    const isAuthor = useMemo(() => 
        currentUser?.Email === article?.SubmitterEmail,
        [currentUser, article]
    );

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-6">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <p className="text-gray-600 font-medium animate-pulse">Đang tải tài liệu...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="max-w-2xl mx-auto text-center p-10 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200 shadow-lg">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 mb-3">Đã xảy ra lỗi</h3>
                <p className="text-red-600 mb-6">{error || "Không thể hiển thị tài liệu."}</p>
                <Link 
                    href={isPremium ? "/premium" : "/articles"}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    if (article.Status !== 'Approved' && !canViewAdminContent && !isAuthor) {
        return (
            <div className="max-w-2xl mx-auto text-center p-10 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 shadow-lg">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-3">Tài liệu đang chờ duyệt</h2>
                <p className="text-yellow-700 mb-6">Tài liệu này chưa được phê duyệt và không thể xem công khai.</p>
                <Link 
                    href="/articles" 
                    className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Structured Data (JSON-LD) for SEO */}
            {article && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ScholarlyArticle",
                            "headline": article.Title,
                            "author": { "@type": "Person", "name": article.Authors },
                            "datePublished": article.SubmissionDate,
                            "description": article.Abstract,
                            "articleSection": article.Category,
                            "keywords": article.Keywords
                        })
                    }}
                />
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <Link href="/articles" className="hover:text-blue-600 transition-colors">Thư viện</Link>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">
                    {article.Category}
                </span>
            </nav>

            {/* Header Section */}
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        {/* Status/Category Badge */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                <Folder className="w-3.5 h-3.5" />
                                {article.Category}
                            </span>
                            {isPremium && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-xs font-bold shadow-sm">
                                    <Star className="w-3.5 h-3.5" />
                                    Premium
                                </span>
                            )}
                            {(canViewAdminContent || isAuthor) && article.Status !== 'Approved' && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
                                    article.Status === 'Pending' 
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {article.Status === 'Pending' ? 'Đang chờ duyệt' : 'Bị từ chối'}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
                            <MathRenderer text={article.Title} />
                        </h1>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số tệp</p>
                                    <p className="text-sm font-black text-gray-800">1 tệp</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tác giả</p>
                                    <p className="text-sm font-black text-gray-800 truncate max-w-[100px]">{article.Authors}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                    <Eye className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lượt xem</p>
                                    <p className="text-sm font-black text-gray-800">1.2k+</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày đăng</p>
                                    <p className="text-sm font-black text-gray-800">{article.SubmissionDate.split(' ')[0]}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                        <button 
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            <DownloadCloud className="w-5 h-5" />
                            Tải tài liệu
                        </button>
                        <button 
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-white text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all border border-gray-200"
                        >
                            <Share2 className="w-5 h-5" />
                            Chia sẻ
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - PDF Viewer & Details */}
                <div className="lg:col-span-8 space-y-8">
                    {/* PDF Viewer Container */}
                    <div className={`bg-gray-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'relative'}`}>
                        {/* Mini Toolbar */}
                        <div className="bg-gray-800/80 backdrop-blur-md px-6 py-3 flex items-center justify-between border-b border-gray-700">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-bold text-gray-200 truncate">
                                    {article.Title.length > 40 ? article.Title.substring(0, 40) + '...' : article.Title}.pdf
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={toggleFullscreen}
                                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
                                    aria-label={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
                                >
                                    <Maximize className="w-5 h-5" />
                                </button>
                                {article.DocumentURL && !article.DocumentURL.startsWith('text://') && (
                                    <a 
                                        href={article.DocumentURL} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        title="Mở trong tab mới"
                                        aria-label="Mở tài liệu trong tab mới"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* PDF Content Frame */}
                        <div className={`${isFullscreen ? 'h-[calc(100vh-57px)]' : 'h-[600px] md:h-[800px]'} bg-gray-800 relative`}>
                            {(() => {
                                if (article.DocumentURL && article.DocumentURL.startsWith('text://')) {
                                    const fullText = article.DocumentURL.substring(7);
                                    return (
                                        <div className="h-full overflow-y-auto p-8 md:p-12 bg-white">
                                            <div className="max-w-3xl mx-auto prose prose-lg">
                                                <MathRenderer text={fullText} />
                                            </div>
                                        </div>
                                    );
                                } else if (article.DocumentURL) {
                                    let embedUrl = article.DocumentURL;
                                    if (embedUrl.includes('drive.google.com')) {
                                        embedUrl = embedUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
                                    }
                                    
                                    return (
                                        <iframe
                                            src={`${embedUrl}#toolbar=0`}
                                            className="w-full h-full border-0"
                                            title={article.Title}
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                                                <FileText className="w-10 h-10 text-gray-500" />
                                            </div>
                                            <p className="text-lg font-bold text-gray-400">Không có nội dung hiển thị</p>
                                            <p className="text-sm">Tài liệu này chưa có liên kết PDF hoặc nội dung văn bản.</p>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>

                    {/* Attachments List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Hash className="w-6 h-6 text-blue-600" />
                            Danh sách tệp đính kèm
                        </h3>
                        <div className="space-y-3">
                            {article.DocumentURL && (
                                <div className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                                            <FileText className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                {article.Title}.pdf
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">PDF Document • 2.4 MB</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={article.DocumentURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm shrink-0 shadow-lg shadow-orange-100"
                                    >
                                        <Download className="w-4 h-4" />
                                        Tải xuống
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Abstract / Description */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                            Mô tả tài liệu
                        </h3>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                            <MathRenderer text={article.Abstract} />
                        </div>
                        
                        {/* Keywords Tags */}
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                {article.Keywords.split(',').map(kw => kw.trim()).filter(Boolean).map((keyword, idx) => (
                                    <span 
                                        key={`${keyword}-${idx}`} 
                                        className="inline-flex items-center gap-2 text-xs font-bold bg-gray-50 text-gray-600 px-4 py-2 rounded-full border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-default"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Premium Access Instructions */}
                    {isPremium && (
                        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 rounded-3xl border border-amber-200 border-l-8 border-l-amber-500 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-xl font-black text-amber-900 flex items-center gap-2">
                                        Hướng dẫn truy cập Premium
                                    </h3>
                                    <div className="space-y-3 text-amber-800">
                                        <p className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                            <span className="font-medium">Đây là tài liệu cao cấp. Để truy cập toàn bộ nội dung, vui lòng làm theo hướng dẫn tại liên kết tài liệu.</span>
                                        </p>
                                        <p className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                            <span className="font-medium">Nếu bạn không thể truy cập, hãy chọn <strong>&quot;Yêu cầu quyền truy cập&quot;</strong> trên Google Drive.</span>
                                        </p>
                                        <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                                            <p className="text-sm font-bold text-amber-900">Lưu ý: Yêu cầu truy cập sẽ được xử lý vào khoảng 12:00 hàng ngày.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Feedback (If any) */}
                    {(canViewAdminContent || isAuthor) && article.Feedback && (
                        <div className="bg-blue-50 rounded-3xl p-8 border border-blue-200 border-l-8 border-l-blue-500 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="space-y-3 flex-1">
                                    <h3 className="text-xl font-black text-blue-900">Phản hồi từ quản trị viên</h3>
                                    <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                        <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-medium">{article.Feedback}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-8">
                    {/* Related Documents */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            Tài liệu liên quan
                        </h3>
                        
                        <div className="space-y-6">
                            {relatedArticles.length > 0 ? (
                                relatedArticles.map((rel) => (
                                    <Link 
                                        key={rel.ID} 
                                        href={`/article/${rel.ID}`}
                                        className="group flex gap-4"
                                    >
                                        <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform overflow-hidden relative">
                                            <FileText className="w-8 h-8 text-blue-400 opacity-50" />
                                            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/0 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                                                <MathRenderer text={rel.Title} />
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                <User className="w-3 h-3" />
                                                <span className="truncate">{rel.Authors}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 font-medium italic">Hiện tại chưa có tài liệu liên quan</p>
                                </div>
                            )}
                        </div>

                        <Link 
                            href="/articles"
                            className="w-full mt-8 py-3 text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Xem thêm thư viện
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Author Card (Optional) */}
                    </div>
                </div>
            </div>
            <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title={article.Title}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                platformName="SuniSVG"
            />
        </div>
    );
}
