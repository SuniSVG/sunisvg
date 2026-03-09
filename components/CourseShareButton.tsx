'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Course } from '@/types';
import { ShareCourseModal } from './ShareCourseModal';

interface CourseShareButtonProps {
    course: Course;
    className?: string;
    variant?: 'icon' | 'full';
}

export default function CourseShareButton({ course, className = "", variant = 'full' }: CourseShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault(); // Ngăn chặn chuyển trang nếu nút nằm trong thẻ Link
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className={`transition-colors ${
                    variant === 'icon' 
                    ? 'p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full' 
                    : 'flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-bold text-sm'
                } ${className}`}
                title="Chia sẻ khóa học với bạn bè"
            >
                <Share2 className={variant === 'icon' ? "w-5 h-5" : "w-4 h-4"} />
                {variant === 'full' && <span>Chia sẻ</span>}
            </button>

            <ShareCourseModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                course={course}
            />
        </>
    );
}
