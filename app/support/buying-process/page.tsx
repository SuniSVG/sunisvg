'use client';

import React from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    ShoppingBag, 
    Search,
    ShoppingCart,
    Wallet,
    Download,
    CheckCircle2,
    AlertCircle,
    Star,
    Zap,
    Clock,
    FileCheck
} from 'lucide-react';

export default function BuyingProcessPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/support" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại Trung tâm hỗ trợ
                </Link>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-lg">
                                <ShoppingBag className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Quy trình Mua hàng</h1>
                            <p className="text-orange-100 text-lg max-w-xl mx-auto">
                                Mua sắm file SVG trực tuyến dễ dàng, thanh toán qua tài khoản và tải file ngay lập tức.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 space-y-10">
                        {/* How It Works */}
                        <div className="space-y-6">
                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                                    <Search className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Tìm kiếm & Chọn sản phẩm</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Duyệt qua hàng nghìn mẫu SVG chất lượng cao hoặc sử dụng thanh tìm kiếm để tìm thiết kế phù hợp. Xem trước chi tiết, kích thước và thông tin file trước khi quyết định.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                                        <Star className="w-4 h-4" />
                                        Hơn 10,000+ mẫu thiết kế
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 text-purple-600 shadow-sm">
                                    <ShoppingCart className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Thêm vào giỏ hàng</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Nhấn nút <strong>"Thêm vào giỏ"</strong> để lưu sản phẩm yêu thích. Bạn có thể tiếp tục mua sắm và thêm nhiều file khác nhau trước khi thanh toán để được giá tốt hơn.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium">
                                        <Zap className="w-4 h-4" />
                                        Mua nhiều - Giảm giá nhiều
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 text-green-600 shadow-sm">
                                    <Wallet className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Thanh toán qua Ví tài khoản</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Vào giỏ hàng, kiểm tra lại sản phẩm và nhấn <strong>"Thanh toán"</strong>. Hệ thống sẽ tự động <strong>trừ tiền từ số dư trong tài khoản</strong> của bạn. Nhanh chóng, an toàn và không cần nhập thông tin mỗi lần mua.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Thanh toán tức thì
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 text-orange-600 shadow-sm">
                                    <Download className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">4. Tải file SVG ngay lập tức</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Sau khi thanh toán thành công, bạn có thể tải file SVG xuống ngay. File cũng được lưu trong mục <strong>"Đơn hàng của tôi"</strong> để bạn tải lại bất cứ lúc nào.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-medium">
                                        <Clock className="w-4 h-4" />
                                        Tải không giới hạn
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step-by-step Instructions */}
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-orange-500" />
                                Hướng dẫn chi tiết từng bước
                            </h3>
                            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 1: Đảm bảo đã có số dư</h4>
                                    <p className="text-sm text-gray-600">
                                        Kiểm tra số dư trong ví tài khoản. Nếu chưa đủ, hãy <Link href="/support/payment-methods" className="text-orange-600 font-bold hover:underline">nạp tiền vào tài khoản</Link> trước khi mua hàng.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 2: Chọn file SVG yêu thích</h4>
                                    <p className="text-sm text-gray-600">
                                        Tìm kiếm hoặc duyệt danh mục, nhấn vào file để xem chi tiết. Kiểm tra preview, kích thước và giá trước khi quyết định mua.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 3: Thêm vào giỏ hàng</h4>
                                    <p className="text-sm text-gray-600">
                                        Nhấn <strong>"Thêm vào giỏ hàng"</strong>. Icon giỏ hàng ở góc trên sẽ hiển thị số lượng sản phẩm đã chọn.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 4: Vào giỏ hàng & Xác nhận</h4>
                                    <p className="text-sm text-gray-600">
                                        Click vào icon giỏ hàng để xem lại các sản phẩm. Kiểm tra tổng tiền, áp dụng mã giảm giá (nếu có) rồi nhấn <strong>"Thanh toán"</strong>.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 5: Hệ thống tự động trừ tiền</h4>
                                    <p className="text-sm text-gray-600">
                                        Sau khi xác nhận, hệ thống sẽ <strong>tự động trừ tiền từ số dư tài khoản</strong> của bạn. Bạn sẽ nhận được thông báo thanh toán thành công.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 6: Tải file về máy</h4>
                                    <p className="text-sm text-gray-600">
                                        Nhấn nút <strong>"Tải xuống"</strong> để lưu file SVG về máy tính. File cũng được lưu trong mục <strong>Đơn hàng của tôi</strong> để tải lại sau này.
                                    </p>
                                </li>
                            </ol>
                        </div>

                        {/* Important Notes */}
                        <div className="space-y-4">
                            {/* Balance Warning */}
                            <div className="bg-yellow-50 rounded-2xl p-6 border-l-4 border-yellow-500">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-yellow-900 mb-2">Lưu ý về số dư tài khoản</h4>
                                        <div className="space-y-2 text-sm text-yellow-800">
                                            <p className="flex items-start gap-2">
                                                <Wallet className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Đảm bảo <strong className="text-yellow-900">số dư trong tài khoản đủ</strong> để thanh toán. Nếu không đủ, giao dịch sẽ bị từ chối.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Sau khi mua, số dư sẽ được <strong className="text-yellow-900">cập nhật ngay lập tức</strong>. Bạn có thể kiểm tra lịch sử giao dịch trong mục <strong>Ví của tôi</strong>.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* File Access Info */}
                            <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <FileCheck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 mb-2">Quyền sở hữu file vĩnh viễn</h4>
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <p className="flex items-start gap-2">
                                                <Download className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Sau khi mua, bạn có quyền <strong className="text-blue-900">tải xuống không giới hạn số lần</strong> và sử dụng file cho các dự án cá nhân hoặc thương mại.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    File được lưu trữ trong tài khoản của bạn <strong className="text-blue-900">vĩnh viễn</strong>. Truy cập mọi lúc mọi nơi khi cần.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Support CTA */}
                        <div className="text-center pt-4">
                            <p className="text-gray-600 mb-4">Gặp vấn đề trong quá trình mua hàng?</p>
                            <Link 
                                href="/support" 
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-200"
                            >
                                Liên hệ hỗ trợ ngay
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}