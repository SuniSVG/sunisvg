'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourses, fetchPurchasedCategories, getSharedCoursesInbox } from '@/services/googleSheetService';
import type { Course } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

// Component for a single course card
const MyCourseCard: React.FC<{ course: Course & { sharedBy?: string } }> = ({ course }) => (
    <Link href={`/courses/${course.ID}`} className="group block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
        <div className="aspect-[16/9] relative bg-gray-100">
            {course.ImageURL ? (
                <Image
                    src={convertGoogleDriveUrl(course.ImageURL)}
                    alt={course.Title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Icon name="book" className="w-12 h-12 text-gray-300" />
                </div>
            )}
        </div>
        <div className="p-5">
            <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate" title={course.Title}>
                {course.Title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                {course.Authors}
            </p>
            <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${course.sharedBy ? 'text-purple-600 bg-purple-50' : 'text-green-600 bg-green-50'}`}>
                    {course.sharedBy ? 'Được chia sẻ' : 'Đã sở hữu'}
                </span>
                <span className="text-sm font-bold text-blue-600 group-hover:underline">
                    Vào học →
                </span>
            </div>
            {course.sharedBy && (
                <p className="text-[10px] text-gray-400 mt-2 truncate" title={`Từ: ${course.sharedBy}`}>
                    Từ: {course.sharedBy}
                </p>
            )}
        </div>
    </Link>
);

export default function MyCoursesPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const [myCourses, setMyCourses] = useState<(Course & { sharedBy?: string })[]>([]);
    const [sharedCourses, setSharedCourses] = useState<(Course & { sharedBy?: string })[]>([]);
    const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            // Redirect or show login message if not logged in
            setIsLoading(false);
            return;
        }

        const loadMyCourses = async () => {
            try {
                const [allCourses, purchasedItems, sharedInboxRes] = await Promise.all([
                    fetchCourses(),
                    fetchPurchasedCategories(currentUser.Email),
                    getSharedCoursesInbox(currentUser.Email)
                ]);

                // Hàm chuẩn hóa: xóa khoảng trắng, chuyển thường, xóa phần giá tiền (ví dụ: "(500.000đ)")
                const cleanStr = (s: string) => s.trim().replace(/\s*\((?:[\d.,]+\s*đ|Miễn phí|0\s*đ)\)$/i, '').trim().toLowerCase();

                const purchasedSet = new Set<string>();

                // 1. Thêm từ sheet Purchases
                purchasedItems.forEach(item => {
                    if (item.CategoryName) purchasedSet.add(cleanStr(item.CategoryName));
                });

                // 2. Thêm từ cột 'Owned' trong tài khoản (quan trọng)
                if ((currentUser as any)['Owned']) {
                    const ownedList = String((currentUser as any)['Owned']).split(',');
                    ownedList.forEach(item => {
                        if (item) purchasedSet.add(cleanStr(item));
                    });
                }

                // 3. Thêm từ Shared Courses (Accepted)
                const sharedMap = new Map<string, string>();
                if (sharedInboxRes.success && sharedInboxRes.data) {
                    sharedInboxRes.data.forEach((item: any) => {
                        if (item.status === 'accepted') {
                            sharedMap.set(String(item.courseId), item.ownerEmail);
                        }
                    });
                }

                const ownedCourses = allCourses.filter(course => {
                    const courseId = String(course.ID || '').trim();
                    // Check shared first (exact ID match)
                    if (sharedMap.has(courseId)) return true;

                    const cleanCourseId = courseId.toLowerCase();
                    const cleanCourseCategory = cleanStr(course.Category || '');
                    const cleanCourseTitle = cleanStr(course.Title || '');

                    // Check purchased (exact match for ID, category, or title)
                    return purchasedSet.has(cleanCourseId) ||
                           (!!cleanCourseCategory && purchasedSet.has(cleanCourseCategory)) ||
                           (!!cleanCourseTitle && purchasedSet.has(cleanCourseTitle));
                           
                }).map(course => {
                    if (sharedMap.has(String(course.ID))) {
                        return { ...course, sharedBy: sharedMap.get(String(course.ID)) };
                    }
                    return course;
                }) as (Course & { sharedBy?: string })[];

                // Chia danh sách
                const shared = ownedCourses.filter(c => c.sharedBy);
                const purchased = ownedCourses.filter(c => !c.sharedBy);

                setMyCourses(ownedCourses); // Giữ lại danh sách tổng hợp nếu cần
                setSharedCourses(shared);
                setPurchasedCourses(purchased);


            } catch (error) {
                console.error("Failed to load my courses:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMyCourses();
    }, [currentUser, authLoading]);

    if (isLoading || authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                <Icon name="lock" className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
                <p className="text-gray-500 mb-6">Bạn cần đăng nhập để xem các khóa học đã mua.</p>
                <Link href="/login" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    Đăng nhập ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Khóa học của tôi</h1>
                
                {sharedCourses.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Được chia sẻ với bạn</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sharedCourses.map(course => (
                                <MyCourseCard key={`shared-${course.ID}`} course={course} />
                            ))}
                        </div>
                    </div>
                )}

                {purchasedCourses.length > 0 && (
                     <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Khóa học đã mua</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {purchasedCourses.map(course => (
                                <MyCourseCard key={`purchased-${course.ID}`} course={course} />
                            ))}
                        </div>
                    </div>
                )}


                {myCourses.length === 0 && !isLoading ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Icon name="book-open" className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Bạn chưa sở hữu khóa học nào</h2>
                        <p className="text-gray-500 mb-6">Hãy khám phá và đăng ký các khóa học để bắt đầu hành trình học tập nhé!</p>
                        <Link href="/courses" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            Khám phá khóa học
                        </Link>
                    </div>
                ) : null}
            </div>
        </div>
    );
}