import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { ADMIN, auth, login, pow, randomIp, submit, type Session } from './helpers'

test.describe.configure({ mode: 'serial' })

let admin: Session
let zoneId = 0
let memZoneId = 0

test.beforeAll(async ({ request }) => {
  admin = await login(request)
  const z = await (await request.get('/api/zones?limit=50', { headers: auth(admin) })).json()
  zoneId = z.docs.find((d: { slug: string }) => d.slug === 'lanh-dao').id
  memZoneId = z.docs.find((d: { slug: string }) => d.slug === 'goc-ky-uc').id
  await request.post('/api/globals/event-settings', { headers: auth(admin), data: { submissionsOpen: true } })
})

test('E2E-03 lời chúc: chờ duyệt → duyệt → hiển thị công khai', async ({ request }) => {
  const msg = `Chúc mừng 40 năm ${Date.now()}`
  const r = await submit(request, { kind: 'guestbook', name: 'Nguyễn Kiểm Thử', cohort: 'Khóa 2000 – 2003', message: msg })
  expect(r.status()).toBe(202)
  const { id, token } = await r.json()
  expect(token).toBeTruthy()
  expect(await (await request.get('/dai-le')).text()).not.toContain(msg)
  // Khách không đọc được hàng chờ
  expect((await request.get(`/api/submissions/${id}`)).status()).toBe(403)
  const p = await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved' } })
  expect(p.ok()).toBeTruthy()
  expect(await (await request.get('/dai-le')).text()).toContain(msg)
})

