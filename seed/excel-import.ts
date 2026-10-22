/**
 * Nhập tư liệu từ file Excel mẫu.
 *   pnpm excel:import <file.xlsx> [--anh <thư-mục-ảnh>]           → CHẠY THỬ: chỉ kiểm tra, báo lỗi từng dòng
 *   pnpm excel:import <file.xlsx> --anh <thư-mục-ảnh> --ghi        → ghi vào CSDL (bản nháp, chờ duyệt xuất bản)
 * Dòng ví dụ (nền vàng, chữ nghiêng) được bỏ qua nếu chưa sửa. Chạy lại an toàn: mục trùng tên trong cùng khu sẽ được cập nhật.
 */
import 'dotenv/config'
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'
import { AWARD_OF, SHEETS, STATUS_OF, ZONE_OF_ACTIVITY, type Sheet } from './excel-spec'

const args = process.argv.slice(2)
const file = args.find((a) => a.endsWith('.xlsx'))
const imgDir = args.includes('--anh') ? args[args.indexOf('--anh') + 1] : ''
const write = args.includes('--ghi')
const publish = args.includes('--xuat-ban')

type Row = Record<string, string>
type Problem = { sheet: string; row: number; msg: string }

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return ''
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((t) => t.text).join('')
    if ('text' in v) return String(v.text)
    if ('result' in v) return String(v.result ?? '')
    if (v instanceof Date) return String(v.getFullYear())
  }
  return String(v).trim()
}

function readSheet(wb: ExcelJS.Workbook, s: Sheet): Array<{ n: number; r: Row }> {
  const ws = wb.getWorksheet(s.name)
  if (!ws) return []
  const rows: Array<{ n: number; r: Row }> = []
  ws.eachRow((row, n) => {
    if (n === 1) return
    const r: Row = {}
    s.cols.forEach((c, i) => (r[c.key] = cellText(row.getCell(i + 1).value)))
    if (!Object.values(r).some(Boolean)) return
    const isExample = s.cols.every((c) => String(s.example[c.key] ?? '') === (r[c.key] || ''))
    if (isExample) return
    rows.push({ n, r })
  })
  return rows
}

function validate(s: Sheet, n: number, r: Row, problems: Problem[]) {
  const add = (msg: string) => problems.push({ sheet: s.name, row: n, msg })
  for (const c of s.cols) {
    const v = r[c.key]
    if (c.req && !v) add(`thiếu "${c.header.replace(' *', '')}"`)
    if (v && c.list && !c.list.includes(v)) add(`"${c.header.replace(' *', '')}" = "${v}" không có trong danh sách`)
    if (v && c.kind === 'year' && !/^(19|20)\d{2}$/.test(v)) add(`"${c.header.replace(' *', '')}" = "${v}" không phải năm 4 chữ số`)
  }
  if (r.anh && imgDir)
    for (const f of r.anh.split(',').map((x) => x.trim()).filter(Boolean))
      if (!fs.existsSync(path.join(imgDir, f))) add(`không tìm thấy ảnh "${f}" trong thư mục ảnh`)
  if (s.name === 'Cuu_hoc_sinh' && r.khoa && !/\d{4}/.test(r.khoa)) add('Khóa học cần có năm, VD "Khóa 1990 – 1993"')
}

async function uploadImages(p: Payload, list: string, alt: string, credit?: string): Promise<number[]> {
  const ids: number[] = []
  for (const f of list.split(',').map((x) => x.trim()).filter(Boolean)) {
    const fp = path.join(imgDir, f)
    const existing = await p.find({ collection: 'media', where: { credit: { equals: `import:${f}` } }, limit: 1, depth: 0 })
    if (existing.docs[0]) {
      ids.push(existing.docs[0].id as number)
      continue
    }
    const data = fs.readFileSync(fp)
    const ext = path.extname(f).toLowerCase()
    const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    const m = await p.create({ collection: 'media', data: { alt: alt.slice(0, 140), credit: credit ? `${credit}` : `import:${f}`, isHistorical: false }, file: { data, mimetype, name: f, size: data.length } })
    // đánh dấu để chạy lại không tải trùng
    await p.update({ collection: 'media', id: m.id, data: { credit: `import:${f}` } })
    ids.push(m.id as number)
  }
  return ids
}

