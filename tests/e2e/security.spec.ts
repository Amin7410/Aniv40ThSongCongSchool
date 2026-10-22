import { expect, test } from '@playwright/test'
import { auth, login, nowStep, passwordLogin, totpAt } from './helpers'

test.describe.configure({ mode: 'serial' })

const PW = 'Mfa-Test-Password-2026!'

async function newStaff(request: import('@playwright/test').APIRequestContext, role = 'moderator') {
  const admin = await login(request)
  const email = `mfa${Date.now()}${Math.random().toString(36).slice(2, 6)}@thd.local`
  const r = await request.post('/api/users', { headers: auth(admin), data: { email, password: PW, name: 'Thử 2FA', role } })
  expect(r.ok()).toBeTruthy()
  return { admin, email, id: (await r.json()).doc.id }
}

test('2FA: chỉ có mật khẩu thì không làm được gì (API lẫn trang quản trị)', async ({ request, page }) => {
  const { email } = await newStaff(request)
  const token = await passwordLogin(request, email, PW)
  const h = { Authorization: `JWT ${token}` }
  expect((await request.get('/api/submissions', { headers: h })).status()).toBe(403)
  expect((await request.get('/api/audit-logs', { headers: h })).status()).toBe(403)
  // Proof giả / proof của phiên khác bị từ chối
  expect((await request.get('/api/submissions', { headers: { ...h, 'x-mfa': '9999999999.AAAA' } })).status()).toBe(403)
  // Trình duyệt: /admin chuyển sang /mfa
  await page.context().addCookies([{ name: 'payload-token', value: token, url: 'http://localhost:3000' }])
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/mfa\?next=%2Fadmin/)
  await expect(page.getByRole('button', { name: 'Bắt đầu đăng ký' })).toBeVisible()
})

test('2FA: đăng ký, mã khôi phục dùng một lần, chống dùng lại mã, giới hạn số lần thử', async ({ request }) => {
  const { email } = await newStaff(request)
  let token = await passwordLogin(request, email, PW)
  let h: Record<string, string> = { Authorization: `JWT ${token}` }
  const s = await (await request.post('/api/staff/mfa', { headers: h, data: { action: 'setup' } })).json()
  expect(s.qr).toMatch(/^data:image\/png/)
  expect((await request.post('/api/staff/mfa', { headers: h, data: { action: 'enable', code: '000000' } })).status()).toBe(400)
  const code = totpAt(s.secret, nowStep())
  const en = await (await request.post('/api/staff/mfa', { headers: h, data: { action: 'enable', code } })).json()
  expect(en.recoveryCodes).toHaveLength(8)
  expect((await request.get('/api/submissions', { headers: { ...h, 'x-mfa': en.proof } })).ok()).toBeTruthy()

  // Phiên mới: mã vừa dùng không được dùng lại (chống replay)
  token = await passwordLogin(request, email, PW)
  h = { Authorization: `JWT ${token}` }
  expect((await request.post('/api/staff/mfa', { headers: h, data: { action: 'verify', code } })).status()).toBe(400)
  // Proof của phiên cũ không dùng được cho phiên mới (gắn với sid)
  expect((await request.get('/api/submissions', { headers: { ...h, 'x-mfa': en.proof } })).status()).toBe(403)
  // Mã khôi phục: dùng được một lần
  const rc = en.recoveryCodes[0]
  const v = await request.post('/api/staff/mfa', { headers: h, data: { action: 'verify', recovery: rc.toUpperCase() } })
  expect(v.ok()).toBeTruthy()
  expect((await v.json()).recoveryLeft).toBe(7)
  const t3 = await passwordLogin(request, email, PW)
  expect((await request.post('/api/staff/mfa', { headers: { Authorization: `JWT ${t3}` }, data: { action: 'verify', recovery: rc } })).status()).toBe(400)
  // Dò mã: sau 5 lần sai / 10 phút → 429
  const codes: number[] = []
  for (let i = 0; i < 5; i++) codes.push((await request.post('/api/staff/mfa', { headers: { Authorization: `JWT ${t3}` }, data: { action: 'verify', code: '123456' } })).status())
  expect(codes).toContain(429)
  // Bí mật TOTP không bao giờ lộ qua API
  const admin = await login(request)
  const list = await (await request.get(`/api/users?where[email][equals]=${encodeURIComponent(email)}`, { headers: auth(admin) })).json()
  const u = list.docs[0]
  expect(u.totpEnabled).toBe(true)
  expect(u.totpSecretEnc).toBeUndefined()
  expect(u.recoveryHashes).toBeUndefined()
})

