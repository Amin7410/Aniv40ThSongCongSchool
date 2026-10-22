import 'server-only'
import { cache } from 'react'
import type { Where } from 'payload'
import { payload, imgUrl, type MediaDoc, type ZoneDoc } from './data'

/** Mục trưng bày ở dạng gọn, giống cấu trúc dữ liệu của prototype (để giao diện client lọc tức thì). */
export type Item = {
  id: number
  zone: string
  title: string
  sub: string
  cat: string
  year: number | null
  start: number | null
  end: number | null
  status: string | null
  k: string | null // loại hiện vật khen thưởng
  by: string // cấp khen tặng / người gửi kỷ vật
  type: string | null // loại kỷ vật
  khoa: string
  desc: string
  img: string | null // ảnh thật (kích thước thẻ)
  big: string | null // ảnh thật (lớn)
  imgs: string[]
  video: string | null
  old: boolean
  art: unknown[] | null // hình minh họa thay thế (spec của prototype)
  tags: string[]
  facts: string[]
  pairKey: string | null
  tributes: number
}

type Ex = {
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
  facts?: string[] | null
  pairKey?: string | null
  art?: unknown
}

const FEMALE = /(^|\s)(Thị|Thu|Phương|Mai|Hải Yến|Minh Nguyệt|Thanh Huyền|Ngọc|Lan|Hương|Hà|Trang|Linh|Vy|Châu|Ánh|Nhung|Hạnh|Oanh|Thủy|Hằng|Yến|Huyền|Anh Thư)(\s|$)/

/** Hình minh họa mặc định khi chưa có ảnh thật (theo đúng kiểu vẽ của prototype). */
function defaultArt(zoneType: string, e: Ex): unknown[] | null {
  if (['leaders', 'staff', 'alumni'].includes(zoneType)) return ['p', e.title, FEMALE.test(e.title) ? 1 : 0, e.staffStatus === 'retired' ? 1 : 0]
  if (zoneType === 'gallery') return ['s', e.title + (e.year || ''), /đại hội|kết nạp|chuyên đề|học tập|trao|văn nghệ|mít tinh|lễ trưởng thành/i.test(e.title) ? 'stage' : /bóng đá|hội khỏe|thể thao/i.test(e.title) ? 'sport' : 'outdoor', '']
  if (zoneType === 'campus') return ['b', 0]
  if (zoneType === 'memories') return ['k', 'kyvat', String(e.id)]
  return null
}

/** Hình minh họa được phủ màu ảnh cũ theo đúng quy tắc của prototype. */
function oldArt(zoneType: string, e: Ex, art: unknown[] | null): boolean {
  if (!art) return false
  if (zoneType === 'campus') return art[0] === 'b' && Number(art[1]) < 2
  if (zoneType === 'gallery') return (e.year || 9999) < 1998
  if (zoneType === 'memories') return e.memoryType === 'Ảnh kỷ niệm' && (e.year || 9999) < 2000
  return false
}

const MEM_TYPE: Record<string, string> = { 'Ảnh kỷ niệm': 'anh', 'Báo tường': 'baotuong', 'Đồng phục, kỷ vật': 'kyvat', 'Lưu bút, thư từ': 'luubut', 'Giấy khen, thẻ học sinh': 'giayto' }

export function toItem(z: ZoneDoc, e: Ex, tributes = 0): Item {
  const media = (e.media || []).filter((m): m is MediaDoc => typeof m === 'object' && !!m)
  const pics = media.filter((m) => !/\.(mp4|webm)$/i.test(m.url || ''))
  const vid = media.find((m) => /\.(mp4|webm)$/i.test(m.url || ''))
  const art = Array.isArray(e.art) ? (e.art as unknown[]) : pics.length ? null : defaultArt(z.type, e)
  let sub = e.subtitle || ''
  if (z.type === 'leaders' && !sub && e.yearStart) sub = `${e.yearStart} – ${e.yearEnd || 'nay'}`
  if (z.type === 'gallery' && !sub && e.year) sub = String(e.year)
  return {
    id: e.id,
    zone: z.slug,
    title: e.title,
    sub,
    cat: e.category || '',
    year: e.year ?? null,
    start: e.yearStart ?? null,
    end: e.yearEnd ?? null,
    status: e.staffStatus ?? null,
    k: e.awardKind ?? null,
    by: e.awardedBy || e.contributor || '',
    type: e.memoryType ? MEM_TYPE[e.memoryType] || e.memoryType : null,
    khoa: e.cohort || (z.type === 'alumni' ? e.subtitle || '' : ''),
    desc: e.description || '',
    img: imgUrl(pics[0], 'card'),
    big: imgUrl(pics[0], 'full'),
    imgs: pics.map((m) => imgUrl(m, 'full')!).filter(Boolean),
    video: vid?.url || null,
    old: pics.length ? !!pics[0].isHistorical : oldArt(z.type, e, art),
    art,
    tags: e.peopleTags || [],
    facts: e.facts || [],
    pairKey: e.pairKey || null,
    tributes,
  }
}

/** Mọi mục đã xuất bản của một khu (mỗi khu vài chục đến vài trăm mục — lọc ở client cho nhanh như prototype). */
export const zoneItems = cache(async (z: ZoneDoc): Promise<Item[]> => {
  const p = await payload()
  const r = await p.find({ collection: 'exhibits', where: { zone: { equals: z.id } } as Where, sort: 'sortOrder', limit: 1000, depth: 1, overrideAccess: false })
  let counts: Record<number, number> = {}
  if (z.type === 'leaders' || z.type === 'staff') {
    const t = await p.find({ collection: 'submissions', where: { and: [{ kind: { equals: 'tribute' } }, { status: { equals: 'approved' } }] }, limit: 5000, depth: 0, overrideAccess: true, select: { tributeTo: true } })
    counts = {}
    for (const d of t.docs) {
      const id = typeof d.tributeTo === 'object' && d.tributeTo ? (d.tributeTo as { id: number }).id : (d.tributeTo as number)
      if (id) counts[id] = (counts[id] || 0) + 1
    }
  }
  return (r.docs as unknown as Ex[]).map((e) => toItem(z, e, counts[e.id] || 0))
})

export type Tribute = { id: number; name: string; cohort?: string | null; text: string; at: string }

export async function tributesOf(exhibitId: number): Promise<Tribute[]> {
  const p = await payload()
  const r = await p.find({
    collection: 'submissions',
    where: { and: [{ kind: { equals: 'tribute' } }, { status: { equals: 'approved' } }, { tributeTo: { equals: exhibitId } }] },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
    select: { name: true, cohort: true, message: true, createdAt: true },
  })
  return r.docs.map((d) => ({ id: d.id as number, name: d.name, cohort: d.cohort, text: d.message || '', at: d.createdAt }))
}
