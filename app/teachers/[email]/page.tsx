'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAccounts } from '@/services/googleSheetService';
import type { Account } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  BookOpen, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Star, 
  Award, 
  FileText 
} from 'lucide-react';

export default function TeacherDetail() {
  const params = useParams();
  const email = decodeURIComponent(params.email as string);
  const [teacher, setTeacher] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTeacher = async () => {
      if (!email) return;
      setIsLoading(true);
      try {
        const accounts = await fetchAccounts();
        const foundTeacher = accounts.find(acc => acc.Email === email && acc['Danh hiệu'] === 'Giáo viên');
        if (foundTeacher) {
          setTeacher(foundTeacher);
        }
      } catch (error) {
        console.error("Failed to load teacher detail", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTeacher();
  }, [email]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-6">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-600 font-medium animate-pulse">Đang tải thông tin giáo viên...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-2xl mx-auto text-center p-10 bg-red-50 rounded-2xl border border-red-200 shadow-lg mt-12">
        <User className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-red-700 mb-2">Không tìm thấy giáo viên</h3>
        <p className="text-red-600 mb-6">Giáo viên bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link 
          href="/teachers"
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <span className="text-gray-300">/</span>
          <Link href="/teachers" className="hover:text-blue-600 transition-colors">Giáo viên</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">
            {teacher['Tên tài khoản']}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-blue-50 mb-6 shadow-inner">
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
                    <User className="w-20 h-20" />
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl font-black text-gray-900 mb-2">
                {teacher['Tên tài khoản']}
              </h1>
              
              {teacher['Môn học'] && (
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-full border border-blue-100 mb-4">
                  {teacher['Môn học']}
                </span>
              )}

              <div className="flex justify-center gap-4 mt-4 pt-6 border-t border-gray-50">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">{teacher['Tổng số câu hỏi đã làm'] || 0}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Câu hỏi</span>
                </div>
                <div className="text-center border-l border-gray-100 pl-4">
                  <span className="block text-lg font-bold text-gray-900">{teacher['Danh hiệu'] || 'N/A'}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Danh hiệu</span>
                </div>
              </div>
            </div>

            {/* Contact Info (Optional) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Thông tin liên hệ
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{teacher.Email}</span>
                </div>
                {/* Add more contact info if available in the future */}
              </div>
            </div>
          </div>

          {/* Right Column: Details & Bio */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Giới thiệu
              </h2>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {teacher['Thông tin mô tả'] ? (
                  <p className="whitespace-pre-wrap">{teacher['Thông tin mô tả']}</p>
                ) : (
                  <p className="text-gray-400 italic">Chưa có thông tin giới thiệu.</p>
                )}
              </div>
            </div>

            {/* Achievements / Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Danh hiệu</p>
                  <p className="font-bold text-gray-900">{teacher['Danh hiệu']}</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Đóng góp</p>
                  <p className="font-bold text-gray-900">{teacher['Tổng số câu hỏi đã làm']} câu hỏi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