test('2FA: quản trị đặt lại 2FA cho người mất điện thoại; không tự đặt lại cho mình', async ({ request }) => {
  const { admin, email, id } = await newStaff(request)
  const tk = await passwordLogin(request, email, PW)
  const s = await (await request.post('/api/staff/mfa', { headers: { Authorization: `JWT ${tk}` }, data: { action: 'setup' } })).json()
  await request.post('/api/staff/mfa', { headers: { Authorization: `JWT ${tk}` }, data: { action: 'enable', code: totpAt(s.secret, nowStep()) } })
  const r = await request.patch(`/api/users/${id}`, { headers: auth(admin), data: { resetTotp: true } })
  expect(r.ok()).toBeTruthy()
  const t2 = await passwordLogin(request, email, PW)
  expect((await (await request.get('/api/staff/mfa', { headers: { Authorization: `JWT ${t2}` } })).json()).enrolled).toBe(false)
  const me = (await (await request.get('/api/users/me', { headers: auth(admin) })).json()).user
  expect((await request.patch(`/api/users/${me.id}`, { headers: auth(admin), data: { resetTotp: true } })).ok()).toBeFalsy()
  const logs = await (await request.get('/api/audit-logs?where[action][equals]=totp-reset&limit=1', { headers: auth(admin) })).json()
  expect(logs.totalDocs).toBeGreaterThan(0)
})

test('Nhật ký thao tác không sửa/xóa được qua API (kể cả Super Admin)', async ({ request }) => {
  const admin = await login(request)
  const log = (await (await request.get('/api/audit-logs?limit=1', { headers: auth(admin) })).json()).docs[0]
  expect((await request.patch(`/api/audit-logs/${log.id}`, { headers: auth(admin), data: { action: 'x' } })).ok()).toBeFalsy()
  expect((await request.delete(`/api/audit-logs/${log.id}`, { headers: auth(admin) })).ok()).toBeFalsy()
})

test('CSP có nonce, không unsafe-inline cho script; trang và trang quản trị không vi phạm CSP', async ({ page, request }) => {
  const violations: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text())
  })
  const r = await page.goto('/')
  const csp = r!.headers()['content-security-policy']
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/)
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  expect(csp).toContain("frame-ancestors 'none'")
  await page.goto('/dai-le')
  await page.waitForLoadState('networkidle')
  const admin = await login(request)
  await page.context().addCookies([
    { name: 'payload-token', value: admin.token, url: 'http://localhost:3000' },
    { name: 'mfa', value: admin.proof, url: 'http://localhost:3000' },
  ])
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/Khu trưng bày|Hàng chờ kiểm duyệt/).first()).toBeVisible()
  expect(violations, violations.join('\n')).toEqual([])
})

test('Trang /mfa không cho chuyển hướng ra ngoài (open redirect)', async ({ page }) => {
  await page.goto('/mfa?next=https://evil.example')
  // Chưa đăng nhập → chỉ hiện liên kết tới trang đăng nhập nội bộ
  await expect(page.getByRole('link', { name: 'Đăng nhập trang quản trị' })).toHaveAttribute('href', '/admin/login')
})

test('Health công khai không lộ chi tiết hạ tầng', async ({ request }) => {
  const j = await (await request.get('/api/health')).json()
  expect(j).toEqual({ ok: true })
})
