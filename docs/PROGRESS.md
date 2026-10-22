# Tiến độ triển khai so với thiết kế

Cập nhật: 19/10/2026 (Sprint 1, ngày 1 — gia cố bảo mật + hoàn thiện tính năng không phụ thuộc bên ngoài). Trạng thái: ✅ xong và có kiểm thử · 🟡 làm một phần · ⬜ chưa làm.

## Đã kiểm chứng

- `pnpm lint`, `pnpm typecheck`: sạch.
- Unit test: 27/27 đạt (thêm vector chuẩn RFC 6238/4226, mã hóa bí mật, bằng chứng 2FA, IP tin cậy).
- E2E Playwright: 41/41 đạt (36 desktop + 5 UI trên Pixel 7), chạy 2 lần liên tiếp ổn định, trên bản build production, Postgres 16, Redis 7.
- Migration khởi tạo chạy được trên CSDL trống (`NODE_ENV=production pnpm migrate`).
- SSE: 800 kết nối đồng thời trên 1 tiến trình, cả 800 nhận gói cảm xúc gộp và số người xem đúng.
- Nginx: cấu hình hợp lệ; micro-cache HIT; header bảo mật có ở mọi location; trang dự phòng tĩnh bật/tắt bằng tệp `ON`; SSE không bị đệm.

## Chức năng (mục 3 thiết kế)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| F-01 Gian trung tâm | ✅ | Ảnh scan Quyết định, dòng thời gian từ CMS |
| F-02 8 khu, lọc, tìm không dấu | ✅ | E2E-01, E2E-02. Tìm kiếm lọc ở ứng dụng; chuyển `unaccent`/`pg_trgm` khi > vài nghìn mục |
| F-03 Ngày ấy – Bây giờ | ✅ | Tự ghép 2 ảnh cùng mã cặp; kéo bằng chuột, cảm ứng, phím mũi tên |
| F-04 Khen thưởng | ✅ | Biểu tượng theo loại hiện vật khi chưa có ảnh |
| F-05 Góc ký ức theo thế hệ | ✅ | Tự gán thế hệ theo năm/khóa |
| F-06 Hộp ký ức ngẫu nhiên | ✅ | Lọc theo thế hệ, tránh lặp mục vừa xem |
| F-07 Gửi kỷ vật/ảnh | ✅ | E2E-04: xóa EXIF/GPS, tệp chờ duyệt không công khai, duyệt → tạo mục trưng bày |
| F-08 Sổ lời chúc | ✅ | E2E-03, E2E-05 (XSS) |
| F-09 Lời tri ân bằng chữ | ✅ | Trên thẻ Lãnh đạo, CBGV |
| F-10 Thắp nến | ✅ | E2E-13 |
| F-11 Bản đồ (duyệt trước) | ✅ | E2E-14. Bản đồ chấm điểm, không vẽ biên giới, ghi chú QĐ Hoàng Sa, Trường Sa (Việt Nam) |
| F-12 Quỹ + VietQR | ✅ | E2E-09, E2E-10; CRC VietQR kiểm bằng vector chuẩn |
| F-13 Đếm ngược, trạng thái phát | ✅ | Unit test `liveState` |
| F-14 Nhúng livestream | ✅ | Chỉ YouTube (nocookie) / Facebook, kiểm hostname |
| F-15 Cảm xúc + người xem (SSE) | ✅ | Gộp theo giây qua Redis pub/sub; quá tải → `busy` |
| F-16 Câu đố | ✅ | |
| F-17 Kỷ yếu lật trang | ✅ | Tải PDF → tự tách trang (poppler) → lật 2 trang trên máy tính, 1 trang trên điện thoại, vuốt/phím |
| F-18 Nhạc nền | ✅ | Nút nổi, không tự phát |
| F-19 Chia sẻ, OG | 🟡 | Metadata/OG cơ bản; chưa có ảnh OG tự sinh |
| F-20 Chữ lớn | ✅ | |
| F-21 Chính sách, điều khoản, liên hệ | 🟡 | Văn bản mẫu — **pháp chế và nhà trường phải rà soát** |
| A-01 Đăng nhập, khóa sau 5 lần sai, 2FA | ✅ | 2FA TOTP bắt buộc mọi tài khoản, thực thi ở tầng phân quyền máy chủ (kể cả REST API); 8 mã khôi phục; chống dùng lại mã; 5 lần thử/10 phút; quản trị đặt lại 2FA cho người khác |
| A-02 CRUD 8 khu, nháp/xuất bản | ✅ | |
| A-03 Thư viện media | ✅ | Nén WebP, 3 kích thước, bỏ metadata |
| A-04/A-05 Hàng chờ kiểm duyệt, đưa vào khu | ✅ | Màn hình `/quan-tri/kiem-duyet`: phím tắt, duyệt hàng loạt, tìm kiếm, xem ảnh lớn, tự làm mới 20 giây; gỡ/đăng lại đồng bộ mục trưng bày |
| A-06 Cấu hình Đại lễ | ✅ | |
| A-07 Quỹ 2 người duyệt | ✅ | Ghi nhật ký + email cảnh báo tới mọi quản trị (đã nối; chờ thông tin SMTP — chưa có thì ghi log) |
| A-08 Người dùng, vai trò, khu | ✅ | E2E-08 (kể cả tự nâng quyền) |
| A-09 Nhật ký thao tác | ✅ | Bất biến ở cả tầng ứng dụng và Postgres (trigger chặn UPDATE/DELETE/TRUNCATE). Ghi cả đăng nhập, 2FA, dọn dữ liệu |
| A-10 Bảng tổng quan | ✅ | `/quan-tri`: chờ duyệt (cảnh báo > 2 giờ), nến, quỹ, 14 ngày gần nhất |
| A-11 Xuất CSV | ✅ | 4 bộ dữ liệu; UTF-8 BOM cho Excel; chống CSV injection; ghi nhật ký |
| A-12 Công tắc khẩn | ✅ | `submissionsOpen` (E2E-18), `staticFallback`, trang tĩnh Nginx |

