'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/shared/Icon';
import { Suspense } from 'react';

// ─── Password criterion ───────────────────────────────────────────────────────

const PasswordCriterion: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <li className={`rp-criterion ${met ? 'met' : ''}`}>
        <Icon name={met ? 'check-circle' : 'x-circle'} className={`w-3.5 h-3.5 shrink-0 ${met ? 'text-green-500' : 'text-gray-300'}`} />
        {text}
    </li>
);

// ─── OTP Input ────────────────────────────────────────────────────────────────

const OtpInput: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (digits[i]) {
                const next = [...digits]; next[i] = '';
                onChange(next.join(''));
            } else if (i > 0) {
                inputs.current[i - 1]?.focus();
            }
        }
    };

    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) return;
        // Support paste
        if (raw.length > 1) {
            const next = raw.slice(0, 6).split('');
            onChange(next.join(''));
            inputs.current[Math.min(next.length, 5)]?.focus();
            return;
        }
        const next = [...digits]; next[i] = raw[0];
        onChange(next.join(''));
        if (i < 5) inputs.current[i + 1]?.focus();
    };

    const handleFocus = (i: number) => inputs.current[i]?.select();

    return (
        <div className="rp-otp-row">
            {[0,1,2,3,4,5].map(i => (
                <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    className={`rp-otp-box ${digits[i] ? 'filled' : ''}`}
                    value={digits[i] || ''}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKey(i, e)}
                    onFocus={() => handleFocus(i)}
                />
            ))}
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

