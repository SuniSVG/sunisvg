'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBooks } from '@/services/googleSheetService';
import type { Book } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { 
  ArrowLeft, 
  ShoppingCart, 
  BookOpen, 
  FileText, 
  Download, 
  Share2, 
  Star, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function BookDetail() {
  const params = useParams();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const books = await fetchBooks();
        const foundBook = books.find(b => b.ID === id);
        if (foundBook) {
          setBook(foundBook);
          setActiveImage(foundBook.ImageURL);
        }
      } catch (error) {
        console.error("Failed to load book detail", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBook();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-6">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-600 font-medium animate-pulse">Đang tải thông tin sách...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-2xl mx-auto text-center p-10 bg-red-50 rounded-2xl border border-red-200 shadow-lg mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-red-700 mb-2">Không tìm thấy sách</h3>
        <p className="text-red-600 mb-6">Sách bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link 
          href="/books"
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    if (book.DemoFileURL) {
      window.open(book.DemoFileURL, '_blank');
    } else {
      alert("Tài liệu này chưa có bản xem thử.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href="/books" className="hover:text-blue-600 transition-colors">Sách ID</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">
            {book.Title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Images */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 aspect-[3/4] relative group">
              {activeImage ? (
                <Image 
                  src={convertGoogleDriveUrl(activeImage)} 
                  alt={book.Title} 
                  fill 
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-300">
                  <BookOpen className="w-20 h-20" />
                </div>
              )}
              {book.Coupon && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg shadow-md">
                  {book.Coupon}
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {book.MoreImageURLs && book.MoreImageURLs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => setActiveImage(book.ImageURL)}
                  className={`w-20 h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    activeImage === book.ImageURL ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Image src={convertGoogleDriveUrl(book.ImageURL)} alt="Main" width={80} height={80} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                </button>
                {book.MoreImageURLs.map((url, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(url)}
                    className={`w-20 h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                      activeImage === url ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Image src={convertGoogleDriveUrl(url)} alt={`Thumbnail ${idx}`} width={80} height={80} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {book.Category}
                </span>
                <span className="text-xs font-mono text-gray-400">ID: {book.ID}</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
                {book.Title}
              </h1>

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {book.Authors.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-900">{book.Authors}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900">4.8</span>
                  <span className="text-gray-400">(120 đánh giá)</span>
                </div>
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Còn hàng</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Giá bán ưu đãi</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-red-600">
                      {book.Price === 0 ? 'Miễn phí' : `${book.Price.toLocaleString()}đ`}
                    </span>
                    {book.Price > 0 && (
                      <span className="text-lg text-gray-400 line-through font-medium">
                        {(book.Price * 1.2).toLocaleString()}đ
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Mua ngay
                  </button>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số trang</p>
                  <p className="font-bold text-gray-900">{book.Pages} trang</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Đã bán</p>
                  <p className="font-bold text-gray-900">{book.Saled}+ cuốn</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ngày đăng</p>
                  <p className="font-bold text-gray-900">{book.SubmissionDate.split(' ')[0]}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Định dạng</p>
                  <p className="font-bold text-gray-900">PDF / Sách in</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Mô tả chi tiết
                </h3>
                <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <p className="whitespace-pre-wrap">{book.Abstract}</p>
                </div>
              </div>

              {/* Demo File */}
              {book.DemoFileURL && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Đọc thử
                  </h3>
                  <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-purple-900 mb-1">Bản đọc thử miễn phí</p>
                      <p className="text-sm text-purple-700">Xem trước nội dung sách trước khi mua</p>
                    </div>
                    <button 
                      onClick={handleDownload}
                      className="bg-purple-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200 flex items-center gap-2 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      Đọc ngay
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={book.Title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        thumbnail={convertGoogleDriveUrl(book.ImageURL)}
        platformName="SuniSVG Books"
      />
    </div>
  );
}
