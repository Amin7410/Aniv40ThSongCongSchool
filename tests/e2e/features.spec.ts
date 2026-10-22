import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { auth, login, submit, type Session } from './helpers'

test.describe.configure({ mode: 'serial' })

let admin: Session

async function asStaff(page: Page, s: Session) {
  const url = test.info().project.use.baseURL!
  await page.context().addCookies([
    { name: 'payload-token', value: s.token, url },
    { name: 'mfa', value: s.proof, url },
  ])
}

test.beforeAll(async ({ request }) => {
  admin = await login(request)
})

test('Kiểm duyệt nhanh: phím tắt A duyệt, R từ chối, duyệt hàng loạt', async ({ page, request }) => {
  const tag = `KD${Date.now()}`
  const ids: number[] = []
  for (let i = 0; i < 4; i++) ids.push((await (await submit(request, { kind: 'guestbook', name: `${tag} người ${i}`, message: `Lời chúc kiểm duyệt ${tag} số ${i}` })).json()).id)
  await asStaff(page, admin)
  await page.goto('/quan-tri/kiem-duyet?kind=guestbook')
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Tìm theo tên, nội dung' }).fill(tag)
  await page.getByRole('button', { name: 'Tìm' }).click()
  await expect(page.getByRole('button', { name: new RegExp(`${tag} người 3`) })).toBeVisible()
  // chọn mục đầu tiên của lô thử, nhấn A
  await page.getByRole('button', { name: new RegExp(`${tag} người 0`) }).click()
  await page.keyboard.press('a')
  await expect(page.getByText('Đã duyệt 1 mục.')).toBeVisible()
  // mục 1: R (từ chối với lý do mặc định)
  await page.getByRole('button', { name: new RegExp(`${tag} người 1`) }).click()
  await page.keyboard.press('r')
  await expect(page.getByText('Đã từ chối 1 mục.')).toBeVisible()
  // mục 2, 3: chọn bằng ô tích rồi duyệt hàng loạt
  await page.getByRole('checkbox', { name: `Chọn mục của ${tag} người 2` }).check()
  await page.getByRole('checkbox', { name: `Chọn mục của ${tag} người 3` }).check()
  await page.getByRole('button', { name: 'Duyệt 2' }).click()
  await expect(page.getByText('Đã duyệt 2 mục.')).toBeVisible()
  const html = await (await request.get('/dai-le')).text()
  expect(html).toContain(`${tag} số 0`)
  expect(html).not.toContain(`${tag} số 1`)
  expect(html).toContain(`${tag} số 3`)
  const s1 = await (await request.get(`/api/submissions/${ids[1]}`, { headers: auth(admin) })).json()
  expect(s1.status).toBe('rejected')
  expect(s1.rejectReason).toBeTruthy()
})

test('Kiểm duyệt: kiểm duyệt viên không xác nhận được đóng góp quỹ; kế toán thì được', async ({ request }) => {
  const { id } = await (await submit(request, { kind: 'donation', name: 'Lớp thử', amount: '1500000' })).json()
  const mk = async (role: string) => {
    const email = `${role}${Date.now()}@thd.local`
    await request.post('/api/users', { headers: auth(admin), data: { email, password: 'Role-Password-2026!', name: role, role } })
    return login(request, email, 'Role-Password-2026!')
  }
  const mod = await mk('moderator')
  const r1 = await request.post('/api/staff/queue', { headers: auth(mod), data: { ids: [id], action: 'approve' } })
  expect((await r1.json()).ok).toBe(false)
  const acc = await mk('accountant')
  // kế toán chỉ thấy đóng góp
  const q = await (await request.get('/api/staff/queue?status=pending', { headers: auth(acc) })).json()
  expect(q.docs.every((d: { kind: string }) => d.kind === 'donation')).toBe(true)
  const r2 = await request.post('/api/staff/queue', { headers: auth(acc), data: { ids: [id], action: 'approve', confirmedAmount: 1500000 } })
  expect((await r2.json()).ok).toBe(true)
  // kế toán không xuất được CSV (chỉ quản trị trường)
  expect((await request.get('/api/staff/export?bo=dong-gop', { headers: auth(acc) })).status()).toBe(403)
})

