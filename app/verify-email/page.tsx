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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!email) router.replace('/login');
    else setTimeout(() => setVisible(true), 80);
  }, [email, router]);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) timer = window.setTimeout(() => setCooldown(c => c - 1), 1000);
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
        setMessage('Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư (bao gồm cả thư mục spam).');
        setCooldown(60);
      } else {
        setError(result.error || 'Gửi lại email thất bại. Vui lòng thử lại.');
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;700&display=swap');

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(32px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33%       { transform: translateY(-18px) rotate(2deg); }
          66%       { transform: translateY(8px) rotate(-1.5deg); }
        }
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .page-card { animation: floatUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-enter { animation: fadeSlide 0.35s ease both; }
        .leaf { animation: drift linear infinite; }

        .email-chip {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          border-radius: 999px;
          padding: 8px 20px;
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          color: #166534;
          font-size: 0.95rem;
          box-shadow: 0 2px 12px rgba(134,239,172,0.35);
          position: relative;
          overflow: hidden;
        }
        .email-chip::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2.5s ease infinite;
        }

        .btn-primary {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 14px 24px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary:hover:not(:disabled)::before { opacity: 1; }

        .progress-bar {
          height: 3px;
          background: linear-gradient(90deg, #16a34a, #4ade80);
          border-radius: 999px;
          animation: progressBar 60s linear both;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .ripple-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #4ade80;
          animation: ripple 2s ease-out infinite;
        }

        .back-link {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s, gap 0.2s;
          font-size: 0.875rem;
        }
        .back-link:hover { color: #16a34a; gap: 10px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'DM Sans', sans-serif",
        background: '#f8fdf5',
        backgroundImage: `
          radial-gradient(ellipse 70% 60% at 20% 10%, rgba(187,247,208,0.5) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 85% 85%, rgba(167,243,208,0.35) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 60% 40%, rgba(220,252,231,0.3) 0%, transparent 50%)
        `,
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Floating leaf decorations */}
        {[
          { top: '8%',  left: '6%',  size: 48, dur: '7s',  delay: '0s',   rot: '15deg',  op: 0.18 },
          { top: '15%', right: '8%', size: 36, dur: '9s',  delay: '1.5s', rot: '-20deg', op: 0.14 },
          { top: '70%', left: '4%',  size: 56, dur: '11s', delay: '3s',   rot: '30deg',  op: 0.12 },
          { top: '80%', right: '5%', size: 40, dur: '8s',  delay: '0.7s', rot: '-10deg', op: 0.16 },
          { top: '45%', left: '2%',  size: 28, dur: '13s', delay: '2s',   rot: '45deg',  op: 0.1  },
          { top: '30%', right: '3%', size: 32, dur: '10s', delay: '4s',   rot: '-35deg', op: 0.12 },
        ].map((l, i) => (
          <svg
            key={i}
            className="leaf"
            viewBox="0 0 40 60"
            style={{
              position: 'absolute',
              top: l.top,
              left: 'left' in l ? l.left : undefined,
              right: 'right' in l ? l.right : undefined,
              width: l.size,
              height: l.size,
              opacity: l.op,
              transform: `rotate(${l.rot})`,
              animationDuration: l.dur,
              animationDelay: l.delay,
              pointerEvents: 'none',
            }}
          >
            <path d="M20 2 C20 2, 38 18, 38 35 C38 48, 30 58, 20 58 C10 58, 2 48, 2 35 C2 18, 20 2, 20 2Z" fill="#16a34a" />
            <line x1="20" y1="8" x2="20" y2="54" stroke="#15803d" strokeWidth="1.5" opacity="0.5" />
            <line x1="20" y1="22" x2="10" y2="35" stroke="#15803d" strokeWidth="1" opacity="0.4" />
            <line x1="20" y1="22" x2="30" y2="35" stroke="#15803d" strokeWidth="1" opacity="0.4" />
          </svg>
        ))}

        {visible && (
          <div
            className="page-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(187,247,208,0.8)',
              borderRadius: '28px',
              padding: '2.5rem',
              boxShadow: '0 8px 40px rgba(22,163,74,0.1), 0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Top decorative line */}
            <div style={{
              height: 4,
              background: 'linear-gradient(90deg, #4ade80, #16a34a, #4ade80)',
              borderRadius: '999px',
              marginBottom: '2rem',
              opacity: 0.7,
            }} />

            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div className="ripple-ring" />
                <div style={{
                  width: 72, height: 72,
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  border: '2px solid #86efac',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(134,239,172,0.4)',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <Icon name="mail" className="w-9 h-9 text-green-600" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <h2 style={{
              fontFamily: "'Lora', serif",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#14532d',
              textAlign: 'center',
              marginBottom: '0.5rem',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}>
              Xác thực tài khoản
            </h2>

            <p style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              textAlign: 'center',
              lineHeight: 1.7,
              marginBottom: '1.25rem',
            }}>
              Chúng tôi đã gửi liên kết xác thực đến
            </p>

            {/* Email chip */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span className="email-chip">{email}</span>
            </div>

            <p style={{
              color: '#9ca3af',
              fontSize: '0.8rem',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
              padding: '0 0.5rem',
            }}>
              Kiểm tra hộp thư đến và cả thư mục spam, sau đó nhấp vào liên kết để hoàn tất đăng ký.
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #d1fae5, transparent)', marginBottom: '1.5rem' }} />

            {/* Messages */}
            {message && (
              <div className="msg-enter" style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.825rem',
                color: '#166534',
              }}>
                <Icon name="check-circle" className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span>{message}</span>
                  {/* Cooldown progress bar */}
                  <div style={{ marginTop: 8, background: '#dcfce7', borderRadius: '999px', overflow: 'hidden' }}>
                    <div className="progress-bar" />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="msg-enter" style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.825rem',
                color: '#991b1b',
              }}>
                <Icon name="alert-circle" className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              className="btn-primary"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
            >
              {loading ? (
                <><div className="spinner" />Đang gửi...</>
              ) : cooldown > 0 ? (
                <><Icon name="clock" className="w-4 h-4" />Gửi lại sau {cooldown}s</>
              ) : (
                <><Icon name="refresh-cw" className="w-4 h-4" />Gửi lại email xác thực</>
              )}
            </button>

            {/* Back link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link href="/login" className="back-link">
                <Icon name="arrow-left" className="w-3.5 h-3.5" />
                Quay lại trang Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fdf5',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #d1fae5',
          borderTopColor: '#16a34a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}