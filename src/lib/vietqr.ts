/**
 * Sinh chuỗi VietQR (chuẩn EMVCo Merchant-Presented QR của NAPAS) từ thông tin tài khoản.
 * Mã QR luôn được dựng ở server từ STK đã được duyệt, không nhận ảnh QR tải lên.
 */

function tlv(id: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf8')
  if (len > 99) throw new Error(`Trường ${id} quá dài`)
  return id + String(len).padStart(2, '0') + value
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF). */
export function crc16(input: string): string {
  let crc = 0xffff
  for (const byte of Buffer.from(input, 'utf8')) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Bỏ dấu và ký tự đặc biệt cho nội dung chuyển khoản (ngân hàng thường chỉ nhận ASCII). */
export function asciiNote(s: string, max = 50): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export interface VietQRInput {
  bankBin: string // mã BIN 6 số của ngân hàng (NAPAS)
  accountNo: string
  amount?: number
  note?: string
}

export function buildVietQR({ bankBin, accountNo, amount, note }: VietQRInput): string {
  if (!/^\d{6}$/.test(bankBin)) throw new Error('Mã BIN ngân hàng phải gồm 6 chữ số')
  if (!/^[0-9A-Za-z]{4,19}$/.test(accountNo)) throw new Error('Số tài khoản không hợp lệ')
  const beneficiary = tlv('00', bankBin) + tlv('01', accountNo)
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA')
  let body =
    tlv('00', '01') +
    tlv('01', amount ? '12' : '11') +
    tlv('38', merchant) +
    tlv('53', '704') +
    (amount ? tlv('54', String(Math.round(amount))) : '') +
    tlv('58', 'VN')
  if (note) body += tlv('62', tlv('08', asciiNote(note)))
  body += '6304'
  return body + crc16(body)
}
