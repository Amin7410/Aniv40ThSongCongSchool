import 'server-only'
import { redis, redisSub } from './redis'
import { REACTIONS } from './live'

/**
 * Trung tâm realtime ngày lễ (SSE):
 * - Cảm xúc: cộng dồn theo giây, cứ 1 giây phát MỘT gói tổng hợp → chi phí O(kết nối)/giây.
 * - Người xem: mỗi kết nối ghi heartbeat vào ZSET; đếm các kết nối còn sống trong 45 giây.
 * Có Redis: nhiều replica dùng chung; không có Redis (dev): chạy trong bộ nhớ.
 */
type Listener = (event: string, data: unknown) => void

const CHANNEL = 'live:events'
const g = globalThis as unknown as { __hub?: Hub }

class Hub {
  listeners = new Set<Listener>()
  local: Record<string, number> = {}
  localViewers = new Map<string, number>()
  viewers = 0
  started = false

  start() {
    if (this.started) return
    this.started = true
    console.info('[hub] start, redis:', process.env.REDIS_URL ? 'on' : 'off')
    const sub = redisSub()
    if (sub) {
      sub.subscribe(CHANNEL).catch((e) => console.warn('[hub] subscribe failed', e?.message))
      sub.on('message', (_c, msg) => {
        try {
          const { e, d } = JSON.parse(msg)
          this.emitLocal(e, d)
        } catch {}
      })
    }
    setInterval(() => void this.tick(), 1000).unref?.()
    setInterval(() => void this.countViewers(), 5000).unref?.()
  }

  emitLocal(e: string, d: unknown) {
    for (const l of this.listeners) l(e, d)
  }

  async publish(e: string, d: unknown) {
    const r = redis()
    if (r) {
      try {
        await r.publish(CHANNEL, JSON.stringify({ e, d }))
        return
      } catch {}
    }
    this.emitLocal(e, d)
  }

  async addReaction(k: string) {
    if (!(REACTIONS as readonly string[]).includes(k)) return false
    const r = redis()
    const sec = Math.floor(Date.now() / 1000)
    if (r) {
      try {
        await r.multi().hincrby(`rx:${sec}`, k, 1).expire(`rx:${sec}`, 10).exec()
        return true
      } catch {}
    }
    this.local[k] = (this.local[k] || 0) + 1
    return true
  }

  /** Mỗi giây: một replica (giữ khóa) gom cảm xúc của giây trước và phát đi. */
  async tick() {
    const r = redis()
    const sec = Math.floor(Date.now() / 1000) - 1
    if (r) {
      try {
        const lock = await r.set(`rx:lock:${sec}`, '1', 'EX', 5, 'NX')
        if (lock !== 'OK') return
        const counts = await r.hgetall(`rx:${sec}`)
        if (Object.keys(counts).length) await this.publish('rx', Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.min(Number(v), 50)])))
        return
      } catch {}
    }
    if (Object.keys(this.local).length) {
      const c = this.local
      this.local = {}
      this.emitLocal('rx', Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.min(v, 50)])))
    }
  }

  async heartbeat(connId: string) {
    const r = redis()
    if (r) {
      try {
        await r.zadd('live:viewers', Date.now(), connId)
        return
      } catch {}
    }
    this.localViewers.set(connId, Date.now())
  }

  async leave(connId: string) {
    const r = redis()
    if (r) {
      try {
        await r.zrem('live:viewers', connId)
      } catch {}
    }
    this.localViewers.delete(connId)
  }

  async countViewers() {
    const cutoff = Date.now() - 45_000
    const r = redis()
    if (r) {
      try {
        const lock = await r.set(`viewers:lock:${Math.floor(Date.now() / 5000)}`, '1', 'EX', 10, 'NX')
        if (lock !== 'OK') return
        await r.zremrangebyscore('live:viewers', 0, cutoff)
        const n = await r.zcard('live:viewers')
        await this.publish('viewers', n)
        return
      } catch {}
    }
    for (const [k, t] of this.localViewers) if (t < cutoff) this.localViewers.delete(k)
    this.viewers = this.localViewers.size
    this.emitLocal('viewers', this.viewers)
  }
}

export function hub(): Hub {
  if (!g.__hub) g.__hub = new Hub()
  g.__hub.start()
  return g.__hub
}
