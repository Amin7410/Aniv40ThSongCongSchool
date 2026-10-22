import type { CollectionConfig, Payload } from 'payload'
import { execFile } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { admins, anyone } from '../access/roles'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateSite } from '../hooks/revalidate'

const run = promisify(execFile)
const MAX_PAGES = 240

/** Tách PDF thành ảnh từng trang (poppler `pdftoppm`) rồi đưa vào thư viện media. Chạy nền, không chặn lưu. */
async function processPdf(payload: Payload, id: number, mediaId: number) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'yb-'))
  try {
    // afterChange chạy bên trong transaction của thao tác lưu → chờ transaction commit xong mới xử lý
    for (let i = 0; i < 40; i++) {
      const found = await payload.find({ collection: 'yearbooks', where: { id: { equals: id } }, limit: 1, depth: 0, overrideAccess: true })
      if (found.docs[0]) break
      await new Promise((r) => setTimeout(r, 250))
    }
    await payload.update({ collection: 'yearbooks', id, data: { state: 'processing', stateNote: '' }, overrideAccess: true, context: { yb: true } })
    const m = await payload.findByID({ collection: 'media', id: mediaId, overrideAccess: true, depth: 0 })
    if (m.mimeType !== 'application/pdf') throw new Error('Tệp không phải PDF')
    const src = path.resolve(process.env.MEDIA_DIR || 'media', String(m.filename))
    const yb = await payload.findByID({ collection: 'yearbooks', id, overrideAccess: true, depth: 0 })
    await run('pdftoppm', ['-r', '110', '-l', String(MAX_PAGES), '-jpeg', '-jpegopt', 'quality=85', src, path.join(tmp, 'p')], { timeout: 10 * 60_000 })
    const files = (await fs.readdir(tmp)).filter((f) => f.endsWith('.jpg')).sort()
    const pages: number[] = []
    for (const [i, f] of files.entries()) {
      const data = await fs.readFile(path.join(tmp, f))
      const pm = await payload.create({
        collection: 'media',
        data: { alt: `${yb.title} – trang ${i + 1}` },
        file: { data, mimetype: 'image/jpeg', name: `kyyeu-${id}-${String(i + 1).padStart(3, '0')}.jpg`, size: data.length },
        overrideAccess: true,
      })
      pages.push(pm.id as number)
    }
    await payload.update({ collection: 'yearbooks', id, data: { pages, state: 'ready', reprocess: false, stateNote: `${pages.length} trang` }, overrideAccess: true, context: { yb: true } })
    revalidateSite()
  } catch (e) {
    payload.logger.error({ msg: 'Tách kỷ yếu thất bại', err: e })
    await payload.update({ collection: 'yearbooks', id, data: { state: 'error', stateNote: String((e as Error).message).slice(0, 200) }, overrideAccess: true, context: { yb: true } })
  } finally {
    await fs.rm(tmp, { recursive: true, force: true })
  }
}

export const Yearbooks: CollectionConfig = {
  slug: 'yearbooks',
  labels: { singular: 'Kỷ yếu', plural: 'Kỷ yếu số' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'state', 'published', 'order'], group: 'Nội dung', description: 'Tải tệp PDF kỷ yếu lên Thư viện media rồi chọn ở đây; hệ thống tự tách thành từng trang để lật.' },
  defaultSort: 'order',
  access: { read: ({ req }) => (req.user ? true : { published: { equals: true } }), create: admins, update: admins, delete: admins },
  hooks: {
    afterChange: [
      auditAfterChange,
      ({ doc, previousDoc, req, context }) => {
        if (context.yb) return doc
        const pdf = typeof doc.pdf === 'object' ? doc.pdf?.id : doc.pdf
        const prev = typeof previousDoc?.pdf === 'object' ? previousDoc?.pdf?.id : previousDoc?.pdf
        if (pdf && (pdf !== prev || doc.reprocess)) void processPdf(req.payload, doc.id, pdf)
        revalidateSite()
        return doc
      },
    ],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'title', label: 'Tên kỷ yếu', type: 'text', required: true, defaultValue: 'Kỷ yếu 40 năm (1986 – 2026)' },
    { name: 'pdf', label: 'Tệp PDF', type: 'upload', relationTo: 'media', required: true, filterOptions: { mimeType: { equals: 'application/pdf' } } },
    { name: 'published', label: 'Hiển thị công khai', type: 'checkbox', defaultValue: false },
    { name: 'reprocess', label: 'Tách lại trang khi lưu', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'state',
      label: 'Trạng thái xử lý',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Chờ xử lý', value: 'pending' },
        { label: 'Đang tách trang', value: 'processing' },
        { label: 'Sẵn sàng', value: 'ready' },
        { label: 'Lỗi', value: 'error' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'stateNote', label: 'Ghi chú xử lý', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'pages', label: 'Các trang', type: 'upload', relationTo: 'media', hasMany: true, admin: { readOnly: true } },
  ],
}
