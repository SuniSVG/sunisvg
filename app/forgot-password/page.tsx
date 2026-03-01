'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/shared/Icon';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { requestPasswordReset } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');
        setErrorMessage('');

        const result = await requestPasswordReset(email);
        setIsLoading(false);

        if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP.');
            // Chuyển sang trang reset sau 2 giây
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

                .fp-root {
                    font-family: 'DM Sans', sans-serif;
                    min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem 1rem;
                    position: relative; overflow: hidden;
                    background: #f0fdf4;
                }
                .fp-root::before {
                    content: '';
                    position: fixed; inset: 0;
                    background:
                        radial-gradient(ellipse 60% 50% at 10% 10%, rgba(134,239,172,.4) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 90% 90%, rgba(251,146,60,.2) 0%, transparent 60%),
                        #f0fdf4;
                    pointer-events: none; z-index: 0;
                }
                .fp-root::after {
                    content: '';
                    position: fixed; inset: 0;
                    background-image: radial-gradient(circle, rgba(34,197,94,.07) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none; z-index: 0;
                }

                .fp-card {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 420px;
                }

                .fp-glass {
                    background: rgba(255,255,255,.75);
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    border: 1.5px solid rgba(255,255,255,.9);
                    border-radius: 28px; padding: 2.5rem;
                    box-shadow: 0 8px 32px rgba(22,163,74,.08), 0 2px 8px rgba(0,0,0,.05),
                                inset 0 1px 0 rgba(255,255,255,.9);
                }

                /* Icon wrap */
                .fp-icon-wrap {
                    width: 68px; height: 68px; border-radius: 20px;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                }

                /* Heading */
                .fp-h { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.75rem; font-weight: 800; color: #0f2419; letter-spacing: -.02em; text-align: center; margin-bottom: .5rem; }
                .fp-sub { font-size: .875rem; color: #6b7f72; text-align: center; line-height: 1.6; margin-bottom: 2rem; }

                /* Alerts */
                .fp-alert {
                    border-radius: 14px; padding: 1rem 1.1rem;
                    display: flex; align-items: flex-start; gap: .625rem;
                    font-size: .85rem; margin-bottom: 1.5rem;
                    border-left: 3px solid;
                }
                .fp-alert-success { background: #f0fdf4; border-color: #22c55e; color: #166534; }
                .fp-alert-error   { background: #fef2f2; border-color: #ef4444; color: #dc2626; }
                .fp-alert-icon { flex-shrink: 0; margin-top: .1rem; }
                .fp-alert-title { font-weight: 700; margin-bottom: .25rem; }
                .fp-alert-sub { font-size: .8rem; opacity: .85; }

                /* Redirect notice */
                .fp-redirect {
                    display: flex; align-items: center; justify-content: center; gap: .5rem;
                    font-size: .78rem; color: #6b7f72; margin-top: .75rem;
                }
                .fp-redirect-spinner {
                    width: 14px; height: 14px; border-radius: 50%;
                    border: 2px solid #bbf7d0; border-top-color: #16a34a;
                    animation: fp-spin .7s linear infinite;
                }

                /* Field */
                .fp-label { display: block; font-size: .78rem; font-weight: 700; color: #3d5a45; margin-bottom: .5rem; letter-spacing: .01em; }
                .fp-input-wrap { position: relative; margin-bottom: 1.25rem; }
                .fp-input-icon { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; transition: color .2s; }
                .fp-input-wrap:focus-within .fp-input-icon { color: #16a34a; }
                .fp-input {
                    width: 100%; padding: .875rem 1rem .875rem 2.75rem;
                    border: 1.5px solid #e5e7eb; border-radius: 14px;
                    font-size: .9rem; color: #0f2419; background: rgba(255,255,255,.8);
                    font-family: 'DM Sans', sans-serif;
                    transition: border-color .2s, box-shadow .2s; outline: none;
                }
                .fp-input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
                .fp-input::placeholder { color: #c4d1c8; }
                .fp-input.error { border-color: #ef4444; }
                .fp-input.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.12); }

                /* Submit */
                .fp-submit {
                    width: 100%; padding: 1rem; border: none; border-radius: 14px; cursor: pointer;
                    font-family: 'DM Sans', sans-serif; font-size: .95rem; font-weight: 700; color: #fff;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                    display: flex; align-items: center; justify-content: center; gap: .5rem;
                    transition: transform .2s, box-shadow .2s, opacity .2s;
                    margin-bottom: 1.5rem;
                }
                .fp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(22,163,74,.45); }
                .fp-submit:disabled { opacity: .6; cursor: not-allowed; }

                .fp-spinner {
                    width: 18px; height: 18px; border-radius: 50%;
                    border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff;
                    animation: fp-spin .7s linear infinite;
                }

                /* Back link */
                .fp-back {
                    display: flex; align-items: center; justify-content: center; gap: .4rem;
                    font-size: .83rem; font-weight: 600; color: #6b7f72; text-decoration: none;
                    transition: color .2s;
                }
                .fp-back:hover { color: #16a34a; }
                .fp-back svg { transition: transform .2s; }
                .fp-back:hover svg { transform: translateX(-3px); }

                /* Footer */
                .fp-footer { text-align: center; font-size: .72rem; color: #9ca3af; margin-top: 1.5rem; }

                @keyframes fp-spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="fp-root">
                <div className="fp-card">
                    <div className="fp-glass">

                        {/* Header */}
                        <div className="fp-icon-wrap">
                            <Icon name="lock" className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="fp-h">Quên mật khẩu/ Cần xác nhận tài khoản ?</h2>
                        <p className="fp-sub">
                            Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.<br />
                            Nếu báo lỗi 200, vui lòng kiểm tra lại email.
                        </p>

                        {/* Success state */}
                        {status === 'success' && (
                            <div className="fp-alert fp-alert-success">
                                <Icon name="check-circle" className="fp-alert-icon w-4 h-4" />
                                <div>
                                    <div className="fp-alert-title">Đã gửi mã OTP!</div>
                                    <div className="fp-alert-sub">{message}</div>
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {status === 'error' && (
                            <div className="fp-alert fp-alert-error">
                                <Icon name="alert-circle" className="fp-alert-icon w-4 h-4" />
                                <div>
                                    <div className="fp-alert-title">Gửi yêu cầu thất bại</div>
                                    <div className="fp-alert-sub">{errorMessage}</div>
                                </div>
                            </div>
                        )}

                        {/* Form — ẩn sau khi thành công */}
                        {status !== 'success' && (
                            <form onSubmit={handleSubmit} method="POST">
                                <label htmlFor="email" className="fp-label">Địa chỉ Email</label>
                                <div className="fp-input-wrap">
                                    <Icon name="mail" className="fp-input-icon w-5 h-5" />
                                    <input
                                        id="email" name="email" type="email"
                                        autoComplete="email" required
                                        className={`fp-input ${status === 'error' ? 'error' : ''}`}
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="fp-submit">
                                    {isLoading
                                        ? <><div className="fp-spinner" /> Đang gửi...</>
                                        : <><Icon name="send" className="w-4 h-4" /> Gửi mã khôi phục</>
                                    }
                                </button>

                                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                                    <Link href="/reset-password" style={{ fontSize: '.85rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                                        Đã có mã xác nhận?
                                    </Link>
                                </div>

                                <Link href="/login" className="fp-back">
                                    <Icon name="arrow-left" className="w-4 h-4" />
                                    Quay lại đăng nhập
                                </Link>
                            </form>
                        )}

                        {/* Redirect notice sau khi success */}
                        {status === 'success' && (
                            <>
                                <div className="fp-redirect">
                                    <div className="fp-redirect-spinner" />
                                    Đang chuyển đến trang nhập mã OTP...
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                                    <Link href="/login" className="fp-back" style={{ justifyContent: 'center' }}>
                                        <Icon name="arrow-left" className="w-4 h-4" />
                                        Quay lại đăng nhập
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    <p className="fp-footer">© {new Date().getFullYear()} SuniSVG. Bảo mật và An toàn.</p>
                </div>
            </div>
        </>
    );
}