'use client';

import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .nf-root {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
        }

        /* Animated gradient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          pointer-events: none;
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #ea580c 0%, transparent 70%);
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          bottom: -100px; right: -100px;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #0ea5e9 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.2;
        }

        /* Noise texture overlay */
        .noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* Grid lines */
        .grid-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* Card */
        .card {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 3rem 2.5rem;
          max-width: 480px;
          width: 90%;
        }

        /* Giant 404 */
        .giant-404 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(120px, 20vw, 180px);
          font-weight: 800;
          line-height: 0.9;
          letter-spacing: -6px;
          background: linear-gradient(135deg, #ea580c 0%, #f97316 30%, #fb923c 60%, #fdba74 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0;
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          position: relative;
        }

        .giant-404::after {
          content: '404';
          position: absolute;
          inset: 0;
          font-family: 'Syne', sans-serif;
          font-size: inherit;
          font-weight: 800;
          letter-spacing: inherit;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 1px rgba(234, 88, 12, 0.15);
          transform: translate(3px, 3px);
          z-index: -1;
        }

        /* Divider line */
        .divider {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #ea580c, #fb923c);
          border-radius: 99px;
          margin: 1.5rem auto;
          opacity: 0;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }

        /* Heading */
        .heading {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0.75rem;
          letter-spacing: -0.5px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
        }

        /* Subtext */
        .subtext {
          font-size: 0.95rem;
          font-weight: 300;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 2.5rem;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards;
        }

        /* CTA Button */
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #ea580c, #f97316);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 999px;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4);
          opacity: 0;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
        }

        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          border-radius: inherit;
        }

        .cta-btn::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, #ea580c, #7c3aed);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .cta-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 0 40px rgba(234, 88, 12, 0.5), 0 8px 20px rgba(0,0,0,0.3);
        }

        .cta-btn:hover::after {
          opacity: 1;
        }

        .cta-btn:active {
          transform: translateY(0) scale(0.99);
        }

        /* Secondary link */
        .secondary-link {
          display: block;
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #475569;
          text-decoration: none;
          opacity: 0;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards;
          transition: color 0.2s;
        }
        .secondary-link:hover { color: #94a3b8; }

        /* Floating particles */
        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #f97316;
          opacity: 0;
          animation: float var(--dur) ease-in-out var(--delay) infinite;
        }

        @keyframes float {
          0% { opacity: 0; transform: translateY(100vh) scale(0); }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-20px) scale(1.5); }
        }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Status badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          background: rgba(234, 88, 12, 0.1);
          border: 1px solid rgba(234, 88, 12, 0.2);
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 500;
          color: #fb923c;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1rem;
          opacity: 0;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f97316;
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <div className="nf-root">
        {/* Background elements */}
        <div
          className="orb orb-1"
          style={mounted ? {
            transform: `translate(${(mousePos.x - 50) * 0.15}px, ${(mousePos.y - 50) * 0.15}px)`
          } : {}}
        />
        <div
          className="orb orb-2"
          style={mounted ? {
            transform: `translate(${(mousePos.x - 50) * -0.1}px, ${(mousePos.y - 50) * -0.1}px)`
          } : {}}
        />
        <div className="orb orb-3" />
        <div className="grid-lines" />
        <div className="noise" />

        {/* Floating particles */}
        <div className="particles">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${8 + i * 8}%`,
                '--dur': `${4 + (i % 4)}s`,
                '--delay': `${i * 0.5}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Main card */}
        <div className="card">
          <div className="status-badge">
            <span className="status-dot" />
            Lỗi 404
          </div>

          <h2 className="heading">Không tìm thấy trang</h2>
          <p className="subtext">
            Trang bạn đang tìm kiếm không tồn tại,<br />
            đã bị di chuyển hoặc đổi tên.
          </p>

          <Link href="/" className="cta-btn">
            <Icon name="arrow-left" className="w-4 h-4" />
            Về trang chủ
          </Link>

          <button onClick={() => window.history.back()} className="secondary-link bg-transparent border-none cursor-pointer w-full">
            ← Quay lại trang trước
          </button>
        </div>
      </div>
    </>
  );
}