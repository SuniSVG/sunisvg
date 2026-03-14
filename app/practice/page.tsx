'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'qbank_recent_ids';

interface RecentItem {
    id: string;
    date: string;
}

function getRecent(): RecentItem[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveRecent(id: string) {
    const list = getRecent().filter(r => r.id !== id);
    list.unshift({ id, date: new Date().toLocaleDateString('vi-VN') });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 5)));
}

export default function QuestionBankPage() {
    const [courseId, setCourseId] = useState('');
    const [recent, setRecent] = useState<RecentItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        setRecent(getRecent());
    }, []);

    const navigate = (id: string) => {
        if (!id) return;
        saveRecent(id);
        setRecent(getRecent());
        router.push(`/practice/${id}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (courseId.trim()) navigate(courseId.trim());
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            background: '#f0f7f2',
        }}>
            <div style={{
                background: '#fff',
                border: '0.5px solid #c2dcc9',
                borderRadius: '20px',
                padding: '2.5rem 2rem',
                width: '100%',
                maxWidth: '440px',
                textAlign: 'center',
                boxShadow: '0 2px 24px rgba(34,120,60,0.07)',
            }}>
                {/* Logo row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '52px', height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #3a9e5f 0%, #e07c2a 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e5c34', lineHeight: 1.2 }}>Ngân hàng câu hỏi</div>
                        <div style={{ fontSize: '12px', color: '#e07c2a', fontWeight: 500, letterSpacing: '0.04em' }}>Question Bank ✦ ID Lookup</div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '0.5px solid #d4eadb', marginBottom: '1.5rem' }} />

                {/* Section label */}
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#3a9e5f', marginBottom: '10px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a9e5f" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Nhập ID câu hỏi
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={courseId}
                        onChange={e => setCourseId(e.target.value)}
                        placeholder="VD: 876060"
                        maxLength={12}
                        autoComplete="off"
                        style={{
                            width: '100%',
                            padding: '13px 16px',
                            fontSize: '20px',
                            fontWeight: 600,
                            fontFamily: "'Courier New', monospace",
                            textAlign: 'center',
                            letterSpacing: '0.12em',
                            borderRadius: '12px',
                            border: '2px solid #c2dcc9',
                            background: '#f4fbf6',
                            color: '#1e5c34',
                            outline: 'none',
                            marginBottom: '8px',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => {
                            e.target.style.borderColor = '#3a9e5f';
                            e.target.style.background = '#fff';
                        }}
                        onBlur={e => {
                            e.target.style.borderColor = '#c2dcc9';
                            e.target.style.background = '#f4fbf6';
                        }}
                    />
                    <p style={{ fontSize: '12px', color: '#8aab96', marginBottom: '1.25rem', textAlign: 'center' }}>
                        Mã ID gồm 6 chữ số do giáo viên cung cấp
                    </p>

                    <button
                        type="submit"
                        disabled={!courseId.trim()}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(90deg, #3a9e5f 0%, #2e8050 50%, #c96a1a 150%)',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: courseId.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: courseId.trim() ? '0 3px 14px rgba(58,158,95,0.25)' : 'none',
                            opacity: courseId.trim() ? 1 : 0.35,
                            transition: 'opacity 0.15s',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Tra cứu ngay
                    </button>
                </form>

                {/* Recent */}
                {recent.length > 0 && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                        <p style={{ fontSize: '11px', color: '#8aab96', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                            Đã tra gần đây
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {recent.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => navigate(r.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        border: '0.5px solid #d4eadb',
                                        background: '#f4fbf6',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = '#3a9e5f';
                                        (e.currentTarget as HTMLDivElement).style.background = '#e8f5ec';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = '#d4eadb';
                                        (e.currentTarget as HTMLDivElement).style.background = '#f4fbf6';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '7px', height: '7px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #3a9e5f, #e07c2a)',
                                            flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Courier New', monospace", color: '#2e7a50', letterSpacing: '0.06em' }}>
                                            #{r.id}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#8aab96' }}>{r.date}</span>
                                    </div>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b0cfba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '0.5px solid #d4eadb', fontSize: '12px', color: '#a0c4ad', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e07c2a" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Dữ liệu lưu trên thiết bị của bạn &nbsp;
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#e07c2a', background: '#fff4ea', border: '0.5px solid #f5c98a', borderRadius: '6px', padding: '2px 7px' }}>
                        LOCAL
                    </span>
                </div>
            </div>
        </div>
    );
}