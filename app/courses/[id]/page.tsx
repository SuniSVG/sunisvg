'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    fetchCourses, 
    fetchPremiumArticles, 
    fetchPurchasedCategories, 
    purchasePremiumCategory,
    fetchAccounts
} from '@/services/googleSheetService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import type { Course, ScientificArticle, Account } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

const DepositModal = dynamic(() => import('@/components/DepositModal').then(mod => mod.DepositModal), { ssr: false });

const FeatureCard = ({ title, items, iconName, colorClass, iconColorClass }: { title: string, items?: string[], iconName: string, colorClass: string, iconColorClass: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
        <div className={`h-24 ${colorClass} relative flex items-center justify-center`}>
             <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm ${iconColorClass}`}>
                <Icon name={iconName} className="w-7 h-7" />
             </div>
        </div>
        <div className="p-5 flex-1">
            <h4 className="font-bold text-gray-900 mb-3 text-center text-lg">{title}</h4>
            {items && items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
);

const CourseContentItem = React.memo<{ 
    item: ScientificArticle; 
    isUnlocked: boolean; 
    index: number; 
}>(({ item, isUnlocked }) => {
    const isVideo = item.DocumentURL?.includes('youtube.com') || item.DocumentURL?.includes('youtu.be') || item.Title.toLowerCase().includes('video');

    if (isUnlocked) {
        return (
            <a 
                href={item.DocumentURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isVideo ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Icon name={isVideo ? 'play-circle' : 'file-text'} className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate">
                        {item.Title}
                    </span>
                </div>
                {item.Abstract && (
                    <span className="text-xs text-gray-400 hidden sm:block ml-4 truncate max-w-[150px]">
                        {item.Abstract}
                    </span>
                )}
            </a>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3 min-w-0 opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Icon name="lock" className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-500 truncate">
                    {item.Title}
                </span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Locked
            </span>
        </div>
    );
});

CourseContentItem.displayName = 'CourseContentItem';

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [teacher, setTeacher] = useState<Account | null>(null);
    const [contentItems, setContentItems] = useState<ScientificArticle[]>([]);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    const [groupedContent, setGroupedContent] = useState<{ [key: string]: ScientificArticle[] }>({});
    const [stageOrder, setStageOrder] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const courses = await fetchCourses();
                
                console.log('🔍 Searching for course with ID:', params.id);
                console.log('📦 Available courses:', courses);
                
                // Tìm course với nhiều cách khác nhau
                let foundCourse = courses.find(c => String(c.ID) === String(params.id));
                
                // Nếu không tìm thấy bằng ID, thử tìm bằng index
                if (!foundCourse) {
                    const index = parseInt(params.id as string);
                    if (!isNaN(index) && index >= 0 && index < courses.length) {
                        foundCourse = courses[index];
                        console.log('✅ Found course by index:', foundCourse);
                    }
                }
                
                if (!foundCourse) {
                    console.error("❌ Course not found for ID:", params.id);
                    addToast('Không tìm thấy khóa học.', 'error');
                    router.push('/courses');
                    return;
                }
                
                console.log('✅ Found course:', foundCourse);
                setCourse(foundCourse);

                const [allArticles, purchasedCats, accounts] = await Promise.all([
                    fetchPremiumArticles(),
                    currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([]),
                    fetchAccounts()
                ]);

                const relatedContent = allArticles.filter(
                    art => art.Category.trim().toLowerCase() === foundCourse.Category.trim().toLowerCase() && 
                           art.Status === 'Approved'
                );
                setContentItems(relatedContent);

                // Find teacher account
                if (foundCourse.MainTeacher) {
                    const foundTeacher = accounts.find(acc => 
                        acc.Email.toLowerCase() === foundCourse.MainTeacher?.toLowerCase()
                    );
                    setTeacher(foundTeacher || null);
                }

                // Grouping Logic
                const groups: { [key: string]: ScientificArticle[] } = {};
                let order: string[] = [];

                // Group strictly by Part (Path) as requested
                relatedContent.forEach(item => {
                    // Use Part as path. If empty, group into 'Tài liệu chung'
                    const path = item.Part && item.Part.trim() !== '' ? item.Part.trim() : 'Tài liệu chung';
                    
                    if (!groups[path]) {
                        groups[path] = [];
                    }
                    groups[path].push(item);
                });

                // Sort groups alphabetically
                order = Object.keys(groups).sort((a, b) => {
                    if (a === 'Tài liệu chung') return 1;
                    if (b === 'Tài liệu chung') return -1;
                    return a.localeCompare(b, undefined, { numeric: true });
                });

                setGroupedContent(groups);
                setStageOrder(order);

                if (currentUser) {
                    let purchased = false;
                    for (const pc of purchasedCats) {
                        const cleanPc = (typeof pc === 'string' ? pc : pc.CategoryName).replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim();
                        const cleanCategory = foundCourse.Category?.replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim();
                        const cleanTitle = foundCourse.Title?.replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim();
                        if (cleanPc === cleanCategory || cleanPc === cleanTitle) {
                            purchased = true;
                            break;
                        }
                    }
                    setIsPurchased(purchased);
                }
            } catch (error) {
                console.error('Error loading course details:', error);
                addToast('Có lỗi xảy ra khi tải dữ liệu.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [params.id, currentUser, router, addToast]);

    const handlePurchase = async () => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để đăng ký khóa học.', 'info');
            router.push('/login');
            return;
        }
        if (!course) return;

        if ((currentUser.Money || 0) < course.Price) {
            addToast('Số dư không đủ. Vui lòng nạp thêm tiền.', 'error');
            setIsDepositModalOpen(true);
            return;
        }

        const confirmPurchase = window.confirm(
            `Bạn có chắc chắn muốn đăng ký khóa học "${course.Title}" với giá ${course.Price.toLocaleString('vi-VN')}đ không?`
        );
        if (!confirmPurchase) return;

        setIsPurchasing(true);
        try {
            const result = await purchasePremiumCategory(currentUser.Email, course.Category);
            if (result.success) {
                addToast('Đăng ký thành công! Bạn đã có thể truy cập nội dung khóa học.', 'success');
                await refreshCurrentUser();
                setIsPurchased(true);
            } else {
                addToast(result.error || 'Giao dịch thất bại.', 'error');
            }
        } catch (e: any) {
            addToast(e.message || 'Lỗi kết nối.', 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleDepositSuccess = async () => {
        setIsDepositModalOpen(false);
        await refreshCurrentUser();
        addToast('Nạp tiền thành công! Vui lòng thử lại giao dịch.', 'success');
    };

    // Calculate original price if sales exist
    const originalPrice = useMemo(() => {
        if (!course) return 0;
        if (course.Sales) {
            const discountPercent = parseInt(course.Sales, 10);
            if (!isNaN(discountPercent) && discountPercent > 0) {
                return Math.round(course.Price / (1 - discountPercent / 100));
            }
        }
        return course.Price * 1.5; // Default fallback if no specific sales data
    }, [course]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
            {/* Hero Header */}
            <div className="relative bg-white border-b border-gray-200">
                <div className="container mx-auto max-w-7xl px-4 py-6">
                    <Link href="/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium">
                        <Icon name="arrowLeft" className="w-4 h-4" />
                        Quay lại danh sách
                    </Link>
                    
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-[3/1] relative bg-gray-100 flex items-center justify-center">
                        {course.ImageURL ? (
                            <Image 
                                src={convertGoogleDriveUrl(course.ImageURL)} 
                                alt={course.Title} 
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                priority
                            />
                        ) : (
                            <Icon name="book" className="w-16 h-16 text-gray-300" />
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT COLUMN - MAIN CONTENT */}
                    <div className="flex-1 min-w-0 space-y-8">
                        
                        {/* 1. Intro Section */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Giới thiệu</h2>
                            <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                                {course.Abstract || 'Chương trình học được thiết kế bài bản, bám sát cấu trúc đề thi, giúp học sinh nắm vững kiến thức từ cơ bản đến nâng cao.'}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <div className="flex items-start gap-3 mb-1">
                                        <Icon name="user" className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-sm text-gray-500">Đối tượng học:</span>
                                            <span className="font-medium text-gray-900">{course.For || 'Học sinh lớp 12, Ôn thi THPTQG'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-start gap-3 mb-1">
                                        <Icon name="video" className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-sm text-gray-500">Trạng thái:</span>
                                            <span className="font-medium text-gray-900">{course.Update || 'Đang cập nhật'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-start gap-3 mb-1">
                                        <Icon name="calendar" className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-sm text-gray-500">Hạn sử dụng:</span>
                                            <span className="font-medium text-gray-900">{course.Expiry ? `${course.Expiry} ngày` : 'Vĩnh viễn'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-start gap-3 mb-1">
                                        <Icon name="star" className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-sm text-gray-500">Ưu đãi:</span>
                                            <span className="font-medium text-gray-900">{course.Sales ? `Giảm ${course.Sales}%` : 'Không có'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-6">Mục tiêu chương trình học</h3>
                                <ul className="space-y-4">
                                    {(course.Goal ? course.Goal.split(',') : (teacher?.Goal ? teacher.Goal.split(',') : [
                                        'Hệ thống toàn bộ kiến thức trong chương trình học từ cơ bản đến nâng cao',
                                        'Thành thạo mọi dạng bài tập trong các bài thi TN THPT, HSA, VACT',
                                        'Nâng cao kỹ năng làm bài với bộ đề chuẩn cấu trúc đề thi thật',
                                        'Rèn luyện tư duy giải quyết vấn đề nhanh và chính xác'
                                    ])).map(g => g.trim()).filter(Boolean).map((goal, idx) => {
                                        // Default fallback based on index to ensure diversity even without keyword match
                                        const fallbackIcons = ['book', 'file-text', 'bar-chart', 'star'];
                                        const fallbackColors = [
                                            'bg-blue-100 text-blue-600', 
                                            'bg-green-100 text-green-600', 
                                            'bg-orange-100 text-orange-600', 
                                            'bg-purple-100 text-purple-600'
                                        ];
                                        
                                        let iconName = fallbackIcons[idx % fallbackIcons.length];
                                        let colorClass = fallbackColors[idx % fallbackColors.length];
                                        
                                        const lowerGoal = goal.toLowerCase();
                                        if (lowerGoal.includes('kiến thức') || lowerGoal.includes('hệ thống') || lowerGoal.includes('lý thuyết')) {
                                            iconName = 'book';
                                            colorClass = 'bg-blue-100 text-blue-600';
                                        } else if (lowerGoal.includes('bài tập') || lowerGoal.includes('thành thạo') || lowerGoal.includes('luyện tập')) {
                                            iconName = 'file-text';
                                            colorClass = 'bg-green-100 text-green-600';
                                        } else if (lowerGoal.includes('đề thi') || lowerGoal.includes('kỹ năng') || lowerGoal.includes('chiến thuật')) {
                                            iconName = 'bar-chart';
                                            colorClass = 'bg-orange-100 text-orange-600';
                                        } else if (lowerGoal.includes('tư duy') || lowerGoal.includes('giải quyết') || lowerGoal.includes('sáng tạo')) {
                                            iconName = 'star';
                                            colorClass = 'bg-purple-100 text-purple-600';
                                        }

                                        return (
                                            <li key={idx} className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon name={iconName} className="w-5 h-5" />
                                                </div>
                                                <span className="text-gray-700 font-medium mt-2">{goal}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        {/* 2. Teacher Section */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Giáo viên</h2>
                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0 bg-gray-50 flex items-center justify-center relative">
                                    {teacher?.AvatarURL ? (
                                        <Image 
                                            src={convertGoogleDriveUrl(teacher.AvatarURL)} 
                                            alt={teacher['Tên tài khoản']} 
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Icon name="user" className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{teacher ? teacher['Tên tài khoản'] : course.Authors}</h3>
                                        <Icon name="check-circle" className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4">{teacher?.['Danh hiệu'] || 'Giảng viên cao cấp'}</p>
                                    
                                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                        {teacher?.['Thông tin mô tả'] || 'Giảng viên có nhiều năm kinh nghiệm trong việc giảng dạy và ôn thi.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Features / Experience Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Trải nghiệm nền tảng học tập toàn diện</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <FeatureCard 
                                    title="Video Học Thử + Livestream"
                                    items={['Học qua Sách ID kèm video bài giảng quay sẵn', 'Học qua Livestream trên web Moon.vn']}
                                    colorClass="bg-blue-50"
                                    iconColorClass="text-blue-600"
                                    iconName="play-circle"
                                />
                                <FeatureCard 
                                    title="Sách ID"
                                    items={['Nội dung và bài tập được tuyển chọn và kiểm duyệt', 'Hệ thống bài tập được xây dựng từ cơ bản đến nâng cao']}
                                    colorClass="bg-green-50"
                                    iconColorClass="text-green-600"
                                    iconName="book"
                                />
                                <FeatureCard 
                                    title="Thi Online"
                                    items={['Thi thử miễn phí, hướng dẫn giải ngay sau khi luyện', 'Đề thi cập nhật mới nhất theo form của Bộ GD&DT', 'Mô phỏng tương tự thi thật tới 99%']}
                                    colorClass="bg-orange-50"
                                    iconColorClass="text-orange-600"
                                    iconName="monitor"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FeatureCard 
                                    title="Tham gia nhóm và trao đổi trực tiếp với giáo viên"
                                    colorClass="bg-indigo-50"
                                    iconColorClass="text-indigo-600"
                                    iconName="users"
                                />
                                <FeatureCard 
                                    title="Được hỗ trợ trực tiếp từ đội ngũ MOD"
                                    colorClass="bg-cyan-50"
                                    iconColorClass="text-cyan-600"
                                    iconName="headphones"
                                />
                                <FeatureCard 
                                    title="Đánh giá mức độ chuyên cần"
                                    colorClass="bg-yellow-50"
                                    iconColorClass="text-yellow-600"
                                    iconName="bar-chart"
                                />
                            </div>
                        </div>

                        {/* 4. Syllabus Section (De cuong) */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đề cương</h2>
                            
                            <div className="flex justify-center gap-4 mb-8">
                                <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                    Đề cương
                                </button>
                                <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                    Bài mới
                                </button>
                                <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                    Lịch phát hành
                                </button>
                            </div>

                            {stageOrder.length > 0 ? (
                                <div className="space-y-0">
                                    {stageOrder.map((stageName, stageIndex) => (
                                        <div key={stageName} className="border-b border-gray-100 last:border-0">
                                            <div className="flex items-center justify-between py-5 cursor-pointer hover:bg-gray-50 transition-colors group">
                                                <h3 className="font-bold text-blue-600 uppercase text-sm group-hover:text-blue-800 pl-2">
                                                    {stageName}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                                        {groupedContent[stageName].length}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Always expanded for now as per image style which shows list */}
                                            <div className="pl-4 pb-4">
                                                {groupedContent[stageName].map((item, index) => (
                                                    <CourseContentItem 
                                                        key={item.ID} 
                                                        item={item} 
                                                        isUnlocked={isPurchased || course.Price === 0}
                                                        index={index}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Nội dung đang được cập nhật.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - STICKY SIDEBAR */}
                    <div className="lg:w-[380px] flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                            <h1 className="text-xl font-bold text-gray-900 mb-4 leading-snug">
                                {course.Title}
                            </h1>
                            
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-3xl font-extrabold text-red-600">
                                    {course.Price > 0 ? `${course.Price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                                </span>
                                {course.Price > 0 && (
                                    <span className="text-gray-400 line-through text-sm">
                                        {originalPrice.toLocaleString('vi-VN')}đ
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 mb-8">
                                {isPurchased ? (
                                    <button className="w-full py-3.5 bg-gray-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                        <Icon name="check-circle" className="w-5 h-5" />
                                        Đã sở hữu khóa học
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handlePurchase}
                                            disabled={isPurchasing}
                                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {isPurchasing ? 'Đang xử lý...' : 'Mua ngay'}
                                        </button>
                                        <button className="w-full py-3.5 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                                            Kích hoạt
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-900 mb-4 text-sm">Chương trình học này bao gồm:</h4>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        Lộ trình {stageOrder.length || 5} giai đoạn ôn luyện bài bản
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        Học qua livestream, tương tác trực tiếp cùng {course.Authors}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        Video bài giảng, kiến thức cập nhật liên tục
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        Kho bài tập + Bộ đề sát cấu trúc đề thi thật
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Deposit Modal */}
            {currentUser && (
                <DepositModal 
                    isOpen={isDepositModalOpen} 
                    onClose={() => setIsDepositModalOpen(false)} 
                    currentUser={currentUser} 
                    onSuccess={handleDepositSuccess}
                />
            )}
        </div>
    );
}