test('E2E-05 nội dung chứa mã độc được hiển thị nguyên văn, không thực thi', async ({ request, page }) => {
  const mark = `M${Date.now()}`
  const evil = `<img src=x onerror="window.__xss=1"> " onerror="window.__xss=2 <script>window.__xss=3</script> ${mark}`
  const r = await submit(request, { kind: 'guestbook', name: `<b onmouseover=alert(1)>X</b>`, message: evil })
  const { id } = await r.json()
  await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved' } })
  let dialog = false
  page.on('dialog', async (d) => {
    dialog = true
    await d.dismiss()
  })
  await page.goto('/dai-le')
  await expect(page.getByText(`<script>window.__xss=3</script> ${mark}`, { exact: false })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  // Giao diện quản trị (hàng chờ) cũng không thực thi
  await page.context().addCookies([
    { name: 'payload-token', value: admin.token, url: page.url() },
    { name: 'mfa', value: admin.proof, url: page.url() },
  ])
  await page.goto(`/admin/collections/submissions/${id}`)
  await page.waitForLoadState('networkidle')
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  expect(dialog).toBe(false)
})

test('E2E-06 vượt giới hạn tần suất → 429', async ({ request }) => {
  const ip = randomIp()
  const codes: number[] = []
  for (let i = 0; i < 6; i++) codes.push((await submit(request, { kind: 'guestbook', name: 'Spam Thử', message: `Tin số ${i} ${Date.now()}` }, { ip })).status())
  expect(codes.slice(0, 5).every((c) => c === 202)).toBeTruthy()
  expect(codes[5]).toBe(429)
})

test('E2E-07 thiếu hoặc dùng lại lời giải PoW → 400', async ({ request }) => {
  const r = await request.post('/api/public/submissions', { multipart: { kind: 'guestbook', name: 'Bot', message: 'xin chào bạn', consent: 'true' }, headers: { 'x-real-ip': randomIp() } })
  expect(r.status()).toBe(400)
  const sol = await pow(request)
  const a = await request.post('/api/public/submissions', { multipart: { kind: 'guestbook', name: 'Người A', message: 'xin chào trường', consent: 'true', pow: sol }, headers: { 'x-real-ip': randomIp() } })
  expect(a.status()).toBe(202)
  const b = await request.post('/api/public/submissions', { multipart: { kind: 'guestbook', name: 'Người A', message: 'xin chào trường', consent: 'true', pow: sol }, headers: { 'x-real-ip': randomIp() } })
  expect(b.status()).toBe(400)
})

test('POST từ trang khác (sai Origin) bị chặn', async ({ request }) => {
  const r = await request.post('/api/public/submissions', { multipart: { kind: 'guestbook' }, headers: { origin: 'https://evil.example' } })
  expect(r.status()).toBe(403)
})

test('E2E-04 kỷ vật kèm ảnh: xóa EXIF, tệp chờ duyệt không công khai, duyệt → vào Góc ký ức', async ({ request, playwright }) => {
  const img = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#a33' } })
    .withExif({ IFD0: { Artist: 'SECRET-ARTIST', Copyright: 'GPS-SECRET' } })
    .jpeg()
    .toBuffer()
  expect(img.includes(Buffer.from('SECRET-ARTIST'))).toBeTruthy()
  const title = `Lưu bút E2E ${Date.now()}`
  const r = await submit(request, { kind: 'memory', name: 'Trần Thu Hà', cohort: 'Khóa 2005 – 2008', title, type: 'Lưu bút, thư từ', year: '2008', message: 'Cuốn lưu bút có chữ ký của cả lớp 12A.' }, { files: [{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: img }] })
  expect(r.status()).toBe(202)
  const { id } = await r.json()
  const sub = await (await request.get(`/api/submissions/${id}?depth=1`, { headers: auth(admin) })).json()
  const file = sub.files[0]
  const raw = Buffer.from(await (await request.get(file.url, { headers: auth(admin) })).body())
  expect(raw.includes(Buffer.from('SECRET-ARTIST'))).toBeFalsy()
  // Khách không tải được tệp chờ duyệt
  const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL })
  expect((await anon.get(file.url)).status()).toBe(403)
  // Duyệt mà chưa chọn khu → lỗi; chọn khu → tạo mục trưng bày
  expect((await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved' } })).ok()).toBeFalsy()
  const ok = await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved', targetZone: memZoneId } })
  expect(ok.ok()).toBeTruthy()
  const html = await (await anon.get('/khu/goc-ky-uc')).text()
  expect(html).toContain(title)
  const doc = (await ok.json()).doc
  const exId = typeof doc.publishedAs === 'object' ? doc.publishedAs.id : doc.publishedAs
  const ex = await (await anon.get(`/api/exhibits/${exId}?depth=1`)).json()
  const pub = Buffer.from(await (await anon.get(ex.media[0].url)).body())
  expect(pub.includes(Buffer.from('SECRET-ARTIST'))).toBeFalsy()
  await anon.dispose()
})

test('E2E-08 biên tập viên khu Đoàn không sửa được khu Lãnh đạo (UI lẫn API)', async ({ request }) => {
  const z = await (await request.get('/api/zones?limit=50', { headers: auth(admin) })).json()
  const doan = z.docs.find((d: { slug: string }) => d.slug === 'doan').id
  const email = `editor${Date.now()}@thd.local`
  await request.post('/api/users', { headers: auth(admin), data: { email, password: 'Editor-Password-2026!', name: 'BTV Đoàn', role: 'editor', zones: [doan] } })
  const ed = await login(request, email, 'Editor-Password-2026!')
  const mine = await request.post('/api/exhibits', { headers: auth(ed), data: { zone: doan, title: 'Hội trại 26/3', _status: 'published' } })
  expect(mine.ok()).toBeTruthy()
  const other = await request.post('/api/exhibits', { headers: auth(ed), data: { zone: zoneId, title: 'Không được phép' } })
  expect(other.status()).toBe(403)
  const leader = (await (await request.get(`/api/exhibits?where[zone][equals]=${zoneId}&limit=1`)).json()).docs[0]
  const upd = await request.patch(`/api/exhibits/${leader.id}`, { headers: auth(ed), data: { title: 'Bị sửa' } })
  expect(upd.ok()).toBeFalsy()
  // Tự nâng quyền cũng bị chặn
  const me = (await (await request.get('/api/users/me', { headers: auth(ed) })).json()).user
  expect((await request.patch(`/api/users/${me.id}`, { headers: auth(ed), data: { role: 'super' } })).ok()).toBeFalsy()
})

test('E2E-09 đổi tài khoản quỹ cần người thứ hai phê duyệt', async ({ request }) => {
  const direct = await request.post('/api/globals/fund-settings', { headers: auth(admin), data: { accountNo: '999999999' } })
  expect(direct.ok()).toBeFalsy()
  const acct = String(Date.now()).slice(-10)
  const prop = await request.post('/api/globals/fund-settings', { headers: auth(admin), data: { proposal: { bankBin: '970415', bankName: 'VietinBank', accountNo: acct, accountName: 'TRUONG THPT SONG CONG' } } })
  expect(prop.ok()).toBeTruthy()
  expect((await (await request.get('/api/public/fund')).json()).bank?.accountNo).not.toBe(acct)
  const self = await request.post('/api/globals/fund-settings', { headers: auth(admin), data: { approveProposal: true } })
  expect(self.ok()).toBeFalsy()
  const email = `bgh${Date.now()}@thd.local`
  await request.post('/api/users', { headers: auth(admin), data: { email, password: 'School-Password-2026!', name: 'Hiệu trưởng', role: 'school_admin' } })
  const second = await login(request, email, 'School-Password-2026!')
  const ok = await request.post('/api/globals/fund-settings', { headers: auth(second), data: { approveProposal: true } })
  expect(ok.ok()).toBeTruthy()
  const pub = await (await request.get('/api/public/fund')).json()
  expect(pub.bank.accountNo).toBe(acct)
  expect(pub.qr).toMatch(/^data:image\/png;base64,/)
  const logs = await (await request.get('/api/audit-logs?where[action][like]=fund-account&limit=5', { headers: auth(admin) })).json()
  expect(logs.totalDocs).toBeGreaterThanOrEqual(2)
})

test('E2E-10 báo đóng góp → kế toán xác nhận → tổng quỹ tăng', async ({ request }) => {
  const before = (await (await request.get('/api/public/fund')).json()).raised
  const r = await submit(request, { kind: 'donation', name: 'Lớp 12A3', amount: '2500000', message: 'Chuyển lúc 9:00' })
  const { id } = await r.json()
  expect((await (await request.get('/api/public/fund')).json()).raised).toBe(before)
  await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved', confirmedAmount: 2000000 } })
  expect((await (await request.get('/api/public/fund')).json()).raised).toBe(before + 2000000)
})

test('E2E-13 thắp nến hai lần trên một trình duyệt chỉ tính một', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL, extraHTTPHeaders: { origin: test.info().project.use.baseURL!, 'x-real-ip': randomIp() } })
  const a = await (await ctx.post('/api/public/candles')).json()
  const b = await (await ctx.post('/api/public/candles')).json()
  expect(b.total).toBe(a.total)
  expect((await (await ctx.get('/api/public/candles')).json()).lit).toBe(true)
  await ctx.dispose()
})

