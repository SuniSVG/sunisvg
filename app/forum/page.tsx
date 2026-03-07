'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchForumPosts, fetchForumComments, fetchAccounts, updatePostUpvote } from '@/services/googleSheetService';
import type { ForumPost, ForumComment, Account } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { timeAgo } from '@/utils/dateUtils';

const FORUM_CHANNELS = [
    { name: 'Tất cả', icon: 'grid', color: 'from-emerald-500 to-orange-500' },
    { name: 'Thảo luận chung', icon: 'message-circle', color: 'from-blue-500 to-cyan-500' },
    { name: 'Toán học', icon: 'calculator', color: 'from-purple-500 to-pink-500' },
    { name: 'Vật lý', icon: 'zap', color: 'from-yellow-500 to-orange-500' },
    { name: 'Hóa học', icon: 'flask', color: 'from-green-500 to-emerald-500' },
    { name: 'Sinh học', icon: 'leaf', color: 'from-emerald-500 to-green-600' },
    { name: 'Ngữ văn', icon: 'book-open', color: 'from-red-500 to-pink-500' },
    { name: 'Lịch sử', icon: 'book', color: 'from-amber-600 to-orange-600' },
    { name: 'Địa lý', icon: 'globe', color: 'from-blue-600 to-cyan-600' },
    { name: 'Tiếng Anh', icon: 'type', color: 'from-indigo-500 to-purple-500' },
    { name: 'Hỏi đáp', icon: 'help-circle', color: 'from-teal-500 to-emerald-500' },
    { name: 'Những câu chuyện ngoài lề', icon: 'coffee', color: 'from-orange-500 to-red-500' },
    { name: 'Phòng tranh luận', icon: 'message-square', color: 'from-red-600 to-pink-600' },
    { name: 'Phòng thú tội', icon: 'lock', color: 'from-gray-600 to-gray-800' }
];

type SortByType = 'new' | 'top';

