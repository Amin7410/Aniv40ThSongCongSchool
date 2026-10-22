import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const p = await getPayload({ config })
  const r = await p.find({ collection: 'cities', limit: 500, sort: 'name', depth: 0, select: { code: true, name: true, country: true } })
  return Response.json(r.docs.map((c) => ({ code: c.code, name: c.name, country: c.country })), { headers: { 'cache-control': 'public, max-age=3600' } })
}
