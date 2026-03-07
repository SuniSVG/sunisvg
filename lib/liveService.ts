// lib/liveService.ts
import redis from "./redis";
import { PRIVATE_CHANNELS, REDIS_KEYS, CACHE_TTL } from "./channels";

export interface LiveVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  startedAt: string;
  detectedAt: number;
}

const API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  'AIzaSyCB1eISVtVGKYDa1vZQV1l8Z2PAuyQy854' // Key dự phòng 2
].filter((key): key is string => !!key);

// Gọi YouTube API kiểm tra 1 kênh
async function checkChannelLive(channelId: string): Promise<LiveVideo | null> {
  const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.items?.length) return null;

  const item = data.items[0];
  return {
    videoId:      item.id.videoId,
    title:        item.snippet.title,
    thumbnail:    item.snippet.thumbnails?.high?.url ?? "",
    channelTitle: item.snippet.channelTitle,
    channelId:    item.snippet.channelId,
    startedAt:    item.snippet.publishedAt,
    detectedAt:   Date.now(),
  };
}

// Refresh tất cả kênh, lưu vào Redis
export async function refreshAllLives(): Promise<LiveVideo[]> {
  const results = await Promise.allSettled(
    PRIVATE_CHANNELS.map((ch) => checkChannelLive(ch.id))
  );

  const lives: LiveVideo[] = [];

  for (const [i, result] of results.entries()) {
    const channelId = PRIVATE_CHANNELS[i].id;
    const key = REDIS_KEYS.channelLive(channelId);

    if (result.status === "fulfilled" && result.value) {
      const live = result.value;
      lives.push(live);
      // Lưu từng kênh với TTL — hết TTL = tự coi là offline
      if (redis) {
        await redis.set(key, JSON.stringify(live), "EX", CACHE_TTL.live);
      }
    } else {
      // Kênh không live → xóa key
      if (redis) {
        await redis.del(key);
      }
    }
  }

  // Lưu tổng hợp
  if (redis) {
    await redis.set(REDIS_KEYS.allLives, JSON.stringify(lives), "EX", CACHE_TTL.live);
    await redis.set(REDIS_KEYS.lastChecked, Date.now().toString(), "EX", 300);
  }

  // Notify SSE clients
  notifySSEClients(lives);

  return lives;
}

// Đọc từ cache (không gọi YouTube)
export async function getLivesFromCache(): Promise<LiveVideo[]> {
  if (!redis) return [];
  const cached = await redis.get(REDIS_KEYS.allLives);
  if (!cached) return [];
  return JSON.parse(cached);
}

// ── SSE (Server-Sent Events) ────────────────────────────────
// Lưu danh sách các client đang kết nối
type SSEClient = { id: string; send: (data: string) => void };
const sseClients = new Map<string, SSEClient>();

export function addSSEClient(client: SSEClient) {
  sseClients.set(client.id, client);
}

export function removeSSEClient(id: string) {
  sseClients.delete(id);
}

export function notifySSEClients(lives: LiveVideo[]) {
  const payload = JSON.stringify({ type: "live_update", lives });
  sseClients.forEach((client) => {
    try { client.send(payload); } catch { sseClients.delete(client.id); }
  });
}