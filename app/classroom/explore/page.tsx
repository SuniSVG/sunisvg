'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPublicClasses, joinClass } from '@/services/googleSheetService';
import type { Classroom } from '@/types';

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .exp-page * { font-family: 'DM Sans', sans-serif; }
  .exp-page h1, .exp-page h2, .exp-page .syne { font-family: 'Syne', sans-serif; }

  .exp-page {
    min-height: 100vh;
    background: #f0fdf4;
    background-image:
      radial-gradient(ellipse 80% 60% at 5% 0%, #dcfce780 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 95% 100%, #ffedd580 0%, transparent 55%);
    padding: 2.5rem 1.5rem 4rem;
  }

  .exp-card {
    background: white; border-radius: 20px; overflow: hidden;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 2px 12px rgba(0,0,0,.05);
    display: flex; flex-direction: column;
    transition: transform .25s, box-shadow .25s, border-color .25s;
  }
  .exp-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(22,163,74,.12);
    border-color: #16a34a;
  }

  .exp-card-body { padding: 1.5rem; flex: 1; }
  .exp-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    padding: .3rem .75rem; border-radius: 9999px;
    background: #dcfce7; color: #15803d;
  }
  .exp-name {
    font-family: 'Syne', sans-serif; font-size: 1.15rem;
    font-weight: 700; color: #111827; margin: .75rem 0 .4rem;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .exp-desc {
    font-size: .83rem; color: #6b7280; line-height: 1.6;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    min-height: 40px;
  }

  .exp-footer {
    border-top: 1.5px solid #f3f4f6;
    padding: 1rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    background: #fafafa;
  }
  .exp-stat {
    display: flex; align-items: center; gap: .4rem;
    font-size: .75rem; font-weight: 600; color: #6b7280;
  }

  .exp-join-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    background: #16a34a; color: white;
    font-size: .8rem; font-weight: 700;
    padding: .5rem 1rem; border-radius: 10px;
    border: none; cursor: pointer;
    transition: background .2s;
  }
  .exp-join-btn:hover { background: #15803d; }
  .exp-join-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .exp-search-bar {
    width: 100%; padding: .8rem 1.2rem; padding-left: 2.8rem;
    border: 1.5px solid #e5e7eb; border-radius: 14px;
    font-size: .9rem; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .exp-search-bar:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }

  .exp-pill {
    padding: .4rem 1rem; border-radius: 9999px;
    font-size: .8rem; font-weight: 600;
    border: 1.5px solid #e5e7eb; background: white; color: #6b7280;
    cursor: pointer; transition: all .2s;
  }
  .exp-pill:hover { border-color: #16a34a; color: #16a34a; }
  .exp-pill.active { background: #16a34a; border-color: #16a34a; color: white; }
`;

const SUBJECTS = ['Tất cả', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý', 'GDCD', 'Tin học'];

export default function ExploreClassesPage() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [classes, setClasses] = useState<(Classroom & { JoinCode: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicClasses();
        setClasses(data);
      } catch (error) {
        console.error(error);
        addToast('Không thể tải danh sách lớp học.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [addToast]);

  const filtered = useMemo(() => {
    return classes.filter(c => {
      const matchSearch = !search || 
        c.ClassName?.toLowerCase().includes(search.toLowerCase()) || 
        c.Description?.toLowerCase().includes(search.toLowerCase());
      const matchSubject = selectedSubject === 'Tất cả' || c.Subject === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [classes, search, selectedSubject]);

  const handleJoin = async (cls: Classroom & { JoinCode: string }) => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập để tham gia lớp học.', 'info');
      router.push('/login');
      return;
    }
    if (!cls.JoinCode) {
      addToast('Lớp học này không có mã tham gia.', 'error');
      return;
    }

    setJoiningId(cls.ClassID);
    try {
      const result = await joinClass(cls.JoinCode, currentUser.Email);
      if (result.success) {
        addToast(`Đã tham gia lớp "${cls.ClassName}" thành công!`, 'success');
        router.push(`/classroom/${cls.ClassID}`);
      } else {
        addToast(result.error || 'Tham gia thất bại.', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="exp-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link href="/classroom" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none', marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Quay lại lớp học
          </Link>
          <h1 className="syne" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f1a10', marginBottom: '.5rem' }}>Khám phá lớp học</h1>
          <p style={{ color: '#6b7280' }}>Tìm kiếm và tham gia các lớp học công khai từ cộng đồng SuniSVG.</p>
        </div>

        {/* Controls */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative', maxWidth: 500 }}>
            <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              className="exp-search-bar"
              placeholder="Tìm kiếm theo tên lớp, mô tả..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
            {SUBJECTS.map(s => (
              <button
                key={s}
                className={`exp-pill ${selectedSubject === s ? 'active' : ''}`}
                onClick={() => setSelectedSubject(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%' }} />
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(cls => (
              <div key={cls.ClassID} className="exp-card">
                <div className="exp-card-body">
                  <span className="exp-badge">{cls.Subject}</span>
                  <div className="exp-name">{cls.ClassName}</div>
                  <p className="exp-desc">{cls.Description || 'Không có mô tả.'}</p>
                </div>
                <div className="exp-footer">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                    <div className="exp-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {cls.memberCount || 0} thành viên
                    </div>
                    <div className="exp-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      {cls.quizCount || 0} bài tập
                    </div>
                  </div>
                  <button 
                    className="exp-join-btn"
                    onClick={() => handleJoin(cls)}
                    disabled={joiningId === cls.ClassID}
                  >
                    {joiningId === cls.ClassID ? (
                      <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #ffffff80', borderTopColor: 'white', borderRadius: '50%' }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    )}
                    Tham gia
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: 20, border: '1.5px dashed #d1fae5' }}>
            <div style={{ width: 60, height: 60, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#16a34a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 className="syne" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '.5rem' }}>Không tìm thấy lớp học</h3>
            <p style={{ color: '#6b7280' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc môn học.</p>
          </div>
        )}
      </div>
    </div>
  );
}