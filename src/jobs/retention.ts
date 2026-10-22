/**
 * Dọn dữ liệu theo đúng cam kết trong Chính sách quyền riêng tư (Luật BVDLCN 91/2025/QH15):
 *  - Xóa IP băm của bài gửi sau 90 ngày.
 *  - Xóa tệp gốc trong vùng chờ duyệt 30 ngày sau khi bài đã được xử lý (ảnh đã duyệt đã có bản trong thư viện).
 *  - Xóa hẳn bài bị từ chối / đã rút sau 180 ngày.
 * Chạy: `pnpm retention` (cron hằng ngày trong docker-compose.prod.yml). An toàn khi chạy lại nhiều lần.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'

const DAY = 864e5
const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString()

export async function runRetention(payload: Payload, now = Date.now()) {
  void now
  const out = { ipHashCleared: 0, filesDeleted: 0, submissionsDeleted: 0 }

  const ip = await payload.update({
    collection: 'submissions',
    where: { and: [{ createdAt: { less_than: ago(90) } }, { ipHash: { exists: true } }, { ipHash: { not_equals: '' } }] },
    data: { ipHash: '' },
    overrideAccess: true,
    depth: 0,
  })
  out.ipHashCleared = ip.docs.length

  // Tệp chờ duyệt của bài đã xử lý > 30 ngày
  const processed = await payload.find({
    collection: 'submissions',
    where: { and: [{ status: { not_equals: 'pending' } }, { updatedAt: { less_than: ago(30) } }, { files: { exists: true } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  for (const s of processed.docs) {
    const ids = ((s.files || []) as Array<number | { id: number }>).map((f) => (typeof f === 'object' ? f.id : f))
    if (!ids.length) continue
    await payload.update({ collection: 'submissions', id: s.id, data: { files: [] }, overrideAccess: true, depth: 0 })
    for (const id of ids) {
      try {
        await payload.delete({ collection: 'submission-files', id, overrideAccess: true })
        out.filesDeleted++
      } catch {}
    }
  }

  const old = await payload.delete({
    collection: 'submissions',
    where: { and: [{ status: { in: ['rejected', 'hidden'] } }, { updatedAt: { less_than: ago(180) } }] },
    overrideAccess: true,
    depth: 0,
  })
  out.submissionsDeleted = old.docs.length

  await payload.create({
    collection: 'audit-logs',
    data: { actorLabel: 'hệ thống', action: 'retention', target: 'submissions', docId: '', after: out },
    overrideAccess: true,
  })
  return out
}

if (process.argv[1]?.includes('retention')) {
  getPayload({ config })
    .then(runRetention)
    .then((r) => {
      console.log('[retention]', JSON.stringify(r))
      process.exit(0)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
