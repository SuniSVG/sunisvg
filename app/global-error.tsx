'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/Icon';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    console.error('Global Error:', error);
    setTimeout(() => setVisible(true), 100);
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3500);
    return () => clearInterval(glitchInterval);
  }, [error]);

  return (
    <html lang="vi">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <style>{`
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            92% { opacity: 1; }
            93% { opacity: 0.4; }
            94% { opacity: 1; }
            96% { opacity: 0.6; }
            97% { opacity: 1; }
          }
          @keyframes noise {
            0%, 100% { clip-path: inset(0 0 98% 0); }
            10% { clip-path: inset(30% 0 50% 0); }
            20% { clip-path: inset(10% 0 85% 0); }
            30% { clip-path: inset(60% 0 20% 0); }
            40% { clip-path: inset(80% 0 5% 0); }
            50% { clip-path: inset(45% 0 40% 0); }
            60% { clip-path: inset(5% 0 90% 0); }
            70% { clip-path: inset(70% 0 15% 0); }
            80% { clip-path: inset(20% 0 70% 0); }
            90% { clip-path: inset(55% 0 30% 0); }
          }
          @keyframes glitchShift {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-3px, 1px); }
            40% { transform: translate(3px, -1px); }
            60% { transform: translate(-2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 0.8; }
            70% { transform: scale(1.15); opacity: 0; }
            100% { transform: scale(0.9); opacity: 0; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .glitch-text {
            position: relative;
          }
          .glitch-text::before,
          .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0; left: 0; right: 0;
            overflow: hidden;
          }
          .glitch-active .glitch-text::before {
            animation: noise 0.15s steps(1) forwards;
            color: #ff3b3b;
            left: 2px;
          }
          .glitch-active .glitch-text::after {
            animation: noise 0.15s steps(1) 0.05s forwards;
            color: #00e5ff;
            left: -2px;
          }
          .scanline {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(transparent, rgba(255,80,80,0.08), transparent);
            animation: scanline 4s linear infinite;
            pointer-events: none;
            z-index: 100;
          }
          .card-appear {
            animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .pulse-ring {
            animation: pulse-ring 2s ease-out infinite;
          }
          .cursor-blink {
            animation: blink 1s step-end infinite;
          }
          .btn-reset {
            position: relative;
            overflow: hidden;
            transition: all 0.2s ease;
          }
          .btn-reset::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
            opacity: 0;
            transition: opacity 0.2s;
          }
          .btn-reset:hover::before { opacity: 1; }
          .btn-reset:active { transform: scale(0.97); }
        `}</style>

        <div className="scanline" />

        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            backgroundImage: `
              radial-gradient(ellipse 60% 50% at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 80% 80%, rgba(239,68,68,0.06) 0%, transparent 60%),
              repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px)
            `,
            fontFamily: "'Space Mono', monospace",
            padding: '1rem',
            animation: 'flicker 8s ease-in-out infinite',
          }}
        >
          {visible && (
            <div
              className={`card-appear ${glitch ? 'glitch-active' : ''}`}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(15, 15, 20, 0.95)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '4px',
                padding: '2.5rem',
                boxShadow: `
                  0 0 0 1px rgba(220,38,38,0.1),
                  0 25px 50px rgba(0,0,0,0.6),
                  0 0 80px rgba(220,38,38,0.05),
                  inset 0 1px 0 rgba(255,255,255,0.05)
                `,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Top bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['#ff5f57','#febc2e','#28c840'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                  SYSTEM_CRASH.LOG
                </span>
              </div>

              {/* Icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <div className="pulse-ring" style={{
                    position: 'absolute', inset: '-8px',
                    border: '1px solid rgba(220,38,38,0.4)',
                    borderRadius: '50%',
                  }} />
                  <div style={{
                    width: 64, height: 64,
                    background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.4)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(220,38,38,0.2)',
                  }}>
<Icon name="alert-triangle" className="w-7 h-7 text-red-500" />                  </div>
                </div>
              </div>

              {/* Error code */}
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  color: 'rgba(239,68,68,0.6)',
                  textTransform: 'uppercase',
                  fontFamily: "'Space Mono', monospace",
                }}>
                  ERR_SYSTEM_FAILURE · {error.digest ?? '0x00E4F'}
                </span>
              </div>

              {/* Heading */}
              <h2
                className="glitch-text"
                data-text="Đã xảy ra lỗi hệ thống"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#f5f5f5',
                  textAlign: 'center',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                Đã xảy ra lỗi hệ thống
              </h2>

              {/* Description */}
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                textAlign: 'center',
                marginBottom: '2rem',
                lineHeight: 1.7,
                fontFamily: "'Space Mono', monospace",
              }}>
                Trình duyệt không thể tải tài nguyên cần thiết.<br />
                Vui lòng tải lại để đồng bộ hóa.<span className="cursor-blink" style={{ color: 'rgba(239,68,68,0.6)', marginLeft: 2 }}>▌</span>
              </p>

              {/* Error message (if any) */}
              {error.message && (
                <div style={{
                  background: 'rgba(220,38,38,0.05)',
                  border: '1px solid rgba(220,38,38,0.15)',
                  borderRadius: '3px',
                  padding: '10px 12px',
                  marginBottom: '1.5rem',
                  fontSize: '11px',
                  color: 'rgba(239,68,68,0.5)',
                  fontFamily: "'Space Mono', monospace",
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                }}>
                  <span style={{ color: 'rgba(239,68,68,0.3)', marginRight: 8 }}>&gt;</span>
                  {error.message}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-reset"
                  onClick={reset}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.35)',
                    borderRadius: '3px',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    fontFamily: "'Space Mono', monospace",
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  Thử lại
                </button>
                <button
                  className="btn-reset"
                  onClick={() => window.location.reload()}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: 'rgba(239,68,68,0.85)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    borderRadius: '3px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    fontFamily: "'Space Mono', monospace",
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.25)',
                  }}
                >
                  Tải lại trang
                </button>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                  {new Date().toISOString().replace('T', ' ').slice(0, 19)}
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                  v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
                </span>
              </div>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}