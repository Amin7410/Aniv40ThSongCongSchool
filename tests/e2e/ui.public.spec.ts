import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('E2E-01 tham quan: trang chủ → khu → chi tiết → Back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Đảng Cộng sản Việt Nam/i })).toBeVisible()
  await expect(page.getByText('Hình thành và phát triển').first()).toBeVisible()
  await page.getByRole('navigation', { name: 'Các khu trưng bày' }).getByRole('link', { name: 'Lãnh đạo' }).click()
  await expect(page).toHaveURL(/\/khu\/lanh-dao$/)
  await page.locator('.lcard').first().click()
  const dlg = page.getByRole('dialog')
  await expect(dlg.getByRole('heading', { level: 2 }).first()).toBeVisible()
  await expect(page).toHaveURL(/#m-\d+$/)
  const id = /#m-(\d+)$/.exec(page.url())![1]
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  // Liên kết sâu tới từng mục vẫn hoạt động
  await page.goto(`/khu/lanh-dao/${id}`)
  await expect(page.locator('.mv h2')).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/khu\/lanh-dao/)
})

test('E2E-02 tìm kiếm không dấu', async ({ page }) => {
  await page.goto('/khu/can-bo')
  const first = (await page.locator('.pcard b').first().textContent())!
  const plain = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  await page.getByPlaceholder(/Tìm theo tên/).fill(plain)
  await expect(page.locator('.pcard')).toHaveCount(1)
  await expect(page.locator('.pcard').first()).toContainText(first)
})

test('Gửi lời chúc qua giao diện (PoW chạy trong trình duyệt)', async ({ page, request }) => {
  await page.goto('/dai-le')
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Gửi lời chúc' }) })
  await form.getByLabel('Họ và tên').fill('Phạm Văn Long')
  await form.getByLabel('Lời chúc').fill('Chúc mừng 40 năm thành lập trường!')
  await form.getByRole('button', { name: 'Gửi lời chúc' }).click()
  await expect(form.getByText('Bạn cần đồng ý')).toBeVisible()
  await form.getByRole('checkbox').check()
  await form.getByRole('button', { name: 'Gửi lời chúc' }).click()
  await expect(form.getByText('sẽ hiển thị sau khi được duyệt')).toBeVisible({ timeout: 30_000 })
  await form.getByRole('link', { name: 'Xem trạng thái bài gửi' }).click()
  await expect(page.getByText('Chờ duyệt').first()).toBeVisible()
  expect(await login(request)).toBeTruthy()
})

test('Trang Đại lễ: đếm ngược, nến, quỹ có cảnh báo chống lừa đảo', async ({ page }) => {
  await page.goto('/dai-le')
  await expect(page.getByText('ngọn nến đã được thắp')).toBeVisible()
  await expect(page.getByText(/Nhà trường không bao giờ nhắn tin yêu cầu chuyển tiền/)).toBeVisible()
})

test('Trang chính sách và 404', async ({ page }) => {
  await page.goto('/trang/chinh-sach-rieng-tu')
  await expect(page.getByRole('heading', { name: 'Chính sách quyền riêng tư' })).toBeVisible()
  const r = await page.goto('/khu/khong-ton-tai')
  expect(r?.status()).toBe(404)
})
