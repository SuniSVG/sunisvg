import { fetchArticles, fetchAccounts } from '@/services/googleSheetService';
import { parseVNDateToDate } from '@/utils/dateUtils';
import ArticlesClient from './ArticlesClient';
import { Metadata } from 'next';
import type { ScientificArticle, Account } from '@/types';

export const revalidate = 600;

export const metadata: Metadata = {
    title: "Thư viện 18.000+ Tài liệu học tập, Đề thi, Nghiên cứu - SuniSVG",
    description: "Khám phá kho tài liệu khổng lồ môn Toán, Lý, Hóa, Sinh, Anh... Tải xuống đề thi thử THPT Quốc gia có đáp án và nghiên cứu khoa học từ cộng đồng SuniSVG.",
    keywords: ["tài liệu học tập", "đề thi thử", "tài liệu ôn thi", "toán học", "vật lý", "hóa học", "ngữ văn", "tiếng anh"],
    openGraph: {
        title: "Thư viện Tài liệu học tập, Đề thi, Nghiên cứu - SuniSVG",
        description: "Khám phá kho tài liệu khổng lồ chuẩn cấu trúc thi THPT Quốc gia.",
        type: "website"
    }
};

const uiStyles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

.ar-root { font-family: 'DM Sans', sans-serif; }

.ar-hero {
    background: linear-gradient(135deg, #166534 0%, #15803d 40%, #16a34a 70%, #0d9488 100%);
    padding: 4rem 1.5rem 5rem;
    position: relative; overflow: hidden; text-align: center;
}
.ar-hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px);
    background-size: 28px 28px; pointer-events: none;
}
.ar-hero-orb1 {
    position: absolute; top: -80px; right: -80px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(251,146,60,.3), transparent 70%);
    pointer-events: none;
}
.ar-hero-orb2 {
    position: absolute; bottom: -60px; left: -60px;
    width: 220px; height: 220px; border-radius: 50%;
    background: radial-gradient(circle, rgba(134,239,172,.2), transparent 70%);
    pointer-events: none;
}
.ar-hero-inner { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }
.ar-hero-tag {
    display: inline-flex; align-items: center; gap: .4rem;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
    border-radius: 999px; padding: .3rem .9rem;
    font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: #d1fae5; margin-bottom: 1.25rem;
}
.ar-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: ar-pulse 2s ease infinite; }
.ar-hero-h1 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800; color: #fff;
    line-height: 1.15; letter-spacing: -.02em; margin-bottom: 1rem;
}
.ar-hero-h1 span {
    background: linear-gradient(90deg, #fed7aa, #fb923c);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ar-hero-sub { color: rgba(209,250,229,.8); font-size: 1rem; line-height: 1.7; max-width: 520px; margin: 0 auto 2rem; }

.ar-hero-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.25rem; }
.ar-submit-btn {
    display: inline-flex; align-items: center; gap: .5rem;
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff; font-weight: 700; font-size: .9rem;
    padding: .8rem 1.75rem; border-radius: 14px; text-decoration: none;
    box-shadow: 0 8px 24px rgba(234,88,12,.4);
    transition: transform .2s, box-shadow .2s;
}
.ar-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(234,88,12,.5); }

.ar-stats { display: flex; gap: 1.5rem; }
.ar-stat {
    display: flex; align-items: center; gap: .75rem;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15);
    border-radius: 14px; padding: .65rem 1rem;
}
.ar-stat-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ar-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.2rem; font-weight: 800; color: #fff; line-height: 1; }
.ar-stat-lbl { font-size: .68rem; font-weight: 600; color: rgba(209,250,229,.7); text-transform: uppercase; letter-spacing: .05em; }

.ar-body { max-width: 1280px; margin: 0 auto; padding: 0 1rem 4rem; }

