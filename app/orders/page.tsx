'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPurchasedCategories } from '@/services/googleSheetService';
import Link from 'next/link';

interface Purchase {
    CategoryName: string;
    PurchaseDate: string;
}

const parseVNDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    
    // Xử lý trường hợp ISO string (nếu có)
    if (dateStr.includes('-') && !dateStr.includes('/')) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
    }

    const parts = dateStr.trim().split(/\s+/); // Tách bằng khoảng trắng bất kỳ
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return new Date(0);
    
    const [day, month, year] = dateParts.map(Number);
    let hour = 0, minute = 0, second = 0;

    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        if (timeParts.length >= 2) {
            hour = Number(timeParts[0] || 0);
            minute = Number(timeParts[1] || 0);
            second = Number(timeParts[2] || 0);
        }
    }
    
    return new Date(year, month - 1, day, hour, minute, second);
};

export default function OrdersPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const loadOrders = async () => {
            try {
                const purchaseHistory = await fetchPurchasedCategories(currentUser.Email);
                purchaseHistory.sort((a, b) => {
                    const dateA = parseVNDate(a.PurchaseDate).getTime();
                    const dateB = parseVNDate(b.PurchaseDate).getTime();
                    return dateB - dateA;
                });
                setOrders(purchaseHistory);
            } catch (error) {
                console.error("Failed to load orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, [currentUser, authLoading]);

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8 text-center">
                    <Icon name="lock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
                    <p className="text-gray-500 mb-6">Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
                    <Link href="/login" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        Đăng nhập ngay
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icon name="shopping-bag" className="w-6 h-6" />
                        <span>{orders.length} đơn hàng</span>
                    </div>
                </div>

                {orders.length > 0 ? (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-200">
                            {orders.map((order, orderIdx) => (
                                <li key={orderIdx} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center sm:items-start flex-col sm:flex-row sm:justify-between gap-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                                <Icon name="check-circle" className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {order.CategoryName.replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Trạng thái: <span className="font-medium text-green-600">Hoàn thành</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 text-right shrink-0 mt-2 sm:mt-0 self-end sm:self-auto">
                                            <p className="font-medium">Ngày mua</p>
                                            <time dateTime={order.PurchaseDate}>{order.PurchaseDate}</time>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Icon name="shopping-cart" className="w-16 h-16 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có đơn hàng nào</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Hãy khám phá các khóa học và tài liệu hấp dẫn trên SuniSVG để bắt đầu hành trình học tập của bạn.
                        </p>
                        <Link href="/courses" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                            <Icon name="search" className="w-5 h-5" />
                            Khám phá ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
