'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { getClassesForUser } from '@/services/googleSheetService';
import type { Classroom } from '@/types';

/* ─── Palette & tokens ──────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  :root {
    --g1: #16a34a;   /* emerald-600  */
    --g2: #15803d;   /* emerald-700  */
    --g3: #bbf7d0;   /* emerald-100  */
    --o1: #f97316;   /* orange-500   */
    --o2: #ea580c;   /* orange-600   */
    --o3: #ffedd5;   /* orange-100   */
    --dark: #0f1a10;
    --card-bg: #ffffff;
    --muted: #6b7280;
    --border: #e5e7eb;
  }

  .cls-page * { font-family: 'DM Sans', sans-serif; }
  .cls-page h1, .cls-page h2, .cls-page h3, .cls-page .syne { font-family: 'Syne', sans-serif; }

  /* Background mesh */
  .cls-page {
    background: #f0fdf4;
    background-image:
      radial-gradient(ellipse 80% 60% at 5% 0%, #dcfce780 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 95% 100%, #ffedd580 0%, transparent 55%);
    min-height: 100vh;
  }

  /* Noise texture overlay */
  .cls-page::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: .5;
  }

  /* ── Hero ticker ── */
  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-inner { display: inline-flex; gap: 3rem; animation: ticker 20s linear infinite; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── Stat pill ── */
  .stat-pill {
    display: inline-flex; align-items: center; gap: .5rem;
    background: white; border: 1.5px solid var(--border);
    border-radius: 9999px; padding: .35rem 1rem;
    font-size: .8rem; font-weight: 600; color: #374151;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .stat-pill .dot { width: 8px; height: 8px; border-radius: 50%; }

  /* ── Action cards ── */
  .action-card {
    position: relative; overflow: hidden; border-radius: 20px;
    padding: 2.25rem; cursor: pointer; transition: transform .25s, box-shadow .25s;
    display: flex; flex-direction: column; gap: 1rem;
  }
  .action-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,.18); }
  .action-card .card-glow {
    position: absolute; width: 200px; height: 200px; border-radius: 50%;
    filter: blur(60px); opacity: .35; pointer-events: none;
    top: -40px; right: -40px;
  }
  .action-card-green { background: linear-gradient(135deg, var(--g1) 0%, #14532d 100%); color: white; }
  .action-card-orange { background: linear-gradient(135deg, var(--o1) 0%, #9a3412 100%); color: white; }
  .ac-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid rgba(255,255,255,.3);
  }
  .ac-arrow {
    margin-top: auto; display: inline-flex; align-items: center; gap: .4rem;
    font-size: .85rem; font-weight: 700; opacity: .85;
    transition: gap .2s, opacity .2s;
  }
  .action-card:hover .ac-arrow { gap: .75rem; opacity: 1; }

  /* ── Class cards ── */
  .class-card {
    background: white; border-radius: 20px; overflow: hidden;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 2px 12px rgba(0,0,0,.05);
    display: flex; flex-direction: column;
    transition: transform .25s, box-shadow .25s, border-color .25s;
    animation: fadeUp .45s ease both;
    text-decoration: none; color: inherit;
  }
  .class-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(22,163,74,.12);
    border-color: var(--g1);
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .class-card-stripe { height: 4px; }
  .class-card-body { padding: 1.5rem; flex: 1; }
  .class-card-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    padding: .3rem .75rem; border-radius: 9999px;
  }
  .class-card-name {
    font-family: 'Syne', sans-serif; font-size: 1.15rem;
    font-weight: 700; color: #111827; margin: .75rem 0 .4rem;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .class-card:hover .class-card-name { color: var(--g1); }
  .class-card-desc {
    font-size: .83rem; color: #6b7280; line-height: 1.6;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    min-height: 40px;
  }
  .class-card-footer {
    border-top: 1.5px solid #f3f4f6;
    padding: 1rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    background: #fafafa;
  }
  .cc-stat {
    display: flex; align-items: center; gap: .45rem;
    font-size: .78rem; font-weight: 600; color: #374151;
  }
  .cc-stat-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .class-card-cta {
    font-size: .75rem; font-weight: 700; color: var(--g1);
    display: flex; align-items: center; gap: .25rem;
    letter-spacing: .03em; text-transform: uppercase;
    transition: gap .2s;
  }
  .class-card:hover .class-card-cta { gap: .55rem; }

  /* ── Section heading ── */
  .sec-heading {
    display: flex; align-items: center; gap: .85rem; margin-bottom: 1.75rem;
  }
  .sec-heading-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    flex-shrink: 0;
  }
  .sec-heading h2 {
    font-size: 1.65rem; font-weight: 800; color: #111827;
  }
  .sec-heading p { font-size: .85rem; color: #6b7280; margin-top: .1rem; }

  /* ── Empty / auth states ── */
  .empty-state {
    text-align: center; padding: 5rem 2rem;
    background: white; border-radius: 24px;
    border: 2px dashed #d1fae5;
  }
  .empty-icon {
    width: 80px; height: 80px; margin: 0 auto 1.5rem;
    border-radius: 50%; background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    display: flex; align-items: center; justify-content: center;
  }
  .empty-state h3 { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #111827; margin-bottom: .5rem; }
  .empty-state p { color: #6b7280; max-width: 380px; margin: 0 auto 1.75rem; font-size: .9rem; }

  /* ── Buttons ── */
  .btn-green {
    display: inline-flex; align-items: center; gap: .5rem;
    background: var(--g1); color: white;
    font-weight: 700; font-size: .875rem;
    padding: .7rem 1.4rem; border-radius: 12px;
    transition: background .2s, transform .15s;
    text-decoration: none;
  }
  .btn-green:hover { background: var(--g2); transform: translateY(-1px); }
  .btn-orange {
    display: inline-flex; align-items: center; gap: .5rem;
    background: var(--o1); color: white;
    font-weight: 700; font-size: .875rem;
    padding: .7rem 1.4rem; border-radius: 12px;
    transition: background .2s, transform .15s;
    text-decoration: none;
  }
  .btn-orange:hover { background: var(--o2); transform: translateY(-1px); }

  /* ── Skeleton ── */
  .skeleton { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* ── Progress bar deco ── */
  .progress-bar-track { background: #e5e7eb; border-radius: 9999px; overflow: hidden; height: 4px; }
  .progress-bar-fill { height: 100%; border-radius: 9999px; transition: width .8s ease; }
`;

/* ─── Color map for cards ─────────────────────────────────────────────── */
const CARD_PALETTES = [
  { stripe: 'linear-gradient(90deg,#16a34a,#4ade80)', badge: { bg: '#dcfce7', color: '#15803d' }, iconBg: '#dcfce7', iconColor: '#16a34a' },
  { stripe: 'linear-gradient(90deg,#f97316,#fb923c)', badge: { bg: '#ffedd5', color: '#ea580c' }, iconBg: '#ffedd5', iconColor: '#f97316' },
  { stripe: 'linear-gradient(90deg,#059669,#34d399)', badge: { bg: '#d1fae5', color: '#065f46' }, iconBg: '#d1fae5', iconColor: '#059669' },
  { stripe: 'linear-gradient(90deg,#dc2626,#f87171)', badge: { bg: '#fee2e2', color: '#991b1b' }, iconBg: '#fee2e2', iconColor: '#dc2626' },
  { stripe: 'linear-gradient(90deg,#0d9488,#2dd4bf)', badge: { bg: '#ccfbf1', color: '#0f766e' }, iconBg: '#ccfbf1', iconColor: '#0d9488' },
  { stripe: 'linear-gradient(90deg,#7c3aed,#a78bfa)', badge: { bg: '#ede9fe', color: '#5b21b6' }, iconBg: '#ede9fe', iconColor: '#7c3aed' },
];

/* ─── ClassCard ───────────────────────────────────────────────────────── */
const ClassCard = React.memo(({ classroom, index }: { classroom: Classroom; index: number }) => {
  const p = CARD_PALETTES[index % CARD_PALETTES.length];
  const progress = Math.min(100, ((classroom.quizCount || 0) / 10) * 100);

  return (
    <Link
      href={`/classroom/${classroom.ClassID}`}
      className="class-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Stripe */}
      <div className="class-card-stripe" style={{ background: p.stripe }} />

      <div className="class-card-body">
        {/* Badge */}
        <span
          className="class-card-badge"
          style={{ background: p.badge.bg, color: p.badge.color }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.badge.color, display: 'inline-block' }} />
          {classroom.Subject}
        </span>

        {/* Name */}
        <div className="class-card-name">{classroom.ClassName}</div>

        {/* Desc */}
        <p className="class-card-desc">
          {classroom.Description || 'Chưa có mô tả cho lớp học này.'}
        </p>

        {/* Quiz progress mini */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#9ca3af', marginBottom: '.3rem' }}>
            <span>Tiến độ bài tập</span>
            <span style={{ fontWeight: 700, color: p.iconColor }}>{classroom.quizCount || 0} bài</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: p.stripe }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="class-card-footer">
        <div className="cc-stat">
          <div className="cc-stat-icon" style={{ background: '#dcfce7' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          {classroom.memberCount || 0} thành viên
        </div>

        <div className="cc-stat">
          <div className="cc-stat-icon" style={{ background: '#ffedd5' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          {classroom.quizCount || 0} bài tập
        </div>

        <span className="class-card-cta">
          Vào lớp
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </span>
      </div>
    </Link>
  );
});
ClassCard.displayName = 'ClassCard';

/* ─── Skeleton card ───────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
    <div className="skeleton" style={{ height: 4 }} />
    <div style={{ padding: '1.5rem' }}>
      <div className="skeleton" style={{ height: 22, width: '45%', borderRadius: 9999, marginBottom: '.75rem' }} />
      <div className="skeleton" style={{ height: 26, width: '80%', borderRadius: 8, marginBottom: '.5rem' }} />
      <div className="skeleton" style={{ height: 14, width: '95%', borderRadius: 8, marginBottom: '.35rem' }} />
      <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 8, marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 4, borderRadius: 9999 }} />
    </div>
    <div style={{ borderTop: '1.5px solid #f3f4f6', padding: '1rem 1.5rem', display: 'flex', gap: '1rem' }}>
      <div className="skeleton" style={{ height: 30, flex: 1, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 30, flex: 1, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 30, flex: 1, borderRadius: 8 }} />
    </div>
  </div>
);

/* ─── Ticker items ────────────────────────────────────────────────────── */
const TICKER_ITEMS = ['📚 Học tập hiệu quả', '🏆 Theo dõi tiến độ', '✏️ Tạo bài kiểm tra', '🚀 Quản lý lớp học', '📊 Thống kê học tập', '🎯 Đạt mục tiêu'];

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function ClassroomPage() {
  const { currentUser } = useAuth();
  const [myClasses, setMyClasses] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    const load = async () => {
      setIsLoading(true); setError(null);
      try {
        const classes = await getClassesForUser(currentUser.Email);
        setMyClasses(classes.sort((a, b) => String(a.ClassName || '').localeCompare(String(b.ClassName || ''))));
      } catch (err) {
        setError('Không thể tải danh sách lớp học của bạn.');
      } finally { setIsLoading(false); }
    };
    load();
  }, [currentUser]);

  const filtered = myClasses.filter(c =>
    !search || c.ClassName?.toLowerCase().includes(search.toLowerCase()) || c.Subject?.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = myClasses.reduce((s, c) => s + (c.memberCount || 0), 0);
  const totalQuizzes = myClasses.reduce((s, c) => s + (c.quizCount || 0), 0);

  return (
    <div className="cls-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 4rem', position: 'relative', zIndex: 1 }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          {/* Ticker */}
          <div className="ticker-wrap" style={{ marginBottom: '2.5rem', opacity: .65 }}>
            <div className="ticker-inner">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
                <span key={i} style={{ fontSize: '.78rem', fontWeight: 600, color: '#15803d', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              {/* Label pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: '#dcfce7', border: '1.5px solid #bbf7d0', borderRadius: 9999, padding: '.35rem 1rem', marginBottom: '1.25rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 3px #bbf7d0' }} />
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#15803d', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nền tảng học tập</span>
              </div>

              <h1 className="syne" style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 800, lineHeight: 1.1, color: '#0f1a10', marginBottom: '1rem' }}>
                Trung tâm<br />
                <span style={{ background: 'linear-gradient(90deg, #16a34a, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lớp học</span>
              </h1>

              <p style={{ fontSize: '1rem', color: '#4b5563', maxWidth: 480, lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Quản lý lớp học, tạo bài kiểm tra, theo dõi tiến độ học tập và kết nối cộng đồng giáo viên — học sinh hiệu quả.
              </p>

              {/* Stat pills */}
              {currentUser && !isLoading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
                  <span className="stat-pill"><span className="dot" style={{ background: '#16a34a' }} />{myClasses.length} lớp học</span>
                  <span className="stat-pill"><span className="dot" style={{ background: '#f97316' }} />{totalMembers} thành viên</span>
                  <span className="stat-pill"><span className="dot" style={{ background: '#7c3aed' }} />{totalQuizzes} bài tập</span>
                </div>
              )}
            </div>

            {/* Decorative orb */}
            <div style={{ display: 'none', position: 'relative' }} className="hero-orb">
              <div style={{
                width: 200, height: 200, borderRadius: '50%',
                background: 'linear-gradient(135deg, #16a34a22, #f9731622)',
                border: '2px solid #16a34a22',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 20px 60px rgba(22,163,74,.35)'
                }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ACTION CARDS ──────────────────────────────────────────────── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          <Link href="/classroom/create" className="action-card action-card-green" style={{ textDecoration: 'none' }}>
            <div className="card-glow" style={{ background: '#4ade80' }} />
            <div className="ac-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div className="syne" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.4rem' }}>Tạo lớp học mới</div>
              <div style={{ fontSize: '.85rem', opacity: .85, lineHeight: 1.6 }}>Thiết lập không gian học tập, mời học sinh và bắt đầu ngay hôm nay.</div>
            </div>
            <div className="ac-arrow">
              Bắt đầu ngay
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>

          <Link href="/classroom/join" className="action-card action-card-orange" style={{ textDecoration: 'none' }}>
            <div className="card-glow" style={{ background: '#fb923c' }} />
            <div className="ac-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="syne" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.4rem' }}>Tham gia lớp học</div>
              <div style={{ fontSize: '.85rem', opacity: .85, lineHeight: 1.6 }}>Dùng mã lớp để tham gia và học tập cùng giáo viên và bạn bè.</div>
            </div>
            <div className="ac-arrow">
              Tham gia ngay
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>

          <Link href="/classroom/explore" className="action-card" style={{ background: 'white', border: '2px solid #e5e7eb', textDecoration: 'none' }}>
            <div className="ac-icon" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <div className="syne" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.4rem', color: '#111827' }}>Khám phá lớp học</div>
              <div style={{ fontSize: '.85rem', color: '#6b7280', lineHeight: 1.6 }}>Tìm kiếm và khám phá các lớp học công khai từ cộng đồng.</div>
            </div>
            <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 700, color: '#16a34a' }}>
              Khám phá
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>
        </section>

        {/* ── MY CLASSES ────────────────────────────────────────────────── */}
        <section>
          {/* Heading row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="sec-heading" style={{ margin: 0 }}>
              <div className="sec-heading-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div>
                <h2>Các lớp học của tôi</h2>
                {myClasses.length > 0 && <p>Bạn đang tham gia {myClasses.length} lớp học</p>}
              </div>
            </div>

            {/* Search bar */}
            {currentUser && myClasses.length > 0 && (
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm lớp học..."
                  style={{
                    paddingLeft: '2.4rem', paddingRight: '1rem', paddingTop: '.55rem', paddingBottom: '.55rem',
                    border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '.85rem',
                    background: 'white', outline: 'none', width: 220,
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#16a34a')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>
            )}
          </div>

          {/* States */}
          {!currentUser ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Vui lòng đăng nhập</h3>
              <p>Bạn cần đăng nhập để xem và quản lý các lớp học của mình.</p>
              <Link href="/login" className="btn-green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Đăng nhập ngay
              </Link>
            </div>

          ) : isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>

          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#fff1f2', borderRadius: 20, border: '1.5px solid #fecdd3' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="syne" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#be123c', marginBottom: '.5rem' }}>Đã xảy ra lỗi</div>
              <p style={{ color: '#e11d48', fontSize: '.875rem' }}>{error}</p>
            </div>

          ) : filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
              {filtered.map((cls, i) => <ClassCard key={cls.ClassID} classroom={cls} index={i} />)}
            </div>

          ) : myClasses.length > 0 ? (
            /* No search results */
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3>Không tìm thấy lớp học</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc hiện tại.</p>
              <button onClick={() => setSearch('')} className="btn-green" style={{ border: 'none', cursor: 'pointer' }}>Xóa tìm kiếm</button>
            </div>

          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Chưa có lớp học nào</h3>
              <p>Hãy tạo một lớp học mới hoặc sử dụng mã để tham gia lớp học có sẵn.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/classroom/create" className="btn-green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Tạo lớp học
                </Link>
                <Link href="/classroom/join" className="btn-orange">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Tham gia lớp
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── BOTTOM FEATURE STRIP ──────────────────────────────────────── */}
        <section style={{ marginTop: '3.5rem', background: 'white', borderRadius: 20, border: '1.5px solid #e5e7eb', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1.5rem' }}>
          {[
            { icon: '📊', title: 'Thống kê thời gian thực', desc: 'Theo dõi tiến độ học tập chi tiết' },
            { icon: '🔔', title: 'Thông báo tức thì', desc: 'Cập nhật bài mới, điểm số ngay lập tức' },
            { icon: '🤝', title: 'Cộng tác nhóm', desc: 'Học và làm bài tập cùng nhau' },
            { icon: '🏆', title: 'Bảng thành tích', desc: 'Thi đua và ghi nhận nỗ lực' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <div style={{ fontSize: '1.75rem' }}>{f.icon}</div>
              <div className="syne" style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>{f.title}</div>
              <div style={{ fontSize: '.78rem', color: '#9ca3af', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}