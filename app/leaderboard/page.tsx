'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchAccounts, fetchArticles } from '@/services/googleSheetService';
import type { Account, Badge, ScientificArticle } from '@/types';
import { getUserBadges } from '@/utils/badgeUtils';
import { Icon } from '@/components/shared/Icon';

interface UserBadgeInfo {
    displayBadges: Badge[];
}

interface RankedUser {
    account: Account;
    badges: UserBadgeInfo;
}

const BadgePill = ({ badge }: { badge: Badge }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
        <Icon name={badge.icon as any} className="w-3 h-3 mr-1" />
        {badge.name}
    </span>
);

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Icon name="medal" className="w-8 h-8 text-yellow-400" />;
    if (rank === 2) return <Icon name="medal" className="w-8 h-8 text-gray-400" />;
    if (rank === 3) return <Icon name="medal" className="w-8 h-8 text-orange-500" />;
    return (
        <span className="flex items-center justify-center w-8 h-8 text-sm font-bold bg-gray-200 text-gray-600 rounded-full">
            {rank}
        </span>
    );
};

const FeaturedUsers = () => {
    const [users, setUsers] = useState<RankedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [accounts, articles] = await Promise.all([
                    fetchAccounts(),
                    fetchArticles()
                ]);

                const rankedUsers = accounts
                    .map(acc => ({
                        account: acc,
                        badges: getUserBadges(acc, articles)
                    }))
                    .sort((a, b) => (b.account.Tokens || 0) - (a.account.Tokens || 0))
                    .slice(0, 10); // Top 10

                setUsers(rankedUsers);
            } catch (error) {
                console.error("Failed to load leaderboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-xl">
                        <Icon name="trophy" className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Bảng Xếp Hạng</h2>
                        <p className="text-sm text-gray-500">Top thành viên tích cực nhất</p>
                    </div>
                </div>
            </div>
            
            <div className="divide-y divide-gray-50">
                {users.map((user, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group">
                        <div className="flex-shrink-0 w-10 flex justify-center">
                            {getRankIcon(index + 1)}
                        </div>
                        
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                                {user.account['Tên tài khoản']?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Link href={`/profile/${user.account.Email}`} className="font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                    {user.account['Tên tài khoản']}
                                </Link>
                                {user.account['Đã xác minh'] === 'TRUE' && (
                                    <Icon name="check-circle" className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {user.badges.displayBadges.slice(0, 2).map((badge, i) => (
                                    <BadgePill key={i} badge={badge} />
                                ))}
                                {user.badges.displayBadges.length > 2 && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded flex items-center">
                                        +{user.badges.displayBadges.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                            <div className="font-bold text-orange-500 text-sm">
                                {user.account.Tokens?.toLocaleString()} SP
                            </div>
                            <div className="text-xs text-gray-400">
                                {user.account['Tổng số câu hỏi đã làm'] || 0} câu hỏi
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <Link href="/leaderboard" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider">
                    Xem tất cả
                </Link>
            </div>
        </div>
    );
};

export default function LeaderboardPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
             <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium mb-6">
                <Icon name="arrow-left" className="w-4 h-4" /> Quay lại trang chủ
            </Link>
            <FeaturedUsers />
        </div>
    );
}
