import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto'

/** TOTP theo RFC 6238 (SHA-1, 30 giây, 6 số) — tương thích Google Authenticator, Microsoft Authenticator, 2FAS… */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of buf) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(s: string): Buffer {
  const clean = s.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const c of clean) {
    const i = B32.indexOf(c)
    if (i < 0) throw new Error('base32 không hợp lệ')
    value = (value << 5) | i
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

export function hotp(secret: Buffer, counter: number, digits = 6): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', secret).update(msg).digest()
  const off = h[h.length - 1] & 0xf
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(code % 10 ** digits).padStart(digits, '0')
}

export const stepOf = (t = Date.now()) => Math.floor(t / 1000 / 30)

export function totp(secretB32: string, t = Date.now()): string {
  return hotp(base32Decode(secretB32), stepOf(t))
}

/**
 * Kiểm tra mã, cho phép lệch ±1 bước (30 giây). Trả về bước đã khớp để chống dùng lại
 * (mã chỉ được chấp nhận nếu bước > bước đã dùng gần nhất), hoặc null nếu sai.
 */
export function verifyTotp(secretB32: string, code: string, lastStep = 0, t = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null
  const key = base32Decode(secretB32)
  const now = stepOf(t)
  for (const s of [now - 1, now, now + 1]) {
    if (s <= lastStep) continue
    if (hotp(key, s) === code) return s
  }
  return null
}

export const newTotpSecret = () => base32Encode(randomBytes(20))

export function otpauthURI(secretB32: string, account: string, issuer = 'Phòng truyền thống THPT Sông Công') {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

/* Mã hóa bí mật TOTP khi lưu CSDL (AES-256-GCM), khóa dẫn xuất từ HASH_SECRET. */
function key(): Buffer {
  const s = process.env.HASH_SECRET || process.env.PAYLOAD_SECRET
  if (!s) throw new Error('Thiếu HASH_SECRET')
  return createHash('sha256').update('totp-key:' + s).digest()
}

export function seal(plain: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.')
}

export function unseal(sealed: string): string {
  const [iv, tag, enc] = sealed.split('.').map((x) => Buffer.from(x, 'base64url'))
  const d = createDecipheriv('aes-256-gcm', key(), iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
}

/** 8 mã khôi phục dạng xxxx-xxxx; lưu dạng băm. */
export function newRecoveryCodes(n = 8): string[] {
  return Array.from({ length: n }, () => {
    const s = base32Encode(randomBytes(5)).toLowerCase()
    return `${s.slice(0, 4)}-${s.slice(4, 8)}`
  })
}

export const hashRecovery = (c: string) => createHash('sha256').update('rc:' + c.trim().toLowerCase()).digest('hex')
