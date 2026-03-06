'use client';

import React, { useState } from 'react';
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
    Facebook,
    Zap,
    Sparkles,
    TrendingUp,
    Users,
    Star,
    CheckCircle2,
    ArrowRight,
    X,
    Send
} from 'lucide-react';

export default function SupportPage() {
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    
    // Chat Widget State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{text: string, isUser: boolean}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleSendChat = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { text: userMsg, isUser: true }]);

        // Hiển thị trạng thái "đang nhập" hoặc loading giả
        setIsChatLoading(true);

        // Kéo dài thời gian đoạn chat giả (Simulation Delay)
        // Giữ trạng thái này lâu hơn để tạo cảm giác "đang xử lý" hoặc chờ server
        await new Promise(resolve => setTimeout(resolve, 3000));

        setChatMessages(prev => [...prev, { 
            text: "Cảm ơn bạn đã liên hệ. Nhân viên hỗ trợ sẽ phản hồi trong giây lát.", 
            isUser: false 
        }]);
        setIsChatLoading(false);
    };

    const popularTopics = [
        {
            icon: Gift,
            title: "Cách săn Mã Voucher & Giftcode",
            description: "Hướng dẫn nhận và sử dụng mã giảm giá hiệu quả",
            href: "/support/how-to-get-code",
            color: "orange",
            gradient: "from-orange-500 to-amber-500",
            badge: "Phổ biến"
        },
        {
            icon: CreditCard,
            title: "Phương thức thanh toán",
            description: "Các cách thanh toán an toàn được hỗ trợ",
            href: "/support/payment-methods",
            color: "blue",
            gradient: "from-blue-500 to-cyan-500",
            badge: "Mới"
        },
        {
            icon: ShoppingBag,
            title: "Quy trình mua hàng",
            description: "Hướng dẫn chi tiết đặt hàng và nhận sản phẩm",
            href: "/support/buying-process",
            color: "green",
            gradient: "from-green-500 to-emerald-500",
            badge: null
        },
        {
            icon: FileText,
            title: "Chính sách hoàn tiền",
            description: "Điều kiện và quy trình hoàn tiền nhanh chóng",
            href: "/support/refund-policy",
            color: "purple",
            gradient: "from-purple-500 to-pink-500",
            badge: null
        }
    ];

    const faqCategories = [
        {
            title: "Tài khoản & Đăng nhập",
            icon: Users,
            items: [
                { q: "Làm sao để đăng ký tài khoản?", isNew: false },
                { q: "Quên mật khẩu - phải làm gì?", isNew: false },
                { q: "Cách đổi thông tin cá nhân", isNew: true }
            ]
        },
        {
            title: "Đơn hàng & Giao hàng",
            icon: ShoppingBag,
            items: [
                { q: "Kiểm tra trạng thái đơn hàng", isNew: false },
                { q: "Thay đổi địa chỉ giao hàng", isNew: false },
                { q: "Thời gian giao hàng dự kiến", isNew: false }
            ]
        },
        {
            title: "Sản phẩm & File SVG",
            icon: FileText,
            items: [
                { q: "Cách tải file sau khi mua", isNew: false },
                { q: "File bị lỗi không mở được", isNew: true },
                { q: "Yêu cầu chỉnh sửa thiết kế", isNew: false }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section - Enhanced */}
            <div className="relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                        <div className="absolute top-0 -right-4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-20 h-20 border-2 border-white/20 rounded-2xl rotate-12 hidden lg:block"></div>
                <div className="absolute bottom-20 right-10 w-16 h-16 border-2 border-white/20 rounded-full hidden lg:block"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
                    <div className="text-center mb-14">
                        {/* Animated icon */}
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-3xl backdrop-blur-lg shadow-2xl mb-8 group hover:scale-110 transition-transform duration-500">
                            <div className="relative">
                                <HelpCircle className="w-12 h-12 text-white" />
                                <div className="absolute -top-1 -right-1">
                                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white">
                            <span className="inline-block animate-fade-in-up">Trung tâm</span>
                            <br />
                            <span className="inline-block animate-fade-in-up animation-delay-200 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                                Hỗ trợ
                            </span>
                        </h1>
                        
                        <p className="text-orange-50 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
                            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. 
                            <br className="hidden md:block" />
                            Tìm câu trả lời nhanh chóng hoặc liên hệ trực tiếp với đội ngũ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Popular Topics - Enhanced */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <TrendingUp className="w-4 h-4" />
                        Trending
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Chủ đề phổ biến
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Những câu hỏi được tìm kiếm nhiều nhất từ cộng đồng người dùng
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {popularTopics.map((topic, index) => {
                        const colorClasses = {
                            orange: "from-orange-500/10 to-amber-500/10 border-orange-200 group-hover:from-orange-500/20 group-hover:to-amber-500/20",
                            blue: "from-blue-500/10 to-cyan-500/10 border-blue-200 group-hover:from-blue-500/20 group-hover:to-cyan-500/20",
                            green: "from-green-500/10 to-emerald-500/10 border-green-200 group-hover:from-green-500/20 group-hover:to-emerald-500/20",
                            purple: "from-purple-500/10 to-pink-500/10 border-purple-200 group-hover:from-purple-500/20 group-hover:to-pink-500/20"
                        };

                        return (
                            <Link 
                                key={index}
                                href={topic.href}
                                className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl border-2 border-transparent transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                            >
                                {/* Gradient background on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[topic.color as keyof typeof colorClasses]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                
                                {/* Badge */}
                                {topic.badge && (
                                    <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        {topic.badge}
                                    </div>
                                )}

                                <div className="relative flex items-start gap-5">
                                    {/* Icon with gradient background */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${topic.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                        <topic.icon className="w-8 h-8 text-white" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                                            {topic.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed mb-4">
                                            {topic.description}
                                        </p>
                                        
                                        {/* CTA with arrow animation */}
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                            <span>Tìm hiểu thêm</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* FAQ Categories - Enhanced */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-y border-gray-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Câu hỏi thường gặp
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Tìm câu trả lời nhanh chóng cho các thắc mắc phổ biến
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {faqCategories.map((category, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                            >
                                {/* Category header with icon */}
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <category.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        {category.title}
                                    </h3>
                                </div>
                                
                                <ul className="space-y-4">
                                    {category.items.map((item, idx) => (
                                        <li key={idx}>
                                            <a 
                                                href="#" 
                                                className="flex items-start gap-3 group/item hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5 mt-0.5 text-gray-400 group-hover/item:text-orange-500 group-hover/item:translate-x-1 transition-all shrink-0" />
                                                <span className="text-gray-700 group-hover/item:text-gray-900 font-medium flex-1">
                                                    {item.q}
                                                </span>
                                                {item.isNew && (
                                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">
                                                        Mới
                                                    </span>
                                                )}
                                            </a>
                                        </li>
                                    ))}
                                </ul>

                                {/* View all link */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <a 
                                        href="#" 
                                        className="flex items-center justify-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors group/link"
                                    >
                                        <span>Xem tất cả</span>
                                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Section - Enhanced */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Liên hệ với chúng tôi
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Chọn phương thức liên hệ phù hợp nhất với bạn
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Chat Support - Enhanced */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black mb-3">Chat trực tuyến</h3>
                                <p className="text-blue-100 mb-6 leading-relaxed">
                                    Trò chuyện trực tiếp với đội ngũ hỗ trợ. Phản hồi trong vòng <span className="font-bold text-white">2 phút</span>.
                                </p>
                                <button 
                                    onClick={() => setIsChatOpen(true)}
                                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all w-full group/btn hover:scale-105"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Bắt đầu chat
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Email Support - Enhanced */}
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">Email hỗ trợ</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Gửi email cho chúng tôi, phản hồi trong <span className="font-bold text-gray-900">24 giờ</span>.
                        </p>
                        <a 
                            href="mailto:support@sunisvg.com" 
                            className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 transition-colors group/link bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100"
                        >
                            <span>support@sunisvg.com</span>
                            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    {/* Phone Support - Enhanced */}
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <Phone className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">Hotline</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Gọi điện trực tiếp cho đội ngũ tư vấn chuyên nghiệp.
                        </p>
                        <a 
                            href="tel:1900xxxx" 
                            className="inline-flex items-center gap-2 text-green-600 font-black hover:text-green-700 transition-colors text-2xl group/link bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100"
                        >
                            <span>1900 xxxx</span>
                            <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Working Hours & Social - Enhanced */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Working Hours */}
                        <div className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100 hover:shadow-2xl transition-all group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <Clock className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">Thời gian làm việc</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                                    <Zap className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
                                    <div>
                                        <div className="font-black text-gray-900 mb-1">Thứ 2 - Thứ 6</div>
                                        <div className="text-2xl font-black text-orange-600">8:00 - 22:00</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                                    <Zap className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                        <div className="font-black text-gray-900 mb-1">Thứ 7 - Chủ nhật</div>
                                        <div className="text-2xl font-black text-blue-600">9:00 - 20:00</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-10 text-white shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                        <Facebook className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-black">Kết nối với chúng tôi</h3>
                                </div>
                                <p className="text-blue-100 mb-6 text-lg leading-relaxed">
                                    Theo dõi fanpage để nhận thông tin mới nhất về sản phẩm, khuyến mãi độc quyền và sự kiện đặc biệt.
                                </p>
                                <a 
                                    href="#" 
                                    className="inline-flex items-center gap-3 bg-white text-blue-600 px-6 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all group/btn hover:scale-105 shadow-xl"
                                >
                                    <Facebook className="w-6 h-6" />
                                    <span>Ghé thăm Fanpage</span>
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fake Chat Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <span className="font-bold">Hỗ trợ trực tuyến</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4 min-h-[300px]">
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm text-sm">
                                    Xin chào! Tôi có thể giúp gì cho bạn hôm nay?
                                </div>
                            </div>
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm text-sm ${
                                        msg.isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-500 p-3 rounded-2xl rounded-tl-none text-xs animate-pulse">
                                        Đang nhập...
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Nhập tin nhắn..." 
                                className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition">
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom animations */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
                
                .animation-delay-200 {
                    animation-delay: 0.2s;
                    opacity: 0;
                }
                
                .animation-delay-400 {
                    animation-delay: 0.4s;
                    opacity: 0;
                }
                
                .animation-delay-600 {
                    animation-delay: 0.6s;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}