.ar-search-wrap {
    max-width: 700px; margin: -1.75rem auto 0;
    position: relative; z-index: 10;
}
.ar-search-bar {
    background: rgba(255,255,255,.95);
    border-radius: 16px; padding: .375rem .375rem .375rem 1rem;
    display: flex; align-items: center; gap: .75rem;
    box-shadow: 0 16px 48px rgba(0,0,0,.15);
    border: 1.5px solid rgba(255,255,255,.9);
}
.ar-search-input {
    flex: 1; border: none; background: transparent;
    font-size: .95rem; color: #0f2419; font-family: 'DM Sans', sans-serif;
    outline: none;
}
.ar-search-input::placeholder { color: #9ca3af; }
.ar-search-clear {
    background: none; border: none; cursor: pointer;
    color: #9ca3af; display: flex; align-items: center; padding: .25rem;
    border-radius: 8px; transition: color .2s, background .2s;
}
.ar-search-clear:hover { color: #374151; background: #f3f4f6; }

.ar-success {
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    border-left: 3px solid #22c55e; border-radius: 12px;
    padding: .875rem 1rem; display: flex; gap: .625rem;
    font-size: .85rem; color: #166534; margin: 1.5rem 0;
}

.ar-chips { display: flex; gap: .5rem; overflow-x: auto; scrollbar-width: none; padding: 1.5rem 0 .5rem; }
.ar-chips::-webkit-scrollbar { display: none; }
.ar-chip {
    display: flex; align-items: center; gap: .4rem;
    padding: .45rem 1rem; border-radius: 999px;
    font-size: .78rem; font-weight: 700; white-space: nowrap;
    cursor: pointer; border: 1.5px solid transparent;
    transition: all .2s; background: #fff; color: #6b7f72; border-color: #e5e7eb;
}
.ar-chip:hover { border-color: #86efac; color: #16a34a; }
.ar-chip.active {
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff; border-color: transparent;
    box-shadow: 0 4px 14px rgba(22,163,74,.3);
}

.ar-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1rem; }
@media (min-width: 1024px) { .ar-grid { grid-template-columns: 240px 1fr; } }

.ar-sidebar { position: sticky; top: 1.5rem; align-self: start; display: flex; flex-direction: column; gap: 1rem; }
.ar-sidebar-box {
    background: #fff; border-radius: 18px;
    border: 1.5px solid #f0f4f1; padding: 1.1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.ar-sidebar-title {
    font-size: .72rem; font-weight: 800; color: #8aaa93;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: .75rem; display: flex; align-items: center; gap: .4rem;
}
.ar-sidebar-btn {
    width: 100%; text-align: left;
    padding: .5rem .75rem; border-radius: 10px; border: none;
    font-size: .82rem; font-weight: 600; cursor: pointer;
    transition: all .15s; background: transparent; color: #6b7f72;
}
.ar-sidebar-btn:hover { background: #f0fdf4; color: #16a34a; }
.ar-sidebar-btn.active { background: linear-gradient(135deg, rgba(22,163,74,.12), rgba(21,128,61,.06)); color: #16a34a; font-weight: 700; }
.ar-sidebar-btn.active-purple { background: linear-gradient(135deg, rgba(147,51,234,.1), rgba(109,40,217,.05)); color: #7c3aed; font-weight: 700; }

.ar-result-info { font-size: .8rem; color: #8aaa93; margin-bottom: 1rem; font-weight: 500; }
.ar-result-info strong { color: #0f2419; }

.ac-card {
    background: #fff; border-radius: 18px;
    border: 1.5px solid #f0f4f1;
    padding: 1.25rem;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.ac-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(22,163,74,.1), 0 4px 12px rgba(0,0,0,.06);
    border-color: #86efac;
}
.ac-accent {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #16a34a, #0d9488);
    opacity: 0; transition: opacity .25s;
}
.ac-card:hover .ac-accent { opacity: 1; }
.ac-new-badge {
    position: absolute; top: .75rem; right: .75rem;
    display: inline-flex; align-items: center; gap: .3rem;
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff; font-size: .65rem; font-weight: 800;
    padding: .25rem .65rem; border-radius: 999px;
    letter-spacing: .04em; text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(234,88,12,.35);
    animation: ar-pulse 2s ease infinite;
    z-index: 20;
}
.ac-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: .95rem; font-weight: 700; color: #0f2419;
    line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    text-decoration: none; transition: color .2s;
}
.ac-card:hover .ac-title { color: #16a34a; }
.ac-author {
    display: flex; align-items: center; gap: .4rem;
    font-size: .75rem; color: #8aaa93; font-weight: 500; margin-bottom: .6rem;
}
.ac-abstract {
    font-size: .78rem; color: #6b7f72; line-height: 1.6; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    margin-bottom: .75rem;
}
.ac-keywords { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .875rem; }
.ac-keyword {
    font-size: .68rem; font-weight: 600; color: #3d5a45;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    padding: .2rem .6rem; border-radius: 999px;
    transition: background .15s, color .15s;
}
.ac-card:hover .ac-keyword { background: #dcfce7; }
.ac-footer { margin-top: auto; padding-top: .75rem; border-top: 1px solid #f0f4f1; }
.ac-doi { display: flex; align-items: center; gap: .35rem; font-size: .65rem; color: #9ca3af; font-family: monospace; margin-bottom: .5rem; overflow: hidden; }
.ac-doi span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-meta { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
.ac-category {
    display: inline-flex; align-items: center; gap: .3rem;
    font-size: .68rem; font-weight: 700; color: #16a34a;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    padding: .25rem .65rem; border-radius: 8px;
}
.ac-date { display: flex; align-items: center; gap: .3rem; font-size: .68rem; color: #9ca3af; flex-shrink: 0; }

.ac-skeleton { background: #fff; border-radius: 18px; border: 1.5px solid #f0f4f1; padding: 1.25rem; }
.ac-sk-line {
    border-radius: 6px;
    background: linear-gradient(90deg, #f3f4f6 25%, #e9ecea 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: ar-shimmer 1.5s infinite;
}

.ar-empty {
    background: #fff; border-radius: 24px;
    border: 2px dashed #d1fae5; padding: 4rem 2rem; text-align: center;
}
.ar-empty-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(135deg, rgba(134,239,172,.3), rgba(34,197,94,.1));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
}
.ar-reset-btn {
    display: inline-flex; align-items: center; gap: .5rem;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff; font-weight: 700; font-size: .85rem;
    padding: .65rem 1.5rem; border-radius: 12px; border: none; cursor: pointer;
    box-shadow: 0 4px 14px rgba(22,163,74,.3);
    transition: transform .2s, box-shadow .2s;
}
.ar-reset-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(22,163,74,.4); }

.ar-error { background: #fff; border-radius: 24px; border: 2px dashed #fecdd3; padding: 4rem 2rem; text-align: center; }
.ar-retry-btn {
    display: inline-flex; align-items: center; gap: .5rem;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff; font-weight: 700; font-size: .85rem;
    padding: .65rem 1.5rem; border-radius: 12px; border: none; cursor: pointer;
    box-shadow: 0 4px 14px rgba(22,163,74,.3);
}
.ar-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 24rem; gap: 1.25rem; }
.ar-spinner {
    width: 52px; height: 52px; border-radius: 50%;
    border: 4px solid #bbf7d0; border-top-color: #16a34a;
    animation: ar-spin .8s linear infinite;
}
.ar-loading-text { font-size: .9rem; color: #6b7f72; font-weight: 600; font-family: 'DM Sans', sans-serif; }

.ar-pagination { display: flex; justify-content: center; align-items: center; gap: .5rem; margin-top: 2.5rem; }
.ar-page-btn {
    min-width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e5e7eb;
    background: #fff; color: #6b7f72; font-size: .82rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all .2s; padding: 0 .75rem;
}
.ar-page-btn:hover:not(:disabled) { border-color: #86efac; color: #16a34a; }
.ar-page-btn:disabled { opacity: .35; cursor: not-allowed; }
.ar-page-btn.active {
    background: linear-gradient(135deg, #16a34a, #15803d);
    border-color: transparent; color: #fff;
    box-shadow: 0 4px 14px rgba(22,163,74,.35);
}

@keyframes ar-spin { to { transform: rotate(360deg); } }
@keyframes ar-pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
@keyframes ar-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
`;

export default async function ArticlesPage() {
    let articles: ScientificArticle[] = [];
    let accounts: Account[] = [];
    
    try {
        const [artData, accData] = await Promise.all([
            fetchArticles(),
            fetchAccounts()
        ]);
        
        articles = (artData || []).sort((a, b) => {
            const tA = parseVNDateToDate(a.SubmissionDate)?.getTime() || 0;
            const tB = parseVNDateToDate(b.SubmissionDate)?.getTime() || 0;
            return tB - tA;
        });
        accounts = accData;
    } catch (error) {
        console.error("Failed to fetch articles server-side:", error);
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: uiStyles }} />
            <ArticlesClient initialArticles={articles} initialAccounts={accounts} />
        </>
    );
}