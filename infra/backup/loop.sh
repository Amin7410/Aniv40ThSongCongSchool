#!/bin/sh
# Sao lưu Postgres mỗi giờ (giữ 48 bản) + media hằng ngày (giữ 30 bản), mã hóa bằng age nếu có khóa công khai.
# Đồng bộ ra kho ngoài (S3 của nhà cung cấp VN khác vùng) bằng job riêng: xem docs/RUNBOOK.md.
set -eu
apk add --no-cache age >/dev/null 2>&1 || true
mkdir -p /backups/db /backups/media
while true; do
  TS=$(date -u +%Y%m%dT%H%M%SZ)
  OUT=/backups/db/bosss-$TS.dump
  if pg_dump -Fc -f "$OUT"; then
    if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then age -r "$BACKUP_AGE_RECIPIENT" -o "$OUT.age" "$OUT" && rm -f "$OUT"; fi
    echo "[backup] db ok $TS"
  else
    echo "[backup] db FAILED $TS" >&2
  fi
  ls -1t /backups/db/* 2>/dev/null | tail -n +49 | xargs -r rm -f
  if [ "$(date -u +%H)" = "19" ]; then # 02:00 giờ VN
    M=/backups/media/media-$TS.tar.gz
    tar -czf "$M" -C /data media && { [ -n "${BACKUP_AGE_RECIPIENT:-}" ] && age -r "$BACKUP_AGE_RECIPIENT" -o "$M.age" "$M" && rm -f "$M" || true; }
    ls -1t /backups/media/* 2>/dev/null | tail -n +31 | xargs -r rm -f
  fi
  sleep 3600
done
