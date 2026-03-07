// lib/channels.ts  ← KHÔNG bao giờ expose ra client

export const PRIVATE_CHANNELS = [
{ id: 'UCs6Ora-urXBSh_wm5rlXtEw', subject: 'Toán' },
    { id: 'UC8gA-RUqaQ0Htkz2RrQWHMw', subject: 'Toán' },
    { id: 'UCvmzx1WEg0fXjO62euS53sQ', subject: 'Toán' },
    { id: 'UC7ambC6lu_T-P7SMnAXGJ0g', subject: 'Toán' },
    { id: 'UC6hkidRUyOz_aPguW4ZRnQg', subject: 'Toán' },
    
    // --- HÓA ---
    { id: 'UCAddta3aiDh6u9B4xCh3w7g', subject: 'Hóa' },
    
    // --- ANH ---
    { id: 'UC747JODOhQNNjDh2ol3qs_Q', subject: 'Anh' },
    { id: 'UCtMYbGkPecqhOZGhj7VTHRg', subject: 'Anh' },
    { id: 'UCk-scdU11TW4W7PIoCHemmg', subject: 'Anh' },

    // --- LÝ (Placeholder - Thay ID thật vào đây) ---
    { id: 'UCP98Gj2fYErscrQy56hX1ig', subject: 'Lý' }, 
    { id: 'UC2prfDQAHLCcU7fQk83TyQQ', subject: 'Lý' },
    { id: 'UCHZIp8tv9dkDUpP1WxsGFeg', subject: 'Lý' },
    { id: 'UCGbCVLIT2McnbYtz3XwIJiQ', subject: 'Lý' }
] as const;

export const REDIS_KEYS = {
  allLives:      "live:all",           // JSON array toàn bộ live hiện tại
  channelLive:   (id: string) => `live:channel:${id}`,  // videoId của kênh
  lastChecked:   "live:last_checked",
  webhookSub:    (id: string) => `webhook:sub:${id}`,   // trạng thái subscription
} as const;

export const CACHE_TTL = {
  live:    120,   // 2 phút — nếu quá TTL mà không refresh = coi như hết live
  checked: 55,    // dùng để biết lần poll cuối
} as const;