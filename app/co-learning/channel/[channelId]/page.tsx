/**
 * File: app/co-learning/channel/[channelId]/page.tsx
 * Mục đích: Trang chi tiết kênh YouTube nội bộ.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';

const API_KEYS = [
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    'AIzaSyCB1eISVtVGKYDa1vZQV1l8Z2PAuyQy854' // Key dự phòng 2
].filter(Boolean) as string[];

interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    category: string;
}

interface ChannelDetails {
    id: string;
    title: string;
    description: string;
    avatarUrl: string;
    bannerUrl?: string;
    subscriberCount?: string;
    uploadsPlaylistId?: string; // ID danh sách phát chứa tất cả video upload
    videoCount?: string;
}

// Logic phân loại (giống trang chủ)
const categorizeVideo = (title: string): string => {
    const t = title.toLowerCase();
    const chapterMatch = t.match(/(?:chương|chapter)\s*(\d+)/i);
    if (chapterMatch) return `Chương ${chapterMatch[1]}`;
    if (t.includes('luyện đề') || t.includes('giải đề') || t.includes('đề thi')) return 'Luyện đề';
    if (t.includes('tổng ôn') || t.includes('lý thuyết') || t.includes('kiến thức') || t.includes('ôn tập')) return 'Tổng ôn';
    if (t.includes('mẹo') || t.includes('tips') || t.includes('casio')) return 'Mẹo giải nhanh';
    if (t.includes('vlog') || t.includes('chia sẻ') || t.includes('tâm sự')) return 'Góc chia sẻ';
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

export default function ChannelDetailPage() {
    const params = useParams();
    const channelId = params.channelId as string;
    
    const [channel, setChannel] = useState<ChannelDetails | null>(null);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTopic, setActiveTopic] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    
    // States cho phân trang Server-side
    const ITEMS_PER_PAGE = 24;
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
    const [pageTokens, setPageTokens] = useState<string[]>(['']); // Lưu lịch sử token để quay lại: ['token_trang_1', 'token_trang_2', ...]
    const [currentPage, setCurrentPage] = useState(1);
    const [totalVideos, setTotalVideos] = useState(0);

    // 1. Lấy thông tin kênh (chạy 1 lần)
    useEffect(() => {
        if (!channelId) return;
        const fetchData = async () => {
            const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
            try {
                const channelRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,brandingSettings,statistics,contentDetails&id=${channelId}`
                );
                const channelData = await channelRes.json();
                if (channelData.items?.[0]) {
                    const item = channelData.items[0];
                    setChannel({
                        id: item.id,
                        title: item.snippet.title,
                        description: item.snippet.description,
                        avatarUrl: item.snippet.thumbnails.medium?.url,
                        bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
                        subscriberCount: item.statistics?.subscriberCount,
                        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads, // ID playlist chứa toàn bộ video
                        videoCount: item.statistics?.videoCount
                    });
                    setTotalVideos(parseInt(item.statistics?.videoCount || '0'));
                }
            } catch (error) {
                console.error("Error fetching channel data:", error);
            }
        };
        fetchData();
    }, [channelId]);

    // 2. Lấy video (chạy khi đổi trang hoặc đổi search)
    useEffect(() => {
        if (!channel) return;

        const fetchVideos = async () => {
            setLoading(true);
            const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
            try {
                let url = '';
                const token = pageTokens[currentPage - 1] || ''; // Lấy token tương ứng với trang hiện tại

                // Nếu có tìm kiếm: Dùng endpoint Search (tốn quota hơn)
                if (searchQuery.trim()) {
                    url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${ITEMS_PER_PAGE}&type=video&q=${encodeURIComponent(searchQuery)}`;
                } 
                // Nếu không tìm kiếm: Dùng endpoint PlaylistItems (tối ưu quota, lấy từ danh sách uploads)
                else if (channel.uploadsPlaylistId) {
                    url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${channel.uploadsPlaylistId}&part=snippet,id&maxResults=${ITEMS_PER_PAGE}`;
                }

                if (token) {
                    url += `&pageToken=${token}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                // Cập nhật token cho trang tiếp theo
                setNextPageToken(data.nextPageToken || null);
                setPrevPageToken(data.prevPageToken || null);

                // Chuẩn hóa dữ liệu (vì cấu trúc trả về của Search và PlaylistItems hơi khác nhau)
                const loadedVideos = (data.items || []).map((item: any) => {
                    const snippet = item.snippet;
                    // Search trả về id.videoId, PlaylistItems trả về snippet.resourceId.videoId
                    const videoId = item.id?.videoId || snippet.resourceId?.videoId;
                    
                    return {
                        id: videoId,
                        title: snippet.title,
                        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url,
                        channelId: snippet.channelId,
                        channelTitle: snippet.channelTitle,
                        publishedAt: new Date(snippet.publishedAt).toLocaleDateString('vi-VN'),
                        category: categorizeVideo(snippet.title)
                    };
                });

                setVideos(loadedVideos);
                
                // Nếu đang search, cập nhật lại tổng số (ước lượng) để phân trang
                if (searchQuery.trim() && data.pageInfo) {
                    // Search API không trả về chính xác totalResults lớn, nhưng dùng tạm để hiện UI
                    setTotalVideos(data.pageInfo.totalResults);
                }

            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [channel, currentPage, searchQuery, pageTokens]); // Bỏ channelId ra vì channel đã bao gồm

    // Xử lý chuyển trang
    const handleNextPage = () => {
        if (nextPageToken) {
            // Lưu token mới vào mảng lịch sử nếu chưa có
            if (pageTokens.length <= currentPage) {
                setPageTokens([...pageTokens, nextPageToken]);
            }
            setCurrentPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(p => p - 1);
        }
    };

    // Reset về trang 1 khi tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
        setPageTokens(['']); // Reset token history
    }, [searchQuery]);

    const topics = useMemo(() => {
        const cats = new Set(videos.map(v => v.category));
        const sortedCats = Array.from(cats).sort();
        return ['Tất cả', ...sortedCats];
    }, [videos]);

    // Lọc Client-side (chỉ lọc Topic, Search đã xử lý Server-side)
    const filteredVideos = useMemo(() => {
        return videos.filter(v => {
            const matchTopic = activeTopic === 'Tất cả' || v.category === activeTopic;
            // Search đã được gọi API rồi, nhưng lọc thêm ở đây để highlight hoặc xử lý topic
            return matchTopic;
        });
    }, [videos, activeTopic]);

    const totalPages = Math.ceil(totalVideos / ITEMS_PER_PAGE);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!channel) return <div className="p-8 text-center">Không tìm thấy kênh</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Banner Kênh */}
            <div className="h-48 md:h-64 w-full bg-gray-800 relative overflow-hidden">
                {channel.bannerUrl ? (
                    <Image src={channel.bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-green-600 to-blue-600" />
                )}
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Nút quay lại */}
                <Link href="/co-learning" className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2 text-sm font-bold z-20">
                    <Icon name="arrow-left" className="w-4 h-4" />
                    Quay lại
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                {/* Thông tin kênh */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white shrink-0 relative">
                        <Image src={channel.avatarUrl} alt={channel.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{channel.title}</h1>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2 max-w-2xl">{channel.description}</p>
                        {channel.subscriberCount && (
                            <p className="text-red-600 font-bold text-sm mt-2">
                                {parseInt(channel.subscriberCount).toLocaleString()} người đăng ký
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                         <a 
                            href={`https://youtube.com/channel/${channel.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <Icon name="youtube" className="w-4 h-4" />
                            Đăng ký
                        </a>
                    </div>
                </div>

                {/* Bộ lọc & Tìm kiếm */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
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
                    <div className="relative w-full md:w-64 shrink-0">
                        <input 
                            type="text" 
                            placeholder="Tìm trong kênh..." 
                            // Dùng onBlur hoặc debounce để tránh gọi API liên tục khi gõ
                            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(e.currentTarget.value)}
                            onBlur={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Danh sách Video */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 h-64 animate-pulse">
                                <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
                                <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                                <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video) => (
                            <Link 
                                key={video.id} 
                                href={`/co-learning/${video.id}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                <div className="relative aspect-video overflow-hidden bg-gray-100">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Icon name="play-circle" className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                    <div className="absolute top-2 left-2">
                                        <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded">
                                            {video.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                                        {video.title}
                                    </h3>
                                    <div className="mt-auto text-xs text-gray-500">
                                        {video.publishedAt}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalVideos > ITEMS_PER_PAGE && (
                    <div className="mt-10 flex justify-center items-center gap-4">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            Trang <span className="text-gray-900 font-bold">{currentPage}</span> 
                            {totalPages > 0 && ` / ${totalPages}`}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={!nextPageToken && currentPage >= totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