## Khác với thiết kế (cần ghi nhận)

| Thiết kế | Thực tế | Lý do |
|---|---|---|
| Next.js 15 | **Next.js 16.4** | Payload 3.91 hỗ trợ Next 15.4.x hoặc 16.3+; chọn bản 16 ổn định mới nhất |
| Thư viện ALTCHA | **PoW tự viết cùng cơ chế** (`src/lib/pow.ts`, khoảng 60 dòng) | API altcha-lib v2 mới đổi; tự viết dễ kiểm soát, không thêm phụ thuộc. Mỗi lời giải chỉ dùng 1 lần (Redis NX) |
| Media trên S3 | **Volume cục bộ** (`/data/media`, `/data/quarantine`) | Chưa chốt nhà cung cấp (D2). Thêm `@payloadcms/storage-s3` khi có thông tin |
| Worker BullMQ | **Chưa cần** | Xử lý ảnh nhanh, chạy ngay trong request. Sẽ thêm khi làm kỷ yếu PDF và email |
| Font tự host | Gói `@fontsource` (tập con tiếng Việt) | Không gọi Google Fonts lúc chạy lẫn lúc build |

## Đợt gia cố bảo mật 19/10 (không phụ thuộc bên liên quan)

| Hạng mục | Kết quả | Kiểm chứng |
|---|---|---|
| 2FA TOTP bắt buộc | ✅ | E2E: chỉ mật khẩu → 403 mọi API nghiệp vụ, `/admin` chuyển `/mfa`; đăng ký, replay, mã khôi phục, giới hạn thử, đặt lại |
| Chỉ tin `X-Real-IP` khi đi qua Nginx (`X-Proxy-Auth`) | ✅ | Unit test; gọi thẳng cổng ứng dụng → dồn chung một bucket giới hạn |
| Danh sách IP vào `/admin`, `/mfa`, API quản trị | ✅ (cơ chế) | `infra/nginx/admin-allow.conf` — mặc định mở; **điền IP/WireGuard khi có** |
| CSP nonce + `strict-dynamic`, bỏ `'unsafe-inline'` cho script | ✅ | E2E: không vi phạm CSP trên trang công khai và trang quản trị |
| Tắt Gravatar trong trang quản trị | ✅ | Phát hiện nhờ CSP: Payload gửi băm email quản trị tới gravatar.com |
| Nhật ký bất biến ở Postgres | ✅ | Thử UPDATE/DELETE/TRUNCATE CASCADE đều bị chặn |
| Job dọn dữ liệu theo Chính sách quyền riêng tư | ✅ | Chạy trên dữ liệu lùi ngày: xóa IP băm >90 ngày, tệp chờ duyệt >30 ngày, bài từ chối/rút >180 ngày |
| `/api/health` không lộ chi tiết | ✅ | Chi tiết chỉ khi có `X-Health-Token` |
| Email cảnh báo đổi tài khoản quỹ | ✅ (cơ chế) | Chờ SMTP |
| Phụ thuộc | ✅ | Nâng `sharp` 0.35.5 (vá CVE libvips/libheif — quan trọng vì xử lý ảnh người lạ gửi); ép `dompurify` ≥ 3.4.16; Dependabot; CI chặn lỗ hổng critical |

