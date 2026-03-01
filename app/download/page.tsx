'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-blue-600 p-12 flex flex-col justify-center text-white">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                        <Icon name="monitor" className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">SuniSVG Desktop</h1>
                    <p className="text-blue-100 text-lg mb-8">Trải nghiệm học tập mượt mà hơn, nhanh hơn và tập trung hơn với ứng dụng dành cho Windows.</p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3">
                            <Icon name="check-circle" className="w-5 h-5 text-green-400" />
                            <span>Tốc độ tải trang nhanh gấp 2 lần</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Icon name="check-circle" className="w-5 h-5 text-green-400" />
                            <span>Hỗ trợ tải bài giảng offline</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Icon name="check-circle" className="w-5 h-5 text-green-400" />
                            <span>Thông báo nhắc nhở học tập</span>
                        </li>
                    </ul>
                </div>
                <div className="md:w-1/2 p-12 flex flex-col justify-center items-center text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Icon name="download" className="w-12 h-12 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tải xuống ngay</h2>
                    <p className="text-gray-500 mb-8">Phiên bản 2.5.0 • Windows 10/11 • 64-bit</p>
                    
                    <button className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group">
                        <Icon name="download" className="w-6 h-6 group-hover:animate-bounce" />
                        Tải về cho Windows
                    </button>
                    
                    <p className="mt-6 text-xs text-gray-400">
                        Yêu cầu hệ thống: Windows 10 trở lên, RAM 4GB, dung lượng trống 500MB.
                    </p>
                </div>
            </div>
        </div>
    );
}
