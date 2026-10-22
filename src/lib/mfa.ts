import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Bằng chứng đã qua bước 2 (TOTP) cho MỘT phiên đăng nhập:
 *   mfa = <hết hạn epoch giây>.<HMAC(userId | sid | hết hạn)>
 * Gắn với `sid` của phiên Payload → đăng xuất / thu hồi phiên là bằng chứng vô hiệu.
 * Gửi qua cookie HttpOnly `mfa` (giao diện) hoặc header `x-mfa` (gọi API).
 */
export const MFA_COOKIE = 'mfa'
export const MFA_TTL_SEC = 12 * 60 * 60

function secret(): string {
  const s = process.env.HASH_SECRET || process.env.PAYLOAD_SECRET
  if (!s) throw new Error('Thiếu HASH_SECRET')
  return s
}

const sig = (uid: string, sid: string, exp: number) => createHmac('sha256', secret()).update(`mfa:${uid}|${sid}|${exp}`).digest('base64url')

export function issueMfaProof(uid: string | number, sid: string | undefined): string {
  const exp = Math.floor(Date.now() / 1000) + MFA_TTL_SEC
  return `${exp}.${sig(String(uid), sid || '-', exp)}`
}

export function checkMfaProof(proof: string | null | undefined, uid: string | number, sid: string | undefined): boolean {
  if (!proof) return false
  const [expS, mac] = proof.split('.')
  const exp = Number(expS)
  if (!exp || exp < Date.now() / 1000 || !mac) return false
  const want = Buffer.from(sig(String(uid), sid || '-', exp))
  const got = Buffer.from(mac)
  return want.length === got.length && timingSafeEqual(want, got)
}

export function readProof(headers: Headers): string | null {
  const h = headers.get('x-mfa')
  if (h) return h
  const cookie = headers.get('cookie') || ''
  const m = new RegExp(`(?:^|;\\s*)${MFA_COOKIE}=([^;]+)`).exec(cookie)
  return m ? decodeURIComponent(m[1]) : null
}

type AuthedReq = { user?: { id: string | number; _sid?: string } | null; headers: Headers }

/** Người dùng đã đăng nhập VÀ đã qua bước 2 trong phiên hiện tại. */
export function mfaSatisfied(req: AuthedReq): boolean {
  if (!req.user) return false
  if (process.env.MFA_DISABLED === '1' && process.env.NODE_ENV !== 'production') return true
  return checkMfaProof(readProof(req.headers), req.user.id, req.user._sid)
}

export function mfaCookie(proof: string): string {
  return `${MFA_COOKIE}=${encodeURIComponent(proof)}; Path=/; Max-Age=${MFA_TTL_SEC}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
}
