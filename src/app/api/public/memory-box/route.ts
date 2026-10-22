import type { NextRequest } from 'next/server'
import type { Where } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GENERATIONS } from '@/lib/text'

export const dynamic = 'force-dynamic'

/**
 * Hộp ký ức: bốc ngẫu nhiên một kỷ vật / ảnh tư liệu đã đăng. Lọc theo thế hệ; tránh lặp các mục
 * người xem vừa thấy (client gửi `bo` = danh sách id đã xem, tối đa 50).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const gen = GENERATIONS.some((g) => g.key === sp.get('the_he')) ? sp.get('the_he')! : ''
  const skip = (sp.get('bo') || '').split(',').map(Number).filter(Number.isInteger).slice(0, 50)
  const p = await getPayload({ config })
  const zones = await p.find({ collection: 'zones', where: { type: { in: ['memories', 'gallery', 'campus'] } }, limit: 20, depth: 0 })
  const zmap = new Map(zones.docs.map((z) => [z.id, z]))
  const and: Where[] = [{ zone: { in: [...zmap.keys()] } }, { media: { exists: true } }]
  if (gen) and.push({ generation: { equals: gen } })
  const base = { collection: 'exhibits' as const, where: { and }, overrideAccess: false, depth: 0 }
  const total = (await p.count(base)).totalDocs
  if (!total) return Response.json({ item: null, total: 0 }, { headers: { 'cache-control': 'no-store' } })
  let pick = null
  for (let tries = 0; tries < 6 && !pick; tries++) {
    const page = 1 + Math.floor(Math.random() * total)
    const r = await p.find({ ...base, limit: 1, page, depth: 1, sort: 'id' })
    const d = r.docs[0]
    if (d && (!skip.includes(d.id as number) || tries === 5)) pick = d
  }
  if (!pick) return Response.json({ item: null, total }, { headers: { 'cache-control': 'no-store' } })
  const z = zmap.get(typeof pick.zone === 'object' ? (pick.zone as { id: number }).id : (pick.zone as number))
  const m = (pick.media || []).find((x) => typeof x === 'object') as { url?: string; sizes?: { full?: { url?: string } }; isHistorical?: boolean; alt?: string } | undefined
  return Response.json(
    {
      total,
      item: {
        id: pick.id,
        title: pick.title,
        story: pick.description || '',
        meta: [pick.memoryType, pick.cohort || pick.year, pick.contributor && `Gửi bởi ${pick.contributor}`].filter(Boolean).join(' · '),
        img: m?.sizes?.full?.url || m?.url || null,
        old: !!m?.isHistorical,
        href: z ? `/khu/${z.slug}/${pick.id}` : '/',
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
