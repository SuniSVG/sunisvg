'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { addForumPost, fetchAccounts, fetchArticles } from '@/services/googleSheetService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import type { Account, ScientificArticle, Badge } from '@/types';
import { getUserBadges } from '@/utils/badgeUtils';
import { BadgePill } from '@/components/shared/BadgePill';

const FORUM_CHANNELS = [
    'Thảo luận chung', 'Toán học', 'Vật lý', 'Hóa học', 
    'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Hỏi đáp'
];

export default function CreatePostPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [channel, setChannel] = useState(FORUM_CHANNELS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [articles, setArticles] = useState<ScientificArticle[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) return;
        const loadData = async () => {
            setDataLoading(true);
            try {
                const [accData, artData] = await Promise.all([
                    fetchAccounts(),
                    fetchArticles()
                ]);
                setAccounts(accData);
                setArticles(artData);
            } catch (err) {
                console.error("Failed to load user data for badges", err);
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, [currentUser]);

    const currentUserBadges = useMemo((): Badge[] => {
        if (!currentUser || accounts.length === 0) return [];
        
        const userAccount = accounts.find(acc => acc.Email.toLowerCase() === currentUser.Email.toLowerCase());
        if (!userAccount) return [];

        const userArticles = articles.filter(art => art.SubmitterEmail.toLowerCase() === currentUser.Email.toLowerCase());
        const { displayBadges } = getUserBadges(userAccount, userArticles);
        return displayBadges;
    }, [currentUser, accounts, articles]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            router.push('/login');
            return;
        }

        if (!title.trim() || !content.trim()) {
            setError('Tiêu đề và nội dung không được để trống.');
            return;
        }
        setError('');
        setIsLoading(true);

        const postData = {
            Title: title,
            Content: content,
            Channel: channel,
            AuthorEmail: currentUser.Email,
            AuthorName: currentUser['Tên tài khoản'],
        };
        
        const result = await addForumPost(postData);
        
        setIsLoading(false);
        if (result.success) {
            addToast('Bài viết của bạn đã được đăng thành công!', 'success');
            router.push('/forum');
        } else {
            addToast(result.error || 'Đăng bài viết thất bại, vui lòng thử lại.', 'error');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Tạo bài viết mới</h1>
                
                {currentUser && !dataLoading && (
                    <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">Đăng với tư cách:</span>
                        <span className="font-bold text-gray-900">{currentUser['Tên tài khoản']}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {currentUserBadges.map(badge => <BadgePill key={badge.name} badge={badge} />)}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                     {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3" role="alert">
                            <Icon name="alert-circle" className="w-5 h-5 shrink-0" />
                            <p className="font-bold text-sm">{error}</p>
                        </div>
                     )}
                    
                    <div>
                        <label htmlFor="channel" className="block text-sm font-bold text-gray-700 mb-2">Chọn kênh</label>
                        <select
                            id="channel"
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-gray-900"
                        >
                            {FORUM_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-gray-900"
                            placeholder="Một tiêu đề hấp dẫn..."
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-2">Nội dung</label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-gray-900 resize-y"
                            placeholder="Viết nội dung của bạn ở đây... Bạn có thể sử dụng Markdown để định dạng."
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={() => router.push('/forum')}
                            className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-sm flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    Đang đăng...
                                </>
                            ) : 'Đăng bài'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
