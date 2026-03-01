'use client';

import React from 'react';
import { Icon } from './shared/Icon';

const reviews = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    role: 'Học sinh lớp 12',
    content: 'Nền tảng tuyệt vời! Các tài liệu rất chất lượng và bám sát chương trình học. Nhờ có SuniSVG mà điểm số của mình đã cải thiện đáng kể.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Trần Thị B',
    role: 'Giáo viên Toán',
    content: 'Tôi thường xuyên sử dụng tài liệu trên đây để làm tài liệu tham khảo cho học sinh. Rất hữu ích và đa dạng.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Lê Hoàng C',
    role: 'Học sinh lớp 11',
    content: 'Giao diện thân thiện, dễ sử dụng. Mình thích nhất là có thể tìm kiếm tài liệu theo môn học và chuyên đề rất nhanh chóng.',
    rating: 4,
  }
];

export default function Reviews() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow text-left border border-gray-100">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <p className="text-gray-700 mb-6 italic leading-relaxed">&quot;{review.content}&quot;</p>
          <div className="flex items-center gap-4 mt-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {review.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{review.name}</h4>
              <p className="text-sm text-gray-500">{review.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
