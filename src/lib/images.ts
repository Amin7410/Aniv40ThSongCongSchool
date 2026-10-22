import sharp from 'sharp'

/** Nhận diện định dạng theo magic bytes, không tin Content-Type / phần mở rộng do client gửi. */
export function sniff(buf: Buffer): 'jpeg' | 'png' | 'webp' | 'heic' | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buf.toString('ascii', 4, 8) === 'ftyp' && /^(heic|heix|mif1|msf1)/.test(buf.toString('ascii', 8, 12))) return 'heic'
  return null
}

/**
 * Nén lại ảnh người dùng gửi: xoay theo EXIF rồi loại bỏ TOÀN BỘ metadata (kể cả GPS),
 * giới hạn kích thước, xuất JPEG. Việc giải mã + mã hóa lại cũng loại payload ẩn (polyglot).
 */
export async function sanitizeImage(buf: Buffer): Promise<Buffer> {
  return sharp(buf, { limitInputPixels: 50_000_000, failOn: 'error' })
    .rotate()
    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
}
