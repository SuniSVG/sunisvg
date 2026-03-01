'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { getClassesForUser } from '@/services/googleSheetService';
import type { Classroom } from '@/types';

const ClassCard = React.memo(({ classroom, index }: { classroom: Classroom; index: number }) => {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-orange-500 to-red-600',
        'from-cyan-500 to-blue-600',
        'from-pink-500 to-rose-600',
    ];
    
    const gradient = gradients[index % gradients.length];

    return (
        <Link 
            href={`/classroom/${classroom.ClassID}`} 
            className="group block bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl border border-gray-100 flex flex-col animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Colored Header */}
            <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
            
            <div className="p-6 flex-1">
                {/* Icon Box */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon name="book-open" className="w-7 h-7 text-white" />
                </div>

                {/* Class Name */}
                <h3 className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2" title={classroom.ClassName}>
                    {classroom.ClassName}
                </h3>

                {/* Subject */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 rounded-full mb-3">
                    <Icon name="tag" className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{classroom.Subject}</span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed min-h-[40px]">
                    {classroom.Description || 'Không có mô tả cho lớp học này.'}
                </p>
            </div>

            {/* Footer Stats */}
            <div className="mt-auto border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white px-6 py-4 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-600" title="Số lượng thành viên">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Icon name="users" className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold">{classroom.memberCount || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600" title="Số lượng bài tập">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Icon name="clipboard" className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-semibold">{classroom.quizCount || 0}</span>
                </div>
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                    <span className="text-xs">Xem</span>
                    <Icon name="arrowRight" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
});

ClassCard.displayName = 'ClassCard';

const ActionCard: React.FC<{
    to: string;
    gradient: string;
    icon: string;
    title: string;
    description: string;
}> = ({ to, gradient, icon, title, description }) => (
    <Link 
        href={to} 
        className={`group block p-8 bg-gradient-to-br ${gradient} text-white rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl relative overflow-hidden`}
    >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <Icon name={icon} className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="opacity-90 leading-relaxed">{description}</p>
            <div className="mt-4 flex items-center gap-2 font-semibold">
                <span>Bắt đầu ngay</span>
                <Icon name="arrowRight" className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
        </div>
    </Link>
);

export default function ClassroomPage() {
    const { currentUser } = useAuth();
    const [myClasses, setMyClasses] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        
        const loadClasses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const classes = await getClassesForUser(currentUser.Email);
                setMyClasses(classes.sort((a,b) => String(a.ClassName || '').localeCompare(String(b.ClassName || ''))));
            } catch (err) {
                setError('Không thể tải danh sách lớp học của bạn.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadClasses();
    }, [currentUser]);

    return (
        <div className="max-w-7xl mx-auto space-y-12 px-4 py-12">
            {/* Hero Section */}
            <section className="text-center space-y-6 py-8">
                <div className="inline-block relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                            <Icon name="book-open" className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Trung tâm Lớp học
                        </h1>
                        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full mt-3 w-48 mx-auto"></div>
                    </div>
                </div>
                
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Quản lý các lớp học, tạo bài kiểm tra và theo dõi tiến độ học tập của học sinh
                </p>

            </section>
            
            {/* Action Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActionCard 
                    to="/classroom/create"
                    gradient="from-blue-500 via-indigo-600 to-purple-600"
                    icon="plus"
                    title="Tạo lớp học mới"
                    description="Thiết lập một không gian học tập cho riêng bạn và quản lý học sinh"
                />
                <ActionCard 
                    to="/classroom/join"
                    gradient="from-green-500 via-teal-600 to-cyan-600"
                    icon="users"
                    title="Tham gia lớp học"
                    description="Sử dụng mã lớp học để tham gia và học tập cùng giáo viên"
                />
            </section>

            {/* My Classes Section */}
            <section>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Icon name="book-open" className="w-5 h-5 text-blue-600" />
                        </div>
                        Các lớp học của tôi
                    </h2>
                    {myClasses.length > 0 && (
                        <p className="text-gray-600 mt-2 ml-13">Bạn đang tham gia {myClasses.length} lớp học</p>
                    )}
                </div>

                {!currentUser ? (
                    <div className="text-center py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Icon name="lock" className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Vui lòng đăng nhập</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Bạn cần đăng nhập để xem và quản lý các lớp học của mình.
                        </p>
                        <Link 
                            href="/login"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Icon name="login" className="w-5 h-5" />
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                                <div className="h-2 bg-gray-200"></div>
                                <div className="p-6">
                                    <div className="w-14 h-14 bg-gray-200 rounded-xl mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6 mt-2"></div>
                                </div>
                                <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
                                    <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
                                    <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
                                    <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center p-10 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200">
                        <Icon name="alert-circle" className="w-16 h-16 mx-auto text-red-500 mb-4" />
                        <h3 className="text-xl font-bold text-red-700 mb-2">Đã xảy ra lỗi</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : myClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myClasses.map((cls, index) => (
                            <ClassCard key={cls.ClassID} classroom={cls} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Icon name="folder" className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Chưa có lớp học nào</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Hãy tạo một lớp học mới hoặc sử dụng mã để tham gia một lớp có sẵn.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link 
                                href="/classroom/create"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                            >
                                <Icon name="plus" className="w-5 h-5" />
                                Tạo lớp học
                            </Link>
                            <Link 
                                href="/classroom/join"
                                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                            >
                                <Icon name="users" className="w-5 h-5" />
                                Tham gia lớp
                            </Link>
                        </div>
                    </div>
                )}
            </section>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in-up {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                    opacity: 0;
                }
            `}} />
        </div>
    );
}
