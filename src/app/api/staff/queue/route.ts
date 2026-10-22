import type { NextRequest } from 'next/server'
import type { Where } from 'payload'
import { MODERATOR_ROLES, staff } from '@/lib/staff'
import { sameOrigin } from '@/lib/security'

export const dynamic = 'force-dynamic'

const KINDS = ['guestbook', 'memory', 'photo', 'tribute', 'pin', 'donation']
const STATUSES = ['pending', 'approved', 'rejected', 'hidden']

/** Hàng chờ kiểm duyệt (đọc theo đúng quyền của người gọi: kế toán chỉ thấy báo đóng góp). */
export async function GET(req: NextRequest) {
  const c = await staff(req.headers, MODERATOR_ROLES)
  if (c instanceof Response) return c
  const sp = req.nextUrl.searchParams
  const kind = sp.get('kind') || ''
  const status = STATUSES.includes(sp.get('status') || '') ? sp.get('status')! : 'pending'
  const and: Where[] = [{ status: { equals: status } }]
  if (KINDS.includes(kind)) and.push({ kind: { equals: kind } })
  if (sp.get('flagged') === '1') and.push({ flags: { exists: true } })
  const q = (sp.get('q') || '').trim().slice(0, 80)
  if (q) and.push({ or: [{ name: { like: q } }, { message: { like: q } }, { cohort: { like: q } }] })
  const res = await c.payload.find({
    collection: 'submissions',
    where: { and },
    sort: status === 'pending' ? 'createdAt' : '-updatedAt', // chờ duyệt: cũ nhất lên trước
    limit: 50,
    page: Math.max(1, Number(sp.get('page')) || 1),
    depth: 1,
    overrideAccess: false,
    req: c.req,
  })
  // Đếm theo loại để hiện badge
  const counts: Record<string, number> = {}
  for (const k of KINDS) {
    counts[k] = (await c.payload.count({ collection: 'submissions', where: { and: [{ status: { equals: 'pending' } }, { kind: { equals: k } }] }, overrideAccess: false, req: c.req })).totalDocs
  }
  const zones = await c.payload.find({ collection: 'zones', limit: 50, sort: 'order', depth: 0 })
  return Response.json(
    {
      docs: res.docs.map((d) => ({
        id: d.id,
        kind: d.kind,
        status: d.status,
        name: d.name,
        cohort: d.cohort,
        contact: d.contact,
        message: d.message,
        payload: d.payload,
        flags: d.flags || [],
        createdAt: d.createdAt,
        rejectReason: d.rejectReason,
        confirmedAmount: d.confirmedAmount,
        tributeTo: d.tributeTo && typeof d.tributeTo === 'object' ? { id: d.tributeTo.id, title: d.tributeTo.title } : null,
        city: d.city && typeof d.city === 'object' ? { name: d.city.name, country: d.city.country } : null,
        files: ((d.files || []) as Array<{ id: number; url?: string | null; sizes?: { thumb?: { url?: string | null } } } | number>)
          .filter((f): f is { id: number; url?: string | null; sizes?: { thumb?: { url?: string | null } } } => typeof f === 'object')
          .map((f) => ({ id: f.id, url: f.url, thumb: f.sizes?.thumb?.url || f.url })),
      })),
      total: res.totalDocs,
      page: res.page,
      pages: res.totalPages,
      counts,
      role: c.user.role,
      zones: zones.docs.map((z) => ({ id: z.id, title: z.title, type: z.type })),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}

type Action = { ids: number[]; action: 'approve' | 'reject' | 'hide' | 'restore'; reason?: string; targetZone?: number; publishTitle?: string; confirmedAmount?: number }

/** Duyệt / từ chối / ẩn hàng loạt. Mỗi mục đi qua access + hook như thao tác trong trang quản trị. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 })
  const c = await staff(req.headers, MODERATOR_ROLES)
  if (c instanceof Response) return c
  let b: Action
  try {
    b = await req.json()
  } catch {
    return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }
  const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger).slice(0, 100)
  if (!ids.length) return Response.json({ error: 'Chưa chọn mục nào.' }, { status: 400 })
  const status = { approve: 'approved', reject: 'rejected', hide: 'hidden', restore: 'pending' }[b.action]
  if (!status) return Response.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 })
  if (b.action === 'reject' && !String(b.reason || '').trim()) return Response.json({ error: 'Hãy chọn lý do từ chối.' }, { status: 400 })

  const results: Array<{ id: number; ok: boolean; error?: string }> = []
  for (const id of ids) {
    const data: Record<string, unknown> = { status }
    if (b.action === 'reject') data.rejectReason = String(b.reason).slice(0, 200)
    if (b.action === 'approve') {
      if (b.targetZone) data.targetZone = Number(b.targetZone)
      if (b.publishTitle && ids.length === 1) data.publishTitle = String(b.publishTitle).slice(0, 140)
      if (b.confirmedAmount != null && ids.length === 1) data.confirmedAmount = Math.max(0, Math.round(Number(b.confirmedAmount)))
    }
    try {
      await c.payload.update({ collection: 'submissions', id, data, overrideAccess: false, req: c.req, depth: 0 })
      results.push({ id, ok: true })
    } catch (e) {
      results.push({ id, ok: false, error: (e as Error).message })
    }
  }
  return Response.json({ results, ok: results.every((r) => r.ok) }, { status: results.some((r) => r.ok) ? 200 : 400 })
}
