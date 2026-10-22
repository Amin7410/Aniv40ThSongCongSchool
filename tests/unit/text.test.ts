import { describe, expect, it } from 'vitest'
import { findFlags, generationOf, norm, spamSignals } from '@/lib/text'

describe('norm', () => {
  it('bỏ dấu tiếng Việt và đ', () => expect(norm('Trần Đình LÂM')).toBe('tran dinh lam'))
})

describe('findFlags', () => {
  it('bắt từ ngữ và cụm từ', () => expect(findFlags('Trường này dở ẹc, toàn LỪA ĐẢO')).toEqual(expect.arrayContaining(['do ec', 'lua dao'])))
  it('không báo nhầm từ đồng âm sau bỏ dấu', () => {
    expect(findFlags('Nhớ giấc ngủ trưa, đội ngũ thầy cô')).toEqual([])
    expect(findFlags('Cô đeo kính, đi học sớm')).toEqual([])
  })
  it('không khớp một phần của từ khác', () => expect(findFlags('Nguyễn Văn Ngư, cutting edge')).toEqual([]))
  it('khớp từ thật', () => expect(findFlags('đồ ngu')).toEqual(['ngu']))
})

describe('spamSignals', () => {
  it('nhiều link', () => expect(spamSignals('xem http://a.vn và www.b.com')).toContain('nhieu-link'))
  it('ký tự lặp', () => expect(spamSignals('aaaaaaaaaaaa')).toContain('ky-tu-lap'))
})

describe('generationOf', () => {
  it('theo khóa học', () => {
    expect(generationOf('Khóa 1990 – 1993')).toBe('1986-1995')
    expect(generationOf(2008)).toBe('2006-2015')
    expect(generationOf('Lớp 12A1')).toBeNull()
  })
})
