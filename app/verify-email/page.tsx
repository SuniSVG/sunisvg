'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/shared/Icon';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { resendVerificationEmail } = useAuth();
  const router = useRouter();

  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      // Nếu không có email trên URL, chuyển hướng về trang đăng nhập
      router.replace('/login');
    }
  }, [email, router]);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        setMessage('Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam).');
        setCooldown(60);
      } else {
        setError(result.error || 'Gửi lại email thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f0fdf4] relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-xl w-full text-center space-y-8 bg-white/80 backdrop-blur-xl border border-white/60 p-10 rounded-3xl shadow-2xl relative z-10">
        <div>
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Icon name="mail" className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Xác thực tài khoản
          </h2>
          <p className="text-gray-600 text-lg">
            Cảm ơn bạn đã đăng ký! Chúng tôi đã gửi một liên kết xác thực đến email:
          </p>
          <div className="my-6">
            <span className="font-bold text-gray-900 text-lg bg-white border border-gray-200 py-2 px-6 rounded-full shadow-sm">
              {email}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) và nhấp vào liên kết để hoàn tất quá trình đăng ký.
          </p>
        </div>
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm flex items-start gap-3 text-left animate-fade-in">
            <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-start gap-3 text-left animate-fade-in">
            <Icon name="alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/30"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (cooldown > 0 ? (
              `Gửi lại sau (${cooldown}s)`
            ) : (
              <>
                <Icon name="refresh-cw" className="w-4 h-4" />
                Gửi lại email xác thực
              </>
            ))}
          </button>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 font-bold text-gray-500 hover:text-green-600 transition-colors mt-6 group"
          >
            <Icon name="arrow-left" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}