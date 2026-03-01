'use client';

import React, { useEffect } from 'react';
import { Icon } from '@/components/shared/Icon';

export default function FanpageRedirect() {
    useEffect(() => {
        // Redirect to actual fanpage after a delay or immediately
        const timer = setTimeout(() => {
            window.location.href = 'https://www.facebook.com/sunisvg'; // Replace with actual fanpage URL
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Icon name="facebook" className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang chuyển hướng đến Fanpage...</h1>
            <p className="text-gray-600 mb-8">Vui lòng đợi trong giây lát.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            
            <p className="mt-8 text-sm text-gray-500">
                Nếu trình duyệt không tự động chuyển hướng, <a href="https://www.facebook.com/sunisvg" className="text-blue-600 hover:underline font-bold">bấm vào đây</a>.
            </p>
        </div>
    );
}