function ResetPasswordContent() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'otp' | 'password'>('otp');
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false, uppercase: false, lowercase: false, number: false, specialChar: false,
    });

    const { resetPasswordWithOTP } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill email from query param (passed from ForgotPassword redirect)
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(decodeURIComponent(emailParam));
    }, [searchParams]);

    const validatePassword = (pass: string) => {
        const c = {
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            lowercase: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
        setPasswordCriteria(c);
        return Object.values(c).every(Boolean);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
        validatePassword(e.target.value);
    };

    const handleOtpNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) { setError('Vui lòng nhập địa chỉ email.'); return; }
        if (otp.length < 6) { setError('Mã OTP phải đủ 6 chữ số.'); return; }
        setStep('password');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
        if (!validatePassword(newPassword)) { setError('Mật khẩu không đủ mạnh.'); return; }

        setLoading(true);
        const result = await resetPasswordWithOTP(email, otp, newPassword);
        setLoading(false);

        if (result.success) {
            router.push('/login?message=' + encodeURIComponent('Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.'));
        } else {
            setError(result.error || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.');
        }
    };

    const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;
    const allMet = passwordStrength === 5;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

                .rp-root {
                    font-family: 'DM Sans', sans-serif;
                    min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem 1rem;
                    position: relative; overflow: hidden; background: #f0fdf4;
                }
                .rp-root::before {
                    content: ''; position: fixed; inset: 0;
                    background:
                        radial-gradient(ellipse 60% 50% at 10% 10%, rgba(134,239,172,.4) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 90% 90%, rgba(251,146,60,.2) 0%, transparent 60%),
                        #f0fdf4;
                    pointer-events: none; z-index: 0;
                }
                .rp-root::after {
                    content: ''; position: fixed; inset: 0;
                    background-image: radial-gradient(circle, rgba(34,197,94,.07) 1px, transparent 1px);
                    background-size: 28px 28px; pointer-events: none; z-index: 0;
                }

                .rp-card { position: relative; z-index: 1; width: 100%; max-width: 440px; }
                .rp-glass {
                    background: rgba(255,255,255,.75);
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    border: 1.5px solid rgba(255,255,255,.9);
                    border-radius: 28px; padding: 2.5rem;
                    box-shadow: 0 8px 32px rgba(22,163,74,.08), 0 2px 8px rgba(0,0,0,.05),
                                inset 0 1px 0 rgba(255,255,255,.9);
                }

                /* Steps indicator */
                .rp-steps { display: flex; align-items: center; justify-content: center; gap: .5rem; margin-bottom: 2rem; }
                .rp-step {
                    display: flex; align-items: center; gap: .4rem;
                    font-size: .72rem; font-weight: 700; padding: .3rem .8rem; border-radius: 999px;
                    transition: all .3s;
                }
                .rp-step.done { background: #dcfce7; color: #16a34a; }
                .rp-step.active { background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; box-shadow: 0 4px 12px rgba(22,163,74,.3); }
                .rp-step.pending { background: #f3f4f6; color: #9ca3af; }
                .rp-step-divider { width: 24px; height: 2px; background: #e5e7eb; border-radius: 1px; }
                .rp-step-divider.done { background: #86efac; }

                /* Icon wrap */
                .rp-icon-wrap {
                    width: 64px; height: 64px; border-radius: 18px;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                }

                /* Heading */
                .rp-h { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.6rem; font-weight: 800; color: #0f2419; letter-spacing: -.02em; text-align: center; margin-bottom: .4rem; }
                .rp-sub { font-size: .85rem; color: #6b7f72; text-align: center; line-height: 1.6; margin-bottom: 1.75rem; }
                .rp-sub strong { color: #16a34a; }

                /* OTP boxes */
                .rp-otp-row { display: flex; gap: .625rem; justify-content: center; margin-bottom: 1.5rem; }
                .rp-otp-box {
                    width: 52px; height: 58px; border-radius: 14px;
                    border: 1.5px solid #e5e7eb; background: rgba(255,255,255,.8);
                    text-align: center; font-size: 1.4rem; font-weight: 800;
                    color: #0f2419; font-family: 'Bricolage Grotesque', sans-serif;
                    outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
                }
                .rp-otp-box:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.15); background: #fff; }
                .rp-otp-box.filled { border-color: #86efac; background: #f0fdf4; }

                /* Alert */
                .rp-alert {
                    border-radius: 12px; padding: .875rem 1rem;
                    display: flex; align-items: flex-start; gap: .5rem;
                    font-size: .82rem; margin-bottom: 1.25rem;
                    border-left: 3px solid #ef4444;
                    background: #fef2f2; color: #dc2626;
                }

                /* Field */
                .rp-field { margin-bottom: 1rem; }
                .rp-label { display: block; font-size: .78rem; font-weight: 700; color: #3d5a45; margin-bottom: .4rem; }
                .rp-input-wrap { position: relative; }
                .rp-input-icon { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; transition: color .2s; }
                .rp-input-wrap:focus-within .rp-input-icon { color: #16a34a; }
                .rp-input {
                    width: 100%; padding: .85rem 1rem .85rem 2.75rem;
                    border: 1.5px solid #e5e7eb; border-radius: 14px;
                    font-size: .9rem; color: #0f2419; background: rgba(255,255,255,.8);
                    font-family: 'DM Sans', sans-serif;
                    transition: border-color .2s, box-shadow .2s; outline: none;
                }
                .rp-input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
                .rp-input::placeholder { color: #c4d1c8; }
                .rp-input.pr { padding-right: 2.75rem; }
                .rp-eye { position: absolute; right: .875rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; transition: color .2s; }
                .rp-eye:hover { color: #3d5a45; }

                /* Strength bars */
                .rp-bars { display: flex; gap: .3rem; margin: .6rem 0 .5rem; }
                .rp-bar { height: 4px; flex: 1; border-radius: 99px; background: #e5e7eb; transition: background .3s; }
                .rp-bar.s1 { background: #ef4444; }
                .rp-bar.s2 { background: #f97316; }
                .rp-bar.s3 { background: #eab308; }
                .rp-bar.s4 { background: #22c55e; }
                .rp-bar.s5 { background: #16a34a; }

                /* Criteria */
                .rp-criteria { background: #f8faf8; border: 1px solid #e9f5ec; border-radius: 12px; padding: .75rem 1rem; margin-bottom: 1rem; }
                .rp-criteria-title { font-size: .68rem; font-weight: 800; color: #6b7f72; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .5rem; }
                .rp-criteria-list { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; list-style: none; padding: 0; margin: 0; }
                .rp-criterion { display: flex; align-items: center; gap: .35rem; font-size: .72rem; color: #9ca3af; transition: color .2s; }
                .rp-criterion.met { color: #16a34a; }

                /* Match indicator */
                .rp-match { font-size: .72rem; font-weight: 600; display: flex; align-items: center; gap: .3rem; margin-top: .4rem; }
                .rp-match.ok { color: #16a34a; }
                .rp-match.no { color: #ef4444; }

                /* Submit */
                .rp-submit {
                    width: 100%; padding: 1rem; border: none; border-radius: 14px; cursor: pointer;
                    font-family: 'DM Sans', sans-serif; font-size: .95rem; font-weight: 700; color: #fff;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    box-shadow: 0 8px 24px rgba(22,163,74,.35);
                    display: flex; align-items: center; justify-content: center; gap: .5rem;
                    transition: transform .2s, box-shadow .2s; margin-top: 1.25rem; margin-bottom: 1.25rem;
                }
                .rp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(22,163,74,.45); }
                .rp-submit:disabled { opacity: .6; cursor: not-allowed; }
                .rp-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; animation: rp-spin .7s linear infinite; }

                /* Back */
                .rp-back { display: flex; align-items: center; justify-content: center; gap: .4rem; font-size: .82rem; font-weight: 600; color: #6b7f72; text-decoration: none; transition: color .2s; }
                .rp-back:hover { color: #16a34a; }
                .rp-back svg { transition: transform .2s; }
                .rp-back:hover svg { transform: translateX(-3px); }

                .rp-footer { text-align: center; font-size: .72rem; color: #9ca3af; margin-top: 1.5rem; }

                @keyframes rp-spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="rp-root">
                <div className="rp-card">
                    <div className="rp-glass">

                        {/* Step indicator */}
                        <div className="rp-steps">
                            <div className={`rp-step ${step === 'otp' ? 'active' : 'done'}`}>
                                {step === 'password'
                                    ? <><Icon name="check-circle" className="w-3.5 h-3.5" /> OTP</>
                                    : <>1. Nhập OTP</>
                                }
                            </div>
                            <div className={`rp-step-divider ${step === 'password' ? 'done' : ''}`} />
                            <div className={`rp-step ${step === 'password' ? 'active' : 'pending'}`}>
                                2. Mật khẩu mới
                            </div>
                        </div>

                        {/* ── Step 1: OTP ── */}
                        {step === 'otp' && (
                            <>
                                <div className="rp-icon-wrap">
                                    <Icon name="mail" className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="rp-h">Nhập mã OTP</h2>
                                <p className="rp-sub">
                                    Nhập mã 6 chữ số đã gửi đến<br />
                                    <strong>{email || 'email của bạn'}</strong>
                                </p>

                                {error && (
                                    <div className="rp-alert">
                                        <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleOtpNext} method="POST">
                                    {/* Email field — hiện nếu chưa có email từ param */}
                                    {!searchParams.get('email') && (
                                        <div className="rp-field">
                                            <label className="rp-label">Địa chỉ Email</label>
                                            <div className="rp-input-wrap">
                                                <Icon name="mail" className="rp-input-icon w-5 h-5" />
                                                <input
                                                    type="email" required className="rp-input"
                                                    placeholder="email@example.com"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="rp-field">
                                        <label className="rp-label" style={{ textAlign: 'center', display: 'block' }}>Mã OTP (6 chữ số)</label>
                                        <OtpInput value={otp} onChange={val => { setOtp(val); if (error) setError(''); }} />
                                    </div>

                                    <button type="submit" className="rp-submit">
                                        Tiếp theo <Icon name="arrow-right" className="w-4 h-4" />
                                    </button>

                                    <Link href="/forgot-password" className="rp-back">
                                        <Icon name="arrow-left" className="w-4 h-4" />
                                        Gửi lại mã OTP
                                    </Link>
                                </form>
                            </>
                        )}

                        {/* ── Step 2: New password ── */}
                        {step === 'password' && (
                            <>
                                <div className="rp-icon-wrap">
                                    <Icon name="lock" className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="rp-h">Đặt mật khẩu mới</h2>
                                <p className="rp-sub">Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>

                                {error && (
                                    <div className="rp-alert">
                                        <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} method="POST">
                                    {/* New password */}
                                    <div className="rp-field">
                                        <label className="rp-label">Mật khẩu mới</label>
                                        <div className="rp-input-wrap">
                                            <Icon name="lock" className="rp-input-icon w-5 h-5" />
                                            <input
                                                type={showPassword ? 'text' : 'password'} required
                                                className="rp-input pr" placeholder="Tạo mật khẩu mạnh"
                                                value={newPassword} onChange={handlePasswordChange}
                                            />
                                            <button type="button" className="rp-eye" onClick={() => setShowPassword(!showPassword)}>
                                                <Icon name={showPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Strength bars */}
                                        {newPassword && (
                                            <>
                                                <div className="rp-bars">
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} className={`rp-bar ${i <= passwordStrength ? `s${passwordStrength}` : ''}`} />
                                                    ))}
                                                </div>
                                                <div className="rp-criteria">
                                                    <p className="rp-criteria-title">Mật khẩu cần có</p>
                                                    <ul className="rp-criteria-list">
                                                        <PasswordCriterion met={passwordCriteria.length} text="≥ 8 ký tự" />
                                                        <PasswordCriterion met={passwordCriteria.lowercase} text="Chữ thường" />
                                                        <PasswordCriterion met={passwordCriteria.uppercase} text="Chữ hoa" />
                                                        <PasswordCriterion met={passwordCriteria.number} text="Chữ số" />
                                                        <PasswordCriterion met={passwordCriteria.specialChar} text="Ký tự đặc biệt" />
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Confirm password */}
                                    <div className="rp-field">
                                        <label className="rp-label">Xác nhận mật khẩu</label>
                                        <div className="rp-input-wrap">
                                            <Icon name="lock" className="rp-input-icon w-5 h-5" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'} required
                                                className="rp-input pr" placeholder="Nhập lại mật khẩu"
                                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                            <button type="button" className="rp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                                                <Icon name={showConfirm ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {confirmPassword && (
                                            <p className={`rp-match ${confirmPassword === newPassword ? 'ok' : 'no'}`}>
                                                <Icon name={confirmPassword === newPassword ? 'check-circle' : 'x-circle'} className="w-3.5 h-3.5" />
                                                {confirmPassword === newPassword ? 'Mật khẩu khớp' : 'Mật khẩu chưa khớp'}
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading} className="rp-submit">
                                        {loading
                                            ? <><div className="rp-spinner" /> Đang xử lý...</>
                                            : <><Icon name="check-circle" className="w-4 h-4" /> Đặt lại mật khẩu</>
                                        }
                                    </button>

                                    <button type="button" className="rp-back" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }} onClick={() => { setStep('otp'); setError(''); }}>
                                        <Icon name="arrow-left" className="w-4 h-4" />
                                        Quay lại nhập OTP
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    <p className="rp-footer">© {new Date().getFullYear()} SuniSVG. Bảo mật và An toàn.</p>
                </div>
            </div>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #bbf7d0', borderTopColor: '#16a34a', animation: 'spin .7s linear infinite' }} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}