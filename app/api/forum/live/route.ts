import { NextResponse } from 'next/server';
import { parseVNDateToDate } from '@/utils/dateUtils';

export const revalidate = 60;

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxBBuQGGOGRmaPyL2p8MjZ-0W7nqJFe7HOaNO-4u47WkuPIHteIrN2r6-KH2yzSUGyr/exec";

let cachedData: any = null;
let lastFetch = 0;

async function fetchSheet(sheetName: string) {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getSheetData&sheetName=${sheetName}`, {
    method: 'GET',
    next: { revalidate: 60 }
  });
  const json = await res.json();
  return json.status === 'success' && Array.isArray(json.data) ? json.data : [];
}

export async function GET() {
  try {
    if (cachedData && Date.now() - lastFetch < 30000) {
      return NextResponse.json(cachedData);
    }

    const [posts, comments] = await Promise.all([
      fetchSheet('Forum_Posts'),
      fetchSheet('Forum_Comments')
    ]);

    const postsWithTime = posts.map((p: any) => {
      const d = parseVNDateToDate(p.Timestamp);
      return { ...p, _time: d ? d.getTime() : 0 };
    });

    const commentMap: Record<string, number> = {};
    for (const c of comments as any[]) {
      commentMap[c.PostID] = (commentMap[c.PostID] || 0) + 1;
    }

    const sortedByNewest = [...postsWithTime].sort((a, b) => {
      if (a._time !== b._time) return b._time - a._time;
      return (parseInt(b.ID) || 0) - (parseInt(a.ID) || 0);
    });

    const top10Newest = sortedByNewest.slice(0, 10);

    const livePosts = top10Newest
      .sort((a, b) => {
        if (a._time !== b._time) return a._time - b._time;
        return (parseInt(a.ID) || 0) - (parseInt(b.ID) || 0);
      })
      .map((post: any) => ({
        ID: post.ID,
        Title: post.Title,
        AuthorName: post.AuthorName,
        Timestamp: post.Timestamp,
        Content: post.Content,
        commentCount: commentMap[post.ID] || 0
      }));

    cachedData = livePosts;
    lastFetch = Date.now();

    return NextResponse.json(livePosts);

  } catch (error) {
    console.error('Live Forum API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch live forum data' }, { status: 500 });
  }
}