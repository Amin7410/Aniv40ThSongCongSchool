import { getPayload } from 'payload'
import config from '@payload-config'
import QRCode from 'qrcode'
import { buildVietQR } from '@/lib/vietqr'

export const dynamic = 'force-dynamic'

/** Tổng quỹ chỉ tính các khoản đã được kế toán xác nhận; QR dựng từ STK đã phê duyệt. */
export async function GET() {
  const p = await getPayload({ config })
  const f = await p.findGlobal({ slug: 'fund-settings', depth: 0 })
  const confirmed = await p.find({
    collection: 'submissions',
    where: { and: [{ kind: { equals: 'donation' } }, { status: { equals: 'approved' } }] },
    limit: 1000,
    depth: 0,
    sort: '-createdAt',
    overrideAccess: true,
    select: { name: true, cohort: true, confirmedAmount: true, payload: true, createdAt: true },
  })
  const rows = confirmed.docs.map((d) => ({ name: d.name, cohort: d.cohort, amount: Number(d.confirmedAmount ?? (d.payload as { amount?: number })?.amount ?? 0), at: d.createdAt }))
  const raised = rows.reduce((a, r) => a + r.amount, 0)
  let qr: string | null = null
  if (f.bankBin && f.accountNo) {
    try {
      qr = await QRCode.toDataURL(buildVietQR({ bankBin: f.bankBin, accountNo: f.accountNo, note: f.transferPrefix || 'QHB40' }), { margin: 1, width: 360, errorCorrectionLevel: 'M' })
    } catch {}
  }
  return Response.json(
    { name: f.name, goal: f.goal, raised, count: rows.length, donors: rows.slice(0, 50), bank: f.accountNo ? { bankName: f.bankName, accountNo: f.accountNo, accountName: f.accountName, prefix: f.transferPrefix } : null, qr },
    { headers: { 'cache-control': 'public, max-age=15' } },
  )
}
