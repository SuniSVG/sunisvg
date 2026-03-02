'use client';

import React from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    FileText, 
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Shield,
    MessageCircle,
    Mail,
    FileCheck,
    Ban,
    HelpCircle
} from 'lucide-react';

export default function RefundPolicyPage() {
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
                                <FileText className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Chính sách Hoàn tiền</h1>
                            <p className="text-orange-100 text-lg max-w-xl mx-auto">
                                Cam kết bảo vệ quyền lợi khách hàng với chính sách hoàn tiền minh bạch và công bằng.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 space-y-10">
                        {/* Policy Overview */}
                        <div className="space-y-6">
                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 text-green-600 shadow-sm">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Khi nào được hoàn tiền?</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        SuniSVG cam kết hoàn tiền <strong>100%</strong> trong các trường hợp sau:
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>File SVG bị <strong>lỗi kỹ thuật</strong>, không mở được hoặc thiếu dữ liệu</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>Bị <strong>tính tiền trùng lặp</strong> cho cùng một đơn hàng</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>File nhận được <strong>không đúng</strong> với mô tả sản phẩm</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>Lỗi hệ thống dẫn đến <strong>trừ tiền sai</strong> hoặc không nhận được file</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 text-red-600 shadow-sm">
                                    <XCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Trường hợp KHÔNG được hoàn tiền</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Để đảm bảo công bằng, chúng tôi <strong>KHÔNG hoàn tiền</strong> trong các trường hợp:
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <span>Đã <strong>tải file thành công</strong> và file hoạt động bình thường</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <span><strong>Thay đổi ý định</strong> sau khi mua ("Tôi không thích nữa", "Tôi tìm được file khác rẻ hơn"...)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <span>Không biết cách <strong>sử dụng file SVG</strong> (chúng tôi sẽ hỗ trợ hướng dẫn miễn phí)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <span>Mua nhầm sản phẩm do <strong>không đọc kỹ mô tả</strong> trước khi thanh toán</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <span>Đã qua <strong>7 ngày</strong> kể từ ngày mua hàng</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Thời gian xử lý hoàn tiền</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Sau khi yêu cầu hoàn tiền được chấp thuận:
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <span>Tiền sẽ được hoàn lại vào <strong>Ví tài khoản</strong> của bạn trong vòng <strong>1-3 ngày làm việc</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <span>Bạn sẽ nhận được <strong>email thông báo</strong> khi hoàn tiền thành công</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <span>Có thể kiểm tra trạng thái trong mục <strong>Lịch sử giao dịch</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Refund Process */}
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-orange-500" />
                                Quy trình yêu cầu hoàn tiền
                            </h3>
                            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 1: Liên hệ bộ phận hỗ trợ</h4>
                                    <p className="text-sm text-gray-600">
                                        Gửi yêu cầu hoàn tiền qua email <strong>support@sunisvg.com</strong> hoặc chat trực tuyến. Cung cấp <strong>mã đơn hàng</strong> và <strong>lý do hoàn tiền</strong> cụ thể.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 2: Cung cấp bằng chứng</h4>
                                    <p className="text-sm text-gray-600">
                                        Nếu file bị lỗi, đính kèm <strong>ảnh chụp màn hình</strong> hoặc <strong>video</strong> minh họa lỗi. Điều này giúp chúng tôi xử lý nhanh hơn.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 3: Chờ xác minh</h4>
                                    <p className="text-sm text-gray-600">
                                        Đội ngũ kỹ thuật sẽ kiểm tra và xác minh thông tin trong vòng <strong>24-48 giờ</strong>. Bạn sẽ nhận được email thông báo kết quả.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 4: Nhận tiền hoàn lại</h4>
                                    <p className="text-sm text-gray-600">
                                        Sau khi được phê duyệt, tiền sẽ tự động chuyển về <strong>Ví tài khoản</strong> của bạn trong 1-3 ngày làm việc.
                                    </p>
                                </li>
                            </ol>
                        </div>

                        {/* Important Notices */}
                        <div className="space-y-4">
                            {/* Digital Product Notice */}
                            <div className="bg-yellow-50 rounded-2xl p-6 border-l-4 border-yellow-500">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                            Lưu ý về sản phẩm số
                                        </h4>
                                        <div className="space-y-2 text-sm text-yellow-800">
                                            <p className="flex items-start gap-2">
                                                <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    File SVG là <strong className="text-yellow-900">sản phẩm số</strong>, một khi đã tải xuống thành công và file hoạt động bình thường, sẽ <strong className="text-yellow-900">không được hoàn tiền</strong>.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Vui lòng <strong className="text-yellow-900">xem kỹ preview và mô tả sản phẩm</strong> trước khi quyết định mua để tránh mua nhầm.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 7-Day Policy */}
                            <div className="bg-orange-50 rounded-2xl p-6 border-l-4 border-orange-500">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <Clock className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-orange-900 mb-2">Thời hạn yêu cầu hoàn tiền</h4>
                                        <div className="space-y-2 text-sm text-orange-800">
                                            <p className="flex items-start gap-2">
                                                <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Mọi yêu cầu hoàn tiền phải được gửi trong vòng <strong className="text-orange-900">7 ngày</strong> kể từ ngày mua hàng.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Sau thời hạn này, chúng tôi <strong className="text-orange-900">không chấp nhận</strong> bất kỳ yêu cầu hoàn tiền nào trừ trường hợp đặc biệt.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Commitment */}
                            <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 mb-2">Cam kết của SuniSVG</h4>
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <p className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Chúng tôi cam kết xử lý <strong className="text-blue-900">công bằng, minh bạch</strong> mọi yêu cầu hoàn tiền hợp lệ.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Nếu có bất kỳ vấn đề nào về chất lượng file, chúng tôi sẽ <strong className="text-blue-900">sửa lỗi miễn phí</strong> hoặc hoàn tiền 100%.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>
                                                    Đội ngũ hỗ trợ luôn sẵn sàng <strong className="text-blue-900">hướng dẫn và giải đáp</strong> mọi thắc mắc của bạn.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Cần hỗ trợ về hoàn tiền?</h3>
                                <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                                    Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng hỗ trợ bạn xử lý yêu cầu hoàn tiền một cách nhanh chóng và thân thiện.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link 
                                        href="/support" 
                                        className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-200"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Chat với chúng tôi
                                    </Link>
                                    <a 
                                        href="mailto:support@sunisvg.com" 
                                        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-xl font-bold transition-colors border-2 border-gray-200"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Gửi email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}