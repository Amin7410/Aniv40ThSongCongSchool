import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { allow } from '@/lib/ratelimit'
import { hmac, ipHash, newToken, sameOrigin } from '@/lib/security'
import { redis } from '@/lib/redis'
import { hub } from '@/lib/hub'

export const dynamic = 'force-dynamic'

async function total(): Promise<number> {
  const r = redis()
  if (r) {
    try {
      const c = await r.get('candles:total')
      if (c) return Number(c)
    } catch {}
  }
  const p = await getPayload({ config })
  const n = (await p.count({ collection: 'candles', overrideAccess: true })).totalDocs
  try {
    await r?.set('candles:total', String(n), 'EX', 5)
  } catch {}
  return n
}

export async function GET(req: NextRequest) {
  const cid = req.cookies.get('cid')?.value
  let lit = false
  if (cid) {
    const p = await getPayload({ config })
    lit = (await p.count({ collection: 'candles', where: { fp: { equals: hmac(cid, 'candle') } }, overrideAccess: true })).totalDocs > 0
  }
  return Response.json({ total: await total(), lit }, { headers: { 'cache-control': 'no-store' } })
}

/** Mỗi trình duyệt thắp một lần (cookie ngẫu nhiên, lưu dạng HMAC) + giới hạn theo IP. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 })
  const ip = ipHash(req)
  let cid = req.cookies.get('cid')?.value
  const isNew = !cid
  if (!cid) cid = newToken()
  const fp = hmac(cid, 'candle')
  const p = await getPayload({ config })
  const exists = (await p.count({ collection: 'candles', where: { fp: { equals: fp } }, overrideAccess: true })).totalDocs > 0
  if (!exists) {
    if (!(await allow(ip, [['candle', 3, 86400]]))) return Response.json({ error: 'Mỗi người chỉ thắp một ngọn nến. Cảm ơn bạn.' }, { status: 429 })
    try {
      await p.create({ collection: 'candles', data: { fp }, overrideAccess: true })
    } catch {}
    try {
      await redis()?.del('candles:total')
    } catch {}
  }
  const n = await total()
  void hub().publish('candles', n)
  const res = Response.json({ total: n, lit: true })
  if (isNew) res.headers.append('set-cookie', `cid=${cid}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
  return res
}