test('E2E-14 ghim bản đồ chỉ hiện sau khi duyệt', async ({ request }) => {
  const name = `Cựu HS Ghim ${Date.now()}`
  const r = await submit(request, { kind: 'pin', name, cohort: 'Khóa 1995 – 1998', cityCode: 'tokyo', workplace: 'Kỹ sư' })
  const { id } = await r.json()
  expect(await (await request.get('/ban-do')).text()).not.toContain(name)
  await request.patch(`/api/submissions/${id}`, { headers: auth(admin), data: { status: 'approved' } })
  expect(await (await request.get('/ban-do')).text()).toContain(name)
  expect((await submit(request, { kind: 'pin', name: 'X Y', cityCode: 'khong-ton-tai' })).status()).toBe(422)
})

test('E2E-16 người gửi xem trạng thái, tự rút bài; token sai → 404', async ({ request }) => {
  const { token } = await (await submit(request, { kind: 'guestbook', name: 'Người Rút Bài', message: 'Tôi sẽ rút lại lời chúc này' })).json()
  expect((await (await request.get(`/api/public/submissions?token=${token}`)).json()).status).toBe('pending')
  expect((await request.delete(`/api/public/submissions?token=${token}`)).ok()).toBeTruthy()
  expect((await (await request.get(`/api/public/submissions?token=${token}`)).json()).status).toBe('hidden')
  expect((await request.get(`/api/public/submissions?token=${'x'.repeat(32)}`)).status()).toBe(404)
})

test('Kiểm tra dữ liệu: thiếu đồng ý, ảnh giả mạo, trường sai', async ({ request }) => {
  const noConsent = await submit(request, { kind: 'guestbook', name: 'Ai Đó', message: 'xin chào', consent: 'false' })
  expect(noConsent.status()).toBe(422)
  const fake = await submit(request, { kind: 'photo', name: 'Ai Đó', message: 'ảnh đẹp' }, { files: [{ name: 'x.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('<?php echo 1; ?>') }] })
  expect(fake.status()).toBe(415)
})

test('Gắn cờ từ ngữ theo nguyên từ (không báo nhầm "ngủ", "ngũ")', async ({ request }) => {
  const a = await (await submit(request, { kind: 'guestbook', name: 'Khách', message: 'Trường này dở ẹc, toàn lừa đảo' })).json()
  const b = await (await submit(request, { kind: 'guestbook', name: 'Khách', message: 'Nhớ giấc ngủ trưa và đội ngũ thầy cô' })).json()
  const da = await (await request.get(`/api/submissions/${a.id}`, { headers: auth(admin) })).json()
  const db = await (await request.get(`/api/submissions/${b.id}`, { headers: auth(admin) })).json()
  expect(da.flags).toEqual(expect.arrayContaining(['lua dao', 'do ec']))
  expect(db.flags).toEqual([])
})

test('E2E-18 tắt nhận nội dung → 423', async ({ request }) => {
  await request.post('/api/globals/event-settings', { headers: auth(admin), data: { submissionsOpen: false } })
  const r = await submit(request, { kind: 'guestbook', name: 'Khách', message: 'Lời chúc khi đóng' })
  expect(r.status()).toBe(423)
  await request.post('/api/globals/event-settings', { headers: auth(admin), data: { submissionsOpen: true } })
})

test('Khách không xem được bản nháp và nhật ký', async ({ request, playwright }) => {
  const draft = await request.post('/api/exhibits', { headers: auth(admin), data: { zone: zoneId, title: `Bản nháp ${Date.now()}`, _status: 'draft' } })
  const id = (await draft.json()).doc.id
  const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL })
  expect((await anon.get(`/api/exhibits/${id}`)).ok()).toBeFalsy()
  expect((await anon.get(`/khu/lanh-dao/${id}`)).status()).toBe(404)
  expect((await anon.get('/api/audit-logs')).status()).toBe(403)
  expect((await anon.get('/api/users')).status()).toBe(403)
  await anon.dispose()
  expect(ADMIN.email).toBeTruthy()
})
