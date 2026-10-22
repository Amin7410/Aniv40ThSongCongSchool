import type { NextRequest } from 'next/server'
import { hub } from '@/lib/hub'
import { allow } from '@/lib/ratelimit'
import { ipHash, sameOrigin } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 })
  if (!(await allow(ipHash(req), [['rx', 20, 10]]))) return new Response(null, { status: 429 })
  let k = ''
  try {
    k = String((await req.json())?.k || '')
  } catch {}
  const ok = await hub().addReaction(k)
  return new Response(null, { status: ok ? 204 : 400 })
}
