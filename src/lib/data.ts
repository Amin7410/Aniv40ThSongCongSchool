import 'server-only'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { norm } from './text'

export const payload = cache(async () => getPayload({ config }))

export type MediaDoc = { id: number; url?: string | null; alt?: string; isHistorical?: boolean | null; sizes?: Record<string, { url?: string | null } | undefined> }
export type ZoneDoc = { id: number; slug: string; title: string; shortTitle: string; type: string; description?: string | null; categories?: string[] | null; order?: number | null }
export type ExhibitDoc = {
  id: number
  zone: number | ZoneDoc
  title: string
  subtitle?: string | null
  category?: string | null
  year?: number | null
  yearStart?: number | null
  yearEnd?: number | null
  staffStatus?: string | null
  awardKind?: string | null
  awardedBy?: string | null
  memoryType?: string | null
  cohort?: string | null
  contributor?: string | null
  description?: string | null
  media?: Array<number | MediaDoc> | null
  peopleTags?: string[] | null
  pairKey?: string | null
  generation?: string | null
}

export const getSite = cache(async () => (await payload()).findGlobal({ slug: 'site-settings', depth: 1 }))
export const getEvent = cache(async () => (await payload()).findGlobal({ slug: 'event-settings', depth: 0 }))
export const getFund = cache(async () => (await payload()).findGlobal({ slug: 'fund-settings', depth: 0 }))

export const getZones = cache(async (): Promise<ZoneDoc[]> => {
  const r = await (await payload()).find({ collection: 'zones', limit: 50, sort: 'order', depth: 0 })
  return r.docs as unknown as ZoneDoc[]
})

export async function getZone(slug: string) {
  return (await getZones()).find((z) => z.slug === slug) || null
}

export const getMilestones = cache(async () => {
  const r = await (await payload()).find({ collection: 'milestones', limit: 100, sort: 'order', depth: 0 })
  return r.docs as Array<{ id: number; date: string; text: string }>
})

/** Truy vấn công khai: luôn chạy với overrideAccess=false (như khách) để không lộ bản nháp. */
export async function getExhibits(zoneId: number, opts: { q?: string; category?: string; generation?: string; page?: number; limit?: number } = {}) {
  const and: Where[] = [{ zone: { equals: zoneId } }]
  if (opts.category) and.push({ category: { equals: opts.category } })
  if (opts.generation) and.push({ generation: { equals: opts.generation } })
  const res = await (await payload()).find({
    collection: 'exhibits',
    where: { and },
    sort: 'sortOrder',
    limit: 500,
    depth: 1,
    overrideAccess: false,
  })
  let docs = res.docs as unknown as ExhibitDoc[]
  // Tìm kiếm không dấu (danh sách mỗi khu nhỏ, lọc ở ứng dụng là đủ; chuyển sang unaccent/pg_trgm khi dữ liệu lớn).
  if (opts.q) {
    const q = norm(opts.q)
    docs = docs.filter((d) => norm([d.title, d.subtitle, d.category, ...(d.peopleTags || [])].join(' ')).includes(q))
  }
  const limit = opts.limit || 48
  const page = Math.max(1, opts.page || 1)
  return { docs: docs.slice((page - 1) * limit, page * limit), total: docs.length, page, pages: Math.max(1, Math.ceil(docs.length / limit)) }
}

export async function getExhibit(id: number) {
  try {
    return (await (await payload()).findByID({ collection: 'exhibits', id, depth: 1, overrideAccess: false })) as unknown as ExhibitDoc
  } catch {
    return null
  }
}

export async function getApproved(kind: string, limit = 30, page = 1, extra: Where[] = []) {
  const res = await (await payload()).find({
    collection: 'submissions',
    where: { and: [{ kind: { equals: kind } }, { status: { equals: 'approved' } }, ...extra] },
    sort: '-createdAt',
    limit,
    page,
    depth: 1,
    overrideAccess: true,
    // Chỉ trả trường được phép công khai.
    select: { name: true, cohort: true, message: true, createdAt: true, payload: true, city: true, confirmedAmount: true, tributeTo: true },
  })
  return res
}

export function imgUrl(m: number | MediaDoc | null | undefined, size: 'thumb' | 'card' | 'full' = 'card'): string | null {
  if (!m || typeof m !== 'object') return null
  return m.sizes?.[size]?.url || m.url || null
}

export const firstMedia = (e: ExhibitDoc) => (e.media || []).find((m) => typeof m === 'object') as MediaDoc | undefined
