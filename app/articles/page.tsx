'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchArticles, fetchAccounts } from '@/services/googleSheetService';
import type { ScientificArticle, Account, Badge } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { getUserBadges } from '@/utils/badgeUtils';
import { parseVNDateToDate } from '@/utils/dateUtils';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// ─── MathRenderer ────────────────────────────────────────────────────────────

const MathRenderer = React.memo(({ text }: { text: string }) => {
    if (typeof text !== 'string' || !text) return <>{text}</>;
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    try { return <BlockMath key={index} math={part.slice(2, -2)} />; }
                    catch { return <span key={index} className="text-red-500 font-mono">{part}</span>; }
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    try { return <InlineMath key={index} math={part.slice(1, -1)} />; }
                    catch { return <span key={index} className="text-red-500 font-mono">{part}</span>; }
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
});
MathRenderer.displayName = 'MathRenderer';

// ─── ArticleCard ─────────────────────────────────────────────────────────────

const ArticleCard = React.memo<{ article: ScientificArticle }>(({ article }) => {
    const { isNew, keywords } = useMemo(() => {
        const submissionDate = parseVNDateToDate(article.SubmissionDate);
        let isNew = false;
        if (submissionDate) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            isNew = submissionDate > sevenDaysAgo;
        }
        const keywords = article.Keywords.split(',').map(kw => kw.trim()).filter(Boolean).slice(0, 4);
        return { isNew, keywords };
    }, [article.SubmissionDate, article.Keywords]);

    return (
        <article className="ac-card group">
            {/* Top accent */}
            <div className="ac-accent" />

            {isNew && (
                <span className="ac-new-badge">
                    <Icon name="sparkles" className="w-2.5 h-2.5" /> Mới
                </span>
            )}

            <Link href={`/article/${article.ID}`} className="block mb-3">
                <h3 className="ac-title">
                    <MathRenderer text={article.Title} />
                </h3>
            </Link>

            <div className="ac-author">
                <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
                <span>{article.Authors}</span>
            </div>

            {article.Abstract && (
                <p className="ac-abstract">{article.Abstract}</p>
            )}

            {keywords.length > 0 && (
                <div className="ac-keywords">
                    {keywords.map((kw, idx) => (
                        <span key={idx} className="ac-keyword">{kw}</span>
                    ))}
                </div>
            )}

            <div className="ac-footer">
                <span className="ac-doi">
                    <Icon name="file-text" className="w-3 h-3 shrink-0" />
                    <span>{article.SM_DOI}</span>
                </span>
                <div className="ac-meta">
                    <span className="ac-category">
                        <Icon name="folder" className="w-3 h-3" />
                        {article.Category}
                    </span>
                    <span className="ac-date">
                        <Icon name="calendar" className="w-3 h-3" />
                        {article.SubmissionDate.split(' ')[0]}
                    </span>
                </div>
            </div>
        </article>
    );
});
ArticleCard.displayName = 'ArticleCard';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="ac-skeleton">
        <div className="ac-sk-line w-full h-4" />
        <div className="ac-sk-line w-4/5 h-4 mt-2" />
        <div className="ac-sk-line w-1/3 h-3 mt-3" />
        <div className="ac-sk-line w-full h-3 mt-4" />
        <div className="ac-sk-line w-5/6 h-3 mt-1" />
    </div>
);

// ─── Main wrapper ─────────────────────────────────────────────────────────────

export default function Articles() {
    return (
        <Suspense fallback={
<div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-orange-50 to-green-50 p-8">
    
    {/* Center loading indicator */}
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-emerald-100">
            <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-orange-500 animate-spin"></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-orange-600">
                Đang tải...
            </p>
        </div>
    </div>
</div>
        }>
            <ArticlesContent />
        </Suspense>
    );
}

// ─── ArticlesContent ──────────────────────────────────────────────────────────

