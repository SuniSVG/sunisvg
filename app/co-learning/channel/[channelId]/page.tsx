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

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

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

export default function ChannelDetailPage() {
    const params = useParams();
    const channelId = params.channelId as string;
    
    const [channel, setChannel] = useState<ChannelDetails | null>(null);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTopic, setActiveTopic] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!channelId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Lấy thông tin chi tiết kênh (bao gồm Banner)
                const channelRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&part=snippet,brandingSettings,statistics&id=${channelId}`
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
                        subscriberCount: item.statistics?.subscriberCount
                    });
                }

                // 2. Lấy video của kênh
                const videoRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=24&type=video`
                );
                const videoData = await videoRes.json();
                
                const loadedVideos = (videoData.items || []).map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                    channelId: item.snippet.channelId,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('vi-VN'),
                    category: categorizeVideo(item.snippet.title)
                }));
                setVideos(loadedVideos);

            } catch (error) {
                console.error("Error fetching channel data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [channelId]);

    const topics = useMemo(() => {
        const cats = new Set(videos.map(v => v.category));
        const sortedCats = Array.from(cats).sort();
        return ['Tất cả', ...sortedCats];
    }, [videos]);

    const filteredVideos = useMemo(() => {
        return videos.filter(v => {
            const matchTopic = activeTopic === 'Tất cả' || v.category === activeTopic;
            const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchTopic && matchSearch;
        });
    }, [videos, activeTopic, searchQuery]);

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Danh sách Video */}
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
            </div>
        </div>
    );
}
