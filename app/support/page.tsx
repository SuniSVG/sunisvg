'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Search, 
    Gift, 
    CreditCard, 
    ShoppingBag, 
    HelpCircle, 
    FileText, 
    Phone, 
    Mail,
    MessageCircle,
    ChevronRight,
    Clock,
    MapPin,
    Facebook,
    Zap
} from 'lucide-react';

export default function SupportPage() {
    const popularTopics = [
        {
            icon: Gift,
            title: "Cách săn Mã Voucher & Giftcode",
            description: "Hướng dẫn nhận và sử dụng mã giảm giá",
            href: "/support/how-to-get-code",
            color: "orange"
        },
        {
            icon: CreditCard,
            title: "Phương thức thanh toán",
            description: "Các cách thanh toán được hỗ trợ",
            href: "/support/payment-methods",
            color: "blue"
        },
        {
            icon: ShoppingBag,
            title: "Quy trình mua hàng",
            description: "Hướng dẫn đặt hàng và nhận sản phẩm",
            href: "/support/buying-process",
            color: "green"
        },
        {
            icon: FileText,
            title: "Chính sách hoàn tiền",
            description: "Điều kiện và quy trình hoàn tiền",
            href: "/support/refund-policy",
            color: "purple"
        }
    ];

    const faqCategories = [
        {
            title: "Tài khoản & Đăng nhập",
            items: [
                "Làm sao để đăng ký tài khoản?",
                "Quên mật khẩu - phải làm gì?",
                "Cách đổi thông tin cá nhân"
            ]
        },
        {
            title: "Đơn hàng & Giao hàng",
            items: [
                "Kiểm tra trạng thái đơn hàng",
                "Thay đổi địa chỉ giao hàng",
                "Thời gian giao hàng dự kiến"
            ]
        },
        {
            title: "Sản phẩm & File SVG",
            items: [
                "Cách tải file sau khi mua",
                "File bị lỗi không mở được",
                "Yêu cầu chỉnh sửa thiết kế"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-lg">
                            <HelpCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Trung tâm Hỗ trợ
                        </h1>
                        <p className="text-orange-100 text-lg md:text-xl max-w-2xl mx-auto">
                            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Tìm câu trả lời nhanh chóng hoặc liên hệ trực tiếp với đội ngũ của chúng tôi.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm câu hỏi, hướng dẫn..."
                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange-300/50 transition-all text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Topics */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Chủ đề phổ biến</h2>
                    <p className="text-gray-600">Những câu hỏi được tìm kiếm nhiều nhất</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {popularTopics.map((topic, index) => {
                        const colorClasses: Record<string, string> = {
                            orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
                            blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                            green: "bg-green-50 text-green-600 group-hover:bg-green-100",
                            purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                        };

                        return (
                            <Link 
                                key={index}
                                href={topic.href}
                                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${colorClasses[topic.color]}`}>
                                        <topic.icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                                            {topic.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {topic.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* FAQ Categories */}
            <div className="bg-white border-y border-gray-200 py-12 md:py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Câu hỏi thường gặp</h2>
                        <p className="text-gray-600">Tìm câu trả lời cho các thắc mắc phổ biến</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {faqCategories.map((category, index) => (
                            <div key={index} className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {category.title}
                                </h3>
                                <ul className="space-y-3">
                                    {category.items.map((item, idx) => (
                                        <li key={idx}>
                                            <a 
                                                href="#" 
                                                className="text-gray-600 hover:text-orange-600 transition-colors flex items-start gap-2 group"
                                            >
                                                <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
                                                <span className="text-sm">{item}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Liên hệ với chúng tôi</h2>
                    <p className="text-gray-600">Chọn phương thức liên hệ phù hợp với bạn</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Chat Support */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <MessageCircle className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Chat trực tuyến</h3>
                        <p className="text-blue-100 mb-6 leading-relaxed">
                            Trò chuyện trực tiếp với đội ngũ hỗ trợ. Phản hồi trong vòng 2 phút.
                        </p>
                        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors w-full">
                            Bắt đầu chat
                        </button>
                    </div>

                    {/* Email Support */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                            <Mail className="w-7 h-7 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Email hỗ trợ</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Gửi email cho chúng tôi, phản hồi trong 24h.
                        </p>
                        <a href="mailto:support@sunisvg.com" className="text-purple-600 font-bold hover:underline flex items-center gap-2">
                            support@sunisvg.com
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Phone Support */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                            <Phone className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Hotline</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Gọi điện trực tiếp cho đội ngũ tư vấn.
                        </p>
                        <a href="tel:1900xxxx" className="text-green-600 font-bold hover:underline flex items-center gap-2 text-xl">
                            1900 xxxx
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Working Hours & Social */}
            <div className="bg-gray-100 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Working Hours */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Thời gian làm việc</h3>
                            </div>
                            <div className="space-y-3 text-gray-600">
                                <p className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <span><strong className="text-gray-900">Thứ 2 - Thứ 6:</strong> 8:00 - 22:00</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <span><strong className="text-gray-900">Thứ 7 - Chủ nhật:</strong> 9:00 - 20:00</span>
                                </p>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Facebook className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Kết nối với chúng tôi</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Theo dõi fanpage để nhận thông tin mới nhất về sản phẩm, khuyến mãi và sự kiện.
                            </p>
                            <a 
                                href="#" 
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Facebook className="w-5 h-5" />
                                Ghé thăm Fanpage
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}