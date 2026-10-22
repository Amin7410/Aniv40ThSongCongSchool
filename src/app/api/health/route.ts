import { getPayload } from 'payload'
import config from '@payload-config'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * Công khai chỉ trả {ok}. Chi tiết từng thành phần chỉ khi gọi kèm header X-Health-Token
 * (dùng cho giám sát nội bộ), tránh lộ cấu trúc hệ thống.
 */
export async function GET(req: Request) {
  const checks: Record<string, string> = {}
  try {
    const p = await getPayload({ config })
    await p.count({ collection: 'zones', overrideAccess: true })
    checks.db = 'ok'
  } catch {
    checks.db = 'fail'
  }
  checks.redis = process.env.REDIS_URL ? (redis() ? 'ok' : 'degraded') : 'disabled'
  const ok = checks.db === 'ok'
  const token = process.env.HEALTH_TOKEN
  const detail = !!token && req.headers.get('x-health-token') === token
  return Response.json(detail ? { ok, checks } : { ok }, { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } })
}
