'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBooks } from '@/services/googleSheetService';
import type { Book } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { Search, Filter, ShoppingCart, Eye, BookOpen, Star, Loader2 } from 'lucide-react';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (error) {
        console.error("Failed to load books", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, []);

  const categories = ['All', ...Array.from(new Set(books.map(b => b.Category))).filter(Boolean)];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.Authors.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || book.Category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-4">Sách ID</h1>
          <p className="text-gray-600 max-w-2xl">
            Kho tài liệu và sách tham khảo chất lượng cao, giúp bạn ôn thi hiệu quả.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <Link 
                key={book.ID} 
                href={`/books/${book.ID}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  {book.ImageURL ? (
                    <Image
                      src={convertGoogleDriveUrl(book.ImageURL)}
                      alt={book.Title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  {book.Coupon && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                      {book.Coupon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {book.Category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors" title={book.Title}>
                    {book.Title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                    {book.Authors}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="block text-lg font-black text-red-600">
                        {book.Price === 0 ? 'Miễn phí' : `${book.Price.toLocaleString()}đ`}
                      </span>
                      {book.Saled > 0 && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          Đã bán: {book.Saled}
                        </span>
                      )}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy sách nào</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa hoặc danh mục tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
