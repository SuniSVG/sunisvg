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
    fetchAccounts,
    getSharedCoursesInbox,
    useCreditForCourse
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

const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
};

const CourseContentItem = React.memo<{ 
    item: ScientificArticle; 
    isUnlocked: boolean; 
    index: number; 
    onPlay: (url: string) => void;
}>(({ item, isUnlocked, onPlay }) => {
    const isVideo = item.DocumentURL?.includes('youtube.com') || item.DocumentURL?.includes('youtu.be') || item.Title.toLowerCase().includes('video');

    if (isUnlocked) {
        return (
            <a 
                href={item.DocumentURL} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (isVideo) {
                        e.preventDefault();
                        onPlay(item.DocumentURL);
                    }
                }}
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
    const [isShared, setIsShared] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'syllabus' | 'newest' | 'schedule'>('syllabus');

    const [groupedContent, setGroupedContent] = useState<{ [key: string]: ScientificArticle[] }>({});
    const [stageOrder, setStageOrder] = useState<string[]>([]);

    // Helper: chuẩn hoá chuỗi để so sánh
    const cleanStr = (s: string) =>
        s.trim().replace(/\s*\((?:[\d.,]+\s*đ|Miễn phí|0\s*đ)\)$/i, '').trim().toLowerCase();

    // Helper: kiểm tra purchased từ danh sách + owned string
    const checkPurchased = (
        foundCourse: Course,
        purchasedItems: { CategoryName: string }[],
        ownedString?: string,
        sharedIds?: Set<string>
    ): { owned: boolean, shared: boolean } => {
        if (!foundCourse) return { owned: false, shared: false };

        const courseId = String(foundCourse.ID || '').trim();
        if (sharedIds && sharedIds.has(courseId)) {
            return { owned: true, shared: true };
        }

        const cleanCourseCategory = cleanStr(foundCourse.Category || '');
        const cleanCourseTitle = cleanStr(foundCourse.Title || '');
        
        const purchasedSet = new Set<string>();
        
        // From `Purchases` sheet
        purchasedItems.forEach(item => {
            if (item.CategoryName) purchasedSet.add(cleanStr(item.CategoryName));
        });

        // From `Owned` column in `Accounts` sheet
        if (ownedString) {
            ownedString.split(',').forEach(item => {
                if (item) purchasedSet.add(cleanStr(item));
            });
        }

        // Now check for ownership with priorities
        // 1. Exact ID match
        if (purchasedSet.has(courseId.toLowerCase())) {
            return { owned: true, shared: false };
        }
        // 2. Exact Category match
        if (cleanCourseCategory && purchasedSet.has(cleanCourseCategory)) {
            return { owned: true, shared: false };
        }
        // 3. Exact Title match (legacy)
        if (cleanCourseTitle && purchasedSet.has(cleanCourseTitle)) {
            return { owned: true, shared: false };
        }

        return { owned: false, shared: false };
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [courses, allArticles, purchasedCats, accounts, sharedInboxRes] = await Promise.all([
                    fetchCourses(),
                    fetchPremiumArticles(),
                    currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([]),
                    fetchAccounts(),
                    currentUser ? getSharedCoursesInbox(currentUser.Email) : Promise.resolve({ success: false, data: [] })
                ]);

                // Tìm course theo ID, fallback theo index
                let foundCourse = courses.find(c => String(c.ID) === String(params.id));
                if (!foundCourse) {
                    const index = parseInt(params.id as string);
                    if (!isNaN(index) && index >= 0 && index < courses.length) {
                        foundCourse = courses[index];
                    }
                }

                if (!foundCourse) {
                    addToast('Không tìm thấy khóa học.', 'error');
                    router.push('/courses');
                    return;
                }

                setCourse(foundCourse);

                // Lọc articles liên quan
                const relatedContent = allArticles.filter(
                    art =>
                        art.Category.trim().toLowerCase() === foundCourse!.Category.trim().toLowerCase() &&
                        art.Status === 'Approved'
                );
                setContentItems(relatedContent);

                // Tìm giáo viên
                if (foundCourse.MainTeacher) {
                    const foundTeacher = accounts.find(
                        acc => acc.Email.toLowerCase() === foundCourse!.MainTeacher?.toLowerCase()
                    );
                    setTeacher(foundTeacher || null);
                }

                // Group theo Part
                const groups: { [key: string]: ScientificArticle[] } = {};
                relatedContent.forEach(item => {
                    const path = item.Part?.trim() || 'Tài liệu chung';
                    if (!groups[path]) groups[path] = [];
                    groups[path].push(item);
                });

                const order = Object.keys(groups).sort((a, b) => {
                    if (a === 'Tài liệu chung') return 1;
                    if (b === 'Tài liệu chung') return -1;
                    return a.localeCompare(b, undefined, { numeric: true });
                });

                setGroupedContent(groups);
                setStageOrder(order);

                // SEO
                document.title = `${foundCourse.Title} - Tài liệu & Khóa học SuniSVG`;

                // Kiểm tra đã mua chưa
                if (currentUser) {
                    const sharedIds = new Set<string>();
                    if (sharedInboxRes.success && sharedInboxRes.data) {
                        sharedInboxRes.data.forEach((item: any) => {
                            const status = String(item.status || '').trim().toLowerCase();
                            if (status === 'accepted') {
                                const cId = String(item.courseId || item.CourseId || item.CourseID || '').trim();
                                if (cId) sharedIds.add(cId);
                            }
                        });
                    }

                    const { owned, shared } = checkPurchased(
                        foundCourse,
                        purchasedCats,
                        (currentUser as any)['Owned'],
                        sharedIds
                    );
                    setIsPurchased(owned);
                    setIsShared(shared);
                }
            } catch (error) {
                console.error('Error loading course details:', error);
                addToast('Có lỗi xảy ra khi tải dữ liệu.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]); // ✅ Chỉ chạy lại khi đổi trang, KHÔNG phụ thuộc currentUser

    const parseDate = (dateStr: string | undefined) => {
        if (!dateStr) return new Date(0);
        const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (parts) {
            return new Date(
                parseInt(parts[3]),
                parseInt(parts[2]) - 1,
                parseInt(parts[1]),
                parseInt(parts[4]),
                parseInt(parts[5]),
                parseInt(parts[6])
            );
        }
        return new Date(dateStr);
    };

    const newestContent = useMemo(() => {
        return [...contentItems].sort((a, b) =>
            parseDate((b as any).SubmissionDate).getTime() - parseDate((a as any).SubmissionDate).getTime()
        );
    }, [contentItems]);

    const scheduleContent = useMemo(() => {
        return [...contentItems].sort((a, b) =>
            parseDate((a as any).SubmissionDate).getTime() - parseDate((b as any).SubmissionDate).getTime()
        );
    }, [contentItems]);

    const handleActivate = async () => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để kích hoạt khóa học.', 'info');
            router.push('/login');
            return;
        }
        if (!course) return;

        const credits = currentUser.Credits_Left || 0;
        if (credits <= 0) {
            addToast('Bạn đã hết tín chỉ kích hoạt. Vui lòng mua thêm gói đăng ký.', 'error');
            return;
        }

        const confirmActivate = window.confirm(
            `Bạn có chắc chắn muốn dùng 1 tín chỉ để kích hoạt khóa học "${course.Title}"? (Còn lại: ${credits} tín chỉ)`
        );
        if (!confirmActivate) return;

        setIsPurchasing(true);
        try {
            const result = await useCreditForCourse(currentUser.Email, course.ID);
            if (result.success) {
                setIsPurchased(true);
                await refreshCurrentUser();
                addToast('Kích hoạt thành công! Bạn đã có thể truy cập toàn bộ nội dung.', 'success');
                setTimeout(() => window.location.reload(), 15000);
            } else {
                addToast(result.error || 'Kích hoạt thất bại.', 'error');
            }
        } catch (e: any) {
            addToast(e.message || 'Lỗi kết nối.', 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleBuyNow = async () => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để mua khóa học.', 'info');
            router.push('/login');
            return;
        }
        if (!course) return;

        if ((currentUser.Money || 0) < course.Price) {
            addToast('Số dư không đủ. Vui lòng nạp thêm tiền.', 'error');
            setIsDepositModalOpen(true);
            return;
        }

        const confirmPurchase = window.confirm(`Xác nhận mua khóa học "${course.Title}" với giá ${course.Price.toLocaleString()}đ?`);
        if (!confirmPurchase) return;

        setIsPurchasing(true);
        try {
            // Truyền tên danh mục thay vì ID để tương thích với action purchasePremiumCategory trên Google Apps Script
            const result = await purchasePremiumCategory(currentUser.Email, course.Category || course.Title);
            if (result.success) {
                setIsPurchased(true);
                await refreshCurrentUser();
                addToast('Mua khóa học thành công!', 'success');
                setTimeout(() => window.location.reload(), 15000);
            } else {
                addToast(result.error || 'Giao dịch thất bại.', 'error');
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleDepositSuccess = async () => {
        setIsDepositModalOpen(false);
        await refreshCurrentUser();
        addToast('Nạp tiền thành công! Vui lòng thử lại giao dịch.', 'success');
    };

    const originalPrice = useMemo(() => {
        if (!course) return 0;
        if (course.Sales) {
            const discountPercent = parseInt(course.Sales, 10);
            if (!isNaN(discountPercent) && discountPercent > 0) {
                return Math.round(course.Price / (1 - discountPercent / 100));
            }
        }
        return course.Price * 1.5;
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
                                alt={`Khóa học ${course.Title} - Tài liệu ôn thi HSG và Đại học`}
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
                    
                    {/* LEFT COLUMN */}
                    <div className="flex-1 min-w-0 space-y-8">
                        
                        {/* 1. Intro */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Giới thiệu khóa học {course.Title}</h1>
                            <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                                {course.Abstract || 'Chương trình học được thiết kế bài bản, bám sát cấu trúc đề thi, giúp học sinh nắm vững kiến thức từ cơ bản đến nâng cao. Vì 1 số lí do, sau khi mua xong vui lòng thoát ra đăng nhập lại để tránh lỗi hoặc kiểm tra email để lấy tài liệu'}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="flex items-start gap-3">
                                    <Icon name="user" className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="block text-sm text-gray-500">Đối tượng học:</span>
                                        <span className="font-medium text-gray-900">{course.For || 'Học sinh lớp 12, Ôn thi THPTQG'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Icon name="video" className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="block text-sm text-gray-500">Trạng thái:</span>
                                        <span className="font-medium text-gray-900">{course.Update || 'Đang cập nhật'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Icon name="calendar" className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="block text-sm text-gray-500">Hạn sử dụng:</span>
                                        <span className="font-medium text-gray-900">{course.Expiry ? `${course.Expiry} ngày` : 'Vĩnh viễn'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Icon name="star" className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="block text-sm text-gray-500">Ưu đãi:</span>
                                        <span className="font-medium text-gray-900">{course.Sales ? `Giảm ${course.Sales}%` : 'Không có'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h2 className="font-bold text-gray-900 mb-6 text-lg">Mục tiêu chương trình học</h2>
                                <ul className="space-y-4">
                                    {(course.Goal
                                        ? course.Goal.split(',')
                                        : teacher?.Goal
                                            ? teacher.Goal.split(',')
                                            : [
                                                'Hệ thống toàn bộ kiến thức trong chương trình học từ cơ bản đến nâng cao',
                                                'Thành thạo mọi dạng bài tập trong các bài thi TN THPT, HSA, VACT',
                                                'Nâng cao kỹ năng làm bài với bộ đề chuẩn cấu trúc đề thi thật',
                                                'Rèn luyện tư duy giải quyết vấn đề nhanh và chính xác'
                                            ]
                                    ).map(g => g.trim()).filter(Boolean).map((goal, idx) => {
                                        const fallbackIcons = ['book', 'file-text', 'bar-chart', 'star'];
                                        const fallbackColors = [
                                            'bg-blue-100 text-blue-600',
                                            'bg-green-100 text-green-600',
                                            'bg-orange-100 text-orange-600',
                                            'bg-purple-100 text-purple-600'
                                        ];
                                        let iconName  = fallbackIcons[idx % fallbackIcons.length];
                                        let colorClass = fallbackColors[idx % fallbackColors.length];
                                        const lowerGoal = goal.toLowerCase();
                                        if (lowerGoal.includes('kiến thức') || lowerGoal.includes('hệ thống') || lowerGoal.includes('lý thuyết')) {
                                            iconName = 'book'; colorClass = 'bg-blue-100 text-blue-600';
                                        } else if (lowerGoal.includes('bài tập') || lowerGoal.includes('thành thạo') || lowerGoal.includes('luyện tập')) {
                                            iconName = 'file-text'; colorClass = 'bg-green-100 text-green-600';
                                        } else if (lowerGoal.includes('đề thi') || lowerGoal.includes('kỹ năng') || lowerGoal.includes('chiến thuật')) {
                                            iconName = 'bar-chart'; colorClass = 'bg-orange-100 text-orange-600';
                                        } else if (lowerGoal.includes('tư duy') || lowerGoal.includes('giải quyết') || lowerGoal.includes('sáng tạo')) {
                                            iconName = 'star'; colorClass = 'bg-purple-100 text-purple-600';
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

                        {/* 2. Teacher */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin Giáo viên</h2>
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

                        {/* 3. Features */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Trải nghiệm nền tảng học tập toàn diện</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <FeatureCard title="Video Học Thử + Livestream" items={['Học qua Sách ID kèm video bài giảng quay sẵn', 'Học qua Livestream trên web sunisvg.netlify.app với tương tác trực tiếp cùng giáo viên']} colorClass="bg-blue-50" iconColorClass="text-blue-600" iconName="play-circle" />
                                <FeatureCard title="Tài liệu Ôn Tập Chọn Lọc" items={['Nội dung và bài tập được tuyển chọn và kiểm duyệt', 'Hệ thống bài tập được xây dựng từ cơ bản đến nâng cao', 'Lưu ý: Một số hệ thống tài liệu đang gặp trục trặc về hiển thị, đội ngũ đang khẩn trương khắc phục.']} colorClass="bg-green-50" iconColorClass="text-green-600" iconName="book" />
                                <FeatureCard title="Thi Online" items={['Thi thử miễn phí, hướng dẫn giải ngay sau khi luyện', 'Đề thi cập nhật mới nhất theo form của Bộ GD&DT', 'Mô phỏng tương tự thi thật tới 99%']} colorClass="bg-orange-50" iconColorClass="text-orange-600" iconName="monitor" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FeatureCard title="Tham gia nhóm và trao đổi trực tiếp với giáo viên" colorClass="bg-indigo-50" iconColorClass="text-indigo-600" iconName="users" />
                                <FeatureCard title="Được hỗ trợ trực tiếp từ đội ngũ MOD" colorClass="bg-cyan-50" iconColorClass="text-cyan-600" iconName="headphones" />
                                <FeatureCard title="Đánh giá mức độ chuyên cần" colorClass="bg-yellow-50" iconColorClass="text-yellow-600" iconName="bar-chart" />
                            </div>
                        </div>

                        {/* 4. Syllabus */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Trọn bộ tài liệu & bài giảng</h2>
                            
                            <div className="flex justify-center gap-4 mb-8">
                                {(['syllabus', 'newest', 'schedule'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2.5 font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {tab === 'syllabus' ? 'Đề cương' : tab === 'newest' ? 'Bài mới' : 'Lịch phát hành'}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'syllabus' && (
                                stageOrder.length > 0 ? (
                                    <div className="space-y-0">
                                        {stageOrder.map(stageName => (
                                            <div key={stageName} className="border-b border-gray-100 last:border-0">
                                                <div className="flex items-center justify-between py-5 cursor-pointer hover:bg-gray-50 transition-colors group">
                                                    <h3 className="font-bold text-blue-600 uppercase text-sm group-hover:text-blue-800 pl-2">
                                                        {stageName}
                                                    </h3>
                                                    <span className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                                        {groupedContent[stageName].length}
                                                    </span>
                                                </div>
                                                <div className="pl-4 pb-4">
                                                    {groupedContent[stageName].map((item, index) => (
                                                        <CourseContentItem key={item.ID} item={item} isUnlocked={isPurchased || course.Price === 0} index={index} onPlay={setPlayingVideo} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">Nội dung đang được cập nhật.</div>
                                )
                            )}

                            {activeTab === 'newest' && (
                                <div className="space-y-2">
                                    {newestContent.length > 0 ? (
                                        newestContent.map((item, index) => (
                                            <CourseContentItem key={item.ID} item={item} isUnlocked={isPurchased || course.Price === 0} index={index} onPlay={setPlayingVideo} />
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">Chưa có bài mới.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 py-4">
                                    {scheduleContent.length > 0 ? (
                                        scheduleContent.map((item, index) => (
                                            <div key={item.ID} className="relative pl-8">
                                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                                                <div className="text-sm text-gray-500 font-medium mb-1">
                                                    {(item as any).SubmissionDate || 'Đang cập nhật'}
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                                                    <h4 className="font-bold text-gray-900 mb-1">{item.Title}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.Abstract || 'Nội dung bài học...'}</p>
                                                    <CourseContentItem key={item.ID} item={item} isUnlocked={isPurchased || course.Price === 0} index={index} onPlay={setPlayingVideo} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 pl-8">Chưa có lịch phát hành.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Sticky Sidebar */}
                    <div className="lg:w-[380px] flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                            <div className="text-xl font-bold text-gray-900 mb-4 leading-snug">
                                {course.Title}
                            </div>
                            
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
                                        {isShared ? 'Được chia sẻ' : 'Đã sở hữu khóa học'}
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleBuyNow}
                                            disabled={isPurchasing}
                                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {isPurchasing ? 'Đang xử lý...' : 'Mua ngay'}
                                        </button>
                                        <button 
                                            onClick={handleActivate}
                                            disabled={isPurchasing}
                                            className="w-full py-3.5 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-70"
                                        >
                                            Kích hoạt (Combo)
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

            {/* Video Modal */}
            {playingVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPlayingVideo(null)}>
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPlayingVideo(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe 
                            src={getYoutubeEmbedUrl(playingVideo)} 
                            className="w-full h-full" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
}