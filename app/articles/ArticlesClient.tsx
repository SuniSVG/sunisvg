'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import type { ScientificArticle, Account } from '@/types';
import { slugify } from '@/components/StructuredData';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Render công thức toán học cho các Title/Abstract
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
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          try {
            return <InlineMath key={index} math={part.slice(1, -1)} />;
          } catch(e) {
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
});
MathRenderer.displayName = 'MathRenderer';

interface ArticlesClientProps {
    initialArticles: ScientificArticle[];
    initialAccounts: Account[];
}

const ARTICLES_PER_PAGE = 12;

export default function ArticlesClient({ initialArticles, initialAccounts }: ArticlesClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory]);

    // Lấy danh sách category
    const categories = useMemo(() => {
        const cats = new Set(initialArticles.map(a => a.Category).filter(Boolean));
        return ['Tất cả', ...Array.from(cats)];
    }, [initialArticles]);

    // Xử lý Lọc & Tìm kiếm
    const filteredArticles = useMemo(() => {
        return initialArticles.filter(article => {
            // Chỉ hiển thị các bài viết đã được duyệt
            if (article.Status?.toLowerCase() !== 'approved') return false; 
            
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query || 
                                  article.Title.toLowerCase().includes(query) || 
                                  (article.Keywords && article.Keywords.toLowerCase().includes(query)) ||
                                  (article.Abstract && article.Abstract.toLowerCase().includes(query));
            
            const matchesCategory = selectedCategory === 'Tất cả' || article.Category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [initialArticles, searchQuery, selectedCategory]);

    // Pagination
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE) || 1;
    const currentArticles = filteredArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE
    );

    return (
        <div className="ar-root">
            {/* Hero Section */}
            <div className="ar-hero">
                <div className="ar-hero-orb1" />
                <div className="ar-hero-orb2" />
                <div className="ar-hero-inner">
                    <div className="ar-hero-tag">
                        <span className="ar-hero-dot" />
                        SuniSVG Library
                    </div>
                    <h1 className="ar-hero-h1">
                        Khám phá kho tàng <br />
                        <span>Tài liệu học tập</span>
                    </h1>
                    <p className="ar-hero-sub">
                        Hơn {initialArticles.length > 0 ? (initialArticles.length / 1000).toFixed(1).replace('.0', '') + 'k+' : '18k+'} tài liệu, đề thi thử và chuyên đề ôn thi THPT Quốc gia được chọn lọc kỹ lưỡng dành cho bạn.
                    </p>
                    
                    <div className="ar-hero-actions">
                        <div className="ar-stat">
                            <div className="ar-stat-icon">
                                <Icon name="book" className="w-5 h-5 text-white" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="ar-stat-num">{initialArticles.length > 0 ? `${(initialArticles.length/1000).toFixed(1).replace('.0', '')}k+` : '0'}</div>
                                <div className="ar-stat-lbl">Tài liệu</div>
                            </div>
                        </div>
                        <div className="ar-stat">
                            <div className="ar-stat-icon">
                                <Icon name="users" className="w-5 h-5 text-white" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="ar-stat-num">50k+</div>
                                <div className="ar-stat-lbl">Học sinh</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ar-body">
                {/* Search Bar */}
                <div className="ar-search-wrap">
                    <div className="ar-search-bar">
                        <Icon name="search" className="w-5 h-5 text-gray-400 shrink-0" />
                        <input 
                            type="text"
                            className="ar-search-input"
                            placeholder="Tìm kiếm tài liệu, đề thi, từ khóa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="ar-search-clear" onClick={() => setSearchQuery('')}>
                                <Icon name="x" className="w-4 h-4 shrink-0" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Chips (Mobile) */}
                <div className="ar-chips lg:hidden">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            className={`ar-chip ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="ar-grid">
                    {/* Sidebar (Desktop) */}
                    <div className="ar-sidebar hidden lg:flex">
                        <div className="ar-sidebar-box">
                            <div className="ar-sidebar-title">
                                <Icon name="folder" className="w-4 h-4" />
                                Danh mục
                            </div>
                            <div className="flex flex-col gap-1">
                                {categories.map(cat => (
                                    <button 
                                        key={cat}
                                        className={`ar-sidebar-btn ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="min-w-0">
                        <div className="ar-result-info">
                            Tìm thấy <strong>{filteredArticles.length}</strong> kết quả {searchQuery ? `cho "${searchQuery}"` : ''}
                        </div>

                        {filteredArticles.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {currentArticles.map((article) => {
                                        let isNew = false;
                                        try {
                                            if (article.SubmissionDate) {
                                                const parts = article.SubmissionDate.split(' ')[0].split('/');
                                                if (parts.length === 3) {
                                                    const subDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                                    isNew = new Date().getTime() - subDate.getTime() < 7 * 24 * 60 * 60 * 1000;
                                                }
                                            }
                                        } catch(e) {}
                                        
                                        // Tự động sinh Thumbnail từ Google Drive URL nếu không có sẵn
                                        let previewSrc = article.ThumbnailURL;
                                        if (!previewSrc && article.DocumentURL) {
                                            const driveMatch = article.DocumentURL.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                            if (driveMatch) {
                                                previewSrc = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
                                            } else if (article.DocumentURL.includes('toanmath.com/toanmath-pdf/')) {
                                                const fileName = article.DocumentURL.split('/').pop()?.replace('.pdf', '.png');
                                                let year = '2026', month = '03';
                                                if (article.SubmissionDate) {
                                                    const m = article.SubmissionDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                                                    if (m) { month = m[2].padStart(2, '0'); year = m[3]; }
                                                }
                                                previewSrc = `https://toanmath.com/wp-content/uploads/${year}/${month}/${fileName}`;
                                            }
                                        }

                                        return (
                                            <Link 
                                                key={article.ID} 
                                                href={`/article/${article.ID}`}
                                                className="ac-card group"
                                            >
                                                <div className="ac-accent" />
                                                {isNew && <div className="ac-new-badge">Mới</div>}
                                                
                                                {previewSrc ? (
                                                    <div className="w-full h-40 mb-4 overflow-hidden rounded-xl bg-gray-100 border border-gray-100 shrink-0 relative">
                                                        <img 
                                                            src={previewSrc} 
                                                            alt={article.Title} 
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-40 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shrink-0 flex items-center justify-center group-hover:border-blue-300 transition-colors">
                                                        <Icon name="file-text" className="w-10 h-10 text-blue-200" />
                                                    </div>
                                                )}
                                                
                                                <h3 className="ac-title" title={article.Title}>
                                                    <MathRenderer text={article.Title} />
                                                </h3>
                                                
                                                <div className="ac-author mt-2">
                                                    <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{article.Authors || 'SuniSVG'}</span>
                                                </div>
                                                
                                                <div className="ac-abstract">
                                                    <MathRenderer text={article.Abstract || ''} />
                                                </div>
                                                
                                                {article.Keywords && (
                                                    <div className="ac-keywords">
                                                        {article.Keywords.split(',').slice(0, 2).map((kw, i) => (
                                                            <span key={i} className="ac-keyword">{kw.trim()}</span>
                                                        ))}
                                                        {article.Keywords.split(',').length > 2 && (
                                                            <span className="ac-keyword">+{article.Keywords.split(',').length - 2}</span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="ac-footer">
                                                    <div className="ac-meta">
                                                        <div className="ac-category">
                                                            <Icon name="folder" className="w-3 h-3 shrink-0" />
                                                            <span className="truncate max-w-[120px]">{article.Category}</span>
                                                        </div>
                                                        <div className="ac-date">
                                                            <Icon name="calendar" className="w-3 h-3 shrink-0" />
                                                            {article.SubmissionDate?.split(' ')[0] || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="ar-pagination">
                                        <button 
                                            className="ar-page-btn"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        >
                                            <Icon name="chevron-left" className="w-4 h-4" />
                                        </button>
                                        
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pageNum = currentPage;
                                            if (totalPages <= 5) pageNum = i + 1;
                                            else if (currentPage <= 3) pageNum = i + 1;
                                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = currentPage - 2 + i;

                                            return (
                                                <button 
                                                    key={pageNum}
                                                    className={`ar-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button 
                                            className="ar-page-btn"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        >
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="ar-empty">
                                <div className="ar-empty-icon">
                                    <Icon name="search" className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy tài liệu</h3>
                                <p className="text-gray-500 mb-6">Thử thay đổi từ khóa hoặc bộ lọc để tìm được nhiều kết quả hơn.</p>
                                <button className="ar-reset-btn" onClick={() => { setSearchQuery(''); setSelectedCategory('Tất cả'); }}>
                                    <Icon name="refresh-cw" className="w-4 h-4" />
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}