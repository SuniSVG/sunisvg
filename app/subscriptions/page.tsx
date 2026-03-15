'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSubscriptionPlans, fetchUserSubscriptions, buySubscription } from '@/services/googleSheetService';
import type { SubscriptionPlan, UserSubscription } from '@/types';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Check, Zap, Shield, Crown, Loader2, Sparkles, ArrowRight, Flame, BookOpen, Gift, ChevronDown, Upload, ShoppingCart, Ticket, FileText, Star, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.floor(ease * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString()}</>;
};

// ─── Themes ───────────────────────────────────────────────────────────────────
const PLAN_ICONS = [BookOpen, Zap, Flame, Crown, Gift];
const PLAN_THEMES = [
  { gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', glow: 'rgba(34,197,94,.15)',  tint: '#f0fdf4', chip: '#15803d', tag: 'Khởi đầu'  },
  { gradient: 'linear-gradient(135deg,#f97316,#ea580c)', glow: 'rgba(249,115,22,.15)', tint: '#fff7ed', chip: '#c2410c', tag: 'Tiết kiệm' },
  { gradient: 'linear-gradient(135deg,#eab308,#d97706)', glow: 'rgba(234,179,8,.15)',  tint: '#fefce8', chip: '#a16207', tag: 'Phổ biến'  },
  { gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,.15)', tint: '#ecfdf5', chip: '#047857', tag: 'Chuyên gia' },
  { gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)', glow: 'rgba(244,63,94,.15)',  tint: '#fff1f2', chip: '#be123c', tag: 'Elite'     },
];

export default function SubscriptionsPage() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { addToast } = useToast();

  const [plans, setPlans]               = useState<SubscriptionPlan[]>([]);
  const [mySubs, setMySubs]             = useState<UserSubscription[]>([]);
  const [loading, setLoading]           = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId]       = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 260], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 260], [0, -28]);

  useEffect(() => {
    (async () => {
      try {
        const [plansData, subsData] = await Promise.all([
          fetchSubscriptionPlans(),
          currentUser ? fetchUserSubscriptions(currentUser.Email) : Promise.resolve([]),
        ]);
        setPlans(plansData);
        setMySubs(subsData);
      } catch {
        addToast('Không thể tải danh sách gói.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, addToast]);

  const handleBuy = async (plan: SubscriptionPlan) => {
    if (!currentUser)                          { addToast('Vui lòng đăng nhập để mua gói.', 'info');  return; }
    if ((currentUser.Money || 0) < plan.Price) { addToast('Số dư tài khoản không đủ.', 'error');       return; }
    if (!window.confirm(`Xác nhận mua "${plan.Title}" với giá ${plan.Price.toLocaleString()}đ?`)) return;

    setProcessingId(plan.ID);
    try {
      const result = await buySubscription(currentUser.Email, plan.ID);
      if (result.success) {
        addToast(`Đăng ký thành công! +${plan.Credits} lượt chọn khóa học.`, 'success');
        setMySubs(await fetchUserSubscriptions(currentUser.Email));
        refreshCurrentUser?.();
      } else {
        addToast(result.error || 'Giao dịch thất bại.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối đến máy chủ.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  /* ─── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#f0fdf4,#fff7ed)' }}>
        <style>{`
          @keyframes pr { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
          .pr { animation: pr 1.5s ease-out infinite; }
        `}</style>
        <div className="relative w-14 h-14 mb-4">
          <div className="pr absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(34,197,94,.4),transparent)' }} />
          <div className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#22c55e,#f97316)' }}>
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        </div>
        <p className="text-green-700 font-semibold text-xs tracking-widest uppercase">Đang tải...</p>
      </div>
    );
  }

  /* ─── Page ───────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sp  { font-family: 'DM Sans', sans-serif; }
        .df  { font-family: 'Syne', sans-serif; }

        /* dot grid background */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(34,197,94,.11) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        /* orb floats */
        @keyframes fl1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes fl2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .fl1 { animation: fl1 9s ease-in-out infinite; }
        .fl2 { animation: fl2 13s ease-in-out infinite reverse; }

        /* shimmer heading */
        @keyframes sh { 0%{background-position:-240% center} 100%{background-position:240% center} }
        .sh-text {
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 22%, #f97316 44%, #ea580c 66%, #22c55e 88%, #16a34a 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: sh 5s linear infinite;
        }

        /* blink dot */
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .blink { animation: blink 1.6s ease-in-out infinite; }

        /* badge pop — keeps translate(-50%) via left:50% on parent */
        @keyframes bp {
          0%  { transform: scale(0) rotate(-5deg); opacity: 0; }
          65% { transform: scale(1.07) rotate(1deg); opacity: 1; }
          100%{ transform: scale(1)   rotate(0deg); opacity: 1; }
        }
        .badge-pop { animation: bp .5s cubic-bezier(.34,1.56,.64,1) forwards; }

        /* orbit dot around crown */
        @keyframes orb {
          0%   { transform: rotate(0deg)   translateX(24px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(24px) rotate(-360deg); }
        }
        .orb-dot {
          position: absolute;
          width: 8px; height: 8px; border-radius: 50%;
          background: #f97316;
          box-shadow: 0 0 6px 2px rgba(249,115,22,.6);
          animation: orb 3s linear infinite;
          top: 50%; left: 50%;
          margin: -4px 0 0 -4px;
        }

        /* scan line on user banner */
        @keyframes scan {
          0%  { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100%{ transform: translateY(1000%); opacity: 0; }
        }
        .scan-line {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,197,94,.45), transparent);
          animation: scan 5s ease-in-out infinite;
          pointer-events: none;
        }

        /* button shine */
        .shine-btn {
          position: relative; overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .shine-btn::after {
          content: '';
          position: absolute; top: 0; left: -70%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
          transform: skewX(-16deg);
          transition: left .45s ease;
        }
        .shine-btn:hover::after { left: 125%; }
        .shine-btn:hover  { transform: translateY(-2px); }
        .shine-btn:active { transform: translateY(0); }

        /* card lift — pure CSS, no conflict with motion.div */
        .card-lift {
          transition: transform .3s cubic-bezier(.23,1,.32,1), box-shadow .3s ease;
          will-change: transform;
        }
        .card-lift:hover { transform: translateY(-6px); }

        /* info card hover */
        .info-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(0,0,0,.07) !important;
        }
      `}</style>

      <div className="sp min-h-screen relative overflow-x-hidden"
        style={{ background: 'linear-gradient(155deg,#f5fdf6 0%,#fbfffe 40%,#fffaf5 70%,#fff7ed 100%)' }}>

        {/* dot grid */}
        <div className="fixed inset-0 dot-grid pointer-events-none" style={{ opacity: .55 }} />

        {/* atmospheric orbs — overflow:hidden prevents scroll leak */}
        <div className="fixed inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
          <div className="fl1 absolute -top-36 -left-36 w-[480px] h-[480px] rounded-full"
            style={{ background: 'radial-gradient(circle at 40% 40%, rgba(34,197,94,.1) 0%, transparent 62%)' }} />
          <div className="fl2 absolute top-1/2 -right-36 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle at 60% 40%, rgba(249,115,22,.09) 0%, transparent 62%)' }} />
        </div>

        {/* ── page content centred, controlled max-width ── */}
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ════════════════════ HERO ════════════════════ */}
          <motion.div
            ref={heroRef}
            style={{ opacity: heroOpacity, y: heroY }}
            className="pt-14 pb-12 text-center"
          >
            {/* eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, scale: .9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-widest uppercase"
              style={{ background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.28)', color: '#c2410c' }}
            >
              <span className="blink w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#f97316' }} />
              Ưu đãi đang diễn ra
            </motion.div>

            {/* heading — clamp giữ trong 2.1–3rem, không tràn */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .6, delay: .1, ease: [.23,1,.32,1] }}
              className="df font-black leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)' }}
            >
              <span className="block text-gray-900">Gói Combo</span>
              <span className="sh-text block">Siêu Tiết Kiệm</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: .28 }}
              className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed mb-7"
            >
              Mua một lần — sở hữu vĩnh viễn bất kỳ khóa học nào.{' '}
              <span className="font-semibold text-green-700">Tiết kiệm đến 40% so với mua lẻ.</span>
            </motion.p>

            {/* stat chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .38 }}
              className="flex flex-wrap justify-center gap-2 mb-8"
            >
              {[
                { v: '200+',    l: 'Khóa học'  },
                { v: '12.000+', l: 'Học viên'  },
                { v: '40%',     l: 'Tiết kiệm' },
              ].map(s => (
                <div key={s.l}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 shadow-sm"
                  style={{ border: '1px solid rgba(34,197,94,.2)', backdropFilter: 'blur(6px)' }}>
                  <span className="df text-sm font-black text-green-700">{s.v}</span>
                  <span className="text-xs text-gray-400">{s.l}</span>
                </div>
              ))}
            </motion.div>

            {/* scroll cue */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .85 }}
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <span className="text-[9px] tracking-[.22em] uppercase font-medium">Xem các gói</span>
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.7 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ════════════════════ USER BANNER ════════════════════ */}
          <AnimatePresence>
            {currentUser && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="mb-9 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,rgba(240,253,244,.92),rgba(255,247,237,.92))',
                  border: '1.5px solid rgba(34,197,94,.22)',
                  boxShadow: '0 4px 24px rgba(34,197,94,.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="scan-line" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[.07] pointer-events-none"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#f97316)' }} />

                <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
                  <div className="flex items-center gap-4">
                    {/* crown + orbit */}
                    <div className="relative w-12 h-12 shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                        style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 5px 20px rgba(34,197,94,.28)' }}>
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div className="orb-dot" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Tài khoản của bạn</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="df text-2xl font-black"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          <AnimatedNumber value={currentUser.Credits_Left || 0} />
                        </span>
                        <span className="text-xs text-gray-500">lượt còn lại</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Số dư:&nbsp;<span className="font-bold text-orange-600">{(currentUser.Money || 0).toLocaleString()}đ</span>
                      </p>
                    </div>
                  </div>

                  <Link href="/courses"
                    className="shine-btn group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-xs shadow-md shrink-0"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 5px 20px rgba(34,197,94,.28)' }}>
                    Đổi khóa học ngay
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ════════════════════ PLANS GRID ════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-18 pb-4">
            {plans.map((plan, index) => {
              const isPopular    = plan.Color === 'orange';
              const th           = PLAN_THEMES[index % PLAN_THEMES.length];
              const PlanIcon     = PLAN_ICONS[index % PLAN_ICONS.length];
              const isProcessing = processingId === plan.ID;
              const isHov        = hoveredId === plan.ID;

              return (
                <motion.div
                  key={plan.ID}
                  initial={{ opacity: 0, y: 28, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * .09, duration: .5, ease: [.23,1,.32,1] }}
                  onMouseEnter={() => setHoveredId(plan.ID)}
                  onMouseLeave={() => setHoveredId(null)}
                  /* padding-top reserves space for the floating badge */
                  className={`relative ${isPopular ? 'pt-4' : ''}`}
                >
                  {/* popular badge — absolutely positioned relative to motion.div */}
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                      <span
                        className="badge-pop flex items-center gap-1 px-4 py-1 rounded-full text-[10px] font-black text-white whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 3px 12px rgba(249,115,22,.38)' }}
                      >
                        <Sparkles className="w-2.5 h-2.5" />PHỔ BIẾN NHẤT<Sparkles className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}

                  {/* ── card body: card-lift for hover, separate from motion ── */}
                  <div
                    className="card-lift rounded-2xl overflow-hidden flex flex-col h-full bg-white"
                    style={isPopular ? {
                      boxShadow: '0 0 0 2px #f97316, 0 12px 40px rgba(249,115,22,.13), 0 2px 8px rgba(0,0,0,.05)',
                    } : {
                      border: `1.5px solid ${isHov ? th.chip + '30' : 'rgba(0,0,0,.07)'}`,
                      boxShadow: isHov
                        ? `0 12px 40px ${th.glow}, 0 2px 8px rgba(0,0,0,.05)`
                        : '0 2px 12px rgba(0,0,0,.05)',
                    }}
                  >
                    {/* top color bar */}
                    <div className="h-[3px]" style={{ background: th.gradient }} />

                    {/* tinted header zone */}
                    <div className="px-5 pt-5 pb-4"
                      style={{ background: `linear-gradient(180deg,${th.tint} 0%,rgba(255,255,255,0) 100%)` }}>
                      <div className="flex items-start justify-between mb-3.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ background: th.gradient }}>
                          <PlanIcon className="w-[17px] h-[17px] text-white" />
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ background: th.tint, color: th.chip, border: `1px solid ${th.chip}26` }}>
                          {th.tag}
                        </span>
                      </div>
                      <h3 className="df text-[15px] font-bold text-gray-900 mb-1">{plan.Title}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed min-h-[32px]">{plan.Description}</p>
                    </div>

                    <div className="px-5 pb-5 flex flex-col flex-1">
                      {/* price */}
                      <div className="pb-3.5 mb-3.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex items-end gap-1 mb-2">
                          <span className="df text-[2.2rem] font-black leading-none"
                            style={{ background: th.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {plan.Price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-400 pb-0.5">đ</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid rgba(34,197,94,.18)' }}>
                            <BookOpen className="w-2.5 h-2.5" />{plan.Credits} khóa học
                          </span>
                          {(plan.ValidityDays ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid rgba(249,115,22,.18)' }}>
                              <Zap className="w-2.5 h-2.5" />{plan.ValidityDays} ngày
                            </span>
                          )}
                        </div>
                      </div>

                      {/* features */}
                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.Features.map((feat, i) => {
                          let FeatIcon = Check;
                          const t = feat.toLowerCase();
                          if (t.includes('đóng góp') || t.includes('tải lên')) FeatIcon = Upload;
                          else if (t.includes('mua') || t.includes('bán') || t.includes('giao dịch')) FeatIcon = ShoppingCart;
                          else if (t.includes('voucher') || t.includes('ưu đãi') || t.includes('giảm giá')) FeatIcon = Ticket;
                          else if (t.includes('tài liệu') || t.includes('khóa học') || t.includes('đề thi')) FeatIcon = FileText;
                          else if (t.includes('vip') || t.includes('đặc quyền') || t.includes('premium')) FeatIcon = Star;
                          else if (t.includes('header') || t.includes('tiêu đề') || t.includes('giao diện')) FeatIcon = LayoutTemplate;

                          return (
                            <motion.li key={i}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * .06 + i * .03 }}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-0.5 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
                                style={{ background: th.gradient }}>
                                <FeatIcon className="w-2 h-2 text-white" strokeWidth={3} />
                              </span>
                              <span className="text-[11px] text-gray-600 leading-snug">{feat}</span>
                            </motion.li>
                          );
                        })}
                      </ul>

                      {/* cta button */}
                      <button
                        onClick={() => handleBuy(plan)}
                        disabled={!!processingId}
                        className="shine-btn w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: isPopular ? 'linear-gradient(135deg,#f97316,#ea580c)' : th.gradient,
                          boxShadow: `0 5px 18px ${th.glow}`,
                        }}
                      >
                        {isProcessing
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang xử lý...</>
                          : <><Zap className="w-3.5 h-3.5" />Đăng ký ngay</>
                        }
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ════════════════════ INFO CARDS ════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .6 }}
            className="mb-14"
          >
            <div className="text-center mb-7">
              <h2 className="df text-lg font-bold text-gray-900 mb-1">Cam kết của chúng tôi</h2>
              <p className="text-xs text-gray-400 tracking-wide">Minh bạch — Chất lượng — Tận tâm</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Shield,   title: 'Quyền lợi đảm bảo',   desc: 'Khóa học đổi từ Combo có đầy đủ quyền lợi như mua lẻ: sở hữu vĩnh viễn, cập nhật miễn phí.', accent: '#22c55e', tint: '#f0fdf4', border: 'rgba(34,197,94,.18)'  },
                { icon: BookOpen, title: 'Áp dụng mọi khóa học', desc: 'Dùng tín chỉ để đổi bất kỳ khóa học nào trên hệ thống, không phân biệt giá tiền gốc.',       accent: '#f97316', tint: '#fff7ed', border: 'rgba(249,115,22,.18)' },
                { icon: Zap,      title: 'Kích hoạt tức thì',    desc: 'Tín chỉ được cộng ngay sau thanh toán. Không chờ đợi, không xét duyệt thủ công.',             accent: '#eab308', tint: '#fefce8', border: 'rgba(234,179,8,.18)'  },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * .08 }}
                  className="info-card bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm"
                  style={{ border: `1.5px solid ${item.border}` }}
                >
                  <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10 pointer-events-none"
                    style={{ background: item.accent }} />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: item.tint, border: `1px solid ${item.border}` }}>
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.accent }} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs mb-1.5">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ════════════════════ FOOTER ════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="pb-14 text-center"
          >
            <p className="text-[11px] text-gray-400 flex flex-wrap items-center justify-center gap-1.5">
              <span>Cần hỗ trợ?</span>
              <a href="/contact"
                className="font-semibold text-green-600 hover:text-orange-500 transition-colors underline underline-offset-2 decoration-dotted">
                Liên hệ ngay
              </a>
              <span>·</span>
              <span>Phản hồi trong 24 giờ làm việc</span>
            </p>
          </motion.div>

        </div>
      </div>
    </>
  );
}