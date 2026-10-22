# Runbook vận hành

## 1. Dựng máy chủ lần đầu (staging hoặc production)

1. Ubuntu 24.04 LTS, 4 vCPU / 8 GB (production ngày thường). Tạo user `deploy`, chỉ cho SSH bằng khóa, tắt đăng nhập root, cài `fail2ban`, `unattended-upgrades`.
2. Tường lửa: `ufw allow 80,443/tcp`; SSH và cổng quản trị chỉ mở qua WireGuard.
3. Cài Docker Engine + compose plugin. Đăng nhập GHCR bằng token chỉ đọc gói (`read:packages`).
4. `git clone` repo vào `/opt/bosss`, tạo `/opt/bosss/.env` từ `.env.example` (quyền 600):
   - `PAYLOAD_SECRET`, `HASH_SECRET`: `openssl rand -base64 48`
   - `POSTGRES_PASSWORD`, và `DATABASE_URL=postgres://bosss:<mật khẩu>@postgres:5432/bosss`
   - `NEXT_PUBLIC_SITE_URL=https://<tên miền>`
   - `BACKUP_AGE_RECIPIENT=<khóa công khai age>` (khóa bí mật giữ ngoại tuyến)
   - `PROXY_SHARED_SECRET=$(openssl rand -hex 32)` — Nginx gắn vào mọi request; thiếu thì ứng dụng không tin IP nào
   - `HEALTH_TOKEN=$(openssl rand -hex 16)` — cho công cụ giám sát xem chi tiết `/api/health`
   - `SMTP_*` khi có thông tin email
5. Sửa tên miền trong `infra/nginx/site.conf`, lấy chứng chỉ: `certbot certonly --webroot -w /var/www/certbot -d <tên miền>` (chạy Nginx tạm cổng 80 lần đầu).
6. Điền mạng được vào trang quản trị trong `infra/nginx/admin-allow.conf` (WireGuard, IP văn phòng trường) rồi `docker compose ... exec nginx nginx -s reload`.
7. `docker compose -f infra/docker-compose.prod.yml --env-file .env up -d postgres redis`
8. `docker compose -f infra/docker-compose.prod.yml --env-file .env run --rm migrate`
9. Tạo Super Admin (lần đăng nhập đầu sẽ bắt buộc đăng ký 2FA tại `/mfa`): `docker compose ... run --rm -e SEED_ADMIN_EMAIL=... -e SEED_ADMIN_PASSWORD=... migrate pnpm seed` (**không** thêm `--demo`).
10. `docker compose ... up -d` rồi kiểm tra `https://<tên miền>/api/health`.

## 2. Triển khai bản mới

GitHub → Actions → **Deploy** → chọn môi trường. Workflow kéo image theo SHA, chạy migration, thay `web1` rồi `web2`, kiểm tra health. **Rollback:** chạy lại Deploy với SHA trước đó (migration phải tương thích ngược).

Đóng băng: từ 16/11 18:00 đến 21/11 chỉ deploy bản sửa lỗi nghiêm trọng.

## 3. Sao lưu và khôi phục

- Service `backup` dump Postgres mỗi giờ (giữ 48 bản), nén media lúc 02:00 (giữ 30 bản), mã hóa bằng `age`.
- Đồng bộ thư mục volume `backups` ra kho S3 của nhà cung cấp khác vùng (cron trên host, ví dụ `rclone sync`).
- Khôi phục (diễn tập 13/11 trên staging):
  ```bash
  age -d -i key.txt bosss-XXXX.dump.age > db.dump
  docker compose ... exec -T postgres pg_restore -U bosss -d bosss --clean --if-exists < db.dump
  ```

## 4. Xác thực hai bước (2FA)

- Mọi tài khoản quản trị bắt buộc 2FA; lần đăng nhập đầu sẽ được chuyển tới `/mfa` để quét mã QR bằng ứng dụng xác thực và **lưu 8 mã khôi phục**.
- Mất điện thoại: dùng một mã khôi phục; hoặc nhờ Quản trị trường / Super Admin mở hồ sơ người đó → tích "Đặt lại 2FA". Không ai tự đặt lại 2FA cho chính mình. Mọi lần đặt lại đều vào Nhật ký thao tác.
- Đổi `HASH_SECRET` sẽ làm **mất toàn bộ bí mật 2FA** (được mã hóa bằng khóa dẫn xuất từ biến này) → mọi người phải đăng ký lại.

