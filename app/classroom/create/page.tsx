'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { createClass } from '@/services/googleSheetService';

type ViewState = 'form' | 'success';

interface SuccessData {
    classId: string;
    joinCode: string;
    className: string;
    subject: string;
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .cc-page * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .cc-page .syne { font-family: 'Syne', sans-serif; }

  .cc-page {
    min-height: 100vh;
    background: #f0fdf4;
    background-image:
      radial-gradient(ellipse 70% 50% at 0% 0%, #dcfce780 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 100% 100%, #ffedd580 0%, transparent 55%);
  }

  /* ── Back link ── */
  .cc-back {
    display: inline-flex; align-items: center; gap: .45rem;
    font-size: .82rem; font-weight: 600; color: #16a34a;
    text-decoration: none; margin-bottom: 1.75rem;
    padding: .4rem .85rem; border-radius: 9999px;
    background: #dcfce7; border: 1.5px solid #bbf7d0;
    transition: background .2s, transform .15s;
  }
  .cc-back:hover { background: #bbf7d0; transform: translateX(-2px); }

  /* ── Card shell ── */
  .cc-card {
    background: white;
    border-radius: 24px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 4px 32px rgba(22,163,74,.08), 0 1px 4px rgba(0,0,0,.04);
    overflow: hidden;
  }

  /* ── Card top stripe ── */
  .cc-stripe {
    height: 5px;
    background: linear-gradient(90deg, #16a34a 0%, #4ade80 50%, #f97316 100%);
  }

  /* ── Header block ── */
  .cc-header {
    padding: 2rem 2rem 0;
    display: flex; align-items: flex-start; gap: 1.1rem;
  }
  .cc-header-icon {
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    background: linear-gradient(135deg, #16a34a, #15803d);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 18px rgba(22,163,74,.3);
  }

  /* ── Step indicator ── */
  .cc-steps {
    display: flex; align-items: center; gap: .5rem;
    padding: 1.25rem 2rem 0;
  }
  .cc-step {
    display: flex; align-items: center; gap: .4rem;
    font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    color: #9ca3af;
  }
  .cc-step.active { color: #16a34a; }
  .cc-step.done { color: #16a34a; }
  .cc-step-dot {
    width: 22px; height: 22px; border-radius: 50%;
    background: #e5e7eb; display: flex; align-items: center; justify-content: center;
    font-size: .65rem; font-weight: 800;
  }
  .cc-step.active .cc-step-dot { background: #16a34a; color: white; box-shadow: 0 0 0 3px #bbf7d0; }
  .cc-step.done .cc-step-dot { background: #16a34a; color: white; }
  .cc-step-line { flex: 1; height: 2px; background: #e5e7eb; border-radius: 9999px; }
  .cc-step-line.done { background: #16a34a; }

  /* ── Form body ── */
  .cc-body { padding: 1.5rem 2rem 2rem; }

  /* ── Field group ── */
  .cc-field { margin-bottom: 1.35rem; }
  .cc-label {
    display: block; font-size: .8rem; font-weight: 700;
    color: #374151; margin-bottom: .45rem; letter-spacing: .02em;
  }
  .cc-required { color: #f97316; margin-left: .2rem; }
  .cc-hint { font-size: .72rem; color: #9ca3af; font-weight: 400; margin-left: .4rem; }

  .cc-input, .cc-textarea {
    width: 100%; padding: .75rem 1rem;
    border: 1.5px solid #e5e7eb; border-radius: 12px;
    font-size: .9rem; color: #111827; background: #fafafa;
    outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
    font-family: 'DM Sans', sans-serif;
    resize: none;
  }
  .cc-input::placeholder, .cc-textarea::placeholder { color: #9ca3af; }
  .cc-input:focus, .cc-textarea:focus {
    border-color: #16a34a; background: white;
    box-shadow: 0 0 0 3px rgba(22,163,74,.12);
  }
  .cc-input.has-value, .cc-textarea.has-value { border-color: #4ade80; }

  /* ── Input wrapper with icon ── */
  .cc-input-wrap { position: relative; }
  .cc-input-wrap .cc-input { padding-left: 2.65rem; }
  .cc-input-icon {
    position: absolute; left: .85rem; top: 50%; transform: translateY(-50%);
    pointer-events: none; transition: color .2s;
  }
  .cc-input-wrap:focus-within .cc-input-icon { color: #16a34a; }

  /* ── Character count ── */
  .cc-char-count {
    font-size: .7rem; color: #9ca3af; text-align: right; margin-top: .3rem;
  }

  /* ── Subject suggestions ── */
  .cc-suggestions {
    display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .6rem;
  }
  .cc-pill {
    font-size: .72rem; font-weight: 600; padding: .25rem .7rem;
    border-radius: 9999px; border: 1.5px solid #e5e7eb;
    background: white; color: #6b7280; cursor: pointer;
    transition: all .15s;
  }
  .cc-pill:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
  .cc-pill.selected { border-color: #16a34a; color: #15803d; background: #dcfce7; }

  /* ── Preview card ── */
  .cc-preview {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1.5px solid #bbf7d0;
    border-radius: 14px; padding: 1.1rem 1.25rem;
    margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 1rem;
  }
  .cc-preview-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #16a34a, #4ade80);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(22,163,74,.25);
  }
  .cc-preview-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: .95rem; color: #111827; }
  .cc-preview-subject {
    display: inline-flex; align-items: center; gap: .3rem;
    font-size: .72rem; font-weight: 700; color: #15803d;
    background: white; border: 1.5px solid #bbf7d0;
    border-radius: 9999px; padding: .18rem .6rem; margin-top: .25rem;
  }

  /* ── Public toggle ── */
  .cc-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.1rem; border-radius: 14px;
    border: 1.5px solid #e5e7eb; background: #fafafa;
    cursor: pointer; transition: border-color .2s, background .2s;
    margin-bottom: 1.35rem;
  }
  .cc-toggle-row:hover { border-color: #16a34a; background: #f0fdf4; }
  .cc-toggle-row.on { border-color: #16a34a; background: #f0fdf4; }
  .cc-toggle-left { display: flex; align-items: center; gap: .75rem; }
  .cc-toggle-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: #e5e7eb; transition: background .2s;
  }
  .cc-toggle-row.on .cc-toggle-icon { background: #dcfce7; }
  .cc-toggle-title { font-size: .88rem; font-weight: 700; color: #111827; }
  .cc-toggle-desc { font-size: .75rem; color: #9ca3af; margin-top: .1rem; }
  .cc-toggle-row.on .cc-toggle-desc { color: #16a34a; }
  .cc-toggle-track {
    width: 44px; height: 24px; border-radius: 9999px;
    background: #d1d5db; position: relative; flex-shrink: 0;
    transition: background .25s;
  }
  .cc-toggle-track.on { background: #16a34a; }
  .cc-toggle-thumb {
    width: 18px; height: 18px; border-radius: 50%; background: white;
    position: absolute; top: 3px; left: 3px;
    box-shadow: 0 1px 4px rgba(0,0,0,.2);
    transition: transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .cc-toggle-track.on .cc-toggle-thumb { transform: translateX(20px); }
  .cc-preview-public {
    display: inline-flex; align-items: center; gap: .3rem;
    font-size: .68rem; font-weight: 700; color: #f97316;
    background: #fff7ed; border: 1.5px solid #fed7aa;
    border-radius: 9999px; padding: .15rem .55rem; margin-left: .4rem;
  }

  /* ── Submit button ── */
  .cc-submit {
    width: 100%; padding: .9rem; border-radius: 14px; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800;
    color: white; letter-spacing: .03em;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    box-shadow: 0 4px 18px rgba(22,163,74,.35);
    display: flex; align-items: center; justify-content: center; gap: .6rem;
    transition: transform .2s, box-shadow .2s, opacity .2s;
    position: relative; overflow: hidden;
  }
  .cc-submit::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .cc-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(22,163,74,.4); }
  .cc-submit:active:not(:disabled) { transform: translateY(0); }
  .cc-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Spinner ── */
  .cc-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,.35);
    border-top-color: white;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══════════════════ SUCCESS VIEW ══════════════════ */
  .su-page {
    min-height: 100vh;
    background: #f0fdf4;
    background-image: radial-gradient(ellipse 80% 60% at 50% 0%, #dcfce780 0%, transparent 60%);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 3rem 1.5rem 4rem;
  }
  .su-card {
    width: 100%; max-width: 520px;
    background: white; border-radius: 28px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 8px 48px rgba(22,163,74,.1);
    overflow: hidden;
    animation: su-pop .45s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes su-pop { from { opacity: 0; transform: scale(.92) translateY(20px); } to { opacity: 1; transform: none; } }

  .su-stripe { height: 5px; background: linear-gradient(90deg, #16a34a, #4ade80, #f97316); }

  .su-top {
    padding: 2.5rem 2rem 1.5rem; text-align: center;
    background: linear-gradient(180deg, #f0fdf4 0%, white 100%);
  }
  .su-badge {
    width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1.25rem;
    background: linear-gradient(135deg, #16a34a, #4ade80);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(22,163,74,.35), 0 0 0 8px #dcfce7;
    animation: su-badge-in .55s .2s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes su-badge-in { from { transform: scale(0); } to { transform: scale(1); } }

  .su-body { padding: 0 2rem 2rem; }

  .su-code-block {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 2px solid #bbf7d0; border-radius: 16px;
    padding: 1.5rem; text-align: center; margin-bottom: 1.25rem;
  }
  .su-code-label { font-size: .72rem; font-weight: 700; color: #15803d; letter-spacing: .08em; text-transform: uppercase; margin-bottom: .75rem; }
  .su-code-digits {
    font-family: 'Syne', sans-serif;
    font-size: 2.8rem; font-weight: 800; letter-spacing: .25em;
    color: #0f1a10; line-height: 1;
    display: flex; justify-content: center; gap: .4rem; margin-bottom: 1rem;
  }
  .su-code-digit {
    width: 52px; height: 64px; border-radius: 12px;
    background: white; border: 1.5px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(22,163,74,.1);
  }
  .su-copy-btn {
    display: inline-flex; align-items: center; gap: .45rem;
    font-size: .8rem; font-weight: 700; color: #15803d;
    background: white; border: 1.5px solid #bbf7d0; border-radius: 9999px;
    padding: .4rem 1rem; cursor: pointer; transition: all .15s;
  }
  .su-copy-btn:hover { background: #dcfce7; border-color: #16a34a; }

  .su-link-block {
    background: #fff7ed; border: 1.5px solid #fed7aa;
    border-radius: 14px; padding: 1.1rem; margin-bottom: 1.5rem;
  }
  .su-link-label { font-size: .72rem; font-weight: 700; color: #ea580c; letter-spacing: .05em; text-transform: uppercase; margin-bottom: .5rem; }
  .su-link-row {
    display: flex; align-items: center; gap: .5rem;
    background: white; border: 1.5px solid #fed7aa; border-radius: 10px; padding: .5rem .75rem;
  }
  .su-link-text { font-size: .78rem; color: #ea580c; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .su-link-copy {
    background: none; border: none; cursor: pointer; padding: .25rem; border-radius: 6px;
    color: #ea580c; flex-shrink: 0; transition: background .15s;
  }
  .su-link-copy:hover { background: #ffedd5; }

  /* ── Action buttons ── */
  .su-btn-primary {
    width: 100%; padding: .85rem; border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: .95rem; font-weight: 800;
    color: white; background: linear-gradient(135deg, #16a34a, #15803d);
    box-shadow: 0 4px 14px rgba(22,163,74,.3);
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    transition: transform .2s, box-shadow .2s; margin-bottom: .65rem;
    text-decoration: none;
  }
  .su-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,.35); }

  .su-btn-secondary {
    width: 100%; padding: .85rem; border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: .95rem; font-weight: 800;
    color: white; background: linear-gradient(135deg, #f97316, #ea580c);
    box-shadow: 0 4px 14px rgba(249,115,22,.3);
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    transition: transform .2s, box-shadow .2s; margin-bottom: .65rem;
    text-decoration: none;
  }
  .su-btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,.35); }

  .su-btn-ghost {
    width: 100%; padding: .8rem; border: 1.5px solid #e5e7eb; border-radius: 12px; cursor: pointer;
    font-size: .9rem; font-weight: 600; color: #6b7280; background: white;
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    transition: border-color .15s, color .15s; text-decoration: none;
  }
  .su-btn-ghost:hover { border-color: #9ca3af; color: #374151; }

  /* ── Tips ── */
  .su-tips {
    background: #f9fafb; border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 1.25rem;
  }
  .su-tips-title { font-size: .75rem; font-weight: 700; color: #374151; margin-bottom: .6rem; letter-spacing: .03em; }
  .su-tip { display: flex; align-items: center; gap: .5rem; font-size: .78rem; color: #6b7280; margin-bottom: .35rem; }
  .su-tip-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }
`;

const SUBJECTS = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý', 'GDCD', 'Tin học'];

/* ─── SVG icons inline ──────────────────────────────────────────────────── */
const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const TagIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CheckIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.41"/>
  </svg>
);
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

/* ─── Success View ────────────────────────────────────────────────────── */
function SuccessView({ successData, onReset, router, addToast }: {
  successData: SuccessData;
  onReset: () => void;
  router: ReturnType<typeof useRouter>;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const digits = successData.joinCode.split('');
  const link = typeof window !== 'undefined' ? `${window.location.origin}/classroom/join?code=${successData.joinCode}` : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(successData.joinCode);
    setCopiedCode(true);
    addToast('Đã sao chép mã tham gia!', 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast('Đã sao chép link!', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="su-page">
        <div className="su-card">
          <div className="su-stripe" />

          <div className="su-top">
            <div className="su-badge">
              <CheckIcon size={36} />
            </div>
            <div className="syne" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f1a10', marginBottom: '.4rem' }}>
              Tạo lớp thành công!
            </div>
            <p style={{ fontSize: '.875rem', color: '#6b7280' }}>
              Lớp học <strong style={{ color: '#111827' }}>{successData.className}</strong> · {successData.subject} đã sẵn sàng
            </p>
          </div>

          <div className="su-body">
            {/* Code block */}
            <div className="su-code-block">
              <div className="su-code-label">🔑 Mã tham gia lớp</div>
              <div className="su-code-digits">
                {digits.map((d, i) => (
                  <div key={i} className="su-code-digit">{d}</div>
                ))}
              </div>
              <button className="su-copy-btn" onClick={handleCopyCode}>
                <CopyIcon />
                {copiedCode ? 'Đã sao chép!' : 'Sao chép mã'}
              </button>
              <p style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: '.65rem' }}>
                Chia sẻ mã này cho học sinh để họ tham gia lớp học
              </p>
            </div>

            {/* Link block */}
            <div className="su-link-block">
              <div className="su-link-label">🔗 Link tham gia nhanh</div>
              <div className="su-link-row">
                <span className="su-link-text">{link}</span>
                <button className="su-link-copy" onClick={handleCopyLink} title="Sao chép link">
                  {copiedLink
                    ? <CheckIcon size={14} />
                    : <CopyIcon />
                  }
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="su-tips">
              <div className="su-tips-title">💡 Gợi ý tiếp theo</div>
              <div className="su-tip"><span className="su-tip-dot" />Chia sẻ mã hoặc link cho học sinh qua Zalo, Messenger</div>
              <div className="su-tip"><span className="su-tip-dot" />Vào lớp học để tạo bài kiểm tra và quản lý thành viên</div>
              <div className="su-tip"><span className="su-tip-dot" />Theo dõi tiến độ học tập của từng học sinh</div>
            </div>

            {/* CTAs */}
            <button className="su-btn-primary" onClick={() => router.push(`/classroom/${successData.classId}`)}>
              <ArrowRight />
              Vào lớp học ngay
            </button>
            <button className="su-btn-secondary" onClick={onReset}>
              <RefreshIcon />
              Tạo thêm lớp học
            </button>
            <Link href="/classroom" className="su-btn-ghost">
              <HomeIcon />
              Về danh sách lớp học
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Form View ──────────────────────────────────────────────────── */
export default function CreateClassPage() {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ className: '', subject: '', description: '', isPublic: false });
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectPill = (s: string) => {
    setFormData(prev => ({ ...prev, subject: prev.subject === s ? '' : s }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { addToast('Bạn cần đăng nhập để tạo lớp học.', 'info'); router.push('/login'); return; }
    if (!formData.className.trim() || !formData.subject.trim()) { addToast('Tên lớp và môn học không được để trống.', 'error'); return; }
    setIsLoading(true);
    try {
      const result = await createClass(formData, currentUser.Email);
      if (result.success && result.classId && result.joinCode) {
        setSuccessData({ classId: result.classId, joinCode: result.joinCode, className: formData.className, subject: formData.subject });
        setViewState('success');
        addToast(`Tạo lớp học "${formData.className}" thành công!`, 'success');
      } else {
        addToast(result.error || 'Tạo lớp học thất bại. Vui lòng thử lại.', 'error');
      }
    } catch (error: any) {
      addToast(`Lỗi hệ thống: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ className: '', subject: '', description: '', isPublic: false });
    setSuccessData(null);
    setViewState('form');
  };

  if (viewState === 'success' && successData) {
    return <SuccessView successData={successData} onReset={handleReset} router={router} addToast={addToast} />;
  }

  const isFormReady = formData.className.trim() && formData.subject.trim();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cc-page" style={{ padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>

          {/* Back */}
          <Link href="/classroom" className="cc-back">
            <ArrowLeft />
            Quay lại lớp học
          </Link>

          <div className="cc-card">
            {/* Top stripe */}
            <div className="cc-stripe" />

            {/* Header */}
            <div className="cc-header">
              <div className="cc-header-icon">
                <BookIcon />
              </div>
              <div>
                <h1 className="syne" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f1a10', margin: 0 }}>Tạo lớp học mới</h1>
                <p style={{ fontSize: '.85rem', color: '#6b7280', margin: '.3rem 0 0' }}>Thiết lập không gian học tập của bạn chỉ trong vài bước</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="cc-steps">
              <div className="cc-step active">
                <div className="cc-step-dot">1</div>
                <span>Thông tin</span>
              </div>
              <div className="cc-step-line" />
              <div className="cc-step">
                <div className="cc-step-dot">2</div>
                <span>Xác nhận</span>
              </div>
              <div className="cc-step-line" />
              <div className="cc-step">
                <div className="cc-step-dot">3</div>
                <span>Hoàn tất</span>
              </div>
            </div>

            <div className="cc-body">
              {/* Live preview */}
              {(formData.className || formData.subject) && (
                <div className="cc-preview">
                  <div className="cc-preview-icon">
                    <BookIcon />
                  </div>
                  <div>
                    <div className="cc-preview-name">{formData.className || 'Tên lớp học...'}</div>
                    {formData.subject && (
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.3rem', marginTop: '.25rem' }}>
                        <div className="cc-preview-subject">
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                          {formData.subject}
                        </div>
                        {formData.isPublic && (
                          <span className="cc-preview-public">
                            🌍 Công khai
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Class name */}
                <div className="cc-field">
                  <label className="cc-label" htmlFor="className">
                    Tên lớp học <span className="cc-required">*</span>
                  </label>
                  <div className="cc-input-wrap">
                    <span className="cc-input-icon"><EditIcon /></span>
                    <input
                      id="className" name="className" type="text"
                      placeholder="Ví dụ: Lớp 12A1 – Ôn thi Toán"
                      required autoFocus
                      value={formData.className}
                      onChange={handleChange}
                      maxLength={80}
                      className={`cc-input${formData.className ? ' has-value' : ''}`}
                    />
                  </div>
                  <div className="cc-char-count">{formData.className.length}/80</div>
                </div>

                {/* Subject */}
                <div className="cc-field">
                  <label className="cc-label" htmlFor="subject">
                    Môn học <span className="cc-required">*</span>
                    <span className="cc-hint">— hoặc chọn gợi ý</span>
                  </label>
                  <div className="cc-input-wrap">
                    <span className="cc-input-icon"><TagIcon /></span>
                    <input
                      id="subject" name="subject" type="text"
                      placeholder="Ví dụ: Toán học, Tiếng Anh..."
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className={`cc-input${formData.subject ? ' has-value' : ''}`}
                    />
                  </div>
                  <div className="cc-suggestions">
                    {SUBJECTS.map(s => (
                      <button
                        key={s} type="button"
                        className={`cc-pill${formData.subject === s ? ' selected' : ''}`}
                        onClick={() => handleSubjectPill(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="cc-field">
                  <label className="cc-label" htmlFor="description">
                    Mô tả <span style={{ fontSize: '.72rem', color: '#9ca3af', fontWeight: 400 }}>(tùy chọn)</span>
                  </label>
                  <textarea
                    id="description" name="description" rows={3}
                    placeholder="Mô tả mục tiêu, nội dung hoặc yêu cầu của lớp học..."
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={300}
                    className={`cc-textarea${formData.description ? ' has-value' : ''}`}
                  />
                  <div className="cc-char-count">{formData.description.length}/300</div>
                </div>

                {/* Public toggle */}
                <div
                  className={`cc-toggle-row${formData.isPublic ? ' on' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  role="switch" aria-checked={formData.isPublic} tabIndex={0}
                  onKeyDown={e => e.key === ' ' && setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                >
                  <div className="cc-toggle-left">
                    <div className="cc-toggle-icon">
                      {formData.isPublic
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      }
                    </div>
                    <div>
                      <div className="cc-toggle-title">Công khai lớp học</div>
                      <div className="cc-toggle-desc">
                        {formData.isPublic
                          ? '🌍 Lớp học hiển thị công khai, ai cũng có thể tìm thấy'
                          : '🔒 Chỉ những người có mã mới có thể tham gia'}
                      </div>
                    </div>
                  </div>
                  <div className={`cc-toggle-track${formData.isPublic ? ' on' : ''}`}>
                    <div className="cc-toggle-thumb" />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6', margin: '1rem 0 1.35rem' }} />

                {/* Submit */}
                <button type="submit" className="cc-submit" disabled={isLoading || !isFormReady}>
                  {isLoading
                    ? <><div className="cc-spinner" />Đang tạo lớp học...</>
                    : <><ArrowRight />Tạo lớp học</>
                  }
                </button>

                {/* Note */}
                <p style={{ textAlign: 'center', fontSize: '.72rem', color: '#9ca3af', marginTop: '.85rem' }}>
                  Sau khi tạo, bạn sẽ nhận được mã tham gia để chia sẻ với học sinh.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}