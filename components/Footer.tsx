'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCourses } from '@/services/googleSheetService';
import type { Course } from '@/types';
import { MapPin, Phone, Mail, User, Shield, FileText } from 'lucide-react';

export default function Footer() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses();
        // Take first 10 courses
        setCourses(data.slice(0, 10));
      } catch (error) {
        console.error("Failed to load footer courses", error);
      }
    };
    loadCourses();
  }, []);

  // Split courses into two columns
  const midIndex = Math.ceil(courses.length / 2);
  const leftCourses = courses.slice(0, midIndex);
  const rightCourses = courses.slice(midIndex);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Contact */}
          <div className="space-y-6">
            <Link href="/" className="text-3xl font-black text-green-600 tracking-wider block mb-2">
              SuniSVG
            </Link>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold text-gray-900 block mb-1">Địa chỉ:</span>
                  Số 17, hẻm 58/3/16, Trần Bình, Mai Dịch, Cầu Giấy, Hà Nội
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <p>
                  <span className="font-bold text-gray-900">Hotline:</span> 0963 797 036
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <p>
                  <span className="font-bold text-gray-900">Email:</span> bduc6974@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Courses */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              KHÓA HỌC NỔI BẬT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                {leftCourses.map(course => (
                  <Link 
                    key={course.ID} 
                    href={`/courses/${course.ID}`}
                    className="block text-sm text-gray-600 hover:text-green-600 transition-colors truncate"
                    title={course.Title}
                  >
                    {course.Title}
                  </Link>
                ))}
              </div>
              <div className="space-y-3">
                {rightCourses.map(course => (
                  <Link 
                    key={course.ID} 
                    href={`/courses/${course.ID}`}
                    className="block text-sm text-gray-600 hover:text-green-600 transition-colors truncate"
                    title={course.Title}
                  >
                    {course.Title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 4: Support & Partners */}
          <div className="space-y-8">
            {/* Support */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                HỖ TRỢ
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="/policy/privacy" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                    <Shield className="w-4 h-4" />
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/policy/terms" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                    <FileText className="w-4 h-4" />
                    Điều khoản dịch vụ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Partners */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                ĐỐI TÁC/ TUYỂN DỤNG LIÊN HỆ
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Đinh Bảo Đức</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>0963 797 036</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} SuniSVG. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
