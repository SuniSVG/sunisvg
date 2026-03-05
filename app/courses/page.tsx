'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchCourses } from '@/services/googleSheetService';
import type { Course } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

// ─── CourseCard ──────────────────────────────────────────────────────────────

const CourseCard = React.memo<{ course: Course; index: number; purchaseCount?: number }>(({ course, index, purchaseCount = 0 }) => {
    const imageUrl = useMemo(() => {
        if (!course.ImageURL) return '';
        return convertGoogleDriveUrl(course.ImageURL);
    }, [course.ImageURL]);

    const isFree = course.Price === 0;

    return (
        <Link
            href={`/courses/${course.ID}`}
            className="cc-card group"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Thumbnail */}
            <div className="cc-thumb">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.Title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="cc-thumb-fallback">
                        <Icon name="book-open" className="w-10 h-10 text-green-300" />
                    </div>
                )}
                {/* Overlay gradient */}
                <div className="cc-thumb-overlay" />
                {/* Category badge */}
                <span className="cc-category-badge">{course.Category}</span>
                {/* Free badge */}
                {isFree && <span className="cc-free-badge">Miễn phí</span>}
            </div>

            {/* Body */}
            <div className="cc-body">
                <h3 className="cc-title">{course.Title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                    {course.Authors && (
                        <div className="cc-author">
                            <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
                            <span>{course.Authors}</span>
                        </div>
                    )}
                    {purchaseCount > 0 && (
                        <div className="cc-author text-orange-600 font-semibold">
                            <Icon name="users" className="w-3.5 h-3.5 shrink-0" />
                            <span>{purchaseCount} học viên</span>
                        </div>
                    )}
                </div>

                {course.Abstract && (
                    <p className="cc-abstract">{course.Abstract}</p>
                )}

                {/* Footer */}
                <div className="cc-footer">
                    <div>
                        <span className="cc-price-label">Học phí</span>
                        <span className={`cc-price ${isFree ? 'cc-price-free' : 'cc-price-paid'}`}>
                            {isFree ? 'Miễn phí' : `${course.Price.toLocaleString('vi-VN')}đ`}
                        </span>
                    </div>
                    <div className="cc-cta">
                        <Icon name="arrow-right" className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
});

