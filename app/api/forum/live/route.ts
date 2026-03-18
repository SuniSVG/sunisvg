import { NextResponse } from 'next/server';
import { parseVNDateToDate } from '@/utils/dateUtils';

export const revalidate = 0; // Không cache ở Next.js — tự quản lý cache bên dưới

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxQ7P80RVJYr7-3GQkqi1sGtzsPVWKqWAybU-uJHOQKKiS1xLWRIiDglGgkFRBLMxja/exec";

// Cache in-memory cho serverless function
let cachedData: any = null;
let lastFetch = 0;
const CACHE_TTL = 15000; // 15s — đủ fresh cho live forum

async function fetchSheet(sheetName: string): Promise<any[]> {
  // 1. Thử GET trước (Native way)
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getSheetData&sheetName=${sheetName}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-store' },
      next: { revalidate: 0 }
    });
    if (res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.status === 'success' && Array.isArray(json.data)) return json.data;
      } catch (e) {
        // Ignore JSON parse error on GET
      }
    }
  } catch (e) {
    // Ignore GET error, try POST
  }

  // 2. Fallback sang POST nếu GET thất bại
  // Sử dụng text/plain để đồng bộ với googleSheetService và tránh lỗi preflight/CORS/Content-Type của GAS
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ action: 'getSheetData', sheetName }),
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status} fetching ${sheetName}: ${errText.slice(0, 100)}`);
  }

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.status === 'success' && Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    console.error(`Invalid JSON for ${sheetName}:`, text.slice(0, 200));
    throw new Error(`Invalid JSON response for ${sheetName}`);
  }
}

export async function GET() {
  try {
    // Trả cache ngay nếu còn fresh
    if (cachedData && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        }
      });
    }

    // Fetch song song 2 sheet
    const [posts, comments] = await Promise.all([
      fetchSheet('Forum_Posts'),
      fetchSheet('Forum_Comments')
    ]);

    // Build comment count map
    const commentMap: Record<string, number> = {};
    for (const c of comments) {
      if (c.PostID) commentMap[c.PostID] = (commentMap[c.PostID] || 0) + 1;
    }

    // Parse timestamp 1 lần
    const postsWithTime = posts.map((p: any) => {
      const rawTime = p.Timestamp || p.TimeStamp || p.Date || '';
      const d = parseVNDateToDate(rawTime);
      return { ...p, Timestamp: rawTime, _time: d ? d.getTime() : 0 };
    });

    // Lấy 10 bài mới nhất, sort theo ID tăng dần để hiển thị như chat
    const livePosts = postsWithTime
      .sort((a: any, b: any) => {
        if (a._time !== b._time) return b._time - a._time; // mới nhất trước
        return (parseInt(b.ID) || 0) - (parseInt(a.ID) || 0);
      })
      .slice(0, 10)
      .sort((a: any, b: any) => {
        // Cũ nhất trước để hiển thị như chat (scroll xuống = mới hơn)
        if (a._time !== b._time) return a._time - b._time;
        return (parseInt(a.ID) || 0) - (parseInt(b.ID) || 0);
      })
      .map((post: any) => ({
        ID: post.ID,
        Title: post.Title,
        AuthorName: post.AuthorName,
        AuthorEmail: post.AuthorEmail, // Thêm trường này để hiển thị Avatar
        Timestamp: post.Timestamp,
        Content: post.Content,
        commentCount: commentMap[post.ID] || 0,
      }));

    cachedData = livePosts;
    lastFetch = Date.now();

    return NextResponse.json(livePosts, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      }
    });

  } catch (error: any) {
    console.error('Live Forum API Error:', error.message);

    // Trả cache cũ nếu có khi lỗi — tránh trắng màn hình
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'X-Cache': 'STALE' }
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch live forum data' },
      { status: 500 }
    );
  }
}