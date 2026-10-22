'use client'

/** Giải thử thách proof-of-work trong trình duyệt (khoảng 1 giây), không cần cookie hay dịch vụ ngoài. */
export async function solvePow(): Promise<string> {
  const r = await fetch('/api/public/pow', { cache: 'no-store' })
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'Không lấy được mã xác minh.')
  const c = (await r.json()) as { salt: string; challenge: string; max: number; signature: string }
  const enc = new TextEncoder()
  for (let n = 0; n <= c.max; n++) {
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(c.salt + n))
    let hex = ''
    for (const b of new Uint8Array(buf)) hex += b.toString(16).padStart(2, '0')
    if (hex === c.challenge) return JSON.stringify({ ...c, number: n })
    if (n % 2000 === 0) await new Promise((res) => setTimeout(res, 0)) // nhường luồng giao diện
  }
  throw new Error('Không xác minh được, hãy thử lại.')
}

/** Nén ảnh trước khi gửi (tiết kiệm 3G/4G); HEIC từ iPhone được chuyển sang JPEG nếu trình duyệt đọc được. */
export async function shrinkImage(file: File, max = 2560): Promise<Blob> {
  if (!/^image\//.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) throw new Error('Chỉ nhận tệp ảnh.')
  try {
    const bmp = await createImageBitmap(file)
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * s)
    c.height = Math.round(bmp.height * s)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const b = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.88))
    if (b) return b
  } catch {
    /* trình duyệt không đọc được (vd. HEIC trên Android) */
  }
  if (/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  throw new Error('Trình duyệt không đọc được ảnh này. Hãy chọn ảnh JPG hoặc PNG.')
}
