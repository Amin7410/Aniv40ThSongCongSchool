// Kịch bản tải ngày lễ (thiết kế mục 14.3). Chạy trên STAGING đã nâng cấu hình như production:
//   k6 run -e BASE=https://staging.example.edu.vn tests/load/event-day.js
// Ngưỡng đạt: lỗi < 0,5%, p95 động < 500 ms.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE || 'http://localhost:3000'

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      exec: 'browse',
      stages: [{ duration: '3m', target: 1500 }, { duration: '10m', target: 3000 }, { duration: '2m', target: 0 }],
    },
    spike_0730: { executor: 'ramping-vus', exec: 'browse', startTime: '16m', stages: [{ duration: '60s', target: 3000 }, { duration: '4m', target: 3000 }, { duration: '1m', target: 0 }] },
    reactions: { executor: 'constant-arrival-rate', exec: 'react', rate: 200, timeUnit: '1s', duration: '15m', preAllocatedVUs: 200 },
  },
  thresholds: {
    http_req_failed: ['rate<0.005'],
    'http_req_duration{kind:dynamic}': ['p(95)<500'],
  },
}

const PAGES = ['/', '/dai-le', '/dai-le', '/dai-le', '/khu/lanh-dao', '/khu/goc-ky-uc', '/khu/cuu-hoc-sinh']

export function browse() {
  const p = PAGES[Math.floor(Math.random() * PAGES.length)]
  const r = http.get(BASE + p, { tags: { kind: 'dynamic' } })
  check(r, { '200': (x) => x.status === 200 })
  http.get(BASE + '/api/public/fund', { tags: { kind: 'dynamic' } })
  sleep(2 + Math.random() * 6)
}

const RX = ['tim', 'vo-tay', 'hoa', 'co', 'cam-dong', 'chuc-mung']
export function react() {
  http.post(BASE + '/api/public/reactions', JSON.stringify({ k: RX[Math.floor(Math.random() * RX.length)] }), {
    headers: { 'content-type': 'application/json', origin: BASE },
    tags: { kind: 'dynamic' },
  })
}
// Kiểm thử 5.000 kết nối SSE giữ mở: dùng công cụ riêng (vd. `xk6-sse` hoặc script Node) — xem docs/RUNBOOK.md.
