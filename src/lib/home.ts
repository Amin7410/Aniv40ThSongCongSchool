import 'server-only'
import { cache } from 'react'
import { getApproved, getFund, payload } from './data'

export const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(+n || 0)) + ' đ'
export const dstr = (t: string | Date) => new Date(t).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export type GB = { id: number; name: string; khoa?: string | null; msg: string; at: string }

export const guestbook = cache(async (limit = 30): Promise<GB[]> => {
  const r = await getApproved('guestbook', limit)
  return (r.docs as Array<{ id: number; name: string; cohort?: string | null; message?: string | null; createdAt: string }>).map((d) => ({
    id: d.id,
    name: d.name,
    khoa: d.cohort,
    msg: d.message || '',
    at: d.createdAt,
  }))
})

export const guestbookCount = cache(async () =>
  (await (await payload()).count({
    collection: 'submissions',
    where: { and: [{ kind: { equals: 'guestbook' } }, { status: { equals: 'approved' } }] },
    overrideAccess: true,
  })).totalDocs
)

export const candleCount = cache(async () => (await (await payload()).count({ collection: 'candles', overrideAccess: true })).totalDocs)

export const fundSummary = cache(async () => {
  const p = await payload()
  const f = await getFund()
  const r = await p.find({
    collection: 'submissions',
    where: { and: [{ kind: { equals: 'donation' } }, { status: { equals: 'approved' } }] },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
    select: { confirmedAmount: true, payload: true },
  })
  const raised = r.docs.reduce((a, d) => a + Number(d.confirmedAmount ?? (d.payload as { amount?: number })?.amount ?? 0), 0)
  return { name: f.name || 'Quỹ học bổng 40 năm', goal: Number(f.goal) || 0, raised, count: r.docs.length }
})