function ArticlesContent() {
    const [articles, setArticles] = useState<ScientificArticle[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [keywordFilter, setKeywordFilter] = useState('All');
    const [message, setMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const searchParams = useSearchParams();

    const ARTICLES_PER_PAGE = 18;

    useEffect(() => {
        const msg = searchParams.get('message');
        if (msg) {
            setMessage(msg);
            window.history.replaceState({}, document.title, window.location.pathname);
            const t = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(t);
        }
    }, [searchParams]);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const [artData, accData] = await Promise.all([fetchArticles(), fetchAccounts()]);
                const sorted = artData.sort((a, b) => {
                    const tA = parseVNDateToDate(a.SubmissionDate)?.getTime() || 0;
                    const tB = parseVNDateToDate(b.SubmissionDate)?.getTime() || 0;
                    return tB - tA;
                });
                setArticles(sorted);
                setAccounts(accData);
            } catch { setError('Không thể tải tài liệu. Vui lòng thử lại.'); }
            finally { setIsLoading(false); }
        };
        load();
    }, []);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeCategory, keywordFilter]);

    const { subjectTabs, examTabs } = useMemo(() => {
        if (isLoading) return { subjectTabs: [], examTabs: [] };
        const SCHOOL = ['toán học','vật lý','hóa học','sinh học','ngữ văn','lịch sử','địa lý','tiếng anh','tin học','giáo dục công dân'];
        const cats = Array.from(new Set(articles.filter(a => a.Status === 'Approved').map(a => a.Category).filter(Boolean)));
        return {
            subjectTabs: cats.filter(c => SCHOOL.includes(c.toLowerCase())).sort(),
            examTabs: cats.filter(c => !SCHOOL.includes(c.toLowerCase())).sort(),
        };
    }, [articles, isLoading]);

    const popularKeywords = useMemo(() => {
        if (isLoading) return [];
        const counts: Record<string, number> = {};
        articles
            .filter(a => a.Status === 'Approved' && (activeCategory === 'All' || a.Category === activeCategory))
            .forEach(a => a.Keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
                .forEach(k => { const d = k.charAt(0).toUpperCase() + k.slice(1); counts[d] = (counts[d] || 0) + 1; }));
        return Object.entries(counts).sort(([,a],[,b]) => b - a).slice(0, 10).map(([k]) => k);
    }, [articles, isLoading, activeCategory]);

    const filteredArticles = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return articles.filter(a => a.Status === 'Approved').filter(a => {
            const catOk = activeCategory === 'All' || a.Category === activeCategory;
            const kwOk = keywordFilter === 'All' || a.Keywords.split(',').map(k => k.trim().toLowerCase()).includes(keywordFilter.toLowerCase());
            const txt = [a.Title, a.Authors, a.Keywords, a.Abstract, a.Category].filter(Boolean).join(' ').toLowerCase();
            const searchOk = !q || txt.includes(q);
            return catOk && kwOk && searchOk;
        });
    }, [articles, searchTerm, activeCategory, keywordFilter]);

    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = filteredArticles.slice((currentPage - 1) * ARTICLES_PER_PAGE, currentPage * ARTICLES_PER_PAGE);

    const handleCategoryChange = useCallback((cat: string) => { setActiveCategory(cat); setKeywordFilter('All'); }, []);

    const getPaginationItems = useCallback((): (number | string)[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const items: (number | string)[] = [1];
        if (currentPage > 3) items.push('...');
        let s = Math.max(2, currentPage - 1), e = Math.min(totalPages - 1, currentPage + 1);
        if (currentPage <= 3) { s = 2; e = 4; }
        else if (currentPage >= totalPages - 2) { s = totalPages - 3; e = totalPages - 1; }
        for (let i = s; i <= e; i++) items.push(i);
        if (currentPage < totalPages - 2) items.push('...');
        items.push(totalPages);
        return items;
    }, [totalPages, currentPage]);

    if (error) return (
        <div className="ar-error">
            <Icon name="alert-circle" className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-gray-500 mb-5 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="ar-retry-btn">
                <Icon name="refresh-cw" className="w-4 h-4" /> Thử lại
            </button>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

                /* ── Layout root ── */
                .ar-root { font-family: 'DM Sans', sans-serif; }

                /* ── Hero ── */
                .ar-hero {
                    background: linear-gradient(135deg, #166534 0%, #15803d 40%, #16a34a 70%, #0d9488 100%);
                    padding: 4rem 1.5rem 5rem;
                    position: relative; overflow: hidden; text-align: center;
                }
                .ar-hero::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px);
                    background-size: 28px 28px; pointer-events: none;
                }
                .ar-hero-orb1 {
                    position: absolute; top: -80px; right: -80px;
                    width: 280px; height: 280px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(251,146,60,.3), transparent 70%);
                    pointer-events: none;
                }
                .ar-hero-orb2 {
                    position: absolute; bottom: -60px; left: -60px;
                    width: 220px; height: 220px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(134,239,172,.2), transparent 70%);
                    pointer-events: none;
                }
                .ar-hero-inner { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }
                .ar-hero-tag {
                    display: inline-flex; align-items: center; gap: .4rem;
                    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
                    border-radius: 999px; padding: .3rem .9rem;
                    font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
                    color: #d1fae5; margin-bottom: 1.25rem;
                }
                .ar-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: ar-pulse 2s ease infinite; }
                .ar-hero-h1 {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: clamp(2rem, 5vw, 3.5rem);
                    font-weight: 800; color: #fff;
                    line-height: 1.15; letter-spacing: -.02em; margin-bottom: 1rem;
                }
                .ar-hero-h1 span {
                    background: linear-gradient(90deg, #fed7aa, #fb923c);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .ar-hero-sub { color: rgba(209,250,229,.8); font-size: 1rem; line-height: 1.7; max-width: 520px; margin: 0 auto 2rem; }

                .ar-hero-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.25rem; }
                .ar-submit-btn {
                    display: inline-flex; align-items: center; gap: .5rem;
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    color: #fff; font-weight: 700; font-size: .9rem;
                    padding: .8rem 1.75rem; border-radius: 14px; text-decoration: none;
                    box-shadow: 0 8px 24px rgba(234,88,12,.4);
                    transition: transform .2s, box-shadow .2s;
                }
                .ar-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(234,88,12,.5); }

                .ar-stats { display: flex; gap: 1.5rem; }
                .ar-stat {
                    display: flex; align-items: center; gap: .75rem;
                    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15);
                    border-radius: 14px; padding: .65rem 1rem;
                }
                .ar-stat-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: rgba(255,255,255,.2);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .ar-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.2rem; font-weight: 800; color: #fff; line-height: 1; }
                .ar-stat-lbl { font-size: .68rem; font-weight: 600; color: rgba(209,250,229,.7); text-transform: uppercase; letter-spacing: .05em; }

                /* ── Body ── */
                .ar-body { max-width: 1280px; margin: 0 auto; padding: 0 1rem 4rem; }

                /* Search bar */
                .ar-search-wrap {
                    max-width: 700px; margin: -1.75rem auto 0;
                    position: relative; z-index: 10;
                }
                .ar-search-bar {
                    background: rgba(255,255,255,.95);
                    border-radius: 16px; padding: .375rem .375rem .375rem 1rem;
                    display: flex; align-items: center; gap: .75rem;
                    box-shadow: 0 16px 48px rgba(0,0,0,.15);
                    border: 1.5px solid rgba(255,255,255,.9);
                }
                .ar-search-input {
                    flex: 1; border: none; background: transparent;
                    font-size: .95rem; color: #0f2419; font-family: 'DM Sans', sans-serif;
                    outline: none;
                }
                .ar-search-input::placeholder { color: #9ca3af; }
                .ar-search-clear {
                    background: none; border: none; cursor: pointer;
                    color: #9ca3af; display: flex; align-items: center; padding: .25rem;
                    border-radius: 8px; transition: color .2s, background .2s;
                }
                .ar-search-clear:hover { color: #374151; background: #f3f4f6; }

                /* Success banner */
                .ar-success {
                    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                    border-left: 3px solid #22c55e; border-radius: 12px;
                    padding: .875rem 1rem; display: flex; gap: .625rem;
                    font-size: .85rem; color: #166534; margin: 1.5rem 0;
                }

                /* Keyword chips */
                .ar-chips { display: flex; gap: .5rem; overflow-x: auto; scrollbar-width: none; padding: 1.5rem 0 .5rem; }
                .ar-chips::-webkit-scrollbar { display: none; }
                .ar-chip {
                    display: flex; align-items: center; gap: .4rem;
                    padding: .45rem 1rem; border-radius: 999px;
                    font-size: .78rem; font-weight: 700; white-space: nowrap;
                    cursor: pointer; border: 1.5px solid transparent;
                    transition: all .2s; background: #fff; color: #6b7f72; border-color: #e5e7eb;
                }
                .ar-chip:hover { border-color: #86efac; color: #16a34a; }
                .ar-chip.active {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; border-color: transparent;
                    box-shadow: 0 4px 14px rgba(22,163,74,.3);
                }

                /* ── Grid layout ── */
                .ar-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1rem; }
                @media (min-width: 1024px) { .ar-grid { grid-template-columns: 240px 1fr; } }

                /* ── Sidebar ── */
                .ar-sidebar { position: sticky; top: 1.5rem; align-self: start; display: flex; flex-direction: column; gap: 1rem; }
                .ar-sidebar-box {
                    background: #fff; border-radius: 18px;
                    border: 1.5px solid #f0f4f1; padding: 1.1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,.04);
                }
                .ar-sidebar-title {
                    font-size: .72rem; font-weight: 800; color: #8aaa93;
                    text-transform: uppercase; letter-spacing: .08em;
                    margin-bottom: .75rem; display: flex; align-items: center; gap: .4rem;
                }
                .ar-sidebar-btn {
                    width: 100%; text-align: left;
                    padding: .5rem .75rem; border-radius: 10px; border: none;
                    font-size: .82rem; font-weight: 600; cursor: pointer;
                    transition: all .15s; background: transparent; color: #6b7f72;
                }
                .ar-sidebar-btn:hover { background: #f0fdf4; color: #16a34a; }
                .ar-sidebar-btn.active { background: linear-gradient(135deg, rgba(22,163,74,.12), rgba(21,128,61,.06)); color: #16a34a; font-weight: 700; }
                .ar-sidebar-btn.active-purple { background: linear-gradient(135deg, rgba(147,51,234,.1), rgba(109,40,217,.05)); color: #7c3aed; font-weight: 700; }

                /* ── Result info ── */
                .ar-result-info { font-size: .8rem; color: #8aaa93; margin-bottom: 1rem; font-weight: 500; }
                .ar-result-info strong { color: #0f2419; }

                /* ── Article card ── */
                .ac-card {
                    background: #fff; border-radius: 18px;
                    border: 1.5px solid #f0f4f1;
                    padding: 1.25rem;
                    display: flex; flex-direction: column;
                    position: relative; overflow: hidden;
                    transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s;
                    box-shadow: 0 2px 8px rgba(0,0,0,.04);
                }
                .ac-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px rgba(22,163,74,.1), 0 4px 12px rgba(0,0,0,.06);
                    border-color: #86efac;
                }
                .ac-accent {
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, #16a34a, #0d9488);
                    opacity: 0; transition: opacity .25s;
                }
                .ac-card:hover .ac-accent { opacity: 1; }
                .ac-new-badge {
                    position: absolute; top: .75rem; right: .75rem;
                    display: inline-flex; align-items: center; gap: .3rem;
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    color: #fff; font-size: .65rem; font-weight: 800;
                    padding: .25rem .65rem; border-radius: 999px;
                    letter-spacing: .04em; text-transform: uppercase;
                    box-shadow: 0 2px 8px rgba(234,88,12,.35);
                    animation: ar-pulse 2s ease infinite;
                }
                .ac-title {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: .95rem; font-weight: 700; color: #0f2419;
                    line-height: 1.4;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                    text-decoration: none; transition: color .2s;
                }
                .ac-card:hover .ac-title { color: #16a34a; }
                .ac-author {
                    display: flex; align-items: center; gap: .4rem;
                    font-size: .75rem; color: #8aaa93; font-weight: 500; margin-bottom: .6rem;
                }
                .ac-abstract {
                    font-size: .78rem; color: #6b7f72; line-height: 1.6; flex: 1;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                    margin-bottom: .75rem;
                }
                .ac-keywords { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .875rem; }
                .ac-keyword {
                    font-size: .68rem; font-weight: 600; color: #3d5a45;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    padding: .2rem .6rem; border-radius: 999px;
                    transition: background .15s, color .15s;
                }
                .ac-card:hover .ac-keyword { background: #dcfce7; }
                .ac-footer { margin-top: auto; padding-top: .75rem; border-top: 1px solid #f0f4f1; }
                .ac-doi { display: flex; align-items: center; gap: .35rem; font-size: .65rem; color: #9ca3af; font-family: monospace; margin-bottom: .5rem; overflow: hidden; }
                .ac-doi span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .ac-meta { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
                .ac-category {
                    display: inline-flex; align-items: center; gap: .3rem;
                    font-size: .68rem; font-weight: 700; color: #16a34a;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    padding: .25rem .65rem; border-radius: 8px;
                }
                .ac-date { display: flex; align-items: center; gap: .3rem; font-size: .68rem; color: #9ca3af; flex-shrink: 0; }

                /* ── Skeleton ── */
                .ac-skeleton { background: #fff; border-radius: 18px; border: 1.5px solid #f0f4f1; padding: 1.25rem; }
                .ac-sk-line {
                    border-radius: 6px;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e9ecea 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: ar-shimmer 1.5s infinite;
                }

                /* ── Empty state ── */
                .ar-empty {
                    background: #fff; border-radius: 24px;
                    border: 2px dashed #d1fae5; padding: 4rem 2rem; text-align: center;
                }
                .ar-empty-icon {
                    width: 64px; height: 64px; border-radius: 18px;
                    background: linear-gradient(135deg, rgba(134,239,172,.3), rgba(34,197,94,.1));
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                }
                .ar-reset-btn {
                    display: inline-flex; align-items: center; gap: .5rem;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; font-weight: 700; font-size: .85rem;
                    padding: .65rem 1.5rem; border-radius: 12px; border: none; cursor: pointer;
                    box-shadow: 0 4px 14px rgba(22,163,74,.3);
                    transition: transform .2s, box-shadow .2s;
                }
                .ar-reset-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(22,163,74,.4); }

                /* Error / loading */
                .ar-error { background: #fff; border-radius: 24px; border: 2px dashed #fecdd3; padding: 4rem 2rem; text-align: center; }
                .ar-retry-btn {
                    display: inline-flex; align-items: center; gap: .5rem;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; font-weight: 700; font-size: .85rem;
                    padding: .65rem 1.5rem; border-radius: 12px; border: none; cursor: pointer;
                    box-shadow: 0 4px 14px rgba(22,163,74,.3);
                }
                .ar-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 24rem; gap: 1.25rem; }
                .ar-spinner {
                    width: 52px; height: 52px; border-radius: 50%;
                    border: 4px solid #bbf7d0; border-top-color: #16a34a;
                    animation: ar-spin .8s linear infinite;
                }
                .ar-loading-text { font-size: .9rem; color: #6b7f72; font-weight: 600; font-family: 'DM Sans', sans-serif; }

                /* ── Pagination ── */
                .ar-pagination { display: flex; justify-content: center; align-items: center; gap: .5rem; margin-top: 2.5rem; }
                .ar-page-btn {
                    min-width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e5e7eb;
                    background: #fff; color: #6b7f72; font-size: .82rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    transition: all .2s; padding: 0 .75rem;
                }
                .ar-page-btn:hover:not(:disabled) { border-color: #86efac; color: #16a34a; }
                .ar-page-btn:disabled { opacity: .35; cursor: not-allowed; }
                .ar-page-btn.active {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    border-color: transparent; color: #fff;
                    box-shadow: 0 4px 14px rgba(22,163,74,.35);
                }

                /* ── Keyframes ── */
                @keyframes ar-spin { to { transform: rotate(360deg); } }
                @keyframes ar-pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
                @keyframes ar-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
            `}</style>

            <div className="ar-root">
                {/* ── Hero ── */}
                <div className="ar-hero">
                    <div className="ar-hero-orb1" />
                    <div className="ar-hero-orb2" />
                    <div className="ar-hero-inner">
                        <div className="ar-hero-tag">
                            <span className="ar-hero-dot" />
                            Kho tài liệu học tập
                        </div>
                        <h1 className="ar-hero-h1">
                            Tài liệu <span>các môn học</span>
                        </h1>
                        <p className="ar-hero-sub">
                            Khám phá kho tài liệu, nghiên cứu khoa học và đề thi thử từ cộng đồng học tập.
                        </p>
                        <div className="ar-hero-actions">
                            <Link href="/articles/submit" className="ar-submit-btn">
                                <Icon name="plus" className="w-4 h-4" />
                                Đăng tài liệu
                            </Link>
                            {!isLoading && (
                                <div className="ar-stats">
                                    <div className="ar-stat">
                                        <div className="ar-stat-icon">
                                            <Icon name="file-text" className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="ar-stat-num">{filteredArticles.length}</div>
                                            <div className="ar-stat-lbl">Tài liệu</div>
                                        </div>
                                    </div>
                                    <div className="ar-stat">
                                        <div className="ar-stat-icon">
                                            <Icon name="users" className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="ar-stat-num">{accounts.length}</div>
                                            <div className="ar-stat-lbl">Tác giả</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ar-body">
                    {/* ── Floating search ── */}
                    <div className="ar-search-wrap">
                        <div className="ar-search-bar">
                            <Icon name="search" className="w-5 h-5 text-green-500 shrink-0" />
                            <input
                                type="text"
                                className="ar-search-input"
                                placeholder="Tìm tài liệu, tác giả, từ khóa..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="ar-search-clear" onClick={() => setSearchTerm('')}>
                                    <Icon name="x" className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Success message */}
                    {message && (
                        <div className="ar-success">
                            <Icon name="check-circle" className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <div style={{ fontWeight: 700 }}>Thành công</div>
                                <div>{message}</div>
                            </div>
                        </div>
                    )}

                    {/* Keyword chips */}
                    {popularKeywords.length > 0 && (
                        <div className="ar-chips">
                            <button className={`ar-chip ${keywordFilter === 'All' ? 'active' : ''}`} onClick={() => setKeywordFilter('All')}>
                                <Icon name="grid" className="w-3.5 h-3.5" /> Tất cả
                            </button>
                            {popularKeywords.map(kw => (
                                <button key={kw} className={`ar-chip ${keywordFilter === kw ? 'active' : ''}`} onClick={() => setKeywordFilter(kw)}>
                                    <Icon name="tag" className="w-3.5 h-3.5" /> {kw}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Main grid ── */}
                    <div className="ar-grid">
                        {/* Sidebar */}
                        <aside className="ar-sidebar hidden lg:flex">
                            <div className="ar-sidebar-box">
                                <div className="ar-sidebar-title">
                                    <Icon name="book-open" className="w-3.5 h-3.5" /> Môn học
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                                    <button className={`ar-sidebar-btn ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => handleCategoryChange('All')}>Tất cả</button>
                                    {subjectTabs.map(cat => (
                                        <button key={cat} className={`ar-sidebar-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => handleCategoryChange(cat)}>{cat}</button>
                                    ))}
                                </div>
                            </div>

                            {examTabs.length > 0 && (
                                <div className="ar-sidebar-box">
                                    <div className="ar-sidebar-title">
                                        <Icon name="clipboard" className="w-3.5 h-3.5" /> Dạng đề
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                                        {examTabs.map(cat => (
                                            <button key={cat} className={`ar-sidebar-btn ${activeCategory === cat ? 'active-purple' : ''}`} onClick={() => handleCategoryChange(cat)}>{cat}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        {/* Main */}
                        <main>
                            {isLoading ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                    {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : paginatedArticles.length > 0 ? (
                                <>
                                    <p className="ar-result-info">
                                        Hiển thị <strong>{(currentPage - 1) * ARTICLES_PER_PAGE + 1}–{Math.min(currentPage * ARTICLES_PER_PAGE, filteredArticles.length)}</strong> trong <strong>{filteredArticles.length}</strong> tài liệu
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                        {paginatedArticles.map(article => <ArticleCard key={article.ID} article={article} />)}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <nav className="ar-pagination">
                                            <button className="ar-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                                <Icon name="chevron-left" className="w-4 h-4" />
                                            </button>
                                            {getPaginationItems().map((item, i) =>
                                                typeof item === 'number' ? (
                                                    <button key={i} className={`ar-page-btn ${currentPage === item ? 'active' : ''}`} onClick={() => setCurrentPage(item)}>{item}</button>
                                                ) : (
                                                    <span key={i} style={{ color: '#9ca3af', padding: '0 .25rem' }}>⋯</span>
                                                )
                                            )}
                                            <button className="ar-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                                <Icon name="chevron-right" className="w-4 h-4" />
                                            </button>
                                        </nav>
                                    )}
                                </>
                            ) : (
                                <div className="ar-empty">
                                    <div className="ar-empty-icon">
                                        <Icon name="search" className="w-7 h-7 text-green-500" />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f2419', marginBottom: '.5rem' }}>Không tìm thấy tài liệu</h3>
                                    <p style={{ fontSize: '.85rem', color: '#8aaa93', marginBottom: '1.25rem' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                    <button className="ar-reset-btn" onClick={() => { setSearchTerm(''); setActiveCategory('All'); setKeywordFilter('All'); }}>
                                        <Icon name="refresh-cw" className="w-4 h-4" /> Đặt lại bộ lọc
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}