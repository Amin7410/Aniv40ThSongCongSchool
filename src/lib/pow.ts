import { hmac, safeEqual, sha256 } from './security'
import { redis } from './redis'

/**
 * Proof-of-work chống spam, tự host (cùng cơ chế với ALTCHA):
 * server cấp salt + số bí mật đã băm; trình duyệt dò số n sao cho sha256(salt + n) = challenge.
 * Không cookie, không gửi dữ liệu ra dịch vụ bên ngoài.
 */
export const POW_MAX = Number(process.env.POW_MAX || 60_000)
const TTL = 10 * 60

export interface Challenge {
  salt: string
  challenge: string
  max: number
  signature: string
}

export function createChallenge(): Challenge {
  const expires = Math.floor(Date.now() / 1000) + TTL
  const salt = `${crypto.randomUUID()}.${expires}`
  const number = Math.floor(Math.random() * POW_MAX)
  const challenge = sha256(salt + number)
  return { salt, challenge, max: POW_MAX, signature: hmac(challenge, 'pow') }
}

export interface Solution {
  salt: string
  challenge: string
  signature: string
  number: number
}

const used = new Map<string, number>()

export async function verifySolution(sol: unknown): Promise<boolean> {
  if (process.env.POW_DISABLED === '1' && process.env.NODE_ENV !== 'production') return true
  if (!sol || typeof sol !== 'object') return false
  const s = sol as Solution
  if (typeof s.salt !== 'string' || typeof s.challenge !== 'string' || typeof s.signature !== 'string') return false
  if (!Number.isInteger(s.number) || s.number < 0 || s.number > POW_MAX) return false
  const exp = Number(s.salt.split('.').pop())
  if (!exp || exp < Date.now() / 1000) return false
  if (!safeEqual(hmac(s.challenge, 'pow'), s.signature)) return false
  if (sha256(s.salt + s.number) !== s.challenge) return false
  // Mỗi lời giải chỉ dùng một lần.
  const r = redis()
  if (r) {
    try {
      const ok = await r.set(`pow:${s.challenge}`, '1', 'EX', TTL, 'NX')
      return ok === 'OK'
    } catch {
      /* rơi xuống bộ nhớ trong */
    }
  }
  if (used.has(s.challenge)) return false
  used.set(s.challenge, exp)
  if (used.size > 20_000) for (const [k, v] of used) if (v < Date.now() / 1000) used.delete(k)
  return true
}
