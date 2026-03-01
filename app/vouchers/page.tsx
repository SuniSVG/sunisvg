'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function VouchersPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Kho Voucher</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icon name="ticket" className="w-6 h-6" />
                        <span>0 voucher</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Icon name="tag" className="w-16 h-16 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có voucher nào</h2>
                    <p className="text-gray-500 mb-8 max-w-md">
                        Tham gia các sự kiện, hoàn thành nhiệm vụ hoặc theo dõi fanpage để nhận voucher giảm giá hấp dẫn.
                    </p>
                    <button className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                        <Icon name="gift" className="w-5 h-5" />
                        Tìm hiểu thêm
                    </button>
                </div>
            </div>
        </div>
    );
}
