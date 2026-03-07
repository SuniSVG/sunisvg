'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateStudyTime } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';

export const Tutorial = () => {
    const { currentUser, refreshCurrentUser } = useAuth();
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (currentUser) {
            // Logic: Kiểm tra nếu ngày cập nhật là mặc định (chứa '1899')
            const isNewUser = currentUser['Ngày cập nhật học'] && String(currentUser['Ngày cập nhật học']).includes('1899');
            
            // Logic Test: Kiểm tra trong sessionStorage xem đã hiện trong phiên này chưa
            // (Để đảm bảo ai cũng thấy 1 lần mỗi khi mở trình duyệt như bạn yêu cầu)
            const hasSeenSession = sessionStorage.getItem('hasSeenTutorial_v1');

            if (isNewUser || !hasSeenSession) {
                setIsVisible(true);
            }
        }
    }, [currentUser]);

    const handleComplete = async () => {
        setIsVisible(false);
        // Đánh dấu đã xem trong phiên này
        sessionStorage.setItem('hasSeenTutorial_v1', 'true');
        
        if (currentUser) {
            // Cập nhật thời gian học (cộng 1 phút) để hệ thống đổi ngày cập nhật -> hiện tại
            // Điều này đảm bảo lần sau vào sẽ không bị coi là user mới (1899) nữa
            try {
                await updateStudyTime(currentUser.Email, 1);
                // Làm mới thông tin user để UI cập nhật ngay lập tức
                await refreshCurrentUser({ silent: true });
            } catch (error) {
                console.error("Lỗi khi cập nhật trạng thái hướng dẫn:", error);
            }
        }
    };

    if (!isVisible) return null;

    const steps = [
        {
            title: "Chào mừng bạn đến với SuniSVG!",
            content: "Hệ thống học tập trực tuyến toàn diện. Hãy cùng điểm qua các tính năng nổi bật nhé!",
            icon: "star"
        },
        {
            title: "Kho khóa học đa dạng",
            content: "Truy cập hàng trăm bài giảng, tài liệu và đề thi chất lượng cao được cập nhật liên tục.",
            icon: "book"
        },
        {
            title: "Theo dõi tiến độ thông minh",
            content: "Hệ thống tự động ghi nhận thời gian học và kết quả để tối ưu lộ trình của riêng bạn.",
            icon: "bar-chart"
        }
    ];

    const currentStepData = steps[step];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 opacity-10" />
                
                <div className="p-8 text-center relative">
                    <div className="w-20 h-20 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
                        <Icon name={currentStepData.icon} className="w-10 h-10" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{currentStepData.title}</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">{currentStepData.content}</p>
                    
                    <div className="flex gap-2 justify-center mb-8">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2 rounded-full transition-all duration-500 ${idx === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`} 
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (step < steps.length - 1) {
                                setStep(step + 1);
                            } else {
                                handleComplete();
                            }
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                    >
                        {step < steps.length - 1 ? 'Tiếp tục' : 'Bắt đầu ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};