CourseCard.displayName = 'CourseCard';

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="cc-skeleton">
        <div className="cc-skeleton-thumb" />
        <div className="cc-skeleton-body">
            <div className="cc-skeleton-line w-3/4" />
            <div className="cc-skeleton-line w-1/2 mt-2" />
            <div className="cc-skeleton-line w-full mt-4" />
            <div className="cc-skeleton-line w-5/6 mt-1" />
        </div>
    </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [purchaseStats, setPurchaseStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [paidPage, setPaidPage] = useState(1);
    const [freePage, setFreePage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const loadCourses = useCallback(async (force: boolean = false) => {
        setIsLoading(true);
        try {
            const data = await fetchCourses();
            const processed = data
                .filter(c => c.Title && String(c.Title).trim() !== '')
                .map((c, i) => ({ ...c, ID: c.ID || i.toString() }));
            setCourses(processed);
            setPurchaseStats({});
        } catch (err) {
            setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const categories = useMemo(() =>
        ['Tất cả', ...Array.from(new Set(courses.map(c => c.Category).filter(Boolean)))],
        [courses]
    );

    const filtered = useMemo(() => {
        return courses.filter(c => {
            const matchSearch = !search ||
                c.Title.toLowerCase().includes(search.toLowerCase()) ||
                (c.Authors || '').toLowerCase().includes(search.toLowerCase());
            const matchCat = activeCategory === 'Tất cả' || c.Category === activeCategory;
            return matchSearch && matchCat;
        });
    }, [courses, search, activeCategory]);

    useEffect(() => {
        setPaidPage(1);
        setFreePage(1);
    }, [search, activeCategory]);

    const { paidCourses, freeCourses } = useMemo(() => {
        const paid: Course[] = [];
        const free: Course[] = [];
        filtered.forEach(c => {
            if (c.Price > 0) paid.push(c);
            else free.push(c);
        });
        return { paidCourses: paid, freeCourses: free };
    }, [filtered]);

    const paginatedPaid = paidCourses.slice((paidPage - 1) * ITEMS_PER_PAGE, paidPage * ITEMS_PER_PAGE);
    const paginatedFree = freeCourses.slice((freePage - 1) * ITEMS_PER_PAGE, freePage * ITEMS_PER_PAGE);
    
    const totalPaidPages = Math.ceil(paidCourses.length / ITEMS_PER_PAGE);
    const totalFreePages = Math.ceil(freeCourses.length / ITEMS_PER_PAGE);

    // Helper để lấy số lượng mua (theo Category hoặc ID)
    const getPurchaseCount = (course: Course) => {
        return purchaseStats[course.Category] || purchaseStats[course.ID] || 0;
    };

    const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-center items-center gap-2 mt-8">
                <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-gray-700">Trang {currentPage} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Icon name="chevron-right" className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                .cp-wrap { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #f8faf8; }

                /* ── Hero ── */
                .cp-hero {
                    background: linear-gradient(135deg, #166534 0%, #15803d 40%, #16a34a 70%, #0d9488 100%);
                    padding: 5rem 1rem 4rem;
                    position: relative;
                    overflow: hidden;
                }
                .cp-hero::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
                .cp-hero-orb1 {
                    position: absolute; top: -80px; right: -80px;
                    width: 320px; height: 320px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(251,146,60,.25), transparent 70%);
                    pointer-events: none;
                }
                .cp-hero-orb2 {
                    position: absolute; bottom: -60px; left: -60px;
                    width: 240px; height: 240px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(134,239,172,.2), transparent 70%);
                    pointer-events: none;
                }
                .cp-hero-inner {
                    max-width: 900px; margin: 0 auto;
                    position: relative; z-index: 1; text-align: center;
                }
                .cp-hero-tag {
                    display: inline-flex; align-items: center; gap: .4rem;
                    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
                    border-radius: 999px; padding: .3rem .9rem;
                    font-size: .7rem; font-weight: 700; letter-spacing: .08em;
                    text-transform: uppercase; color: #d1fae5;
                    margin-bottom: 1.25rem;
                }
                .cp-hero-tag-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #f97316; animation: cp-pulse 2s ease infinite;
                }
                .cp-hero-h1 {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: clamp(2rem, 5vw, 3.5rem);
                    font-weight: 800; color: #fff;
                    line-height: 1.15; margin-bottom: 1rem;
                    letter-spacing: -.02em;
                }
                .cp-hero-h1 span {
                    background: linear-gradient(90deg, #fed7aa, #fb923c);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .cp-hero-sub {
                    color: rgba(209,250,229,.8); font-size: 1rem;
                    line-height: 1.7; max-width: 520px; margin: 0 auto 2rem;
                }

                /* Search bar */
                .cp-search-bar {
                    max-width: 560px; margin: 0 auto;
                    background: rgba(255,255,255,.95);
                    border-radius: 16px;
                    padding: .375rem .375rem .375rem 1rem;
                    display: flex; align-items: center; gap: .75rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,.2);
                }
                .cp-search-input {
                    flex: 1; border: none; background: transparent;
                    font-size: .95rem; color: #1a3326;
                    font-family: 'DM Sans', sans-serif;
                }
                .cp-search-input:focus { outline: none; }
                .cp-search-input::placeholder { color: #9ca3af; }
                .cp-search-btn {
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    color: #fff; font-weight: 700; font-size: .85rem;
                    padding: .65rem 1.25rem; border-radius: 11px;
                    border: none; cursor: pointer; white-space: nowrap;
                    transition: transform .15s, box-shadow .15s;
                    box-shadow: 0 4px 14px rgba(234,88,12,.4);
                }
                .cp-search-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(234,88,12,.5); }

                /* Stats strip */
                .cp-stats {
                    display: flex; justify-content: center; gap: 2.5rem;
                    margin-top: 2rem;
                }
                .cp-stat { text-align: center; }
                .cp-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; }
                .cp-stat-lbl { font-size: .7rem; font-weight: 500; color: rgba(209,250,229,.7); text-transform: uppercase; letter-spacing: .06em; }

                /* ── Body ── */
                .cp-body { max-width: 1280px; margin: 0 auto; padding: 2.5rem 1rem 4rem; }

                /* Category tabs */
                .cp-tabs {
                    display: flex; gap: .5rem; overflow-x: auto;
                    scrollbar-width: none; padding-bottom: .25rem;
                    margin-bottom: 2rem;
                }
                .cp-tabs::-webkit-scrollbar { display: none; }
                .cp-tab {
                    padding: .5rem 1.1rem; border-radius: 999px;
                    font-size: .8rem; font-weight: 700; white-space: nowrap;
                    border: 1.5px solid transparent; cursor: pointer;
                    transition: all .2s; background: #fff;
                    color: #6b7f72;
                    border-color: #e5e7eb;
                }
                .cp-tab:hover { border-color: #86efac; color: #16a34a; }
                .cp-tab.active {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; border-color: transparent;
                    box-shadow: 0 4px 14px rgba(22,163,74,.35);
                }

                /* Result count */
                .cp-count {
                    font-size: .8rem; color: #8aaa93; font-weight: 500;
                    margin-bottom: 1.5rem;
                }
                .cp-count strong { color: #1a3326; }

                /* Grid */
                .cp-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
                    gap: 1.5rem;
                }

                /* ── Card ── */
                .cc-card {
                    background: #fff;
                    border-radius: 20px;
                    border: 1.5px solid #f0f4f1;
                    overflow: hidden;
                    display: flex; flex-direction: column;
                    text-decoration: none;
                    transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease, border-color .25s;
                    box-shadow: 0 2px 8px rgba(0,0,0,.04);
                    opacity: 0;
                    animation: cp-fadeup .5s cubic-bezier(.16,1,.3,1) both;
                }
                .cc-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 16px 40px rgba(22,163,74,.12), 0 4px 12px rgba(0,0,0,.06);
                    border-color: #86efac;
                }

                /* Thumb */
                .cc-thumb {
                    position: relative; height: 196px;
                    background: linear-gradient(135deg, #dcfce7, #d1fae5);
                    overflow: hidden; flex-shrink: 0;
                }
                .cc-thumb-fallback {
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                }
                .cc-thumb-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 55%);
                    pointer-events: none;
                }
                .cc-category-badge {
                    position: absolute; top: .75rem; left: .75rem;
                    background: rgba(255,255,255,.9);
                    backdrop-filter: blur(8px);
                    border-radius: 999px;
                    padding: .25rem .75rem;
                    font-size: .68rem; font-weight: 800;
                    color: #15803d; letter-spacing: .04em;
                    text-transform: uppercase;
                    border: 1px solid rgba(134,239,172,.4);
                }
                .cc-free-badge {
                    position: absolute; top: .75rem; right: .75rem;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; border-radius: 999px;
                    padding: .25rem .75rem;
                    font-size: .68rem; font-weight: 800;
                    letter-spacing: .04em; text-transform: uppercase;
                    box-shadow: 0 2px 8px rgba(22,163,74,.4);
                }

                /* Body */
                .cc-body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; }
                .cc-title {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: 1rem; font-weight: 700;
                    color: #0f2419; line-height: 1.4;
                    display: -webkit-box; -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical; overflow: hidden;
                    margin-bottom: .5rem;
                    transition: color .2s;
                }
                .cc-card:hover .cc-title { color: #16a34a; }
                .cc-author {
                    display: flex; align-items: center; gap: .4rem;
                    font-size: .75rem; color: #8aaa93; font-weight: 500;
                    margin-bottom: .75rem;
                }
                .cc-abstract {
                    font-size: .78rem; color: #6b7f72; line-height: 1.6;
                    display: -webkit-box; -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical; overflow: hidden;
                    flex: 1; margin-bottom: 1rem;
                }
                .cc-footer {
                    display: flex; align-items: center; justify-content: space-between;
                    padding-top: .875rem;
                    border-top: 1px solid #f0f4f1;
                    margin-top: auto;
                }
                .cc-price-label { display: block; font-size: .65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; }
                .cc-price { display: block; font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.1rem; font-weight: 800; }
                .cc-price-free { color: #16a34a; }
                .cc-price-paid { color: #ea580c; }
                .cc-cta {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: #f0fdf4; display: flex; align-items: center; justify-content: center;
                    color: #16a34a;
                    transition: background .2s, color .2s, transform .2s;
                }
                .cc-card:hover .cc-cta {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    color: #fff; transform: translateX(2px);
                }

                /* ── Skeleton ── */
                .cc-skeleton { background: #fff; border-radius: 20px; border: 1.5px solid #f0f4f1; overflow: hidden; }
                .cc-skeleton-thumb { height: 196px; background: linear-gradient(90deg, #f3f4f6 25%, #e9ecea 50%, #f3f4f6 75%); background-size: 200% 100%; animation: cp-shimmer 1.5s infinite; }
                .cc-skeleton-body { padding: 1.25rem; }
                .cc-skeleton-line { height: 14px; border-radius: 7px; background: linear-gradient(90deg, #f3f4f6 25%, #e9ecea 50%, #f3f4f6 75%); background-size: 200% 100%; animation: cp-shimmer 1.5s infinite; }
                .cc-skeleton-line.mt-2 { margin-top: .5rem; }
                .cc-skeleton-line.mt-4 { margin-top: 1rem; }
                .cc-skeleton-line.mt-1 { margin-top: .25rem; }
                .cc-skeleton-line.w-3\\/4 { width: 75%; }
                .cc-skeleton-line.w-1\\/2 { width: 50%; }
                .cc-skeleton-line.w-full { width: 100%; }
                .cc-skeleton-line.w-5\\/6 { width: 83%; }

                /* ── Empty / Error ── */
                .cp-empty {
                    background: #fff; border-radius: 24px;
                    border: 2px dashed #d1fae5;
                    padding: 5rem 2rem; text-align: center;
                }
                .cp-empty-icon {
                    width: 72px; height: 72px; border-radius: 20px;
                    background: linear-gradient(135deg, rgba(134,239,172,.3), rgba(34,197,94,.1));
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                }

                /* ── Keyframes ── */
                @keyframes cp-fadeup {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes cp-shimmer {
                    from { background-position: 200% 0; }
                    to   { background-position: -200% 0; }
                }
                @keyframes cp-pulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: .5; transform: scale(.8); }
                }
            `}</style>

            <div className="cp-wrap">
                {/* ── Hero ── */}
                <div className="cp-hero">
                    <div className="cp-hero-orb1" />
                    <div className="cp-hero-orb2" />
                    <div className="cp-hero-inner">
                        <div className="cp-hero-tag">
                            <span className="cp-hero-tag-dot" />
                            Nền tảng học tập
                        </div>
                        <h1 className="cp-hero-h1">
                            Khóa học <span>trực tuyến</span><br />chất lượng cao
                        </h1>
                        <p className="cp-hero-sub">
                            Nâng cao kiến thức với các khóa học từ đội ngũ giảng viên hàng đầu, bám sát chương trình thi cử quốc gia.
                        </p>

                        {/* Search */}
                        <div className="cp-search-bar">
                            <Icon name="search" className="w-5 h-5 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                className="cp-search-input"
                                placeholder="Tìm kiếm khóa học, giảng viên..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button 
                                onClick={() => loadCourses(true)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-xl hover:bg-green-50 mr-2"
                                title="Làm mới dữ liệu"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="20" height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className={isLoading ? 'animate-spin' : ''}
                                >
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                    <path d="M3 21v-5h5" />
                                </svg>
                            </button>
                            <button className="cp-search-btn">Tìm kiếm</button>
                        </div>

                        {/* Stats */}
                        {!isLoading && (
                            <div className="cp-stats">
                                <div className="cp-stat">
                                    <div className="cp-stat-num">{courses.length}+</div>
                                    <div className="cp-stat-lbl">Khóa học</div>
                                </div>
                                <div className="cp-stat">
                                    <div className="cp-stat-num">{courses.filter(c => c.Price === 0).length}</div>
                                    <div className="cp-stat-lbl">Miễn phí</div>
                                </div>
                                <div className="cp-stat">
                                    <div className="cp-stat-num">{categories.length - 1}</div>
                                    <div className="cp-stat-lbl">Danh mục</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="cp-body">
                    {/* Category tabs */}
                    {!isLoading && categories.length > 1 && (
                        <div className="cp-tabs">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`cp-tab ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Result count */}
                    {!isLoading && !error && (
                        <p className="cp-count">
                            Hiển thị <strong>{filtered.length}</strong> / {courses.length} khóa học
                        </p>
                    )}

                    {/* Grid */}
                    {isLoading ? (
                        <div className="cp-grid">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : error ? (
                        <div className="cp-empty">
                            <div className="cp-empty-icon">
                                <Icon name="alert-circle" className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
                            <p className="text-sm text-gray-500 mb-5">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-sm shadow-md shadow-green-100"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="space-y-12">
                            {/* Paid Section */}
                            {paidCourses.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600"><Icon name="star" className="w-6 h-6" /></div>
                                        <h2 className="text-2xl font-bold text-gray-900">Khóa học trả phí</h2>
                                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">{paidCourses.length}</span>
                                    </div>
                                    <div className="cp-grid">
                                        {paginatedPaid.map((course, index) => (
                                            <CourseCard 
                                                key={`${course.ID}-${index}`} 
                                                course={course} 
                                                index={index} 
                                                purchaseCount={getPurchaseCount(course)}
                                            />
                                        ))}
                                    </div>
                                    {renderPagination(paidPage, totalPaidPages, setPaidPage)}
                                </div>
                            )}
                            {paidCourses.length > 0 && freeCourses.length > 0 && <div className="border-t border-gray-200" />}
                            {/* Free Section */}
                            {freeCourses.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Icon name="gift" className="w-6 h-6" /></div>
                                        <h2 className="text-2xl font-bold text-gray-900">Khóa học miễn phí</h2>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{freeCourses.length}</span>
                                    </div>
                                    <div className="cp-grid">
                                        {paginatedFree.map((course, index) => (
                                            <CourseCard 
                                                key={`${course.ID}-${index}`} 
                                                course={course} 
                                                index={index}
                                                purchaseCount={getPurchaseCount(course)}
                                            />
                                        ))}
                                    </div>
                                    {renderPagination(freePage, totalFreePages, setFreePage)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="cp-empty">
                            <div className="cp-empty-icon">
                                <Icon name="book-open" className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy khóa học</h3>
                            <p className="text-sm text-gray-500">Thử thay đổi từ khóa hoặc danh mục tìm kiếm.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}