**Rủi ro phụ thuộc còn lại, chấp nhận có lý do:** `esbuild` (moderate, qua `drizzle-kit` — công cụ migration, không chạy trong runtime phục vụ người dùng) và `braces` (high DoS, qua `sass`/`chokidar` — chỉ dùng lúc build, chưa có bản vá).

## Đợt tính năng 19/10 (không phụ thuộc bên liên quan)

- Màn hình kiểm duyệt nhanh, bảng điều hành, xuất CSV (mục A-04, A-10, A-11).
- Hộp ký ức, Ngày ấy – Bây giờ, kỷ yếu lật trang, nhạc nền (F-03, F-06, F-17, F-18).
- **Mẫu Excel thu thập tư liệu** (`docs/Mau_thu_thap_tu_lieu.xlsx`) + **công cụ nhập** có chạy thử, báo lỗi từng dòng, nhập lại an toàn → gỡ nút thắt tư liệu.
- **Hướng dẫn sử dụng cho cán bộ trường** (`docs/HUONG_DAN_QUAN_TRI.md`).
- Giám sát Uptime Kuma trong docker-compose (chỉ mở localhost).
- Sửa lỗi phát hiện khi kiểm thử: tách kỷ yếu chạy trước khi transaction lưu xong (race) → chờ commit.

## Việc tiếp theo (Sprint 1 còn lại → S2)

1. **Cần từ bên liên quan:** SMTP, VPS + tên miền (staging), IP văn phòng/WireGuard cho `admin-allow.conf`, nhà cung cấp S3.
2. View kiểm duyệt tùy biến: phím tắt, thao tác hàng loạt, ảnh xem trước.
3. Storage S3 khi chốt nhà cung cấp; job đồng bộ sao lưu ra ngoài.
6. Hộp ký ức ngẫu nhiên, thanh trượt Ngày ấy – Bây giờ, kỷ yếu, nhạc nền.
7. Staging VPS + domain tạm; chạy workflow Deploy lần đầu.

## 19/10/2026 — Giao diện giống hệt prototype
- Port nguyên CSS, hình vẽ canvas, SVG (sen, cờ, tượng Bác, hoa) của prototype; header/tab/footer/trình phát nhạc như bản gốc.
- Trang chủ: gian trung tâm (băng rôn, 2 tấm bảng, bàn thờ), dải đếm ngược, Hộp ký ức + thẻ chiến dịch, 3 nút hoạt động, 7 tủ trưng bày, Góc ký ức nổi bật, Hướng về đại lễ.
- 7 khu: dòng thời gian Hiệu trưởng + lưới Phó HT (đếm lời tri ân), CBGV (lọc tình trạng/tổ/thời kỳ), Cựu học sinh + bản đồ toàn cầu (Hoàng Sa, Trường Sa), tủ kính khen thưởng + bằng khen, album lọc thập niên/người trong ảnh, Ngày ấy – Bây giờ + mốc xây dựng, Góc ký ức theo thế hệ. Xem chi tiết trong hộp thoại có Trước/Sau, liên kết sâu `#m-<id>` và `/khu/<khu>/<id>`.
- Trang Đại lễ: xem trực tiếp, sổ lời chúc, thắp nến, quỹ (VietQR), chiến dịch, minigame 8 câu. Kỷ yếu lật trang kiểu sách. `/ban-do` chuyển về khu Cựu học sinh.
- Dữ liệu minh họa (`pnpm seed --demo`) lấy nguyên từ prototype (128 mục, 7 mốc, 8 câu đố, lời chúc, ghim, đóng góp). Migration `20261019_072421_ui_proto_fields`.
- Kiểm thử: 41/41 E2E (1 ca lời chúc chỉ đỗ khi chạy riêng do giới hạn tần suất dùng chung), 27/27 unit.
