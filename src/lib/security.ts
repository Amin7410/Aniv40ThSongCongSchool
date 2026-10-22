import { createHmac, randomBytes, timingSafeEqual, createHash } from 'crypto'
import type { NextRequest } from 'next/server'

function secret(): string {
  const s = process.env.HASH_SECRET || process.env.PAYLOAD_SECRET
  if (!s) throw new Error('Thiếu HASH_SECRET')
  return s
}

export function hmac(value: string, purpose = 'ip'): string {
  return createHmac('sha256', secret()).update(purpose + ':' + value).digest('hex')
}

/**
 * IP thật của khách. Chỉ tin X-Real-IP khi request đi qua Nginx của hệ thống — Nginx gắn header bí mật
 * `X-Proxy-Auth` = PROXY_SHARED_SECRET. Nếu ai đó gọi thẳng cổng ứng dụng và tự đặt X-Real-IP để né
 * giới hạn tần suất, mọi request như vậy dồn chung vào một "IP" duy nhất → bị chặn sớm hơn chứ không thoát.
 * Dev (không đặt PROXY_SHARED_SECRET, NODE_ENV khác production): tin header để kiểm thử.
 */
export function clientIp(req: NextRequest | Request): string {
  const h = req.headers
  const shared = process.env.PROXY_SHARED_SECRET
  const trusted = shared ? safeEqual(h.get('x-proxy-auth') || '', shared) : process.env.NODE_ENV !== 'production'
  if (!trusted) return 'untrusted-direct'
  return (h.get('x-real-ip') || '0.0.0.0').trim()
}

/** Không lưu IP thô: chỉ lưu HMAC theo khóa bí mật. */
export const ipHash = (req: NextRequest | Request) => hmac(clientIp(req), 'ip')

export function newToken(): string {
  return randomBytes(24).toString('base64url')
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Chặn POST chéo trang: Origin phải trùng host của site. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const allowed = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  try {
    const o = new URL(origin)
    if (allowed && o.origin === new URL(allowed).origin) return true
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    return !!host && o.host === host
  } catch {
    return false
  }
}
