# BossS – Phòng truyền thống trực tuyến Trường THPT Sông Công (1986 – 2026)

Website trưng bày và cổng sự kiện Đại lễ 40 năm. Thiết kế: [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md). Tiến độ: [`docs/PROGRESS.md`](docs/PROGRESS.md). Vận hành: [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

**Stack:** Next.js 16 + Payload CMS 3.91 (chung một ứng dụng) · PostgreSQL 16 · Redis 7 · Nginx · Docker Compose.

## Chạy trên máy dev

Yêu cầu: Node 22+, pnpm 10, Docker (hoặc Postgres 16 + Redis 7 cài sẵn).

```bash
docker compose -f infra/docker-compose.dev.yml up -d   # Postgres + Redis
cp .env.example .env                                   # sửa DATABASE_URL=postgres://postgres@localhost:5432/bosss, REDIS_URL=redis://localhost:6379
pnpm install
SEED_ADMIN_EMAIL=ban@thd.vn SEED_ADMIN_PASSWORD='mat-khau-dai-12+' pnpm seed --demo
pnpm dev                                               # http://localhost:3000 · quản trị: /admin
```

`pnpm seed` tạo 8 khu trưng bày, danh mục 50 thành phố và Super Admin đầu tiên. `--demo` thêm dữ liệu **minh họa** (tên có hậu tố "(minh họa)") — không bao giờ chạy trên production.

## Kiểm thử

```bash
pnpm lint && pnpm typecheck
pnpm test                      # unit (Vitest): lọc từ ngữ, VietQR, trạng thái phát, chống nhúng URL lạ
pnpm build && pnpm start &     # E2E chạy trên bản build thật
pnpm test:e2e                  # Playwright: 21 kịch bản API + UI (desktop) và UI trên mobile
```

E2E dùng tài khoản `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (mặc định trùng giá trị seed trong CI).

## Cấu trúc

```
src/app/(site)/        Trang công khai: gian trung tâm, 8 khu, chi tiết, Đại lễ, gửi kỷ vật, bản đồ, câu đố, chính sách
src/app/(payload)/     Trang quản trị Payload (/admin) và REST API (/api/*)
src/app/api/public/    API cho khách: gửi nội dung (PoW + rate limit), nến, cảm xúc, SSE, quỹ
src/collections/       Mô hình dữ liệu + phân quyền ở server (khu, mục trưng bày, hàng chờ kiểm duyệt, nhật ký…)
src/globals/           Cấu hình chung, Đại lễ & công tắc khẩn, Quỹ (đổi tài khoản cần 2 người)
src/lib/               Chống spam (pow, ratelimit), làm sạch ảnh, VietQR, realtime hub, lọc từ ngữ
src/migrations/        Migration CSDL (production không dùng auto-push)
infra/                 docker-compose.prod.yml, Nginx (cache, rate limit, CSP, trang dự phòng), sao lưu
tests/                 unit/, e2e/, load/ (k6)
```

## Triển khai

Xem [`docs/RUNBOOK.md`](docs/RUNBOOK.md). Tóm tắt: CI build 2 image (`bosss-web`, `bosss-tools`) lên GHCR → workflow **Deploy** (chọn staging/production, production cần người duyệt) chạy migration rồi thay từng replica.
