import Redis from 'ioredis'

const g = globalThis as unknown as { __redis?: Redis | null; __redisSub?: Redis | null }

function make(sub = false): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  // Kết nối lệnh: không xếp hàng khi mất kết nối (để rơi nhanh xuống phương án bộ nhớ trong).
  // Kết nối SUBSCRIBE: cho phép xếp hàng để lệnh subscribe chạy khi kết nối xong / kết nối lại.
  const r = new Redis(url, { maxRetriesPerRequest: sub ? null : 2, enableOfflineQueue: sub, lazyConnect: false })
  r.on('error', (e) => console.warn('[redis]', e.message))
  return r
}

/** Kết nối dùng chung; null nếu chưa cấu hình REDIS_URL (dev) — các module tự chuyển sang bộ nhớ trong. */
export function redis(): Redis | null {
  if (g.__redis === undefined) g.__redis = make()
  return g.__redis && g.__redis.status === 'ready' ? g.__redis : null
}

/** Kết nối riêng cho SUBSCRIBE (ioredis yêu cầu tách). */
export function redisSub(): Redis | null {
  if (g.__redisSub === undefined) g.__redisSub = make(true)
  return g.__redisSub ?? null
}
