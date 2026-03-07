// lib/cache.ts
import type { Redis } from "ioredis";

// ── In-memory fallback ──────────────────────────
interface CacheEntry { value: unknown; expiresAt: number; }
const memStore = new Map<string, CacheEntry>();

const mem = {
  get: (key: string) => {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
    return entry.value;
  },
  set: (key: string, value: unknown, ttlSeconds: number) => {
    memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  del: (key: string) => memStore.delete(key),
  delPattern: (pattern: string) => {
    const prefix = pattern.replace("*", "");
    memStore.forEach((_, key) => { if (key.startsWith(prefix)) memStore.delete(key); });
  },
};

// ── Redis (nếu có REDIS_URL) ────────────────────
let redis: Redis | null = null;
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  try {
    // Dùng require để tránh bundle ioredis xuống client
    const IORedis = require("ioredis");
    const RedisConstructor = IORedis.default || IORedis;
    redis = new RedisConstructor(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
    redis?.on("error", () => { redis = null; }); // fallback về mem nếu Redis lỗi
  } catch (e) {
    console.error("[Cache] Failed to load Redis:", e);
  }
}

// ── Unified API ─────────────────────────────────
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      const val = await redis.get(key).catch(() => null);
      return val ? JSON.parse(val) : null;
    }
    return mem.get(key) as T | null;
  },

  async set(key: string, value: unknown, ttlSeconds: number) {
    if (redis) {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => null);
    } else {
      mem.set(key, value, ttlSeconds);
    }
  },

  async del(key: string) {
    if (redis) await redis.del(key).catch(() => null);
    else mem.del(key);
  },

  // Xóa tất cả cache của 1 action (khi có data mới)
  async invalidate(pattern: string) {
    if (redis) {
      const keys = await redis.keys(pattern).catch(() => []);
      if (keys.length) await redis.del(...keys).catch(() => null);
    } else {
      mem.delPattern(pattern);
    }
  },
};