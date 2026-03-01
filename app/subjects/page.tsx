'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/shared/Icon';

export default function SubjectsPage() {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const subjects = [
        { id: 'math', name: 'Toán học', icon: 'calculator' },
        { id: 'physics', name: 'Vật lý', icon: 'zap' },
        { id: 'chemistry', name: 'Hóa học', icon: 'beaker' },
        { id: 'biology', name: 'Sinh học', icon: 'dna' },
        { id: 'english', name: 'Tiếng Anh', icon: 'globe' },
        { id: 'literature', name: 'Ngữ văn', icon: 'book-open' },
        { id: 'history', name: 'Lịch sử', icon: 'clock' },
        { id: 'geography', name: 'Địa lý', icon: 'map' },
        { id: 'civic', name: 'GDCD', icon: 'users' },
    ];

    const toggleSubject = (id: string) => {
        setSelectedSubjects(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cập nhật môn học quan tâm</h1>
                    <p className="text-gray-500">Chọn các môn học bạn muốn nhận thông báo và tài liệu mới nhất.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {subjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id)}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                                selectedSubjects.includes(subject.id)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                                selectedSubjects.includes(subject.id) ? 'bg-blue-200' : 'bg-gray-100'
                            }`}>
                                <Icon name={subject.icon as any} className="w-6 h-6" />
                            </div>
                            <span className="font-bold">{subject.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                    <button 
                        className="bg-blue-600 text-white font-bold py-3 px-12 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedSubjects.length === 0}
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
