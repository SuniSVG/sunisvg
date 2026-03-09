// lib/redis.ts
import Redis from "ioredis";

declare global {
  var _redis: Redis | undefined | null;
}

function createRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn("[Redis] REDIS_URL chưa được set — cache sẽ không hoạt động");
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
  });

  client.on("error", (e) => console.error("[Redis] Lỗi kết nối:", e.message));
  client.on("connect", () => console.log("[Redis] Kết nối thành công"));

  return client;
}

let redis: Redis | null;

if (globalThis._redis === undefined) {
  redis = createRedis();
  globalThis._redis = redis;
} else {
  redis = globalThis._redis;
}

if (process.env.NODE_ENV !== "production") globalThis._redis = redis;

export default redis;