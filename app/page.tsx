'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchCourses, purchasePremiumCategory, fetchPurchasedCategories } from '@/services/googleSheetService';
import type { Course } from '@/types';
import Image from 'next/image';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';

// ── Helpers for Radar Data (Shared logic) ──
const normalizeKey = (key: string) =>
  key.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const getField = (obj: any, fieldName: string): any => {
  if (!obj) return undefined;
  if (obj[fieldName] !== undefined) return obj[fieldName];
  const target = normalizeKey(fieldName);
  for (const key of Object.keys(obj)) {
    if (normalizeKey(key) === target) return obj[key];
  }
  return undefined;
};

const parseTieuChi = (raw: any): { label: string | null; value: number | null } => {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { label: null, value: null };
  }
  let str = String(raw).trim();

  if (str.startsWith('[') && str.endsWith(']')) {
    str = str.slice(1, -1).trim();
  }

  let label: string | null = null;
  let valStr = '';

  const match = str.match(/^(.*?)[\s,;:-]+(\d+(?:\.\d+)?)$/);

  if (match) {
    label = match[1].trim();
    valStr = match[2];
  } else {
    if (/^\d+(?:\.\d+)?$/.test(str)) {
      valStr = str;
    } else {
      const lastNum = str.match(/(\d+(?:\.\d+)?)$/);
      if (lastNum) {
        valStr = lastNum[1];
        label = str.substring(0, str.lastIndexOf(valStr)).trim().replace(/[\s,;:-]+$/, '');
      } else {
        return { label: str, value: null };
      }
    }
  }

  const n = parseFloat(valStr);
  let value: number | null = null;
  if (!isNaN(n)) {
    if (n === 0) value = 0;
    else if (n <= 10) value = Math.round(n * 10);
    else value = Math.min(100, Math.round(n));
  }
  return { label, value };
};

const DepositModal = dynamic(() => import('@/components/DepositModal').then(mod => mod.DepositModal), { ssr: false });