## 5. Dọn dữ liệu cá nhân

Service `retention` chạy `pnpm retention` mỗi ngày: xóa IP băm sau 90 ngày, tệp gốc chờ duyệt 30 ngày sau khi bài được xử lý, bài bị từ chối/rút sau 180 ngày. Kết quả mỗi lần chạy ghi vào Nhật ký thao tác (hành động `retention`).

## 6. Công tắc khẩn cấp

| Tình huống | Thao tác |
|---|---|
| Spam hoặc tấn công qua form | Admin → Cấu hình → Đại lễ & công tắc khẩn → bỏ tích "Cho phép khách gửi nội dung" |
| Ứng dụng quá tải | Bật "Chế độ tĩnh" (ẩn phần động) |
| Ứng dụng sập hoặc quá tải nặng | Trên host: `touch infra/nginx/static-fallback/ON` → mọi trang trả về trang tĩnh (link YouTube). Gỡ bằng `rm` |
| Cảnh báo đổi tài khoản quỹ | Khóa tài khoản người đổi, khôi phục giá trị theo Nhật ký thao tác, báo Ban Giám hiệu |

**Trước 19/11:** cập nhật link YouTube trong `infra/nginx/static-fallback/index.html`.

## 7. Kiểm thử tải (S4)

```bash
k6 run -e BASE=https://staging.<tên miền> tests/load/event-day.js
```

Kiểm tra 5.000 kết nối SSE bằng một script Node mở kết nối tới `/api/public/live/stream`, kèm 200 POST/giây vào `/api/public/reactions`.
Trên staging có thể đặt `POW_DISABLED=1` (chỉ có tác dụng khi `NODE_ENV` khác `production`) để đo tải form.

## 8. Lưu ý bảo mật vận hành

- Ứng dụng chỉ tin `X-Real-IP` khi kèm `X-Proxy-Auth` đúng `PROXY_SHARED_SECRET`. Dù vậy vẫn **chỉ Nginx được mở cổng ra ngoài**; không publish cổng 3000 của `web*`.
- Nhật ký thao tác được Postgres chặn sửa/xóa bằng trigger; muốn lưu trữ lâu dài thì xuất CSV định kỳ, không xóa bảng.
- Hai biến `PAYLOAD_SECRET` và `HASH_SECRET` không được đổi tùy tiện: đổi `PAYLOAD_SECRET` sẽ đăng xuất mọi người; đổi `HASH_SECRET` làm mất liên kết chống trùng và token xem trạng thái của người gửi.

## 9. Giám sát (Uptime Kuma)

1. Truy cập qua đường hầm SSH: `ssh -L 3001:127.0.0.1:3001 deploy@<vps>`, rồi mở http://localhost:3001 và tạo tài khoản quản trị (bật 2FA).
2. Thêm các monitor kiểm tra mỗi 30 giây:
   - `https://<tên miền>/` (từ khóa: "Phòng truyền thống")
   - `https://<tên miền>/dai-le`
   - `https://<tên miền>/api/health` (header `X-Health-Token`, chuỗi kỳ vọng `"db":"ok"`)
   - TCP 443
3. Kênh cảnh báo: Telegram nhóm trực THD và email Ban Giám hiệu. Trong tuần lễ (17–21/11) bật nhắc lại mỗi 5 phút.

## 10. Nhập tư liệu từ Excel

```bash
pnpm excel:template                                         # tạo docs/Mau_thu_thap_tu_lieu.xlsx gửi nhà trường
pnpm excel:import tu-lieu.xlsx --anh ./anh                  # CHẠY THỬ: báo lỗi từng dòng, không ghi gì
pnpm excel:import tu-lieu.xlsx --anh ./anh --ghi            # nhập dưới dạng BẢN NHÁP
pnpm excel:import tu-lieu.xlsx --anh ./anh --ghi --xuat-ban # nhập và xuất bản luôn (chỉ khi trường đã duyệt nội dung)
```

Trên production chạy trong image `tools` (mount thư mục tư liệu vào `/import`). Chạy lại nhiều lần an toàn: mục trùng tên trong cùng khu được cập nhật, ảnh trùng tên tệp không bị tải lại.
