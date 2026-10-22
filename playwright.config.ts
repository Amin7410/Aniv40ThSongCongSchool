import { defineConfig, devices } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const exe = process.env.PW_CHROMIUM_PATH // vd. /opt/pw-browsers/chromium trong môi trường CI tự dựng

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  workers: 1, // các kịch bản dùng chung CSDL kiểm thử
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE,
    // Giả lập Nginx: gắn header chứng thực proxy để ứng dụng tin X-Real-IP của từng kịch bản
    extraHTTPHeaders: { origin: BASE, ...(process.env.E2E_PROXY_SECRET ? { 'x-proxy-auth': process.env.E2E_PROXY_SECRET } : {}) },
    launchOptions: exe ? { executablePath: exe } : undefined,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /ui\..*\.spec\.ts/ },
  ],
})
