import { NextResponse } from 'next/server';
import { fetchForumPosts, fetchForumComments } from '@/services/googleSheetService';
import { parseVNDateToDate } from '@/utils/dateUtils';

export const revalidate = 60;

// In-memory cache variables (The "PRO" way)
let cachedData: any = null;
let lastFetch = 0;

export async function GET() {
  try {
    // Return cached data immediately if within 60 seconds
    if (cachedData && (Date.now() - lastFetch < 60000)) {
      return NextResponse.json(cachedData);
    }

    // Fetch data from Google Sheets - use cache for performance
    const [posts, comments] = await Promise.all([
      fetchForumPosts(false),
      fetchForumComments(false)
    ]);

    // 1. Sort all posts by newest first (Descending) to get the most recent ones
    const sortedByNewest = [...posts].sort((a, b) => {
      const dateA = parseVNDateToDate(a.Timestamp);
      const dateB = parseVNDateToDate(b.Timestamp);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (parseInt(b.ID) || 0) - (parseInt(a.ID) || 0);
    });

    // 2. Take top 10 newest
    const top10Newest = sortedByNewest.slice(0, 10);

    // 3. Re-sort those 10 by oldest first (Ascending) for natural chat flow
    const livePosts = top10Newest.sort((a, b) => {
      const dateA = parseVNDateToDate(a.Timestamp);
      const dateB = parseVNDateToDate(b.Timestamp);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (parseInt(a.ID) || 0) - (parseInt(b.ID) || 0);
    }).map(post => {
      const commentCount = comments.filter(c => c.PostID === post.ID).length;
      return {
        ID: post.ID,
        Title: post.Title,
        AuthorName: post.AuthorName,
        Timestamp: post.Timestamp,
        Content: post.Content,
        commentCount
      };
    });

    // Update cache
    cachedData = livePosts;
    lastFetch = Date.now();

    return NextResponse.json(livePosts);
  } catch (error) {
    console.error('Live Forum API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch live forum data' }, { status: 500 });
  }
}
