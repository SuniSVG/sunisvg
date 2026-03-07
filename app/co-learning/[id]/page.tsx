/**
 * File: app/videos/[id]/page.tsx
 * Mục đích: Trang phát video riêng biệt (Player) giữ người dùng ở lại website.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';

const API_KEYS = [
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    'AIzaSyCB1eISVtVGKYDa1vZQV1l8Z2PAuyQy854' // Key dự phòng 2
].filter(Boolean) as string[];

export default function VideoPlayerPage() {
    // Lấy ID video từ URL (ví dụ: /videos/dQw4w9WgXcQ -> id = dQw4w9WgXcQ)
    const params = useParams();
    const videoId = params.id as string;
    const [videoInfo, setVideoInfo] = React.useState<any>(null);

    // Lấy thông tin chi tiết video (Title, Channel Name)
    React.useEffect(() => {
        if (!videoId) return;
        const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
        const fetchDetails = async () => {
            try {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    setVideoInfo(data.items[0].snippet);
                }
            } catch (error) {
                console.error("Lỗi lấy thông tin video:", error);
            }
        };
        fetchDetails();
    }, [videoId]);

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Navigation Bar (Dark mode cho chế độ xem phim) */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link 
                        href="/co-learning" 
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium text-sm"
                    >
                        <Icon name="arrow-left" className="w-4 h-4" />
                        Quay lại thư viện
                    </Link>
                    <div className="text-white font-bold text-lg hidden sm:block">
                        SuniSVG Co - Learning
                    </div>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-5xl mx-auto">
                    {/* Video Wrapper - Giữ tỷ lệ 16:9 */}
                    <div className="relative aspect-video w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full border-0"
                        ></iframe>
                    </div>

                    {/* Video Info (Optional) */}
                    <div className="mt-6 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold mb-2">
                                    {videoInfo ? videoInfo.title : 'Đang tải thông tin...'}
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Nguồn: YouTube • {videoInfo ? videoInfo.channelTitle : '...'}
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors" title="Lưu video">
                                    <Icon name="bookmark" className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors" title="Chia sẻ">
                                    <Icon name="share" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Video Description */}
                        {videoInfo?.description && (
                            <div className="mt-6 bg-gray-800/30 rounded-xl p-4 border border-gray-800">
                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                                    {videoInfo.description}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800 text-sm text-gray-400">
                            <p>
                                💡 <strong>Mẹo:</strong> Bạn có thể nhấn phím <code>F</code> để xem toàn màn hình hoặc phím <code>Space</code> để tạm dừng video.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
