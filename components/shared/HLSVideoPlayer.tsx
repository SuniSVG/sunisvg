'use client';

import { useEffect, useRef, useState } from 'react';

interface HLSVideoPlayerProps {
    url: string;
    className?: string;
}

export default function HLSVideoPlayer({ url, className = '' }: HLSVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !url) return;

        // Nếu trình duyệt hỗ trợ HLS native (Safari/iOS)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            return;
        }

        // Dùng hls.js cho Chrome, Firefox, Edge...
        let hls: import('hls.js').default | null = null;

        import('hls.js').then(({ default: Hls }) => {
            if (!Hls.isSupported()) {
                setError(true);
                return;
            }

            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    setError(true);
                }
            });
        });

        return () => {
            hls?.destroy();
        };
    }, [url]);

    if (error) {
        return (
            <div className="flex items-center justify-center bg-gray-900 text-gray-400 rounded-xl h-48 text-sm">
                Không thể tải video. Vui lòng thử lại sau.
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            controls
            playsInline
            className={`w-full rounded-xl bg-black ${className}`}
            style={{ maxHeight: '480px' }}
        >
            Trình duyệt không hỗ trợ video.
        </video>
    );
}