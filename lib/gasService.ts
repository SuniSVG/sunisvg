// lib/gasService.ts
import { cache } from "./cache";
import { GAS_BASE_URL, GAS_ACTIONS, GASAction, INVALIDATE_MAP } from "./gasClient";

// Gọi GAS thật
async function callGAS<T>(action: string, payload: Record<string, unknown>): Promise<T> {
const res = await fetch(GAS_BASE_URL, {
  method: "POST",
  redirect: "follow",        // ← follow redirect tự động
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action, ...payload }),
  signal: AbortSignal.timeout(15_000),
  cache: "no-store",
});

  if (!res.ok) throw new Error(`GAS ${action} failed: ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);
  return data;
}

// Tạo cache key — gắn userId nếu là user-specific
function makeCacheKey(
  action: string,
  payload: Record<string, unknown>
): string {
  // Các field dùng để identify user
  const userId = payload.userId || payload.email || payload.authorId || "";
  const extra  = payload.subjectId || payload.classId || payload.quizId || payload.sheet || "";
  return `gas:${action}:${userId}:${extra}`;
}

// Query có cache
export async function gasQuery<T>(
  action: GASAction,
  payload: Record<string, unknown> = {},
  options?: { forceRefresh?: boolean }
): Promise<T> {
  const config = GAS_ACTIONS[action];

  // Mutation → gọi thẳng + invalidate
  if (config.ttl === 0) {
    const result = await callGAS<T>(action, payload);
    // Invalidate các cache liên quan
    const related = INVALIDATE_MAP[action] ?? [];
    await Promise.all(
      related.map((relatedAction) => {
        const userId = payload.userId || payload.email || "";
        return cache.invalidate(`gas:${relatedAction}:${userId}:*`);
      })
    );
    return result;
  }

  const key = makeCacheKey(action, payload);

  // Đọc cache
  if (!options?.forceRefresh) {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;
  }

  // Cache miss → gọi GAS
  const data = await callGAS<T>(action, payload);
  await cache.set(key, data, config.ttl);
  return data;
}