/* ─────────────────────────────────────────────
   Inline styles (scoped via className prefix)
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

  :root {
    --g-50:  #f0fdf4;
    --g-100: #dcfce7;
    --g-200: #bbf7d0;
    --g-300: #86efac;
    --g-400: #4ade80;
    --g-500: #22c55e;
    --g-600: #16a34a;
    --g-700: #15803d;
    --g-900: #14532d;
    --glass-bg:    rgba(255,255,255,0.55);
    --glass-bg-2:  rgba(255,255,255,0.35);
    --glass-bd:    rgba(255,255,255,0.75);
    --glass-bd-2:  rgba(255,255,255,0.45);
    --shadow-glass: 0 8px 32px rgba(22,163,74,0.10), 0 2px 8px rgba(0,0,0,0.06);
    --shadow-card:  0 4px 16px rgba(22,163,74,0.08), 0 1px 4px rgba(0,0,0,0.04);
  }

  .hm-wrap { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Page background ── */
  .hm-bg {
    min-height: calc(100vh - 64px);
    background:
      radial-gradient(ellipse 80% 60% at 10% 0%,   rgba(134,239,172,.28) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 100%,  rgba(34,197,94,.18)  0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 50% 50%,   rgba(187,247,208,.12) 0%, transparent 70%),
      #f8faf9;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 2.5rem 1rem 3rem;
  }

  /* ── Dot grid texture ── */
  .hm-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, rgba(34,197,94,.12) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  .hm-inner { position: relative; z-index: 1; width: 100%; max-width: 900px; }

  /* ── Welcome header ── */
  .hm-welcome-tag {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(34,197,94,.12);
    border: 1px solid rgba(34,197,94,.25);
    border-radius: 999px;
    padding: .25rem .85rem;
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--g-700);
    margin-bottom: 1rem;
    animation: hm-fadeUp .5s ease both;
  }
  .hm-welcome-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--g-500);
    animation: hm-pulse 2s ease infinite;
  }
  .hm-heading {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(1.75rem, 4vw, 2.6rem);
    font-weight: 400;
    font-style: italic;
    color: #0f2419;
    line-height: 1.2;
    margin-bottom: .5rem;
    animation: hm-fadeUp .55s .05s ease both;
  }
  .hm-heading span { color: var(--g-600); font-style: normal; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }
  .hm-sub {
    font-size: .9rem;
    color: #6b7f72;
    font-weight: 400;
    margin-bottom: 2rem;
    animation: hm-fadeUp .55s .1s ease both;
  }

  /* ── Main glass panel ── */
  .hm-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1.5px solid var(--glass-bd);
    border-radius: 28px;
    box-shadow:
      var(--shadow-glass),
      inset 0 1px 0 rgba(255,255,255,0.9),
      inset 0 -1px 0 rgba(34,197,94,0.05);
    padding: 2rem;
    animation: hm-fadeUp .6s .15s ease both;
    position: relative;
    overflow: hidden;
  }
  .hm-panel::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(134,239,172,.35) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .hm-panel::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(34,197,94,.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  /* ── Section title ── */
  .hm-section-title {
    font-size: .7rem;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #8aaa93;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }
  .hm-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(34,197,94,.2), transparent);
  }

  /* ── Exam scroll strip ── */
  .hm-exam-strip {
    display: flex;
    gap: .875rem;
    overflow-x: auto;
    padding-bottom: .75rem;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    margin-bottom: 1.75rem;
  }
  .hm-exam-strip::-webkit-scrollbar { display: none; }

  .hm-exam-card {
    min-width: 256px;
    scroll-snap-align: start;
    border-radius: 18px;
    padding: 1.1rem 1.2rem;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .hm-exam-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,.15);
  }

  /* Card type colours */
  .hm-card-hsa {
    background: linear-gradient(135deg, #0d7a4e 0%, #065f46 50%, #064e3b 100%);
    box-shadow: 0 4px 20px rgba(6,95,70,.35);
  }
  .hm-card-tsa {
    background: linear-gradient(135deg, #1d6fa4 0%, #155e87 50%, #0d4a6b 100%);
    box-shadow: 0 4px 20px rgba(21,94,135,.35);
  }
  .hm-card-vact {
    background: linear-gradient(135deg, #6d4fc2 0%, #5b3fa6 50%, #4c3494 100%);
    box-shadow: 0 4px 20px rgba(109,79,194,.35);
  }
  .hm-card-subject {
    background: linear-gradient(135deg, #b45309 0%, #92400e 50%, #78350f 100%);
    box-shadow: 0 4px 20px rgba(180,83,9,.35);
  }

  .hm-exam-glow {
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 120px;
    background: rgba(255,255,255,.12);
    border-radius: 50%;
    filter: blur(20px);
    pointer-events: none;
  }
  .hm-exam-icon {
    width: 38px; height: 38px;
    border-radius: 12px;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
    flex-shrink: 0;
    margin-bottom: .75rem;
  }
  .hm-exam-title {
    font-size: .9rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    margin-bottom: .35rem;
  }
  .hm-exam-meta {
    font-size: .72rem;
    color: rgba(255,255,255,.75);
    line-height: 1.5;
  }
  .hm-exam-badge {
    position: absolute;
    top: .85rem; right: .85rem;
    background: rgba(255,255,255,.22);
    border: 1px solid rgba(255,255,255,.3);
    backdrop-filter: blur(6px);
    border-radius: 999px;
    padding: .18rem .55rem;
    font-size: .62rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: .04em;
    display: flex; align-items: center; gap: .3rem;
  }
  .hm-badge-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #4ade80;
    animation: hm-pulse 1.5s ease infinite;
  }

  /* ── Dashboard grid ── */
  .hm-dash-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }
  @media (max-width: 640px) { .hm-dash-grid { grid-template-columns: 1fr; } }

  /* ── Glass cards (inner) ── */
  .hm-card {
    background: var(--glass-bg-2);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1.5px solid var(--glass-bd-2);
    border-radius: 20px;
    padding: 1.4rem;
    box-shadow: var(--shadow-card);
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    position: relative;
    overflow: hidden;
  }
  .hm-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(22,163,74,.14), 0 2px 8px rgba(0,0,0,.07);
    border-color: rgba(134,239,172,.6);
  }

  /* ── Progress ring ── */
  .hm-ring-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.1rem;
  }
  @media (min-width: 400px) {
    .hm-ring-wrap { flex-direction: row; }
  }

  .hm-ring {
    position: relative;
    width: 140px; height: 140px;
    flex-shrink: 0;
  }
  .hm-ring-bg { stroke: rgba(34,197,94,.12); }
  .hm-ring-fill {
    stroke: url(#ringGrad);
    stroke-linecap: round;
    transition: stroke-dashoffset 1s cubic-bezier(.16,1,.3,1);
    filter: drop-shadow(0 0 6px rgba(34,197,94,.45));
  }
  .hm-ring-label {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    pointer-events: none;
  }
  .hm-ring-pct {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f2419;
    line-height: 1;
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(4px);
    padding: 2px 6px;
    border-radius: 6px;
  }
  .hm-ring-hint { font-size: .6rem; color: #8aaa93; font-weight: 600; letter-spacing: .05em; }

  /* Stat pills */
  .hm-stat-list { flex: 1; width: 100%; display: flex; flex-direction: column; gap: .65rem; }
  .hm-stat-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .65rem .9rem;
    border-radius: 14px;
    border: 1px solid transparent;
    transition: border-color .2s;
  }
  .hm-stat-pill:hover { border-color: rgba(134,239,172,.4); }
  .hm-stat-orange { background: linear-gradient(135deg, rgba(255,237,213,.8), rgba(254,243,199,.6)); }
  .hm-stat-green  { background: linear-gradient(135deg, rgba(220,252,231,.8), rgba(187,247,208,.6)); }
  .hm-stat-blue   { background: linear-gradient(135deg, rgba(219,234,254,.8), rgba(199,219,254,.6)); }
  .hm-stat-left { display: flex; align-items: center; gap: .55rem; }
  .hm-stat-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hm-stat-icon-orange { background: rgba(234,88,12,.12); }
  .hm-stat-icon-green  { background: rgba(22,163,74,.12); }
  .hm-stat-icon-blue   { background: rgba(37,99,235,.12); }
  .hm-stat-label { font-size: .76rem; font-weight: 500; color: #3d5a45; }
  .hm-stat-val   { font-size: .95rem; font-weight: 800; color: #0f2419; }

  /* ── My courses card ── */
  .hm-course-list { display: flex; flex-direction: column; gap: .6rem; max-height: 210px; overflow-y: auto; scrollbar-width: none; }
  .hm-course-list::-webkit-scrollbar { display: none; }

  .hm-course-row {
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .6rem .75rem;
    border-radius: 14px;
    background: rgba(255,255,255,.6);
    border: 1px solid rgba(255,255,255,.8);
    text-decoration: none;
    transition: background .2s, border-color .2s, transform .15s;
  }
  .hm-course-row:hover {
    background: rgba(255,255,255,.85);
    border-color: rgba(134,239,172,.5);
    transform: translateX(3px);
  }
  .hm-course-thumb {
    width: 42px; height: 42px;
    border-radius: 10px;
    background: var(--g-50);
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    border: 1px solid var(--g-100);
  }
  .hm-course-name { font-size: .8rem; font-weight: 700; color: #1a3326; line-height: 1.3; }
  .hm-progress-bar {
    height: 4px;
    border-radius: 99px;
    background: rgba(34,197,94,.12);
    margin-top: 4px;
    overflow: hidden;
  }
  .hm-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--g-400), var(--g-600));
    transition: width .8s cubic-bezier(.16,1,.3,1);
  }
  .hm-pct-label { font-size: .7rem; font-weight: 800; color: var(--g-600); margin-left: auto; flex-shrink: 0; }

  /* Empty state */
  .hm-empty {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    padding: 1.5rem 0;
    gap: .75rem;
  }
  .hm-empty-icon {
    width: 54px; height: 54px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(134,239,172,.25), rgba(34,197,94,.1));
    border: 1px solid rgba(134,239,172,.3);
    display: flex; align-items: center; justify-content: center;
  }
  .hm-empty-text { font-size: .83rem; color: #7a9a82; line-height: 1.5; }
  .hm-empty-cta {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .55rem 1.25rem;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--g-500), var(--g-700));
    color: #fff;
    font-size: .78rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(22,163,74,.35);
    transition: transform .2s, box-shadow .2s;
  }
  .hm-empty-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22,163,74,.45);
  }

  /* ── Logged-out state ── */
  .hm-login-box {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    min-height: calc(100vh - 64px);
    gap: 0;
  }
  .hm-login-orb {
    width: 100px; height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(134,239,172,.4), rgba(34,197,94,.2));
    border: 1.5px solid rgba(134,239,172,.4);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(34,197,94,.2), inset 0 1px 0 rgba(255,255,255,.8);
    margin-bottom: 1.5rem;
    animation: hm-fadeUp .5s ease both;
  }
  .hm-login-title {
    font-family: 'Instrument Serif', serif;
    font-size: 1.5rem;
    font-style: italic;
    color: #1a3326;
    margin-bottom: 1.5rem;
    max-width: 280px;
    line-height: 1.4;
    animation: hm-fadeUp .55s .05s ease both;
  }
  .hm-login-btn {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2.5rem;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--g-500), var(--g-700));
    color: #fff;
    font-size: .95rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(22,163,74,.4);
    transition: transform .2s, box-shadow .2s;
    animation: hm-fadeUp .55s .1s ease both;
  }
  .hm-login-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(22,163,74,.5); }

  /* ── Card header row ── */
  .hm-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.1rem;
  }
  .hm-card-title-row {
    display: flex; align-items: center; gap: .5rem;
  }
  .hm-card-icon-badge {
    width: 30px; height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, rgba(134,239,172,.35), rgba(34,197,94,.15));
    border: 1px solid rgba(134,239,172,.35);
    display: flex; align-items: center; justify-content: center;
  }
  .hm-card-title { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #3d5a45; }
  .hm-view-all {
    font-size: .72rem;
    font-weight: 700;
    color: var(--g-600);
    text-decoration: none;
    display: flex; align-items: center; gap: .2rem;
    transition: gap .2s;
  }
  .hm-view-all:hover { gap: .45rem; }

  /* ── Keyframes ── */
  @keyframes hm-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hm-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: .5; transform: scale(.8); }
  }
