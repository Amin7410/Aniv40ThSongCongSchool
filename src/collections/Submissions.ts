import type { CollectionConfig, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import fs from 'fs/promises'
import path from 'path'
import { admins, isAdminRole, roleOf, submissionsStaff } from '../access/roles'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateSite } from '../hooks/revalidate'

export const SUBMISSION_KINDS = [
  { label: 'Lời chúc (sổ lời chúc)', value: 'guestbook' },
  { label: 'Kỷ vật', value: 'memory' },
  { label: 'Ảnh đóng góp', value: 'photo' },
  { label: 'Lời tri ân', value: 'tribute' },
  { label: 'Ghim bản đồ', value: 'pin' },
  { label: 'Báo đóng góp quỹ', value: 'donation' },
] as const
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number]['value']

const PUBLISHABLE_TO_ZONE: SubmissionKind[] = ['memory', 'photo']

async function promoteFiles(req: PayloadRequest, ids: Array<number | string | { id: number | string }>, alt: string, credit: string) {
  const out: number[] = []
  for (const ref of ids) {
    const id = typeof ref === 'object' ? ref.id : ref
    const f = await req.payload.findByID({ collection: 'submission-files', id, overrideAccess: true, req, depth: 0 })
    const dir = process.env.QUARANTINE_DIR || 'quarantine'
    const data = await fs.readFile(path.resolve(dir, String(f.filename)))
    const m = await req.payload.create({
      collection: 'media',
      data: { alt: alt.slice(0, 140) || 'Ảnh tư liệu', credit, isHistorical: true },
      file: { data, mimetype: String(f.mimeType), name: String(f.filename), size: data.length },
      overrideAccess: true,
      req,
    })
    out.push(m.id as number)
  }
  return out
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Nội dung gửi lên', plural: 'Hàng chờ kiểm duyệt' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'kind', 'status', 'name', 'cohort', 'flags'],
    listSearchableFields: ['name', 'cohort', 'message'],
    group: 'Kiểm duyệt',
    description: 'Mọi nội dung khách gửi chỉ hiển thị công khai khi chuyển sang "Đã duyệt". Mục có cờ cần xem kỹ.',
  },
  defaultSort: '-createdAt',
  access: {
    read: submissionsStaff,
    create: () => false, // khách gửi qua /api/public/submissions (có PoW, rate limit)
    update: submissionsStaff,
    delete: admins,
  },
  hooks: {
    beforeChange: [
      async ({ req, data, originalDoc, operation }) => {
        if (operation !== 'update' || !req.user) return data
        const r = roleOf(req)
        if (r === 'accountant' && originalDoc?.kind !== 'donation') throw new APIError('Không có quyền.', 403)
        if (data.status && data.status !== originalDoc?.status) {
          if (originalDoc?.kind === 'donation' && !(isAdminRole(r) || r === 'accountant'))
            throw new APIError('Chỉ kế toán hoặc quản trị trường được xác nhận đóng góp.', 403)
          data.moderatedBy = req.user.id
          data.moderatedAt = new Date().toISOString()
        }
        // Duyệt kỷ vật / ảnh: tạo mục trưng bày trong khu đích, chuyển ảnh sang thư viện công khai.
        const becameApproved = data.status === 'approved' && originalDoc?.status !== 'approved'
        if (becameApproved && PUBLISHABLE_TO_ZONE.includes(originalDoc.kind) && !originalDoc.publishedAs) {
          const zone = data.targetZone ?? originalDoc.targetZone
          if (!zone) throw new APIError('Hãy chọn "Khu đích" trước khi duyệt kỷ vật hoặc ảnh.', 400)
          const p = { ...(originalDoc.payload || {}), ...(data.payload || {}) }
          const title = String(data.publishTitle || originalDoc.publishTitle || p.title || 'Kỷ vật').slice(0, 140)
          const credit = [originalDoc.name, originalDoc.cohort].filter(Boolean).join(', ')
          const media = await promoteFiles(req, originalDoc.files || [], title, credit)
          const ex = await req.payload.create({
            collection: 'exhibits',
            data: {
              zone: typeof zone === 'object' ? zone.id : zone,
              title,
              subtitle: credit,
              cohort: originalDoc.cohort || undefined,
              contributor: originalDoc.name,
              memoryType: p.type,
              year: Number(p.year) || undefined,
              description: originalDoc.message,
              media,
              sourceSubmission: originalDoc.id,
              _status: 'published',
            },
            overrideAccess: true,
            req,
          })
          data.publishedAs = ex.id
        }
        return data
      },
    ],
    afterChange: [
      auditAfterChange,
      async ({ doc, previousDoc, req }) => {
        // Gỡ (ẩn/từ chối) một kỷ vật đã đăng → mục trưng bày tương ứng chuyển về bản nháp, không còn công khai.
        if (doc.publishedAs && previousDoc?.status === 'approved' && doc.status !== 'approved') {
          const exId = typeof doc.publishedAs === 'object' ? doc.publishedAs.id : doc.publishedAs
          await req.payload.update({ collection: 'exhibits', id: exId, data: { _status: 'draft' }, overrideAccess: true, req })
        }
        // Đăng lại kỷ vật từng bị gỡ → mở lại mục trưng bày cũ (không tạo bản trùng).
        if (previousDoc?.publishedAs && previousDoc.status !== 'approved' && doc.status === 'approved') {
          const exId = typeof previousDoc.publishedAs === 'object' ? previousDoc.publishedAs.id : previousDoc.publishedAs
          await req.payload.update({ collection: 'exhibits', id: exId, data: { _status: 'published' }, overrideAccess: true, req })
        }
        if (doc.status !== previousDoc?.status) revalidateSite()
        return doc
      },
    ],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kind', label: 'Loại', type: 'select', required: true, options: [...SUBMISSION_KINDS], index: true, admin: { readOnly: true } },
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: [
            { label: 'Chờ duyệt', value: 'pending' },
            { label: 'Đã duyệt', value: 'approved' },
            { label: 'Từ chối', value: 'rejected' },
            { label: 'Đã ẩn', value: 'hidden' },
          ],
        },
      ],
    },
    { name: 'flags', label: 'Cờ cảnh báo', type: 'text', hasMany: true, admin: { readOnly: true } },
    { name: 'name', label: 'Người gửi', type: 'text', required: true, maxLength: 80 },
    { name: 'cohort', label: 'Khóa / lớp / đơn vị', type: 'text', maxLength: 60 },
    {
      name: 'contact',
      label: 'Liên hệ (không công khai)',
      type: 'text',
      maxLength: 120,
      access: { read: ({ req }) => isAdminRole(roleOf(req)) || roleOf(req) === 'moderator' },
    },
    { name: 'message', label: 'Nội dung', type: 'textarea', maxLength: 1200 },
    { name: 'payload', label: 'Dữ liệu theo loại', type: 'json', admin: { readOnly: true } },
    { name: 'files', label: 'Ảnh đính kèm', type: 'upload', relationTo: 'submission-files', hasMany: true, admin: { readOnly: true } },
    {
      name: 'tributeTo',
      label: 'Gửi tới hồ sơ',
      type: 'relationship',
      relationTo: 'exhibits',
      admin: { readOnly: true, condition: (d) => d?.kind === 'tribute' },
    },
    {
      name: 'city',
      label: 'Thành phố',
      type: 'relationship',
      relationTo: 'cities',
      admin: { readOnly: true, condition: (d) => d?.kind === 'pin' },
    },
    {
      type: 'collapsible',
      label: 'Đưa vào khu trưng bày (kỷ vật, ảnh)',
      admin: { condition: (d) => d?.kind === 'memory' || d?.kind === 'photo' },
      fields: [
        { name: 'targetZone', label: 'Khu đích', type: 'relationship', relationTo: 'zones' },
        { name: 'publishTitle', label: 'Tiêu đề khi đăng', type: 'text', maxLength: 140 },
        { name: 'publishedAs', label: 'Đã đăng thành mục', type: 'relationship', relationTo: 'exhibits', admin: { readOnly: true } },
      ],
    },
    {
      name: 'confirmedAmount',
      label: 'Số tiền xác nhận theo sao kê (đ)',
      type: 'number',
      min: 0,
      admin: { condition: (d) => d?.kind === 'donation' },
    },
    { name: 'rejectReason', label: 'Lý do từ chối', type: 'text' },
    { name: 'consentVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'moderatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'moderatedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true }, access: { read: () => false } },
    { name: 'editTokenHash', type: 'text', index: true, admin: { hidden: true }, access: { read: () => false } },
  ],
}

export const Candles: CollectionConfig = {
  slug: 'candles',
  labels: { singular: 'Nến tri ân', plural: 'Nến tri ân' },
  admin: { group: 'Kiểm duyệt', hidden: true },
  access: { read: admins, create: () => false, update: () => false, delete: admins },
  fields: [{ name: 'fp', type: 'text', required: true, unique: true, index: true }],
}
