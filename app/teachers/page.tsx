'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAccounts } from '@/services/googleSheetService';
import type { Account } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { Search, Loader2, GraduationCap, BookOpen, MapPin, User } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    const loadTeachers = async () => {
      setIsLoading(true);
      try {
        const accounts = await fetchAccounts();
        // Filter for accounts with 'Danh hiệu' === 'Giáo viên'
        const teacherAccounts = accounts.filter(acc => acc['Danh hiệu'] === 'Giáo viên');
        setTeachers(teacherAccounts);
      } catch (error) {
        console.error("Failed to load teachers", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTeachers();
  }, []);

  const subjects = ['All', ...Array.from(new Set(teachers.map(t => t['Môn học']))).filter(Boolean)];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher['Tên tài khoản'].toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (teacher['Thông tin mô tả'] || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || teacher['Môn học'] === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-4">Đội ngũ Giáo viên</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Gặp gỡ những người thầy, cô giáo tâm huyết và giàu kinh nghiệm tại SuniSVG.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between max-w-4xl mx-auto">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm giáo viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub || 'All')}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  selectedSubject === sub
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {sub || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Teachers Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredTeachers.map(teacher => (
              <Link 
                key={teacher.Email} 
                href={`/teachers/${encodeURIComponent(teacher.Email)}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center p-6 text-center"
              >
                {/* Avatar */}
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 mb-4 group-hover:border-blue-100 transition-colors">
                  {teacher.AvatarURL ? (
                    <Image
                      src={convertGoogleDriveUrl(teacher.AvatarURL)}
                      alt={teacher['Tên tài khoản']}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-300">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {teacher['Tên tài khoản']}
                </h3>
                
                {teacher['Môn học'] && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 mb-3">
                    {teacher['Môn học']}
                  </span>
                )}

                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                  {teacher['Thông tin mô tả'] || 'Chưa có thông tin mô tả.'}
                </p>

                <div className="mt-auto w-full pt-4 border-t border-gray-50 flex justify-center">
                  <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Xem chi tiết <BookOpen className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy giáo viên nào</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa hoặc môn học tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
