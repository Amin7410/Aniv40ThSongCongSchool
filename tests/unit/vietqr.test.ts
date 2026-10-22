import { describe, expect, it } from 'vitest'
import { asciiNote, buildVietQR, crc16 } from '@/lib/vietqr'

describe('crc16 CCITT-FALSE', () => {
  it('vector chuẩn "123456789" = 29B1', () => expect(crc16('123456789')).toBe('29B1'))
})

describe('buildVietQR', () => {
  it('đúng cấu trúc EMVCo và CRC', () => {
    const s = buildVietQR({ bankBin: '970415', accountNo: '113366668888', note: 'QHB40 Nguyễn Văn A' })
    expect(s.startsWith('000201010211')).toBe(true)
    expect(s).toContain('0010A000000727')
    expect(s).toContain('0006970415')
    expect(s).toContain('0112113366668888')
    expect(s).toContain('5303704')
    expect(s).toContain('5802VN')
    expect(s).toContain('QHB40 Nguyen Van A')
    expect(crc16(s.slice(0, -4))).toBe(s.slice(-4))
  })
  it('QR có số tiền là QR động (12)', () => expect(buildVietQR({ bankBin: '970415', accountNo: '1234', amount: 50000 })).toContain('010212'))
  it('từ chối BIN/STK sai', () => {
    expect(() => buildVietQR({ bankBin: '97', accountNo: '1234' })).toThrow()
    expect(() => buildVietQR({ bankBin: '970415', accountNo: '12;DROP' })).toThrow()
  })
  it('asciiNote', () => expect(asciiNote('Đặng Thị Ánh – K.1990')).toBe('Dang Thi Anh K 1990'))
})
