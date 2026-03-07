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

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || ''; // API Key từ biến môi trường

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

export default function VideoLibraryPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    
    // States cho bộ lọc
    const [activeSubject, setActiveSubject] = useState<SubjectType>('Toán');
    const [activeTopic, setActiveTopic] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');

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
                
                // 1. Lấy thông tin kênh (Avatar, Tên)
                // API channels hỗ trợ lấy nhiều ID cùng lúc (tách bằng dấu phẩy)
                const channelRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&part=snippet&id=${currentSubjectChannelIds.join(',')}`
                );
                const channelData = await channelRes.json();
                
                const loadedChannels: ChannelInfo[] = (channelData.items || []).map((item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    avatarUrl: item.snippet.thumbnails.default?.url || item.snippet.thumbnails.medium?.url
                }));
                setChannels(loadedChannels);

                // 2. Lấy video từ các kênh này
                // Gọi API search cho từng kênh (để đảm bảo mỗi kênh đều có video hiển thị)
                const videoPromises = currentSubjectChannelIds.map(async (channelId) => {
                    const res = await fetch(
                        `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=12&type=video`
                    );
                    const data = await res.json();
                    return data.items || [];
                });

                const results = await Promise.all(videoPromises);
                
                // Gộp kết quả và map về đúng định dạng
                const allVideos = results.flat().map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                    channelId: item.snippet.channelId,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('vi-VN'),
                    category: categorizeVideo(item.snippet.title)
                }));

                // Sắp xếp video mới nhất lên đầu
                allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

                setVideos(allVideos);
                setActiveTopic('Tất cả'); // Reset topic khi đổi môn
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu YouTube:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeSubject, currentSubjectChannelIds]);

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
            const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchTopic && matchSearch;
        });
    }, [videos, activeTopic, searchQuery]);

    const subjects: SubjectType[] = ['Toán', 'Lý', 'Hóa', 'Anh', 'Sinh'];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* 1. Header & Subject Tabs */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Góc học tập Co-Learning
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-8">
                        Tổng hợp bài giảng, luyện đề từ các kênh YouTube giáo dục hàng đầu.
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
                                                    alt={channel.title} 
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
                        {filteredVideos.map((video) => (
                            <Link 
                                key={video.id} 
                                href={`/co-learning/${video.id}`} // Link đến trang player nội bộ
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video overflow-hidden bg-gray-100">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
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
