    'use client';

    import React, { useState, useEffect } from 'react';
    import Link from 'next/link';
    import { useRouter } from 'next/navigation';
    import { useAuth } from '@/contexts/AuthContext';
    import { Icon } from '@/components/shared/Icon';

    // ─── Sub-components ──────────────────────────────────────────────────────────

    const PasswordCriterion: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
        <li className={`flex items-center text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
            <Icon name={met ? 'check-circle' : 'x-circle'} className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${met ? 'text-green-500' : 'text-gray-300'}`} />
            {text}
        </li>
    );

    const BenefitCard: React.FC<{ icon: string; title: string; description: string; highlight?: string }> = ({ icon, title, description, highlight }) => (
        <div className="rg-benefit-card">
            <div className="rg-benefit-icon">{icon}</div>
            <div>
                <h4 className="rg-benefit-title">
                    {title}
                    {highlight && <span className="rg-benefit-highlight">{highlight}</span>}
                </h4>
                <p className="rg-benefit-desc">{description}</p>
            </div>
        </div>
    );

    // ─── Main ─────────────────────────────────────────────────────────────────────

    export default function Register() {
        const [username, setUsername] = useState('');
        const [email, setEmail] = useState('');
        const [schoolName, setSchoolName] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [showPassword, setShowPassword] = useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);
        const [totalUsers, setTotalUsers] = useState(0);
        const [passwordCriteria, setPasswordCriteria] = useState({
            length: false, uppercase: false, lowercase: false, number: false, specialChar: false,
        });
        const { register } = useAuth();
        const router = useRouter();

        useEffect(() => {
            setTotalUsers(2500); // Sử dụng số tĩnh hoặc API đếm riêng để tránh tải nặng
        }, []);

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
            setPassword(e.target.value);
            validatePassword(e.target.value);
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
            if (!validatePassword(password)) { setError('Mật khẩu không đủ mạnh. Vui lòng đáp ứng tất cả các tiêu chí.'); return; }
            setLoading(true);
            const result = await (register as any)(username, email, password, schoolName);
            setLoading(false);
            if (result.success) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } else {
                setError(result.error || 'Đăng ký thất bại.');
            }
        };

        const allMet = Object.values(passwordCriteria).every(Boolean);
        const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;

        return (
            <>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                    .rg-root {
                        font-family: 'DM Sans', sans-serif;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 3rem 1rem;
                        position: relative;
                        overflow: hidden;
                        background: #f0fdf4;
                    }

                    /* Background */
                    .rg-root::before {
                        content: '';
                        position: fixed; inset: 0;
                        background:
                            radial-gradient(ellipse 70% 60% at 5% 0%, rgba(134,239,172,.35) 0%, transparent 60%),
                            radial-gradient(ellipse 50% 50% at 95% 100%, rgba(251,146,60,.2) 0%, transparent 60%),
                            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(187,247,208,.15) 0%, transparent 70%),
                            #f0fdf4;
                        pointer-events: none; z-index: 0;
                    }
                    .rg-root::after {
                        content: '';
                        position: fixed; inset: 0;
                        background-image: radial-gradient(circle, rgba(34,197,94,.08) 1px, transparent 1px);
                        background-size: 28px 28px;
                        pointer-events: none; z-index: 0;
                    }

                    .rg-inner {
                        position: relative; z-index: 1;
                        width: 100%; max-width: 1100px;
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 2rem;
                        align-items: start;
                    }
                    @media (min-width: 1024px) {
                        .rg-inner { grid-template-columns: 2fr 3fr; }
                    }

                    /* ── Left panel ── */
                    .rg-left {
                        background: linear-gradient(145deg, #166534 0%, #15803d 45%, #16a34a 75%, #0d9488 100%);
                        border-radius: 28px;
                        padding: 2.5rem;
                        position: sticky; top: 1.5rem;
                        box-shadow: 0 24px 60px rgba(22,101,52,.35), 0 4px 16px rgba(0,0,0,.1);
                        overflow: hidden;
                    }
                    .rg-left::before {
                        content: '';
                        position: absolute; top: -80px; right: -80px;
                        width: 250px; height: 250px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(251,146,60,.3), transparent 70%);
                        pointer-events: none;
                    }
                    .rg-left::after {
                        content: '';
                        position: absolute; bottom: -60px; left: -60px;
                        width: 200px; height: 200px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(134,239,172,.25), transparent 70%);
                        pointer-events: none;
                    }

                    .rg-offer-tag {
                        display: inline-flex; align-items: center; gap: .4rem;
                        background: linear-gradient(135deg, #f97316, #ea580c);
                        color: #fff; font-size: .7rem; font-weight: 800;
                        letter-spacing: .08em; text-transform: uppercase;
                        padding: .35rem .9rem; border-radius: 999px;
                        margin-bottom: 1.25rem;
                        box-shadow: 0 4px 14px rgba(234,88,12,.4);
                        animation: rg-pulse-badge 2s ease infinite;
                    }
                    @keyframes rg-pulse-badge {
                        0%,100% { transform: scale(1); }
                        50% { transform: scale(1.04); }
                    }

                    .rg-left-h {
                        font-family: 'Bricolage Grotesque', sans-serif;
                        font-size: 1.75rem; font-weight: 800;
                        color: #fff; line-height: 1.2;
                        margin-bottom: .75rem; letter-spacing: -.02em;
                        position: relative; z-index: 1;
                    }
                    .rg-left-sub {
                        color: rgba(209,250,229,.8); font-size: .9rem;
                        line-height: 1.6; margin-bottom: 1.75rem;
                        position: relative; z-index: 1;
                    }

                    /* Benefit cards */
                    .rg-benefits { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1.75rem; position: relative; z-index: 1; }
                    .rg-benefit-card {
                        display: flex; align-items: flex-start; gap: .875rem;
                        background: rgba(255,255,255,.1);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(255,255,255,.15);
                        border-radius: 16px; padding: 1rem 1.1rem;
                        transition: background .2s;
                    }
                    .rg-benefit-card:hover { background: rgba(255,255,255,.18); }
                    .rg-benefit-icon {
                        width: 44px; height: 44px; border-radius: 12px;
                        background: rgba(255,255,255,.95);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 1.4rem; flex-shrink: 0;
                        box-shadow: 0 4px 12px rgba(0,0,0,.12);
                    }
                    .rg-benefit-title { font-weight: 700; font-size: .9rem; color: #fff; margin-bottom: .2rem; }
                    .rg-benefit-highlight { margin-left: .4rem; color: #fde68a; font-size: .85rem; }
                    .rg-benefit-desc { font-size: .75rem; color: rgba(209,250,229,.8); line-height: 1.5; }

                    /* Social proof */
                    .rg-social {
                        background: rgba(255,255,255,.1);
                        border: 1px solid rgba(255,255,255,.15);
                        border-radius: 16px; padding: 1rem 1.1rem;
                        position: relative; z-index: 1;
                    }
                    .rg-social-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .4rem; }
                    .rg-social-label { color: rgba(209,250,229,.8); font-size: .8rem; font-weight: 500; }
                    .rg-social-count {
                        font-family: 'Bricolage Grotesque', sans-serif;
                        font-size: 1.5rem; font-weight: 800; color: #fde68a;
                    }
                    .rg-social-sub { font-size: .72rem; color: rgba(209,250,229,.65); margin-bottom: .75rem; }
                    .rg-avatars { display: flex; }
                    .rg-avatar {
                        width: 30px; height: 30px; border-radius: 50%;
                        border: 2px solid rgba(255,255,255,.4);
                        margin-left: -8px; background: linear-gradient(135deg, #4ade80, #16a34a);
                        display: flex; align-items: center; justify-content: center;
                        font-size: .6rem; font-weight: 800; color: #fff;
                    }
                    .rg-avatar:first-child { margin-left: 0; }
                    .rg-avatar-more {
                        background: rgba(255,255,255,.2); color: #fff;
                        font-size: .6rem; font-weight: 700;
                    }

                    /* ── Right panel (form) ── */
                    .rg-right {
                        background: rgba(255,255,255,.75);
                        backdrop-filter: blur(24px) saturate(180%);
                        -webkit-backdrop-filter: blur(24px) saturate(180%);
                        border: 1.5px solid rgba(255,255,255,.9);
                        border-radius: 28px;
                        padding: 2.5rem;
                        box-shadow: 0 8px 32px rgba(22,163,74,.08), 0 2px 8px rgba(0,0,0,.05),
                                    inset 0 1px 0 rgba(255,255,255,.9);
                    }

                    /* Mobile banner */
                    .rg-mobile-banner {
                        display: flex; align-items: center; gap: .75rem;
                        background: linear-gradient(135deg, #166534, #16a34a);
                        border-radius: 16px; padding: 1rem 1.25rem;
                        margin-bottom: 1.75rem;
                    }
                    @media (min-width: 1024px) { .rg-mobile-banner { display: none; } }
                    .rg-mobile-banner-text { font-weight: 700; font-size: .9rem; color: #fff; }
                    .rg-mobile-banner-sub { font-size: .75rem; color: rgba(209,250,229,.8); }

                    /* Form header */
                    .rg-form-head { text-align: center; margin-bottom: 2rem; }
                    .rg-logo-wrap {
                        width: 60px; height: 60px; border-radius: 18px;
                        background: linear-gradient(135deg, #16a34a, #15803d);
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 1rem;
                        box-shadow: 0 8px 24px rgba(22,163,74,.35);
                    }
                    .rg-form-h {
                        font-family: 'Bricolage Grotesque', sans-serif;
                        font-size: 1.75rem; font-weight: 800;
                        color: #0f2419; letter-spacing: -.02em;
                        margin-bottom: .4rem;
                    }
                    .rg-form-sub { font-size: .875rem; color: #6b7f72; }
                    .rg-form-sub a { color: #16a34a; font-weight: 700; text-decoration: none; }
                    .rg-form-sub a:hover { text-decoration: underline; }

                    /* Error */
                    .rg-error {
                        background: #fef2f2; border-left: 3px solid #ef4444;
                        border-radius: 12px; padding: .875rem 1rem;
                        display: flex; align-items: center; gap: .5rem;
                        font-size: .85rem; color: #dc2626; font-weight: 500;
                        margin-bottom: 1.25rem;
                    }

                    /* Fields */
                    .rg-field { margin-bottom: 1.1rem; }
                    .rg-label {
                        display: block; font-size: .78rem; font-weight: 700;
                        color: #3d5a45; margin-bottom: .5rem;
                        letter-spacing: .01em;
                    }
                    .rg-input {
                        width: 100%; padding: .85rem 1rem;
                        border: 1.5px solid #e5e7eb; border-radius: 14px;
                        font-size: .9rem; color: #0f2419;
                        background: rgba(255,255,255,.8);
                        font-family: 'DM Sans', sans-serif;
                        transition: border-color .2s, box-shadow .2s;
                        outline: none;
                    }
                    .rg-input:focus {
                        border-color: #22c55e;
                        box-shadow: 0 0 0 3px rgba(34,197,94,.12);
                    }
                    .rg-input::placeholder { color: #c4d1c8; }
                    .rg-input-wrap { position: relative; }
                    .rg-eye {
                        position: absolute; right: .875rem; top: 50%;
                        transform: translateY(-50%);
                        color: #9ca3af; cursor: pointer; background: none; border: none;
                        display: flex; align-items: center;
                        transition: color .2s;
                    }
                    .rg-eye:hover { color: #3d5a45; }

                    /* Password strength */
                    .rg-strength-wrap { margin-top: .75rem; }
                    .rg-strength-bars {
                        display: flex; gap: .3rem; margin-bottom: .6rem;
                    }
                    .rg-strength-bar {
                        height: 4px; flex: 1; border-radius: 99px;
                        background: #e5e7eb;
                        transition: background .3s;
                    }
                    .rg-strength-bar.active-1 { background: #ef4444; }
                    .rg-strength-bar.active-2 { background: #f97316; }
                    .rg-strength-bar.active-3 { background: #eab308; }
                    .rg-strength-bar.active-4 { background: #22c55e; }
                    .rg-strength-bar.active-5 { background: #16a34a; }

                    .rg-criteria {
                        background: #f8faf8; border: 1px solid #e9f5ec;
                        border-radius: 12px; padding: .875rem 1rem;
                    }
                    .rg-criteria-title { font-size: .7rem; font-weight: 800; color: #6b7f72; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .6rem; }
                    .rg-criteria-list { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; list-style: none; padding: 0; margin: 0; }

                    /* Submit button */
                    .rg-submit {
                        width: 100%; padding: 1rem;
                        border: none; border-radius: 14px; cursor: pointer;
                        font-family: 'DM Sans', sans-serif;
                        font-size: .95rem; font-weight: 700;
                        color: #fff;
                        background: linear-gradient(135deg, #16a34a, #15803d);
                        box-shadow: 0 8px 24px rgba(22,163,74,.35);
                        display: flex; align-items: center; justify-content: center; gap: .5rem;
                        transition: transform .2s, box-shadow .2s, opacity .2s;
                        margin-top: 1.5rem;
                    }
                    .rg-submit:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 32px rgba(22,163,74,.45);
                    }
                    .rg-submit:active:not(:disabled) { transform: translateY(0); }
                    .rg-submit:disabled { opacity: .6; cursor: not-allowed; }

                    /* Spinner */
                    .rg-spinner {
                        width: 18px; height: 18px; border-radius: 50%;
                        border: 2.5px solid rgba(255,255,255,.3);
                        border-top-color: #fff;
                        animation: rg-spin .7s linear infinite;
                    }
                    @keyframes rg-spin { to { transform: rotate(360deg); } }

                    /* Terms */
                    .rg-terms { text-align: center; font-size: .73rem; color: #9ca3af; margin-top: 1rem; }
                    .rg-terms a { color: #16a34a; font-weight: 600; text-decoration: none; }
                    .rg-terms a:hover { text-decoration: underline; }
                `}</style>

                <div className="rg-root">
                    <div className="rg-inner">

                        {/* ── Left: Benefits ── */}
                        <div className="hidden lg:block">
                            <div className="rg-left">
                                <div className="rg-offer-tag">🎉 Ưu đãi đặc biệt</div>
                                <h3 className="rg-left-h">Đăng ký ngay<br />hôm nay!</h3>
                                <p className="rg-left-sub">Trở thành thành viên và nhận ngay những quyền lợi hấp dẫn.</p>

                                <div className="rg-benefits">
                                    <BenefitCard icon="💰" title="Thưởng 50.000đ" highlight="MIỄN PHÍ" description="Nhận ngay vào tài khoản khi hoàn tất đăng ký và xác thực email." />
                                    <BenefitCard icon="📚" title="Tài liệu Premium" description="Truy cập không giới hạn hàng ngàn tài liệu chất lượng cao độc quyền." />
                                    <BenefitCard icon="🎓" title="Quản lý lớp học" description="Tạo và quản lý lớp học với giao diện trực quan, công cụ hiện đại." />
                                </div>

                                <div className="rg-social">
                                    <div className="rg-social-top">
                                        <span className="rg-social-label">Đã có</span>
                                        <span className="rg-social-count">{totalUsers > 0 ? totalUsers.toLocaleString('vi-VN') : '2,000'}+</span>
                                    </div>
                                    <p className="rg-social-sub">người dùng tin tưởng và đăng ký</p>
                                    <div className="rg-avatars">
                                        {['H','D','T','M','L'].map((l, i) => (
                                            <div key={i} className="rg-avatar">{l}</div>
                                        ))}
                                        <div className="rg-avatar rg-avatar-more">+2K</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Form ── */}
                        <div className="rg-right">
                            {/* Mobile banner */}
                            <div className="rg-mobile-banner">
                                <span style={{ fontSize: '1.75rem' }}>🎁</span>
                                <div>
                                    <div className="rg-mobile-banner-text">Nhận ngay 50.000đ + Tài liệu Premium</div>
                                    <div className="rg-mobile-banner-sub">Khi đăng ký tài khoản thành công</div>
                                </div>
                            </div>

                            {/* Header */}
                            <div className="rg-form-head">
                                <div className="rg-logo-wrap">
                                    <Icon name="logo" className="h-7 w-7 text-white" />
                                </div>
                                <h2 className="rg-form-h">Tạo tài khoản mới</h2>
                                <p className="rg-form-sub">
                                    Hoặc <Link href="/login">đăng nhập</Link> nếu đã có tài khoản
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} noValidate method="POST">
                                {error && (
                                    <div className="rg-error">
                                        <Icon name="alert-circle" className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Username */}
                                <div className="rg-field">
                                    <label htmlFor="username" className="rg-label">Tên tài khoản</label>
                                    <input
                                        id="username" type="text" required
                                        className="rg-input"
                                        placeholder="Nhập tên tài khoản của bạn"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>

                                {/* School Name */}
                                <div className="rg-field">
                                    <label htmlFor="schoolName" className="rg-label">Tên trường</label>
                                    <input
                                        id="schoolName" type="text" required
                                        className="rg-input"
                                        placeholder="Nhập tên trường của bạn"
                                        value={schoolName}
                                        onChange={e => setSchoolName(e.target.value)}
                                    />
                                </div>

                                {/* Email */}
                                <div className="rg-field">
                                    <label htmlFor="email" className="rg-label">Email</label>
                                    <input
                                        id="email" type="email" autoComplete="email" required
                                        className="rg-input"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password */}
                                <div className="rg-field">
                                    <label htmlFor="password" className="rg-label">Mật khẩu</label>
                                    <div className="rg-input-wrap">
                                        <input
                                            id="password" type={showPassword ? 'text' : 'password'} required
                                            className="rg-input" style={{ paddingRight: '2.75rem' }}
                                            placeholder="Tạo mật khẩu mạnh"
                                            value={password}
                                            onChange={handlePasswordChange}
                                        />
                                        <button type="button" className="rg-eye" onClick={() => setShowPassword(!showPassword)}>
                                            <Icon name={showPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Strength bars */}
                                    {password && (
                                        <div className="rg-strength-wrap">
                                            <div className="rg-strength-bars">
                                                {[1,2,3,4,5].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`rg-strength-bar ${i <= passwordStrength ? `active-${passwordStrength}` : ''}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="rg-criteria">
                                                <p className="rg-criteria-title">Mật khẩu cần có</p>
                                                <ul className="rg-criteria-list">
                                                    <PasswordCriterion met={passwordCriteria.length} text="≥ 8 ký tự" />
                                                    <PasswordCriterion met={passwordCriteria.lowercase} text="Chữ thường (a-z)" />
                                                    <PasswordCriterion met={passwordCriteria.uppercase} text="Chữ hoa (A-Z)" />
                                                    <PasswordCriterion met={passwordCriteria.number} text="Chữ số (0-9)" />
                                                    <PasswordCriterion met={passwordCriteria.specialChar} text="Ký tự đặc biệt" />
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="rg-field">
                                    <label htmlFor="confirm-password" className="rg-label">Xác nhận mật khẩu</label>
                                    <div className="rg-input-wrap">
                                        <input
                                            id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} required
                                            className="rg-input" style={{ paddingRight: '2.75rem' }}
                                            placeholder="Nhập lại mật khẩu"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                        <button type="button" className="rg-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {/* Match indicator */}
                                    {confirmPassword && (
                                        <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${confirmPassword === password ? 'text-green-600' : 'text-red-500'}`}>
                                            <Icon name={confirmPassword === password ? 'check-circle' : 'x-circle'} className="w-3.5 h-3.5" />
                                            {confirmPassword === password ? 'Mật khẩu khớp' : 'Mật khẩu chưa khớp'}
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={loading} className="rg-submit">
                                    {loading ? (
                                        <><div className="rg-spinner" /> Đang xử lý...</>
                                    ) : (
                                        <><span>🎁</span> Đăng ký ngay — Nhận 50.000đ</>
                                    )}
                                </button>

                                <p className="rg-terms">
                                    Bằng việc đăng ký, bạn đồng ý với{' '}
                                    <Link href="/policy/terms">Điều khoản dịch vụ</Link> và{' '}
                                    <Link href="/policy/privacy">Chính sách bảo mật</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
    }