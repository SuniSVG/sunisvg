'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/shared/Icon';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourses, fetchPurchasedCategories, fetchForumPosts, fetchForumComments, addForumPost, fetchAccounts, getSharedCoursesInbox } from '@/services/googleSheetService';
import { Course, ForumPost, ForumComment, Account } from '@/types';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { parseVNDateToDate, timeAgo } from '@/utils/dateUtils';
import { ForumPostModal } from './ForumPostModal';
import { useToast } from '@/contexts/ToastContext';
import { AnimatePresence } from 'motion/react';
import { FileText, Download } from 'lucide-react';

const parseForumDate = (dateStr: string | undefined): Date => {
    if (!dateStr) return new Date();
    
    // Handle format: HH:mm:ss dd/MM/yyyy (e.g., 13:10:12 11/9/2025)
    const timeDateRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.trim().match(timeDateRegex);
    
    if (match) {
        const [_, h, m, s, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    // Handle format: dd/MM/yyyy HH:mm:ss (Standard VN)
    const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match2 = dateStr.trim().match(dateTimeRegex);
    
    if (match2) {
        const [_, day, month, year, h, m, s] = match2;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
};

const parseAttachments = (urlsStr: string | undefined) => {
    if (!urlsStr || !urlsStr.trim()) return { images: [], files: [] };
    
    const rawUrls = urlsStr.split(',').filter(Boolean);
    const images: string[] = [];
    const files: { url: string; name: string; mime: string }[] = [];

    rawUrls.forEach(url => {
        let cleanUrl = url.trim();
        let mime = '';
        let name = 'File đính kèm';

        if (url.includes('#')) {
            const [u, hash] = url.split('#');
            cleanUrl = u.trim();
            const params = new URLSearchParams(hash);
            mime = params.get('mime') || '';
            name = params.get('name') || 'File đính kèm';
        }

        if (mime.startsWith('image/') || (!mime && !url.includes('#'))) {
            images.push(url);
        } else {
            files.push({ url: cleanUrl, name, mime });
        }
    });

    return { images, files };
};

const FileAttachmentList = ({ files }: { files: { url: string; name: string; mime: string }[] }) => {
    if (files.length === 0) return null;
    return (
        <div className="flex flex-col gap-1.5 mt-2">
            {files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-100/50 border border-gray-200/60 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm text-emerald-500 border border-gray-100"><FileText className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-600 truncate group-hover:text-emerald-700">{f.name}</p><p className="text-[9px] text-gray-400 uppercase">{f.mime.split('/')[1] || 'FILE'}</p></div>
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500" />
                </a>
            ))}
        </div>
    );
};

// ── AnimatedDigit: slot-machine style digit roller ──
function AnimatedDigit({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [prev, setPrev] = React.useState(value);
  const [animDir, setAnimDir] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (value === displayValue) return;
    // Determine direction: if new value > old value, scroll up; else down
    const dir = value > displayValue ? 'up' : 'down';
    setAnimDir(dir);
    setPrev(displayValue);
    // After a brief delay, finalize
    const t = setTimeout(() => {
      setDisplayValue(value);
      setAnimDir(null);
    }, 180);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className="pomo-digit-wrap">
      {animDir && (
        <span className={`pomo-digit pomo-digit-exit-${animDir}`}>{prev}</span>
      )}
      <span className={animDir ? `pomo-digit pomo-digit-enter-${animDir}` : 'pomo-digit'}>
        {displayValue}
      </span>
    </span>
  );
}

export function RightSidebar() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { quickNote, setQuickNote } = useAppStore();

  // ── Local Pomodoro (fully self-contained, independent of store) ──
  const [localWorkDur, setLocalWorkDur] = useState(25);
  const [localBreakDur, setLocalBreakDur] = useState(5);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [displayTime, setDisplayTime] = useState(25 * 60);
  const [isAnimating, setIsAnimating] = useState(false);
  const animFromRef = React.useRef(25 * 60);
  const animFrameRef = React.useRef<number | null>(null);

  // ── animateTo: smoothly tween displayTime to target ──
  const animateTo = useCallback((from: number, target: number, durationMs = 700) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFromRef.current = from;
    setIsAnimating(true);
    const startTs = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTs;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const cur = Math.round(from + (target - from) * eased);
      setDisplayTime(cur);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayTime(target);
        setIsAnimating(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Countdown ticker ──
  useEffect(() => {
    if (!pomodoroIsActive) return;
    const id = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setPomodoroIsActive(false);
          setPomodoroMode(m => {
            const nextMode = m === 'work' ? 'break' : 'work';
            const nextSecs = nextMode === 'work' ? localWorkDur * 60 : localBreakDur * 60;
            setTimeout(() => {
              setPomodoroTimeLeft(nextSecs);
              setDisplayTime(nextSecs);
            }, 0);
            return nextMode;
          });
          setDisplayTime(0);
          return 0;
        }
        const next = prev - 1;
        setDisplayTime(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoroIsActive, localWorkDur, localBreakDur]);

  // ── resetPomodoro with animation ──
  const resetPomodoro = useCallback((workMin?: number, breakMin?: number) => {
    const wm = workMin ?? localWorkDur;
    const bm = breakMin ?? localBreakDur;
    setPomodoroIsActive(false);
    const target = pomodoroMode === 'work' ? wm * 60 : bm * 60;
    setPomodoroTimeLeft(target);
    animateTo(displayTime, target, 700);
  }, [pomodoroMode, localWorkDur, localBreakDur, displayTime, animateTo]);

  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [workInput, setWorkInput] = useState('25');
  const [breakInput, setBreakInput] = useState('5');
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchasedCategories, setPurchasedCategories] = useState<Set<string>>(new Set());
  const [sharedCourseIds, setSharedCourseIds] = useState<Set<string>>(new Set());
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [livePosts, setLivePosts] = useState<any[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const fetchLivePosts = useCallback(async (shouldScroll = false) => {
    try {
      const response = await fetch(`/api/forum/live?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        const cleanedData = data.map((p: any) => ({
          ...p,
          Title: String(p.Title || '').replace(/^\\\|\//, ''),
          Content: String(p.Content || '').replace(/^\\\|\//, '')
        }));
        setLivePosts(cleanedData);
        localStorage.setItem('edifyx_live_posts_cache', JSON.stringify(cleanedData)); // Cache live posts
        if (shouldScroll) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error('Failed to fetch live posts', error);
    } finally {
      setIsLiveLoading(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    const loadData = async () => {
      // Load cached live posts immediately for instant feel
      const cachedLivePosts = localStorage.getItem('edifyx_live_posts_cache');
      if (cachedLivePosts) {
        try {
          setLivePosts(JSON.parse(cachedLivePosts));
          setIsLiveLoading(false);
          setTimeout(scrollToBottom, 0);
        } catch {}
      }

      try {
        const [coursesData, purchasedData, accountsData, sharedData] = await Promise.all([
          fetchCourses(),
          currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([]),
          fetchAccounts(),
          currentUser ? getSharedCoursesInbox(currentUser.Email) : Promise.resolve({ success: false, data: [] })
        ]);
        setCourses(coursesData);
        setPurchasedCategories(new Set(purchasedData.map((p: any) => p.CategoryName)));
        
        if (sharedData.success && sharedData.data) {
            const acceptedIds = sharedData.data
                .filter((item: any) => item.status === 'accepted')
                .map((item: any) => String(item.courseId));
            setSharedCourseIds(new Set(acceptedIds));
        }

        setAccounts(accountsData);
        localStorage.removeItem('edifyx_virtual_posts');
        await fetchLivePosts(true);
      } catch (error) {
        console.error('Failed to load sidebar data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    let interval: NodeJS.Timeout;
    const startPolling = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchLivePosts();
      }, 8000);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLivePosts();
        startPolling();
      } else {
        clearInterval(interval);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, fetchLivePosts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { addToast('Vui lòng đăng nhập để gửi tin nhắn', 'info'); return; }
    const content = messageInput.trim();
    if (!content) return;

    // Optimistic update: Hiển thị tin nhắn ngay lập tức
    const tempId = `temp-${Date.now()}`;
    const optimisticPost = {
      ID: tempId,
      Title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      Content: content,
      AuthorName: currentUser['Tên tài khoản'],
      AuthorEmail: currentUser.Email, // Thêm email để modal hiển thị avatar
      Timestamp: new Date().toISOString(),
      commentCount: 0,
    };

    setLivePosts(prev => [...prev, optimisticPost]);
    setMessageInput('');
    setTimeout(scrollToBottom, 50);

    try {
      const result = await addForumPost({
        Title: optimisticPost.Title,
        Content: content,
        AuthorEmail: currentUser.Email,
        AuthorName: currentUser['Tên tài khoản'],
        Channel: 'Chung',
      });
      if (result.success) {
        // Tải lại ngầm để đồng bộ dữ liệu thật từ server
        await fetchLivePosts(false);
      } else {
        // Hoàn tác nếu lỗi
        setLivePosts(prev => prev.filter(p => p.ID !== tempId));
        setMessageInput(content);
        addToast(result.error || 'Lỗi khi gửi tin nhắn', 'error');
      }
    } catch (error) {
      setLivePosts(prev => prev.filter(p => p.ID !== tempId));
      setMessageInput(content);
      addToast('Lỗi kết nối', 'error');
    }
  };

const cleanCategoryName = (name: string): string => 
  (name ?? '').replace(/\s*\([\d.,]+\s*đ\)$/i, '').trim();

  const isCourseOwned = useMemo(() => (course: Course): boolean => {
    if (sharedCourseIds.has(String(course.ID))) return true;
    for (const pc of purchasedCategories) {
      const cleanPc = cleanCategoryName(pc);
      if (cleanPc === cleanCategoryName(course.Category || '') || cleanPc === cleanCategoryName(course.Title || '')) return true;
    }
    return false;
  }, [purchasedCategories, sharedCourseIds]);

  const recommendedCourses = useMemo(() => courses.filter(c => !isCourseOwned(c)), [courses, isCourseOwned]);
  const freeCourses = useMemo(() => recommendedCourses.filter(c => c.Price === 0).slice(0, 2), [recommendedCourses]);
  const paidCourses = useMemo(() => recommendedCourses.filter(c => c.Price > 0).slice(0, 2), [recommendedCourses]);

  // Use displayTime for rendering (animated), pomodoroTimeLeft for logic
  const dispMins = Math.floor(displayTime / 60);
  const dispSecs = displayTime % 60;
  const totalDuration = pomodoroMode === 'work' ? localWorkDur * 60 : localBreakDur * 60;
  const pomodoroProgress = Math.min(100, Math.max(0, ((totalDuration - pomodoroTimeLeft) / totalDuration) * 100));

  const applySettings = () => {
    const w = Math.min(90, Math.max(1, parseInt(workInput) || 25));
    const b = Math.min(30, Math.max(1, parseInt(breakInput) || 5));
    setLocalWorkDur(w);
    setLocalBreakDur(b);
    setWorkDuration(w);
    setBreakDuration(b);
    setWorkInput(String(w));
    setBreakInput(String(b));
    resetPomodoro(w, b);
    setShowPomodoroSettings(false);
  };

  // Avatar color palette cycling
  const avatarColors = [
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-green-500 to-emerald-700',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-cyan-600',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@600;800&display=swap');

        .sidebar-root {
          font-family: 'Sora', sans-serif;
        }
        .sidebar-root * {
          box-sizing: border-box;
        }

        /* Scrollbar */
        .sidebar-root ::-webkit-scrollbar { width: 4px; }
        .sidebar-root ::-webkit-scrollbar-track { background: transparent; }
        .sidebar-root ::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 99px; }
        .sidebar-root ::-webkit-scrollbar-thumb:hover { background: #6ee7b7; }

        /* Card */
        .sb-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1.5px solid #ecfdf5;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06), 0 1px 3px rgba(0,0,0,0.04);
          overflow: visible;
          transition: box-shadow 0.2s ease;
        }
        .sb-card:hover {
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1), 0 1px 4px rgba(0,0,0,0.05);
        }

        /* Section headers */
        .sb-section-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #059669;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sb-section-label::before {
          content: '';
          width: 14px;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #f97316);
          border-radius: 99px;
          display: inline-block;
        }

        /* Tool buttons */
        .tool-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.18s ease;
          background: #f9fafb;
          position: relative;
          overflow: hidden;
        }
        .tool-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        .tool-btn:hover { transform: translateY(-1px); }
        .tool-btn:active { transform: translateY(0); }

        .tool-btn-pomodoro.active {
          background: linear-gradient(135deg, #fff7ed, #fef3c7);
          border-color: #fed7aa;
          color: #ea580c;
        }
        .tool-btn-pomodoro.active .tool-icon { color: #f97316; }
        .tool-btn-pomodoro:not(.active):hover { background: #fff7ed; border-color: #fed7aa; }

        .tool-btn-note.active {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-color: #a7f3d0;
          color: #059669;
        }
        .tool-btn-note.active .tool-icon { color: #10b981; }
        .tool-btn-note:not(.active):hover { background: #ecfdf5; border-color: #a7f3d0; }

        .tool-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-top: 4px;
          color: inherit;
        }
        .tool-icon { width: 20px; height: 20px; transition: transform 0.2s ease; }
        .tool-btn:hover .tool-icon { transform: scale(1.1); }

        /* Pomodoro ring */
        .pomodoro-ring-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          margin: 0 auto 12px;
        }
        .pomodoro-ring-wrap svg {
          transform: rotate(-90deg);
        }
        .pomodoro-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .pomodoro-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
        }
        .pomodoro-mode-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Pomodoro panel */
        .pomodoro-panel {
          animation: slideDown 0.22s ease;
          margin-top: 14px;
          padding: 16px;
          background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
          border-radius: 16px;
          border: 1.5px solid #fed7aa;
        }

        /* Note panel */
        .note-panel {
          animation: slideDown 0.22s ease;
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .note-textarea {
          width: 100%;
          min-height: 120px;
          max-height: 280px;
          padding: 12px;
          font-size: 12px;
          font-family: 'Sora', sans-serif;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 14px;
          resize: vertical;
          outline: none;
          color: #064e3b;
          line-height: 1.6;
          transition: border-color 0.2s, box-shadow 0.2s;
          overflow-y: auto;
          box-sizing: border-box;
        }
        .note-textarea:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }
        .note-textarea::placeholder { color: #6ee7b7; }
        .note-char-count {
          text-align: right;
          font-size: 9px;
          font-weight: 600;
          color: #a7f3d0;
          margin-top: 4px;
          padding-right: 2px;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Course card */
        .course-card {
          display: flex;
          gap: 10px;
          padding: 8px;
          border-radius: 12px;
          transition: background 0.15s ease;
          text-decoration: none;
          position: relative;
        }
        .course-card:hover { background: #f0fdf4; }
        .course-card:hover .course-title { color: #059669; }

        .course-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #d1fae5, #ecfdf5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 1.5px solid #d1fae5;
        }

        .course-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
          margin-bottom: 3px;
        }

        .badge-free {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: linear-gradient(90deg, #10b981, #059669);
          color: white;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 99px;
        }

        .badge-price {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: linear-gradient(90deg, #f97316, #ea580c);
          color: white;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 99px;
        }

        /* Divider */
        .sb-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d1fae5, #fed7aa, transparent);
          margin: 2px 0;
        }

        /* Forum / Live section */
        .forum-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 0;
        }
        .forum-title {
          font-size: 11px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .live-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(90deg, #ecfdf5, #d1fae5);
          border: 1px solid #a7f3d0;
          padding: 3px 10px;
          border-radius: 99px;
        }
        .live-dot {
          position: relative;
          width: 7px;
          height: 7px;
        }
        .live-dot-inner {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #10b981;
        }
        .live-dot-ping {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #10b981;
          animation: livePing 1.5s ease-in-out infinite;
        }
        @keyframes livePing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2.2); opacity: 0; }
        }
        .live-text {
          font-size: 9px;
          font-weight: 800;
          color: #059669;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Post item */
        .post-item {
          display: flex;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s ease;
          border: 1px solid transparent;
        }
        .post-item:hover {
          background: linear-gradient(135deg, #ecfdf5, #fff7ed);
          border-color: #d1fae5;
        }
        .post-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .post-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 0.15s ease;
          margin-bottom: 3px;
        }
        .post-item:hover .post-title { color: #059669; }
        .post-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .post-author {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .post-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .post-comment-count {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #10b981;
          font-weight: 600;
        }
        .post-time {
          font-size: 9px;
          color: #d1d5db;
          font-weight: 600;
        }

        /* Skeleton */
        .skeleton-block {
          background: linear-gradient(90deg, #f0fdf4 25%, #d1fae5 50%, #f0fdf4 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Chat Input */
        .chat-input-wrap {
          padding: 10px 12px 12px;
          border-top: 1px solid #ecfdf5;
        }
        .chat-form { display: flex; gap: 8px; }
        .chat-input {
          flex: 1;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 11px;
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          color: #1f2937;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .chat-input:focus {
          border-color: #10b981;
          background: #ecfdf5;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .chat-input::placeholder { color: #9ca3af; }
        .chat-input:disabled { opacity: 0.5; }

        .chat-send-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
          flex-shrink: 0;
          align-self: center;
        }
        .chat-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
          background: linear-gradient(135deg, #059669, #047857);
        }
        .chat-send-btn:active:not(:disabled) { transform: translateY(0); }
        .chat-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .send-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Pomodoro buttons */
        .pomo-start-btn {
          flex: 1;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          padding: 9px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
          letter-spacing: 0.02em;
        }
        .pomo-start-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.45);
        }
        .pomo-reset-btn {
          padding: 9px 12px;
          background: white;
          color: #ea580c;
          border: 1.5px solid #fed7aa;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* Animated Digit */
        .pomo-digits {
          display: flex;
          align-items: center;
          gap: 1px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          font-size: 26px;
          line-height: 1;
        }
        .pomo-colon {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          font-size: 22px;
          color: #1a1a1a;
          margin: 0 1px;
          opacity: 0.8;
          animation: colonBlink 1s step-end infinite;
        }
        @keyframes colonBlink {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.25; }
        }
        .pomo-digit-wrap {
          position: relative;
          width: 22px;
          height: 30px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pomo-digit {
          position: absolute;
          color: #1a1a1a;
          transition: none;
          will-change: transform, opacity;
        }
        /* Entering animations */
        .pomo-digit-enter-up {
          animation: enterFromBottom 0.18s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .pomo-digit-enter-down {
          animation: enterFromTop 0.18s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        /* Exiting animations */
        .pomo-digit-exit-up {
          animation: exitToTop 0.18s cubic-bezier(0.4,0,1,1) forwards;
        }
        .pomo-digit-exit-down {
          animation: exitToBottom 0.18s cubic-bezier(0.4,0,1,1) forwards;
        }
        @keyframes enterFromBottom {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes enterFromTop {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes exitToTop {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes exitToBottom {
          from { transform: translateY(0);   opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }

        .pomo-reset-btn:hover { background: #fff7ed; border-color: #f97316; }

        /* Pomodoro Settings */
        .pomo-settings-panel {
          animation: slideDown 0.2s ease;
          margin-top: 12px;
          padding: 12px;
          background: white;
          border-radius: 14px;
          border: 1.5px solid #fed7aa;
        }
        .pomo-settings-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ea580c;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .pomo-duration-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .pomo-duration-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pomo-duration-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
        }
        .pomo-duration-input {
          width: 100%;
          padding: 7px 8px;
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          color: #ea580c;
          text-align: center;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          -moz-appearance: textfield;
        }
        .pomo-duration-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }
        .pomo-duration-input::-webkit-outer-spin-button,
        .pomo-duration-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .pomo-duration-unit {
          font-size: 9px;
          color: #9ca3af;
          font-weight: 600;
          text-align: center;
        }
        .pomo-presets {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .pomo-preset-btn {
          flex: 1;
          min-width: 0;
          padding: 5px 6px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.14s ease;
          white-space: nowrap;
          text-align: center;
          font-family: 'Sora', sans-serif;
        }
        .pomo-preset-btn:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #ea580c;
        }
        .pomo-preset-btn.selected {
          background: linear-gradient(135deg, #fff7ed, #fef3c7);
          border-color: #f97316;
          color: #ea580c;
        }
        .pomo-apply-btn {
          width: 100%;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          padding: 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          letter-spacing: 0.02em;
        }
        .pomo-apply-btn:hover {
          box-shadow: 0 3px 10px rgba(249,115,22,0.4);
          transform: translateY(-1px);
        }
        .pomo-settings-btn {
          padding: 9px 10px;
          background: white;
          color: #6b7280;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pomo-settings-btn:hover, .pomo-settings-btn.active {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #ea580c;
        }
        .pomo-settings-btn.active {
          background: linear-gradient(135deg, #fff7ed, #fef3c7);
        }
      `}</style>

      <aside
        className="sidebar-root w-80 flex-shrink-0 bg-[#F8FAF8] border-l border-emerald-100/60 hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-hidden"
      >
        {/* ── Scrollable Top Section: Tools & Courses ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* ───────────────────────────────────────── */}
        {/* Section 1 — Learning Tools               */}
        {/* ───────────────────────────────────────── */}
        <div className="sb-card p-4">
          <div className="sb-section-label mb-4">Công cụ học tập</div>

          <div className="flex gap-3">
            {/* Pomodoro button */}
            <button
              onClick={() => setShowPomodoro(!showPomodoro)}
              className={`tool-btn tool-btn-pomodoro ${showPomodoro ? 'active' : ''}`}
            >
              <svg className="tool-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 15.5" />
              </svg>
              <span className="tool-label" style={{ color: showPomodoro ? '#ea580c' : '#6b7280' }}>Pomodoro</span>
            </button>

            {/* Note button */}
            <button
              onClick={() => setShowNote(!showNote)}
              className={`tool-btn tool-btn-note ${showNote ? 'active' : ''}`}
            >
              <svg className="tool-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="tool-label" style={{ color: showNote ? '#059669' : '#6b7280' }}>Ghi chú</span>
            </button>
          </div>

          {/* Pomodoro Panel */}
          {showPomodoro && (
            <div className="pomodoro-panel">
              {/* Ring */}
              <div className="pomodoro-ring-wrap">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="38" fill="none" stroke="#fed7aa" strokeWidth="6" />
                  <circle
                    cx="44" cy="44" r="38"
                    fill="none"
                    stroke="url(#pomoGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - pomodoroProgress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <defs>
                    <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="pomodoro-center">
                  <div className="pomo-digits">
                    <AnimatedDigit value={Math.floor(dispMins / 10)} />
                    <AnimatedDigit value={dispMins % 10} />
                    <span className="pomo-colon">:</span>
                    <AnimatedDigit value={Math.floor(dispSecs / 10)} />
                    <AnimatedDigit value={dispSecs % 10} />
                  </div>
                  <span className="pomodoro-mode-label" style={{ color: pomodoroMode === 'work' ? '#f97316' : '#10b981' }}>
                    {pomodoroMode === 'work' ? '🔥 Focus' : '☕ Nghỉ ngơi'}
                  </span>
                </div>
              </div>

              {/* Duration info row */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316' }}>
                  Focus: {localWorkDur}m
                </span>
                <span style={{ fontSize: 10, color: '#d1d5db' }}>•</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                  Nghỉ: {localBreakDur}m
                </span>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button onClick={() => setPomodoroIsActive(!pomodoroIsActive)} className="pomo-start-btn">
                  {pomodoroIsActive ? '⏸ Tạm dừng' : '▶ Bắt đầu'}
                </button>
                <button onClick={() => resetPomodoro()} className="pomo-reset-btn" title="Đặt lại">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowPomodoroSettings(s => !s)}
                  className={`pomo-settings-btn ${showPomodoroSettings ? 'active' : ''}`}
                  title="Cài đặt thời gian"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>

              {/* Settings Panel */}
              {showPomodoroSettings && (
                <div className="pomo-settings-panel">
                  <div className="pomo-settings-title">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Tuỳ chỉnh thời gian
                  </div>

                  {/* Presets */}
                  <p className="pomo-duration-label" style={{ marginBottom: 6 }}>Preset phổ biến</p>
                  <div className="pomo-presets">
                    {[
                      { label: '25 / 5', w: 25, b: 5 },
                      { label: '50 / 10', w: 50, b: 10 },
                      { label: '45 / 15', w: 45, b: 15 },
                      { label: '90 / 20', w: 90, b: 20 },
                    ].map(p => (
                      <button
                        key={p.label}
                        className={`pomo-preset-btn ${localWorkDur === p.w && localBreakDur === p.b ? 'selected' : ''}`}
                        onClick={() => {
                          setWorkInput(String(p.w));
                          setBreakInput(String(p.b));
                          setWorkDuration(p.w);
                          setBreakDuration(p.b);
                          setLocalWorkDur(p.w);
                          setLocalBreakDur(p.b);
                          resetPomodoro(p.w, p.b);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom inputs */}
                  <p className="pomo-duration-label" style={{ marginBottom: 6 }}>Tuỳ chỉnh</p>
                  <div className="pomo-duration-row">
                    <div className="pomo-duration-field">
                      <span className="pomo-duration-label">🔥 Focus</span>
                      <input
                        type="number"
                        min={1} max={90}
                        value={workInput}
                        onChange={e => setWorkInput(e.target.value)}
                        className="pomo-duration-input"
                      />
                      <span className="pomo-duration-unit">phút</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 18, color: '#d1d5db', fontWeight: 800, fontSize: 16 }}>—</div>
                    <div className="pomo-duration-field">
                      <span className="pomo-duration-label">☕ Nghỉ</span>
                      <input
                        type="number"
                        min={1} max={30}
                        value={breakInput}
                        onChange={e => setBreakInput(e.target.value)}
                        className="pomo-duration-input"
                        style={{ borderColor: '#a7f3d0', color: '#059669', background: '#ecfdf5' }}
                      />
                      <span className="pomo-duration-unit">phút</span>
                    </div>
                  </div>

                  <button onClick={applySettings} className="pomo-apply-btn">
                    ✓ Áp dụng & Đặt lại
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Note Panel */}
          {showNote && (
            <div className="note-panel">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Ghi chú nhanh ở đây..."
                className="note-textarea"
              />
              <div className="note-char-count">{quickNote.length} ký tự</div>
            </div>
          )}
        </div>
        {/* ───────────────────────────────────────── */}
        {/* Section 2 — Course Recommendations       */}
        {/* ───────────────────────────────────────── */}
        {!showPomodoro && !showNote && (
          <div className="flex flex-col gap-4">
            {freeCourses.length > 0 && (
              <div className="sb-card p-4">
                <div className="sb-section-label mb-3">Tài liệu miễn phí</div>
                <div className="flex flex-col gap-1">
                  {freeCourses.map((course, idx) => (
                    <React.Fragment key={course.ID}>
                      <Link href={`/courses/${course.ID}`} className="course-card">
                        <div className="course-thumb">
                          {course.ImageURL ? (
                            <Image
                              src={convertGoogleDriveUrl(course.ImageURL)}
                              alt={course.Title}
                              fill
                              sizes="52px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg width="22" height="22" fill="none" stroke="#a7f3d0" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col justify-center py-0.5 min-w-0 flex-1">
                          <p className="course-title">{course.Title}</p>
                          <span className="badge-free">✦ Miễn phí</span>
                        </div>
                      </Link>
                      {idx < freeCourses.length - 1 && <div className="sb-divider" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {paidCourses.length > 0 && (
              <div className="sb-card p-4">
                <div className="sb-section-label mb-3" style={{ color: '#ea580c' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 3, background: 'linear-gradient(90deg, #f97316, #10b981)', borderRadius: 99, marginRight: 6 }} />
                  Đề xuất cho bạn
                </div>
                <div className="flex flex-col gap-1">
                  {paidCourses.map((course, idx) => (
                    <React.Fragment key={course.ID}>
                      <Link href={`/courses/${course.ID}`} className="course-card">
                        <div className="course-thumb" style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', borderColor: '#fed7aa' }}>
                          {course.ImageURL ? (
                            <Image
                              src={convertGoogleDriveUrl(course.ImageURL)}
                              alt={course.Title}
                              fill
                              sizes="52px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg width="22" height="22" fill="none" stroke="#fcd34d" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col justify-center py-0.5 min-w-0 flex-1">
                          <p className="course-title">{course.Title}</p>
                          <span className="badge-price">🔥 {course.Price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </Link>
                      {idx < paidCourses.length - 1 && <div className="sb-divider" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────── */}
        {/* Section 3 — Live Forum                   */}
        {/* ───────────────────────────────────────── */}

        <div className="sb-card flex flex-col">
          {/* Header */}
          <div className="forum-header pb-3">
            <span className="forum-title">
              <span>Nhịp đập cộng đồng (Đang thử nghiệm)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLivePosts(true)}
                disabled={isLiveLoading}
                className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-50"
                title="Làm mới"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} className={isLiveLoading ? 'animate-spin' : ''}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="live-badge">
                <div className="live-dot">
                  <div className="live-dot-ping" />
                  <div className="live-dot-inner" />
                </div>
                <span className="live-text">Live</span>
              </div>
            </div>
          </div>

          {/* Thin gradient bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, #10b981 0%, #f97316 50%, #10b981 100%)', backgroundSize: '200% 100%', animation: 'shimmer 2.5s linear infinite' }} />

          {/* Posts list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1 max-h-[260px]"
          >
            {isLiveLoading ? (
              <div className="space-y-3 p-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="skeleton-block w-8 h-8 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton-block h-2.5 w-4/5 rounded" />
                      <div className="skeleton-block h-2 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : livePosts.length > 0 ? (
              livePosts.map((post, idx) => {
                const authorAccount = accounts.find(acc => 
                  (post.AuthorEmail && acc.Email.toLowerCase() === post.AuthorEmail.toLowerCase()) || 
                  acc['Tên tài khoản'] === post.AuthorName
                );
                const avatarUrl = authorAccount?.AvatarURL;
                const profileLink = authorAccount?.Email ? `/profile/${authorAccount.Email}` : '#';

                return (
                <div
                  key={post.ID}
                  onClick={() => setSelectedPost(post)}
                  className="post-item group"
                >
                  <Link href={profileLink} onClick={(e) => e.stopPropagation()} className="post-avatar self-start" style={{ background: !avatarUrl ? `linear-gradient(135deg, var(--a1), var(--a2))` : 'transparent' }} ref={!avatarUrl ? el => { if (el) { const colors = [ ['#10b981', '#059669'], ['#f97316', '#ea580c'], ['#34d399', '#10b981'], ['#fbbf24', '#f97316'], ['#6ee7b7', '#34d399'], ]; const [a1, a2] = colors[idx % colors.length]; el.style.setProperty('--a1', a1); el.style.setProperty('--a2', a2); } } : null}>
                    {avatarUrl ? (<div className="relative w-full h-full overflow-hidden rounded-[10px]"><Image src={convertGoogleDriveUrl(avatarUrl)} alt={post.AuthorName} fill sizes="32px" className="object-cover" referrerPolicy="no-referrer" /></div>) : (post.AuthorName.charAt(0).toUpperCase())}
                  </Link>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <p className="post-title">{post.Title}</p>
                    
                    {post.Content && (
                        <p className="text-xs text-gray-600 leading-relaxed mt-1 mb-2 whitespace-pre-wrap break-words line-clamp-5">
                            {post.Content}
                        </p>
                    )}

                    {(() => {
                        const { images, files } = parseAttachments(post.ImageURLs);
                        const { files: docFiles } = parseAttachments(post.DocURLs);
                        const allFiles = [...files, ...docFiles];

                        return (
                            <>
                                {images.length > 0 && (
                                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                        {images.map((url, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                <Image src={convertGoogleDriveUrl(url.split('#')[0])} alt="" fill sizes="150px" className="object-contain" referrerPolicy="no-referrer" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <FileAttachmentList files={allFiles} />
                            </>
                        );
                    })()}

                    <div className="post-meta mt-2">
                      <Link 
                        href={profileLink}
                        onClick={(e) => e.stopPropagation()}
                        className="post-author hover:text-emerald-600 transition-colors"
                      >
                        {post.AuthorName}
                      </Link>
                      <div className="post-stats">
                        <span className="post-comment-count">
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          {post.commentCount}
                        </span>
                        <span className="post-time">{timeAgo(parseForumDate(post.Timestamp).toISOString())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              <p className="text-center py-6" style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                Chưa có thảo luận nào
              </p>
            )}
          </div>

          {/* Chat Input */}
          <div className="chat-input-wrap">
            <form className="chat-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={currentUser ? 'Chia sẻ với cộng đồng...' : 'Đăng nhập để nhắn tin'}
                disabled={!currentUser || isSending}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={!currentUser || isSending || !messageInput.trim()}
                className="chat-send-btn"
              >
                {isSending ? (
                  <div className="send-spinner" />
                ) : (
                  <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
        </div>
      </aside>

      {/* Post Modal - Moved outside aside to prevent clipping */}
      <AnimatePresence>
        {selectedPost && (
          <ForumPostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
      </AnimatePresence>
    </>
  );
}