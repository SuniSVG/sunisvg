'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/shared/Icon';
import { fetchAccounts } from '@/services/googleSheetService';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [totalUsers, setTotalUsers] = useState(0);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    const { login, resendVerificationEmail } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            setTimeout(() => setSuccessMessage(message), 0);
            router.replace('/login');
        }
    }, [searchParams, router]);

    useEffect(() => {
        fetchAccounts()
            .then(a => setTotalUsers(a.length))
            .catch(() => setTotalUsers(12547));
    }, []);

    useEffect(() => {
        let timer: number;
        if (cooldown > 0) timer = window.setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setter(e.target.value);
            if (error) { setError(''); setUnverifiedEmail(null); setResendMessage(''); setResendError(''); }
            if (successMessage) setSuccessMessage('');
        };

    const handleResend = async () => {
        if (cooldown > 0 || !unverifiedEmail) return;
        setResendLoading(true);
        setResendMessage(''); setResendError('');
        const result = await resendVerificationEmail(unverifiedEmail);
        if (result.success) { setResendMessage('Email xác thực mới đã được gửi.'); setCooldown(60); }
        else setResendError(result.error || 'Gửi lại email thất bại.');
        setResendLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccessMessage(''); setUnverifiedEmail(null);
        setResendMessage(''); setResendError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            router.push('/');
        } else if (result.reason === 'unverified' && result.email) {
            setError(result.error || 'Tài khoản chưa được xác thực.');
            setUnverifiedEmail(result.email);
        } else {
            setError(result.error || 'Đăng nhập thất bại.');
        }
    };

    const isCredentialError = error && !unverifiedEmail;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .lg-root {
                    font-family: 'DM Sans', sans-serif;
                    min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                    padding: 3rem 1rem;
                    position: relative; overflow: hidden;
                    background: #f0fdf4;
                }
                .lg-root::before {
                    content: '';
                    position: fixed; inset: 0;
                    background:
                        radial-gradient(ellipse 70% 60% at 5% 0%, rgba(134,239,172,.35) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 95% 100%, rgba(251,146,60,.2) 0%, transparent 60%),
                        #f0fdf4;
                    pointer-events: none; z-index: 0;
                }
                .lg-root::after {
                    content: '';
                    position: fixed; inset: 0;
                    background-image: radial-gradient(circle, rgba(34,197,94,.08) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none; z-index: 0;
                }

                .lg-inner {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 1100px;
                    display: grid; grid-template-columns: 1fr;
                    gap: 2rem; align-items: start;
                }
                @media (min-width: 1024px) {
                    .lg-inner { grid-template-columns: 2fr 3fr; }
                }

                /* ── Left panel ── */
                .lg-left {
                    background: linear-gradient(145deg, #166534 0%, #15803d 45%, #16a34a 75%, #0d9488 100%);
                    border-radius: 28px; padding: 2.5rem;
                    position: sticky; top: 1.5rem;
                    box-shadow: 0 24px 60px rgba(22,101,52,.35), 0 4px 16px rgba(0,0,0,.1);
                    overflow: hidden;
                }
                .lg-left::before {
                    content: '';
                    position: absolute; top: -80px; right: -80px;
                    width: 250px; height: 250px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(251,146,60,.3), transparent 70%);
                    pointer-events: none;
                }
                .lg-left::after {
                    content: '';
                    position: absolute; bottom: -60px; left: -60px;
                    width: 200px; height: 200px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(134,239,172,.25), transparent 70%);
                    pointer-events: none;
                }

                .lg-welcome-tag {
                    display: inline-flex; align-items: center; gap: .4rem;
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    color: #fff; font-size: .7rem; font-weight: 800;
                    letter-spacing: .08em; text-transform: uppercase;
                    padding: .35rem .9rem; border-radius: 999px;
                    margin-bottom: 1.25rem;
                    box-shadow: 0 4px 14px rgba(234,88,12,.4);
                }
                .lg-left-h {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: 1.75rem; font-weight: 800; color: #fff;
                    line-height: 1.2; margin-bottom: .75rem; letter-spacing: -.02em;
                    position: relative; z-index: 1;
                }
                .lg-left-sub {
                    color: rgba(209,250,229,.8); font-size: .9rem;
                    line-height: 1.6; margin-bottom: 1.75rem;
                    position: relative; z-index: 1;
                }

                .lg-benefits { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1.75rem; position: relative; z-index: 1; }
                .lg-benefit {
                    display: flex; align-items: flex-start; gap: .875rem;
                    background: rgba(255,255,255,.1); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,.15);
                    border-radius: 16px; padding: 1rem 1.1rem;
                    transition: background .2s;
                }
                .lg-benefit:hover { background: rgba(255,255,255,.18); }
                .lg-benefit-icon {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: rgba(255,255,255,.95);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem; flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,.12);
                }
                .lg-benefit-title { font-weight: 700; font-size: .9rem; color: #fff; margin-bottom: .2rem; }
                .lg-benefit-desc { font-size: .75rem; color: rgba(209,250,229,.8); line-height: 1.5; }

                .lg-social {
                    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
                    border-radius: 16px; padding: 1rem 1.1rem;
                    position: relative; z-index: 1;
                }
                .lg-social-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .3rem; }
                .lg-social-label { color: rgba(209,250,229,.8); font-size: .8rem; font-weight: 500; }
                .lg-social-count { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fde68a; }
                .lg-social-sub { font-size: .72rem; color: rgba(209,250,229,.65); margin-bottom: .75rem; }
                .lg-avatars { display: flex; }
                .lg-avatar {
                    width: 30px; height: 30px; border-radius: 50%;
                    border: 2px solid rgba(255,255,255,.4);
                    margin-left: -8px; background: linear-gradient(135deg, #4ade80, #16a34a);
                    display: flex; align-items: center; justify-content: center;
                    font-size: .6rem; font-weight: 800; color: #fff;
                }
                .lg-avatar:first-child { margin-left: 0; }
                .lg-avatar-more { background: rgba(255,255,255,.2); }

                /* ── Right panel ── */
                .lg-right {
                    background: rgba(255,255,255,.75);
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    border: 1.5px solid rgba(255,255,255,.9);
                    border-radius: 28px; padding: 2.5rem;
                    box-shadow: 0 8px 32px rgba(22,163,74,.08), 0 2px 8px rgba(0,0,0,.05),
                                inset 0 1px 0 rgba(255,255,255,.9);
                }

                .lg-mobile-banner {
                    display: flex; align-items: center; gap: .75rem;
                    background: linear-gradient(135deg, #166534, #16a34a);
                    border-radius: 16px; padding: 1rem 1.25rem;
                    margin-bottom: 1.75rem;
                }
                @media (min-width: 1024px) { .lg-mobile-banner { display: none; } }
                .lg-mobile-banner-text { font-weight: 700; font-size: .9rem; color: #fff; }
                .lg-mobile-banner-sub { font-size: .75rem; color: rgba(209,250,229,.8); }

                .lg-form-head { text-align: center; margin-bottom: 2rem; }
                .lg-logo-wrap {
                    width: 60px; height: 60px; border-radius: 18px;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1rem;
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                }
                .lg-form-h {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-size: 1.75rem; font-weight: 800; color: #0f2419;
                    letter-spacing: -.02em; margin-bottom: .4rem;
                }
                .lg-form-sub { font-size: .875rem; color: #6b7f72; }
                .lg-form-sub a { color: #16a34a; font-weight: 700; text-decoration: none; }
                .lg-form-sub a:hover { text-decoration: underline; }

                /* Alerts */
                .lg-alert {
                    border-radius: 12px; padding: .875rem 1rem;
                    display: flex; align-items: flex-start; gap: .625rem;
                    font-size: .85rem; margin-bottom: 1.25rem;
                    border-left: 3px solid;
                }
                .lg-alert-success { background: #f0fdf4; border-color: #22c55e; color: #166534; }
                .lg-alert-error   { background: #fef2f2; border-color: #ef4444; color: #dc2626; }
                .lg-alert-warn    { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
                .lg-alert-icon { flex-shrink: 0; margin-top: .1rem; }
                .lg-alert-title { font-weight: 700; margin-bottom: .2rem; }
                .lg-resend-btn {
                    font-weight: 700; text-decoration: underline; font-size: .8rem;
                    background: none; border: none; cursor: pointer; color: #92400e;
                    padding: 0; margin-top: .5rem; display: inline-block;
                }
                .lg-resend-btn:disabled { opacity: .5; cursor: not-allowed; }

                /* Fields */
                .lg-field { margin-bottom: 1.1rem; }
                .lg-label { display: block; font-size: .78rem; font-weight: 700; color: #3d5a45; margin-bottom: .5rem; letter-spacing: .01em; }
                .lg-input {
                    width: 100%; padding: .85rem 1rem;
                    border: 1.5px solid #e5e7eb; border-radius: 14px;
                    font-size: .9rem; color: #0f2419;
                    background: rgba(255,255,255,.8);
                    font-family: 'DM Sans', sans-serif;
                    transition: border-color .2s, box-shadow .2s;
                    outline: none;
                }
                .lg-input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
                .lg-input.error { border-color: #ef4444; }
                .lg-input.error:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.12); }
                .lg-input::placeholder { color: #c4d1c8; }
                .lg-input-wrap { position: relative; }
                .lg-eye {
                    position: absolute; right: .875rem; top: 50%; transform: translateY(-50%);
                    color: #9ca3af; cursor: pointer; background: none; border: none;
                    display: flex; align-items: center; transition: color .2s;
                }
                .lg-eye:hover { color: #3d5a45; }

                /* Remember / Forgot */
                .lg-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
                .lg-remember { display: flex; align-items: center; gap: .5rem; font-size: .82rem; color: #6b7f72; cursor: pointer; }
                .lg-checkbox { accent-color: #16a34a; width: 15px; height: 15px; cursor: pointer; }
                .lg-forgot { font-size: .82rem; font-weight: 700; color: #16a34a; text-decoration: none; }
                .lg-forgot:hover { text-decoration: underline; }

                /* Submit */
                .lg-submit {
                    width: 100%; padding: 1rem; border: none; border-radius: 14px; cursor: pointer;
                    font-family: 'DM Sans', sans-serif; font-size: .95rem; font-weight: 700; color: #fff;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                    display: flex; align-items: center; justify-content: center; gap: .5rem;
                    transition: transform .2s, box-shadow .2s, opacity .2s;
                }
                .lg-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(22,163,74,.45); }
                .lg-submit:active:not(:disabled) { transform: translateY(0); }
                .lg-submit:disabled { opacity: .6; cursor: not-allowed; }

                .lg-spinner {
                    width: 18px; height: 18px; border-radius: 50%;
                    border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff;
                    animation: lg-spin .7s linear infinite;
                }
                @keyframes lg-spin { to { transform: rotate(360deg); } }

                /* Divider */
                .lg-divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
                .lg-divider-line { flex: 1; height: 1px; background: #e9f5ec; }
                .lg-divider-text { font-size: .75rem; color: #9ca3af; font-weight: 500; }

                /* Bottom CTA */
                .lg-bottom { text-align: center; font-size: .82rem; color: #6b7f72; }
                .lg-bottom a { color: #f97316; font-weight: 700; text-decoration: none; }
                .lg-bottom a:hover { text-decoration: underline; }
            `}</style>

            <div className="lg-root">
                <div className="lg-inner">

                    {/* ── Left panel ── */}
                    <div className="hidden lg:block">
                        <div className="lg-left">
                            <div className="lg-welcome-tag">✨ Chào mừng trở lại</div>
                            <h3 className="lg-left-h">Tiếp tục hành trình<br />học tập!</h3>
                            <p className="lg-left-sub">Đăng nhập để truy cập tất cả tài nguyên và tiếp tục ôn luyện.</p>

                            <div className="lg-benefits">
                                {[
                                    { icon: '📚', title: 'Tài liệu của bạn', desc: 'Truy cập tất cả tài liệu đã lưu và lịch sử học tập.' },
                                    { icon: '📊', title: 'Theo dõi tiến độ', desc: 'Xem kết quả học tập và phân tích điểm mạnh, yếu.' },
                                    { icon: '🎓', title: 'Lớp học của bạn', desc: 'Nhận bài tập và cập nhật thông báo mới nhất.' },
                                ].map(b => (
                                    <div key={b.title} className="lg-benefit">
                                        <div className="lg-benefit-icon">{b.icon}</div>
                                        <div>
                                            <div className="lg-benefit-title">{b.title}</div>
                                            <div className="lg-benefit-desc">{b.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="lg-social">
                                <div className="lg-social-top">
                                    <span className="lg-social-label">Cộng đồng</span>
                                    <span className="lg-social-count">
                                        {totalUsers > 0 ? totalUsers.toLocaleString('vi-VN') : '12,547'}+
                                    </span>
                                </div>
                                <p className="lg-social-sub">thành viên đang học tập cùng bạn</p>
                                <div className="lg-avatars">
                                    {['H','D','T','M','L'].map((l, i) => (
                                        <div key={i} className="lg-avatar">{l}</div>
                                    ))}
                                    <div className="lg-avatar lg-avatar-more">
                                        +{totalUsers > 1000 ? Math.floor(totalUsers / 1000) : '12'}K
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right panel ── */}
                    <div className="lg-right">
                        {/* Mobile banner */}
                        <div className="lg-mobile-banner">
                            <span style={{ fontSize: '1.75rem' }}>✨</span>
                            <div>
                                <div className="lg-mobile-banner-text">Chào mừng trở lại SuniSVG</div>
                                <div className="lg-mobile-banner-sub">
                                    {totalUsers > 0 ? totalUsers.toLocaleString('vi-VN') : '36,180'}+ thành viên đang học tập
                                </div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="lg-form-head">
                            <div className="lg-logo-wrap">
                                <Icon name="logo" className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="lg-form-h">Đăng nhập vào SuniSVG</h2>
                            <p className="lg-form-sub">
                                Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} method="POST">
                            {/* Success */}
                            {successMessage && (
                                <div className="lg-alert lg-alert-success">
                                    <Icon name="check-circle" className="lg-alert-icon w-4 h-4" />
                                    <div>
                                        <div className="lg-alert-title">Thành công</div>
                                        <div>{successMessage}</div>
                                    </div>
                                </div>
                            )}

                            {/* Error / Unverified */}
                            {error && (
                                <div className={`lg-alert ${unverifiedEmail ? 'lg-alert-warn' : 'lg-alert-error'}`}>
                                    <Icon name="alert" className="lg-alert-icon w-4 h-4" />
                                    <div>
                                        <div className="lg-alert-title">
                                            {unverifiedEmail ? 'Yêu cầu xác thực tài khoản' : 'Đăng nhập không thành công'}
                                        </div>
                                        <div>{error}</div>
                                        {unverifiedEmail && (
                                            <div style={{ marginTop: '.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleResend}
                                                    disabled={cooldown > 0 || resendLoading}
                                                    className="lg-resend-btn"
                                                >
                                                    {resendLoading ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại email xác thực'}
                                                </button>
                                                {resendMessage && <span style={{ marginLeft: '.75rem', fontSize: '.78rem', color: '#166534' }}>{resendMessage}</span>}
                                                {resendError && <span style={{ marginLeft: '.75rem', fontSize: '.78rem', color: '#dc2626' }}>{resendError}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="lg-field">
                                <label htmlFor="email-address" className="lg-label">Email</label>
                                <input
                                    id="email-address" name="email" type="email" autoComplete="email" required
                                    className={`lg-input ${isCredentialError ? 'error' : ''}`}
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={handleInputChange(setEmail)}
                                />
                            </div>

                            {/* Password */}
                            <div className="lg-field">
                                <label htmlFor="password-2" className="lg-label">Mật khẩu</label>
                                <div className="lg-input-wrap">
                                    <input
                                        id="password-2" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password" required
                                        className={`lg-input ${isCredentialError ? 'error' : ''}`}
                                        style={{ paddingRight: '2.75rem' }}
                                        placeholder="Nhập mật khẩu của bạn"
                                        value={password}
                                        onChange={handleInputChange(setPassword)}
                                    />
                                    <button type="button" className="lg-eye" onClick={() => setShowPassword(!showPassword)}>
                                        <Icon name={showPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Remember / Forgot */}
                            <div className="lg-row">
                                <label className="lg-remember">
                                    <input type="checkbox" className="lg-checkbox" id="remember-me" name="remember-me" />
                                    Ghi nhớ đăng nhập
                                </label>
                                <Link href="/forgot-password" className="lg-forgot">Quên mật khẩu?</Link>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading} className="lg-submit">
                                {loading ? (
                                    <><div className="lg-spinner" /> Đang xử lý...</>
                                ) : 'Đăng nhập'}
                            </button>

                            {/* Divider */}
                            <div className="lg-divider">
                                <div className="lg-divider-line" />
                                <span className="lg-divider-text">Hoặc</span>
                                <div className="lg-divider-line" />
                            </div>

                            {/* Bottom CTA */}
                            <div className="lg-bottom">
                                Bạn chưa có tài khoản?{' '}
                                <Link href="/register">Đăng ký ngay để nhận 50.000đ</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #bbf7d0', borderTopColor: '#16a34a', animation: 'spin 0.7s linear infinite' }} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}