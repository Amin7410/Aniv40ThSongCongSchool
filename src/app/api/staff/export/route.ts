import type { NextRequest } from 'next/server'
import { ADMIN_ROLES, staff } from '@/lib/staff'
import { writeAudit } from '@/hooks/audit'

export const dynamic = 'force-dynamic'

/** Chống CSV injection: ô bắt đầu bằng = + - @ bị Excel hiểu là công thức. */
function cell(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

const SETS: Record<string, { kinds: string[]; title: string; cols: Array<[string, (d: Record<string, unknown>) => unknown]> }> = {
  'loi-chuc': { kinds: ['guestbook'], title: 'Lời chúc đã duyệt', cols: [['Họ tên', (d) => d.name], ['Khóa/đơn vị', (d) => d.cohort], ['Email liên hệ', (d) => d.contact], ['Lời chúc', (d) => d.message], ['Thời gian', (d) => d.createdAt]] },
  'tri-an': { kinds: ['tribute'], title: 'Lời tri ân', cols: [['Họ tên', (d) => d.name], ['Khóa', (d) => d.cohort], ['Gửi tới', (d) => (d.tributeTo as { title?: string })?.title], ['Lời tri ân', (d) => d.message], ['Thời gian', (d) => d.createdAt]] },
  'ky-vat': {
    kinds: ['memory', 'photo'],
    title: 'Kỷ vật, ảnh đã duyệt',
    cols: [['Loại', (d) => d.kind], ['Người gửi', (d) => d.name], ['Khóa', (d) => d.cohort], ['Liên hệ', (d) => d.contact], ['Tên kỷ vật', (d) => (d.payload as { title?: string })?.title], ['Câu chuyện', (d) => d.message], ['Năm', (d) => (d.payload as { year?: number })?.year], ['Thời gian', (d) => d.createdAt]],
  },
  'dong-gop': {
    kinds: ['donation'],
    title: 'Đóng góp quỹ đã xác nhận',
    cols: [['Họ tên', (d) => d.name], ['Khóa', (d) => d.cohort], ['Số tiền báo', (d) => (d.payload as { amount?: number })?.amount], ['Số tiền xác nhận', (d) => d.confirmedAmount], ['Ghi chú', (d) => d.message], ['Liên hệ', (d) => d.contact], ['Thời gian', (d) => d.createdAt]],
  },
}

/** Xuất CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). Chỉ quản trị trường; mỗi lần xuất ghi nhật ký. */
export async function GET(req: NextRequest) {
  const c = await staff(req.headers, ADMIN_ROLES)
  if (c instanceof Response) return c
  const key = req.nextUrl.searchParams.get('bo') || ''
  const set = SETS[key]
  if (!set) return Response.json({ error: 'Không có bộ dữ liệu này.' }, { status: 400 })
  const res = await c.payload.find({
    collection: 'submissions',
    where: { and: [{ kind: { in: set.kinds } }, { status: { equals: 'approved' } }] },
    limit: 20000,
    sort: 'createdAt',
    depth: 1,
    overrideAccess: false,
    req: c.req,
  })
  const lines = [set.cols.map(([h]) => cell(h)).join(',')]
  for (const d of res.docs) lines.push(set.cols.map(([, f]) => cell(f(d as unknown as Record<string, unknown>))).join(','))
  await writeAudit({ payload: c.payload } as never, 'export-csv', key, null, null, { rows: res.docs.length }, c.user)
  const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
  return new Response('﻿' + lines.join('\r\n'), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${key}-${date}.csv"`, 'cache-control': 'no-store' },
  })
}
