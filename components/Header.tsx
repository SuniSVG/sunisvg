'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { Icon } from './shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import UserMenuDashboard from './UserMenuDashboard';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function Header() {
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const incomingRequestCount = useMemo(() => {
    if (!currentUser) return 0;
    const raw = currentUser['Bạn bè'] || '';
    let count = 0;
    if (raw) {
      String(raw).split(',').forEach((s: string) => {
        if (s.trim().startsWith('(?)')) {
          count++;
        }
      });
    }
    return count;
  }, [currentUser]);

  return (
    <header className="bg-green-800 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:gap-8 h-full flex-shrink-0">
          <button 
            className="lg:hidden text-white p-2 hover:bg-green-700 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
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
            <Link href="/classroom" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md">
              Nhóm học tập
            </Link>
            <Link
              href="/friends" className="h-full flex items-center px-3 text-sm font-bold text-white hover:bg-green-700 transition-colors rounded-md relative">
              Bạn bè
              {incomingRequestCount > 0 && (
                <span className="absolute top-3 right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-green-800"></span>
                </span>
              )}
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
                <button className="flex items-center gap-2 text-sm font-bold bg-green-700 text-white pl-1.5 pr-4 py-1.5 rounded-full hover:bg-green-600 transition-colors shadow-sm border border-green-600">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-green-800 flex-shrink-0">
                    {currentUser.AvatarURL ? (
                      <Image
                        src={convertGoogleDriveUrl(currentUser.AvatarURL)}
                        alt={currentUser['Tên tài khoản']}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                        {currentUser['Tên tài khoản']?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="truncate max-w-[100px]">{currentUser['Tên tài khoản']}</span>
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

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-green-800 border-t border-green-700 shadow-xl animate-in slide-in-from-top-2 duration-200 z-40">
          <nav className="flex flex-col p-2 space-y-1">
            {[
              { href: '/articles', label: 'Thư viện' },
              { href: '/courses', label: 'Khoá học' },
              { href: '/teachers', label: 'Giáo viên' },
              { href: '/exams', label: 'Thi online' },
              { href: '/friends', label: 'Bạn bè' },
              { href: '/forum', label: 'Diễn đàn' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-white font-bold hover:bg-green-700 rounded-xl transition-colors flex items-center gap-3"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
