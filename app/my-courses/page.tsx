'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourses, fetchPurchasedCategories } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';
import type { Course } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function MyCoursesPage() {
  const { currentUser } = useAuth();
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [purchasedCategories, setPurchasedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, purchasedData] = await Promise.all([
          fetchCourses(),
          currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([])
        ]);
        setRealCourses(coursesData);
        setPurchasedCategories(new Set(purchasedData));
      } catch (error) {
        console.error('Failed to load courses', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const cleanCategoryName = (name: string): string => {
    return name.replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim();
  };

  const isCourseOwned = useMemo(() => (course: Course): boolean => {
    for (const pc of purchasedCategories) {
      const cleanPc = cleanCategoryName(pc);
      const cleanCategory = cleanCategoryName(course.Category || '');
      const cleanTitle = cleanCategoryName(course.Title || '');
      
      if (cleanPc === cleanCategory || cleanPc === cleanTitle) {
        return true;
      }
    }
    return false;
  }, [purchasedCategories]);

  const myCourses = useMemo(() => {
    return realCourses.filter(c => isCourseOwned(c));
  }, [realCourses, isCourseOwned]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <Icon name="lock" className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
        <p className="text-gray-600 mb-8 max-w-md">Bạn cần đăng nhập để xem danh sách các khóa học đã sở hữu.</p>
        <Link href="/login" className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-colors">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-500 hover:text-green-600 transition-colors">
            <Icon name="arrowLeft" className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
            <p className="text-gray-500 text-sm mt-1">Bạn đang có {myCourses.length} khóa học</p>
          </div>
        </div>

        {myCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map(course => (
              <Link href={`/courses/${course.ID}`} key={course.ID} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
                  {course.ImageURL ? (
                    <Image 
                      src={convertGoogleDriveUrl(course.ImageURL)} 
                      alt={course.Title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Icon name="book" className="w-16 h-16 text-gray-300" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-green-600 shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                      <Icon name="play" className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">{course.Category}</div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-4 group-hover:text-green-600 transition-colors">
                    {course.Title}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                      <span>Tiến độ học tập</span>
                      <span className="text-green-600 font-bold">0%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <Icon name="book-open" className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có khóa học nào</h3>
            <p className="text-gray-500 mb-8 max-w-md">Hãy khám phá các khóa học chất lượng để bắt đầu hành trình học tập của bạn.</p>
            <Link href="/courses" className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-colors shadow-sm">
              Khám phá khóa học
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
