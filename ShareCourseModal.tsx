'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { shareCourseWithFriend, fetchAccounts, getSharedCoursesOutbox } from '@/services/googleSheetService';
import { useToast } from '@/contexts/ToastContext';
import { X, Send, Users, Gift } from 'lucide-react';
import { Account, Course } from '@/types';
import Image from 'next/image';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

interface ShareCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
}

export const ShareCourseModal: React.FC<ShareCourseModalProps> = ({ isOpen, onClose, course }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [friends, setFriends] = useState<Account[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string>('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shareCount, setShareCount] = useState(0);
    const MAX_SHARES = 3;

    useEffect(() => {
        if (isOpen && currentUser) {
            const loadFriends = async () => {
                const allAccounts = await fetchAccounts();
                const friendEmails = (currentUser['Bạn bè'] || '')
                    .split(',')
                    .filter(s => s.trim().startsWith('(Y)'))
                    .map(s => s.substring(3).trim().toLowerCase());
                
                const friendAccounts = allAccounts.filter(acc => friendEmails.includes(acc.Email.toLowerCase()));
                setFriends(friendAccounts);
            };

            const checkShareLimit = async () => {
                const res = await getSharedCoursesOutbox(currentUser.Email);
                if (res.success && res.data) {
                    const count = res.data.filter((item: any) => 
                        item.courseId === course.ID && 
                        ['pending', 'accepted'].includes(item.status)
                    ).length;
                    setShareCount(count);
                }
            };

            loadFriends();
            checkShareLimit();
        }
    }, [isOpen, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedFriend) {
            addToast('Vui lòng chọn một người bạn.', 'info');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await shareCourseWithFriend({
                ownerEmail: currentUser.Email,
                friendEmail: selectedFriend,
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Gift className="w-5 h-5 text-green-600" /> Chia sẻ khóa học</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-green-100 overflow-hidden relative shrink-0">
                            {course.ImageURL && <Image src={convertGoogleDriveUrl(course.ImageURL)} alt={course.Title} fill className="object-cover" />}
                        </div>
                        <p className="font-bold text-sm text-gray-800 line-clamp-2">{course.Title}</p>
                    </div>

                    {shareCount >= MAX_SHARES ? (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            Bạn đã đạt giới hạn chia sẻ cho khóa học này ({shareCount}/{MAX_SHARES}).
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-right">Đã chia sẻ: {shareCount}/{MAX_SHARES} lần</p>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Chọn bạn bè</label>
                        <select
                            value={selectedFriend}
                            onChange={(e) => setSelectedFriend(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="" disabled>-- Chọn người nhận --</option>
                            {friends.length > 0 ? (
                                friends.map(friend => (
                                    <option key={friend.Email} value={friend.Email}>
                                        {friend['Tên tài khoản']} ({friend.Email})
                                    </option>
                                ))
                            ) : (
                                <option disabled>Bạn chưa có bạn bè nào</option>
                            )}
                        </select>
                        {friends.length === 0 && <Link href="/friends" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Kết bạn ngay</Link>}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Lời nhắn (tùy chọn)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Chúc bạn học tốt nhé!"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 min-h-[80px]"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedFriend || shareCount >= MAX_SHARES}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            Gửi lời mời
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};