async function main() {
  if (!file) throw new Error('Cách dùng: pnpm excel:import <file.xlsx> [--anh <thư-mục>] [--ghi] [--xuat-ban]')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  const problems: Problem[] = []
  const data = SHEETS.map((s) => ({ s, rows: readSheet(wb, s) }))
  for (const { s, rows } of data) for (const { n, r } of rows) validate(s, n, r, problems)

  console.log('\n=== KẾT QUẢ KIỂM TRA ===')
  for (const { s, rows } of data) console.log(`${s.title.padEnd(48)} ${rows.length} dòng`)
  if (!imgDir) console.log('\n(Chưa chỉ định --anh nên chưa kiểm tra tệp ảnh.)')
  if (problems.length) {
    console.log(`\n${problems.length} lỗi cần sửa:`)
    for (const pr of problems) console.log(`  [${pr.sheet}] dòng ${pr.row}: ${pr.msg}`)
  } else console.log('\nKhông có lỗi.')
  if (!write) {
    console.log('\nĐây là CHẠY THỬ. Thêm --ghi để nhập vào hệ thống.')
    process.exit(problems.length ? 2 : 0)
  }
  if (problems.length) throw new Error('Còn lỗi — chưa ghi dữ liệu.')

  const p = await getPayload({ config })
  const zones = Object.fromEntries((await p.find({ collection: 'zones', limit: 50, depth: 0 })).docs.map((z) => [z.slug, z.id as number]))
  const status = publish ? 'published' : 'draft'
  let created = 0
  let updated = 0

  async function upsertExhibit(zoneSlug: string, title: string, fields: Record<string, unknown>, imgs?: string, order?: number) {
    const zone = zones[zoneSlug]
    const media = imgs && imgDir ? await uploadImages(p, imgs, title) : undefined
    const data = { zone, title, ...fields, ...(media?.length ? { media } : {}), ...(order != null ? { sortOrder: order } : {}), _status: status as 'draft' | 'published' }
    const ex = await p.find({ collection: 'exhibits', where: { and: [{ zone: { equals: zone } }, { title: { equals: title } }] }, limit: 1, depth: 0, draft: true })
    if (ex.docs[0]) {
      await p.update({ collection: 'exhibits', id: ex.docs[0].id, data, draft: status === 'draft' })
      updated++
    } else {
      await p.create({ collection: 'exhibits', data, draft: status === 'draft' })
      created++
    }
  }

  for (const { s, rows } of data) {
    for (const [i, { r }] of rows.entries()) {
      const y = (v: string) => (v ? Number(v) : undefined)
      if (s.name === 'Lanh_dao')
        await upsertExhibit('lanh-dao', r.ten, { category: r.chucvu, yearStart: y(r.tu), yearEnd: y(r.den), subtitle: `${r.tu} – ${r.den || 'nay'}`, description: r.tieusu || undefined }, r.anh, r.thutu ? Number(r.thutu) : i)
      if (s.name === 'Can_bo')
        await upsertExhibit('can-bo', r.ten, { category: r.to, subtitle: r.chucdanh, staffStatus: STATUS_OF[r.tinhtrang], yearStart: y(r.tu), yearEnd: y(r.den), description: r.ghichu || undefined }, r.anh, i)
      if (s.name === 'Cuu_hoc_sinh')
        await upsertExhibit('cuu-hoc-sinh', r.ten, { subtitle: r.khoa, cohort: r.khoa, category: r.linhvuc, description: r.thanhtich || undefined }, r.anh, i)
      if (s.name === 'Khen_thuong')
        await upsertExhibit('bang-khen', r.ten, { awardKind: AWARD_OF[r.loai], awardedBy: r.cap, year: y(r.nam), description: r.noidung || undefined }, r.anh, i)
      if (s.name === 'Hoat_dong')
        await upsertExhibit(ZONE_OF_ACTIVITY[r.khu], r.ten, { year: y(r.nam), category: r.phanloai || undefined, peopleTags: r.nguoi ? r.nguoi.split(',').map((x) => x.trim()).filter(Boolean) : [], description: r.mota || undefined, pairKey: r.macap || undefined }, r.anh, i)
      if (s.name === 'Moc_lich_su') {
        const ex = await p.find({ collection: 'milestones', where: { date: { equals: r.thoidiem } }, limit: 1 })
        if (ex.docs[0]) await p.update({ collection: 'milestones', id: ex.docs[0].id, data: { text: r.sukien, order: i } })
        else await p.create({ collection: 'milestones', data: { date: r.thoidiem, text: r.sukien, order: i } })
      }
      if (s.name === 'Cau_do') {
        const options = [r.a, r.b, r.c, r.d].filter(Boolean)
        const ex = await p.find({ collection: 'quiz-questions', where: { question: { equals: r.cauhoi } }, limit: 1 })
        const d = { question: r.cauhoi, options, correctIndex: 'ABCD'.indexOf(r.dung), explanation: r.giaithich || undefined, order: i }
        if (ex.docs[0]) await p.update({ collection: 'quiz-questions', id: ex.docs[0].id, data: d })
        else await p.create({ collection: 'quiz-questions', data: d })
      }
    }
  }
  await p.create({ collection: 'audit-logs', data: { actorLabel: 'nhập Excel', action: 'excel-import', target: path.basename(file), docId: '', after: { created, updated, status } }, overrideAccess: true })
  console.log(`\nĐã nhập: ${created} mục mới, ${updated} mục cập nhật (trạng thái: ${status === 'draft' ? 'BẢN NHÁP — duyệt trong trang quản trị rồi xuất bản' : 'đã xuất bản'}).`)
  process.exit(0)
}

main().catch((e) => {
  console.error('\nLỖI:', e.message)
  process.exit(1)
})
