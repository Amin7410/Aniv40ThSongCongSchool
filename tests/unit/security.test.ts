import { afterEach, describe, expect, it, vi } from 'vitest'
import { base32Encode, hashRecovery, hotp, seal, totp, unseal, verifyTotp } from '@/lib/totp'
import { checkMfaProof, issueMfaProof } from '@/lib/mfa'
import { clientIp } from '@/lib/security'

process.env.HASH_SECRET = 'unit-test-secret-unit-test-secret-1234'

describe('TOTP theo RFC 6238', () => {
  const key = base32Encode(Buffer.from('12345678901234567890'))
  it('vector chuẩn (T=59 → 287082, T=1111111109 → 081804)', () => {
    expect(totp(key, 59_000)).toBe('287082')
    expect(totp(key, 1_111_111_109_000)).toBe('081804')
  })
  it('HOTP RFC 4226 counter 0 → 755224', () => expect(hotp(Buffer.from('12345678901234567890'), 0)).toBe('755224'))
  it('lệch ±30 giây vẫn nhận; không nhận lại bước đã dùng', () => {
    const t = 1_700_000_000_000
    const code = totp(key, t)
    const step = verifyTotp(key, code, 0, t + 30_000)!
    expect(step).toBeGreaterThan(0)
    expect(verifyTotp(key, code, step, t)).toBeNull()
    expect(verifyTotp(key, code, 0, t + 120_000)).toBeNull()
    expect(verifyTotp(key, 'abcdef', 0, t)).toBeNull()
  })
})

describe('Mã hóa bí mật và mã khôi phục', () => {
  it('seal/unseal; sửa bản mã thì giải mã thất bại', () => {
    const s = seal('SECRET')
    expect(s).not.toContain('SECRET')
    expect(unseal(s)).toBe('SECRET')
    const [iv, tag, enc] = s.split('.')
    expect(() => unseal([iv, tag, enc.slice(0, -2) + 'AA'].join('.'))).toThrow()
  })
  it('mã khôi phục so khớp không phân biệt hoa thường, khoảng trắng', () => expect(hashRecovery(' ABCD-efgh ')).toBe(hashRecovery('abcd-efgh')))
})

describe('Bằng chứng bước 2 gắn với phiên', () => {
  it('đúng người, đúng phiên mới hợp lệ', () => {
    const p = issueMfaProof(1, 'sid-a')
    expect(checkMfaProof(p, 1, 'sid-a')).toBe(true)
    expect(checkMfaProof(p, 2, 'sid-a')).toBe(false)
    expect(checkMfaProof(p, 1, 'sid-b')).toBe(false)
    expect(checkMfaProof('1.' + p.split('.')[1], 1, 'sid-a')).toBe(false) // hết hạn
    expect(checkMfaProof('9999999999.x', 1, 'sid-a')).toBe(false)
  })
})

describe('clientIp: chỉ tin X-Real-IP khi đi qua Nginx của hệ thống', () => {
  afterEach(() => vi.unstubAllEnvs())
  const req = (h: Record<string, string>) => new Request('http://x/', { headers: h })
  it('production + có PROXY_SHARED_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PROXY_SHARED_SECRET', 's3cret')
    expect(clientIp(req({ 'x-real-ip': '1.2.3.4', 'x-proxy-auth': 's3cret' }))).toBe('1.2.3.4')
    expect(clientIp(req({ 'x-real-ip': '1.2.3.4', 'x-proxy-auth': 'sai' }))).toBe('untrusted-direct')
    expect(clientIp(req({ 'x-real-ip': '5.6.7.8' }))).toBe('untrusted-direct')
  })
  it('production mà quên đặt bí mật → không tin header nào', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PROXY_SHARED_SECRET', '')
    expect(clientIp(req({ 'x-real-ip': '1.2.3.4' }))).toBe('untrusted-direct')
  })
  it('X-Forwarded-For giả mạo không được dùng', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('PROXY_SHARED_SECRET', '')
    expect(clientIp(req({ 'x-forwarded-for': '9.9.9.9' }))).toBe('0.0.0.0')
  })
})
