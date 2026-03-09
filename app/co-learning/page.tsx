/**
 * File: app/co-learning/page.tsx
 * Mục đích: Thư viện video học tập, phân loại theo môn, kênh và chủ đề.
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/shared/Icon';

// --- 1. CẤU HÌNH KÊNH & DỮ LIỆU ---

const API_KEYS = [
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    'AIzaSyCB1eISVtVGKYDa1vZQV1l8Z2PAuyQy854' // Key dự phòng 2
].filter(Boolean) as string[];

// --- CẤU HÌNH KÊNH THEO MÔN ---
type SubjectType = 'Toán' | 'Lý' | 'Hóa' | 'Anh' | 'Sinh' | 'Khác';

interface ChannelConfig {
    id: string;
    subject: SubjectType;
}

const CHANNEL_LIST: ChannelConfig[] = [
    // --- TOÁN ---
    { id: 'UCs6Ora-urXBSh_wm5rlXtEw', subject: 'Toán' },
    { id: 'UC8gA-RUqaQ0Htkz2RrQWHMw', subject: 'Toán' },
    { id: 'UCvmzx1WEg0fXjO62euS53sQ', subject: 'Toán' },
    { id: 'UC7ambC6lu_T-P7SMnAXGJ0g', subject: 'Toán' },
    { id: 'UC6hkidRUyOz_aPguW4ZRnQg', subject: 'Toán' },
    
    // --- HÓA ---
    { id: 'UCAddta3aiDh6u9B4xCh3w7g', subject: 'Hóa' },
    
    // --- ANH ---
    { id: 'UC747JODOhQNNjDh2ol3qs_Q', subject: 'Anh' },
    { id: 'UCtMYbGkPecqhOZGhj7VTHRg', subject: 'Anh' },
    { id: 'UCk-scdU11TW4W7PIoCHemmg', subject: 'Anh' },

    // --- LÝ (Placeholder - Thay ID thật vào đây) ---
    { id: 'UCP98Gj2fYErscrQy56hX1ig', subject: 'Lý' }, 
    { id: 'UC2prfDQAHLCcU7fQk83TyQQ', subject: 'Lý' },
    { id: 'UCHZIp8tv9dkDUpP1WxsGFeg', subject: 'Lý' },

    
    // --- SINH (Placeholder) ---
    { id: 'UCWE0S2Bmbbae2VxTEksAbFA', subject: 'Sinh' },
    { id: 'UCwjKMp47F5qQqGZzgk1cRHQ', subject: 'Sinh' },
    { id: 'UCpJ459cjoSTrJgjNYSWOvyw', subject: 'Sinh' },
    { id: 'UCZC9wIZhFCGIIHbTtSME0Ag', subject: 'Sinh' },
    { id: 'UCB2d0asyWRRMCJSoIGX3-wA', subject: 'Sinh' },

];

// Định nghĩa kiểu dữ liệu Video
interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    category: string; // Danh mục tự động phân loại
}

// Định nghĩa kiểu dữ liệu Kênh (để hiển thị avatar)
interface ChannelInfo {
    id: string;
    title: string;
    avatarUrl: string;
}

// --- 2. LOGIC PHÂN LOẠI ---

// Hàm phân loại dựa trên tiêu đề video
const categorizeVideo = (title: string): string => {
    const t = title.toLowerCase();
    
    // Regex bắt "Chương X"
    const chapterMatch = t.match(/(?:chương|chapter)\s*(\d+)/i);
    if (chapterMatch) {
        return `Chương ${chapterMatch[1]}`;
    }

    if (t.includes('luyện đề') || t.includes('giải đề') || t.includes('đề thi')) {
        return 'Luyện đề';
    }
    if (t.includes('tổng ôn') || t.includes('lý thuyết') || t.includes('kiến thức') || t.includes('ôn tập')) {
        return 'Tổng ôn';
    }
    if (t.includes('mẹo') || t.includes('tips') || t.includes('casio')) {
        return 'Mẹo giải nhanh';
    }
    if (t.includes('vlog') || t.includes('chia sẻ') || t.includes('tâm sự')) {
        return 'Góc chia sẻ';
    }
    
    return 'Khác';
};

// Hàm xóa dấu tiếng Việt để tìm kiếm tối ưu
const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
};

export default function VideoLibraryPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    
    // States cho bộ lọc
    const [activeSubject, setActiveSubject] = useState<SubjectType>('Toán');
    const [activeTopic, setActiveTopic] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');

    // States cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 24;

    // Lấy danh sách ID kênh thuộc môn đang chọn
    const currentSubjectChannelIds = useMemo(() => {
        return CHANNEL_LIST.filter(c => c.subject === activeSubject).map(c => c.id);
    }, [activeSubject]);

    // Fetch dữ liệu khi đổi môn học
    useEffect(() => {

        const fetchData = async () => {
            if (currentSubjectChannelIds.length === 0) {
                setVideos([]);
                setChannels([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Gọi API route nội bộ — không lộ API key, có server cache
                const res = await fetch("/api/youtube/videos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ channelIds: currentSubjectChannelIds }),
                });

                if (!res.ok) {
                    console.error("Lỗi tải video:", await res.text());
                    return;
                }

                const data = await res.json();

                // Channels
                setChannels(data.channels || []);

                // Videos — sort mới nhất + categorize ở client
                const videos = (data.videos || [])
                    .map((v: any) => ({
                        ...v,
                        publishedAt: new Date(v.publishedAt).toLocaleDateString("vi-VN"),
                        category: categorizeVideo(v.title),
                    }))
                    .sort(
                        (a: any, b: any) =>
                            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                    );

                setVideos(videos);
                setActiveTopic("Tất cả");
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu YouTube:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeSubject, currentSubjectChannelIds]);

    // SEO: Update title based on selection
    useEffect(() => {
        document.title = `Co-Learning: ${activeSubject} - ${activeTopic} | SuniSVG`;
    }, [activeSubject, activeTopic]);

    // Lấy danh sách các chủ đề (Topics) duy nhất từ video hiện có
    const topics = useMemo(() => {
        const cats = new Set(videos.map(v => v.category));
        // Sắp xếp: Chương lên trước, sau đó đến chữ cái
        const sortedCats = Array.from(cats).sort((a, b) => {
            if (a.startsWith('Chương') && b.startsWith('Chương')) return a.localeCompare(b);
            if (a.startsWith('Chương')) return -1;
            if (b.startsWith('Chương')) return 1;
            return a.localeCompare(b);
        });
        return ['Tất cả', ...sortedCats];
    }, [videos]);

    // Lọc video theo Topic và Search Query
    const filteredVideos = useMemo(() => {
        return videos.filter(v => {
            const matchTopic = activeTopic === 'Tất cả' || v.category === activeTopic;
            
            // Tìm kiếm nâng cao: Bỏ dấu, lowercase
            const normalizedTitle = removeVietnameseTones(v.title.toLowerCase());
            const normalizedQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
            const matchSearch = normalizedTitle.includes(normalizedQuery);
            
            return matchTopic && matchSearch;
        });
    }, [videos, activeTopic, searchQuery]);

    // Reset về trang 1 khi thay đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [activeSubject, activeTopic, searchQuery]);

    // Tính toán dữ liệu cho trang hiện tại
    const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
    const paginatedVideos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredVideos.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredVideos, currentPage, ITEMS_PER_PAGE]);

    const subjects: SubjectType[] = ['Toán', 'Lý', 'Hóa', 'Anh', 'Sinh'];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* 1. Header & Subject Tabs */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Góc học tập Co-Learning: Thư viện Video & Tài liệu
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-8">
                        Tổng hợp bài giảng, luyện đề {activeSubject} từ các kênh YouTube giáo dục hàng đầu.
                    </p>

                    {/* Subject Tabs */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {subjects.map((sub) => (
                            <button
                                key={sub}
                                onClick={() => setActiveSubject(sub)}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeSubject === sub
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-105'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Channel Bar (Horizontal Scroll) */}
                {channels.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <Icon name="youtube" className="w-5 h-5 text-red-600" />
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Các kênh {activeSubject} nổi bật</h3>
                        </div>
                        <div className="relative group">
                            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide snap-x">
                                {channels.map((channel) => (
                                    <Link 
                                        key={channel.id}
                                        href={`/co-learning/channel/${channel.id}`}
                                        className="flex flex-col items-center gap-2 min-w-[80px] snap-start group/channel cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-red-500 to-orange-500 shadow-md group-hover/channel:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                                                <Image 
                                                    src={channel.avatarUrl} 
                                                    alt={`Kênh học tập ${channel.title}`} 
                                                    fill 
                                                    className="object-cover"
                                                    unoptimized // Dùng unoptimized nếu domain yt3.ggpht.com chưa config
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 text-center line-clamp-2 max-w-[100px] group-hover/channel:text-red-600 transition-colors">
                                            {channel.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                            {/* Fade effect edges */}
                            <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                )}

                {/* 3. Search & Topic Filters */}
                <div className="sticky top-20 z-30 bg-gray-50/95 backdrop-blur-sm py-4 mb-8 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Topic Chips */}
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            {topics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setActiveTopic(topic)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        activeTopic === topic
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-64 shrink-0">
                            <input 
                                type="text" 
                                placeholder="Tìm bài giảng..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                </div>

                {/* 4. Video Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                                <div className="aspect-video bg-gray-200 rounded-xl mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginatedVideos.map((video) => (
                            <Link 
                                key={video.id} 
                                href={`/co-learning/${video.id}`} // Link đến trang player nội bộ
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video overflow-hidden bg-gray-100">
                                    <Image
                                        src={video.thumbnail}
                                        alt={`Video bài giảng: ${video.title}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg">
                                            <Icon name="play-circle" className="w-6 h-6 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-lg">
                                            {video.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {video.title}
                                    </h3>
                                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                <Icon name="user" className="w-3 h-3" />
                                            </div>
                                            <span className="font-medium">{video.channelTitle}</span>
                                        </div>
                                        <span>{video.publishedAt}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 5. Pagination Controls */}
                {!loading && filteredVideos.length > ITEMS_PER_PAGE && (
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            Trang <span className="text-gray-900 font-bold">{currentPage}</span> / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}

                {!loading && filteredVideos.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="search" className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Không tìm thấy video nào</h3>
                        <p className="text-gray-500">Thử chọn môn học hoặc từ khóa khác xem sao nhé.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
