import type { NextRequest } from 'next/server'
import { MODERATOR_ROLES, staff } from '@/lib/staff'

export const dynamic = 'force-dynamic'

/** Số liệu tổng quan cho Ban tổ chức (không chứa dữ liệu cá nhân). */
export async function GET(req: NextRequest) {
  const c = await staff(req.headers, MODERATOR_ROLES)
  if (c instanceof Response) return c
  const p = c.payload
  const cnt = async (collection: 'submissions' | 'candles' | 'exhibits', where?: object) =>
    (await p.count({ collection, where: where as never, overrideAccess: true })).totalDocs
  const kinds = ['guestbook', 'memory', 'photo', 'tribute', 'pin', 'donation'] as const
  const byKind: Record<string, { pending: number; approved: number }> = {}
  for (const k of kinds)
    byKind[k] = {
      pending: await cnt('submissions', { and: [{ kind: { equals: k } }, { status: { equals: 'pending' } }] }),
      approved: await cnt('submissions', { and: [{ kind: { equals: k } }, { status: { equals: 'approved' } }] }),
    }
  const oldest = await p.find({ collection: 'submissions', where: { status: { equals: 'pending' } }, sort: 'createdAt', limit: 1, depth: 0, overrideAccess: true, select: { createdAt: true } })
  const fund = await p.findGlobal({ slug: 'fund-settings', depth: 0 })
  const dons = await p.find({ collection: 'submissions', where: { and: [{ kind: { equals: 'donation' } }, { status: { equals: 'approved' } }] }, limit: 5000, depth: 0, overrideAccess: true, select: { confirmedAmount: true, payload: true } })
  const raised = dons.docs.reduce((a, d) => a + Number(d.confirmedAmount ?? (d.payload as { amount?: number })?.amount ?? 0), 0)
  // Nội dung gửi lên 14 ngày gần nhất
  const days: Array<{ day: string; count: number }> = []
  const since = new Date(Date.now() - 13 * 864e5)
  since.setHours(0, 0, 0, 0)
  const recent = await p.find({ collection: 'submissions', where: { createdAt: { greater_than_equal: since.toISOString() } }, limit: 10000, depth: 0, overrideAccess: true, select: { createdAt: true } })
  for (let i = 0; i < 14; i++) {
    const d = new Date(since.getTime() + i * 864e5)
    const key = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
    days.push({ day: key, count: 0 })
  }
  for (const r of recent.docs) {
    const key = new Date(r.createdAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
    const row = days.find((x) => x.day === key)
    if (row) row.count++
  }
  return Response.json(
    {
      byKind,
      pendingTotal: Object.values(byKind).reduce((a, x) => a + x.pending, 0),
      oldestPendingAt: oldest.docs[0]?.createdAt || null,
      candles: await cnt('candles'),
      exhibits: await cnt('exhibits'),
      fund: { goal: fund.goal || 0, raised, donors: dons.totalDocs },
      days,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
