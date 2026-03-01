'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function MobileAppPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                        <Icon name="smartphone" className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Học mọi lúc, mọi nơi với SuniSVG App</h1>
                    <p className="text-gray-600 text-lg mb-8">
                        Mang cả thư viện kiến thức vào túi của bạn. Tải ứng dụng ngay hôm nay để trải nghiệm học tập không giới hạn.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button className="flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                            <Icon name="apple" className="w-8 h-8" />
                            <div className="text-left">
                                <div className="text-xs">Download on the</div>
                                <div className="text-lg font-bold leading-none">App Store</div>
                            </div>
                        </button>
                        <button className="flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                            <Icon name="play-circle" className="w-8 h-8" />
                            <div className="text-left">
                                <div className="text-xs">GET IT ON</div>
                                <div className="text-lg font-bold leading-none">Google Play</div>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                        </div>
                        <span>Hơn 10.000+ lượt tải xuống</span>
                    </div>
                </div>

                <div className="md:w-1/2 bg-indigo-600 relative overflow-hidden flex items-center justify-center p-12">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl flex flex-col overflow-hidden">
                        <div className="h-8 bg-gray-800 w-full absolute top-0 left-0 z-20 rounded-t-[2.5rem] flex justify-center">
                            <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                        </div>
                        <div className="flex-1 bg-white pt-10 px-4 pb-4 overflow-y-auto scrollbar-hide">
                            {/* Mock App UI */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="w-full h-32 bg-blue-100 rounded-xl mb-4"></div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="h-24 bg-gray-100 rounded-xl"></div>
                                <div className="h-24 bg-gray-100 rounded-xl"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-16 bg-gray-50 rounded-xl"></div>
                                <div className="h-16 bg-gray-50 rounded-xl"></div>
                                <div className="h-16 bg-gray-50 rounded-xl"></div>
                            </div>
                        </div>
                        <div className="h-12 bg-white border-t border-gray-100 flex justify-around items-center px-4">
                            <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