const parseForumDate = (dateStr: string | undefined): Date => {
    if (!dateStr) return new Date(0);
    
    // Handle format: HH:mm:ss dd/MM/yyyy (e.g., 13:10:12 11/9/2025)
    // This matches the sample data provided: "13:10:12 11/9/2025"
    const timeDateRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.trim().match(timeDateRegex);
    
    if (match) {
        const [_, h, m, s, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    // Handle format: dd/MM/yyyy HH:mm:ss (Standard VN)
    const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match2 = dateStr.trim().match(dateTimeRegex);
    
    if (match2) {
        const [_, day, month, year, h, m, s] = match2;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

export default function ForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState('Tất cả');
    const [sortBy, setSortBy] = useState<SortByType>('new');
    const [currentPage, setCurrentPage] = useState(1);
    const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const POSTS_PER_PAGE = 10;

    useEffect(() => {
        const loadForumData = async () => {
            setIsLoading(true);
            try {
                const [postData, commentData, accountData] = await Promise.all([
                    fetchForumPosts(false),
                    fetchForumComments(false),
                    fetchAccounts(),
                ]);
                setPosts(postData);
                setComments(commentData);
                setAccounts(accountData);
            } catch (err) {
                console.error("Error loading forum data:", err);
                setError('Không thể tải dữ liệu diễn đàn. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };
        loadForumData();
    }, []);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedChannel, sortBy]);

    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(null);
            if (e.key === 'ArrowRight') setLightbox(l => l && ({ ...l, index: (l.index + 1) % l.urls.length }));
            if (e.key === 'ArrowLeft') setLightbox(l => l && ({ ...l, index: (l.index - 1 + l.urls.length) % l.urls.length }));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightbox]);

    const commentCounts = useMemo(() => {
        const counts = new Map<string, number>();
        comments.forEach(comment => {
            counts.set(comment.PostID, (counts.get(comment.PostID) || 0) + 1);
        });
        return counts;
    }, [comments]);

    const handlePostUpdate = (updatedPost: ForumPost) => {
        setPosts(prevPosts => prevPosts.map(p => p.ID === updatedPost.ID ? updatedPost : p));
    };

    const sortedAndFilteredPosts = useMemo(() => {
        let filtered = posts;
        if (selectedChannel !== 'Tất cả') {
            filtered = posts.filter(p => p.Channel === selectedChannel);
        }

        if (sortBy === 'new') {
            return [...filtered].sort((a, b) => {
                const timeA = parseForumDate(a.Timestamp).getTime();
                const timeB = parseForumDate(b.Timestamp).getTime();
                return timeB - timeA;
            });
        }
        
        if (sortBy === 'top') {
            return [...filtered].sort((a, b) => {
                const upvotesA = Number(a.Upvotes) || 0;
                const upvotesB = Number(b.Upvotes) || 0;
                
                if (upvotesB !== upvotesA) {
                    return upvotesB - upvotesA;
                }
                
                const commentsA = commentCounts.get(a.ID) || 0;
                const commentsB = commentCounts.get(b.ID) || 0;
                if (commentsB !== commentsA) {
                    return commentsB - commentsA;
                }
                
                const timeA = parseForumDate(a.Timestamp).getTime();
                const timeB = parseForumDate(b.Timestamp).getTime();
                return timeB - timeA;
            });
        }
        
        return filtered;
    }, [posts, selectedChannel, sortBy, commentCounts]);
    
    const totalPages = Math.ceil(sortedAndFilteredPosts.length / POSTS_PER_PAGE);
    const paginatedPosts = sortedAndFilteredPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    const getPaginationItems = () => {
        const items: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
        } else {
            items.push(1);
            if (currentPage > 3) items.push('...');
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 3) {
                endPage = 4;
            } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - 3;
            }
            for (let i = startPage; i <= endPage; i++) items.push(i);
            if (currentPage < totalPages - 2) items.push('...');
            items.push(totalPages);
        }
        return items;
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <nav className="flex justify-center items-center space-x-2 mt-8" aria-label="Pagination">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
                >
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
                
                {getPaginationItems().map((item, index) =>
                    typeof item === 'number' ? (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(item)}
                            className={`min-w-[2.5rem] h-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                                currentPage === item
                                    ? 'bg-gradient-to-r from-emerald-500 to-orange-500 text-white shadow-lg shadow-emerald-200/50 scale-110'
                                    : 'bg-white text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-orange-50 hover:text-emerald-600 border-2 border-gray-200 hover:border-emerald-300'
                            }`}
                        >
                            {item}
                        </button>
                    ) : (
                        <span key={index} className="px-2 py-1 text-gray-400">...</span>
                    )
                )}
                
                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
                >
                    <Icon name="chevron-right" className="w-5 h-5" />
                </button>
            </nav>
        );
    };

    if (isLoading) {
        return (
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
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-orange-50 to-green-50 flex items-center justify-center p-4">
                <div className="text-center p-10 bg-white rounded-3xl shadow-2xl max-w-md border-2 border-red-200">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                        <Icon name="alert-circle" className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    const selectedChannelData = FORUM_CHANNELS.find(ch => ch.name === selectedChannel);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-orange-50 to-green-50 py-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-orange-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 space-y-8 relative z-10">
                {/* Header Section */}
                <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-orange-500/5"></div>
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}></div>
                    
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg">
                                    <Icon name="message-square" className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-orange-600">
                                    Diễn đàn SuniSVG
                                </h1>
                            </div>
                            <p className="mt-3 text-gray-600 text-lg">
                                Nơi trao đổi, hỏi đáp và chia sẻ kiến thức cùng cộng đồng
                            </p>
                            <div className="mt-4 flex items-center gap-4 justify-center md:justify-start text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Icon name="users" className="w-4 h-4" />
                                    {accounts.length} thành viên
                                </span>
                                <span className="flex items-center gap-1">
                                    <Icon name="file-text" className="w-4 h-4" />
                                    {posts.length} bài viết
                                </span>
                                <span className="flex items-center gap-1">
                                    <Icon name="message-circle" className="w-4 h-4" />
                                    {comments.length} bình luận
                                </span>
                            </div>
                        </div>
                        
                        <Link
                            href="/forum/submit"
                            prefetch={true}
                            className="relative group w-full md:w-auto flex-shrink-0 overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-orange-600 group-hover:from-emerald-500 group-hover:via-green-500 group-hover:to-orange-500 transition-all duration-300"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <span className="relative flex items-center justify-center gap-2 py-4 px-8 text-base font-bold text-white">
                                <Icon name="edit" className="w-5 h-5" />
                                Tạo bài viết mới
                            </span>
                        </Link>
                    </div>
                </section>
                
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="md:w-72 flex-shrink-0">
                        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white/50 space-y-2 sticky top-20">
                            <div className="flex items-center gap-2 px-3 pb-4 border-b-2 border-gradient-to-r from-emerald-200 to-orange-200">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center">
                                    <Icon name="grid" className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Chuyên mục</h2>
                            </div>
                            
                            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                                {FORUM_CHANNELS.map(channel => (
                                    <button
                                        key={channel.name}
                                        onClick={() => setSelectedChannel(channel.name)}
                                        className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition-all duration-300 text-sm flex items-center gap-3 group relative overflow-hidden ${
                                            selectedChannel === channel.name
                                                ? 'bg-gradient-to-r from-emerald-50 to-orange-50 text-emerald-700 shadow-md border-2 border-emerald-200'
                                                : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-800 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                            selectedChannel === channel.name
                                                ? `bg-gradient-to-br ${channel.color} shadow-lg`
                                                : 'bg-gray-100 group-hover:bg-gray-200'
                                        }`}>
                                            <Icon name={channel.icon} className={`w-4 h-4 ${
                                                selectedChannel === channel.name ? 'text-white' : 'text-gray-500'
                                            }`} />
                                        </div>
                                        <span className="flex-1">{channel.name}</span>
                                        {selectedChannel === channel.name && (
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                    
                    {/* Main Content */}
                    <main className="flex-grow space-y-6">
                        {/* Sort Buttons */}
                        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                            <button
                                onClick={() => setSortBy('new')}
                                className={`flex-1 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                                    sortBy === 'new'
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50 scale-105'
                                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-600'
                                }`}
                            >
                                <Icon name="clock" className="w-5 h-5" />
                                Mới nhất
                            </button>
                            <button
                                onClick={() => setSortBy('top')}
                                className={`flex-1 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                                    sortBy === 'top'
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/50 scale-105'
                                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-600'
                                }`}
                            >
                                <Icon name="star" className="w-5 h-5" />
                                Hàng đầu
                            </button>
                        </div>

                        {/* Posts List */}
                        {paginatedPosts.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {paginatedPosts.map(post => {
                                        const authorAccount = accounts.find(acc => 
                                            (post.AuthorEmail && acc.Email.toLowerCase() === post.AuthorEmail.toLowerCase()) || 
                                            acc['Tên tài khoản'] === post.AuthorName
                                        );
                                        const avatarUrl = authorAccount?.AvatarURL;
                                        const profileLink = authorAccount?.Email ? `/profile/${authorAccount.Email}` : '#';
                                        const isUpvoted = currentUser && (post.UpvotedBy || '').includes(currentUser.Email);

                                        return (
                                            <div key={post.ID} className="transform hover:scale-[1.02] transition-all duration-300">
                                                <div className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Link href={profileLink} className="group flex items-center gap-3" onClick={e => !authorAccount?.Email && e.preventDefault()}>
                                                                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative flex-shrink-0">
                                                                    {avatarUrl ? (
                                                                        <Image
                                                                            src={convertGoogleDriveUrl(avatarUrl)}
                                                                            alt={post.AuthorName}
                                                                            fill
                                                                            className="object-cover"
                                                                            referrerPolicy="no-referrer"
                                                                            priority
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                                            {post.AuthorName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-900 leading-none group-hover:text-emerald-600 transition-colors">{post.AuthorName}</span>
                                                                    <span className="text-xs text-gray-500 mt-1">{timeAgo(parseForumDate(post.Timestamp).toISOString())}</span>
                                                                </div>
                                                                </Link>
                                                            </div>
                                                            
                                                            <Link href={`/forum/${post.ID}`} className="block group">
                                                                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">{post.Title}</h3>
                                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.Content}</p>
                                                            </Link>

                                                            {/* Ảnh tách ra khỏi Link để tránh click nhầm */}
                                                            {post.ImageURLs && post.ImageURLs.trim() && (() => {
                                                                // Chỉ lấy ảnh để hiển thị preview ngoài feed
                                                                const imgs = post.ImageURLs.split(',').filter(u => {
                                                                    if (!u.includes('#')) return true;
                                                                    const params = new URLSearchParams(u.split('#')[1]);
                                                                    return params.get('mime')?.startsWith('image/');
                                                                }).filter(Boolean);
                                                                if (imgs.length === 0) return null;
                                                                
                                                                return (
                                                                    <div className={`mt-2 mb-3 grid gap-1.5 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                                        {imgs.slice(0, 3).map((url, i) => (
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setLightbox({ urls: imgs, index: i });
                                                                                }}
                                                                                className={`relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 hover:opacity-90 hover:scale-[1.02] transition-all duration-200 cursor-zoom-in ${imgs.length === 1 ? 'h-48' : 'h-28'}`}
                                                                            >
                                                                                <Image
                                                                                    src={convertGoogleDriveUrl(url.split('#')[0].trim())}
                                                                                    alt=""
                                                                                    fill
                                                                                    className="object-cover"
                                                                                    referrerPolicy="no-referrer"
                                                                                    priority={i === 0}
                                                                                />
                                                                                {i === 2 && imgs.length > 3 && (
                                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                                        <span className="text-white font-bold text-xl">+{imgs.length - 3}</span>
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                            
                                                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                                <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                                                                    {post.Channel}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Icon name="message-circle" className="w-3.5 h-3.5" />
                                                                    {commentCounts.get(post.ID) || 0} bình luận
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (!currentUser) {
                                                                    addToast('Vui lòng đăng nhập để bình chọn.', 'info');
                                                                    return;
                                                                }
                                                                const isUpvoted = (post.UpvotedBy || '').split(',').includes(currentUser.Email);
                                                                const newUpvotes = parseInt(post.Upvotes || '0') + (isUpvoted ? -1 : 1);
                                                                const newUpvotedBy = isUpvoted
                                                                    ? (post.UpvotedBy || '').split(',').filter(e => e !== currentUser.Email).join(',')
                                                                    : [...(post.UpvotedBy || '').split(','), currentUser.Email].filter(Boolean).join(',');

                                                                const updatedPost = { ...post, Upvotes: String(newUpvotes), UpvotedBy: newUpvotedBy };
                                                                handlePostUpdate(updatedPost);
                                                                updatePostUpvote(post.ID, currentUser.Email);
                                                            }}
                                                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                                                                isUpvoted ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <Icon name="chevron-up" className="w-5 h-5" />
                                                            <span className="font-bold">{post.Upvotes || 0}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {renderPagination()}
                            </>
                        ) : (
                            <div className="text-center py-20 px-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-orange-50/50"></div>
                                <div className="relative">
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center">
                                        <Icon name="inbox" className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-orange-600 mb-3">
                                        Chưa có bài viết
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Chưa có bài viết nào trong chuyên mục <span className="font-bold text-emerald-600">{selectedChannel}</span>. 
                                        Hãy là người đầu tiên chia sẻ!
                                    </p>
                                    <Link
                                        href="/forum/submit"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                                    >
                                        <Icon name="edit" className="w-5 h-5" />
                                        Tạo bài viết đầu tiên
                                    </Link>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                        onClick={() => setLightbox(null)}
                    >
                        <Icon name="x" className="w-6 h-6" />
                    </button>

                    {lightbox.urls.length > 1 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox(l => l && ({ ...l, index: (l.index - 1 + l.urls.length) % l.urls.length }));
                            }}
                        >
                            <Icon name="chevron-left" className="w-8 h-8" />
                        </button>
                    )}

                    <div
                        className="relative max-w-5xl max-h-[85vh] w-full h-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <Image
                            src={convertGoogleDriveUrl(lightbox.urls[lightbox.index].trim())}
                            alt=""
                            fill
                            className="object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>

                    {lightbox.urls.length > 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox(l => l && ({ ...l, index: (l.index + 1) % l.urls.length }));
                            }}
                        >
                            <Icon name="chevron-right" className="w-8 h-8" />
                        </button>
                    )}

                    {lightbox.urls.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                            {lightbox.index + 1} / {lightbox.urls.length}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #10b981, #f97316);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #059669, #ea580c);
                }
            `}</style>
        </div>
    );
}