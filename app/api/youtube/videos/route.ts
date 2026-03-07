// app/api/youtube/videos/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY!;

const cache = new Map<string, { channels: unknown[]; videos: unknown[]; fetchedAt: number }>();
const TTL = 5 * 60 * 1000;

async function fetchChannelInfos(channelIds: string[]) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", channelIds.join(","));

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(`channels API: ${JSON.stringify(data.error)}`);

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    avatarUrl: item.snippet.thumbnails.default?.url || item.snippet.thumbnails.medium?.url,
  }));
}

async function fetchVideosForChannel(channelId: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("part", "snippet,id");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("type", "video");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (data.error) {
    console.error(`[YouTube] Kênh ${channelId}:`, JSON.stringify(data.error));
    return [];
  }
  return data.items || [];
}

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra API key
    if (!API_KEY) {
      console.error("[YouTube Route] YOUTUBE_API_KEY chưa set trong .env.local");
      return NextResponse.json({ error: "Thiếu API key" }, { status: 500 });
    }

    const body = await req.json();
    const { channelIds } = body as { channelIds: string[] };

    console.log("[YouTube Route] channelIds nhận được:", channelIds);

    if (!channelIds?.length) {
      return NextResponse.json({ channels: [], videos: [] });
    }

    // 2. Kiểm tra cache
    const cacheKey = [...channelIds].sort().join(",");
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < TTL) {
      console.log("[YouTube Route] Cache hit");
      return NextResponse.json({ channels: cached.channels, videos: cached.videos, fromCache: true });
    }

    // 3. Gọi YouTube
    console.log("[YouTube Route] Gọi YouTube API...");
    const [channels, ...videoResults] = await Promise.all([
      fetchChannelInfos(channelIds),
      ...channelIds.map(fetchVideosForChannel),
    ]);

    const videos = videoResults
      .flat()
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter((v) => v.id);

    console.log(`[YouTube Route] Thành công: ${channels.length} kênh, ${videos.length} video`);
    cache.set(cacheKey, { channels, videos, fetchedAt: Date.now() });

    return NextResponse.json({ channels, videos, fromCache: false });

  } catch (error: any) {
    // Lỗi thật hiện ở đây trong terminal Next.js
    console.error("[YouTube Route] LỖI:", error.message);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}