import { NextResponse } from 'next/server';
import { fetchForumPosts, fetchForumComments } from '@/services/googleSheetService';
import { parseVNDateToDate } from '@/utils/dateUtils';

export const revalidate = 60;

let cachedData: any = null;
let lastFetch = 0;

export async function GET() {
  try {

    if (cachedData && Date.now() - lastFetch < 30000) {
      return NextResponse.json(cachedData);
    }

    const [posts, comments] = await Promise.all([
      fetchForumPosts(false, true),
      fetchForumComments(false, true)
    ]);

    // Pre-calc timestamp
    const postsWithTime = posts.map(p => {
      const d = parseVNDateToDate(p.Timestamp);
      return { ...p, _time: d ? d.getTime() : 0 };
    });

    // Count comments
    const commentMap: Record<string, number> = {};
    for (const c of comments) {
      commentMap[c.PostID] = (commentMap[c.PostID] || 0) + 1;
    }

    // Newest first
    const sortedByNewest = [...postsWithTime].sort((a, b) => {
      if (a._time !== b._time) return b._time - a._time;
      return (parseInt(b.ID) || 0) - (parseInt(a.ID) || 0);
    });

    const top10Newest = sortedByNewest.slice(0, 10);

    // Oldest first for chat flow
    const livePosts = top10Newest
      .sort((a, b) => {
        if (a._time !== b._time) return a._time - b._time;
        return (parseInt(a.ID) || 0) - (parseInt(b.ID) || 0);
      })
      .map(post => ({
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
    return NextResponse.json(
      { error: 'Failed to fetch live forum data' },
      { status: 500 }
    );
  }
}