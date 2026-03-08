'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getClassDetails, batchAddStudents, fetchAccounts, assignDocumentToClass, getClassDocuments, type ClassDocument } from '@/services/googleSheetService';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { useToast } from '@/contexts/ToastContext';
import type { Classroom, ClassMember, AssignedQuiz, NewStudentCredential, Account } from '@/types';

type Tab = 'assignments' | 'members';

/* ─── Styles ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .cd-page * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .cd-page .syne { font-family: 'Syne', sans-serif; }

  .cd-page {
    min-height: 100vh;
    background: #f0fdf4;
    background-image:
      radial-gradient(ellipse 70% 40% at 5% 0%,  #dcfce770 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 95% 100%, #ffedd570 0%, transparent 55%);
  }

  /* ── Back ── */
  .cd-back {
    display: inline-flex; align-items: center; gap: .45rem;
    font-size: .82rem; font-weight: 600; color: #16a34a;
    text-decoration: none; margin-bottom: 1.5rem;
    padding: .4rem .85rem; border-radius: 9999px;
    background: #dcfce7; border: 1.5px solid #bbf7d0;
    transition: background .2s, transform .15s;
  }
  .cd-back:hover { background: #bbf7d0; transform: translateX(-2px); }

  /* ── Hero card ── */
  .cd-hero {
    background: white; border-radius: 24px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 4px 28px rgba(22,163,74,.08);
    overflow: hidden; margin-bottom: 1.5rem;
  }
  .cd-hero-stripe { height: 5px; background: linear-gradient(90deg,#16a34a,#4ade80,#f97316); }
  .cd-hero-body { padding: 2rem; }
  .cd-hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }

  .cd-subject-badge {
    display: inline-flex; align-items: center; gap: .35rem;
    background: #dcfce7; border: 1.5px solid #bbf7d0;
    color: #15803d; font-size: .72rem; font-weight: 700;
    letter-spacing: .05em; text-transform: uppercase;
    padding: .25rem .7rem; border-radius: 9999px; margin-bottom: .65rem;
  }

  .cd-class-name {
    font-family: 'Syne', sans-serif; font-size: clamp(1.5rem,3.5vw,2.2rem);
    font-weight: 800; color: #0f1a10; line-height: 1.15; margin-bottom: .5rem;
  }
  .cd-desc { font-size: .875rem; color: #6b7280; line-height: 1.7; max-width: 600px; }

  /* Stats row */
  .cd-stats { display: flex; gap: 1.25rem; flex-wrap: wrap; margin-top: 1.25rem; }
  .cd-stat {
    display: flex; align-items: center; gap: .5rem;
    font-size: .8rem; font-weight: 600; color: #6b7280;
  }
  .cd-stat-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }

  /* Join code box */
  .cd-code-box {
    display: flex; align-items: center; gap: .65rem;
    background: linear-gradient(135deg,#f0fdf4,#dcfce7);
    border: 1.5px solid #bbf7d0; border-radius: 16px;
    padding: .85rem 1.1rem; flex-shrink: 0; align-self: flex-start;
  }
  .cd-code-label { font-size: .68rem; font-weight: 700; color: #16a34a; letter-spacing: .06em; text-transform: uppercase; margin-bottom: .2rem; }
  .cd-code-value { font-family: 'Syne', sans-serif; font-size: 1.35rem; font-weight: 800; color: #0f1a10; letter-spacing: .18em; }
  .cd-copy-btn {
    background: white; border: 1.5px solid #bbf7d0; border-radius: 9px;
    padding: .45rem; cursor: pointer; color: #16a34a;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, transform .15s;
  }
  .cd-copy-btn:hover { background: #dcfce7; transform: scale(1.1); }

  /* Creator row */
  .cd-creator-row {
    display: flex; align-items: center; gap: .6rem;
    margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;
  }
  .cd-creator-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg,#16a34a,#4ade80);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-weight: 800; font-size: .75rem; color: white;
  }
  .cd-creator-text { font-size: .78rem; color: #9ca3af; }
  .cd-creator-text strong { color: #374151; }

  /* ── Tabs ── */
  .cd-tabs {
    display: flex; gap: 0; align-items: center;
    background: white; border-radius: 16px;
    border: 1.5px solid #e5e7eb;
    padding: .35rem; margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
    flex-wrap: wrap;
  }
  .cd-tab {
    flex: 1; padding: .65rem 1.25rem; border-radius: 10px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: .875rem; font-weight: 600;
    cursor: pointer; transition: all .2s; color: #6b7280; background: transparent;
    display: flex; align-items: center; justify-content: center; gap: .4rem;
    white-space: nowrap;
  }
  .cd-tab:hover { color: #374151; background: #f9fafb; }
  .cd-tab.active { background: #16a34a; color: white; box-shadow: 0 2px 10px rgba(22,163,74,.3); }
  .cd-tab-count {
    font-size: .68rem; padding: .1rem .4rem; border-radius: 9999px; font-weight: 700;
    background: rgba(255,255,255,.25);
  }
  .cd-tab:not(.active) .cd-tab-count { background: #f3f4f6; color: #9ca3af; }

  .cd-tab-action {
    margin-left: auto; padding: .55rem 1.1rem; border-radius: 10px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: .8rem; font-weight: 700;
    cursor: pointer; background: linear-gradient(135deg,#f97316,#ea580c); color: white;
    display: flex; align-items: center; gap: .4rem;
    box-shadow: 0 2px 10px rgba(249,115,22,.25);
    transition: transform .15s, box-shadow .15s;
  }
  .cd-tab-action:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(249,115,22,.35); }

  /* ── Assignment list ── */
  .cd-assign-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.25rem; flex-wrap: wrap; gap: .75rem;
  }
  .cd-assign-cta {
    display: inline-flex; align-items: center; gap: .5rem;
    background: linear-gradient(135deg,#16a34a,#15803d); color: white;
    font-size: .82rem; font-weight: 700; padding: .6rem 1.1rem;
    border-radius: 10px; text-decoration: none;
    box-shadow: 0 3px 10px rgba(22,163,74,.3);
    transition: transform .15s, box-shadow .15s;
  }
  .cd-assign-cta:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(22,163,74,.4); }

  .cd-quiz-card {
    background: white; border-radius: 16px; border: 1.5px solid #e5e7eb;
    padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem;
    transition: border-color .2s, box-shadow .2s, transform .2s;
    margin-bottom: .85rem; flex-wrap: wrap;
  }
  .cd-quiz-card:hover { border-color: #16a34a; box-shadow: 0 4px 20px rgba(22,163,74,.1); transform: translateX(3px); }
  .cd-quiz-icon {
    width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg,#dcfce7,#bbf7d0);
    display: flex; align-items: center; justify-content: center;
  }
  .cd-quiz-title { font-family: 'Syne',sans-serif; font-weight: 700; color: #111827; font-size: .95rem; margin-bottom: .25rem; }
  .cd-quiz-meta { font-size: .75rem; color: #9ca3af; display: flex; gap: .85rem; flex-wrap: wrap; }
  .cd-quiz-meta span { display: flex; align-items: center; gap: .25rem; }
  .cd-quiz-due {
    display: inline-flex; align-items: center; gap: .3rem;
    font-size: .72rem; font-weight: 700;
    padding: .2rem .65rem; border-radius: 9999px;
    background: #fff7ed; color: #ea580c; border: 1.5px solid #fed7aa;
  }
  .cd-quiz-btn {
    margin-left: auto; flex-shrink: 0;
    display: inline-flex; align-items: center; gap: .4rem;
    background: #16a34a; color: white;
    font-size: .78rem; font-weight: 700; padding: .55rem 1rem;
    border-radius: 10px; text-decoration: none;
    transition: background .15s, transform .15s;
    box-shadow: 0 2px 8px rgba(22,163,74,.25);
  }
  .cd-quiz-btn:hover { background: #15803d; transform: translateY(-1px); }

  .cd-empty {
    text-align: center; padding: 3.5rem 2rem;
    background: white; border-radius: 20px;
    border: 2px dashed #d1fae5;
  }
  .cd-empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .cd-empty h3 { font-family: 'Syne',sans-serif; font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: .4rem; }
  .cd-empty p { font-size: .82rem; color: #9ca3af; }

  /* ── Members grid ── */
  .cd-members-grid {
    background: white; border-radius: 20px; border: 1.5px solid #e5e7eb;
    padding: 1.75rem; box-shadow: 0 2px 12px rgba(0,0,0,.04);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 1.5rem;
  }
  .cd-member { text-align: center; }
  .cd-member-avatar-wrap { position: relative; width: 64px; height: 64px; margin: 0 auto .65rem; }
  .cd-member-avatar {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg,#dcfce7,#bbf7d0);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-weight: 800; font-size: 1.25rem; color: #15803d;
    border: 2px solid #bbf7d0;
    transition: transform .2s, box-shadow .2s;
    position: relative; overflow: hidden;
  }
  .cd-member:hover .cd-member-avatar { transform: scale(1.08); box-shadow: 0 4px 14px rgba(22,163,74,.2); }
  .cd-member-creator-badge {
    position: absolute; bottom: 0; right: 0;
    width: 20px; height: 20px; border-radius: 50%;
    background: linear-gradient(135deg,#f97316,#ea580c);
    display: flex; align-items: center; justify-content: center;
    border: 2px solid white; box-shadow: 0 2px 6px rgba(249,115,22,.4);
  }
  .cd-member-name { font-size: .8rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: .15rem; }
  .cd-member-email { font-size: .68rem; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Modal ── */
  .cd-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1.5rem;
    animation: cdFadeIn .2s ease;
  }
  @keyframes cdFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .cd-modal {
    background: white; border-radius: 24px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 24px 64px rgba(0,0,0,.18);
    width: 100%; max-width: 560px; max-height: 90vh;
    display: flex; flex-direction: column;
    animation: cdModalIn .3s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes cdModalIn { from { opacity:0; transform: scale(.93) translateY(20px); } to { opacity:1; transform:none; } }

  .cd-modal-stripe { height: 4px; background: linear-gradient(90deg,#16a34a,#4ade80,#f97316); border-radius: 24px 24px 0 0; }
  .cd-modal-header { padding: 1.35rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; }
  .cd-modal-header h2 { font-family: 'Syne',sans-serif; font-size: 1.15rem; font-weight: 800; color: #0f1a10; }
  .cd-modal-close {
    width: 32px; height: 32px; border-radius: 9px; border: none;
    background: #f3f4f6; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #6b7280; transition: background .15s, color .15s;
  }
  .cd-modal-close:hover { background: #fee2e2; color: #dc2626; }

  .cd-modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
  .cd-modal-footer { padding: 1.1rem 1.5rem; background: #fafafa; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: .65rem; border-radius: 0 0 24px 24px; }

  /* Modal input row */
  .cd-modal-input-row { display: flex; gap: .6rem; margin-bottom: 1rem; }
  .cd-modal-input {
    flex: 1; padding: .7rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: .875rem; font-family: 'DM Sans',sans-serif; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .cd-modal-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
  .cd-modal-add-btn {
    padding: .7rem 1.1rem; border: none; border-radius: 10px; cursor: pointer;
    background: #16a34a; color: white; font-weight: 700; font-size: .875rem;
    transition: background .15s; font-family: 'DM Sans',sans-serif;
  }
  .cd-modal-add-btn:hover { background: #15803d; }

  /* Name chips */
  .cd-chip-list { display: flex; flex-direction: column; gap: .4rem; max-height: 220px; overflow-y: auto; }
  .cd-chip {
    display: flex; align-items: center; justify-content: space-between;
    background: #f0fdf4; border: 1.5px solid #bbf7d0;
    border-radius: 10px; padding: .55rem .85rem;
    font-size: .85rem; color: #111827; font-weight: 500;
  }
  .cd-chip-remove {
    background: none; border: none; cursor: pointer; color: #9ca3af; padding: .1rem;
    border-radius: 5px; transition: color .15s, background .15s;
    display: flex; align-items: center;
  }
  .cd-chip-remove:hover { color: #dc2626; background: #fee2e2; }

  /* Modal loading */
  .cd-modal-loading { text-align: center; padding: 3rem 1rem; }
  .cd-modal-spinner {
    width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 1.25rem;
    border: 3px solid #dcfce7; border-top-color: #16a34a;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Results table */
  .cd-results-banner {
    background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px;
    padding: .85rem 1rem; margin-bottom: 1rem; font-size: .82rem; color: #15803d;
  }
  .cd-table-wrap { border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .cd-table { width: 100%; font-size: .8rem; border-collapse: collapse; }
  .cd-table thead { background: #f9fafb; }
  .cd-table th { padding: .65rem 1rem; text-align: left; font-size: .68rem; font-weight: 700; color: #6b7280; letter-spacing: .05em; text-transform: uppercase; }
  .cd-table td { padding: .65rem 1rem; border-top: 1px solid #f3f4f6; }
  .cd-table td:first-child { font-weight: 600; color: #111827; }
  .cd-table .mono { font-family: 'Courier New', monospace; font-size: .75rem; color: #374151; }

  /* Button variants */
  .cd-btn-green {
    padding: .6rem 1.1rem; border: none; border-radius: 10px; cursor: pointer;
    background: linear-gradient(135deg,#16a34a,#15803d); color: white;
    font-weight: 700; font-size: .82rem; font-family: 'DM Sans',sans-serif;
    display: flex; align-items: center; gap: .4rem;
    transition: transform .15s, opacity .15s;
  }
  .cd-btn-green:hover { transform: translateY(-1px); }
  .cd-btn-green:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .cd-btn-orange {
    padding: .6rem 1.1rem; border: none; border-radius: 10px; cursor: pointer;
    background: linear-gradient(135deg,#f97316,#ea580c); color: white;
    font-weight: 700; font-size: .82rem; font-family: 'DM Sans',sans-serif;
    display: flex; align-items: center; gap: .4rem; transition: transform .15s;
  }
  .cd-btn-orange:hover { transform: translateY(-1px); }
  .cd-btn-ghost {
    padding: .6rem 1.1rem; border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer;
    background: white; color: #6b7280; font-weight: 600; font-size: .82rem;
    font-family: 'DM Sans',sans-serif; transition: border-color .15s, color .15s;
  }
  .cd-btn-ghost:hover { border-color: #9ca3af; color: #374151; }

  /* ── Page loading / error ── */
  .cd-center { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
  .cd-page-spinner {
    width: 56px; height: 56px; border-radius: 50%;
    border: 3px solid #dcfce7; border-top-color: #16a34a;
    animation: spin .8s linear infinite;
  }
  .cd-error-box {
    background: white; border-radius: 20px; border: 1.5px solid #fecdd3;
    padding: 3rem 2rem; text-align: center; max-width: 480px;
    box-shadow: 0 4px 20px rgba(239,68,68,.07);
  }
`;

/* ─── Inline SVGs ─────────────────────────────────────────────────────── */
const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ClipboardPlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

/* ─── MemberList ──────────────────────────────────────────────────────── */
const MemberList: React.FC<{ members: ClassMember[]; creatorEmail: string; accounts: Account[] }> = ({ members, creatorEmail, accounts }) => (
  <div className="cd-members-grid">
    {members.map(member => {
      const acc = accounts.find(a => a.Email.toLowerCase() === member.email.toLowerCase());
      return (
        <div key={member.email} className="cd-member">
          <div className="cd-member-avatar-wrap">
            <div className="cd-member-avatar">
              {acc?.AvatarURL ? (
                <Image 
                  src={convertGoogleDriveUrl(acc.AvatarURL)} 
                  alt={member.name} 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                member.name.charAt(0).toUpperCase()
              )}
            </div>
            {member.email === creatorEmail && (
              <div className="cd-member-creator-badge" title="Giáo viên">
                <StarIcon />
              </div>
            )}
          </div>
          <div className="cd-member-name" title={member.name}>{member.name}</div>
          <div className="cd-member-email" title={member.email}>{member.email}</div>
        </div>
      );
    })}
  </div>
);

/* ─── AssignmentList ──────────────────────────────────────────────────── */
const AssignmentList: React.FC<{ quizzes: AssignedQuiz[]; documents: ClassDocument[]; classId: string; isCreator: boolean; onOpenUpload: () => void }> = ({ quizzes, documents, classId, isCreator, onOpenUpload }) => (
  <div>
    {isCreator && (
      <div className="cd-assign-header">
        <div>
          <div className="syne" style={{ fontSize: '.9rem', fontWeight: 700, color: '#374151' }}>
            {quizzes.length + documents.length} bài tập & tài liệu
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={onOpenUpload} className="cd-assign-cta" style={{ background: 'white', color: '#16a34a', border: '1.5px solid #bbf7d0', boxShadow: 'none', cursor: 'pointer' }}>
            <UploadIcon />
            Giao tài liệu
          </button>

        </div>
      </div>
    )}

    {documents.length > 0 && (
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tài liệu</h4>
        {documents.map((doc) => (
          <div key={doc.DocumentID} className="cd-quiz-card">
            <div className="cd-quiz-icon" style={{ background: 'linear-gradient(135deg, #e0f2fe, #bfdbfe)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cd-quiz-title">{doc.Title}</div>
              <div className="cd-quiz-meta">
                <span className="truncate max-w-[300px]">{doc.Description || 'Tài liệu học tập'}</span>
                {doc.DueDate && (
                  <span className="cd-quiz-due">
                    <ClockIcon />
                    {new Date(doc.DueDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            <a href={doc.DocumentURL} target="_blank" rel="noopener noreferrer" className="cd-quiz-btn" style={{ background: 'white', color: '#2563eb', border: '1.5px solid #bfdbfe', boxShadow: 'none' }}>
              <DownloadIcon />
              Mở
            </a>
          </div>
        ))}
      </div>
    )}

    {quizzes.length > 0 ? (
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bài kiểm tra</h4>
        {quizzes.map((quiz, i) => (
          <div key={quiz.quizId} className="cd-quiz-card" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="cd-quiz-icon">
              <BookIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cd-quiz-title">{quiz.title}</div>
              <div className="cd-quiz-meta">
                <span><BookIcon />{quiz.questionCount} câu hỏi</span>
                <span><UsersIcon />{quiz.results?.length || 0} lượt làm</span>
                {quiz.dueDate && (
                  <span className="cd-quiz-due">
                    <ClockIcon />
                    {new Date(quiz.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            <Link href={`/tests/take?id=${quiz.quizId}`} className="cd-quiz-btn">
              <PlayIcon />
              Làm bài
            </Link>
          </div>
        ))}
      </div>
    ) : documents.length === 0 && (
      <div className="cd-empty">
        <div className="cd-empty-icon">📋</div>
        <h3>Chưa có bài tập nào</h3>
        <p>{isCreator ? 'Nhấn "Giao bài kiểm tra" để thêm bài tập cho lớp học.' : 'Giáo viên chưa giao bài tập nào cho lớp học này.'}</p>
      </div>
    )}
  </div>
);

/* ─── AddStudentsModal ────────────────────────────────────────────────── */
const AddStudentsModal: React.FC<{
  classId: string;
  onClose: () => void;
  onStudentsAdded: () => void;
}> = ({ classId, onClose, onStudentsAdded }) => {
  const [names, setNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [modalState, setModalState] = useState<'input' | 'creating' | 'results'>('input');
  const [createdCredentials, setCreatedCredentials] = useState<NewStudentCredential[]>([]);
  const { addToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAddName = () => {
    const trimmed = currentName.trim();
    if (!trimmed) return;
    setNames(prev => [...prev, trimmed]);
    setCurrentName('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddName(); }
  };

  const handleCreateAccounts = async () => {
    if (names.length === 0) { addToast('Vui lòng thêm ít nhất một tên học sinh.', 'error'); return; }
    setModalState('creating');
    try {
      const result = await batchAddStudents(classId, names);
      if (result.success && result.createdStudents) {
        setCreatedCredentials(result.createdStudents);
        setModalState('results');
        onStudentsAdded();
      } else {
        addToast(result.error || 'Tạo tài khoản thất bại.', 'error');
        setModalState('input');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
      setModalState('input');
    }
  };

  const copyCredentials = () => {
    const text = createdCredentials.map(c => `Tên: ${c.name}\nEmail: ${c.email}\nMật khẩu: ${c.password}`).join('\n\n');
    navigator.clipboard.writeText(text);
    addToast('Đã sao chép thông tin tài khoản!', 'success');
  };

  const downloadDoc = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Danh sách tài khoản</title></head>
      <body>
      <h2 style="text-align: center; font-family: Arial, sans-serif;">DANH SÁCH TÀI KHOẢN HỌC SINH</h2>
      <p style="text-align: center; font-family: Arial, sans-serif; color: #666;">Lớp: ${classId}</p>
      <br/>
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 10px;">STT</th>
            <th style="padding: 10px;">Họ tên</th>
            <th style="padding: 10px;">Email</th>
            <th style="padding: 10px;">Mật khẩu</th>
          </tr>
        </thead>
        <tbody>
          ${createdCredentials.map((c, i) => `
            <tr>
              <td style="padding: 10px; text-align: center;">${i + 1}</td>
              <td style="padding: 10px;">${c.name}</td>
              <td style="padding: 10px;">${c.email}</td>
              <td style="padding: 10px; font-weight: bold;">${c.password}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br/>
      <p style="font-family: Arial, sans-serif; font-style: italic;">* Vui lòng yêu cầu học sinh đổi mật khẩu sau khi đăng nhập lần đầu.</p>
      </body></html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tai_khoan_hoc_sinh_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Đã tải xuống danh sách tài khoản!', 'success');
  };

  const titles = { input: 'Thêm học sinh vào lớp', creating: 'Đang tạo tài khoản...', results: '✓ Tài khoản đã được tạo' };

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-modal-stripe" />

        <div className="cd-modal-header">
          <h2>{titles[modalState]}</h2>
          <button className="cd-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="cd-modal-body">
          {modalState === 'input' && (
            <>
              <div className="cd-modal-input-row">
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={currentName}
                  onChange={e => setCurrentName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập họ và tên học sinh, nhấn Enter..."
                  className="cd-modal-input"
                />
                <button onClick={handleAddName} className="cd-modal-add-btn">
                  <PlusIcon /> Thêm
                </button>
              </div>

              <div className="cd-chip-list">
                {names.length === 0
                  ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '.82rem' }}>
                      Nhập tên và nhấn <strong>Enter</strong> hoặc nút <strong>Thêm</strong>
                    </div>
                  : names.map((name, i) => (
                    <div key={i} className="cd-chip">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                          {name.charAt(0).toUpperCase()}
                        </span>
                        {name}
                      </span>
                      <button className="cd-chip-remove" onClick={() => setNames(p => p.filter((_, j) => j !== i))}>
                        <TrashIcon />
                      </button>
                    </div>
                  ))
                }
              </div>

              {names.length > 0 && (
                <div style={{ marginTop: '.75rem', fontSize: '.75rem', color: '#9ca3af', textAlign: 'center' }}>
                  {names.length} học sinh sẽ được tạo tài khoản và thêm vào lớp
                </div>
              )}
            </>
          )}

          {modalState === 'creating' && (
            <div className="cd-modal-loading">
              <div className="cd-modal-spinner" />
              <div className="syne" style={{ fontWeight: 700, color: '#111827', marginBottom: '.4rem' }}>Đang tạo tài khoản...</div>
              <p style={{ fontSize: '.82rem', color: '#9ca3af' }}>Đang tạo {names.length} tài khoản và ghi danh vào lớp học</p>
            </div>
          )}

          {modalState === 'results' && (
            <>
              <div className="cd-results-banner">
                ✓ Đã tạo thành công <strong>{createdCredentials.length}</strong> tài khoản. Sao chép và chia sẻ thông tin này cho học sinh.
              </div>
              <div className="cd-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Mật khẩu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdCredentials.map(cred => (
                      <tr key={cred.email}>
                        <td>{cred.name}</td>
                        <td className="mono">{cred.email}</td>
                        <td className="mono" style={{ fontWeight: 'bold', color: '#16a34a' }}>{cred.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="cd-modal-footer">
          {modalState === 'input' && (
            <>
              <button className="cd-btn-ghost" onClick={onClose}>Hủy</button>
              <button className="cd-btn-green" onClick={handleCreateAccounts} disabled={names.length === 0}>
                <CheckIcon />
                Tạo {names.length > 0 ? `${names.length} tài khoản` : 'tài khoản'}
              </button>
            </>
          )}
          {modalState === 'results' && (
            <>
              <button className="cd-btn-ghost" onClick={onClose}>Đóng</button>
              <button className="cd-btn-green" onClick={downloadDoc}>
                <DownloadIcon size={14} />
                Tải file .doc
              </button>
              <button className="cd-btn-orange" onClick={copyCredentials}>
                <CopyIcon size={14} />
                Sao chép tất cả
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── UploadDocumentModal ─────────────────────────────────────────────── */
const UploadDocumentModal: React.FC<{
  classId: string;
  authorEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ classId, authorEmail, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      addToast('Vui lòng chọn file và nhập tiêu đề.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const result = await assignDocumentToClass(classId, file, title, description, dueDate, authorEmail);
      if (result.success) {
        addToast('Giao tài liệu thành công!', 'success');
        onSuccess();
      } else {
        addToast(result.error || 'Có lỗi xảy ra.', 'error');
      }
    } catch (error: any) {
      addToast(error.message || 'Lỗi kết nối.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-modal-stripe" />
        <div className="cd-modal-header">
          <h2>Giao tài liệu mới</h2>
          <button className="cd-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="cd-modal-body">
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cd-modal-input w-full" placeholder="Ví dụ: Đề cương ôn tập..." required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="cd-modal-input w-full" rows={3} placeholder="Mô tả nội dung tài liệu..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hạn xem/nộp</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="cd-modal-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Chọn file <span className="text-red-500">*</span></label>
              <input type="file" onChange={e => { if(e.target.files?.[0]) { setFile(e.target.files[0]); if(!title) setTitle(e.target.files[0].name); } }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="cd-btn-ghost">Hủy</button>
              <button type="submit" disabled={isUploading} className="cd-btn-green">
                {isUploading ? 'Đang tải lên...' : 'Giao tài liệu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [classInfo, setClassInfo] = useState<Classroom | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [quizzes, setQuizzes] = useState<AssignedQuiz[]>([]);
  const [documents, setDocuments] = useState<ClassDocument[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDetails = useCallback(async (silent = false) => {
    if (!classId) { setError('ID lớp học không hợp lệ.'); setIsLoading(false); return; }
    if (!silent) setIsLoading(true);
    try {
      const [result, accs, docs] = await Promise.all([
        getClassDetails(classId),
        fetchAccounts(),
        getClassDocuments(classId)
      ]);
      if (result) {
        setClassInfo(result.info);
        setMembers(result.members.sort((a, b) => a.name.localeCompare(b.name)));
        setQuizzes(result.quizzes.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
      } else {
        setError('Không tìm thấy thông tin lớp học.');
      }
      setAccounts(accs);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu lớp học.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const isCreator = currentUser?.Email === classInfo?.CreatorEmail;

  const handleCopyCode = () => {
    if (!classInfo?.JoinCode) return;
    navigator.clipboard.writeText(classInfo.JoinCode);
    setCopied(true);
    addToast('Đã sao chép mã tham gia!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  /* Loading */
  if (isLoading) return (
    <div className="cd-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cd-center">
        <div style={{ textAlign: 'center' }}>
          <div className="cd-page-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '.9rem' }}>Đang tải lớp học...</p>
        </div>
      </div>
    </div>
  );

  /* Error */
  if (error) return (
    <div className="cd-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cd-center">
        <div className="cd-error-box">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div className="syne" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#be123c', marginBottom: '.5rem' }}>Đã xảy ra lỗi</div>
          <p style={{ color: '#6b7280', fontSize: '.875rem', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => router.push('/classroom')}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '.7rem 1.5rem', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '.875rem' }}
          >
            Quay lại danh sách lớp
          </button>
        </div>
      </div>
    </div>
  );

  if (!classInfo) return null;

  const creatorName = classInfo.CreatorEmail?.split('@')[0] || 'Giáo viên';

  return (
    <div className="cd-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* Back */}
        <Link href="/classroom" className="cd-back">
          <ArrowLeft />
          Danh sách lớp học
        </Link>

        {/* ── Hero ── */}
        <div className="cd-hero">
          <div className="cd-hero-stripe" />
          <div className="cd-hero-body">
            <div className="cd-hero-top">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cd-subject-badge">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  {classInfo.Subject}
                </div>
                <h1 className="syne cd-class-name">{classInfo.ClassName}</h1>
                {classInfo.Description && (
                  <p className="cd-desc">{classInfo.Description}</p>
                )}

                {/* Stats */}
                <div className="cd-stats">
                  <div className="cd-stat">
                    <div className="cd-stat-icon" style={{ background: '#dcfce7' }}>
                      <UsersIcon />
                    </div>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>{members.length}</span> thành viên
                  </div>
                  <div className="cd-stat">
                    <div className="cd-stat-icon" style={{ background: '#ffedd5' }}>
                      <BookIcon />
                    </div>
                    <span style={{ color: '#f97316', fontWeight: 700 }}>{quizzes.length}</span> bài tập
                  </div>
                </div>
              </div>

              {/* Join code */}
              <div className="cd-code-box">
                <div>
                  <div className="cd-code-label">Mã tham gia</div>
                  <div className="cd-code-value">{classInfo.JoinCode}</div>
                </div>
                <button className="cd-copy-btn" onClick={handleCopyCode} title="Sao chép mã">
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>

            {/* Creator */}
            <div className="cd-creator-row">
              <div className="cd-creator-avatar">{creatorName.charAt(0).toUpperCase()}</div>
              <span className="cd-creator-text">
                Giáo viên: <strong>{creatorName}</strong>
                {isCreator && <span style={{ marginLeft: '.4rem', fontSize: '.68rem', background: '#f97316', color: 'white', padding: '.1rem .5rem', borderRadius: 9999, fontWeight: 700 }}>Bạn</span>}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cd-tabs">
          <button
            className={`cd-tab${activeTab === 'assignments' ? ' active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <BookIcon />
            Bài tập
            <span className="cd-tab-count">{quizzes.length}</span>
          </button>
          <button
            className={`cd-tab${activeTab === 'members' ? ' active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <UsersIcon />
            Thành viên
            <span className="cd-tab-count">{members.length}</span>
          </button>

          {isCreator && (
            <button className="cd-tab-action" onClick={() => setIsAddStudentModalOpen(true)}>
              <ClipboardPlusIcon />
              Thêm học sinh
            </button>
          )}
        </div>

        {/* ── Content ── */}
        {activeTab === 'assignments' && (
          <AssignmentList quizzes={quizzes} documents={documents} classId={classId} isCreator={isCreator} onOpenUpload={() => setIsUploadModalOpen(true)} />
        )}
        {activeTab === 'members' && (
          <MemberList members={members} creatorEmail={classInfo.CreatorEmail} accounts={accounts} />
        )}

        {/* ── Modal ── */}
        {isAddStudentModalOpen && (
          <AddStudentsModal
            classId={classId}
            onClose={() => setIsAddStudentModalOpen(false)}
            onStudentsAdded={() => {
              addToast('Đã thêm học sinh, đang làm mới danh sách...', 'info');
              fetchDetails(true);
            }}
          />
        )}

        {isUploadModalOpen && currentUser && (
          <UploadDocumentModal
            classId={classId}
            authorEmail={currentUser.Email}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={() => { setIsUploadModalOpen(false); fetchDetails(true); }}
          />
        )}
      </div>
    </div>
  );
}