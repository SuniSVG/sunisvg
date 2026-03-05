'use client';

import Link from 'next/link';
import { Icon } from './shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import UserMenuDashboard from './UserMenuDashboard';

export default function Header() {
  const { currentUser } = useAuth();

  return (
    <header className="bg-green-800 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 h-full flex-shrink-0">
          <Link href="/" className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
            SuniSVG
          </Link>
          <nav className="hidden lg:flex items-center h-full gap-1">
            <Link href="/articles" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Thư viện
            </Link>
            <Link href="/courses" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Khoá học
            </Link>
            <Link href="/teachers" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Giáo viên
            </Link>
            <Link href="/exams" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Thi online
            </Link>
            <Link href="/forum" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Diễn đàn
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm khoá học, bài thi..." 
              className="w-full h-10 pl-10 pr-4 rounded-full border-none focus:ring-2 focus:ring-green-400 text-sm text-white bg-green-700 placeholder-green-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (!val) return;
                  
                  // Check if input is numeric
                  const isNumeric = /^\d+$/.test(val);

                  if (isNumeric) {
                    if (val.startsWith('2')) {
                      window.location.href = `/courses/${val}`;
                    } else if (parseInt(val, 10) < 1000000) {
                      window.location.href = `/questions/${val}`;
                    } else {
                      // For other numbers, search generally
                      window.location.href = `/search?q=${encodeURIComponent(val)}`;
                    }
                  } else {
                    // For text/names, go to search page
                    window.location.href = `/search?q=${encodeURIComponent(val)}`;
                  }
                }
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200">
              <Icon name="search" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {currentUser ? (
            <>
              <div className="hidden lg:flex items-center gap-2 text-sm font-bold bg-white text-gray-800 px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                <Icon name="currency-dollar" className="w-4 h-4 text-green-600" />
                {Number(currentUser.Money || 0).toLocaleString('vi-VN')} đ
              </div>
              <div className="relative group h-full flex items-center">
                <button className="flex items-center gap-2 text-sm font-bold bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors shadow-sm border border-green-600">
                  <Icon name="user" className="w-4 h-4" />
                  {currentUser['Tên tài khoản']}
                </button>
                {/* Dropdown with transparent bridge */}
                <div className="absolute right-0 top-full pt-2 w-80 hidden group-hover:block">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    <UserMenuDashboard />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors shadow-sm border border-green-600">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
