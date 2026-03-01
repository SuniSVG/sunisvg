'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Chính sách & Điều khoản</h1>
                    <p className="text-gray-500">Cập nhật lần cuối: 01/01/2024</p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-600">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon name="shield-check" className="w-6 h-6 text-blue-600" />
                        1. Điều khoản sử dụng
                    </h2>
                    <p className="mb-6">
                        Chào mừng bạn đến với SuniSVG. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định tại đây. Chúng tôi có quyền thay đổi, chỉnh sửa, thêm hoặc lược bỏ bất kỳ phần nào trong Điều khoản sử dụng này vào bất cứ lúc nào.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon name="lock" className="w-6 h-6 text-green-600" />
                        2. Chính sách bảo mật
                    </h2>
                    <p className="mb-6">
                        Chúng tôi cam kết bảo mật thông tin cá nhân của bạn. Mọi thông tin bạn cung cấp sẽ chỉ được sử dụng để cải thiện chất lượng dịch vụ và hỗ trợ bạn trong quá trình học tập. Chúng tôi không chia sẻ thông tin của bạn với bên thứ ba trừ khi có sự đồng ý của bạn hoặc theo quy định của pháp luật.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon name="credit-card" className="w-6 h-6 text-orange-600" />
                        3. Chính sách thanh toán & hoàn tiền
                    </h2>
                    <p className="mb-6">
                        Các giao dịch thanh toán trên SuniSVG được thực hiện qua các cổng thanh toán an toàn. Trong trường hợp xảy ra lỗi giao dịch hoặc bạn không hài lòng với dịch vụ, vui lòng liên hệ với bộ phận hỗ trợ trong vòng 24 giờ để được giải quyết. Chính sách hoàn tiền sẽ được áp dụng tùy theo từng trường hợp cụ thể.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon name="book-open" className="w-6 h-6 text-purple-600" />
                        4. Quyền sở hữu trí tuệ
                    </h2>
                    <p className="mb-6">
                        Mọi nội dung trên website, bao gồm văn bản, hình ảnh, video, bài giảng, đều thuộc quyền sở hữu trí tuệ của SuniSVG. Nghiêm cấm mọi hành vi sao chép, phát tán hoặc sử dụng cho mục đích thương mại mà không có sự cho phép bằng văn bản của chúng tôi.
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm">
                        Nếu bạn có bất kỳ câu hỏi nào về Chính sách & Điều khoản, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@sunisvg.com" className="text-blue-600 hover:underline">support@sunisvg.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
