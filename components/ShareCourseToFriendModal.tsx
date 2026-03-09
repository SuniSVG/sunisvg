'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shareCourseWithFriend, fetchCourses, getSharedCoursesOutbox, fetchPurchasedCategories } from '@/services/googleSheetService';
import { useToast } from '@/contexts/ToastContext';
import { X, Send, Gift, BookOpen } from 'lucide-react';
import { Course } from '@/types';

interface ShareCourseToFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    friendEmail: string;
    friendName: string;
}

export const ShareCourseToFriendModal: React.FC<ShareCourseToFriendModalProps> = ({ isOpen, onClose, friendEmail, friendName }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
    const MAX_SHARES = 3;

    useEffect(() => {
        if (isOpen && currentUser) {
            const loadData = async () => {
                const [allCourses, outboxRes, purchasedItems] = await Promise.all([
                    fetchCourses(),
                    getSharedCoursesOutbox(currentUser.Email),
                    fetchPurchasedCategories(currentUser.Email)
                ]);

                const cleanStr = (s: string) => s.trim().replace(/\s*\((?:[\d.,]+\s*đ|Miễn phí|0\s*đ)\)$/i, '').trim().toLowerCase();
                const purchasedSet = new Set<string>();
                
                purchasedItems.forEach(item => {
                    if (item.CategoryName) purchasedSet.add(cleanStr(item.CategoryName));
                });

                const owned = allCourses.filter(course => {
                    const courseId = cleanStr(String(course.ID || ''));
                    const courseCategory = cleanStr(course.Category || '');
                    const courseTitle = cleanStr(course.Title || '');
                    return Array.from(purchasedSet).some(purchased => {
                        if (!purchased) return false;
                        if (purchased === courseId || purchased === courseCategory || purchased === courseTitle) return true;
                        if (courseTitle.includes(purchased) || courseCategory.includes(purchased) || purchased.includes(courseTitle) || purchased.includes(courseCategory)) return true;
                        return false;
                    });
                });
                setMyCourses(owned);

                // Calculate share counts
                if (outboxRes.success && outboxRes.data) {
                    const counts: Record<string, number> = {};
                    outboxRes.data.forEach((item: any) => {
                        if (['pending', 'accepted'].includes(item.status)) {
                            counts[item.courseId] = (counts[item.courseId] || 0) + 1;
                        }
                    });
                    setShareCounts(counts);
                }
            };
            loadData();
        }
    }, [isOpen, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedCourseId) return;

        const course = myCourses.find(c => c.ID === selectedCourseId);
        if (!course) return;

        setIsSubmitting(true);
        try {
            const result = await shareCourseWithFriend({
                ownerEmail: currentUser.Email,
                friendEmail: friendEmail,
                courseId: course.ID,
                courseName: course.Title,
                message: message,
            });
            if (result.success) {
                addToast('Đã gửi lời mời chia sẻ!', 'success');
                onClose();
            } else {
                addToast(result.error || 'Không thể chia sẻ khóa học.', 'error');
            }
        } catch (error) {
            addToast('Lỗi kết nối.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const currentShareCount = shareCounts[selectedCourseId] || 0;
    const isLimitReached = currentShareCount >= MAX_SHARES;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-green-600" /> 
                        Tặng khóa học cho {friendName}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Chọn khóa học của bạn</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="" disabled>-- Chọn khóa học --</option>
                            {myCourses.length > 0 ? (
                                myCourses.map(course => (
                                    <option key={course.ID} value={course.ID}>
                                        {course.Title}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Bạn chưa sở hữu khóa học nào</option>
                            )}
                        </select>
                    </div>

                    {selectedCourseId && (
                        <div className={`text-xs text-right ${isLimitReached ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {isLimitReached 
                                ? `Đã hết lượt chia sẻ (/)` 
                                : `Đã chia sẻ: / lần`}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Lời nhắn (tùy chọn)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Gửi lời nhắn tới ...`}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 min-h-[80px]"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedCourseId || isLimitReached}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            Gửi quà tặng
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
