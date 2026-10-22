import type { NextRequest } from 'next/server'
import type { Where } from 'payload'
import { getApproved } from '@/lib/data'
import { norm } from '@/lib/text'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const cohort = sp.get('cohort') || ''
  const q = (sp.get('q') || '').trim()

  const extra: Where[] = []
  if (cohort) {
    extra.push({ cohort: { equals: cohort } })
  }

  // Tải danh sách đã duyệt (lên tới 300 lời chúc)
  const r = await getApproved('guestbook', 300, 1, extra)
  let docs = (r.docs as Array<{
    id: number
    name: string
    cohort?: string | null
    message?: string | null
    createdAt: string
  }>).map((d) => ({
    id: d.id,
    name: d.name,
    khoa: d.cohort || '',
    msg: d.message || '',
    at: d.createdAt,
  }))

  if (q) {
    const nq = norm(q)
    docs = docs.filter((d) => norm(`${d.name} ${d.khoa} ${d.msg}`).includes(nq))
  }

  return Response.json(
    {
      docs,
      total: docs.length,
    },
    { headers: { 'cache-control': 'public, s-maxage=10, stale-while-revalidate=30' } },
  )
}