test('Gỡ kỷ vật đã đăng → mục trưng bày ẩn khỏi trang; đăng lại → hiện lại, không tạo trùng', async ({ request }) => {
  const zones = (await (await request.get('/api/zones?limit=50')).json()).docs
  const mem = zones.find((z: { slug: string }) => z.slug === 'goc-ky-uc').id
  const t = `Kỷ vật gỡ thử ${Date.now()}`
  const { id } = await (await submit(request, { kind: 'memory', name: 'Người gửi', cohort: 'Khóa 2000 – 2003', title: t, type: 'Khác', message: 'Câu chuyện kỷ vật dùng để kiểm thử gỡ bài.' })).json()
  await request.post('/api/staff/queue', { headers: auth(admin), data: { ids: [id], action: 'approve', targetZone: mem, publishTitle: t } })
  expect(await (await request.get('/khu/goc-ky-uc')).text()).toContain(t)
  await request.post('/api/staff/queue', { headers: auth(admin), data: { ids: [id], action: 'hide' } })
  expect(await (await request.get('/khu/goc-ky-uc')).text()).not.toContain(t)
  await request.post('/api/staff/queue', { headers: auth(admin), data: { ids: [id], action: 'restore' } })
  await request.post('/api/staff/queue', { headers: auth(admin), data: { ids: [id], action: 'approve', targetZone: mem } })
  expect(await (await request.get('/khu/goc-ky-uc')).text()).toContain(t)
  const same = await (await request.get(`/api/exhibits?where[title][equals]=${encodeURIComponent(t)}&draft=true`, { headers: auth(admin) })).json()
  expect(same.totalDocs).toBe(1)
})

test('Bảng điều hành và xuất CSV (UTF-8 BOM, chống CSV injection, ghi nhật ký)', async ({ page, request }) => {
  const evil = `=HYPERLINK("http://evil","x") ${Date.now()}`
  const { id } = await (await submit(request, { kind: 'guestbook', name: 'Excel Thử', message: evil })).json()
  await request.post('/api/staff/queue', { headers: auth(admin), data: { ids: [id], action: 'approve' } })
  const st = await (await request.get('/api/staff/stats', { headers: auth(admin) })).json()
  expect(st.days).toHaveLength(14)
  expect(st.byKind.guestbook.approved).toBeGreaterThan(0)
  const r = await request.get('/api/staff/export?bo=loi-chuc', { headers: auth(admin) })
  expect(r.headers()['content-type']).toContain('text/csv')
  const buf = Buffer.from(await r.body())
  expect(buf.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(true)
  const txt = buf.toString('utf8')
  expect(txt).toContain(`"'=HYPERLINK(""http://evil"",""x"")`)
  expect(txt).toContain('Họ tên')
  const logs = await (await request.get('/api/audit-logs?where[action][equals]=export-csv&limit=1', { headers: auth(admin) })).json()
  expect(logs.totalDocs).toBeGreaterThan(0)
  await asStaff(page, admin)
  await page.goto('/quan-tri')
  await expect(page.getByText('Đang chờ duyệt')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lời chúc' }).first()).toBeVisible()
})

test('Khu nội bộ: khách và người chưa qua 2FA không vào được', async ({ page, request }) => {
  expect((await request.get('/api/staff/queue')).status()).toBe(401)
  expect((await request.get('/api/staff/stats')).status()).toBe(401)
  const r = await page.goto('/quan-tri/kiem-duyet')
  expect(page.url()).toMatch(/\/admin\/login/)
  expect(r?.ok()).toBeTruthy()
})

test('Hộp ký ức: bốc ngẫu nhiên, lọc thế hệ', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Bốc một ký ức', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Xem đầy đủ' })).toBeVisible()
  await page.getByRole('button', { name: '1986 – 1995' }).click()
  await page.getByRole('button', { name: 'Bốc một ký ức', exact: true }).click()
  await expect(page.getByText(/Xem đầy đủ|chưa có kỷ vật nào/)).toBeVisible()
})

