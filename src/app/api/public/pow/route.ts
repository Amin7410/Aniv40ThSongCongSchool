import type { NextRequest } from 'next/server'
import { createChallenge } from '@/lib/pow'
import { allow } from '@/lib/ratelimit'
import { ipHash } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await allow(ipHash(req), [['pow', 30, 60]]))) return Response.json({ error: 'Thao tác quá nhanh, hãy thử lại sau ít phút.' }, { status: 429 })
  return Response.json(createChallenge(), { headers: { 'cache-control': 'no-store' } })
}
