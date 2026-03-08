'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { joinClass } from '@/services/googleSheetService';

/* ─── Styles ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .jc-page * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .jc-page .syne { font-family: 'Syne', sans-serif; }

  .jc-page {
    min-height: 100vh;
    background: #f0fdf4;
    background-image:
      radial-gradient(ellipse 70% 55% at 10% 0%, #dcfce778 0%, transparent 55%),
      radial-gradient(ellipse 55% 45% at 90% 100%, #ffedd578 0%, transparent 55%);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 2.5rem 1.5rem 4rem;
  }

  .jc-wrap { width: 100%; max-width: 460px; }

  /* ── Back ── */
  .jc-back {
    display: inline-flex; align-items: center; gap: .45rem;
    font-size: .82rem; font-weight: 600; color: #16a34a;
    text-decoration: none; margin-bottom: 1.75rem;
    padding: .4rem .85rem; border-radius: 9999px;
    background: #dcfce7; border: 1.5px solid #bbf7d0;
    transition: background .2s, transform .15s;
  }
  .jc-back:hover { background: #bbf7d0; transform: translateX(-2px); }

  /* ── Card ── */
  .jc-card {
    background: white; border-radius: 28px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 8px 40px rgba(22,163,74,.09), 0 2px 8px rgba(0,0,0,.04);
    overflow: hidden;
    animation: jcPop .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes jcPop { from { opacity: 0; transform: scale(.95) translateY(16px); } to { opacity: 1; transform: none; } }

  .jc-stripe { height: 5px; background: linear-gradient(90deg, #16a34a 0%, #4ade80 50%, #f97316 100%); }

  /* ── Header ── */
  .jc-header {
    padding: 2.25rem 2.25rem 0; text-align: center;
  }
  .jc-icon-ring {
    width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 1.25rem;
    background: linear-gradient(135deg, #16a34a, #4ade80);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 24px rgba(22,163,74,.3), 0 0 0 8px #dcfce7;
    animation: jcIconIn .5s .1s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes jcIconIn { from { transform: scale(0) rotate(-15deg); } to { transform: none; } }

  /* ── Code input ── */
  .jc-body { padding: 1.75rem 2.25rem 2.25rem; }

  .jc-label {
    display: block; font-size: .78rem; font-weight: 700; color: #374151;
    letter-spacing: .04em; text-transform: uppercase; margin-bottom: .6rem;
    text-align: center;
  }

  /* Individual digit boxes */
  .jc-code-wrap {
    display: flex; gap: .5rem; justify-content: center; margin-bottom: .5rem;
  }
  .jc-digit {
    width: 48px; height: 60px; border-radius: 14px;
    border: 2px solid #e5e7eb; background: #fafafa;
    font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800;
    color: #111827; text-align: center; outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s, transform .1s;
    caret-color: #16a34a; text-transform: uppercase;
  }
  .jc-digit:focus {
    border-color: #16a34a; background: white;
    box-shadow: 0 0 0 3px rgba(22,163,74,.15);
    transform: translateY(-2px);
  }
  .jc-digit.filled { border-color: #4ade80; background: #f0fdf4; color: #15803d; }
  .jc-digit.error  { border-color: #f87171; background: #fff1f2; color: #dc2626; animation: jcShake .4s; }
  @keyframes jcShake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-5px); }
    40%,80%  { transform: translateX(5px); }
  }

  /* Hidden real input (fallback for paste) */
  .jc-hidden-input {
    position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px;
  }

  .jc-hint { font-size: .75rem; color: #9ca3af; text-align: center; margin-bottom: 1.5rem; }

  /* ── Paste strip ── */
  .jc-paste-strip {
    display: flex; align-items: center; gap: .6rem; justify-content: center;
    margin-bottom: 1.5rem;
  }
  .jc-paste-btn {
    font-size: .75rem; font-weight: 600; color: #f97316;
    background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 9999px;
    padding: .3rem .85rem; cursor: pointer; transition: all .15s;
  }
  .jc-paste-btn:hover { background: #ffedd5; border-color: #f97316; }

  /* ── Submit ── */
  .jc-submit {
    width: 100%; padding: .95rem; border: none; border-radius: 14px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: white;
    background: linear-gradient(135deg, #16a34a, #15803d);
    box-shadow: 0 4px 18px rgba(22,163,74,.35);
    display: flex; align-items: center; justify-content: center; gap: .6rem;
    transition: transform .2s, box-shadow .2s, opacity .2s;
    position: relative; overflow: hidden; letter-spacing: .02em;
  }
  .jc-submit::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .jc-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(22,163,74,.45); }
  .jc-submit:active:not(:disabled) { transform: translateY(0); }
  .jc-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Spinner ── */
  .jc-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,.35); border-top-color: white;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Progress dots ── */
  .jc-progress { display: flex; gap: .3rem; justify-content: center; margin-bottom: 1.5rem; }
  .jc-progress-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #e5e7eb; transition: background .2s, transform .2s;
  }
  .jc-progress-dot.filled { background: #16a34a; transform: scale(1.2); }

  /* ── Divider ── */
  .jc-divider {
    display: flex; align-items: center; gap: .75rem; margin: 1.5rem 0;
  }
  .jc-divider-line { flex: 1; height: 1px; background: #f3f4f6; }
  .jc-divider-text { font-size: .72rem; color: #9ca3af; font-weight: 600; }

  /* ── Footer links ── */
  .jc-footer { text-align: center; }
  .jc-footer p { font-size: .8rem; color: #9ca3af; margin-bottom: .4rem; }
  .jc-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }
  .jc-footer a:hover { text-decoration: underline; }

  /* ── Info box ── */
  .jc-info {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1.5px solid #bbf7d0; border-radius: 14px;
    padding: 1rem 1.1rem; margin-bottom: 1.5rem;
    display: flex; gap: .75rem; align-items: flex-start;
  }
  .jc-info p { font-size: .78rem; color: #15803d; line-height: 1.6; margin: 0; }

  /* ── Auto-filled banner ── */
  .jc-autofill {
    background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px;
    padding: .65rem 1rem; margin-bottom: 1.25rem;
    display: flex; align-items: center; gap: .5rem;
    font-size: .78rem; color: #ea580c; font-weight: 600;
    animation: jcSlideIn .3s ease;
  }
  @keyframes jcSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

  /* ── Guest banner ── */
  .jc-guest {
    background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px;
    padding: .75rem 1rem; margin-bottom: 1.25rem;
    display: flex; gap: .6rem; align-items: center; flex-wrap: wrap;
  }
  .jc-guest p { font-size: .78rem; color: #92400e; flex: 1; min-width: 160px; margin: 0; }
  .jc-guest a {
    font-size: .75rem; font-weight: 700; color: white;
    background: #f97316; padding: .3rem .8rem; border-radius: 9999px;
    text-decoration: none; white-space: nowrap; transition: background .15s;
  }
  .jc-guest a:hover { background: #ea580c; }
`;

/* ─── SVGs ───────────────────────────────────────────────────────────── */
const UsersIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const ClipboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─── CODE_LENGTH ────────────────────────────────────────────────────── */
const CODE_LEN = 6;

/* ─── JoinClassContent ───────────────────────────────────────────────── */
function JoinClassContent() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const joinCode = digits.join('');
  const filledCount = digits.filter(d => d !== '').length;

  // Auto-fill from URL ?code=
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const clean = code.toUpperCase().slice(0, CODE_LEN);
      const arr = clean.split('').concat(Array(CODE_LEN).fill('')).slice(0, CODE_LEN);
      setDigits(arr);
      setAutoFilled(true);
    }
  }, [searchParams]);

  const handleDigitChange = (idx: number, val: string) => {
    setHasError(false);
    const char = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < CODE_LEN - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
        const next = [...digits]; next[idx - 1] = ''; setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < CODE_LEN - 1) {
      inputRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
    const arr = pasted.split('').concat(Array(CODE_LEN).fill('')).slice(0, CODE_LEN);
    setDigits(arr);
    setAutoFilled(false);
    setHasError(false);
    const lastFilled = Math.min(pasted.length, CODE_LEN - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
      const arr = clean.split('').concat(Array(CODE_LEN).fill('')).slice(0, CODE_LEN);
      setDigits(arr);
      setHasError(false);
    } catch { /* clipboard permission denied */ }
  };

  const handleJoin = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập để tham gia lớp học.', 'info');
      router.push('/login');
      return;
    }
    if (filledCount < CODE_LEN) {
      setHasError(true);
      addToast('Vui lòng nhập đủ mã tham gia.', 'error');
      inputRefs.current[filledCount]?.focus();
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      const result = await joinClass(joinCode, currentUser.Email);
      if (result.success) {
        addToast(result.message || `Tham gia lớp học thành công!`, 'success');
        if (result.details?.ClassID) {
          router.push(`/classroom/${result.details.ClassID}`);
        } else {
          router.push('/classroom');
        }
      } else {
        setHasError(true);
        addToast(result.error || 'Mã không hợp lệ. Vui lòng kiểm tra lại.', 'error');
      }
    } catch (error: any) {
      setHasError(true);
      addToast(`Lỗi hệ thống: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="jc-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="jc-wrap">
        {/* Back */}
        <Link href="/classroom" className="jc-back">
          <ArrowLeft />
          Quay lại lớp học
        </Link>

        <div className="jc-card">
          <div className="jc-stripe" />

          {/* Header */}
          <div className="jc-header">
            <div className="jc-icon-ring">
              <UsersIcon />
            </div>
            <h1 className="syne" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f1a10', margin: '0 0 .4rem' }}>
              Tham gia lớp học
            </h1>
            <p style={{ fontSize: '.875rem', color: '#6b7280', maxWidth: 300, margin: '0 auto' }}>
              Nhập mã 6 ký tự do giáo viên cung cấp để bắt đầu học tập.
            </p>
          </div>

          <div className="jc-body">
            {/* Guest warning */}
            {!currentUser && (
              <div className="jc-guest">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>Bạn cần đăng nhập để tham gia lớp học.</p>
                <Link href="/login">Đăng nhập</Link>
              </div>
            )}

            {/* Auto-filled notice */}
            {autoFilled && filledCount === CODE_LEN && (
              <div className="jc-autofill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Mã đã được điền tự động từ link tham gia
              </div>
            )}

            {/* Label */}
            <label className="jc-label">Mã tham gia lớp</label>

            {/* Digit boxes */}
            <div className="jc-code-wrap" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  className={`jc-digit${d ? ' filled' : ''}${hasError ? ' error' : ''}`}
                  type="text"
                  inputMode="text"
                  maxLength={2}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  autoFocus={i === 0}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="jc-progress">
              {digits.map((d, i) => (
                <div key={i} className={`jc-progress-dot${d ? ' filled' : ''}`} />
              ))}
            </div>

            <p className="jc-hint">
              {filledCount === 0 && 'Nhấp vào ô đầu tiên và bắt đầu nhập'}
              {filledCount > 0 && filledCount < CODE_LEN && `Còn ${CODE_LEN - filledCount} ký tự nữa`}
              {filledCount === CODE_LEN && '✓ Mã đã đủ, nhấn tham gia!'}
            </p>

            {/* Paste button */}
            <div className="jc-paste-strip">
              <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>Đã copy mã?</span>
              <button className="jc-paste-btn" type="button" onClick={handlePasteFromClipboard}>
                <ClipboardIcon />
                {' '}Dán từ clipboard
              </button>
            </div>

            {/* Info box */}
            <div className="jc-info">
              <InfoIcon />
              <p>Mã tham gia gồm <strong>6 ký tự</strong> chữ và số, được giáo viên cung cấp khi tạo lớp. Nếu chưa có mã, hãy liên hệ giáo viên của bạn.</p>
            </div>

            {/* Submit */}
            <button
              className="jc-submit"
              onClick={handleJoin}
              disabled={isLoading || filledCount < CODE_LEN}
            >
              {isLoading
                ? <><div className="jc-spinner" />Đang xử lý...</>
                : <><ArrowRight />Tham gia ngay</>
              }
            </button>

            {/* Divider + footer */}
            <div className="jc-divider">
              <div className="jc-divider-line" />
              <span className="jc-divider-text">hoặc</span>
              <div className="jc-divider-line" />
            </div>

            <div className="jc-footer">
              <p>Bạn là giáo viên? <Link href="/classroom/create">Tạo lớp học mới</Link></p>
              <p>Muốn tìm lớp học? <Link href="/classroom/explore">Khám phá lớp công khai</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page wrapper ───────────────────────────────────────────────────── */
export default function JoinClassPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 1rem',
            border: '3px solid #bbf7d0', borderTopColor: '#16a34a',
            animation: 'spin .7s linear infinite'
          }} />
          <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '.9rem' }}>Đang tải...</p>
        </div>
      </div>
    }>
      <JoinClassContent />
    </Suspense>
  );
}