`;

export default function Home() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [purchasedCategories, setPurchasedCategories] = useState<Set<string>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetExam, setTargetExam] = useState<{ title: string; date: Date } | null>(null);

  useEffect(() => {
    router.prefetch('/courses');
    router.prefetch('/forum');
    router.prefetch('/exams');
    router.prefetch('/login');
    router.prefetch('/books');
  }, [router]);

  useEffect(() => {
    if (currentUser?.Email) {
      router.prefetch(`/profile/${currentUser.Email}`);
    }
  }, [currentUser, router]);

  useEffect(() => {
    try {
      const cachedCourses = localStorage.getItem('courses_data_cache');
      if (cachedCourses) setRealCourses(JSON.parse(cachedCourses));
    } catch (e) { console.error('Cache parse error', e); }

    const loadData = async () => {
      try {
        if (currentUser) await refreshCurrentUser({ silent: true });
        const [coursesData, purchasedData] = await Promise.all([
          fetchCourses(),
          currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([])
        ]);
        setRealCourses(coursesData);
        localStorage.setItem('courses_data_cache', JSON.stringify(coursesData));
        setPurchasedCategories(new Set(purchasedData));
      } catch (error) { console.error('Failed to load courses', error); }
    };
    loadData();
  }, [currentUser]);

  const exams = useMemo(() => [
    { title: 'HSA 601 - Ngày 1',            date: '07/03/2026', time: '08:00', duration: '180 phút', location: 'Hà Nội, Hưng Yên, Ninh Bình, Thái Nguyên,...', isCountdown: true, type: 'hsa' },
    { title: 'HSA 601 - Ngày 2',            date: '08/03/2026', time: '08:00', duration: '180 phút', location: 'Hà Nội, Hưng Yên, Ninh Bình, Thái Nguyên,...', type: 'hsa' },
    { title: 'TSA 2026 - Đợt 2 - Ngày 1',  date: '14/03/2026', time: '08:00', duration: '150 phút', type: 'tsa' },
    { title: 'TSA 2026 - Đợt 2 - Ngày 2',  date: '15/03/2026', time: '08:00', duration: '150 phút', type: 'tsa' },
    { title: 'HSA 602 - Ngày 1',            date: '21/03/2026', time: '08:00', duration: '180 phút', location: 'Hà Nội, Hải Phòng, Thanh Hóa,...', type: 'hsa' },
    { title: 'HSA 602 - Ngày 2',            date: '22/03/2026', time: '08:00', duration: '180 phút', location: 'Hà Nội, Hải Phòng, Thanh Hóa,...', type: 'hsa' },
    { title: 'V-ACT Đợt 1',                 date: '05/04/2026', time: '08:00', duration: '150 phút', location: 'Đăng ký: 24/01 - 23/02/2026', type: 'vact' },
    { title: 'V-ACT Đợt 2',                 date: '24/05/2026', time: '08:00', duration: '150 phút', location: 'Đăng ký: 18/04 - 25/04/2026', type: 'vact' },
    { title: 'Ngữ văn - TN THPT',           date: '11/06/2026',  time: '07:30', duration: '120 phút', type: 'subject', icon: 'book-open' },
    { title: 'Toán - TN THPT',              date: '11/06/2026',  time: '14:20', duration: '90 phút',  type: 'subject', icon: 'hash' },
    { title: 'Tự chọn môn 1',               date: '12/06/2026',  time: '07:30', duration: '50 phút',  type: 'subject', icon: 'list' },
    { title: 'Tự chọn môn 2',               date: '12/06/2026',  time: '08:35', duration: '50 phút',  type: 'subject', icon: 'layers' },
  ], []);

  useEffect(() => {
    const now = new Date();
    let nearestExam: { title: string; date: Date } | null = null;

    exams.forEach(exam => {
      const [day, month, year] = exam.date.split('/').map(Number);
      const [hour, minute] = exam.time.split(':').map(Number);
      const examDate = new Date(year, month - 1, day, hour, minute);

      if (examDate > now && (!nearestExam || examDate < nearestExam.date)) {
        nearestExam = { title: exam.title, date: examDate };
      }
    });

    setTargetExam(nearestExam);

    if (!nearestExam) return;

    const timer = setInterval(() => {
      const difference = nearestExam!.date.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({ days: Math.floor(difference / (1000 * 60 * 60 * 24)), hours: Math.floor((difference / (1000 * 60 * 60)) % 24), minutes: Math.floor((difference / 1000 / 60) % 60), seconds: Math.floor((difference / 1000) % 60) });
      } else { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); clearInterval(timer); }
    }, 1000);

    return () => clearInterval(timer);
  }, [exams]);

  const cleanCategoryName = useCallback((name: string) =>
    name.replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim(), []);

  const isCourseOwned = useCallback((course: Course): boolean => {
    for (const pc of purchasedCategories) {
      const cleanPc = cleanCategoryName(pc);
      if (cleanPc === cleanCategoryName(course.Category || '') ||
          cleanPc === cleanCategoryName(course.Title || '')) return true;
    }
    return false;
  }, [purchasedCategories, cleanCategoryName]);

  const myCourses = useMemo(() => realCourses.filter(c => isCourseOwned(c)), [realCourses, isCourseOwned]);

  const handlePurchase = async (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (!currentUser) { addToast('Vui lòng đăng nhập để mua hàng.', 'info'); router.push('/login'); return; }
    if ((currentUser.Money || 0) < course.Price) {
      addToast('Số dư không đủ. Vui lòng nạp thêm tiền.', 'error');
      setIsDepositModalOpen(true); return;
    }
    const ok = window.confirm(`Bạn có chắc muốn mua "${course.Title}" — ${course.Price.toLocaleString('vi-VN')}đ?`);
    if (!ok) return;
    setIsPurchasing(course.ID);
    try {
      const result = await purchasePremiumCategory(currentUser.Email, course.Category);
      if (result.success) {
        addToast('Mua thành công!', 'success');
        await refreshCurrentUser({ silent: true });
        setPurchasedCategories(prev => new Set(prev).add(course.Category));
      } else addToast(result.error || 'Giao dịch thất bại.', 'error');
    } catch (e: any) { addToast(e.message || 'Lỗi kết nối.', 'error'); }
    finally { setIsPurchasing(null); }
  };

  const handleDepositSuccess = async () => {
    setIsDepositModalOpen(false);
    await refreshCurrentUser();
    addToast('Nạp tiền thành công!', 'success');
  };

  const cardTypeClass: Record<string, string> = {
    hsa: 'hm-card-hsa', tsa: 'hm-card-tsa', vact: 'hm-card-vact', subject: 'hm-card-subject'
  };
  const cardTypeIcon: Record<string, string> = {
    hsa: 'bar-chart', tsa: 'cpu', vact: 'target', subject: 'book-open'
  };

  /* Radar Chart Data & Logic */
  const radarData = useMemo(() => {
    if (!currentUser) {
      return [
        { label: 'Toán', value: 85 },
        { label: 'Văn', value: 60 },
        { label: 'Anh', value: 75 },
        { label: 'Lý/Sử', value: 65 },
        { label: 'Thời gian', value: 90 },
        { label: 'Tiến bộ', value: 70 },
      ];
    }
    const raw = currentUser as any;
    
    console.log('🔍 [Home] currentUser:', raw);
    console.log('🔍 [Home] Keys:', Object.keys(raw || {}));
    console.log('🔍 [Home] Thử đọc "Tiêu chí 1" (qua getField):', getField(raw, 'Tiêu chí 1'));

    return [1, 2, 3, 4, 5, 6].map(n => {
      const val = getField(raw, `Tiêu chí ${n}`);
      const { label, value } = parseTieuChi(val);
      return { label: label || `Tiêu chí ${n}`, value: value ?? 0 };
    });
  }, [currentUser]);

  const radarSize = 140;
  const radarCenter = radarSize / 2;
  const radarRadius = (radarSize / 2) - 10; // Padding

  // Helper to calculate points for hexagon
  const getPolyPoints = (data: number[], radius: number) => {
    return data.map((val, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2; // -90deg to start at top
      const r = (Math.max(0, Math.min(100, val)) / 100) * radius;
      const x = radarCenter + r * Math.cos(angle);
      const y = radarCenter + r * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  };

  const bgPoints = getPolyPoints([100, 100, 100, 100, 100, 100], radarRadius);
  const dataPoints = getPolyPoints(radarData.map(d => d.value), radarRadius);
  const avgScore = Math.round(radarData.reduce((a, b) => a + b.value, 0) / radarData.length);

  return (
    <>
      <style>{CSS}</style>
      <div className="hm-wrap hm-bg">
        <div className="hm-inner">
          {!currentUser ? (
            /* ── Logged-out ── */
            <div className="hm-login-box">
              <div className="hm-login-orb">
                <Icon name="lock" className="w-10 h-10 text-green-600" />
              </div>
              <p className="hm-login-title">Đăng nhập để bắt đầu hành trình học tập của bạn</p>
              <Link href="/login" className="hm-login-btn">
                <Icon name="arrow-right" className="w-4 h-4" />
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            /* ── Logged-in ── */
            <>
              {/* Welcome header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="hm-welcome-tag">
                  <span className="hm-welcome-dot" />
                  Bảng điều khiển
                </div>
                <h2 className="hm-heading">
                  Chào mừng trở lại,&nbsp;
                  <span>{currentUser['Tên tài khoản']}</span>!
                </h2>
                <p className="hm-sub">Theo dõi tiến độ và lịch thi của bạn ngay bên dưới.</p>
              </div>

              {/* Main glass panel */}
              <div className="hm-panel">

                {/* ── Exam schedule strip ── */}
                <p className="hm-section-title">
                  <Icon name="calendar" className="w-3.5 h-3.5 text-[#8aaa93]" />
                  Lịch thi tổng quan 2026
                </p>

                <div className="hm-exam-strip">
                  {exams.map((exam, idx) => (
                    <div key={idx} className={`hm-exam-card ${cardTypeClass[exam.type] || 'hm-card-hsa'}`}>
                      <div className="hm-exam-glow" />

                      {exam.isCountdown && (
                        <div className="hm-exam-badge">
                          <span className="hm-badge-dot" />
                          Đang đếm ngược
                        </div>
                      )}

                      <div className="hm-exam-icon">
                        <Icon
                          name={(exam as any).icon || cardTypeIcon[exam.type] || 'calendar'}
                          className="w-5 h-5 text-white"
                        />
                      </div>

                      <div className="hm-exam-title">{exam.title}</div>
                      <div className="hm-exam-meta">
                        {exam.date} · {exam.time} · {exam.duration}
                      </div>
                      {exam.location && (
                        <div className="hm-exam-meta" style={{ marginTop: '.3rem', display: 'flex', alignItems: 'flex-start', gap: '.3rem' }}>
                          <span style={{ marginTop: '2px', opacity: .75, flexShrink: 0, display: 'flex' }}>
                            <Icon name="map-pin" className="w-3 h-3" />
                          </span>
                          <span style={{ opacity: .75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {exam.location}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* COUNTDOWN TIMER */}
                {targetExam && (
                  <div className="text-center" style={{ animation: 'hm-fadeUp .6s .2s ease both' }}>
                    <div 
                      className="h-px bg-gradient-to-r from-transparent via-green-200 to-transparent my-6"
                    />
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                      Đếm ngược tới kỳ thi: <span className="text-green-700 font-extrabold">{targetExam.title}</span>
                    </p>
                    <div className="flex justify-center gap-3 md:gap-4 mb-6">
                      {[
                        { label: 'Ngày', value: timeLeft.days },
                        { label: 'Giờ', value: timeLeft.hours },
                        { label: 'Phút', value: timeLeft.minutes },
                        { label: 'Giây', value: timeLeft.seconds }
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center text-2xl md:text-3xl font-black text-gray-800 shadow-sm border border-white/80 mb-1.5">
                            {item.value.toString().padStart(2, '0')}
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dashboard grid ── */}
                <div className="hm-dash-grid">

                  {/* Progress card */}
                  <div className="hm-card">
                    <div className="hm-card-header">
                      <div className="hm-card-title-row">
                        <div className="hm-card-icon-badge">
                          <Icon name="trending-up" className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="hm-card-title">Tiến độ học tập</span>
                      </div>
                    </div>

                    <div className="hm-ring-wrap">
                      {/* SVG Radar Chart */}
                      <div className="hm-ring">
                        <Link href="/progress" title="Xem chi tiết biểu đồ" className="block w-full h-full">
                            <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`} className="overflow-visible">
                              {/* Background Hexagon */}
                              <polygon points={bgPoints} fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />
                              
                              {/* Inner Grid (50%) */}
                              <polygon points={getPolyPoints([50,50,50,50,50,50], radarRadius)} fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                              
                              {/* Data Polygon */}
                              <polygon
                                points={dataPoints}
                                fill="rgba(34,197,94,0.25)"
                                stroke="#16a34a"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                className="transition-all duration-1000 ease-out"
                              />
                              
                              {/* Dots at vertices */}
                              {radarData.map((d, i) => {
                                const angle = (Math.PI / 3) * i - Math.PI / 2;
                                const r = (Math.max(0, Math.min(100, d.value)) / 100) * radarRadius;
                                const x = radarCenter + r * Math.cos(angle);
                                const y = radarCenter + r * Math.sin(angle);
                                return <circle key={i} cx={x} cy={y} r="3" fill="#15803d" stroke="white" strokeWidth="1" />;
                              })}
                            </svg>
                          </Link>
                        <div className="hm-ring-label">
                          <span className="hm-ring-pct">{avgScore}</span>
                          <span className="hm-ring-hint">ĐIỂM TB</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hm-stat-list">
                        <div className="hm-stat-pill hm-stat-orange">
                          <div className="hm-stat-left">
                            <div className="hm-stat-icon hm-stat-icon-orange">
                              <Icon name="academic-cap" className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="hm-stat-label">Đang học</span>
                          </div>
                          <span className="hm-stat-val">{myCourses.length}</span>
                        </div>

                        <div className="hm-stat-pill hm-stat-green">
                          <div className="hm-stat-left">
                            <div className="hm-stat-icon hm-stat-icon-green">
                              <Icon name="check-circle" className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="hm-stat-label">Hoàn thành</span>
                          </div>
                          <span className="hm-stat-val">0</span>
                        </div>

                        <div className="hm-stat-pill hm-stat-blue">
                          <div className="hm-stat-left">
                            <div className="hm-stat-icon hm-stat-icon-blue">
                              <Icon name="zap" className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="hm-stat-label">Streak học tập</span>
                          </div>
                          <span className="hm-stat-val">—</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Courses card */}
                  <div className="hm-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="hm-card-header">
                      <div className="hm-card-title-row">
                        <div className="hm-card-icon-badge">
                          <Icon name="book-open" className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="hm-card-title">Khóa học của tôi</span>
                      </div>
                      <Link href="/my-courses" prefetch={true} className="hm-view-all">
                        Xem tất cả <Icon name="arrow-right" className="w-3 h-3" />
                      </Link>
                    </div>

                    <div style={{ flex: 1 }}>
                      {myCourses.length > 0 ? (
                        <div className="hm-course-list">
                          {myCourses.map(course => (
                            <Link href={`/courses/${course.ID}`} key={course.ID} prefetch={true} className="hm-course-row">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                                {course.ImageURL ? (
                                  <Image
                                    src={convertGoogleDriveUrl(course.ImageURL)}
                                    alt={course.Title}
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Icon name="book" className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="hm-course-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {course.Title}
                                </div>
                                <div className="hm-progress-bar">
                                  <div className="hm-progress-fill" style={{ width: '0%' }} />
                                </div>
                              </div>
                              <span className="hm-pct-label">0%</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="hm-empty">
                          <div className="hm-empty-icon">
                            <Icon name="book-open" className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="hm-empty-text">Bạn chưa đăng ký khóa học nào.<br />Bắt đầu ngay hôm nay!</p>
                          <Link href="/courses" prefetch={true} className="hm-empty-cta">
                            <Icon name="plus" className="w-3.5 h-3.5" />
                            Khám phá khóa học
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {currentUser && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          currentUser={currentUser}
          onSuccess={handleDepositSuccess}
        />
      )}
    </>
  );
}