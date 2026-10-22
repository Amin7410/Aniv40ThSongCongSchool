import { createHash, createHmac } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { APIRequestContext } from '@playwright/test'

export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@thd.local', password: process.env.E2E_ADMIN_PASSWORD || 'Admin-Password-2026!' }

/** Giải PoW phía Node (giống trình duyệt) để gọi API gửi nội dung. */
export async function pow(req: APIRequestContext): Promise<string> {
  const c = await (await req.get('/api/public/pow')).json()
  for (let n = 0; n <= c.max; n++) {
    if (createHash('sha256').update(c.salt + n).digest('hex') === c.challenge) return JSON.stringify({ ...c, number: n })
  }
  throw new Error('pow unsolved')
}

export async function submit(req: APIRequestContext, fields: Record<string, string>, opts: { ip?: string; files?: Array<{ name: string; mimeType: string; buffer: Buffer }> } = {}) {
  const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = { consent: 'true', ...fields, pow: await pow(req) }
  if (opts.files?.[0]) multipart.files = opts.files[0]
  return req.post('/api/public/submissions', { multipart, headers: { 'x-real-ip': opts.ip || randomIp() } })
}

export const randomIp = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`

/* ---------- TOTP cho tài khoản kiểm thử ---------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function b32(s: string) {
  let bits = 0, v = 0
  const out: number[] = []
  for (const c of s) {
    v = (v << 5) | B32.indexOf(c)
    bits += 5
    if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(out)
}
export function totpAt(secret: string, step: number) {
  const m = Buffer.alloc(8)
  m.writeBigUInt64BE(BigInt(step))
  const h = createHmac('sha1', b32(secret)).update(m).digest()
  const o = h[h.length - 1] & 15
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0')
}
export const nowStep = () => Math.floor(Date.now() / 30000)

export type Session = { token: string; proof: string; email: string }

const STORE = path.resolve(process.cwd(), 'tests', '.mfa.json')
type Store = Record<string, { secret: string; token?: string; proof?: string }>
const load = (): Store => { try { return JSON.parse(fs.readFileSync(STORE, 'utf8')) } catch { return {} } }
const save = (s: Store) => fs.writeFileSync(STORE, JSON.stringify(s, null, 1))

/** Bước 1 (mật khẩu) — trả JWT chưa có quyền gì cho tới khi qua bước 2. */
export async function passwordLogin(req: APIRequestContext, email: string, password: string): Promise<string> {
  const r = await req.post('/api/users/login', { data: { email, password } })
  if (!r.ok()) throw new Error(`login failed ${r.status()} ${await r.text()}`)
  return (await r.json()).token
}

/** Đăng nhập đủ hai bước; tự đăng ký TOTP lần đầu và lưu bí mật vào tests/.mfa.json (gitignore). */
export async function login(req: APIRequestContext, email = ADMIN.email, password = ADMIN.password): Promise<Session> {
  const store = load()
  const cached = store[email]
  if (cached?.token && cached.proof) {
    const me = await req.get('/api/users?limit=1', { headers: { Authorization: `JWT ${cached.token}`, 'x-mfa': cached.proof } })
    const st = await req.get('/api/staff/mfa', { headers: { Authorization: `JWT ${cached.token}`, 'x-mfa': cached.proof } })
    if (me.status() !== 401 && st.ok() && (await st.json()).verified) return { token: cached.token, proof: cached.proof, email }
  }
  const token = await passwordLogin(req, email, password)
  const h = { Authorization: `JWT ${token}` }
  const st = await (await req.get('/api/staff/mfa', { headers: h })).json()
  let proof: string
  if (!st.enrolled) {
    const s = await (await req.post('/api/staff/mfa', { headers: h, data: { action: 'setup' } })).json()
    const r = await req.post('/api/staff/mfa', { headers: h, data: { action: 'enable', code: totpAt(s.secret, nowStep()) } })
    if (!r.ok()) throw new Error('enable failed ' + (await r.text()))
    proof = (await r.json()).proof
    store[email] = { secret: s.secret }
  } else {
    const secret = store[email]?.secret
    if (!secret) throw new Error(`Không có bí mật TOTP của ${email} trong tests/.mfa.json — hãy đặt lại 2FA của tài khoản này`)
    let r = await req.post('/api/staff/mfa', { headers: h, data: { action: 'verify', code: totpAt(secret, nowStep()) } })
    if (!r.ok()) r = await req.post('/api/staff/mfa', { headers: h, data: { action: 'verify', code: totpAt(secret, nowStep() + 1) } })
    if (!r.ok()) throw new Error('verify failed ' + (await r.text()))
    proof = (await r.json()).proof
  }
  store[email] = { ...store[email], token, proof }
  save(store)
  return { token, proof, email }
}

export const auth = (s: Session) => ({ Authorization: `JWT ${s.token}`, 'x-mfa': s.proof })
