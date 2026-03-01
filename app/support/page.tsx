'use client';

import React from 'react';
import { Icon } from '@/components/shared/Icon';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Trung tâm hỗ trợ</h1>
                    <p className="text-gray-500">Chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Icon name="message-circle" className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chat trực tuyến</h3>
                        <p className="text-gray-600 mb-6">Trò chuyện trực tiếp với đội ngũ hỗ trợ của chúng tôi.</p>
                        <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-md w-full">
                            Bắt đầu chat
                        </button>
                    </div>

                    <div className="bg-green-50 p-8 rounded-2xl border border-green-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Icon name="phone" className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hotline hỗ trợ</h3>
                        <p className="text-gray-600 mb-6">Gọi ngay cho chúng tôi để được tư vấn nhanh nhất.</p>
                        <a href="tel:19001234" className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-colors shadow-md w-full block">
                            1900 1234
                        </a>
                    </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Icon name="help-circle" className="w-6 h-6 text-orange-500" />
                        Câu hỏi thường gặp
                    </h3>
                    <div className="space-y-4">
                        <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                Làm thế nào để kích hoạt khóa học?
                                <Icon name="chevron-down" className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                                Bạn có thể kích hoạt khóa học bằng cách nhập mã kích hoạt (gồm 10 ký tự) vào trang &quot;Kích hoạt Sách ID&quot;. Mã kích hoạt thường nằm ở mặt sau của sách hoặc được gửi qua email sau khi mua hàng.
                            </div>
                        </details>
                        <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                Tôi quên mật khẩu thì phải làm sao?
                                <Icon name="chevron-down" className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                                Bạn có thể sử dụng chức năng &quot;Quên mật khẩu&quot; tại trang đăng nhập. Hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu qua email đăng ký của bạn.
                            </div>
                        </details>
                        <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                Làm sao để tải tài liệu về máy?
                                <Icon name="chevron-down" className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                                Đối với các tài liệu miễn phí, bạn có thể tải trực tiếp. Đối với tài liệu Premium, bạn cần mua gói tài liệu tương ứng để có quyền truy cập và tải về.
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
