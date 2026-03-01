'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-xl w-80 h-96 flex flex-col border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">Trợ lý học tập</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow p-4 bg-gray-50 overflow-y-auto">
            <div className="bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 inline-block max-w-[85%]">
              Xin chào! Mình có thể giúp gì cho bạn trong việc học tập hôm nay?
            </div>
          </div>
          <div className="p-3 bg-white border-t border-gray-100">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
              className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
