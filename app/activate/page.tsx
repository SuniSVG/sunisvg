'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function ActivatePage() {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock success/failure
        if (code.length === 10) {
            addToast('Kích hoạt sách thành công!', 'success');
            setCode('');
        } else {
            addToast('Mã kích hoạt không hợp lệ. Vui lòng kiểm tra lại.', 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-orange-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-400/20 to-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-300/10 to-orange-300/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md mx-auto relative">
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 hover:shadow-emerald-200/50 transition-all duration-500">
                    {/* Header Section with Gradient */}
                    <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-orange-500 p-8 text-center overflow-hidden">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '32px 32px'
                            }}></div>
                        </div>
                        
                        {/* Icon Container with Animation */}
                        <div className="relative w-20 h-20 mx-auto mb-4 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"></div>
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                                <Icon name="key" className="w-10 h-10 text-white drop-shadow-lg" />
                            </div>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                            Kích hoạt Sách ID
                        </h1>
                        <p className="text-white/90 text-sm leading-relaxed max-w-xs mx-auto">
                            Nhập mã cào phía sau sách để kích hoạt khóa học và tài liệu của bạn
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="p-8">
                        <form onSubmit={handleActivate} className="space-y-6">
                            <div>
                                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-orange-500 rounded-full"></span>
                                    Mã kích hoạt (10 ký tự)
                                </label>
                                
                                <div className="relative group">
                                    <input
                                        type="text"
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        className={`block w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 text-center font-mono text-xl tracking-widest uppercase placeholder-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-emerald-50 hover:to-orange-50 ${
                                            isFocused 
                                                ? 'border-emerald-500 shadow-lg shadow-emerald-200/50 from-emerald-50 to-orange-50' 
                                                : 'border-gray-200 shadow-md'
                                        }`}
                                        placeholder="XXXXXXXXXX"
                                        maxLength={10}
                                        required
                                    />
                                    
                                    {/* Lock Icon */}
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                                            isFocused 
                                                ? 'bg-gradient-to-br from-emerald-100 to-orange-100' 
                                                : 'bg-gray-100'
                                        }`}>
                                            <Icon name="lock" className={`h-5 w-5 transition-colors duration-300 ${
                                                isFocused ? 'text-emerald-600' : 'text-gray-400'
                                            }`} />
                                        </div>
                                    </div>
                                    
                                    {/* Progress Indicator */}
                                    <div className="mt-2 flex gap-1 justify-center">
                                        {[...Array(10)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 w-6 rounded-full transition-all duration-300 ${
                                                    i < code.length
                                                        ? 'bg-gradient-to-r from-emerald-500 to-orange-500'
                                                        : 'bg-gray-200'
                                                }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || code.length === 0}
                                className="relative w-full group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-orange-600 group-hover:from-emerald-500 group-hover:via-green-500 group-hover:to-orange-500 transition-all duration-300"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <span className="relative flex items-center justify-center gap-2 py-4 px-4 text-base font-bold text-white">
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang kiểm tra...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="key" className="w-5 h-5" />
                                            Kích hoạt ngay
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Instructions Section */}
                        <div className="mt-8 bg-gradient-to-br from-emerald-50 via-green-50 to-orange-50 rounded-2xl p-6 border border-emerald-100/50">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-orange-500 rounded-lg flex items-center justify-center">
                                    <Icon name="info" className="w-4 h-4 text-white" />
                                </div>
                                Hướng dẫn kích hoạt
                            </h3>
                            <ul className="space-y-4 text-sm text-gray-700">
                                <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform duration-200">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
                                        1
                                    </div>
                                    <span className="pt-0.5 leading-relaxed">
                                        Cào nhẹ lớp tráng bạc phía sau bìa sách để lấy mã kích hoạt.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform duration-200">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
                                        2
                                    </div>
                                    <span className="pt-0.5 leading-relaxed">
                                        Nhập chính xác mã gồm 10 ký tự vào ô bên trên.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform duration-200">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
                                        3
                                    </div>
                                    <span className="pt-0.5 leading-relaxed">
                                        Nhấn &quot;Kích hoạt ngay&quot; và bắt đầu học tập ngay lập tức.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                                <Icon name="shield" className="w-4 h-4 text-emerald-500" />
                                Mã kích hoạt được bảo mật và chỉ sử dụng một lần
                            </p>
                        </div>
                    </div>
                </div>

                {/* Support Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Cần hỗ trợ?{' '}
                        <a href="#" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-orange-600 hover:from-emerald-500 hover:to-orange-500 transition-all duration-300">
                            Liên hệ với chúng tôi
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}