import { redis } from './redis'

const mem = new Map<string, { n: number; exp: number }>()

/**
 * Bộ đếm cửa sổ cố định. Dùng Redis khi có; nếu Redis lỗi thì dùng bộ nhớ trong tiến trình
 * (vẫn chặn được theo từng replica, không mở toang).
 */
export async function hit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number }> {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`
  const r = redis()
  if (r) {
    try {
      const n = await r.incr(k)
      if (n === 1) await r.expire(k, windowSec + 5)
      return { ok: n <= limit, remaining: Math.max(0, limit - n) }
    } catch {
      /* rơi xuống bộ nhớ trong */
    }
  }
  const now = Date.now()
  const cur = mem.get(k)
  const e = cur && cur.exp > now ? cur : { n: 0, exp: now + windowSec * 1000 }
  e.n++
  mem.set(k, e)
  if (mem.size > 50_000) for (const [kk, v] of mem) if (v.exp < now) mem.delete(kk)
  return { ok: e.n <= limit, remaining: Math.max(0, limit - e.n) }
}

/** Áp nhiều giới hạn cùng lúc; trả về false nếu vượt bất kỳ giới hạn nào. */
export async function allow(id: string, rules: Array<[name: string, limit: number, windowSec: number]>): Promise<boolean> {
  for (const [name, limit, win] of rules) {
    const r = await hit(`${name}:${id}`, limit, win)
    if (!r.ok) return false
  }
  return true
}
