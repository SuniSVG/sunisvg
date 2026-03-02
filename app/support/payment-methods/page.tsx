'use client';

import React from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    CreditCard, 
    Smartphone, 
    Landmark,
    Zap,
    ShieldCheck,
    RefreshCw,
    LogOut,
    AlertCircle,
    Gift,
    Crown,
    TrendingUp
} from 'lucide-react';

export default function PaymentMethodsPage() {
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
                                <CreditCard className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Phương thức Thanh toán</h1>
                            <p className="text-orange-100 text-lg max-w-xl mx-auto">
                                Nạp tiền vào tài khoản để mua sắm dễ dàng và nhận nhiều ưu đãi hấp dẫn từ SuniSVG.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 space-y-10">
                        {/* Payment Methods */}
                        <div className="space-y-6">
                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                                    <Landmark className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Chuyển khoản ngân hàng</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Chuyển khoản trực tiếp qua Internet Banking hoặc ứng dụng ngân hàng. Hỗ trợ tất cả các ngân hàng tại Việt Nam (Vietcombank, VietinBank, BIDV, Techcombank, MB Bank...).
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                                        <ShieldCheck className="w-4 h-4" />
                                        Bảo mật cao, xử lý tự động
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 text-purple-600 shadow-sm">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Ví điện tử</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Thanh toán nhanh chóng qua các ví điện tử phổ biến: MoMo, ZaloPay, VNPay, ShopeePay. Quét mã QR hoặc liên kết ví để nạp tiền tức thì.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium">
                                        <Zap className="w-4 h-4" />
                                        Nhanh chóng, tiện lợi
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 text-green-600 shadow-sm">
                                    <CreditCard className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Thẻ ATM / Thẻ tín dụng</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Thanh toán trực tiếp bằng thẻ ATM nội địa hoặc thẻ tín dụng quốc tế (Visa, Mastercard, JCB). Giao dịch được mã hóa và bảo mật tuyệt đối.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                                        <ShieldCheck className="w-4 h-4" />
                                        Quốc tế, đa dạng
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 md:p-8 border border-orange-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Gift className="w-6 h-6 text-orange-500" />
                                Lợi ích khi nạp tiền
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                                        <Zap className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-sm">Thanh toán nhanh</h4>
                                    <p className="text-xs text-gray-600">Không cần nhập thông tin mỗi lần mua hàng</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                        <Crown className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-sm">Ưu đãi độc quyền</h4>
                                    <p className="text-xs text-gray-600">Nhận voucher và khuyến mãi đặc biệt</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-sm">Tích điểm thưởng</h4>
                                    <p className="text-xs text-gray-600">Mỗi giao dịch đều được tích điểm</p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-orange-500" />
                                Hướng dẫn nạp tiền
                            </h3>
                            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 1: Truy cập trang Nạp tiền</h4>
                                    <p className="text-sm text-gray-600">
                                        Đăng nhập vào tài khoản, vào menu <strong>Tài khoản</strong> → <strong>Nạp tiền</strong> hoặc nhấn vào số dư ví ở góc phải màn hình.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 2: Chọn phương thức & số tiền</h4>
                                    <p className="text-sm text-gray-600">
                                        Chọn phương thức thanh toán phù hợp và nhập số tiền cần nạp (tối thiểu <code className="bg-white px-1 py-0.5 rounded border border-gray-200 font-mono text-orange-600">50.000đ</code>).
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 3: Hoàn tất thanh toán</h4>
                                    <p className="text-sm text-gray-600">
                                        Làm theo hướng dẫn của cổng thanh toán để hoàn tất giao dịch. Thời gian xử lý từ <strong>1-5 phút</strong>.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 4: Kiểm tra số dư</h4>
                                    <p className="text-sm text-gray-600">
                                        Sau khi nạp thành công, số dư sẽ tự động cập nhật vào ví của bạn và bạn có thể bắt đầu mua sắm ngay!
                                    </p>
                                </li>
                            </ol>
                        </div>

                        {/* Important Notice */}
                        <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                            <div className="flex gap-4">
                                <div className="shrink-0">
                                    <AlertCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                        Lưu ý quan trọng
                                    </h4>
                                    <div className="space-y-2 text-sm text-blue-800">
                                        <p className="flex items-start gap-2">
                                            <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Nếu sau khi nạp tiền mà số dư <strong>chưa cập nhật ngay</strong>, hãy thử <strong className="text-blue-900">refresh trang (F5)</strong> hoặc <strong className="text-blue-900">đăng xuất rồi đăng nhập lại</strong> để hệ thống cập nhật.
                                            </span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <LogOut className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Nếu sau 10 phút vẫn chưa thấy tiền vào tài khoản, vui lòng liên hệ <strong className="text-blue-900">Hỗ trợ khách hàng</strong> kèm theo mã giao dịch để được xử lý nhanh chóng.
                                            </span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Mọi giao dịch đều được <strong className="text-blue-900">mã hóa và bảo mật</strong> theo tiêu chuẩn quốc tế. Thông tin thanh toán của bạn luôn được bảo vệ tuyệt đối.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Support CTA */}
                        <div className="text-center pt-4">
                            <p className="text-gray-600 mb-4">Cần hỗ trợ thêm về thanh toán?</p>
                            <Link 
                                href="/support" 
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-200"
                            >
                                Liên hệ hỗ trợ
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}