test('Ngày ấy – Bây giờ: hiện khi khu Cơ sở vật chất có cặp ảnh cùng mã', async ({ page, request }) => {
  const zones = (await (await request.get('/api/zones?limit=50')).json()).docs
  const campus = zones.find((z: { slug: string }) => z.slug === 'co-so-vat-chat').id
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const key = `cap${Date.now()}`
  for (const [title, year] of [['Cổng trường xưa', 1990], ['Cổng trường nay', 2026]] as const) {
    const m = await request.post('/api/media', { headers: auth(admin), multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: png }, _payload: JSON.stringify({ alt: title }) } })
    expect(m.ok()).toBeTruthy()
    const mid = (await m.json()).doc.id
    await request.post('/api/exhibits', { headers: auth(admin), data: { zone: campus, title, year, pairKey: key, media: [mid], _status: 'published' } })
  }
  await page.goto('/khu/co-so-vat-chat')
  await expect(page.getByRole('heading', { name: 'Ngày ấy – Bây giờ' })).toBeVisible()
  const slider = page.getByRole('slider', { name: /Kéo để so sánh/ })
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('51')
})

test('Kỷ yếu: tải PDF → tự tách trang → lật trang trên trang công khai', async ({ page, request }) => {
  test.setTimeout(120_000)
  // Dựng PDF 5 trang bằng poppler/ghostscript nếu có, nếu không dùng PDF tối giản viết tay
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ybt-'))
  const pdfPath = path.join(dir, 'kyyeu.pdf')
  const pages = 5
  const objs: string[] = []
  const kids = Array.from({ length: pages }, (_, i) => `${4 + i * 2} 0 R`).join(' ')
  objs.push('<< /Type /Catalog /Pages 2 0 R >>')
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`)
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  for (let i = 0; i < pages; i++) {
    const content = `BT /F1 48 Tf 100 700 Td (Trang ${i + 1}) Tj ET`
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`)
    objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  }
  let pdf = '%PDF-1.4\n'
  const offs: number[] = []
  objs.forEach((o, i) => {
    offs.push(Buffer.byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  fs.writeFileSync(pdfPath, pdf)
  try {
    execFileSync('pdfinfo', [pdfPath])
  } catch {
    test.skip(true, 'máy kiểm thử thiếu poppler')
  }
  const m = await request.post('/api/media', { headers: auth(admin), multipart: { file: { name: 'kyyeu.pdf', mimeType: 'application/pdf', buffer: fs.readFileSync(pdfPath) }, _payload: JSON.stringify({ alt: 'Kỷ yếu thử' }) } })
  expect(m.ok()).toBeTruthy()
  const pdfId = (await m.json()).doc.id
  const yb = await request.post('/api/yearbooks', { headers: auth(admin), data: { title: `Kỷ yếu thử ${Date.now()}`, pdf: pdfId, published: true, order: -1 } })
  expect(yb.ok()).toBeTruthy()
  const ybId = (await yb.json()).doc.id
  await expect.poll(async () => (await (await request.get(`/api/yearbooks/${ybId}`, { headers: auth(admin) })).json()).state, { timeout: 60_000 }).toBe('ready')
  await page.goto('/ky-yeu')
  await expect(page.getByText('Bìa trước').first()).toBeVisible()
  await page.getByRole('button', { name: 'Trang sau ›' }).first().click()
  await expect(page.getByText(/^Trang 1(–2)?$/).first()).toBeVisible()
  // dọn để không ảnh hưởng lần chạy sau
  await request.patch(`/api/yearbooks/${ybId}`, { headers: auth(admin), data: { published: false } })
})
