'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function OrdersPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icon name="shopping-bag" className="w-6 h-6" />
                        <span>0 đơn hàng</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Icon name="shopping-cart" className="w-16 h-16 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có đơn hàng nào</h2>
                    <p className="text-gray-500 mb-8 max-w-md">
                        Hãy khám phá các khóa học và tài liệu hấp dẫn trên SuniSVG để bắt đầu hành trình học tập của bạn.
                    </p>
                    <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                        <Icon name="search" className="w-5 h-5" />
                        Khám phá ngay
                    </button>
                </div>
            </div>
        </div>
    );
}
