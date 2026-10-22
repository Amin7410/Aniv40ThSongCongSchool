import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifySolution } from '@/lib/pow'
import { allow } from '@/lib/ratelimit'
import { ipHash, newToken, sameOrigin, sha256 } from '@/lib/security'
import { CONSENT_VERSION, KINDS_WITH_FILES, MAX_FILE_BYTES, MAX_FILES, submissionSchema } from '@/lib/schemas'
import { DEFAULT_FLAG_WORDS, findFlags, spamSignals } from '@/lib/text'
import { sanitizeImage, sniff } from '@/lib/images'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const err = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status, headers: { 'cache-control': 'no-store' } })

/** Khách gửi nội dung. Mọi bài vào trạng thái "chờ duyệt"; không bao giờ hiển thị ngay. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err(403, 'Yêu cầu không hợp lệ.')
  const payload = await getPayload({ config })
  const ev = await payload.findGlobal({ slug: 'event-settings', depth: 0 })
  if (ev.submissionsOpen === false) return err(423, 'Tạm dừng nhận nội dung. Xin hãy quay lại sau.')

  const ip = ipHash(req)
  if (!(await allow(ip, [['sub10m', 5, 600], ['subday', 20, 86400]])))
    return err(429, 'Bạn đã gửi quá nhiều trong thời gian ngắn. Hãy thử lại sau ít phút.')

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return err(400, 'Dữ liệu gửi lên không hợp lệ.')
  }
  // Honeypot: trường ẩn, người thật không điền.
  if (String(form.get('website') || '')) return Response.json({ ok: true, status: 'pending' }, { status: 202 })

  let pow: unknown = null
  try {
    pow = JSON.parse(String(form.get('pow') || 'null'))
  } catch {}
  if (!(await verifySolution(pow))) return err(400, 'Không xác minh được. Hãy tải lại trang và gửi lại.')

  const raw: Record<string, unknown> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string' && k !== 'pow' && k !== 'website') raw[k] = v
  raw.consent = raw.consent === 'true' || raw.consent === 'on'
  const parsed = submissionSchema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? '_')] ||= i.message
    return err(422, 'Hãy kiểm tra lại thông tin.', { fields })
  }
  const d = parsed.data

  // Ảnh: chỉ cho kỷ vật / ảnh đóng góp; kiểm tra magic bytes rồi nén lại để xóa EXIF/GPS.
  const files = form.getAll('files').filter((f): f is File => typeof f === 'object' && 'arrayBuffer' in f && f.size > 0)
  if (files.length && !KINDS_WITH_FILES.has(d.kind)) return err(400, 'Loại nội dung này không nhận ảnh.')
  if (d.kind === 'photo' && !files.length) return err(422, 'Hãy chọn ít nhất một ảnh.', { fields: { files: 'Hãy chọn ít nhất một ảnh.' } })
  if (files.length > MAX_FILES) return err(422, `Tối đa ${MAX_FILES} ảnh.`)
  const clean: Buffer[] = []
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) return err(413, 'Mỗi ảnh tối đa 10 MB.')
    const buf = Buffer.from(await f.arrayBuffer())
    const t = sniff(buf)
    if (!t || t === 'heic') return err(415, 'Chỉ nhận ảnh JPG, PNG hoặc WebP.')
    try {
      clean.push(await sanitizeImage(buf))
    } catch {
      return err(415, 'Không đọc được ảnh. Hãy chọn ảnh khác.')
    }
  }

  // Dữ liệu tham chiếu
  let tributeTo: number | undefined
  let city: number | undefined
  if (d.kind === 'tribute') {
    const ex = await payload.find({ collection: 'exhibits', where: { id: { equals: d.exhibitId } }, limit: 1, depth: 0, overrideAccess: false })
    if (!ex.docs[0]) return err(422, 'Không tìm thấy hồ sơ nhận lời tri ân.')
    tributeTo = ex.docs[0].id as number
  }
  if (d.kind === 'pin') {
    const c = await payload.find({ collection: 'cities', where: { code: { equals: d.cityCode } }, limit: 1, depth: 0 })
    if (!c.docs[0]) return err(422, 'Hãy chọn thành phố trong danh sách.', { fields: { cityCode: 'Hãy chọn thành phố.' } })
    city = c.docs[0].id as number
  }

  const site = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const message = 'message' in d ? d.message : ''
  const text = [d.name, d.cohort, message, 'title' in d ? d.title : '', 'workplace' in d ? d.workplace : ''].join(' ')
  const flags = [...findFlags(text, site.flagWords?.length ? site.flagWords : DEFAULT_FLAG_WORDS), ...spamSignals(text)]

  // Trùng nội dung trong 24 giờ từ cùng nguồn → gắn cờ.
  if (message) {
    const dup = await payload.count({
      collection: 'submissions',
      where: { and: [{ ipHash: { equals: ip } }, { message: { equals: message } }, { createdAt: { greater_than: new Date(Date.now() - 864e5).toISOString() } }] },
      overrideAccess: true,
    })
    if (dup.totalDocs) flags.push('trung-lap')
  }

  const fileIds: number[] = []
  for (const [i, buf] of clean.entries()) {
    const f = await payload.create({
      collection: 'submission-files',
      data: { alt: `${d.kind}-${i + 1}` },
      file: { data: buf, mimetype: 'image/jpeg', name: `${crypto.randomUUID()}.jpg`, size: buf.length },
      overrideAccess: true,
    })
    fileIds.push(f.id as number)
  }

  const extra: Record<string, unknown> = {}
  if (d.kind === 'memory') Object.assign(extra, { title: d.title, type: d.type, year: d.year })
  if (d.kind === 'photo') Object.assign(extra, { year: d.year })
  if (d.kind === 'pin') Object.assign(extra, { workplace: d.workplace })
  if (d.kind === 'donation') Object.assign(extra, { amount: d.amount, anonymous: d.anonymous })

  const token = newToken()
  const doc = await payload.create({
    collection: 'submissions',
    data: {
      kind: d.kind,
      status: 'pending',
      name: d.kind === 'donation' && d.anonymous ? 'Ẩn danh' : d.name,
      cohort: d.cohort || undefined,
      contact: 'contact' in d ? d.contact || undefined : undefined,
      message: message || undefined,
      payload: extra,
      files: fileIds,
      tributeTo,
      city,
      flags,
      consentVersion: CONSENT_VERSION,
      ipHash: ip,
      editTokenHash: sha256(token),
    },
    overrideAccess: true,
  })

  return Response.json({ ok: true, id: doc.id, status: 'pending', token }, { status: 202, headers: { 'cache-control': 'no-store' } })
}

/** Người gửi xem trạng thái bài bằng token đã nhận. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (token.length < 20) return err(404, 'Không tìm thấy.')
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'submissions', where: { editTokenHash: { equals: sha256(token) } }, limit: 1, depth: 0, overrideAccess: true, select: { kind: true, status: true, createdAt: true, rejectReason: true } })
  const s = r.docs[0]
  if (!s) return err(404, 'Không tìm thấy.')
  return Response.json({ kind: s.kind, status: s.status, createdAt: s.createdAt, rejectReason: s.status === 'rejected' ? s.rejectReason : undefined }, { headers: { 'cache-control': 'no-store' } })
}

/** Người gửi tự rút bài khi còn chờ duyệt. */
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return err(403, 'Yêu cầu không hợp lệ.')
  const token = req.nextUrl.searchParams.get('token') || ''
  if (token.length < 20) return err(404, 'Không tìm thấy.')
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'submissions', where: { editTokenHash: { equals: sha256(token) } }, limit: 1, depth: 0, overrideAccess: true })
  const s = r.docs[0]
  if (!s) return err(404, 'Không tìm thấy.')
  if (s.status !== 'pending') return err(409, 'Bài đã được xử lý. Hãy liên hệ nhà trường để yêu cầu gỡ.')
  await payload.update({ collection: 'submissions', id: s.id, data: { status: 'hidden', rejectReason: 'Người gửi tự rút lại' }, overrideAccess: true })
  return Response.json({ ok: true })
}
