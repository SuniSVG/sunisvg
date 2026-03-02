'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift, Facebook, Globe, Star, CheckCircle2 } from 'lucide-react';

export default function HowToGetCodePage() {
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
                                <Gift className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Cách săn Mã Voucher & Giftcode</h1>
                            <p className="text-orange-100 text-lg max-w-xl mx-auto">
                                SuniSVG thường xuyên tung ra các mã giảm giá và quà tặng giá trị. Dưới đây là bí kíp để bạn không bỏ lỡ!
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 space-y-10">
                        {/* Methods */}
                        <div className="space-y-6">
                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                                    <Facebook className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Theo dõi Fanpage chính thức</h3>
                                    <p className="text-gray-600 leading-relaxed mb-3">
                                        Chúng tôi thường xuyên tổ chức các minigame, sự kiện livestream tặng mã code giới hạn trên Fanpage Facebook. Hãy bật chế độ "Yêu thích" để nhận thông báo sớm nhất.
                                    </p>
                                    <a href="#" className="inline-flex items-center text-blue-600 font-bold hover:underline">
                                        Ghé thăm Fanpage <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                    </a>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 text-purple-600 shadow-sm">
                                    <Star className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Sự kiện & Ngày lễ lớn</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Vào các dịp lễ (Tết, Quốc khánh...) hoặc ngày đôi (9/9, 10/10), SuniSVG sẽ tung ra mã giảm giá toàn sàn. Mã thường xuất hiện trên banner trang chủ hoặc popup thông báo.
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            <div className="flex gap-5 items-start">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 text-green-600 shadow-sm">
                                    <Globe className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Đối tác & Cộng đồng</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Tham gia các group học tập của SuniSVG hoặc theo dõi các đối tác giáo dục (KOLs, thầy cô giáo) để nhận mã code độc quyền dành riêng cho cộng đồng.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Instruction Box */}
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-orange-500" />
                                Hướng dẫn nhập mã
                            </h3>
                            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 1: Copy mã</h4>
                                    <p className="text-sm text-gray-600">Sao chép mã code bạn nhận được (ví dụ: <code className="bg-white px-1 py-0.5 rounded border border-gray-200 font-mono text-orange-600">SUNISVG2025</code>).</p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 2: Truy cập Kho Voucher</h4>
                                    <p className="text-sm text-gray-600">
                                        Vào trang <Link href="/vouchers" className="text-orange-600 font-bold hover:underline">Kho Voucher</Link> từ menu tài khoản.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 3: Nhập và Áp dụng</h4>
                                    <p className="text-sm text-gray-600">
                                        Dán mã vào ô <strong>"Nhập mã voucher"</strong> ở cuối trang và nhấn <strong>Áp dụng</strong>.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-[9px] top-0 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-gray-50">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </span>
                                    <h4 className="font-bold text-gray-900 mb-1">Bước 4: Kích hoạt</h4>
                                    <p className="text-sm text-gray-600">
                                        Sau khi mã hiện trong danh sách, nhấn nút <strong>Kích hoạt</strong> trên thẻ voucher để cộng tiền hoặc nhận ưu đãi.
                                    </p>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
