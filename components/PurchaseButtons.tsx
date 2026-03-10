// GỢI Ý: Tạo file mới tại e:\NEW\app\courses\[id]\PurchaseButtons.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { purchaseCourse, useCreditForCourse } from '@/services/googleSheetService';
import type { Course } from '@/types';
import { CreditCard, Zap, Loader2 } from 'lucide-react';

interface PurchaseButtonsProps {
    course: Course;
    purchasedCourses: { CourseID: string }[]; // Giả sử bạn có danh sách khóa học đã mua
}

export default function PurchaseButtons({ course, purchasedCourses }: PurchaseButtonsProps) {
    const { currentUser, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();
    const [isBuying, setIsBuying] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const isPurchased = useMemo(() => {
        // Bạn cần có logic để lấy danh sách khóa học đã mua của user
        // Ví dụ: return purchasedCourses.some(p => p.CourseID === course.ID);
        return false; 
    }, [course.ID]);

    const canUseCredit = (currentUser?.Credits_Left || 0) > 0;

    const handleBuyNow = async () => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để mua khóa học.', 'info');
            return;
        }
        if ((currentUser.Money || 0) < course.Price) {
            addToast('Số dư không đủ. Vui lòng nạp thêm tiền.', 'error');
            return;
        }
        if (!window.confirm(`Xác nhận mua khóa học "${course.Title}" với giá ${course.Price.toLocaleString()}đ?`)) return;

        setIsBuying(true);
        try {
            const result = await purchaseCourse(currentUser.Email, course.ID);
            if (result.success) {
                addToast('Mua khóa học thành công!', 'success');
                if (refreshCurrentUser) refreshCurrentUser(); // Cập nhật số dư và danh sách khóa học
                // Bạn cần có logic để refresh lại `purchasedCourses` ở trang cha
            } else {
                addToast(result.error || 'Giao dịch thất bại.', 'error');
            }
        } catch (error: any) {
            addToast(error.message || 'Lỗi kết nối.', 'error');
        } finally {
            setIsBuying(false);
        }
    };

    const handleActivateWithCredit = async () => {
        if (!currentUser || !canUseCredit) {
            addToast('Bạn không có đủ credit để kích hoạt.', 'error');
            return;
        }
        if (!window.confirm(`Xác nhận dùng 1 credit để kích hoạt khóa học "${course.Title}"?`)) return;

        setIsActivating(true);
        try {
            const result = await useCreditForCourse(currentUser.Email, course.ID);
            if (result.success) {
                addToast('Kích hoạt khóa học thành công!', 'success');
                if (refreshCurrentUser) refreshCurrentUser(); // Cập nhật số credit và danh sách khóa học
                // Bạn cần có logic để refresh lại `purchasedCourses` ở trang cha
            } else {
                addToast(result.error || 'Kích hoạt thất bại. Khóa học có thể không nằm trong gói của bạn.', 'error');
            }
        } catch (error: any) {
            addToast(error.message || 'Lỗi kết nối.', 'error');
        } finally {
            setIsActivating(false);
        }
    };

    if (isPurchased) {
        return (
            <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg font-bold text-center">
                Bạn đã sở hữu khóa học này.
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-4">
            {/* Nút Kích hoạt bằng Credit */}
            <button
                onClick={handleActivateWithCredit}
                disabled={!canUseCredit || isActivating || isBuying}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isActivating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                <div>
                    <p className="text-lg">Kích hoạt bằng Combo</p>
                    <p className="text-xs font-normal">Còn lại: {currentUser?.Credits_Left || 0} lượt</p>
                </div>
            </button>

            {/* Nút Mua ngay bằng tiền */}
            <button
                onClick={handleBuyNow}
                disabled={isActivating || isBuying}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
                {isBuying ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                <div>
                    <p className="text-lg">Mua ngay</p>
                    <p className="text-xs font-normal">{course.Price.toLocaleString()} đ</p>
                </div>
            </button>
        </div>
    );
}